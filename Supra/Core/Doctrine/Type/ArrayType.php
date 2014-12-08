<?php

namespace Supra\Core\Doctrine\Type;

use Doctrine\DBAL\Types\ConversionException;

class ArrayType extends \Doctrine\DBAL\Types\ArrayType
{
	public function convertToPHPValue($value, \Doctrine\DBAL\Platforms\AbstractPlatform $platform)
	{
		if ($value === '' || $value === null) {
			$value = 'a:0:{}';
		}

		return parent::convertToPHPValue($value, $platform); // TODO: Change the autogenerated stub
	}
}