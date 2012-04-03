//Invoke strict mode
"use strict";

YUI().add('website.sitemap-tree-node-fake', function (Y) {
	
	//Shortcuts
	var Action = Supra.Manager.getAction('SiteMap'),
		TreeNode = Action.TreeNode;
	
	/**
	 * Proxy node for drag and drop
	 */
	function TreeNodeFake(config) {
		TreeNodeFake.superclass.constructor.apply(this, arguments);
	}
	
	TreeNodeFake.NAME = 'TreeNodeFake';
	TreeNodeFake.CSS_PREFIX = 'su-tree-node-fake';
	
	TreeNodeFake.ATTRS = {
		'tree': {
			'value': null
		},
		'view': {
			'value': null
		},
		
		'data': {
			'value': null
		},
		
		'groups': {
			'value': null
		},
		
		'dragable': {
			'value': true,
			'setter': '_setDragable'
		},
		
		'type': {
			'value': 'page'
		}
	};
	
	Y.extend(TreeNodeFake, Y.Widget, {
		/**
		 * No need for dooble 
		 */
		//'CONTENT_TEMPLATE': null,
		
		/**
		 * Drag and drop object
		 * @type {Object}
		 * @private
		 */
		'_dnd': null,
		
		/**
		 * Drag and drop target
		 * @type {Object}
		 * @private
		 */
		'_dndTarget': null,
		'_dndTargetNode': null,
		'_dndTargetPlace': null,
		
		
		/**
		 * Render UI
		 * 
		 * @private
		 */
		'renderUI': function () {
			
		},
		
		/**
		 * Attach event listeners
		 * 
		 * @private
		 */
		'bindUI': function () {
			//Drag and drop
			this._dndBind();
		},
		
		/**
		 * Apply widget state to UI
		 * 
		 * @private
		 */
		'syncUI': function () {
			
		},
		
		/**
		 * Clean up
		 * @private
		 */
		'destructor': function () {
			//Remove drag and drop
			this._dnd.destroy();
		},
		
		
		
		/**
		 * ------------------------------ PRIVATE ------------------------------
		 */
		
		
		
		//
		
		
		
		/**
		 * ------------------------------ DRAG & DROP ------------------------------
		 */
		
		
		
		/**
		 * Add drag and drop functionality
		 * 
		 * @private
		 */
		'_dndBind': function () {
			var groups = this.get('groups') || null;
			
			var dnd = this._dnd = new Y.DD.Drag({
				node: this.get('boundingBox'),
				dragMode: 'point',
				target: false,
				treeNode: this,
				groups: groups
			}).plug(Y.Plugin.DDProxy, {
				moveOnEnd: false,			// Don't move original node at the end of drag
				cloneNode: true
			});
			
			dnd.set('treeNode', this);
			
			if (!this.get('dragable')) {
				dnd.set('lock', true);
			}
			
			//Set special style to proxy node
			dnd.on('drag:start', this._dndStart);
			
			// When we leave drop target hide marker
			dnd.on('drag:exit', this.hideDropMarker, this);
			
			// When we move mouse over drop target update marker
			dnd.on('drag:over', this._dndOver, this);
			
			dnd.on('drag:end', this._dndEnd, this);
		},
		
		/**
		 * Adjust proxy position
		 * 
		 * @param {Object} e Event facade object
		 * @private
		 */
		'_dndStart': TreeNode.prototype._dndStart,
		
		/**
		 * Find marker position
		 * 
		 * @param {Object} e Event facade object
		 * @private
		 */
		'_dndOver': TreeNode.prototype._dndOver,
		
		/**
		 * Drop
		 * 
		 * @param {Object} e Event facade object
		 * @private
		 */
		'_dndEnd': function (e) {
			var target = this._dndTarget;
			if (!target) return;
			
			var tree = this.get('tree');
			
			//Drop was canceled
			if (this._dndTargetPlace === null) return;
			
			if (target.isInstanceOf('TreeNodeList') && this._dndTargetPlace == 'inside') {
				//Expand list
				target.expand();
				
				//Add TreeNodeList row
				var datagrid = target.getWidget('datagrid'),
					data = Supra.mix({'tree': tree, 'id': Y.guid()}, target.NEW_CHILD_PROPERTIES || {}, this.get('data')),
					row = datagrid.insert(data, target.get('data').new_children_first ? 0 : null),
					params = {
						'data': row.get('data'),
						'node': row
					};
				
			} else {
				//Add page
				var data = Supra.mix({}, target.NEW_CHILD_PROPERTIES || {}, this.get('data'));
				var node = tree.insert(data, target, this._dndTargetPlace),
					params = {
						'data': node.get('data'),
						'node': node
					};
				
				if (node.get('parent').expand) node.get('parent').expand();
			}
			
			//Only new items doesn't have ID, if page is restored from recycle bin
			//then there will be ID 
			if (!data.id) {
				tree.fire('page:add', params);
			} else {
				tree.fire('page:restore', params);
			}
			
			//Hide marker and cleanup data
			target.set('dndMarker', false);
			
			//Make sure node is not actually moved
			e.preventDefault();
			
			//Clean up
			this._dndTarget = null;
			this._dndTargetPlace = null;
			this._dndTargetNode = null;
		},
		
		
		
		/**
		 * ------------------------------ API ------------------------------
		 */
		
		
		/**
		 * Hide marker node
		 */
		'hideDropMarker': TreeNode.prototype.hideDropMarker,
		
		
		
		/**
		 * ------------------------------ ATTRIBUTES ------------------------------
		 */
		
		
		/**
		 * Dragable attribute setter
		 * 
		 * @param {Boolean} dragable New dragable value
		 * @return Dragable attribute value
		 * @type {Boolean}
		 * @private
		 */
		'_setDragable': function (dragable) {
			//Root nodes can't be dragged
			if (this.get('root')) {
				return false;
			}
			if (this._dnd) {
				this._dnd.set('lock', !dragable);
			}
			
			return !!dragable;
		}
	});
	
	
	Action.TreeNodeFake = TreeNodeFake;
	
	
	//Since this widget has Supra namespace, it doesn't need to be bound to each YUI instance
	//Make sure this constructor function is called only once
	delete(this.fn); this.fn = function () {};
	
}, YUI.version, {'requires': ['website.sitemap-tree', 'supra.template', 'dd', 'website.sitemap-tree-node']});