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

namespace Supra\Package\DebugBar;

use DebugBar\Bridge\DoctrineCollector;
//use DebugBar\Bridge\SwiftMailer\SwiftLogCollector;
use DebugBar\Bridge\SwiftMailer\SwiftMailCollector;
use DebugBar\StandardDebugBar;
use Doctrine\DBAL\Logging\DebugStack;
use Supra\Core\DependencyInjection\ContainerInterface;
use Supra\Core\Event\KernelEvent;
use Supra\Core\Package\AbstractSupraPackage;
use Supra\Package\DebugBar\Collector\EventCollector;
use Supra\Package\DebugBar\Collector\MonologCollector;
use Supra\Package\DebugBar\Collector\SessionCollector;
use Supra\Package\DebugBar\Collector\TimelineCollector;
use Supra\Package\DebugBar\Event\Listener\AssetsPublishEventListener;
use Supra\Package\DebugBar\Event\Listener\DebugBarResponseListener;
use Supra\Package\Framework\Event\FrameworkConsoleEvent;

class SupraPackageDebugBar extends AbstractSupraPackage
{
	public function inject(ContainerInterface $container)
	{
		if (!$container->getParameter('debug')) {
			return;
		}

		$container[$this->name.'.session_collector'] = function () {
			return new SessionCollector();
		};

		$container[$this->name.'.timeline_collector'] = function () {
			return new TimelineCollector();
		};

		$container[$this->name.'.event_collector'] = function () {
			return new EventCollector();
		};

		$container[$this->name.'.monolog_collector'] = function (ContainerInterface $container) {
			return new MonologCollector($container->getLogger());
		};

		$container[$this->name.'.doctrine_collector'] = function (ContainerInterface $container) {
			$debugStack = new DebugStack();

			$container['doctrine.logger']->addLogger($debugStack);

			return new DoctrineCollector($debugStack);
		};

		$container[$this->name.'.debug_bar'] = function ($container) {
			$debugBar = new StandardDebugBar();

			$debugBar->addCollector($container[$this->name.'.session_collector']);
			$debugBar->addCollector($container[$this->name.'.doctrine_collector']);
			$debugBar->addCollector($container[$this->name.'.event_collector']);
			$debugBar->addCollector($container[$this->name.'.monolog_collector']);

			return $debugBar;
		};

		$container[$this->name.'.response_listener'] = new DebugBarResponseListener();
		$container[$this->name.'.assets_listener'] = new AssetsPublishEventListener();

		$container->getEventDispatcher()
			->addListener(KernelEvent::RESPONSE, array($container[$this->name.'.response_listener'], 'listen'));

		$container->getEventDispatcher()
			->addListener(FrameworkConsoleEvent::ASSETS_PUBLISH, array($container[$this->name.'.assets_listener'], 'listen'));

		//timeline collector binds to many events at once
		$container->getEventDispatcher()
			->addSubscriber($container[$this->name.'.timeline_collector']);
	}

	public function boot()
	{
		if (!$this->container->getParameter('debug')) {
			return;
		}

		//mail collectors
		foreach ($this->container->getParameter('mailer.mailers') as $id) {
			$this->container->extend($id, function ($mailer, $container) {

//				$container['debug_bar.debug_bar']['messages']->aggregate(
//					new SwiftLogCollector($mailer)
//				);

				$container['debug_bar.debug_bar']->addCollector(
					new SwiftMailCollector($mailer)
				);

				return $mailer;
			});
		}

		//instantiate doctrine collector by hand
		$this->container[$this->name.'.doctrine_collector'];
		$this->container[$this->name.'.monolog_collector'];
	}

}