<?php

namespace Project\Text;

$blockConfiguration = new \Supra\Controller\Pages\Configuration\BlockControllerConfiguration();
$blockConfiguration->controllerClass = 'Project\Text\TextController';
$blockConfiguration->title = 'Text';
$blockConfiguration->description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
$blockConfiguration->cmsClassname = 'Editable';

$blockConfiguration->configure();