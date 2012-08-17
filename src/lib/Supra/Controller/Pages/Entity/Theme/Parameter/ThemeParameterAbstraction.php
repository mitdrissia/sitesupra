<?php

namespace Supra\Controller\Pages\Entity\Theme\Parameter;

use Supra\Database;
use Supra\Controller\Pages\Entity\Theme;
use Supra\Controller\Layout\Theme\Configuration\ThemeParameterConfigurationAbstraction;

/**
 * @Entity
 * @InheritanceType("SINGLE_TABLE")
 * @ChangeTrackingPolicy("DEFERRED_EXPLICIT")
 * @Table(name="su_ThemeParameter", uniqueConstraints={@UniqueConstraint(name="unique_name_in_theme_idx", columns={"name", "theme_id"})}))
 * @DiscriminatorMap({
 * 	"array" = "ArrayParameter", 
 * 	"background" = "BackgroundParameter",
 *  "button" = "ButtonParameter",
 *  "color" = "ColorParameter",
 *  "font" = "FontParameter",
 *  "image" = "ImageParameter",
 *  "menu" = "MenuParameter"
 * })
 */
abstract class ThemeParameterAbstraction extends Database\Entity
{

	/**
	 * @Column(type="string")
	 * @var string
	 */
	protected $name;

	/**
	 * @Column(type="string")
	 * @var string
	 */
	protected $title;

	/**
	 * @ManyToOne(targetEntity="Supra\Controller\Pages\Entity\Theme\Theme", inversedBy="parameters")
	 * @JoinColumn(name="theme_id", referencedColumnName="id")
	 * @var Theme
	 */
	protected $theme;

	/**
	 * @var ThemeParameterConfigurationAbstraction
	 */
	protected $configuration;

	/**
	 * @return string
	 */
	public function getName()
	{
		return $this->name;
	}

	/**
	 * @param string $name 
	 */
	public function setName($name)
	{
		$this->name = $name;
	}

	/**
	 * @return string
	 */
	public function getTitle()
	{
		return $this->title;
	}

	/**
	 * @param string $name 
	 */
	public function setTitle($title)
	{
		$this->title = $title;
	}

	/**
	 * @return Theme\Theme
	 */
	public function getTheme()
	{
		return $this->theme;
	}

	/**
	 * @param Theme\Theme $theme 
	 */
	public function setTheme(Theme\Theme $theme = null)
	{
		$this->theme = $theme;
	}

	/**
	 * @return ThemeParameterConfigurationAbstraction
	 */
	public function getConfiguration()
	{
		if (empty($this->configuration)) {

			$themeConfiguration = $this->getTheme()->getConfiguration();

			$parameterConfiguration = null;

			foreach ($themeConfiguration->parameters as $someParameterConfiguration) {
				/* @var $someParameterConfiguration ThemeParameterConfigurationAbstraction */
				
				if ($someParameterConfiguration->id == $this->name) {
					$parameterConfiguration = $someParameterConfiguration;
					break;
				}
			}

			$this->configuration = $parameterConfiguration;
		}

		if (empty($this->configuration)) {
			throw new Exception\RuntimeException('Could not find configuration for parameter "' . $this->getName() . '" in theme "' . $this->getTheme()->getName() . '".');
		}

		return $this->configuration;
	}

	/**
	 * @return Theme\ThemeParameterValue
	 */
	public function makeNewParameterValue()
	{
		$value = new Theme\ThemeParameterValue();
		$value->setParameterName($this->getName());

		return $value;
	}

	/**
	 * @param Theme\ThemeParameterValue $parameterValue
	 * @param mixed $inputValue
	 */
	public function updateParameterValue(Theme\ThemeParameterValue $parameterValue, $input)
	{
		$parameterValue->setValue($input);
	}

	/**
	 * @param Theme\ThemeParameterValue $parameterValue
	 * @return mixed
	 */
	public function getOuptutValueFromParameterValue(Theme\ThemeParameterValue $parameterValue)
	{
		return $parameterValue->getValue();
	}

	/**
	 * @param Theme\ThemeParameterValue $parameterValue
	 * @return mixed
	 */
	public function getLessOuptutValueFromParameterValue(Theme\ThemeParameterValue $parameterValue)
	{
		return $this->getOuptutValueFromParameterValue($parameterValue);
	}

	/**
	 * @return boolean
	 */
	public function hasValueForLess()
	{
		$configuration = $this->getConfiguration();

		return $configuration->noLess == false;
	}

}
