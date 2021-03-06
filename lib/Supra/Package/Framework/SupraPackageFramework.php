<?php

/*
 * Copyright (C) SiteSupra SIA, Riga, Latvia, 2015
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 */

namespace Supra\Package\Framework;

use Assetic\AssetWriter;
use Assetic\Extension\Twig\AsseticExtension;
use Assetic\Factory\AssetFactory;
use Assetic\Filter\CssRewriteFilter;
use Assetic\Filter\LessphpFilter;
use Assetic\FilterManager;
use Doctrine\Common\EventManager;
use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Driver\PDOMySql;
use Doctrine\DBAL\Logging\LoggerChain;
use Doctrine\DBAL\Types\Type;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\Tools\Setup;
use SimpleThings\EntityAudit\AuditConfiguration;
use SimpleThings\EntityAudit\AuditManager;
use Supra\Core\DependencyInjection\ContainerInterface;
use Supra\Core\Doctrine\ManagerRegistry;
use Supra\Core\Event\KernelEvent;
use Supra\Core\Locale\Locale;
use Supra\Core\Locale\LocaleManager;
use Supra\Core\Package\AbstractSupraPackage;
use Supra\Core\Locale\Listener\LocaleDetectorListener;
use Supra\Package\Cms\Twig\CmsExtension;
use Supra\Package\CmsAuthentication\Controller\AuthController;
use Supra\Package\Framework\Command\AssetsPublishCommand;
use Supra\Package\Framework\Command\CacheClearCommand;
use Supra\Package\Framework\Command\CacheListCommand;
use Supra\Package\Framework\Command\ContainerDumpCommand;
use Supra\Package\Framework\Command\ContainerPackagesListCommand;
use Supra\Package\Framework\Command\DoctrineCacheClearMetadataCommand;
use Supra\Package\Framework\Command\DoctrineCacheClearQueryCommand;
use Supra\Package\Framework\Command\DoctrineCacheClearResultCommand;
use Supra\Package\Framework\Command\DoctrineConvertEncodingsCommand;
use Supra\Package\Framework\Command\DoctrineGenerateProxiesCommand;
use Supra\Package\Framework\Command\DoctrineSchemaCreateCommand;
use Supra\Package\Framework\Command\DoctrineSchemaDropCommand;
use Supra\Package\Framework\Command\DoctrineSchemaUpdateCommand;
use Supra\Package\Framework\Command\RoutingListCommand;
use Supra\Package\Framework\Command\SupraBootstrapCommand;
use Supra\Package\Framework\Command\SupraShellCommand;
use Supra\Package\Framework\Command\ValidateNestedSetCommand;
use Supra\Package\Framework\Listener\NotFoundAssetExceptionListener;
use Supra\Package\Framework\Twig\FrameworkExtension;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Security\Http\SecurityEvents;

class SupraPackageFramework extends AbstractSupraPackage
{
	public function inject(ContainerInterface $container)
	{
		$this->loadConfiguration($container);

		//register commands
		$container->getConsole()->add(new ContainerDumpCommand());
		$container->getConsole()->add(new ContainerPackagesListCommand());
		$container->getConsole()->add(new RoutingListCommand());
		$container->getConsole()->add(new SupraShellCommand());
		$container->getConsole()->add(new AssetsPublishCommand());
		$container->getConsole()->add(new DoctrineSchemaUpdateCommand());
		$container->getConsole()->add(new DoctrineSchemaDropCommand());
		$container->getConsole()->add(new DoctrineSchemaCreateCommand());
		$container->getConsole()->add(new DoctrineGenerateProxiesCommand());
		$container->getConsole()->add(new DoctrineCacheClearMetadataCommand());
		$container->getConsole()->add(new DoctrineCacheClearQueryCommand());
		$container->getConsole()->add(new DoctrineCacheClearResultCommand());
		$container->getConsole()->add(new CacheListCommand());
		$container->getConsole()->add(new CacheClearCommand());
		$container->getConsole()->add(new SupraBootstrapCommand());
		$container->getConsole()->add(new DoctrineConvertEncodingsCommand());
		$container->getConsole()->add(new ValidateNestedSetCommand());

		//include supra helpers
		$cmsExtension = new CmsExtension();
		$cmsExtension->setContainer($container);
		$container->getTemplating()->addExtension($cmsExtension);

		$container[$this->name.'.twig_extension'] = function () {
			return new FrameworkExtension();
		};

		$container->getTemplating()->addExtension($container[$this->name.'.twig_extension']);

		//routing
		$container->getRouter()->loadConfiguration(
			$container->getApplication()->locateConfigFile($this, 'routes.yml')
		);

		//404 listener for less/css files and on-the-fly compilation
		$container[$this->name.'.not_found_asset_exception_listener'] = function () {
			return new NotFoundAssetExceptionListener();
		};

		$container->getEventDispatcher()->addListener(
			KernelEvent::ERROR404,
			array($container[$this->name.'.not_found_asset_exception_listener'], 'listen')
		);

		// Locale detection
		$container[$this->name.'.locale_detector_listener'] = function () {
			return new LocaleDetectorListener();
		};

		$container->getEventDispatcher()->addListener(
		// @FIXME: subscribe to controller pre-execute event instead.
			KernelEvent::REQUEST,
			array($container[$this->name.'.locale_detector_listener'], 'listen')
		);

		//prepare logger to use with other bundles
		if ($container->getParameter('debug')) {
			$container['doctrine.logger'] = function (ContainerInterface $container) {
				$logger = new LoggerChain();

				return $logger;
			};
		}

//		// Setting up Assetic Twig extension
//
//		$filterManager = new FilterManager();
//		$filterManager->set('less', new LessphpFilter());
//		$filterManager->set('cssrewrite', new CssRewriteFilter());
//
//		$assetFactory = new AssetFactory($container->getApplication()->getWebRoot());
//		$assetFactory->setFilterManager($filterManager);
//
//		$writer = new AssetWriter('/path/to/web');
//		$writer->writeManagerAssets($am);
//
//		$container->getTemplating()->addExtension(new AsseticExtension($assetFactory));
	}

	public function finish(ContainerInterface $container)
	{
		//finishing locales
		$container->extend('locale.manager', function (LocaleManager $localeManager, ContainerInterface $container) {
			$locales = $container->getParameter('framework.locales');
			foreach ($locales['locales'] as $id => $locale) {
				$localeObject = new Locale();
				$localeObject->setId($id);
				$localeObject->setTitle($locale['title']);
				$localeObject->setActive($locale['active']);
				$localeObject->setCountry($locale['country']);
				$localeObject->setProperties($locale['properties']);

				$localeManager->addLocale($localeObject);
			}

			foreach ($locales['detectors'] as $detector) {
				$localeManager->addDetector($container[$detector]);
			}

			foreach ($locales['storage'] as $storage) {
				$localeManager->addStorage($container[$storage]);
			}

			$localeManager->setCurrent($locales['current']);

			return $localeManager;
		});

		//entity audit
		$container['entity_audit.configuration'] = function (ContainerInterface $container) {
			$config = $container->getParameter('framework.doctrine_audit');

			$configuration = new AuditConfiguration();
			$configuration->setAuditedEntityClasses($config['entities']);
			$configuration->setGlobalIgnoreColumns($config['ignore_columns']);
			$configuration->setRevisionTableName('su_' . $configuration->getRevisionTableName());

			$container->getEventDispatcher()->addListener(AuthController::TOKEN_CHANGE_EVENT, function () use ($container, $configuration) {
				$context = $container->getSecurityContext();

				if ($context->getToken() &&
					$context->getToken()->getUser()
				) {
					$configuration->setCurrentUsername($context->getToken()->getUser()->getUsername());
				}
			});

			if (!$configuration->getCurrentUsername()) {
				$configuration->setCurrentUsername('anonymous');
			}

			return $configuration;
		};

		$container['entity_audit.manager'] = function (ContainerInterface $container) {
			$config = $container['entity_audit.configuration'];

			return new AuditManager($config);
		};

		//finishing doctrine
		$doctrineConfig = $container->getParameter('framework.doctrine');

		//let's believe that types are needed always
		foreach ($doctrineConfig['types'] as $definition) {
			list($name, $class) = $definition;
			Type::addType($name, $class);
		}

		foreach ($doctrineConfig['type_overrides'] as $definition) {
			list($name, $class) = $definition;
			Type::overrideType($name, $class);
		}

		foreach ($doctrineConfig['event_managers'] as $name => $managerDefinition) {
			$container['doctrine.event_managers.'.$name] = function (ContainerInterface $container) use ($managerDefinition) {
				$manager = new EventManager();

				foreach ($managerDefinition['subscribers'] as $id) {
					$manager->addEventSubscriber($container[$id]);
				}

				$container['entity_audit.manager']->registerEvents($manager);

				return $manager;
			};
		}

		$application = $container->getApplication();

		foreach ($doctrineConfig['configurations'] as $name => $configurationDefinition) {

			$container['doctrine.configurations.'.$name] = function (ContainerInterface $container) use ($configurationDefinition, $application) {
				//loading package directories
				$packages = $application->getPackages();

				$paths = array();

				foreach ($packages as $package) {
					$entityDir = $application->locatePackageRoot($package) . DIRECTORY_SEPARATOR . 'Entity';

					if (is_dir($entityDir)) {
						$paths[] = $entityDir;
					}
				}

				$configuration = Setup::createAnnotationMetadataConfiguration($paths,
					$container->getParameter('debug'),
					$container->getParameter('directories.cache') . DIRECTORY_SEPARATOR . 'doctrine'
				);

				if ($container->getParameter('debug')) {
					$logger = $container['logger.doctrine'];

					$container['doctrine.logger']->addLogger($logger);

					$configuration->setSQLLogger($container['doctrine.logger']);
				}

				//Foo:Bar -> \FooPackage\Entity\Bar aliases
				foreach ($packages as $package) {
					$class = get_class($package);
					$namespace = substr($class, 0, strrpos($class, '\\')) . '\\Entity';
					$configuration->addEntityNamespace($application->resolveName($package), $namespace);
				}

				return $configuration;
			};
		}

		foreach ($doctrineConfig['connections'] as $name => $connectionDefinition) {
			$container['doctrine.connections.'.$name] = function (ContainerInterface $container) use ($connectionDefinition) {
				if ($connectionDefinition['driver'] != 'mysql') {
					throw new \Exception('No driver is supported currently but mysql');
				}

				$connection = new Connection(
					array(
						'host' => $connectionDefinition['host'],
						'user' => $connectionDefinition['user'],
						'password' => $connectionDefinition['password'],
						'dbname' => $connectionDefinition['dbname'],
						'charset' => $connectionDefinition['charset']
					),
					new PDOMySql\Driver(),
					$container['doctrine.configurations.'.$connectionDefinition['configuration']],
					$container['doctrine.event_managers.'.$connectionDefinition['event_manager']]
				);

				return $connection;
			};
		}

		foreach ($doctrineConfig['entity_managers'] as $name => $entityManagerDefinition) {
			$container['doctrine.entity_managers.'.$name] = function (ContainerInterface $container) use ($name, $entityManagerDefinition, $doctrineConfig) {

				$ormConfigurationName = $entityManagerDefinition['configuration'];
				$ormConfiguration = $container['doctrine.configurations.' . $ormConfigurationName];

				$em = EntityManager::create(
					$container['doctrine.connections.'.$entityManagerDefinition['connection']],
					$ormConfiguration,
					$container['doctrine.event_managers.'.$entityManagerDefinition['event_manager']]
				);

				// @DEV, remove
				$em->name = $name;

				foreach ($doctrineConfig['configurations'][$ormConfigurationName]['hydrators'] as $hydratorDefinition) {

					list($name, $class) = $hydratorDefinition;

					$reflection = new \ReflectionClass($class);

					$hydrator = $reflection->newInstanceArgs(array($em));

					$ormConfiguration->addCustomHydrationMode($name, $hydrator);
				}

				return $em;
			};
		}

		$container['doctrine.doctrine'] = function (ContainerInterface $container) use ($doctrineConfig) {
			$connections = array();

			foreach (array_keys($doctrineConfig['connections']) as $name) {
				$connections[$name] = 'doctrine.connections.'.$name;
			}

			$managers = array();

			foreach (array_keys($doctrineConfig['entity_managers']) as $name) {
				$managers[$name] = 'doctrine.entity_managers.'.$name;
			}

			//todo: make default em/con configurable
			return new ManagerRegistry(
				'supra.doctrine',
				$connections,
				$managers,
				$doctrineConfig['default_connection'],
				$doctrineConfig['default_entity_manager'],
				'Doctrine\ORM\Proxy\Proxy'
			);
		};

		//sessions and HttpFoundation
		$sessionConfig = $container->getParameter('framework.session');

		$container['http.session'] = function (ContainerInterface $container) use ($sessionConfig) {
			if (PHP_SAPI == 'cli') {
				throw new \Exception('Sessions are not possible in CLI mode');
			}

			$storage = $container[$sessionConfig['storage']];

			$session = new Session($storage);

			$session->start();

			$container['http.request']->setSession($session);

			return $session;
		};

		//mailers
		$mailerConfig = $container->getParameter('framework.swiftmailer');

		$container->setParameter('mailer.mailers', array_map(function ($value) { return 'mailer.mailers.'.$value; }, array_keys($mailerConfig['mailers'])));

		foreach ($mailerConfig['mailers'] as $id => $configurationDefinition) {
			$container['mailer.mailers.'.$id] = function (ContainerInterface $container) use ($configurationDefinition) {

				switch ($configurationDefinition['transport']) {
					case 'smtp':
						$transport = \Swift_SmtpTransport::newInstance($configurationDefinition['params']['host'], $configurationDefinition['params']['port']);
						$transport->setUsername($configurationDefinition['params']['username']);
						$transport->setPassword($configurationDefinition['params']['password']);
						break;

					case 'mail':
						$transport = \Swift_MailTransport::newInstance();

						if (isset($transport['params']['extra_params'])) {
							$transport->setExtraParams($transport['params']['extra_params']);
						}

						break;

					case 'sendmail':
						$transport = \Swift_SendmailTransport::newInstance();

						if (isset($configurationDefinition['params']['command'])) {
							$transport->setCommand($configurationDefinition['params']['command']);
						}

						break;

					case 'null':
						$transport = \Swift_NullTransport::newInstance();
						break;

					default:
						throw new \Exception(sprintf(
							'Unknown mail transport [%s].', $configurationDefinition['transport']
						));
				}

				return \Swift_Mailer::newInstance($transport);
			};
		}

		$container['mailer.mailer'] = function (ContainerInterface $container) use ($mailerConfig) {
			return $container['mailer.mailers.'.$mailerConfig['default']];
		};
	}
}
