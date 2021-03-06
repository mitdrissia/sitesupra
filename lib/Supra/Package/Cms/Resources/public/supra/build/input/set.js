/**
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
 */
YUI.add('supra.input-set', function (Y) {
	//Invoke strict mode
	"use strict";
	
	/**
	 * List of input groups with controls to add or remove
	 * groups
	 */
	function Input (config) {
		Input.superclass.constructor.apply(this, arguments);
	}
	
	// Input is inline
	Input.IS_INLINE = false;
	
	// Input is inside form
	Input.IS_CONTAINED = true;
	
	Input.NAME = 'input-set';
	Input.CLASS_NAME = Input.CSS_PREFIX = 'su-' + Input.NAME;
	
	Input.ATTRS = {
		// Properties for each set
		'properties': {
			value: null
		},
		
		// Render widget into separate slide and add
		// button to the place where this widget should be
		'separateSlide': {
			value: true
		},
		
		// Button label to use instead of "Label"
		'labelButton': {
			value: ''
		},
		
		// Button icon to use
		'icon': {
			value: null
		},
		
		// Default value
		'defaultValue': {
			value: []
		}
	};
	
	Input.HTML_PARSER = {
		
	};
	
	Y.extend(Input, Supra.Input.Proto, {
		
		LABEL_TEMPLATE: null,
		INPUT_TEMPLATE: '<input type="hidden" value="" />',
		
		
		/**
		 * Slide content node
		 * @type {Object}
		 * @private
		 */
		_slideContent: null,
		
		/**
		 * Button to open slide
		 * @type {Object}
		 * @private
		 */
		_slideButton: null,
		
		/**
		 * Slide name
		 * @type {String}
		 * @private
		 */
		_slideId: null,
		
		/**
		 * List of set inputs
		 * @type {Object}
		 * @private
		 */
		_inputs: null,
		
		
		
		/**
		 * On desctruction life cycle clean up
		 * 
		 * @private
		 */
		destructor: function () {
			this._removeInputs();
			if (this._slideId) {
				var slideshow = this.getSlideshow();
				slideshow.removeSlide(this._slideId);
			}
			
			for (var id in this._inputs) {
				this._inputs[id].destroy(true);
			}
			
			this._slideContent = null;
			this._slideId = null;
			this._inputs = {};
			
			this._fireResizeEvent();
		},
		
		/**
		 * Life cycle method, render input
		 * 
		 * @private
		 */
		renderUI: function () {
			this._inputs = {};
			
			if (this.get('separateSlide')) {
				var slideshow = this.getSlideshow();
				if (!slideshow) {
					this.set('separateSlide', false);
					Y.log('Unable to create new slide for Supra.Input.Set "' + this.get('id') + '", because slideshow can\'t be detected');
				} else {
					// Don't create description, we have a button
					this.DESCRIPTION_TEMPLATE = null;
				}
			}
			
			Input.superclass.renderUI.apply(this, arguments);
			
			// Remove <input /> node from DOM, it's not needed
			this.get('inputNode').remove();
			
			// Create slide or render data
			if (!this.get('separateSlide')) {
				this._renderInputs();
			} else {
				this._renderSlide();
				this._renderInputs();
			}
			
			// Set inital value
			var value = this.get('value');
			if (value) {
				this._applyValue(value);
			}
		},
		
		/**
		 * Life cycle method, attach event listeners
		 * 
		 * @private
		 */
		bindUI: function () {
			Input.superclass.bindUI.apply(this, arguments);
			
			// When slide is opened for first time create inputs
			if (this.get('separateSlide')) {
				// On button click open slide
				this._slideButton.on('click', this._openSlide, this);
				
				// Disabled change
				this.on('disabledChange', function (event) {
					this._slideButton.set('disabled', event.newVal);
				}, this);
			}
			
			// Change event
			this.on('valueChange', this._afterValueChange, this);
			this.on('propertiesChange', this._afterPropertiesChange, this);
		},
		
		
		/*
		 * ------------------------- Properties ---------------------------
		 */
		
		/**
		 * Returns property by id
		 *
		 * @param {String} id Property id
		 * @param {Array} [arr] Array of properties
		 * @returns {Object|Null} Property
		 * @protected
		 */
		getProperty: function (id, arr) {
			var props = typeof arr === 'undefined' ? this.get('properties') : arr;
			if (!arr || !arr.length) return false;
			
			props = Y.Array.filter(props, function (value) {
				return value.id === id;
			});
			
			return props.length ? props[0] : null;
		},
		
		/**
		 * After properties change add/remove inputs
		 *
		 * @param {Object} e Event facade object 
		 * @protected
		 */
		_afterPropertiesChange: function (e) {
			var props = e.newVal,
				prevProps = e.prevVal || [],
				property,
				config,
				i = 0,
				ii = prevProps.length,
				
				inputs = this._inputs,
				input,
				
				id,
				container,
				form = this.getForm(),
				locator = form.get('propertyElementLocator'),
				data = this.get('value'),
				inputElement;
			
			for (; i<ii; i++) {
				if (prevProps[i].id in inputs) {
					// Either property is not in the new property list or input is not valid anymore and should be recreated
					if (!props || !this.getProperty(prevProps[i].id, props) || !form.testInlineInputValidity(inputs[prevProps[i].id])) {
						// Remove input
						form.fire('input:remove', {
							'config': prevProps[i],
							'input': inputs[prevProps[i].id]
						});
						
						inputs[prevProps[i].id].destroy(true /* destroy all nodes */);
						delete(inputs[prevProps[i].id]);
					}
				}
			}
			
			// Find which inputs are still missing and create them
			ii = props ? props.length : 0;
			
			if (ii) {
				container = this.getInputContainer();
				
				for (i=0; i<ii; i++) {
					property = props[i];
					id = property.id;
					
					if (!inputs[id]) {
						// Add input
						config = Supra.mix({}, property, {
							'id': property.id + '_' + Y.guid(),
							'name': property.id,
							'value': data[property.id],
							'parent': this,
							'containerNode': container,
							'disabled': this.get('disabled')
						});
						
						input = form.factoryField(config);
						
						if (input) {
							if (!Supra.Input.isContained(config.type)) {
								input.render();
							} else {
								input.render(container);
							}
							
							// @TODO Fix order
							
							input.after('valueChange', this._fireChangeEvent, this);
							input.on('input', this._fireInputEvent, this, id);
							
							inputs[id] = input;
						}
					} else {
						inputs[id].set('value', data[property.id]);
					}
				}
			}
			
			// Trigger change event
			this.fire('change', {'value': data});
		},
		
		_renderInputs: function () {
			this._afterPropertiesChange({'newVal': this.get('properties')}, {});
		},
		
		getInputContainer: function () {
			if (this.get('separateSlide')) {
				return this._slideContent;
			} else {
				return this.get('contentBox');
			}
		},
		
		/**
		 * Returns child input
		 * 
		 * @param {String} id Input id
		 * @returns {Object|Nul} Input widget
		 */
		getInput: function (id) {
			return this._inputs[id] || null;
		},
		
		/**
		 * Returns widgets for set
		 * 
		 * @param {Number} index Set index
		 * @returns {Object} List of all widgets for set
		 */
		getInputs: function () {
			return this._inputs;
		},
		
		/**
		 * Returns all inputs, including Collection and Set child inputs
		 * If key is 'array', then array is returned, otherwise object by input names
		 * 
		 * @returns {Array|Object} Inputs
		 */
		getAllInputs: function (key) {
			var inputs = this._inputs,
				obj,
				i;
			
			if (key === 'array') {
				obj = [];
				
				for (i in inputs) {
					obj.push(inputs[i]);
					
					if (inputs[i].getAllInputs) {
						obj = obj.concat(inputs[i].getAllInputs(key));
					}
				}
			} else {
				obj = {};
				
				for (i in inputs) {
					obj[inputs[i].getHierarhicalName()] = inputs[i];
					
					if (inputs[i].getAllInputs) {
						Supra.mix(obj, inputs[i].getAllInputs(key));
					}
				}
			}
			
			return obj;
		},
		
		/**
		 * Remove all inputs
		 *
		 * @protected
		 */
		_removeInputs: function () {
			var inputs = this._inputs,
				key,
				form = this.getForm();
			
			for (key in inputs) {
				if (inputs[key]) {
					form.fire('input:remove', {
						'config': this.getProperty(key),
						'input': inputs[key]
					});
					
					inputs[key].destroy(true /* destroy all nodes */);
				}
				delete(inputs[key]);
			}
		},
		
		
		/*
		 * ---------------------------------------- SLIDESHOW ----------------------------------------
		 */
		
		
		/**
		 * Add slide to the slideshow
		 * 
		 * @private
		 */
		_renderSlide: function () {
			var label = this.get('label'),
				labelButton = this.get('labelButton'),
				icon = this.get('icon'),
				
				slideshow = this.getSlideshow(),
				slide_id = this.get('id') + '_' + Y.guid(),
				slide = slideshow.addSlide({
					'id': slide_id,
					'title': label || labelButton
				});
			
			this._slideContent = slide.one('.su-slide-content');
			this._slideId = slide_id;
			
			// Button
			var button = new Supra.Button({
				'style': icon ? 'icon' : 'small',
				'label': labelButton || label,
				'icon': icon
			});
			
			button.addClass('button-section');
			button.render(this.get('contentBox'));
			
			if (this.get('disabled')) {
				button.set('disabled', true);
			}
			
			this._slideButton = button;
		},
		
		_openSlide: function () {
			var slideshow = this.getSlideshow();
			slideshow.set('slide', this._slideId);
		},
		
		/**
		 * Fire resize event
		 * 
		 * @param {Object} node Node which content changed
		 * @private
		 */
		_fireResizeEvent: function () {
			var container = null;
			
			if (this.get('separateSlide')) {
				container = this._slideContent;
			} else {
				container = this.get('contentBox');
			}
			
			if (container) {
				container = container.closest('.su-scrollable-content');
				
				if (container) {
					Supra.immediate(container, function () {
						this.fire('contentresize');
					});
				}
			}
		},
		
		
		/*
		 * ---------------------------------------- VALUE ----------------------------------------
		 */
		
		
		/**
		 * Trigger value change events
		 * 
		 * @private
		 */
		_fireChangeEvent: function () {
			this._silentValueUpdate = true;
			this.set('value', this.get('value'));
			this._silentValueUpdate = false;
		},
		
		_fireInputEvent: function (event, property) {
			this.fire('input', {
				'value': event.value,
				'property': property
			});
		},
		
		/**
		 * Apply value
		 * 
		 * @param {Object} value New value
		 * @private
		 */
		_applyValue: function (value) {
			// If we are updating 'value' then don't change UI
			// If inputs hasn't been rendered then we can't set value
			if (!this.get('rendered') || !this._inputs || this._silentValueUpdate) return value;
			
			var properties = this.get('properties'),
				property,
				i = 0,
				ii = properties.length,
				
				inputs = this._inputs,
				input;
			
			for (; i<ii; i++) {
				property = properties[i];
				input = inputs[property.id];
				
				if (input) {
					if (value && property.id in value) {
						input.set('value', value[property.id]);
					} else {
						input.resetValue();
					}
				}
			}
		},
		
		/**
		 * Value attribute setter
		 *
		 * @param {Object} value New attribute value
		 * @returns {Oject} Value
		 * @protected
		 */
		_setValue: function (value) {
			return value ? value : {};
		},
		
		/**
		 * Value attribute getter
		 * 
		 * @returns {Object} Value
		 * @private
		 */
		_getValue: function (value) {
			// If inputs hasn't been rendered then we can't get values from
			// inputs which doesn't exist
			if (!this.get('rendered')) return value;
			
			var properties = this.get('properties'),
				property,
				i = 0,
				ii = properties.length,
				
				inputs = this._inputs,
				values = {};
			
			for (; i<ii; i++) {
				property = properties[i];
				
				if (property.id in inputs) {
					values[property.id] = inputs[property.id].get('value');
				}
			}
			
			return values;
		},
		
		/**
		 * Save value attribute getter
		 * 
		 * @returns {Object} value
		 * @protected
		 */
		_getSaveValue: function () {
			// If inputs hasn't been rendered then we can't get values from
			// inputs which doesn't exist
			if (!this.get('rendered')) return this.get('value');
			
			var properties = this.get('properties'),
				property,
				i = 0,
				ii = properties.length,
				
				inputs = this._inputs,
				values = {};
			
			for (; i<ii; i++) {
				property = properties[i];
				
				if (property.id in inputs) {
					values[property.id] = inputs[property.id].get('saveValue');
				} else {
					values[property.id] = Supra.Input.getDefaultValue(property.type);
				}
			}
			
			return values;
		},
		
		_afterValueChange: function (evt) {
			if (!evt._event.silent) {
				this._applyValue(evt.newVal);
				this.fire('change', {'value': evt.newVal});
			}
		},
		
		/**
		 * Disable all child inputs
		 */
		_setDisabled: function (disabled) {
			Input.superclass._setDisabled.apply(this, arguments);
			if (!this.get('rendered')) return disabled;
			
			var properties = this.get('properties'),
				property,
				i = 0,
				ii = properties.length,
				inputs = this._inputs;
			
			for (; i<ii; i++) {
				property = properties[i];
				
				if (property.id in inputs) {
					inputs[property.id].set('disabled', disabled);
				}
			}
			
			return disabled;
		}
		
	});
	
	Supra.Input.Set = Input;
	
	//Since this widget has Supra namespace, it doesn't need to be bound to each YUI instance
	//Make sure this constructor function is called only once
	delete(this.fn); this.fn = function () {};
	
}, YUI.version, {requires:['supra.input-proto']});
