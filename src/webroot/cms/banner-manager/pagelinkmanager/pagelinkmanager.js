//Invoke strict mode
"use strict";

SU('supra.input', 'supra.slideshow', 'supra.tree', 'supra.medialibrary', function (Y) {
	
	//Shortcuts
	var Manager = SU.Manager,
		Action = Manager.Action,
		Loader = Manager.Loader;
	
	//Add as right bar child
	Manager.getAction('LayoutLeftContainer').addChildAction('PageLinkManager');
	
	//Create Action class
	new Action({
		
		/**
		 * Unique action name
		 * @type {String}
		 */
		NAME: 'PageLinkManager',
		
		/**
		 * Load stylesheet
		 * @type {Boolean}
		 * @private
		 */
		HAS_STYLESHEET: true,
		
		/**
		 * Load template
		 * @type {Boolean}
		 * @private
		 */
		HAS_TEMPLATE: true,
		
		
		
		/**
		 * Buttons
		 * @type {Object}
		 */
		button_cancel: null,
		
		/**
		 * Link slideshow, Supra.Slideshow instance
		 * @type {Object}
		 */
		link_slideshow: null,
		
		/**
		 * Supra.Form instance
		 * @type {Object}
		 */
		form: null,
		
		/**
		 * Link data
		 * @type {Object}
		 */
		data: {},
		
		/**
		 * Link manager options
		 * @type {Object}
		 */
		options: null,
		
		/**
		 * Last known locale
		 * @type {String}
		 */
		locale: null,
		
		
		
		/**
		 * Render widgets and add event listeners
		 */
		render: function () {
			//Toolbar buttons
			Manager.getAction('PageToolbar').addActionButtons(this.NAME, []);
			Manager.getAction('PageButtons').addActionButtons(this.NAME, []);
			
			//Back and Close buttons
			var buttons = this.all('button');
			
			this.button_close = new Supra.Button({'srcNode': buttons.filter('.button-close').item(0), 'style': 'mid-blue'});
			this.button_close.render();
			this.button_close.on('click', this.close, this);
			
			this.button_remove = new Supra.Button({'srcNode': buttons.filter('.button-remove').item(0), 'style': 'mid'});
			this.button_remove.render();
			this.button_remove.on('click', this.removeLink, this);
			
			//On visibility change show/hide container
			this.on('visibleChange', function (evt) {
				if (evt.newVal) {
					this.one().removeClass('hidden');
				} else {
					this.one().addClass('hidden');
				}
			}, this);
			
			//Create form
			this.form = new Supra.Form({
				'srcNode': this.one('form')
			});
			this.form.render();
			
			//Internal / External
				//Create slideshow
				var slideshow = this.link_slideshow = (new Supra.Slideshow({
					'srcNode': this.one('div.slideshow')
				})).render();
				
				//On Internal / External switch show slide
				this.form.getInput('linkManagerType').on('change', function (evt) {
					var slide = 'linkManager' + evt.value.substr(0,1).toUpperCase() + evt.value.substr(1);
					slideshow.set('slide', slide);
				}, this);
				
				//When layout position/size changes update slide position
				Manager.LayoutLeftContainer.layout.on('sync', this.link_slideshow.syncUI, this.link_slideshow);
			
			//Create tree
				//Use sitemap data
				this.locale = Supra.data.get('locale');
				var sitemap_data_path = SU.Manager.Loader.getActionInfo('SiteMap').path_data +
											'?locale=' + this.locale +
											'&existing_only=1';
				
				//Create tree
				this.tree = new SU.Tree({
					srcNode: this.one('.tree'),
					requestUri: sitemap_data_path,
					groupNodesSelectable: false
				});
				this.tree.plug(SU.Tree.ExpandHistoryPlugin);
				this.tree.render();
		},
		
		/**
		 * Hide action
		 */
		hide: function () {
			Action.Base.prototype.hide.apply(this, arguments);
			
			//Show previous buttons
			Manager.getAction('PageToolbar').unsetActiveAction(this.NAME);
			Manager.getAction('PageButtons').unsetActiveAction(this.NAME);
			
			//Hide action
			Manager.getAction('LayoutLeftContainer').unsetActiveAction(this.NAME);
		},
		
		removeLink: function () {
			this.tree.set('selectedNode', null);
			this.form.getInput('href').setValue('');
			this.close();
		},
		
		/**
		 * Restore state matching data
		 * 
		 * @param {Object} data
		 */
		setData: function (data) {
			data = SU.mix({
				'resource': 'page',
				'title': '',
				'href': '',
				'page_id': null,
				'page_master_id': null
			}, data || {});
			
			//Set values by input name
			this.form.setValues(data, 'name');
			
			this.data = data;
			
			this.link_slideshow.set('noAnimations', true);
			this.form.getInput('linkManagerType').set('value', (data.resource == 'page' ? 'internal' : 'external'));
			this.link_slideshow.set('noAnimations', false);
			
			//If locale has changed since last time this action was opened then reload tree data
			var reloading_tree = false;
			if (this.locale && this.locale != Supra.data.get('locale')) {
				reloading_tree = true;
			}
			
			//If some option changed, then reload tree also
			if (this.tree && this.options.groupsSelectable != this.tree.get('groupNodesSelectable')) {
				this.tree.set('groupNodesSelectable', this.options.groupsSelectable);
				reloading_tree = true;
			}
			
			//Reload tree if needed
			if (reloading_tree)	{
				this.locale = Supra.data.get('locale');
				var sitemap_data_path = SU.Manager.Loader.getActionInfo('SiteMap').path_data +
											'?locale=' + this.locale +
											'&existing_only=1';
				
				this.tree.set('requestUri', sitemap_data_path);
				this.tree.reload();
			}
			
			if (data.resource == 'page') {
				
				var key,
					value;
				
				// Supports selection by page ID or master ID
				if (data.page_id) {
					key = 'id';
					value = data.page_id;
				} else if (data.page_master_id) {
					key = 'master_id';
					value = data.page_master_id;
				}
				
				if (key) {
					var node = this.tree.getNodeBy(key, value);
					if (!node || reloading_tree) {
						this.tree.once('render:complete', function () {
							this.tree.set('selectedNode', null);

							var node = this.tree.getNodeBy(key, value);
							if (node) this.tree.set('selectedNode', node);
						}, this);
					} else {
						this.tree.set('selectedNode', node);
					}
				}
			}
			
		},
		
		/**
		 * Returns link data
		 * 
		 * @return Link data
		 * @type {Object}
		 */
		getData: function () {
			var data = SU.mix(this.data || {}, this.form.getValues('name'));
			
			if (data.linktype == 'internal') {
				//Link to page
				var tree_node = this.tree.get('selectedNode'),
					page_data = null,
					page_id = '',
					page_master_id = '',
					page_path = '',
					page_title = '';
				
				if (tree_node) {
					page_data = tree_node.get('data');
					if (page_data) {
						page_id = page_data.id;
						page_master_id = page_data.master_id;
						page_path = page_data.full_path;
						page_title = page_data.title;
					}
				}
				
				return {
					'resource': 'page',
					'page_id': page_id,
					'page_master_id': page_master_id,
					'href': page_path,
					'title': page_title
				};
			} else {
				//Link to external resource
				return {
					'resource': 'link',
					'href': data.href,
					'title': data.href
				};
			}
		},
		
		/**
		 * Returns tree page path
		 * 
		 * @param {Number} id
		 */
		getTreePagePath: function (id) {
			var data = this.tree.getIndexedData(),
				item = (id in data ? data[id] : null),
				list = [];
			 
			 while(item) {
			 	list.push(item.path);
				item = data[item.parent];
			 }
			 
			 return list.length > 1 ? list.reverse().join('/') + '/' : '/';
		},
		
		/**
		 * Close and save data
		 */
		close: function () {
			if (this.options.callback) {
				var data = this.getData();
				this.options.callback(data);
			}
			
			this.hide();
		},
		
		/**
		 * Execute action
		 */
		execute: function (data, options, callback) {
			if (SU.Y.Lang.isFunction(options)) {
				callback = options;
				options = null;
			}
			
			//Link manager options
			this.options = Supra.mix({
				'hideToolbar': false,
				'callback': callback,
				'groupsSelectable': false	//Virtual folders
			}, options || {});
			
			this.setData(data);
			
			if (this.options.hideToolbar) {
				Manager.getAction('PageToolbar').setActiveAction(this.NAME);
				Manager.getAction('PageButtons').setActiveAction(this.NAME);
			}
			
			Manager.getAction('LayoutLeftContainer').setActiveAction(this.NAME);
		}
	});
	
});