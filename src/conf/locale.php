<?php
use Supra\Locale;
use Supra\ObjectRepository\ObjectRepository;

$localeManagerTemplate = new Locale\LocaleManager();

/* English | Latvia */
$locale = new Locale\Locale();
$locale->setId('en_LV');
$locale->setTitle('English');
$locale->setCountry('Latvia');
$locale->addProperty('flag', 'gb');
$locale->setActive(false);
$locale->addProperty('language', 'en'); // as per ISO 639-1
$localeManagerTemplate->add($locale);

/* Latvian | Latvia */
$locale = new Locale\Locale();
$locale->setId('lv_LV');
$locale->setTitle('Latvian');
$locale->setCountry('Latvia');
$locale->addProperty('flag', 'lv');
$locale->addProperty('language', 'lv'); // as per ISO 639-1
$localeManagerTemplate->add($locale);

/* Russian | Russia */
$locale = new Locale\Locale();
$locale->setId('ru_RU');
$locale->setTitle('Russian');
$locale->setCountry('Russia');
$locale->addProperty('flag', 'ru');
$locale->setActive(false);
$locale->addProperty('language', 'ru'); // as per ISO 639-1
$localeManagerTemplate->add($locale);

$localeManagerTemplate->setCurrent('lv_LV');

{
	$localeManager = clone($localeManagerTemplate);
	$localeManager->addDetector(new Locale\Detector\PathLocaleDetector());
	$localeManager->addDetector(new Locale\Detector\CookieDetector());

	$localeManager->addStorage(new Locale\Storage\CookieStorage());

	ObjectRepository::setDefaultLocaleManager($localeManager);
}

{
	$cmsLocaleManager = clone($localeManagerTemplate);
	$cmsLocaleManager->addDetector(new Locale\Detector\ParameterLocaleDetector());
	$cmsLocaleManager->addDetector(new Locale\Detector\CookieDetector());

	$cmsLocaleManager->addStorage(new Locale\Storage\CookieStorage());
	
	$cmsLocaleManager->processInactiveLocales();

	ObjectRepository::setLocaleManager('Supra\Cms\CmsController', $cmsLocaleManager);
}
