<?php

namespace Supra\Locale\Storage;

use Supra\Request\RequestInterface;
use Supra\Response\ResponseInterface;
use Supra\Response\HttpResponse;
use Supra\Locale\Exception;
use Supra\Http\Cookie;
use Supra\Log\Log;

/**
 * Stores the current locale in the cookie
 */
class CookieStorage extends StorageAbstraction
{
	/**
	 * Cookie name for the current locale storage
	 * @var string
	 */
	protected $cookieName = 'supra_language';

	/**
	 * Store the detected locale
	 * @param RequestInterface $request
	 * @param ResponseInterface $response
	 * @param string $localeId
	 */
	public function store(RequestInterface $request, ResponseInterface $response, $localeId)
	{
		if ( ! ($response instanceof HttpResponse)) {
			Log::warn("The response must be instance of Http response to use cookie storage");
			//throw new Exception("The response must be instance of Http response to use cookie storage");
		}
		
		$cookie = $this->createCookie($localeId);

		if (empty($cookie)) {
			Log::warn("Cookie not received from createCookie method in cookie locale storage");
		}

		/* @var $response HttpResponse */
		$response->setCookie($cookie);
	}

	/**
	 * Creates cookie object for storing the current locale
	 * @param string $value
	 * @return Cookie
	 */
	protected function createCookie($value)
	{
		$name = $this->cookieName;
		$cookie = new Cookie($name, $value);
		
		return $cookie;
	}
}