<?php

namespace Supra\Proxy;

/**
 * THIS CLASS WAS GENERATED BY THE DOCTRINE ORM. DO NOT EDIT THIS FILE.
 */
class SupraControllerPagesEntityTemplateBlockProxy extends \Supra\Controller\Pages\Entity\TemplateBlock implements \Doctrine\ORM\Proxy\Proxy
{
    private $_entityPersister;
    private $_identifier;
    public $__isInitialized__ = false;
    public function __construct($entityPersister, $identifier)
    {
        $this->_entityPersister = $entityPersister;
        $this->_identifier = $identifier;
    }
    /** @private */
    public function __load()
    {
        if (!$this->__isInitialized__ && $this->_entityPersister) {
            $this->__isInitialized__ = true;

            if (method_exists($this, "__wakeup")) {
                // call this after __isInitialized__to avoid infinite recursion
                // but before loading to emulate what ClassMetadata::newInstance()
                // provides.
                $this->__wakeup();
            }

            if ($this->_entityPersister->load($this->_identifier, $this) === null) {
                throw new \Doctrine\ORM\EntityNotFoundException();
            }
            unset($this->_entityPersister, $this->_identifier);
        }
    }
    
    
    public function getLocked()
    {
        $this->__load();
        return parent::getLocked();
    }

    public function setLocked($locked = true)
    {
        $this->__load();
        return parent::setLocked($locked);
    }

    public function getTemporary()
    {
        $this->__load();
        return parent::getTemporary();
    }

    public function setTemporary($temporary)
    {
        $this->__load();
        return parent::setTemporary($temporary);
    }

    public function getPlaceHolder()
    {
        $this->__load();
        return parent::getPlaceHolder();
    }

    public function setPlaceHolder(\Supra\Controller\Pages\Entity\Abstraction\PlaceHolder $placeHolder)
    {
        $this->__load();
        return parent::setPlaceHolder($placeHolder);
    }

    public function getComponentClass()
    {
        $this->__load();
        return parent::getComponentClass();
    }

    public function setComponentClass($componentClass)
    {
        $this->__load();
        return parent::setComponentClass($componentClass);
    }

    public function getComponentName()
    {
        $this->__load();
        return parent::getComponentName();
    }

    public function setComponentName($componentName)
    {
        $this->__load();
        return parent::setComponentName($componentName);
    }

    public function getPosition()
    {
        $this->__load();
        return parent::getPosition();
    }

    public function setPosition($position)
    {
        $this->__load();
        return parent::setPosition($position);
    }

    public function getLocale()
    {
        $this->__load();
        return parent::getLocale();
    }

    public function setLocale($locale)
    {
        $this->__load();
        return parent::setLocale($locale);
    }

    public function inPlaceHolder(array $placeHolderIds)
    {
        $this->__load();
        return parent::inPlaceHolder($placeHolderIds);
    }

    public function createController()
    {
        $this->__load();
        return parent::createController();
    }

    public function prepareController(\Supra\Controller\Pages\BlockController $controller, \Supra\Controller\Pages\Request\PageRequest $request)
    {
        $this->__load();
        return parent::prepareController($controller, $request);
    }

    public function executeController(\Supra\Controller\Pages\BlockController $controller)
    {
        $this->__load();
        return parent::executeController($controller);
    }

    public function getDiscriminator()
    {
        $this->__load();
        return parent::getDiscriminator();
    }

    public function matchDiscriminator(\Supra\Controller\Pages\Entity\Abstraction\Entity $object, $strict = true)
    {
        $this->__load();
        return parent::matchDiscriminator($object, $strict);
    }

    public function getId()
    {
        $this->__load();
        return parent::getId();
    }

    public function equals(\Supra\Database\Entity $entity)
    {
        $this->__load();
        return parent::equals($entity);
    }

    public function __toString()
    {
        $this->__load();
        return parent::__toString();
    }

    public function getProperty($name)
    {
        $this->__load();
        return parent::getProperty($name);
    }


    public function __sleep()
    {
        return array('__isInitialized__', 'componentClass', 'position', 'locale', 'placeHolder', 'blockProperties', 'locked', 'id', 'temporary');
    }

    public function __clone()
    {
        if (!$this->__isInitialized__ && $this->_entityPersister) {
            $this->__isInitialized__ = true;
            $class = $this->_entityPersister->getClassMetadata();
            $original = $this->_entityPersister->load($this->_identifier);
            if ($original === null) {
                throw new \Doctrine\ORM\EntityNotFoundException();
            }
            foreach ($class->reflFields AS $field => $reflProperty) {
                $reflProperty->setValue($this, $reflProperty->getValue($original));
            }
            unset($this->_entityPersister, $this->_identifier);
        }
        
    }
}