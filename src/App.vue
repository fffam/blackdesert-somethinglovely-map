<template>
	<div>
		<map-view v-ref:map :is-node-planner-active="isNodePlannerActive"></map-view>
		<div id="panes">
			<menu-pane :active="selectedPane == 'menu'" v-ref:menupane></menu-pane>
			<node-planner-pane v-ref:nodeplannerpane v-if="isNodePlannerActive && isNodePlannerEnabled" :active="selectedPane == 'nodeplanner'"></node-planner-pane>
			<component v-ref:detailpane :is="currentDetailPane" keep-alive :active="selectedPane == 'detail'" :item-id="currentDetailItemId"></component>
		</div>
	</div>
</template>

<script>
import Vue from 'vue';
import router from 'riot-route';
import NodePathCalculator from './misc/NodePathCalculator.js';
import NodePlanner from './misc/NodePlanner.js';

import MapView from './components/MapView.vue';
import MenuPane from './components/panes/MenuPane.vue';
import InfoPane from './components/panes/InfoPane.vue';
import NodePlannerPane from './components/panes/NodePlannerPane.vue';

import NodeInfoPane from './components/panes/NodeInfoPane.vue';
import LevellingAreaInfoPane from './components/panes/LevellingAreaInfoPane.vue';
import VillaInfoPane from './components/panes/VillaInfoPane.vue';
import WorldBossInfoPane from './components/panes/WorldBossInfoPane.vue';
import FishingHotspotInfoPane from './components/panes/FishingHotspotInfoPane.vue';
import SeaRegionInfoPane from './components/panes/SeaRegionInfoPane.vue';
import GoldenChestInfoPane from './components/panes/GoldenChestInfoPane.vue';

export default {

	name: 'App',

	data: function() {
		return {
			appTitle: 'Map — Famme\'s BDO Tools',
			selectedPane: 'menu',
			currentDetailPane: '',
			currentDetailItemId: null,
			isNodePlannerEnabled: false,
			isNodePlannerActive: false,
			isReady: false
		};
	},

	components: {

		MapView,
		MenuPane,
		InfoPane,
		NodeInfoPane,
		NodePlannerPane,

		LevellingAreaInfoPane,
		VillaInfoPane,
		WorldBossInfoPane,
		FishingHotspotInfoPane,
		SeaRegionInfoPane,
		GoldenChestInfoPane
	},

	ready: function() {
		this.$action('mapdata:load');
		this.$action('filters:loadStateFromBrowserStorage');

		let devmode = window.location && window.location.hash && (window.location.hash.indexOf('devmode') > -1);
		if( devmode ) {
			this.isNodePlannerEnabled = true;
		}

		this.router = router;

		// Determine if the query string contains the show parameter
		// for which nodes to display
		this.setStateFromQueryString( this.router.query() );

		// this.route('/node/'+id, '', true])
		this.router('/node/*', (nodeid) => {
			if( this.isReady ) return; // Only use routes on load
			let matchedNode = this.getNodeFromUrlPath(nodeid);
			matchedNode && this.selectNode(matchedNode);
		});

		// Route for linking directly to layers
		this.router('/layer/(.*)', (layernames) => {
			var layers = layernames.split(',');
			for( var i in this.state.filters ) {
				if( i !== 'gathering' ) {
					this.state.filters[i].active = false;
				}
			}
			for( var i in layers ) {
				// Is this a gathering filter?
				if( layers[i].indexOf(':') && layers[i].indexOf('gathering') === 0 ) {
					var layerparts = layers[i].split(':');
					if(layerparts.length !== 3) {
						continue;
					}
					this.state.filters['gathering'][layerparts[1]][layerparts[2]].active = true;

				// Normal filters
				} else if( this.state.filters[layers[i]] ) {
					this.state.filters[layers[i]].active = true;
				}
			}
		});

		// Match data layers
		this.router('/*/*', (layername,id) => {
			if( this.isReady ) return; // Only use routes on load
			let matchedFeature = this.getDataLayerFeatureFromUrlPath(layername,id);
			matchedFeature && this.selectDataLayerFeature(layername,matchedFeature);
		});

		this.$watch('state.mapdata.ready', (c) => {
			this.nodePlanner = new NodePlanner(this.state.mapdata.nodes);
			this.router.exec();
			this.router.stop();
			this.isReady = true;
			this.nodePathCalculator = new NodePathCalculator(this.state.mapdata.nodes);
			this.nodePlanner = new NodePlanner(this.state.mapdata.nodes);
			this.nodePlanner.on('plan-changed', () => {
				this.$broadcast('nodeplanner-plan-changed', {plan:this.nodePlanner.plan, planner: this.nodePlanner} );
				this.isNodePlannerActive = true;
			});
			this.$broadcast('node-data-ready');
		});

		// Link horses filter to elephants filter
		this.$watch('state.filters.horses.active', (c) => {
			this.state.filters.elephants.active = c;
		});

		// Link all of the hunting filters
		this.$watch('state.filters.hunting.active', (c) => {
			this.state.filters.whales.active = c;
			this.state.filters.bluewhales.active = c;
			this.state.filters.crocodiles.active = c;
			this.state.filters.khalks.active = c;
		});

		// Did we just activate the node planner?
		// If so, make it the focussed panel
		this.$watch('isNodePlannerActive', (c) => {
			if( this.isNodePlannerActive ) {
				this.selectedPane = 'nodeplanner';
			}
		});

	},

	events: {
		'marker-clicked': function (msg,a) {
			switch(msg.type) {
				case 'node':
					this.selectNode(msg.id,true,false);
					break;
				case 'feature':
					this.selectDataLayerFeature(msg.layer,msg.id,true,false);
					break;
				default:
					// Not setup for anything other than nodes yet
			}
			this.$broadcast('marker-clicked',msg);
			return true;
		},
		'search-suggestion-clicked': function (msg) {
			if( msg.isDataLayer || msg.isDataLayerOutput ) {
				this.selectDataLayerFeature(msg.type,msg.id,true,true);
			} else {
				this.selectNode(msg == 'node' ? msg.id : msg.node.id,true,true);
			}
			return true;
		},
		'search-suggestion-hovered': function (msg) {
			if( msg.isDataLayer || msg.isDataLayerOutput ) {
				this.pingDataLayerFeature(msg.type,msg.id);
			} else {
				this.pingNode(msg.type == 'node' ? msg.id : msg.node.id);
			}
			return true;
		},
		'node-link-clicked': function (id) {
			this.selectNode(id,true,true);
			return true;
		},
		'zoom-map-to-coordinates': function (coords) {
			this.zoomMapToCoords(coords);
			return true;
		},
		'detail-pane-closed': function() {
			this.currentDetailPane = null;
			this.selectedPane = 'menu';
			this.$refs.menupane.activatePane();
			return true;
		}
	},

	methods: {

		isBeta() {
			let document = window.document;
			if( document && document.location && document.location.href ) {
				return ((document.location.pathname.indexOf('bdobeta')>-1) || (document.location.hostname == 'localhost'));
			}
			return false;
		},

		setStateFromQueryString: function(query) {

			// Should we turn off all layers by default?
			if( query.hidedefaults ) {
				for( var i in this.state.filters ) {
					this.state.filters[i].active = false;
				}
			}

			// Which layers should we turn on?
			if( query.filters ) {
				try {
					let queryParts = query.filters.split('|');
					for( var i in queryParts ) {
						if( this.state.filters[queryParts[i]] ) {
							this.state.filters[queryParts[i]].active = true;
						} else {
							// Search through the gathering filters to see if one matches
							for( var gatheringCategory in this.state.filters['gathering'] ) {
								// It matches the category
								if( this.state.filters['gathering'][gatheringCategory].slug == queryParts[i] ) {
									for( var j in this.state.filters['gathering'][gatheringCategory].items ) {
										this.state.filters['gathering'][gatheringCategory].items[j].active = true;
									}
								} else {
									for( var j in this.state.filters['gathering'][gatheringCategory].items ) {
										if( this.state.filters['gathering'][gatheringCategory].items[j].slug == queryParts[i] ) {
											this.state.filters['gathering'][gatheringCategory].items[j].active = true;
										}
									}
								}
							}
						}
					}
				} catch(e) {
					// Just use default filters
				}
			}

			if( query.latlng ) {
				this.$refs.map.zoomMapToCoords( query.latlng.split('|').map( (a) => a * 1 ) );
			}

		},

		routeTo: function(title, ...urlparts) {
			if( urlparts && urlparts.length ) {
				if( title ) {
					this.router('/'+urlparts.join('/'),title + ' — ' + this.appTitle,true);
				} else {
					this.router('/'+urlparts.join('/'),this.appTitle,true);
				}
			} else {
				this.router('/',this.appTitle,true);
			}
		},

		getNodeFromUrlPath: function(urlPathPart) {
			if( this.state.mapdata.nodes[urlPathPart] ) {
				return this.state.mapdata.nodes[urlPathPart];
			} else {
				// Find by slug
				for( let id in this.state.mapdata.nodes ) {
					if( this.state.mapdata.nodes[id].slug && this.state.mapdata.nodes[id].slug == urlPathPart ) {
						return this.state.mapdata.nodes[urlPathPart];
					}
				}
			}
			return false;
		},

		getLinkInfoForNode: function(id) {
			if( this.state.mapdata.nodes[id] ) {
				return {
					id: id,
					name: this.state.mapdata.nodes[id].name,
					slug: this.state.mapdata.nodes[id].slug || id
				};
			} else {
				return false;
			}
		},

		getDataLayerFeatureFromUrlPath: function(layerName,urlPathPart) {
			if( this.state.mapdata.layers[layerName] && this.state.mapdata.layers[layerName].features ) {
				let features = this.state.mapdata.layers[layerName].features;
				for( var i in features ) {
					if(
						(features[i].id && features[i].id == urlPathPart) ||
						(features[i].properties && features[i].properties.slug && features[i].properties.slug == urlPathPart)
					) {
						return features[i];
					}
				}
			}
			return false;
		},

		getLinkInfoForDataLayerFeature: function(layerName,id) {

			if( this.state.mapdata.layers[layerName] && this.state.mapdata.layers[layerName].features ) {
				let features = this.state.mapdata.layers[layerName].features;
				for( var i in features ) {
					if( features[i].id && features[i].id == id ) {
						let title = (features[i].properties && features[i].properties.name) ? features[i].properties.name : null;
						return {
							id: id,
							name: title,
							slug: (features[i].properties && features[i].properties.slug) ? features[i].properties.slug : features[i].id
						};
					}
				}
			}
		},

		selectNode: function(idOrNodeObj,ping=false,zoom=true) {

			// Get the ID
			if( idOrNodeObj.id ) {
				idOrNodeObj = idOrNodeObj.id;
			}

			let linkInfo = this.getLinkInfoForNode(idOrNodeObj);
			if( linkInfo ) {
				this.routeTo( linkInfo.name, 'node', linkInfo.slug );
			} else {
				// Node doesn't exist
				return;
			}

			this.$refs.map.selectNode(idOrNodeObj,ping,zoom);
			this.currentDetailItemId = idOrNodeObj;
			this.currentDetailPane = 'NodeInfoPane';
			this.selectedPane = 'detail';
		},

		selectDataLayerFeature: function(type,id,ping=false,zoom=true) {
			console.log('[App]','selectDataLayerFeature',type,id);
			if( id.id ) {
				id = id.id;
			}

			// If we are selecting the elephant layer, ensure horses filter is enabled too
			if( type == 'elephants' ) {
				this.state.filters.horses.active = true;
			}

			// If we are selecting a hunting feature, toggle on the hunting layer
			if( type == 'whales' || type == 'bluewhales' || type == 'crocodiles' || type == 'khalks' ) {
				this.state.filters.hunting.active = true;
			}

			let linkInfo = this.getLinkInfoForDataLayerFeature(type,id);
			if( linkInfo ) {
				this.$refs.map.selectDataLayerFeature(type,id,ping,zoom);
				this.routeTo( linkInfo.name, type, linkInfo.slug );
			} else {
				// Data layer feature doesn't exist
				return;
			}

			// Is this a data layer that has a detail panel?
			switch( type ) {
				case 'levellingareas':
					this.currentDetailPane = 'LevellingAreaInfoPane';
					this.currentDetailItemId = id;
					this.selectedPane = 'detail';
					break;
				case 'villas':
					this.currentDetailPane = 'VillaInfoPane';
					this.currentDetailItemId = id;
					this.selectedPane = 'detail';
					break;
				case 'worldbosses':
					this.currentDetailPane = 'WorldBossInfoPane';
					this.currentDetailItemId = id;
					this.selectedPane = 'detail';
					break;
				case 'fishinghotspots':
					this.currentDetailPane = 'FishingHotspotInfoPane';
					this.currentDetailItemId = id;
					this.selectedPane = 'detail';
					break;
				case 'searegions':
					this.currentDetailPane = 'SeaRegionInfoPane';
					this.currentDetailItemId = id;
					this.selectedPane = 'detail';
					break;
				case 'goldenchests':
					this.currentDetailPane = 'GoldenChestInfoPane';
					this.currentDetailItemId = id;
					this.selectedPane = 'detail';
					break;

				default:
					// No detail pane
			}
		},

		registerCustomDataLayer: function( url, name, properties ) {
			console.log('[App] Registering custom data layer:', name, url);
			Vue.set(
				this.state.filters.custom,
				url,
				{ url: url, active: true, loaded: true, name: name, properties: properties }
			);
		},

		pingNode: function(idOrNodeObj) {
			let id = idOrNodeObj;
			if( idOrNodeObj.id ) {
				idOrNodeObj = idOrNodeObj.id;
			}
			this.$refs.map.pingNode(idOrNodeObj);
		},

		pingDataLayerFeature: function(type,id) {
			this.$refs.map.pingDataLayerFeature(type,id);
		},

		zoomMapToCoords: function(coords) {
			this.$refs.map.zoomMapToCoords(coords);
			setTimeout( () => {
				this.$refs.map.pingCoords(coords);
			}, 1500);
		}
	}

};
</script>
<style src="./App.scss" lang="sass"></style>
