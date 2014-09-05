<?php

namespace Supra\Core\DependencyInjection;

use Pimple\Container as BaseContainer;
use Supra\Core\DependencyInjection\Exception\ParameterNotFoundException;

class Container extends BaseContainer implements ContainerInterface
{
	/**
	 * @var array
	 */
	protected $parameters;

	public function offsetGet($id)
	{
		$instance = parent::offsetGet($id);

		if ($instance instanceof ContainerAware) {
			$instance->setContainer($this);
		}

		return $instance;
	}

	/**
	 * @return \Supra\Core\Supra
	 */
	public function getApplication()
	{
		return $this['application'];
	}

	/**
	 * Getter for Router instance
	 *
	 * @return \Supra\Core\Routing\Router
	 */
	public function getRouter()
	{
		return $this['routing.router'];
	}

	/**
	 * Getter for CLI app
	 *
	 * @return \Supra\Core\Console\Application
	 */
	public function getConsole()
	{
		return $this['console.application'];
	}

	/**
	 * Getter for event dispatcher
	 *
	 * @return \Symfony\Component\EventDispatcher\EventDispatcherInterface
	 */
	public function getEventDispatcher()
	{
		return $this['event.dispatcher'];
	}

	/**
	 * @return \Symfony\Component\Security\Core\SecurityContext
	 */
	public function getSecurityContext()
	{
		return $this['security.context'];
	}


	/**
	 * Sets parameter
	 *
	 * @param $name
	 * @param $value
	 */
	public function setParameter($name, $value)
	{
		$this->parameters[$name] = $value;
	}

	/**
	 * Gets parameter by name
	 *
	 * @param $name
	 * @throws Exception\ParameterNotFoundException
	 * @return mixed
	 */
	public function getParameter($name)
	{
		if (!isset($this->parameters[$name])) {
			throw new ParameterNotFoundException(sprintf('Parameter "%s" is not defined in the container', $name));
		}

		return $this->parameters[$name];
	}

	/**
	 * Gets names of all parameters defined
	 *
	 * @return array
	 */
	public function getParameters()
	{
		return array_keys($this->parameters);
	}


}

