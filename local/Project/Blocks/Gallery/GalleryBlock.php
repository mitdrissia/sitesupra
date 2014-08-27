<?php

namespace Project\Blocks\Gallery;

use Supra\Controller\Pages\BlockController;
use Supra\Request;
use Supra\Response;
use Supra\Editable;
use Supra\Uri\PathConverter;

class GalleryBlock extends BlockController
{

	public function doExecute()
	{
		$response = $this->getResponse();
		$context = $response->getContext();

		$context->addCssLinkToLayoutSnippet('css', PathConverter::getWebPath('css/style.css', $this));
		$response->outputTemplate('index.html.twig');
	}

}