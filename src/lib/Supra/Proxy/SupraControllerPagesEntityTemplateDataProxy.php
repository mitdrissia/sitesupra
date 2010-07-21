<?php

namespace Supra\Proxy;

/**
 * THIS CLASS WAS GENERATED BY THE DOCTRINE ORM. DO NOT EDIT THIS FILE.
 */
class SupraControllerPagesEntityTemplateDataProxy extends \Supra\Controller\Pages\Entity\TemplateData implements \Doctrine\ORM\Proxy\Proxy
{
    private $_entityPersister;
    private $_identifier;
    public $__isInitialized__ = false;
    public function __construct($entityPersister, $identifier)
    {
        $this->_entityPersister = $entityPersister;
        $this->_identifier = $identifier;
    }
    private function _load()
    {
        if (!$this->__isInitialized__ && $this->_entityPersister) {
            $this->__isInitialized__ = true;
            if ($this->_entityPersister->load($this->_identifier, $this) === null) {
                throw new \Doctrine\ORM\EntityNotFoundException();
            }
            unset($this->_entityPersister);
            unset($this->_identifier);
        }
    }

    
    public function setTemplate(\Supra\Controller\Pages\Entity\Template $template)
    {
        $this->_load();
        return parent::setTemplate($template);
    }

    public function setMaster(\Supra\Controller\Pages\Entity\Abstraction\Page $master)
    {
        $this->_load();
        return parent::setMaster($master);
    }

    public function getTemplate()
    {
        $this->_load();
        return parent::getTemplate();
    }

    public function getId()
    {
        $this->_load();
        return parent::getId();
    }

    public function getLocale()
    {
        $this->_load();
        return parent::getLocale();
    }

    public function setTitle($title)
    {
        $this->_load();
        return parent::setTitle($title);
    }

    public function getTitle()
    {
        $this->_load();
        return parent::getTitle();
    }

    public function addBlockProperty(\Supra\Controller\Pages\Entity\Abstraction\BlockProperty $blockProperty)
    {
        $this->_load();
        return parent::addBlockProperty($blockProperty);
    }

    public function getProperty($name)
    {
        $this->_load();
        return parent::getProperty($name);
    }

    public function getDiscriminator()
    {
        $this->_load();
        return parent::getDiscriminator();
    }

    public function matchDiscriminator(\Supra\Controller\Pages\Entity\Abstraction\Entity $object, $strict = true)
    {
        $this->_load();
        return parent::matchDiscriminator($object, $strict);
    }

    public function __toString()
    {
        $this->_load();
        return parent::__toString();
    }


    public function __sleep()
    {
        if (!$this->__isInitialized__) {
            throw new \RuntimeException("Not fully loaded proxy can not be serialized.");
        }
        return array('id', 'locale', 'title', 'blockProperties', 'template');
    }
}