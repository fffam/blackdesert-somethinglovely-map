<template>
	<div v-bind:class="['pane', 'info-pane', 'node-info-pane', {'pane--is-active': this.active}, 'pane--nodetype-'+(selectedNode?selectedNode.type:'none') ]" v-on:click="activatePane()">
		<div class="pane--wrapper" v-if="selectedNode">
			<div class="pane--header">

				<div class="parentnode" v-if="selectedNode.parent">
					<a v-on:click="selectNode(selectedNodeParent.id)" v-bind:class="['nodetype--'+selectedNodeParent.type]">
					<node-icon size="small" :type="selectedNodeParent.type"></node-icon> <b>{{selectedNodeParent.name}}</b>
					</a>
				</div>

				<header class="detail-intro-unit">
					<div class="close" v-on:click.stop.prevent="close()">×</div>
					<node-icon size="large" :type="selectedNode.type"></node-icon>
					<h1>{{selectedNode.name}}</h1>
					<h2>{{selectedNode.type}}</h2>
				</header>

				<div class="toolbar" v-if="$root.isNodePlannerEnabled">
					<button class="ui-button nodeplanner-button nodeplanner-button--add" v-if="!nodeExistsInCurrentNodePlan" v-on:click="onAddNodeToPlannerClicked()"><span class="contrib">{{selectedNode.contribution}}</span> Add to Node Planner</button>
					<button class="ui-button nodeplanner-button nodeplanner-button--remove" v-if="nodeExistsInCurrentNodePlan" v-on:click="onRemoveNodeFromPlannerClicked()"><span class="contrib">{{selectedNode.contribution}}</span> Remove from Node Planner</button>
				</div>

			</div>

			<div class="pane--body">

				<section class="section-image" v-if="selectedNode.imageurl">
					<a v-bind:href="selectedNode.imagelink ? selectedNode.imagelink : selectedNode.imageurl" target="_blank"><img v-bind:src="selectedNode.imageurl"></a>
				</section>

				<p v-if="selectedNode.unreleased" class="unreleased">This node is not yet available on NA/EU servers.</p>

				<!-- Node basic details (region,contribution, etc) -->
				<dl class="details">
					<dt>ID</dt>
					<dd>{{selectedNode.id}}</dd>
					<dt v-if="selectedNode.zone">Region</dt>
					<dd v-if="selectedNode.zone">{{selectedNode.zone}}</dd>
					<dt>Contribution</dt>
					<dd>{{selectedNode.contribution}}</dd>
					<dt v-if="selectedNode.workload">Workload</dt>
					<dd v-if="selectedNode.workload">{{selectedNode.workload}}</dd>
				</dl>

				<div class="node-manager-info">
					<dl>
					<dt class="node-manager" v-if="selectedNode.node_manager">Node Manager</dt>
					<dd class="node-manager" v-if="selectedNode.node_manager">
						<h4>{{selectedNode.node_manager.name}}</h4>
						<p v-if="selectedNode.node_manager.location" class="node-manager-button"><button class="ui-button" v-on:click="onZoomToNodeManagerClicked()">Zoom to location</button></p>
						<template v-if="selectedNode.node_manager.notes">
							<template v-if="selectedNode.node_manager.notes.indexOf('<') > -1">
							{{{selectedNode.node_manager.notes}}}
							</template>
							<p v-else>{{selectedNode.node_manager.notes}}</p>
						</template>
					</dd>
					</dl>
				</div>

				<p v-if="selectedNode.requirement" class="requirement"><b>Required:</b> {{selectedNode.requirement}}</p>

				<h3 v-if="hasSubnodes"><span>Subnodes</span></h3>
				<ul v-if="hasSubnodes">
					<li v-for="subnode in subnodesForSelectedNode" class="list-item-node">
						<h4><node-icon size="small" :type="subnode.type"></node-icon> <b v-on:click="onNodeLinkClicked(subnode.id)">{{subnode.name}}</b></h4>
						<span v-if="subnode.requirement" class="requirement"><b>Required:</b> {{subnode.requirement}}</span>
						<span>{{subnode.type}} Node</span>
						<span class="contrib">Contribution required: <b>{{subnode.contribution}}</b> <template v-if="subnode.contribution === 0 && !subnode.requirement">(Auto-unlocked)</template></span>
						<span class="workload" v-if="selectedNode.workload"><b>Workload:</b> {{selectedNode.workload}}</span>
						<ul v-if="subnode.primary_output || subnode.secondary_output">
							<li v-for="item in subnode.primary_output" class="list-item-item primary">
								<img v-bind:src="'icons/'+item.id+'.png'"> {{ item.name }}
							</li>
							<li v-for="item in subnode.secondary_output" class="list-item-item secondary">
								<img v-bind:src="'icons/'+item.id+'.png'"> {{ item.name }}
							</li>
						</ul>
					</li>
				</ul>

				<template v-if="selectedNode.links && selectedNode.links.length > 0">
					<node-distance-unit :node-id="selectedNode.id"></node-distance-unit>
				</template>

				<h3 v-if="selectedNode.primary_output"><span>Primary Output</span></h3>
				<ul v-if="selectedNode.primary_output">
					<li v-for="item in selectedNode.primary_output" class="list-item-item">
						<img v-bind:src="'icons/'+item.id+'.png'"> {{ item.name }}
					</li>
				</ul>
				<h3 v-if="selectedNode.secondary_output"><span>Secondary Output (chance)</span></h3>
				<ul v-if="selectedNode.secondary_output">
					<li v-for="item in selectedNode.secondary_output" class="list-item-item">
						<img v-bind:src="'icons/'+item.id+'.png'"> {{ item.name }}
					</li>
				</ul>

				<h3 v-if="selectedNode.traders"><span>Traders</span></h3>
				<ul class="traders" v-if="selectedNode.traders">
					<li v-for="trader in selectedNode.traders">
						<h2><trader-icon :type="trader.type"></trader-icon> <strong>{{trader.name}}</strong></h2>
						<span v-if="trader.role || trader.type">{{ trader.role ? trader.role : trader.type }}</span>
						<ul>
							<li v-for="tradepack in trader.packs | orderBy 'level_requirement'">
								<trade-pack :item="tradepack"></trade-pack>
							</li>
						</ul>
					</li>
				</ul>

				<div class="notes" v-if="selectedNode.notes || automaticNotes">
					<template v-if="selectedNode.notes[0] == '<'">
						{{{selectedNode.notes}}}
					</template>
					<template v-else>
						<p>{{{selectedNode.notes}}}</p>
					</template>
					<template v-if="automaticNotes">
						{{{automaticNotes}}}
					</template>
				</div>

			</div>
			<div class="pane--footer">

			</div>
		</div>
	</div>
</template>

<script>

import TradePack from '../common/TradePack.vue';
import NodeIcon from '../common/NodeIcon.vue';
import TraderIcon from '../common/TraderIcon.vue';
import NodeDistanceUnit from '../units/NodeDistanceUnit.vue';

export default {

	name: 'NodeInfoPane',

	components: {
		TradePack,
		NodeIcon,
		TraderIcon,

		NodeDistanceUnit
	},

	data: function() {
		return {
			mapdata: this.state.mapdata,
			filters: this.state.filters,
			selectedNode: null,
			currentNodePlan: null,
			currentNodePlanner: null
		};
	},

	props: {
		active: false,
		itemId: 1
	},

	activate: function (done) {
		done();
	},

	ready: function() {

		if( this.itemId && !this.selectedNode ) {
			this.selectedNode = this.mapdata.nodes[this.itemId];
		}

		this.$watch('itemId', (c) => {
			this.selectedNode = this.mapdata.nodes[this.itemId];
		});

		this.$watch('filters.nodes.active', (c) => {
			window.console.log(c);
		}, {deep:true} );

		this.$on('nodeplanner-plan-changed', (evt) => {
			console.log('[NodeInfoPane] ::plan-changed');
			this.currentNodePlan = evt.plan;
			this.currentNodePlanner = evt.planner;
		});
	},

	events: {
		'marker-clicked': function (msg) {
			let nodeId = msg.id;
			// Find node
			let node = this.mapdata.nodes[nodeId];
			if( node ) {
				this.selectedNode = node;
			} else {
				this.selectedNode = null;
			}

			return true;
		}
	},

	computed: {
		hasSubnodes: function() {
			var subnodes = this.subnodesForSelectedNode;
			return subnodes && Object.keys(subnodes).length > 0;
		},

		selectedNodeParent: function() {
			// Does this node have a parent node?
			if( this.selectedNode.parent && this.mapdata.nodes[this.selectedNode.parent] ) {
				return this.mapdata.nodes[this.selectedNode.parent];
			}
			return null;

		},

		subnodesForSelectedNode: function() {
			if( !this.selectedNode ) {
				return null;
			}
			return this.getSubnodesForSelectedNode();
		},

		automaticNotes: function() {
			if( !this.selectedNode ) {
				return null;
			}
			if( this.selectedNode.id >= 1400 && this.selectedNode.id <= 1449 && this.mapdata.settings && this.mapdata.settings.oceannodenotes ) {
				return this.mapdata.settings.oceannodenotes;
			} else {
				return null;
			}
		},

		nodeExistsInCurrentNodePlan: function( ) {
			return this.currentNodePlanner && this.currentNodePlanner.hasNode(this.selectedNode.id);
		}
	},

	methods: {

		selectNode: function(id) {
			// Find node
			let node = this.mapdata.nodes[id];
			if( node ) {
				this.selectedNode = node;
			} else {
				this.selectedNode = null;
			}
			return true;
		},

		activatePane: function() {
			if( !this.active ) {
				this.$parent.selectedPane = 'detail';
			}
		},

		close: function() {
			this.$dispatch('detail-pane-closed');
		},

		getSubnodesForSelectedNode: function() {
			if( !this.selectedNode ) {
				return null;
			}
			let result = {};
			for( let i in this.mapdata.nodes ) {
				if( this.mapdata.nodes[i].parent == this.selectedNode.id ) {
					if( !this.mapdata.nodes[i].hidden ) {
						result[i] = this.mapdata.nodes[i];
					}
				}
			}
			return result;
			/*.sortBy( (a, b) => {
				return (a.type == b.type) ? 0 : (a.type > b.type ? -1 : 1);
			} );*/
		},

		onNodeLinkClicked: function(nodeId) {
			this.$dispatch('node-link-clicked', nodeId);
			return false;
		},

		onZoomToNodeManagerClicked: function() {
			this.$dispatch('zoom-map-to-coordinates', this.selectedNode.node_manager.location);
		},

		onAddNodeToPlannerClicked: function( id ) {
			this.$root.nodePlanner.addNodeById( id ? id : this.itemId );
		},

		onRemoveNodeFromPlannerClicked: function( id ) {
			this.$root.nodePlanner.removeNodeById( id ? id : this.itemId );
		}

	}

};
</script>

<style src="./NodeInfoPane.scss" lang="sass"></style>
