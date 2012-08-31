<?php

namespace Supra\Controller\Layout\Theme;

use Supra\Controller\Pages\Entity\Theme\Theme;
use Supra\Controller\Pages\Entity\Theme\ThemeLayout;
use Supra\Controller\Pages\Entity\Template;

abstract class ThemeProviderAbstraction
{

	/**
	 * @return Theme
	 */
	abstract public function getCurrentTheme();

	/**
	 * @return ThemeLayout 
	 */
	abstract public function getCurrentThemeLayoutForTemplate(Template $template, $media = TemplateLayout::MEDIA_SCREEN);

	/**
	 * @return array
	 */
	abstract public function getAllThemes();

	/**
	 * @return Theme
	 */
	abstract public function getThemeByName($themeName);

	/**
	 * @param Theme 
	 */
	abstract public function storeTheme(Theme $theme);

	/**
	 * @return Theme
	 */
	abstract public function makeNewTheme();

	/**
	 * @return Theme
	 */
	abstract public function getActiveTheme();

	/**
	 * @param Theme $theme 
	 */
	abstract public function setActiveTheme(Theme $theme);

	/**
	 * @param Theme $theme 
	 */
	abstract public function setCurrentTheme(Theme $theme);
}