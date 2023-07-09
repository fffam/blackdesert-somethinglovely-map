<template>
	<div v-bind:class="['pane', 'node-planner-pane', {'pane--is-active': this.active} ]" v-on:click="activatePane()">
		<div class="pane--wrapper">
			<div class="pane--header">

				<header class="detail-intro-unit">
					<div class="close" v-on:click.stop.prevent="close()">×</div>
					<h1>Node Planner (WIP)</h1>
				</header>

				<div class="toolbar">
					<button class="ui-button nodeplanner-button nodeplanner-button--load" v-on:click="loadExternalPlanFromId">Load Plan</button>
				</div>

				<div
					<ul>
						<li v-for="plan in plans">
							{{plan.name}}
						</li>
					</ul>
					{{loadingStatusMessage}}
				</div>

			</div>

			<div class="pane--body">

				<h3><span>Nodes</span></h3>

				<ul class="node-list">
					<li v-for="node in nodes" transition="node-list-item" v-bind:class="{ 'is-subnode': !!node.parent }">
						<button v-on:click="removeNodeById(node.id)">×</button>
						<i class="contrib">{{node.contribution}}</i>
						<a v-on:click="selectNode(node.id)" v-bind:class="['nodetype--'+node.type]">
							<node-icon size="small" :type="node.type"></node-icon> <b>{{node.name}}</b>
						</a>
						<ul class="material-list" v-if="node.primary_output || node.secondary_output">
							<li v-if="node.primary_output" v-for="material in node.primary_output" class="primary">
								<img v-bind:src="'icons/'+material.id+'.png'"> {{ material.name }}
							</li>
							<li v-if="node.secondary_output" v-for="material in node.secondary_output" class="secondary">
								<img v-bind:src="'icons/'+material.id+'.png'"> {{ material.name }}
							</li>
						</ul>
					</li>
				</ul>

				<h3><span>Materials</span></h3>

				<ul class="material-list">
					<li v-for="material in materials" x-transition="node-list-item">
						<h5><img v-bind:src="'icons/'+material.id+'.png'"> {{ material.name }}</h5>
						<p v-for="matnode in material.nodes">{{matnode.name}}</p>
					</li>
				</ul>

			</div>

			<div class="pane--footer">

				<div class="totals">
					<table>
						<tr><td>Exploration nodes</td><td>{{contributionSplit.exploration}}</td></tr>
						<tr><td>Worker nodes</td><td>{{contributionSplit.worker}}</td></tr>
						<tr v-if="contributionSplit.monopoly"><td>Specialty nodes/Banks</td><td>{{contributionSplit.monopoly}}</td></tr>
						<tr v-if="contributionSplit.extra"><td>Other CP</td><td>{{contributionSplit.extra}}</td></tr>
						<tr class="total"><td>Total</td><td>{{contributionSplit.total}}</td></tr>
					</table>
				</div>
			</div>
		</div>
	</div>
</template>

<script>

import Vue from 'vue';
import NodeIcon from '../common/NodeIcon.vue';

export default {

	name: 'NodePlannerPane',

	props: {
		active: true
	},

	components: {
		NodeIcon
	},

	data: function() {
		return {
			mapdata: this.state.mapdata,
			allPlans: {},
			nodeIds: [],
			loadingStatusMessage: ''
		}
	},

	activate: function (done) {
		done();
	},

	ready: function() {
		console.log('NodePlannerPane Ready');
		this.$emit('node-data-ready');
	},

	computed: {

		nodes: function() {
			if(!this.mapdata.ready) {
				return [];
			}
			var nodes = [];
			for( var i in this.nodeIds ) {
				nodes.push(this.mapdata.nodes[this.nodeIds[i]]);
			}

			return nodes.sort( (a,b) => {
				// Both childnodes of same node?
				if( a.parent && b.parent && a.parent == b.parent ) {
					return a.id - b.id;
				}
				// a is parent of b
				if( b.parent == a.id ) {
					return -1;
				}
				// b is parent of a
				if( a.parent == b.id ) {
					return 1;
				}
				// Otherwise just sort by the ID of the exploration node
				var aid = a.parent || a.id;
				var bid = b.parent || b.id;
				return aid - bid;
			});
		},

		plans: {
			cache: false,
    		get: function () {
			//console.log(this.loadingStatusMessage,this.allPlans, Object.keys(this.allPlans) );
			var plans = this.allPlans;
			var result = [];
			for( var k in this.allPlans ) {
				result.push(this.allPlans[k]);
			}
			//console.log(result);
			return result;
			}
		},

		materials: function() {
			if(!this.mapdata.ready) {
				return [];
			}
			var products = [];
			var productIdxs = {};

			for( var i in this.nodeIds ) {
				var node = this.mapdata.nodes[this.nodeIds[i]];
				if( node.primary_output ) {
					for( var outputId in node.primary_output ) {

						if( productIdxs[outputId] ) {
							products[productIdxs[outputId]].nodes.push( node );
						} else {
							var prod = {
								name: node.primary_output[outputId].name,
								id: node.primary_output[outputId].id,
								isPrimary: true,
								nodes: [node]
							}
							productIdxs[outputId] = products.length;
							products.push(prod);
						}

					}
				}
				if( node.secondary_output ) {
					for( var outputId in node.secondary_output ) {

						if( productIdxs[outputId] ) {
							products[productIdxs[outputId]].nodes.push( node );
						} else {
							var prod = {
								name: node.secondary_output[outputId].name,
								id: node.secondary_output[outputId].id,
								isPrimary: false,
								nodes: [node]
							}
							productIdxs[outputId] = products.length;
							products.push(prod);
						}

					}
				}
			}
			return products.sort( (a,b) => {
				return a.name < b.name ? -1 : 1;
			});
		},

		contributionSplit: function() {
			var split = {
				total: 0,
				exploration: 0,
				worker: 0,
				monopoly: 0,
				extra: 0
			};
			if(!this.mapdata.ready) {
				return split;
			}
			for( var i in this.nodeIds ) {
				var node = this.mapdata.nodes[this.nodeIds[i]];
				var cp = node.contribution || 0;

				// For each node, add on the CP
				split.total += cp;
				switch( node.type ) {
					case 'Specialty':
					case 'Bank':
						split.monopoly += cp;
						break;
					case 'Forest':
					case 'Mine':
					case 'Farm':
					case 'Mushrooms':
					case 'Fishing':
					case 'Excavation':
						split.worker += cp;
						break;
					default:
						split.exploration += cp;
				}
			}
			return split;
		}
	},

	methods: {
		activatePane: function() {
			if( !this.active ) {
				this.$parent.selectedPane = 'nodeplanner';
			}
		},

		close: function() {
			this.$dispatch('node-planner-pane-closed');
		},

		addNodeById: function(id) {
			this.$root.nodePlanner.addNodeById(id);
		},
		removeNodeById: function(id) {
			this.$root.nodePlanner.removeNodeById(id);
		},

		loadExternalPlanFromId() {
			this.loadingStatusMessage = 'Loading...';
			this.$root.nodePlanner.loadPlan('x8M7nnSM7sgSBN3fPbuT').then( (j) => {
				this.loadingStatusMessage = 'Loaded!';
			}).catch( (e) => {
				window.console.error('Could not load node plan',e);
				this.loadingStatusMessage = 'Error!';
				this.state.loading = false;
			});
		}
	},

	events: {
		'node-data-ready': function() {			
			if(!this.$root.nodePlanner) {
				return;
			}

			// When the current plan is updated, set the list of node IDs
			// and extra CP
			this.$root.nodePlanner.on('plan-updated', () => {
				//console.log(this);
				this.nodeIds = Object.keys(this.$root.nodePlanner.plan.nodes);
			});

			// Keep the list of all plans in sync with the planner obj
			this.$root.nodePlanner.on('plans-updated', () => {
				console.log('plans-updated');
				Vue.set(this,'allPlans',this.$root.nodePlanner.allPlans);
			});

			this.nodeIds = Object.keys(this.$root.nodePlanner.plan.nodes);
			Vue.set(this,'allPlans',this.$root.nodePlanner.allPlans);
		}
	}

};
</script>

<style src="./NodePlannerPane.scss" lang="sass"></style>
