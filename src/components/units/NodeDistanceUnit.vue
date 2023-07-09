<template>
	<div class="node-distance-unit">

		<h3><span>Find shortest connection to&hellip;</span></h3>

		<fieldset>
		<select v-model="targetNodeId">
			<option v-if="!targetNodeId || targetNodeId == nodeId"></option>
			<optgroup label="Cities & Towns">
			<option v-for="node in importantNodes | orderBy 'id'" track-by="id" v-bind:value="node.id">
				{{ node.name }}
			</option>
			</optgroup>
			<optgroup label="All Nodes">
				<option v-for="node in allNodes | orderBy 'name'" track-by="id" v-bind:value="node.id">
					{{ node.name }}
				</option>
			</optgroup>
		</select>

		<div class="node-distance-unit--include-unreleased" v-if="path && isAlternatePathAvailable">
			<input type="checkbox" v-model="includeUnreleasedNodes"> <label>Include unreleased nodes</label>
		</div>
		</fieldset>

		<div class="node-distance-unit--results" v-if="path && path.path && path.path.length > 1">
			<p>Total contribution required: <strong>{{path.contributionTotal}}</strong></p>

			<ul>
				<li v-for="pathnode in path.path" v-on:click="onNodeLinkClicked(pathnode.id)">
					<b class="contrib">{{pathnode.contribution}}</b>
					<node-icon size="small" :type="pathnode.type"></node-icon>
					<span class="name">{{pathnode.name}} <em class="unreleased" v-if="pathnode.unreleased">Unreleased content</em></span>
				</li>
			</ul>

		</div>

	</div>
</template>

<script>

import NodeIcon from '../common/NodeIcon.vue';

export default {

	name: 'NodeDistanceUnit',

	props: {
		nodeId: 0
	},

	data: function() {
		return {
			mapdata: this.state.mapdata,
			targetNodeId: 0,
			includeUnreleasedNodes: true
		};
	},

	components: {
		NodeIcon
	},

	ready: function() {

	},

	computed: {
		importantNodes: function() {
			return Object.values(this.mapdata.nodes).filter(
				a => (a.type == 'City' || a.type == 'Town') && this.nodeId != a.id && !a.hidden
			);
		},
		allNodes: function() {
			return Object.values(this.mapdata.nodes).filter(
				a => !a.parent && this.nodeId != a.id && !a.hidden && a.links && a.links.length
			);
		},
		// Route that doesn't care if nodes are released/unreleased
		simplePath() {
			if( !this.$root.nodePathCalculator || !this.nodeId || !this.targetNodeId ) {
				return [];
			}
			let result = this.$root.nodePathCalculator.getShortestPath(this.nodeId,this.targetNodeId);
			return result ? result : [];
		},
		pathWithoutUnreleasedNodes() {
			if( !this.$root.nodePathCalculator || !this.nodeId || !this.targetNodeId ) {
				return [];
			}
			let result = this.$root.nodePathCalculator.getShortestPathWithoutUnreleasedNodes(this.nodeId,this.targetNodeId);
			return result ? result : [];
		},
		path: function() {
			// Return basic route if we don't have any unreleased nodes in
			// the route, or if we havn't toggled unreleased nodes off
			if( this.simplePath && (!this.pathHasUnreleasedNodes || this.includeUnreleasedNodes) ) {
				return this.simplePath;
			} else {
				return this.pathWithoutUnreleasedNodes;
			}
		},
		pathHasUnreleasedNodes() {
			if(this.simplePath && this.simplePath.path) {
				return this.simplePath.path.filter( node => !!node.unreleased ).length;
			}
			return false;
		},
		isAlternatePathAvailable() {
			let route = this.simplePath;
			if( !route || !route.path ) {
				return false;
			}
			let startNode = route.path[0];
			let endNode = route.path[route.path.length-1];

			if( startNode && endNode ) {
				// Is the start node or endnode an unreleased node? If so then
				// we can't offer the user a choice
				if (startNode.unreleased || endNode.unreleased) {
					return false;	
				}	
				return this.pathHasUnreleasedNodes;
			} else {
				return false;
			}

		}
	},

	methods: {
		onNodeLinkClicked: function(id) {
			if( id == this.nodeId ) {
				return;
			}
			this.$parent.$dispatch('node-link-clicked', id);
			return false;
		}
	}

};
</script>

<style src="./NodeDistanceUnit.scss" lang="sass"></style>
