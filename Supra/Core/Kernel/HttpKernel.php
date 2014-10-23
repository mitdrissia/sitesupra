<?php

namespace Supra\Core\Kernel;

use Supra\Core\DependencyInjection\ContainerAware;
use Supra\Core\DependencyInjection\ContainerInterface;
use Supra\Core\Event\ControllerEvent;
use Supra\Core\Event\KernelEvent;
use Supra\Core\Event\RequestResponseEvent;
use Symfony\Component\HttpFoundation\ParameterBag;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Exception\ResourceNotFoundException;

class HttpKernel implements ContainerAware
{
	/**
	 * @var ContainerInterface
	 */
	protected $container;

	public function setContainer(ContainerInterface $container)
	{
		$this->container = $container;
	}

	public function handle(Request $request)
	{
		try {

			$requestEvent = new RequestResponseEvent();
			$requestEvent->setRequest($request);

			$this->container->getEventDispatcher()->dispatch(KernelEvent::REQUEST, $requestEvent);
			//here event can be overridden by any listener, so check if we have event

			if ($requestEvent->hasResponse()) {
				return $requestEvent->getResponse();
			}

			if ($request->attributes->has('_controller') && $request->attributes->has('_action')) {
				$controllerName = $request->attributes->get('_controller');
				$action = $request->attributes->get('_action');

				$controllerObject = new $controllerName();
				$controllerObject->setContainer($this->container);

				$response = $controllerObject->$action($request);
			} else {
				$router = $this->container->getRouter();
				$configuration = $router->match($request);

				//@todo: recall correctly how symfony deals with that
				$request->attributes = new ParameterBag($configuration);

				//@todo: do not execute controller that ugly
				$controllerDefinition = $this->container->getApplication()->parseControllerName($configuration['controller']);

				//probably there should be a better implementation of a package setting
				$controllerObject = new $controllerDefinition['controller']();
				$controllerObject->setContainer($this->container);

				$action = $controllerDefinition['action'];

				$controllerEvent = new ControllerEvent();
				$controllerEvent->setController($controllerObject);
				$controllerEvent->setAction($action);

				$this->container->getEventDispatcher()->dispatch(KernelEvent::CONTROLLER_START, $controllerEvent);

				$response = $controllerObject->$action($request);

				$controllerEvent->setResponse($response);

				$this->container->getEventDispatcher()->dispatch(KernelEvent::CONTROLLER_END, $controllerEvent);

				$response = $controllerEvent->getResponse();
			}

			$responseEvent = new RequestResponseEvent();
			$responseEvent->setRequest($request);
			$responseEvent->setResponse($response);

			$this->container->getEventDispatcher()->dispatch(KernelEvent::RESPONSE, $responseEvent);

			if (!$response instanceof Response) {
				throw new \Exception('Response returned by your controller is not an instance of HttpFoundation\Response');
			}

			return $response;
		} catch(\Exception $e) {
			//generic exception handler
			$exceptionEvent = new RequestResponseEvent();

			$this->container->getEventDispatcher()->dispatch(KernelEvent::EXCEPTION, $exceptionEvent);

			if ($exceptionEvent->hasResponse()) {
				$this->container->getEventDispatcher()->dispatch(KernelEvent::RESPONSE, $exceptionEvent);

				return $exceptionEvent->getResponse();
			}

			//process 404 exceptions
			if ($e instanceof ResourceNotFoundException) {
				$notFoundEvent = new RequestResponseEvent();
				$notFoundEvent->setRequest($request);
				$this->container->getEventDispatcher()->dispatch(KernelEvent::ERROR404, $notFoundEvent);

				if($notFoundEvent->hasResponse()) {
					$this->container->getEventDispatcher()->dispatch(KernelEvent::RESPONSE, $notFoundEvent);

					return $notFoundEvent->getResponse();
				}

				if ($this->container->getParameter('debug')) {
					//in debug env 404 errors are just thrown
					throw $e;
				} else {
					return $this->container['exception.controller']->exception404Action($e);
				}
			}

			//process all other exceptions
			if ($this->container->getParameter('debug')) {
				throw $e;
			} else {
				return $this->container['exception.controller']->exception500Action($e);
			}
		}
	}
}
