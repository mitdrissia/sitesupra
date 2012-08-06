//Invoke strict mode
"use strict";

Supra(function (Y) {
	
	//Shortcuts
	var Manager = Supra.Manager,
		Action = Manager.Action;
	
	var ACTION_TEMPLATE = '\
			<div class="sidebar block-settings">\
				<div class="sidebar-header">\
					<button class="button-back hidden"><p></p></button>\
					<img src="/cms/lib/supra/img/sidebar/icons/settings.png" alt="" />\
					<button type="button" class="button-control"><p>{#buttons.done#}</p></button>\
					<h2></h2>\
				</div>\
				<div class="sidebar-content has-header"></div>\
			</div>';
	
	/*
	 * Container action
	 * Used to insert form into LayoutRightContainer, automatically adjusts layout and
	 * shows / hides other LayoutRightContainer child actions when action is shown / hidden
	 */
	
	new Action(Action.PluginLayoutSidebar, {
		// Unique action name
		NAME: 'PageContentSettings',
		
		// No need for template
		HAS_TEMPLATE: false,
		
		// Load stylesheet
		HAS_STYLESHEET: false,
		
		// Layout container action NAME
		LAYOUT_CONTAINER: 'LayoutRightContainer',
		
		// Prevent PluginLayoutSidebar from managing toolbar buttons, we will do it manually
		PLUGIN_LAYOUT_SIDEBAR_MANAGE_BUTTONS: false,
		
		
		
		//Template
		template: ACTION_TEMPLATE,
		
		//Options
		options: null,
		
		// Form instance
		form: null,
		
		// Editor toolbar was visible
		open_toolbar_on_hide: false,
		
		// Set page button visibility
		tooglePageButtons: function (visible) {
			var buttons = Supra.Manager.PageButtons.buttons[this.NAME];
			for(var i=0,ii=buttons.length; i<ii; i++) buttons[i].set('visible', visible);
			
			this.get('controlButton').get('visible', !!visible);
		},
		
		// Render action container
		render: function () {
			//Create toolbar buttons
			Manager.getAction('PageToolbar').addActionButtons(this.NAME, []);
			Manager.getAction('PageButtons').addActionButtons(this.NAME, []);
			
			//"Done" button
			this.get('controlButton').on('click', function () {
				this.callback(true);
			}, this);
		},
		
		/**
		 * Hide sidebar
		 * 
		 * @param {Boolean} keep_toolbar_buttons Don't hide toolbar buttons
		 */
		hide: function (options) {
			if (!this.get("visible")) return;
			Action.Base.prototype.hide.apply(this, arguments);
			
			var keepToolbarButtons = (options && options.keepToolbarButtons === true);
			
			//Hide buttons
			//Sometimes we don't want to hide buttons if sidebar is hidden only temporary
			if (!keepToolbarButtons) {
				Manager.getAction('PageToolbar').unsetActiveAction(this.NAME);
				Manager.getAction('PageButtons').unsetActiveAction(this.NAME);
			}
			
			//Hide form
			if (this.form) {
				if (!keepToolbarButtons && this.open_toolbar_on_hide) {
					Manager.EditorToolbar.execute();
				}
				
				this.callback();
				this.form.hide();
				this.form = null;
				this.options = null;
				this.open_toolbar_on_hide = false;
			}
			
		},
		
		/**
		 * Trigger callbacks
		 * 
		 * @param {Boolean} done Trigger also done callback
		 */
		callback: function (done) {
			if (this.options) {
				var doneCallback = this.options.doneCallback,
					hideCallback = this.options.hideCallback;
				
				if (done && Y.Lang.isFunction(doneCallback)) {
					doneCallback();
				}
				if (Y.Lang.isFunction(hideCallback)) {
					hideCallback();
				}
			}
		},
		
		// Execute action
		execute: function (form, options) {
			if (this.form && this.form !== form) {
				this.callback();
				this.form.hide();
			}
			var options = this.options = Supra.mix({
				'doneCallback': null,
				'hideCallback': null,
				'hideEditorToolbar': false,
				
				'properties': null,		//Properties class instance
				'scrollable': false,
				'title': null,
				'icon': '/cms/lib/supra/img/sidebar/icons/settings.png',
				
				'first_init': false
			}, options || {});
			
			if (!options.first_init) {
				//Show buttons
				Manager.getAction('PageToolbar').setActiveAction(this.NAME);
				Manager.getAction('PageButtons').setActiveAction(this.NAME);
			}
			
			//Set form
			if (form) {
				this.form = form;
				this.show();
				form.show();
				
				this.tooglePageButtons(!!options.doneCallback);
				
				if (options.hideEditorToolbar) {
					var has_html_inputs          = options.properties.get('host').html_inputs_count,
						toolbar_currenly_visible = Manager.EditorToolbar.get('visible');
					
					//Store if editor toolbar should be shown when properties form is closed
					this.open_toolbar_on_hide = has_html_inputs; // && toolbar_currenly_visible;
					
					if (toolbar_currenly_visible) {
						Manager.EditorToolbar.hide();
					}
				}
				
				//Scrollable
				this.set('scrollable', options.scrollable);
				
				//Title
				this.set('title', options.title || '');
				
				//Icon
				this.set('icon', options.icon);
				
				//Update slideshow position 
				var slideshow = form.get('slideshow'); 
				if (slideshow) { 
					slideshow.syncUI(); 
				}
			}
		}
	});
	

});
