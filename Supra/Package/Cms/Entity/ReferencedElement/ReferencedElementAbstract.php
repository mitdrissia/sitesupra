<?php

namespace Supra\Package\Cms\Entity\ReferencedElement;

use Supra\Package\Cms\Entity\Abstraction\Entity;

/**
 * @Entity
 * @InheritanceType("JOINED")
 * @DiscriminatorColumn(name="discr", type="string")
 * @DiscriminatorMap({
 *		"link" = "LinkReferencedElement", 
 *		"image" = "ImageReferencedElement",
 *		"video" = "VideoReferencedElement",
 * })
 */
abstract class ReferencedElementAbstract extends Entity
{
	/**
	 * Convert object to array
	 * @return array
	 */
	abstract public function toArray();
	
	/**
	 * @param array $array
	 * @return ReferencedElementAbstract
	 */
	public static function fromArray(array $array)
	{
		$element = null;
		
		switch ($array['type']) {
			case LinkReferencedElement::TYPE_ID:
				$element = new LinkReferencedElement();
				break;
			
			case ImageReferencedElement::TYPE_ID:
				$element = new ImageReferencedElement();
				break;
			
			case VideoReferencedElement::TYPE_ID:
				$element = new VideoReferencedElement();
				break;
			
			case IconReferencedElement::TYPE_ID:
				$element = new IconReferencedElement();
				break;
			
			default:
				throw new \RuntimeException("Invalid metadata array: " . print_r($array, 1));
		}
		
		$element->fillArray($array);
		
		return $element;
	}
	
	/**
	 * Set properties from array
	 * @param array $array
	 */
	abstract public function fillArray(array $array);
}
