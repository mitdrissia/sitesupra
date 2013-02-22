<?php

namespace Supra\Editable;

use Supra\Controller\Pages\Entity\ReferencedElement;

/**
 * Image editable
 */
class InlineMedia extends EditableAbstraction
{
	const EDITOR_TYPE = 'InlineMedia';
	const EDITOR_INLINE_EDITABLE = true;
	
	/**
	 * Return editor type
	 * @return string
	 */
	public function getEditorType()
	{
		return static::EDITOR_TYPE;
	}
	
	/**
	 * {@inheritdoc}
	 * @return boolean
	 */
	public function isInlineEditable()
	{
		return static::EDITOR_INLINE_EDITABLE;
	}
	
	/**
	 * 
	 * @param type $content
	 */
	public function setContent($content)
	{
		if (is_array($content) && isset($content['type'])) {
			$this->contentMetadata = ReferencedElement\ReferencedElementAbstract::fromArray($content);
		}
	}
	
	/**
	 * @param mixed $content
	 */
	public function setContentFromEdit($content)
	{
		$mediaElement = null;
		
		if ( ! empty($content)) {
			
			$type = isset($content['type']) ? $content['type'] : null;
			
			switch ($type) {
				case ReferencedElement\ImageReferencedElement::TYPE_ID:
					$mediaElement = new ReferencedElement\ImageReferencedElement;
					$mediaElement->fillArray($content);
					break;

				case ReferencedElement\VideoReferencedElement::TYPE_ID:
					$mediaElement = new ReferencedElement\VideoReferencedElement;
					$videoData = ReferencedElement\VideoReferencedElement::parseVideoSourceInput($content['source']);

					if ($videoData === false) {
						throw new Exception\RuntimeException("Video link/source you provided is invalid or this video service is not supported. Sorry about that.");
					}
					
					$videoData = $videoData + $content;
					$mediaElement->fillArray($videoData);
					
					break;

				default: 
					throw new Exception\RuntimeException("Unknown media type {$type} received");
			}
		}
		
		$this->contentMetadata = $mediaElement;
	}
	
	/**
	 * @return array|null
	 */
	public function getContentForEdit()
	{
		if ($this->contentMetadata instanceof ReferencedElement\ReferencedElementAbstract) {
			
			$data = $this->contentMetadata->toArray();

			if ($this->contentMetadata instanceof ReferencedElement\ImageReferencedElement) {

				$imageId = $this->contentMetadata->getImageId();

				$storage = \Supra\ObjectRepository\ObjectRepository::getFileStorage($this);
				$image = $storage->find($imageId, \Supra\FileStorage\Entity\Image::CN());

				if (is_null($image)) {
					\Log::notice("Failed to find image #{$imageId} for referenced element");
					return $data;
				}

				$data['image'] = $storage->getFileInfo($image);
			}
			
			return $data;
		}
		
		return $this->contentMetadata;
	}
}
