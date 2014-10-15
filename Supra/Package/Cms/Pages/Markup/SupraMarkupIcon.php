<?php

namespace Supra\Package\Cms\Pages\Markup;

class SupraMarkupIcon extends Abstraction\SupraMarkupItem
{
	const SIGNATURE = 'supra.icon';

	/**
	 * @var string
	 */
	protected $id;

	function __construct()
	{
		$this->signature = self::SIGNATURE;
	}

	public function parseSource()
	{
		$this->id = $this->extractValueFromSource('id');
	}

	/**
	 * @param string $id 
	 */
	public function setId($id)
	{
		$this->id = $id;
	}

	/**
	 * @return string
	 */
	public function getId()
	{
		return $this->id;
	}

}
