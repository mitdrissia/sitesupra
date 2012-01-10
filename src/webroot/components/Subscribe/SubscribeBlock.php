<?php

namespace Project\Subscribe;

use Supra\Controller\Pages\Entity;
use Supra\Controller\Pages\BlockController,
	Supra\Request,
	Supra\Response;

use Supra\Mailer;
use Supra\Mailer\Message;
use Supra\Mailer\Message\TwigMessage;
use Supra\ObjectRepository\ObjectRepository;
use Supra\Uri\Path;

/**
 * Description of SubscribeBlock
 *
 * @author aleksey
 */
class SubscribeBlock extends BlockController
{
	
	const SALT = 'h5$|zQ';
	
	const ACTION_SUBSCRIBE = 'subscribe';
	const ACTION_UNSUBSCRIBE = 'unsubscribe';
	const ACTION_CONFIRM_SUBSCRIBE = 'confirm_subscribe';
	const ACTION_CONFIRM_UNSUBSCRIBE = 'confirm_unsubscribe';

	/**
	 * Current request
	 * @var PageRequest
	 */
	protected $request;
	
	/**
	 * Current response
	 * @var Response\TwigResponse
	 */
	protected $response;
	
	public function execute()
	{
		$this->request = $this->getRequest();
		$this->response = $this->getResponse();

		$action = $this->request->getParameter('action');

		// Selecting subscribe-action
		switch ($action) {

			case self::ACTION_CONFIRM_SUBSCRIBE: {
				
					$this->actionConfirmSubscribe();
					
				}break;
			case self::ACTION_CONFIRM_UNSUBSCRIBE: {
				
					$this->actionConfirmUnsubscribe();
					
				}break;
			case self::ACTION_UNSUBSCRIBE: {
				
					$this->actionUnsubscribe();
					
				}break;
			default : {
				
					$this->actionSubscribe();
					
				}
		}

		// Local file is used
		$this->response->outputTemplate('index.html.twig');
	}

	protected function actionSubscribe(Response\TwigResponse $response)
	{	
		$error = null;
		
		if($this->request->isPost()) {
							
			$postData = $this->request->getPost();
			
			try{
				
				$email = $postData->getValid('email', \Supra\Validator\Type\AbstractType::EMAIL);

			/**
			 * @todo add required exception type
			 */
			} catch(\Exception $e) {
				$error[] = 'wrong_email_address';
			}
			
			$subscriberName = $postData->get('name');
			
			//Store subscriber
			
			$subscriber = new \Supra\Mailer\CampaignMonitor\Entity\Subscriber();
			
			$subscriber->setEmailAddress($email);
			$subscriber->setName($subscriberName);
			$subscriber->setActive(false);
			$subscriberId = $subscriber->getId();
			$hash = $this->getHash($email, $subscriberId);
			$subscriber->setConfirmHash($hash);
			$subscriber->setConfirmDateTimeAsNow();
			
			$entityManager = ObjectRepository::getEntityManager($this);
			$entityManager->persist($subscriber);
			
			
			/* @var $localization PageLocalization */
			$localization = $this->getRequest()->getPageLocalization();
			
			if( ! ($localization instanceof Entity\PageLocalization)) {
				return null;
			}
			
			$url = ObjectRepository::getSystemInfo($this)->getHostName();	
			
			$url.= $localization->getPath()->getFullPath(Path::FORMAT_BOTH_DELIMITERS);
			
			$url.="?hash={$hash}&email={$email}"; 
			
			//$url = urlencode($url);
			
			/**
			 * @todo get subject and mail from-addres from configuration
			 */
			$emailParams = array (
					'subject' => 'Subscribe confirmation',
					'name' => $subscriberName,
					'link' => $url,
					'email' => $email);
			
			
			try{
				
				$this->sendEmail($emailParams, 'confirm_subscribe');
				
			} catch (\Exception $e) {
				$error[] = 'cant_sent_mail';				
			}
			
			
			if( empty($error) ) {
				$entityManager->flush();
			}

			$this->response->assign('email', $email);
			$this->response->assign('error', $error);
			$this->response->assign('postedData', true);
		}
		
		$this->response->assign('errors', $error);
		$this->response->assign('action', self::ACTION_SUBSCRIBE);
	}

	protected function actionUnsubscribe(Response\TwigResponse $response)
	{
		$this->$response->assign('action', self::ACTION_UNSUBSCRIBE);
	}

	protected function actionConfirmSubscribe(Response\TwigResponse $response)
	{
		$result = $this->confirm();
		
		if($result) {
			
			$this->$response->assign('confirmed', true);	
			
		} else {
			
			$this->$response->assign('confirmed', false);	
			
		}
		
		$this->$response->assign('action', self::ACTION_CONFIRM_SUBSCRIBE);	
	}

	protected function actionConfirmUnsubscribe(Response\TwigResponse $response)
	{
		$this->$response->assign('action', self::ACTION_CONFIRM_UNSUBSCRIBE);			
	}

	protected function confirm()
	{
		
	}

	protected function subscribe()
	{
		
	}

	protected function unsubscribe()
	{
		
	}

	public function getHash($emailAddress, $userRecordId = '')
	{
		$hash = mb_strtolower($emailAddress) . ' ' . $userRecordId . self::SALT;
		$hash = md5($hash);
		$hash = substr($hash, 0, 8);
		return $hash;
	}
	
	
	
	private function sendEmail($emailParams, $templateName){
			
			$mailer = ObjectRepository::getMailer($this);
			$message = new TwigMessage();
			$message->setContext(__CLASS__);
			
			$message->setSubject($emailParams['subject'])
					->setTo($emailParams['email'], $emailParams['name'])
					->setBody("mail-template/{$templateName}.twig", $emailParams, 'text/html');
					
			$mailer->send($message);
	}
	

	
	
}
