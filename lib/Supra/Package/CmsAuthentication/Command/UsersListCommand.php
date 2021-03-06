<?php

/*
 * Copyright (C) SiteSupra SIA, Riga, Latvia, 2015
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 */

namespace Supra\Package\CmsAuthentication\Command;

use Supra\Core\Console\AbstractCommand;
use Supra\Package\CmsAuthentication\Entity\Group;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class UsersListCommand extends AbstractCommand
{
	protected function configure()
	{
		$this->setName('users:list')
			->setDescription('Lists users, provide --em to use different EntityManager')
			->addOption('em', null, InputArgument::OPTIONAL, 'Entity manager name');
	}

	protected function execute(InputInterface $input, OutputInterface $output)
	{
		$em = $this->container->getDoctrine()->getManager($input->getOption('em'));

		$users = $em->getRepository('CmsAuthentication:User')->findBy(array(), array('login' => 'ASC'));

		$table = new Table($output);

		$table->setHeaders(array('ID', 'Login', 'Email', 'Groups', 'Active'));

		$table->addRows(array_map(function ($user) {
			/* @var $user User */

			return array(
				$user->getId(),
				$user->getLogin(),
				$user->getEmail(),
				call_user_func(function ($value) {
					if ($value instanceof Group) {
						return $value->getName();
					} else {
						return '--/--';
					}
				}, $user->getGroup()),
				$user->isActive() ? '<info>Yes</info>' : 'No'
			);
		}, $users));

		$table->render();
	}

}
