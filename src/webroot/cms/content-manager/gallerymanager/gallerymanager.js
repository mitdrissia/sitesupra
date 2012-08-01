//Invoke strict mode
"use strict";

Supra('dd-delegate', 'dd-drop-plugin', 'dd-constrain', 'dd-proxy', function (Y) {

	//Shortcuts
	var Manager = Supra.Manager;
	var Action = Manager.Action;
	
	//Add as child, when EditorToolbar will be hidden GalleryManager will be hidden also (page editing is closed)
	Manager.getAction('EditorToolbar').addChildAction('GalleryManager');
	
	
	//Create Action class
	new Action(Action.PluginContainer, Action.PluginMainContent, {
		
		/**
		 * Unique action name
		 * @type {String}
		 * @private
		 */
		NAME: 'GalleryManager',
		
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
		 * Image preview size
		 * @type {String}
		 * @private
		 */
		PREVIEW_SIZE: '200x200',
		
		/**
		 * Image to show when image is broken
		 * @type {String}
		 * @private
		 */
		PREVIEW_BROKEN: '/cms/content-manager/gallerymanager/images/icon-broken-large.png',
		
		
		
		/**
		 * Gallery data
		 * @type {Object}
		 * @private
		 */
		data: {},
		
		/**
		 * Callback function
		 * @type {Function}
		 * @private
		 */
		callback: null,
		
		/**
		 * Image property list
		 * 
		 * @type {Array}
		 * @private
		 */
		image_properties: null,
		
		
		
		/**
		 * Last drag X position
		 * @type {Number}
		 * @private
		 */
		lastDragX: 0,
		dragGoingUp: false,
		
		/**
		 * Settings form
		 * @type {Object}
		 * @private
		 */
		settings_form: null,
		
		/**
		 * Scrollable instance
		 * @type {Object}
		 * @private
		 */
		scrollable: null,
		
		/**
		 * Selected image data
		 * @type {Object}
		 * @private
		 */
		selected_image_data: null,
		
		/**
		 * Image inputs
		 * @type {Object}
		 * @private
		 */
		inputs: {},
		
		/**
		 * UI input values are changing
		 * @type {Boolean}
		 * @private
		 */
		ui_updating: false,
		
		/**
		 * List node
		 * @type {Object}
		 * @private
		 */
		list: null,
		
		/**
		 * List item for marking drop place
		 * @type {Object}
		 * @private
		 */
		listItemDropMarker: null,
		
		/**
		 * @private
		 */
		widgets: {},
		
		
		/**
		 * Initialize
		 * @private
		 */
		initialize: function () {
			
			
			//On visibility change update container class and disable/enable toolbar
			this.on('visibleChange', function (evt) {
				if (evt.newVal) {
					this.one().removeClass('hidden');
				} else {
					this.one().addClass('hidden');
					this.callback = null;
					this.data = null;
				}
				
				if (this.settings_form && this.settings_form.get('visible')) {
					Manager.PageContentSettings.hide();
				}
				Manager.getAction('EditorToolbar').set('disabled', evt.newVal);
			}, this);
		},
		
		/**
		 * Render widgets
		 * @private
		 */
		render: function () {
			//Add buttons to toolbar
			Manager.getAction('PageToolbar').addActionButtons(this.NAME, [{
				'id': 'gallery_manager_insert',
				'type': 'button',
				'title': Supra.Intl.get(['gallerymanager', 'insert']),
				'icon': '/cms/lib/supra/img/toolbar/icon-image.png',
				'action': this,
				'actionFunction': 'openMediaLibrary'
			}]);
			
			//Add side buttons
			Manager.getAction('PageButtons').addActionButtons(this.NAME, [{
				'id': 'done',
				'context': this,
				'callback': function () {
					this.applyChanges();
				}
			}]);
			
			//Scrollable
			this.scrollable = new Supra.Scrollable({
				'srcNode': this.one('div.scrollable')
			});
			
			this.scrollable.render();
			this.layout.on('sync', this.scrollable.syncUI, this.scrollable);
					
			//Bind inline editables
			var list = this.list = this.one('ul.list');
			list.delegate('click', this.createInlineEditable, 'p.inline', this);
			list.delegate('click', this.handleImageClick, 'li.gallery-item span.img', this);
			
			list.on('dragenter', this.listDragEnter, this);
			list.on('dragleave', this.listDragLeave, this);
			list.delegate('dragenter', this.listItemDragEnter, 'span.img b', this);
			list.delegate('dragleave', this.listItemDragLeave, 'span.img b', this);
			
			var marker = this.listItemDropMarker = Y.Node.create('<li class="gallery-marker"><div></div></li>');
			list.append(marker);
			
			this.bindDragDrop();
		},
		
		/**
		 * Returns image property by ID or null
		 * 
		 * @param {String} id Property ID
		 * @return Property info
		 * @type {Object}
		 * @private
		 */
		getImageProperty: function (id) {
			var properties = this.image_properties,
				i = 0,
				ii = properties.length;
			
			for (; i<ii; i++) {
				if (properties[i].id == id) return properties[i];
			}
			
			return null;
		},
		
		/**
		 * Returns image data by list node
		 * 
		 * @param {Object} node Y.Node instance
		 * @return Image data
		 * @type {Object}
		 * @private
		 */
		getImageDataByNode: function (node) {
			return this.getImageDataById(node.getData('imageId'));
		},
		
		/**
		 * Returns image data by ID
		 * 
		 * @param {String} image_id Image ID
		 * @return Image data
		 * @type {Object}
		 * @private
		 */
		getImageDataById: function (image_id) {
			var data = this.data,
				image_data = null;
			
			for (var i=0,ii=data.images.length; i<ii; i++) {
				if (data.images[i].image.id == image_id) {
					image_data = data.images[i];
					break;
				}
			}

			return image_data;
		},
		
		/**
		 * Returns image node by ID
		 * 
		 * @param {String} id Image ID
		 * @return Image node
		 * @type {Object}
		 * @private
		 */
		getImageNodeById: function (id) {
			return this.one('li[data-id="' + id + '"]');
		},
		
		
		/*
		 * ---------------------------------- IMAGE SETTINGS FORM ------------------------------------
		 */
		
		
		/**
		 * Generate settings form
		 */
		createSettingsForm: function () {
			//Get form placeholder
			var content = Manager.getAction('PageContentSettings').get('contentInnerNode');
			if (!content) return;
			
			//Properties form
			var properties = this.image_properties,
				form_config = {
					'inputs': properties,
					'style': 'vertical'
				};
			
			var form = new Supra.Form(form_config);
				form.render(content);
				form.hide();
			
			//On input value change update inline inputs and labels
			var ii = properties.length,
				i = 0;
			
			for (; i<ii; i++) {
				if (properties[i].type === 'String') {
					form.getInput(properties[i].id).on('valueChange', this.afterSettingsFormInputChange, this);
				}
			}
			
			//Manage button
			var btn = this.widgets.manageButton = new Supra.Button({'label': Supra.Intl.get(['gallerymanager', 'manage']), 'style': 'small'});
				btn.render(form.get('contentBox'));
				btn.on('click', this.openMediaLibraryForReplace, this);
				
			//Button separator
			form.get('contentBox').append('<br />');
				
			//Delete button
			var btn = this.widgets.deleteButton = new Supra.Button({'label': Supra.Intl.get(['buttons', 'delete']), 'style': 'small-red'});
				btn.render(form.get('contentBox'));
				btn.addClass('su-button-delete');
				btn.on('click', this.removeSelectedImage, this);
			
			this.settings_form = form;
			
			return form;
		},
		
		/**
		 * Destroy settings form
		 */
		destroySettingsForm: function () {
			if (this.settings_form) {
				var bounding = this.settings_form.get('boundingBox');
				this.settings_form.destroy();
				this.settings_form = null;
				bounding.remove(true);
			}
		},
		
		/**
		 * After settings form input value changes update image list item UI
		 * 
		 * @param {Event} e Event facade object
		 * @private
		 */
		afterSettingsFormInputChange: function (e) {
			//Don't do anything if all form values are being set
			if (!this.ui_updating && this.selected_image_data) {
				var input = e.target,
					property = input.get('id'),
					value = input.get('value');
				
				this.selected_image_data[property] = value;
				this.updateInlineEditableUI(this.selected_image_data.id);
			}
		},
		
		/**
		 * Remove selected image
		 */
		removeSelectedImage: function () {
			this.removeImage(this.selected_image_data.id);
		},
		
		/**
		 * Show image settings bar
		 */
		showImageSettings: function (target) {

			if (target.test('.gallery')) return false;
			target = target.closest('li');
			
			var data = this.getImageDataByNode(target);
			
			if (this.settings_form && this.settings_form.get('visible')) {
				if (this.selected_image_data && this.selected_image_data.id != data.id) {
					//Save previous image data
					this.settingsFormApply(true);
				}
			}
			
			if (!data) {
				Y.log('Missing image data for image ' + target.getAttribute('src'), 'debug');
				return false;
			}
			
			this.ui_updating = true;
			
			//Make sure PageContentSettings is rendered
			var form = this.settings_form || this.createSettingsForm(),
				action = Manager.getAction('PageContentSettings');
			
			if (!form) {
				if (action.get('loaded')) {
					if (!action.get('created')) {
						action.renderAction();
						this.showImageSettings(target);
					}
				} else {
					action.once('loaded', function () {
						this.showImageSettings(target);
					}, this);
					action.load();
				}
				return false;
			}
			
			action.execute(form, {
				'doneCallback': Y.bind(this.settingsFormApply, this),
				
				'title': Supra.Intl.get(['htmleditor', 'image_properties']),
				'scrollable': true
			});
			
			this.selected_image_data = data;

			this.settings_form.resetValues()
							  .setValuesObject(data.properties, 'id');
							  
			if (this.widgets.deleteButton) {
				if (this.shared) {
					this.widgets.deleteButton.hide();
				} else {
					this.widgets.deleteButton.show();
				}
			}
			
			this.ui_updating = false;
			
			return true;
		},
		
		/**
		 * Hide properties form
		 */
		settingsFormApply: function (dont_hide) {
			if (this.settings_form && this.settings_form.get('visible')) {
				var image_data_from_form = this.settings_form.getValuesObject('id');
				
				// Fix image path (#6624)
				if (image_data_from_form.image) {
					image_data_from_form.image.path = this.selected_image_data.image.path;
				}
				
				var image_data = Supra.mix(this.selected_image_data, image_data_from_form),
					data = this.data;
				
				image_data.properties = Supra.mix(image_data.properties, this.settings_form.getValuesObject('id'))
				
				for (var i=0,ii=data.images.length; i<ii; i++) {
					if (data.images[i].image.id == image_data.image.id) {
						data.images[i] = image_data;
						this.updateInlineEditableUI(image_data.image.id);
						break;
					}
				}
				
				if (dont_hide !== true) {
					this.settingsFormCancel();
				}
			}
		},
		
		settingsFormCancel: function () {
			if (this.settings_form && this.settings_form.get('visible')) {
				Manager.PageContentSettings.hide();
				this.selected_image_data = null;
			}
		},
		
		
		/*
		 * ---------------------------------- DRAG AND DROP ------------------------------------
		 */
		
		
		/**
		 * Bind drag & drop event listeners
		 */
		bindDragDrop: function () {
			//Initialize drag and drop
			Manager.PageContent.initDD();
			
			var fnDragDrag = Y.bind(this.onDragDrag, this),
				fnDragStart = Y.bind(this.onDragStart, this),
				fnDropOver = Y.bind(this.onDropOver, this);
			
			var del = this.dragDelegate = new Y.DD.Delegate({
				container: '#galleryManagerList',
				nodes: 'li',
				target: {},
				dragConfig: {
					haltDown: false
				}
			});
			del.dd.plug(Y.Plugin.DDProxy, {
				moveOnEnd: false,
				cloneNode: true
			});
			
			del.dd.addInvalid('P'); // P is used in inline editables

			del.on('drag:drag', fnDragDrag);
			del.on('drag:start', fnDragStart);
			del.on('drag:over', fnDropOver);
			
			//Drop from media library, add image or images
			var srcNode = this.one();
			srcNode.on('dataDrop', this.onImageDrop, this);
			
			//Enable drag & drop
			this.drop = new Manager.PageContent.PluginDropTarget({
				'srcNode': srcNode,
				'doc': document
			});
		},
		
		/**
		 * On image or folder drop add images to the list
		 * 
		 * @param {Event} e Event facade object
		 * @private
		 */
		onImageDrop: function (e) {
			if (!Manager.MediaSidebar) {
				//If media sidebar is not loaded, then user didn't droped image from there
				//Prevent default (which is insert folder thumbnail image) 
				if (e.halt) e.halt();
				return false;
			}
			
			var item_id = e.drag_id,
				item_data = Manager.MediaSidebar.getData(item_id),
				image = null,
				dataObject = Manager.MediaSidebar.medialist.get('dataObject'),
				replace_id = null;
			
			if (e.drop.closest('b')) {
				//Image was dropped on existing item
				var node_li = e.drop.closest('li.gallery-item');
				if (node_li) {
					node_li.removeClass('gallery-item-over');
					replace_id = node_li.getData('imageId');
				}
			}
			
			//Unmark list
			this.list.removeClass('gallery-over');
			
			if (item_data) {
				if (item_data.type == Supra.MediaLibraryData.TYPE_IMAGE) {
					
					//Add single image
					if (item_data.sizes) {
						if (replace_id) {
							this.replaceImage(replace_id, item_data);
						} else {
							this.addImage(item_data);
						}
					} else {
						dataObject.once('load:complete:' + item_data.id, function(event) {
							if (event.data) {
								this.onImageDrop(e);
							}
						}, this);
					}
					
				} else if (item_data.type == Supra.MediaLibraryData.TYPE_FOLDER) {
					
					if ( ! dataObject.hasData(item_data.id) || (item_data.children_count && ! item_data.children.length)) {
						dataObject.once('load:complete:' + item_data.id, function(event) {
							if (event.data) {
								this.onImageDrop(e);
							}
						}, this);
						
						return;
						
					} else {
						
						var folderHasImages = false;
	
						//Add all images from folder
						for(var i in item_data.children) {
							image = item_data.children[i];
							if (image.type == Supra.MediaLibraryData.TYPE_IMAGE) {
								
								if (replace_id) {
									//Replace with first image, all other add to the list
									this.replaceImage(replace_id, item_data.children[i]);
									replace_id = null;
								} else {
									if ( ! image.sizes) {
										dataObject.once('load:complete:' + image.id, function(event) {
											if (event.data && event.data.length) {
												image = event.data.shift();
												this.addImage(image);
											}
										}, this);
										
										dataObject.loadData(image.id, [], 'view');
									} else {
										this.addImage(image);
									}
								}
								
								folderHasImages = true;
							}
						}
	
						//folder was without images
						if ( ! folderHasImages) {
							Supra.Manager.executeAction('Confirmation', {
								'message': '{#medialibrary.validation_error.empty_folder_drop#}',
								'useMask': true,
								'buttons': [
									{'id': 'delete', 'label': 'Ok'}
								]
							});
	
							return;
						}
					}
				}
			}
			
			//Prevent default (which is insert folder thumbnail image) 
			if (e.halt) e.halt();
			
			return false;
		},
		
		/**
		 * Handle drag:drag event
		 * 
		 * @param {Object} evt Event
		 * @private
		 */
		onDragDrag: function (evt) {
			if (this.shared) return;
			var x = evt.target.lastXY[0];
			
			this.dragGoingUp = (x < this.lastDragX);
		    this.lastDragX = x;
		},
		
		/**
		 * Handle drag:start event
		 * 
		 * @param {Object} evt Event
		 * @private
		 */
		onDragStart: function (evt) {
			if (this.shared) return;
			//Get our drag object
	        var drag = evt.target;
			
	        //Set some styles here
	        drag.get('dragNode').addClass('gallery-item-proxy');
		},
		
		/**
		 * Handle drop:over event
		 * 
		 * @param {Object} evt Event
		 * @private
		 */
		onDropOver: function (evt) {
			if (this.shared) return;
			
			//Get a reference to our drag and drop nodes
		    var drag = evt.drag.get('node'),
		        drop = evt.drop.get('node');
			
		    //Are we dropping on a li node?
		    if (drop.get('tagName').toLowerCase() === 'li' && drop.hasClass('gallery-item')) {
			    //Are we not going up?
		        if (!this.dragGoingUp) {
		            drop = drop.get('nextSibling');
		        }
				if (!this.dragGoingUp && !drop) {
			        evt.drop.get('node').get('parentNode').append(drag);
				} else {
			        evt.drop.get('node').get('parentNode').insertBefore(drag, drop);
				}
				
		        //Resize this nodes shim, so we can drop on it later.
		        evt.drop.sizeShim();
		    }
		},
		
		/**
		 * Image or folder from media library dragged over an item
		 * 
		 * @param {Event} e Event facade object
		 * @private 
		 */
		listItemDragEnter: function (e) {
			if (this.shared) return;
			
			if (e.target.test('b')) {
				var target = e.target.closest('LI');
				target.addClass('gallery-item-over');
			}
		},
		
		/**
		 * Image or folder from media library dragged out of item
		 * 
		 * @param {Event} e Event facade object
		 * @private 
		 */
		listItemDragLeave: function (e) {
			if (this.shared) return;
			
			if (e.target.test('b')) {
				var target = e.target.closest('LI');
				target.removeClass('gallery-item-over');
			}
		},
		
		
		/**
		 * Drag mouse over position
		 * @type {String}
		 * @private
		 */
		listDragOver: null,
		
		/**
		 * Image or folder from media library dragged over an item
		 * 
		 * @param {Event} e Event facade object
		 * @private 
		 */
		listDragEnter: function (e) {
			if (this.shared) return;
			
			if (e.target.closest('span.img')) {
				this.listDragOver = 'item';
				this.list.removeClass('gallery-over');
			} else if (e.target.closest('ul.list')) {
				this.listDragOver = 'list';
				this.list.addClass('gallery-over').append(this.listItemDropMarker);
			} else {
				this.listDragOver = 'none';
			}
		},
		
		/**
		 * Image or folder from media library dragged out of item
		 * 
		 * @param {Event} e Event facade object
		 * @private 
		 */
		listDragLeave: function (e) {
			if (this.shared) return;
			
			if (this.listDragOver) {
				//Left some element
				this.listDragOver = null;
			} else {
				//Actually left list
				this.list.removeClass('gallery-over');
			}
		},
		
		
		/*
		 * ---------------------------------- INLINE EDITABLE ------------------------------------
		 */
		
		
		/**
		 * When p.inline is clicked replace it with inline editable input
		 * 
		 * @private
		 */
		createInlineEditable: function (e) {
			var node = e.target.closest('p'),
				node_li = node.closest('LI'),
				data = this.getImageDataByNode(node_li),
				image_id = node.getAttribute('data-image-id'),
				property_id = node.getAttribute('data-property-id'),
				property = this.getImageProperty(property_id),
				label = Supra.Intl.get(['gallerymanager', 'click_here']).replace('{label}', property.label.toLowerCase()),
								
				input = new Supra.Input.String({
					'useReplacement': true,
					'value': data.properties[property_id]
				});
			
			//Save input
			this.inputs[image_id] = this.inputs[image_id] || {};
			this.inputs[image_id][property_id] = input;
			
			//On focus show sidebar
			input.on('focus', function () {
				this.showImageSettings(node_li);
			}, this);
			
			//On blur set default label if value is empty
			input.on('blur', function () {
				var value = this.get('value');
				
				if (!value) {
					this.get('replacementNode').set('text', label).addClass('empty');
				} else {
					this.get('replacementNode').removeClass('empty');
				}
			});
			
			//On change update data
			input.on('change', function () {
				if (!this.ui_updating) {
					var images = this.data.images,
						i = 0,
						ii = images.length,
						value = null;
					
					for (; i<ii; i++) {
						if (images[i].id == image_id) {
							value = input.get('value');
							images[i][property_id] = value;
							
							//Update settings form
							if (this.settings_form && this.settings_form.get('visible')) {
								this.ui_updating = true;
								this.settings_form.getInput(property_id).set('value', value);
								this.ui_updating = false;
							}
							
							break;
						}
					}
				}
			}, this);
			
			node.set('text', '');
			node.removeClass('inline');
			input.render(node);
			input._onFocus();
			
			if (!data[property_id]) {
				input.get('replacementNode').set('text', label).addClass('empty');
			}
			
			this.showImageSettings(node_li);
		},
		
		/**
		 * Update labels, etc.
		 * 
		 * @param {String} image_id Image ID
		 * @private
		 */
		updateInlineEditableUI: function (image_id, ignore_inputs, ignore_labels) {
			var node = this.getImageNodeById(image_id),
				node_label = null,
				image_data = this.getImageDataById(image_id),
				inputs = this.inputs[image_id],
			
				properties = this.image_properties,
				label = null;
			
			//Update inputs
			if (!ignore_inputs && inputs) {
				this.ui_updating = true;
				
				for (var key in inputs) {
					inputs[key].set('value', image_data.properties[key]);
					inputs[key].fire('blur');
				}
				
				this.ui_updating = false;
			}
			
			//Update p.inline which hasn't been converted into inputs
			if (!ignore_labels && node) {
				for (var p=0, pp=properties.length; p<pp; p++) {
					if (properties[p].type == 'String') {
						node_label = node.one('p.inline.' + properties[p].id);
						if (node_label) {
							if (image_data.properties[properties[p].id]) {
								node_label.removeClass('empty').set('text', image_data.properties[properties[p].id]);
							} else {
								label = Supra.Intl.get(['gallerymanager', 'click_here']).replace('{label}', properties[p].label.toLowerCase()),
								node_label.addClass('empty').set('text', label);
							}
						}
					}
				}
			}
		},
		
		
		/*
		 * ---------------------------------- EXTERNAL INTERFACES ------------------------------------
		 */
		
		
		/**
		 * Open media library sidebar
		 * @private
		 */
		openMediaLibrary: function () {
			if (this.shared) return;
			
			Manager.getAction('MediaSidebar').execute({
				'onselect': Y.bind(function (event) {
					this.addImage(event.image);
				}, this)
			});
			
		},
		
		/**
		 * Open media library sidebar for image replace
		 * @private
		 */
		openMediaLibraryForReplace: function (e) {
			if (this.shared) return;
			
			var image_id = this.selected_image_data.id,
				data = this.selected_image_data,
				path = [];
			
			path = path.concat(data.image.path);
			path.push(data.image.id);
			
			Manager.getAction('MediaSidebar').execute({
				'onselect': Y.bind(function (event) {
					this.replaceImage(image_id, event.image);
				}, this),
				'item': path
			});
			
		},
		
		
		/*
		 * ---------------------------------- IMAGE LIST ------------------------------------
		 */
		
		
		/**
		 * On image click show settings form
		 * 
		 * @param {Event} event Event facade object
		 * @private
		 */
		handleImageClick: function (event) {
			var node = event.target.closest('li');
			this.showImageSettings(node);
		},
		
		/**
		 * Replace image
		 * 
		 * @param {String} id Image ID
		 * @param {Object} image New image data
		 * @private
		 */
		replaceImage: function (id, image) {
			//Image image with which user is trying to replace already
			//exists in the list, then skip
			if (!this.addImage(image)) return false;
			
			var old_data = this.getImageDataById(id),
				new_data = this.getImageDataById(image.id),
				old_node = this.getImageNodeById(id),
				new_node = this.getImageNodeById(image.id),
				properties = this.image_properties;
			
			for (var i=0, ii=properties.length; i<ii; i++) {
				new_data.properties[properties[i].id] = old_data.properties[properties[i].id];
			}
			
			old_node.insert(new_node, 'before');
			
			this.removeImage(id);
			this.updateInlineEditableUI(image.id);
			
			return true;
		},
		
		/**
		 * Remove image by ID
		 * 
		 * @param {String} image_id Image ID
		 * @private
		 */
		removeImage: function (image_id) {
			var images = this.data.images;
			
			for(var i=0,ii=images.length; i<ii; i++) {
				if (images[i].id === image_id) {
					this.list.one('li[data-id="' + image_id + '"]').remove();
					this.data.images.splice(i,1);
					this.settingsFormCancel();
					this.scrollable.syncUI();
					return true;
				}
			}
			
			Y.log('GalleryManager image which was supposed to be selected is not in image list');
			return false;
		},
		
		/**
		 * Render image list
		 * 
		 * @param {Object} data Data
		 * @private
		 */
		renderData: function () {
			var list = this.list,
				images = this.data.images,
				preview_size = this.PREVIEW_SIZE,
				src,
				item;
			
			//Remove old data
			list.all('LI').remove();
			list.append(this.listItemDropMarker);
			
			//Remove old inputs
			var inputs = this.inputs,
				key = null,
				name = null;
			
			if (inputs) {
				for (key in inputs) {
					for (name in inputs[key]) {
						inputs[key][name].destroy();
					}
				}
			}
			
			this.inputs = {};
			
			//Add new items
			for(var i=0,ii=images.length; i<ii; i++) {
				this.renderItem(images[i]);
			}
			
			this.dragDelegate.syncTargets();
			this.scrollable.syncUI();
		},
		
		/**
		 * Render image item
		 * 
		 * @param {Object} data Image data
		 * @private
		 */
		renderItem: function (data) {
			var src = null,
				preview_size = this.PREVIEW_SIZE,
				list = this.list,
				item = null,
				properties = this.image_properties,
				html = '',
				html_img = '',
				label = Supra.Intl.get(['gallerymanager', 'click_here']),
				value = null,
				propertyData = data.properties;
			
			if (data.image.sizes && preview_size in data.image.sizes) {
				src = data.image.sizes[preview_size].external_path;
			} else {
				src = this.PREVIEW_BROKEN;
			}
			
			//HTML for inline editable inputs
			for (var i=0, ii=properties.length; i<ii; i++) {
				if (properties[i].type == 'String') {
					if (propertyData[properties[i].id] && propertyData[properties[i].id]) {
						html += '<p title="" class="inline ' + properties[i].id + '" data-property-id="' + properties[i].id + '" data-image-id="' + data.image.id + '">' + Y.Escape.html(propertyData[properties[i].id]) + '<p>';
					} else {
						value = label.replace('{label}', properties[i].label.toLowerCase());
						html += '<p title="" class="inline empty ' + properties[i].id + '" data-property-id="' + properties[i].id + '" data-image-id="' + data.image.id + '">' + value + '<p>';
					}
				}
			}
			
			//HTML for image (center, handle error)
			html_img = '<span class="img"><i></i><img src="' + src + '" alt="" onerror="this.src=\'' + this.PREVIEW_BROKEN + '\'" /><b>' + Supra.Intl.get(['gallerymanager', 'drop_replace']) + '</b></span>';
			
			item = Y.Node.create('<li class="yui3-dd-drop gallery-item" data-id="' + data.image.id + '" title="' + Supra.Intl.get(['gallerymanager', 'click_here_edit']) + '">' + html_img + html + '</li>');
			item.setData('imageId', data.image.id);
			list.append(item);
		},
		
		/**
		 * Add image
		 * 
		 * @param {Object} image_data Image data
		 * @private
		 */
		addImage: function (image_data) {
			var images = this.data.images,
				properties = this.image_properties,
				property = null,
				image  = {
					'image': image_data,
					'id': image_data.id,
					'properties': {}
				};
			
			//Check if image doesn't exist in data already
			for (var i=0, ii=images.length; i<ii; i++) {
				if (images[i].image.id == image_data.id) return false;
			}
			
			for (var i=0, ii=properties.length; i<ii; i++) {
				property = properties[i].id;
				image.properties[property] = image_data[property] || properties[i].value || '';
			}
			
			//If image has property named "title", replace property value with image filename
			if (image.properties && typeof(image.properties.title) !== 'undefined') {
				image.properties.title = image_data.filename;
			}
			
			images.push(image);
			this.renderItem(image);
			
			this.dragDelegate.syncTargets();
			this.scrollable.syncUI();
			
			return true;
		},
		
		/**
		 * Apply changes
		 * 
		 * @private
		 */
		applyChanges: function () {
			var items = this.all('li'),
				order = {},
				data = this.data;
			
			//Get image order
			if (items.size()) {
				items.each(function (item, index) {
					order[this.getData('imageId')] = index;
				});
			}
			
			//Sort images array
			data.images.sort(function (a, b) {
				var oa = order[a.image.id],
					ob = order[b.image.id];
				
				return oa > ob ? 1 : -1;
			});
			
			Manager.getAction('PageToolbar').unsetActiveAction(this.NAME);
			Manager.getAction('PageButtons').unsetActiveAction(this.NAME);
			
			if (this.callback) {
				this.callback(data, true);
			}
			
			this.destroySettingsForm();
			this.hide();
		},
		
		/**
		 * Cancel changes
		 * 
		 * @private
		 */
		cancelChanges: function () {
			
			Manager.getAction('PageToolbar').unsetActiveAction(this.NAME);
			Manager.getAction('PageButtons').unsetActiveAction(this.NAME);
			
			if (this.callback) {
				this.callback(this.data, false);
			}
			
			this.hide();
		},
		
		/**
		 * Execute action
		 * 
		 * @param {Object} options Gallery options: data, callback, context, block
		 */
		execute: function (options) {
			options = Supra.mix({
				'data': {},
				'callback': null,
				'context': null,
				'properties': [],
				'shared': false
			}, options);
			
			if (!Manager.getAction('PageToolbar').inHistory(this.NAME)) {
				Manager.getAction('PageToolbar').setActiveAction(this.NAME);
				Manager.getAction('PageButtons').setActiveAction(this.NAME);
			}
			
			this.shared = options.shared;
			
			this.callback = options.callback ? (options.context ? Y.bind(options.callback, options.context) : options.callback) : null;
			
			this.data = options.data;
			this.image_properties = options.properties || [];
			
			this.renderData();

			var insertButton = Manager.getAction('PageToolbar').getActionButton('gallery_manager_insert');
			
			// if gallery is shared, hide insert button
			if (this.shared) {
				insertButton.hide();
			} else {
				insertButton.show();
			}

			this.show();
		}
		
	});
	
});
