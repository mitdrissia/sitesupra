<?php

namespace Supra\Controller\Pages\Entity;

use Supra\Controller\Pages\Exception;
use Supra\Controller\Pages\Entity\Abstraction\Entity;
use Supra\Controller\Pages\Entity\Abstraction\Data;
use Supra\Controller\Pages\Entity\Abstraction\Block;
use Supra\Editable\EditableInterface;
use Doctrine\Common\Collections;

/**
 * Block property class.
 * @Entity
 * @Table(name="block_property")
 */
class BlockProperty extends Entity
{
	/**
	 * @ManyToOne(targetEntity="Supra\Controller\Pages\Entity\Abstraction\Data")
	 * @JoinColumn(name="data_id", referencedColumnName="id", nullable=false)
	 * @var Data
	 */
	protected $data;

	/**
	 * @ManyToOne(targetEntity="Supra\Controller\Pages\Entity\Abstraction\Block", inversedBy="blockProperties", cascade={"persist"})
	 * @JoinColumn(name="block_id", referencedColumnName="id", nullable=false)
	 * @var Block
	 */
	protected $block;

	/**
	 * Content type (class name of Supra\Editable\EditableInterface class)
	 * @Column(type="string")
	 * @var string
	 */
	protected $type;
	
	/**
	 * @Column(type="string")
	 * @var string
	 */
	protected $name;

	/**
	 * @Column(type="text", nullable=true)
	 * @var string
	 */
	protected $value;
	
	/**
	 * Serialized value additional data
	 * @Column(type="text", name="value_data", nullable=true)
	 * @var string
	 */
	protected $valueData;
	
	/**
	 * Value additional data about links, images
	 * @OneToMany(targetEntity="BlockPropertyMetadata", mappedBy="blockProperty", cascade={"all"}, fetch="EAGER")
	 * @var Collections\Collection
	 */
	protected $metadata;
	
	/**
	 * @var EditableInterface
	 */
	protected $editable;

	/**
	 * Constructor
	 * @param string $name
	 * @param string $type
	 */
	public function __construct($name, $type)
	{
		parent::__construct();
		$this->name = $name;
		$this->type = $type;
		$this->resetMetadata();
	}

	/**
	 * @return Data
	 */
	public function getData()
	{
		return $this->data;
	}

	/**
	 * @param Data $data
	 */
	public function setData(Data $data)
	{
		if ($this->writeOnce($this->data, $data)) {
			$this->checkScope($this->data);
		}
	}

	/**
	 * @return Collections\Collection
	 */
	public function getMetadata()
	{
		return $this->metadata;
	}
	
	/**
	 * Resets metadata collection to empty collection
	 */
	public function resetMetadata()
	{
		$this->metadata = new Collections\ArrayCollection();
	}
	
	/**
	 * @param ReferencedElement\ReferencedElementAbstract $metadata
	 */
	public function addMetadata(ReferencedElement\ReferencedElementAbstract $metadata)
	{
		$this->metadata->add($metadata);
	}

	/**
	 * @return Block
	 */
	public function getBlock()
	{
		return $this->block;
	}

	/**
	 * @param Block $block
	 */
	public function setBlock(Block $block)
	{
		if ($this->writeOnce($this->block, $block)) {
			$this->checkScope($this->block);
		}
	}
	
	/**
	 * Get content type
	 * @return string
	 */
	public function getType()
	{
		return $this->type;
	}

	/**
	 * Set content type
	 * @param string $type 
	 */
	public function setType($type)
	{
		$this->type = $type;
	}

	/**
	 * @return string
	 */
	public function getName()
	{
		return $this->name;
	}

	/**
	 * @return string
	 */
	public function getValue()
	{
		return $this->value;
	}

	/**
	 * TODO: should we validate the value? should we serialize arrays passed?
	 * @param string $value
	 */
	public function setValue($value)
	{
		$this->value = $value;
	}
	
	/**
	 * Return value additional data, usually array
	 * @return mixed
	 */
	public function getValueData()
	{
		$metadataCollection = $this->getMetadata();
		
		//FIXME: Temporary before switching to referenced elements completely
		$valueData = array();
		
		/* @var $metadata \Supra\Controller\Pages\Entity\BlockPropertyMetadata */
		foreach ($metadataCollection as $metadata) {
			$valueData[$metadata->getName()] = $metadata->getReferencedElement()->toArray();
		}
		
		return $valueData;
		
//		$valueData = null;
//		
//		if (isset($this->valueData)) {
//			$valueData = unserialize($this->valueData);
//		}
//		
//		return $valueData;
	}
	
	/**
	 * Set value data, usually array
	 * @param mixed $value
	 */
	public function setValueData($value)
	{
		$this->valueData = serialize($value);
	}
	
	/**
	 * @return EditableInterface
	 */
	public function getEditable()
	{
		return $this->editable;
	}

	/**
	 * @param EditableInterface $editable
	 */
	public function setEditable(EditableInterface $editable)
	{
		$this->editable = $editable;
	}

	/**
	 * Checks if associations scopes are matching
	 * @param Entity $object
	 */
	private function checkScope(Entity &$object)
	{
		if ( ! empty($this->data) && ! empty($this->block)) {
			try {
				// do not-strict match (allows page data with template block)
				$this->data->matchDiscriminator($this->block, false);
			} catch (Exception\PagesControllerException $e) {
				$object = null;
				throw $e;
			}
		}
	}
	
	/**
	 * Doctrine safe clone method with cloning of children
	 */
	public function __clone()
	{
		if ( ! empty($this->id)) {
			$this->regenerateId();
			$this->block = null;
			$this->data = null;
		}
	}

}
