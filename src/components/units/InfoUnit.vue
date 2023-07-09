<template>
	<div id="info-unit" v-if="selectedNode">
		<header>
		<h1><node-icon size="large" :type="selectedNode.type"></node-icon> {{selectedNode.name}}</h1>
		</header>
		<div class="panel-body">

			<p v-if="selectedNode.requirement" class="requirement"><b>Required:</b> {{selectedNode.requirement}}</p>

			<dl class="details">
				<dt>ID</dt>
				<dd>{{selectedNode.id}}</dd>
				<dt v-if="selectedNode.zone">Region</dt>
				<dd v-if="selectedNode.zone">{{selectedNode.zone}}</dd>
				<dt>Contribution</dt>
				<dd>{{selectedNode.contribution}}</dd>
				<dt>Type</dt>
				<dd>{{selectedNode.type}}</dd>
				<dt v-if="selectedNode.node_manager">Node Manager</dt>
				<dd v-if="selectedNode.node_manager">{{selectedNode.node_manager.name}}</dd>
			</dl>

			<div class="parentnode" v-if="false && selectedNode.parent">
				Parent node:
			</div>

			<h3 v-if="hasSubnodes"><span>Subnodes</span></h3>
			<ul v-if="hasSubnodes">
				<li v-for="subnode in subnodesForSelectedNode" class="list-item-node">
					<h4><node-icon size="small" :type="subnode.type"></node-icon> <b v-on:click="onNodeLinkClicked(subnode.id)">{{subnode.name}}</b></h4>
					<span v-if="subnode.requirement" class="requirement"><b>Required:</b> {{subnode.requirement}}</span>
					<span>{{subnode.type}} Node</span>
					<span class="contrib">Contribution required: <b>{{subnode.contribution}}</b> <template v-if="subnode.contribution === 0 && !subnode.requirement">(Auto-unlocked)</template></span>
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

			<div class="notes" v-if="selectedNode.notes">
				<template v-if="selectedNode.notes[0] == '<'">
					{{{selectedNode.notes}}}
				</template>
				<template v-else>
					<p>{{{selectedNode.notes}}}</p>
				</template>
			</div>

		</div>
	</div>
</template>

<script>

import TradePack from '../common/TradePack.vue';
import NodeIcon from '../common/NodeIcon.vue';
import TraderIcon from '../common/TraderIcon.vue';

export default {

	name: 'InfoUnit',

	components: {
		TradePack,
		NodeIcon,
		TraderIcon
	},

	data: function() {
		return {
			mapdata: this.state.mapdata,
			filters: this.state.filters,
			selectedNode: null
		};
	},

	ready: function() {
		this.$watch('filters.nodes.active', (c) => {
			window.console.log(c);
		}, {deep:true} );
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

		subnodesForSelectedNode: function() {
			if( !this.selectedNode ) {
				return null;
			}
			return this.getSubnodesForSelectedNode();
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
			console.log(nodeId);
			this.$dispatch('node-link-clicked', nodeId);
			return false;
		}

	}

};
</script>

<style src="./InfoUnit.scss" lang="sass"></style>
