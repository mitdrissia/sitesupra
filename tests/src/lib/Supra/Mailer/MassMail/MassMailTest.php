<?php

namespace Supra\Mailer\MassMail;

use Supra\Tests\ObjectRepository\Mockup\ObjectRepository;
use Supra\Tests\Mailer\Mockup\Mailer;
use Supra\Mailer\MassMail\Entity;
use Supra\Mailer\MassMail\Manager;

require_once dirname(__FILE__) . '/../../../../../../src/lib/Supra/Mailer/MassMail/MassMail.php';

/**
 * Test class for MassMail.
 * Generated by PHPUnit on 2012-01-25 at 13:38:33.
 */
class MassMailTest extends \PHPUnit_Framework_TestCase
{
	const EMAIL_FROM_ADDRESS = 'test.from.address@email.vig';
	const EMAIL_FROM_NAME = 'Test from name';
	const REPLY_TO = 'reply.to@email.vig';
	const SUBJECT = 'Subject';
	const HTML_CONTENT = '<h1>HTML content</h1>';

	/**
	 * @var MassMail
	 */
	protected $object;

	/**
	 * Sets up the fixture, for example, opens a network connection.
	 * This method is called before a test is executed.
	 */
	protected function setUp()
	{
		ObjectRepository::setDefaultMailer(new \Supra\Tests\Mailer\Mockup\Mailer());
		$this->object = ObjectRepository::getMassMail($this);
	}

	/**
	 * Tears down the fixture, for example, closes a network connection.
	 * This method is called after a test is executed.
	 */
	protected function tearDown()
	{
		ObjectRepository::restoreCurrentState();
	}

	/**
	 * @covers {className}::{origMethodName}
	 * @todo Implement testGetSubscriberListManager().
	 */
	public function testGetSubscriberListManager()
	{
		// Remove the following lines when you implement this test.
		$this->markTestIncomplete(
				'This test has not been implemented yet.'
		);
	}

	/**
	 * @covers {className}::{origMethodName}
	 * @todo Implement testGetCampaignManager().
	 */
	public function testGetCampaignManager()
	{
		// Remove the following lines when you implement this test.
		$this->markTestIncomplete(
				'This test has not been implemented yet.'
		);
	}

	/**
	 * @covers {className}::{origMethodName}
	 * @todo Implement testGetSendQueueManager().
	 */
	public function testGetSendQueueManager()
	{
		// Remove the following lines when you implement this test.
		$this->markTestIncomplete(
				'This test has not been implemented yet.'
		);
	}

	/**
	 * @covers {className}::{origMethodName}
	 * @todo Implement testGetSubscriberManager().
	 */
	public function testGetSubscriberManager()
	{
		// Remove the following lines when you implement this test.
		$this->markTestIncomplete(
				'This test has not been implemented yet.'
		);
	}

	/**
	 * @covers {className}::{origMethodName}
	 * @todo Implement testFlush().
	 */
	public function testFlush()
	{
		// Remove the following lines when you implement this test.
		$this->markTestIncomplete(
				'This test has not been implemented yet.'
		);
	}

	public function testCreateSubscriberListsCampaign()
	{

		$massMail = new MassMail();

		//create list
		$list = $massMail->getSubscriberListManager()
				->createList('test list');

		//create campaign
		$campaign = $massMail->getCampaignManager()
				->createCampaign('test campaign', $list);


		$campaign->setSubject('test campaign');
		$campaign->setFromName('test sender');
		$campaign->setFromEmail('test.sender@test.test');
		$campaign->setReplyTo('test.reply.to@test.test');


		$campaign->setHtmlContent('<h1>Test content</h1>');


		//create subscriber
		$subscriber = $massMail->getSubscriberManager()
				->createSubscriber('test.user@test.test', 'test user', true);

		//subscribe to list
		$massMail->getSubscriberManager()
				->addToList($subscriber, $list);

		//store data
		$massMail->flush();

		//send campaign
		$massMail->populateSendQueue($campaign);

		//store data
		$massMail->flush();

		$massMail->getSendQueueManager()->send();

		//Drop test data
		$massMail->getCampaignManager()->dropCampaign($campaign);
		$massMail->getSubscriberListManager()->dropList($list);
		$massMail->getSubscriberManager()->dropSubscriber($subscriber);

		$massMail->flush();
	}

	public function testInActiveSubscriberSend()
	{

		$list = $this->createList();
		$campaign = $this->createCampaign($list);
		$campaign->setFromEmail(self::EMAIL_FROM_ADDRESS);
		$campaign->setFromName(self::EMAIL_FROM_NAME);
		$campaign->setReplyTo(self::REPLY_TO);
		$campaign->setSubject($subject . ' ' . time());
		$campaign->setHtmlContent(self::HTML_CONTENT . '<p>' . time() . '</p>');

		$this->object->flush();

		//Add inactive subscriber
		$subscriber = $this->createSubscriber($active = false);

		//Add inactive subscriber
		$list->addSubscriber($subscriber);

		$this->object->flush();

		//populate queue
		$this->object->populateSendQueue($campaign);

		$this->object->flush();

		//send campaign
		$this->object->getSendQueueManager()->send();

		$this->object->flush();

		//check sent count; must be 0
		$mailer = ObjectRepository::getMailer($this);

		self::assertEquals(0, count($mailer->receavedMessage));
	}

	public function testActiveSubscriberSend()
	{

		$list = $this->createList();
		$campaign = $this->createCampaign($list);
		$campaign->setFromEmail(self::EMAIL_FROM_ADDRESS);
		$campaign->setFromName(self::EMAIL_FROM_NAME);
		$campaign->setReplyTo(self::REPLY_TO);
		$campaign->setSubject($subject . ' ' . time());
		$campaign->setHtmlContent(self::HTML_CONTENT . '<p>' . time() . '</p>');

		$this->object->flush();

		//Add inactive subscriber
		$subscriber = $this->createSubscriber($active = false);

		//Add inactive subscriber
		$list->addSubscriber($subscriber);

		//Add active subscriber
		$subscriber = $this->createSubscriber($active = true);

		//Add inactive subscriber
		$list->addSubscriber($subscriber);

		$this->object->flush();
		
		//populate queue
		$this->object->populateSendQueue($campaign);

		$this->object->flush();

		//send campaign
		$this->object->getSendQueueManager()->send();

		$this->object->flush();

		//check sent count; must be 1
		$mailer = ObjectRepository::getMailer($this);

		self::assertEquals(1, count($mailer->receavedMessage));
		
	}

	public function testSubscribeAndActivateUserSend()
	{
		
		$mailer = ObjectRepository::getMailer($this);

		$list = $this->createList();
		$campaign = $this->createCampaign($list);
		$campaign->setFromEmail(self::EMAIL_FROM_ADDRESS);
		$campaign->setFromName(self::EMAIL_FROM_NAME);
		$campaign->setReplyTo(self::REPLY_TO);
		$campaign->setSubject($subject . ' ' . time());
		$campaign->setHtmlContent(self::HTML_CONTENT . '<p>' . time() . '</p>');

		$this->object->flush();

		//Add inactive subscriber
		$subscriber = $this->createSubscriber($active = false);

		//Add inactive subscriber
		$list->addSubscriber($subscriber);


		$this->object->flush();
		
		//populate queue
		$this->object->populateSendQueue($campaign);

		$this->object->flush();

		$mailer->resetReceavedMessages();
		
		//send campaign
		$this->object->getSendQueueManager()->send();

		$this->object->flush();
		
		//check sent count; must be 0
		self::assertEquals(0, count($mailer->receavedMessage));
	
		$subscriber->setActive(true);

		$this->object->flush();
		
		//populate queue
		$this->object->populateSendQueue($campaign);

		$this->object->flush();

		$mailer->resetReceavedMessages();
		
		//send campaign
		$this->object->getSendQueueManager()->send();

		$this->object->flush();
		
		//check sent count; must be 1

		self::assertEquals(1, count($mailer->receavedMessage));
				
		$subscriber->setActive(false);

		$this->object->flush();
		
		//populate queue
		$this->object->populateSendQueue($campaign);

		$this->object->flush();

		$mailer->resetReceavedMessages();
		
		//send campaign
		$this->object->getSendQueueManager()->send();

		$this->object->flush();
		
		//check sent count; must be 0

		self::assertEquals(0, count($mailer->receavedMessage));
		
	}
	
	
	public function testDoubleSubscriberRegistartion()
	{
		
		$subscriberName = 'subscriber_name_'. uniqid(null, true) . '_' . time();
		$subscriberEmail = 'subscriber_email@' . uniqid(null, true) .'_'. time() . '.vig';

		$subscriber = $this->object->getSubscriberManager()
				->createSubscriber($subscriberEmail, $subscriberName, false);
		

		$subscriber = $this->object->getSubscriberManager()
				->createSubscriber($subscriberEmail, $subscriberName, false);

		$this->object->flush();
		
		$subscriber->setActive(true);
		
		$this->object->flush();
		
	}
	
	
	public function testSubscribersSend()
	{
		
	}

	public function testEmptyMessageSend()
	{
		
	}

	/**
	 * Helper method - returns new Subscriber
	 * @param bool $active
	 * @return Supra\Mailer\MassMail\Entity\Subscriber
	 */
	private function createSubscriber($active = false)
	{
		$subscriberName = 'subscriber_name_' . uniqid(null, true) .'_'. time();
		$subscriberEmail = 'subscriber_email@'. uniqid(null, true) .'_'. time() . '.vig';

		$subscriber = $this->object->getSubscriberManager()
				->createSubscriber($subscriberEmail, $subscriberName, $active);

		return $subscriber;
	}

	/**
	 * Helper method - returns new SubscriberList
	 * @return Supra\Mailer\MassMail\Entity\SubscriberList
	 */
	private function createList()
	{
		$listName = 'test_list_' . time();
		$list = $this->object->getSubscriberListManager()
				->createList($listName);

		return $list;
	}

	/**
	 * Helper method - returns new camaign
	 * @param  Supra\Mailer\MassMail\Entity\SubscriberList $list
	 * @return Supra\Mailer\MassMail\Entity\Campaign
	 */
	private function createCampaign($list)
	{
		$campaignName = 'test_campaign_' . time();

		$campaign = $this->object->getCampaignManager()
				->createCampaign($campaignName, $list);

		return $campaign;
	}

}

?>
