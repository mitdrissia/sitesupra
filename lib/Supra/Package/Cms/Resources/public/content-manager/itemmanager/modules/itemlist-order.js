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
YUI.add('itemmanager.itemlist-order', function (Y) {
	//Invoke strict mode
	"use strict";
	
	//Shortcut
	var Manager = Supra.Manager,
		Action = Manager.PageContent;
	
	/*
	 * Editable content
	 */
	function ItemListOrder (config) {
		ItemListOrder.superclass.constructor.apply(this, arguments);
	}
	
	ItemListOrder.NAME = 'itemmanager-itemlist-order';
	ItemListOrder.NS = 'order';
	
	ItemListOrder.ATTRS = {
		'disabled': {
			value: false
		}
	};
	
	Y.extend(ItemListOrder, Y.Plugin.Base, {
		
		/**
		 * Drag delegation
		 * @type {Object}
		 * @private
		 */
		dragDelegate: null,
		
		/**
		 * Drag and drop direction
		 * @type {Boolean}
		 * @private
		 */
		dragGoingUp: false,
		
		/**
		 * Last known drag node index
		 * @type {Number}
		 * @private
		 */
		lastDragIndex: 0,
		
		
		/**
		 * 
		 */
		initializer: function () {
			var itemlist = this.get('host'),
				container = itemlist.get('contentElement');
			
			this.listeners = [];
			this.listeners.push(itemlist.after('contentElementChange', this.reattachListeners, this));
			
			if (container) {
				this.reattachListeners();
			}
		},
		
		destructor: function () {
			this.resetAll();
			
			// Listeners
			var listeners = this.listeners,
				i = 0,
				ii = listeners.length;
			
			for (; i < ii; i++) listeners[i].detach();
			this.listeners = null;
		},
		
		/**
		 * Returns list item order as id -> index hash map
		 *
		 * @returns {Object} Item order
		 */
		getOrder: function () {
			var container = this.get('host').get('contentElement'),
				order     = {};
			
			if (container) {
				container.all('[data-item]').each(function (node, index) {
					order[node.getAttribute('data-item')] = index;
				});
			}
			
			return order;
		},
		
		/**
		 * Attach drag and drop listeners
		 */
		reattachListeners: function () {
			if (this.get('disabled')) return;
			
			var itemlist = this.get('host'),
				container = itemlist.get('contentElement');
			
			if (!container) {
				// Nothing to attach listeneres to
				return;
			}
			
			var fnDragDrag = Y.bind(this.onDragDrag, this),
				fnDragStart = Y.bind(this.onDragStart, this),
				fnDropOver = Y.bind(this.onDropOver, this),
				
				del = null;
			
			// Set iframe document as main one
			Y.DD.DDM.regDoc(itemlist.get('iframe').get('doc'));
			
			// Faster and easier than create separate dragables
			del = this.dragDelegate = new Y.DD.Delegate({
				container: container,
				nodes: '[data-item]',
				target: {},
				dragConfig: {
					haltDown: false
				}
			});
			
			// There is most likely overflow:hidden set on the list, need to use proxy
			del.dd.plug(Y.Plugin.DDProxy, {
				moveOnEnd: false,
				cloneNode: true
			});
			
			// Inline editable shouldn't trigger drag
			del.dd.addInvalid('.su-input-string-inline-focused');
			del.dd.addInvalid('.su-input-text-inline-focused');
			del.dd.addInvalid('.su-input-html-inline-focused');
			del.dd.addInvalid('.su-input-image-inline-focused');
			del.dd.addInvalid('.supra-image-editing');
			
			del.on('drag:drag', fnDragDrag);
			del.on('drag:start', fnDragStart);
			del.on('drag:over', fnDropOver);
			
			// On new item add or remove sync targets
			itemlist.on('item:add', this.dragDelegate.syncTargets, this.dragDelegate);
			itemlist.on('item:remove', this.dragDelegate.syncTargets, this.dragDelegate);
		},
		
		/**
		 * Reset all iframe content bindings, etc.
		 */
		resetAll: function () {
			var dragDelegate = this.dragDelegate;
			
			if (dragDelegate) {
				dragDelegate.destroy(true);
				this.dragDelegate = null;
			}
		},
		
		
		/* -------------- Drag and drop --------------- */
		
		
		/**
		 * Handle drag:start event
		 * 
		 * @param {Object} evt Event
		 * @private
		 */
		onDragStart: function (evt) {
			//Get our drag object
	        var drag = evt.target,
	        	proxy = drag.get('dragNode'),
	        	node = drag.get('node');
			
	        //Set proxy styles
	        proxy.addClass('supra-itemmanager-proxy');
	        
	        //Move proxy to body
	       	Y.Node(this.get('host').get('iframe').get('doc').body).append(proxy);
	        
	        this.lastDragIndex = node.get('parentNode').get('children').indexOf(node);
	        this.fire('dragStart');
		},
		
		/**
		 * Handle drag:drag event
		 * 
		 * @param {Object} evt Event
		 * @private
		 */
		onDragDrag: function (evt) {
			/*
			var x = evt.target.lastXY[0];
			
			this.dragGoingUp = (x < this.lastDragX);
		    this.lastDragX = x;
		    */
		},
		
		/**
		 * Handle drop:over event
		 * 
		 * @param {Object} evt Event
		 * @private
		 */
		onDropOver: function (evt) {
			//Get a reference to our drag and drop nodes
		    var drag = evt.drag.get('node'),
		        drop = evt.drop.get('node'),
		        index = 0,
		        dragGoingUp = false,
		        indexFrom = 0,
		        indexTo = 0;
			
		    //Are we dropping on a item node?
		    if (drop.test('[data-item]')) {
			    index = drop.get('parentNode').get('children').indexOf(drop);
			    dragGoingUp = index < this.lastDragIndex;
			    
			    indexFrom = Math.min(index, this.lastDragIndex);
			    indexTo = Math.max(index, this.lastDragIndex);
			    this.lastDragIndex = index;
			    
			    //Are we not going up?
		        if (!dragGoingUp) {
		            drop = drop.get('nextSibling');
		        }
		        
				if (!dragGoingUp && !drop) {
			        evt.drop.get('node').get('parentNode').append(drag);
				} else {
			        evt.drop.get('node').get('parentNode').insertBefore(drag, drop);
				}
				
		        //Resize node shims, so we can drop on them later since position may
		        //have changed
		        var nodes = drop.get('parentNode').get('children'),
		        	dropObj = null;
		        
		        for (var i=indexFrom; i<= indexTo; i++) {
		        	dropObj = nodes.item(i).drop;
		        	if (dropObj) {
		        		dropObj.sizeShim();
		        	}
		        }
		    }
		}
		
	});
	
	Supra.ItemManagerItemListOrder = ItemListOrder;
	
	//Since this widget has Supra namespace, it doesn't need to be bound to each YUI instance
	//Make sure this constructor function is called only once
	delete(this.fn); this.fn = function () {};
	
}, YUI.version, {requires: ['plugin', 'dd-delegate']});
