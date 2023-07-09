<template>
	<div id="map"></div>
	<div v-if="currentLatLng && currentLatLng.x" id="currentLatLng" v-bind:class="{copied: currentLatLngRecentlyCopied}" v-on:click.prevent="onCurrentLatLngClicked">{{currentLatLng.x}},{{currentLatLng.y}}</div>
</template>

<script>
var Leaflet = require('leaflet');
var d3 = require('d3');
var LeafletPing = require('../vendor/PingLayer.js');
var LeafletRoseTooltip = require('../vendor/leaflet.rrose.js');
var clipboard = require('clipboard-js');
import CoordinateSystems from '../misc/CoordinateSystems.js';
import markerIcons from '../markers';
import fishlist from '../fishlist';

export default {

	name: 'MapView',

	props: {
		currentLatLng: null,
		currentLatLngRecentlyCopied: false,

		isNodePlannerActive: false
	},

	data: function() {
		return {
			data: this.state.mapdata,
			filters: this.state.filters,
			gatheringLayers: {},
			dataLayers: {},
			tileLayers: {},
			//nodeMarkers: {},

			xOffset: -16,
			yOffset: -8
		};
	},

	ready: function() {

		// Keep a reference to the class used to translate between coordinate systems
		this.cs = new CoordinateSystems();

		this.nodeMarkers = {};
		this.nodeConnections = {};
		this.registerMapHooksForChangeClassOnZoom();

		var width = 256 * 128;
		var height = 256 * 128;

		// Create map
		this.map = Leaflet.map('map', {
			zoom: 2,
			minZoom: 2,
			maxZoom: 8,

			zoomSnap: 0.5,
			zoomDelta: 0.5,

			attributionControl: false,
			zoomControl: false,
			crs: L.CRS.Simple,
			continuousWorld: false,
			//preferCanvas: true,
			wheelPxPerZoomLevel: 100
		});
		var map = this.map;

		this.map.setView(this.unproject([13799.6,76995.8]), 3);

		// Setup the styles for node connections
		this.nodeConnectionTypeStyles = {
			'default': {
				'default': {
					color: '#FFB300',
					weight: 3,
					opacity: 0.6,
					lineCap: 'round',
					clickable: false,
				},
				'connected': {
					color: '#ffe605',
					weight: 5,
					opacity: 0.9,
					lineCap: 'round',
					clickable: false,
				}
			},
			'subnode': {
				'default': {
					color: '#FF5722',
					weight: 3,
					opacity: 0.6,
					lineCap: 'round',
					clickable: false,
				},
				'connected': {
					color: '#ffe605',
					weight: 5,
					opacity: 0.9,
					lineCap: 'round',
					clickable: false,
				}
			},
			'ocean': {
				'default': {
					color: '#3abded',
					weight: 3,
					opacity: 0.4,
					lineCap: 'round',
					clickable: false,
				},
				'connected': {
					color: '#ffe605',
					weight: 5,
					opacity: 0.9,
					lineCap: 'round',
					clickable: false,
				}
			}
		};

		//sets the max bounds on map
		/*
		this.map.setMaxBounds(new L.LatLngBounds(
			this.map.unproject([0, height],7),
			this.map.unproject([width, 0],7)
		));
		*/

		// Create a canvas renderer for gathering layers (they can display a lot of dots,
		// so its more efficient than trying to SVG them all)
		this.gatheringLayerRenderer = L.canvas();

		// Create a custom Tile Layer that inverts Y position
		// So we can use a correct CRS but with inverted tms-style tile
		// URLS without going full-tms
		Leaflet.TileLayer.Flipped = L.TileLayer.extend({
			getTileUrl: function (tilePoint) {
				return L.Util.template(this._url, L.extend({
					s: this._getSubdomain(tilePoint),
					z: tilePoint.z,
					x: tilePoint.x,
					y: Math.pow(2,this._tileZoom) - tilePoint.y - 1
				}, this.options));
			}
		});

		this.tileLayers.minimap = new Leaflet.TileLayer(
			'http://www.somethinglovely.net/bdo/tiles2/{z}/{x}_{y}.jpg',
			{
				crs: L.CRS.Simple,
				minZoom: 1,
				maxZoom: 7+1,
				zoomOffset: 8,
				maxNativeZoom: 7,
				tms: false,
				noWrap: true,
				bounds: new L.LatLngBounds(
					map.unproject([0,0],7),
					map.unproject([width,height],7)
				)
			}
		).addTo(map);

		let aprilFoolsStartTime = new Date('2018-04-01T00:00:00+00:00');
		let aprilFoolsEndTime = new Date('2018-04-02T10:00:00-00:00');
		let nowTime = new Date();
		if( nowTime.getTime() > aprilFoolsStartTime.getTime() && nowTime.getTime() < aprilFoolsEndTime.getTime() ) {
			let aprilFoolsTilesOffset = {x:256*64,y:256*64};
			this.tileLayers.aprilFoolsTiles = new Leaflet.TileLayer(
				'http://www.somethinglovely.net/bdo/tiles-extras/{z}/{x}_{y}.jpg',
				{
					crs: L.CRS.Simple,
					minZoom: 1,
					maxZoom: 7+1,
					zoomOffset: 7,
					maxNativeZoom: 7,
					tms: false,
					noWrap: true,
					bounds: new L.LatLngBounds(
						map.unproject([(aprilFoolsTilesOffset.x),(aprilFoolsTilesOffset.y)],7),
						map.unproject([(aprilFoolsTilesOffset.x) + (256*32),(aprilFoolsTilesOffset.y) + (256*32)],7)
					)
				}
			);
			let originalTileUrlFunction = this.tileLayers.aprilFoolsTiles.getTileUrl.bind(this.tileLayers.aprilFoolsTiles);
			this.tileLayers.aprilFoolsTiles.getTileUrl = function (coords) {
				let newcoords = { x:coords.x, y:coords.y, z:coords.z };
				let zoom = Math.pow(2,15-coords.z);
				newcoords.x -= Math.round(aprilFoolsTilesOffset.x / zoom);
				newcoords.y -= Math.round(aprilFoolsTilesOffset.y / zoom);
				newcoords.z -= 2;
				return originalTileUrlFunction(newcoords);
			}
			
			this.tileLayers.aprilFoolsTiles.addTo(map);
		}

/*
		this.tileLayers.terrain = new Leaflet.TileLayer(
			'http://www.somethinglovely.net/bdo/tiles-s/{z}/{x}-{y}.jpg',
			{
				crs: L.CRS.Simple,
				minZoom: 1,
				maxZoom: 5,
				tms: false,
				noWrap: true,
				bounds: new L.LatLngBounds(
					map.unproject([0,0],7),
					map.unproject([width,height],7)
				)
			}
		).addTo(map);
*/

		// Move zoom control to top right
		new Leaflet.Control.Zoom({ position: 'topright' }).addTo(this.map);

		// Create a ping layer
		this.pingLayer = (new Leaflet.PingLayer()).addTo(this.map);
		this.pingLayer.radiusScale().range([2, 45]);

		this.map.on('click', this.onMapClick);

		// Register listeners

		// When we load node data, render
		// them
		this.$watch('data.nodes', (c) => {
			this.renderNodes();
			this.renderUpcomingContentDecorations();
			this.loadExternalGeoJSONFiles();
		});

		this.$watch('data.layers', (c) => {
			this.renderDataLayers();
		});

		this.$watch('filters.nodes', (c) => {
			if( c.active ) {
				this.showNodes();
			} else {
				this.hideNodes();
			}
		}, {deep:true});

		this.$watch('filters.subnodes', (c) => {
			if( c.active ) {
				this.showSubnodes();
			} else {
				this.hideSubNodes();
			}
		}, {deep:true});

		this.$watch('isNodePlannerActive', (c) => {
			this.redrawNodePlannerConnections();
		});

		document.addMarker = (x,y) => {
			var marker = new Leaflet.circleMarker( this.unproject([x,y], 'kr'), {
				renderer: this.gatheringLayerRenderer,
				fill: true,
				fillColor: '#FFF',
				fillOpacity: 0.9,
				stroke: true,
				width: 3,
				color: '#F0F',
				opacity: 1,
				radius: 6
			} );
			marker.addTo(this.map);
		};

		this.$watch('filters.custom', () => {
			for( var item in this.filters.custom ) {
				if( this.filters.custom[item].active ) {
					this.showDataLayer(item);
				} else {
					this.hideDataLayer(item);
				}
			}
		}, {deep:true});

		// Watch the gathering filter subnodes for changes
		// so we can load in the data then display it
		// Ideally the datastore would $watch for one activating that
		// wasn't already loaded in but simplestore doesn't have $watch
		// so we're doing it here instead
		this.$watch('filters.gathering', (categories) => {
			for( let c in categories ) {
				for( let item in categories[c].items ) {

					// Did we just start loading?
					if( categories[c].items[item].active && !categories[c].items[item].loaded ) {
						this.$action('mapdata:loadGatheringData', {category: c, name:item, item:categories[c].items[item]});
					}

					// Are we done loading?
					if( categories[c].items[item].loaded ) {
						if( categories[c].items[item].active ) {
							this.showGatheringLayer(item);
						} else {
							this.hideGatheringLayer(item);
						}
					}

				}
			}
		}, {deep:true});

		// Watch for new gathering data
		this.$watch('data.gathering', (gatheringData) => {
			// Find new keys
			for( let category in gatheringData ) {
				for( let j in gatheringData[category] ) {
					if( !this.gatheringLayers[j] ) {
						this.renderGatheringLayer(category,j);
					}
				}
			}

		}, {deep:true});

	},

	methods: {

		showNodes: function() {
			this.mainGroup && this.map.addLayer(this.mainGroup);
		},

		hideNodes: function() {
			this.mainGroup && this.map.removeLayer(this.mainGroup);
		},

		showSubnodes: function() {
			this.subnodeGroup && this.map.addLayer(this.subnodeGroup);
		},

		hideSubNodes: function() {
			this.subnodeGroup && this.map.removeLayer(this.subnodeGroup);
		},

		showGatheringLayer: function(name) {
			if( this.gatheringLayers[name] ) {
				this.map.addLayer(this.gatheringLayers[name]);
			}
		},

		hideGatheringLayer: function(name) {
			if( this.gatheringLayers[name] ) {
				this.map.removeLayer(this.gatheringLayers[name]);
			}
		},

		// Change CSS class (z2 -> z3 -> z4 -> etc) on map container when
		// user zooms the map.
		registerMapHooksForChangeClassOnZoom: function() {
			Leaflet.Map.mergeOptions({
				zoomCss: true
			});
			Leaflet.Map.ZoomCSS = Leaflet.Handler.extend({
				addHooks: function () {
					this._zoomCSS();
					this._map.on('zoomend', this._zoomCSS, this);
				},
				removeHooks: function () {
					this._map.off('zoomend', this._zoomCSS, this);
				},
				_zoomCSS: function (e) {
					let map = this._map,
					zoom = map.getZoom(),
					container = map.getContainer();
					container.className = container.className.replace( /\sz[0-9]{1,2}/g, '' ) + ' z' + Math.ceil(zoom);
				}
			});
			Leaflet.Map.addInitHook('addHandler', 'zoomCss', L.Map.ZoomCSS);
		},

		unproject: function(coords) {
			var convertedCoords;

			// Is is an x/y object
			if(coords.x !== undefined) {
				// Did we specify a different coord format
				if( coords.fmt ) {
					convertedCoords = this.cs.convert( [coords.x, coords.y], coords.fmt, 'sl2' );
				} else {
					convertedCoords = this.cs.convert( [coords.x, coords.y], 'kr', 'sl2' );
				}

			// Just an [x,y] array
			} else {
				convertedCoords = this.cs.convert( coords, 'kr', 'sl2' );
			}
			convertedCoords[0] += this.xOffset;
			convertedCoords[1] += this.yOffset;
			return this.map.unproject(convertedCoords,7);
		},

		getXyForNode: function(nodeId) {
			if( !this.data.nodes[nodeId] || !this.data.nodes[nodeId].location ) {
				return false;
			}
			return this.data.nodes[nodeId].location;
		},

		zoomMapToCoords: function(coords) {
			let xy = this.unproject(coords);
			this.map.setView( xy, 6, {
				pan:  { animate: true, duration: 1, easeLinearity: 0.4 },
				zoom: { animate: true }
			});
		},

		pingCoords: function(coords) {
			this.pingLayer.ping( this.unproject(coords) );
		},

		renderUpcomingContentDecorations: function() {
			// Should we add an invisible wall indicator for upcoming content?
			if( this.data.defaultlayer &&
				(!this.data.defaultlayer.properties ||
					(this.data.defaultlayer.properties && !this.data.defaultlayer.hidden)
				) 
			){
				
				// return {
				// weight: 6,
				// color: "#d32f2f",
				// opacity: 0.8,
				// dashArray: '7'
				// }
				var newLayer = Leaflet.geoJson(this.data.defaultlayer, {

					coordsToLatLng: (xy) => {
						if( xy.x ) {
							return this.unproject( {x:xy.x,y:xy.y,fmt:'kr'} );
						}
						return this.unproject( {x:xy[0],y:xy[1],fmt:'kr'} );
					},

					pointToLayer: (feature, latlng) => {
						if( feature.properties && feature.properties.label ) {
							let labelText = feature.properties.label;

							// Do we have transforms specified for this label?
							var labelElementStyle = '';
							if( feature.properties.labelrotation || feature.properties.labelscale ) {
								labelElementStyle = 'transform:';
								if( feature.properties.labelrotation ) {
									labelElementStyle += ' rotate('+feature.properties.labelrotation+'deg)';
								}
								if( feature.properties.labelscale ) {
									labelElementStyle += ' scale('+feature.properties.labelscale+')';
								}
							}

							// Create the icon
							var myIcon = L.divIcon({
								iconSize: new L.Point(10, 10),
								className: "label label-next-area",
								html: (labelElementStyle ? ('<span style="'+labelElementStyle+'">') : '<span>') + labelText + '</span>'
							});
							return L.marker(latlng, {icon: myIcon});
						}
					},

					onEachFeature: (feature, layer) => {

					},

					style: (feature) => {
						var style = {
							clickable: true,
							interactive: true
						};
						if( feature.properties && feature.properties.style ) {
							return feature.properties.style;
						}
						return style;
					},

					// Don't show features that have the 'hidden' property
					filter: (feature, layer) => {
						if (feature.properties) {
							return feature.properties.hidden !== undefined ? !feature.properties.hidden : true;
						}
						return true;
					},
				}).addTo(this.map);
			}
		},

		renderNodes: function() {

			let subnodeTypes = ['Forest','Mine','Bank','Farm','Mushrooms','Specialty','Fishing','Excavation'];
			let mainGroup = Leaflet.layerGroup();
			let subnodeGroup = Leaflet.layerGroup();
			let linksWithPolylines = {};

			let icons = {
				'trader': Leaflet.divIcon({
					className: "marker-trader",
					html: '<div class="icon"></div>',
				}),
				'Imperial': Leaflet.divIcon({
					className: "marker-trader-imperial",
					html: '<div class="icon"></div>',
				}),
				'Smuggler': Leaflet.divIcon({
					className: "marker-trader-smuggler",
					html: '<div class="icon"></div>',
				}),
				'node-manager': Leaflet.divIcon({
					className: "marker-npc marker-node-manager",
					html: '<div class="icon"></div>',
				})
			};

			var polylineOverrides = {
				// Kashuma Island to Derko Island
				'1370-1376': [ this.unproject([724043,459569]), this.unproject([792491,459003]) ],
				// Valencia City to Rakshan Observatory
				'1301-1339': [ this.unproject([1013109,251962]) ]
			};
			this.polylineOverrides = polylineOverrides;

			for( let i in this.data.nodes ) {
				let nodeInfo = this.data.nodes[i];

				// Don't have node information? Skipping
				if( !nodeInfo.location ) {
					window.console.log('[MapView]','Skipping node (no location)',nodeInfo.id);
					continue;
				}

				if( nodeInfo.hidden ) {
					continue;
				}

				let loc = {x:nodeInfo.location.x,y:nodeInfo.location.y,fmt:'kr'};
				if( nodeInfo.location.fmt ) {
					loc.fmt = nodeInfo.location.fmt;
				}
				let isSubnode = subnodeTypes.indexOf( nodeInfo.type ) > -1;

				// Add detail (output)
				let detail = '';
				if( nodeInfo.primary_output ) {
					for( let t in nodeInfo.primary_output ) {
						let outputSrc = 'icons/'+nodeInfo.primary_output[t].id+'.png';
						let outputName = nodeInfo.primary_output[t].name;
						detail += '<b><img src="'+outputSrc+'"> '+outputName+'</b>';
					}
				}
				if( nodeInfo.secondary_output ) {
					for( let t in nodeInfo.secondary_output ) {
						let outputSrc = 'icons/'+nodeInfo.secondary_output[t].id+'.png';
						let outputName = nodeInfo.secondary_output[t].name;
						detail += '<b class="secondary"><img src="'+outputSrc+'"> '+outputName+'</b>';
					}
				}

				let icon = Leaflet.divIcon({
					className: nodeInfo.type.replace(/\s/,"-")+" marker-node",
					html: '<div class="icon"></div><h3>'+nodeInfo.name+"</h3>"+
						'<i class="contrib">'+nodeInfo.contribution+'</i>'+
						'<div class="detail">'+detail+'</div>',
				});

				let marker = new Leaflet.marker( this.unproject(loc), {icon: icon, data: {type:'node',id:i},riseOnHover: true } );
				marker.on('click', this.onNodeMarkerClick);
				marker.on('mouseover', this.onNodeMarkerHover);
				marker.on('mouseout', this.onNodeMarkerHoverOut);

				if( isSubnode ) {
					marker.addTo( subnodeGroup );
				} else {
					marker.addTo( mainGroup );
				}

				// Add lines
				for( let k in nodeInfo.links ) {

					if( !this.data.nodes[nodeInfo.links[k]] ) {
						continue;
					}

					if( this.data.nodes[nodeInfo.links[k]].hidden ) {
						continue;
					}

					var connectionLoc = this.getXyForNode(nodeInfo.links[k]);
					if( !connectionLoc ) {
						continue;
					}

					let isLinkASubnode = isSubnode || subnodeTypes.indexOf(this.data.nodes[nodeInfo.links[k]].type) > -1;

					var id1 = nodeInfo.id;
					var id2 = nodeInfo.links[k];

					var linkKey = id1 < id2 ? (id1+"-"+id2) : (id2+"-"+id1);

					if( linksWithPolylines[linkKey] ) {
						continue;
					} else {
						linksWithPolylines[linkKey] = true;
					}

					var polyline = [
						this.unproject(loc),
						this.unproject(connectionLoc)
					];

					if( polylineOverrides[linkKey] ) {
						polyline.splice(1,0, ...polylineOverrides[linkKey]);
					}

					var connectionStyle = 'default';

					// Resource node?
					if( isLinkASubnode ) {
						connectionStyle = 'subnode';

					// Is it a margoria ocean node?
					} else if( (id1 >= 1400 && id1 <= 1449) || (id2 >= 1400 && id2 <= 1449) ) {
						connectionStyle = 'ocean';
					}

					var linkcolor = isLinkASubnode ? '#FF5722' : '#FFB300';
					var linkopacity = 0.6;



					var connection = Leaflet.polyline( polyline, this.nodeConnectionTypeStyles[connectionStyle]['default']);
					connection.nodeConnectionStyle = connectionStyle;

					// Store this line so we can access it by key when changing styles/etc later
					this.nodeConnections[linkKey] = connection;

					connection.addTo( isLinkASubnode ? subnodeGroup : mainGroup );
				}

				// Add traders
				if( nodeInfo.traders ) {
					for( let t in nodeInfo.traders ) {
						// Convert kr x/y to map x/y
						let naLoc = nodeInfo.traders[t].location;
						let traderClass = nodeInfo.traders[t].type.replace(/\s/,"-");
						let traderMarker = new Leaflet.marker(
							this.unproject(naLoc), {
								icon: icons[traderClass] || icons['trader'],
								title: nodeInfo.traders[t].name + '('+(nodeInfo.traders[t].role ? nodeInfo.traders[t].role : nodeInfo.traders[t].type)+')',
 								data: {type:'npc', subtype: 'trader', npc: nodeInfo.traders[t], id: nodeInfo.traders[t].id, node: {type:'node',id:nodeInfo.id}}
							}
						)
						traderMarker.addTo(mainGroup);
						traderMarker.on('click', this.onSubMarkerClick);
						traderMarker.on('mouseover', this.onNPCMarkerHover);
						traderMarker.on('mouseout', this.onNPCMarkerHoverOut);
					}
				}

				// Add node manager icon
				if( nodeInfo.node_manager && nodeInfo.node_manager.location ) {
					let naLoc = {x:nodeInfo.node_manager.location.x,y:nodeInfo.node_manager.location.y,fmt:'kr'};
					let npcMarker = new Leaflet.marker(
						this.unproject(naLoc), {
							icon: icons['node-manager'],
							title: nodeInfo.node_manager.name + ' - ' + nodeInfo.name + ' Node Manager',
 							data: {type:'npc', subtype: 'nodemanager', npc: nodeInfo.node_manager, id: nodeInfo.node_manager.id, node: {type:'node',id:nodeInfo.id}}
						}
					);
					npcMarker.addTo(mainGroup);
					npcMarker.on('click', this.onSubMarkerClick);
					npcMarker.on('mouseover', this.onNPCMarkerHover);
					npcMarker.on('mouseout', this.onNPCMarkerHoverOut);
				}

				this.nodeMarkers[nodeInfo.id] = marker;
			};

			this.subnodeGroup = subnodeGroup;
			this.mainGroup = mainGroup;

			//subnodeGroup.addTo(this.map);
			if( this.filters.nodes.active ) {
				mainGroup.addTo(this.map);
			}
			if( this.filters.subnodes.active ) {
				subnodeGroup.addTo(this.map);
			}
		},

		renderGatheringLayer: function( category, name ) {

			console.log('[MapView]', 'renderGatheringLayer', category, name);
			let data = this.data.gathering[category][name];
			let filter = this.filters.gathering[category].items[name];
			let group = new Leaflet.layerGroup();

			let baseMarkerOptions = {
				renderer: this.gatheringLayerRenderer,
				fill: true,
				fillColor: '#FFF',
				fillOpacity: 0.9,
				stroke: false,
				width: 0.5,
				color: '#AAA',
				opacity: 1,
				radius: 3
			}
			let opts = Object.assign({}, baseMarkerOptions, filter.styles || {} );

			for( let i in data ) {
					let marker = new Leaflet.circleMarker( this.unproject(data[i]), opts );
					marker.addTo(group);
			}

			group.addTo(this.map);
			this.gatheringLayers[name] = group;

		},

		redrawNodePlannerConnections: function() {

			for( let i in this.data.nodes ) {
				let nodeInfo = this.data.nodes[i];

				if(!this.nodeMarkers[nodeInfo.id]) {
					continue;
				}

				// Don't have node information? Skipping
				if( !nodeInfo.location ) {
					window.console.log('[MapView]','Skipping node (no location)',nodeInfo.id);
					continue;
				}

				if( nodeInfo.hidden ) {
					continue;
				}

				// If the node planner is active, then grey out nodes which are not selected
				if( this.isNodePlannerActive ) {
					if( (nodeInfo.contribution == 0 || this.$root.nodePlanner.hasNode(nodeInfo.id)) ) {
						// We can proceed, we have this node in the planner

						// Find the marker for this node and highlight it
						if( this.nodeMarkers[nodeInfo.id]._icon ) {
							L.DomUtil.addClass(this.nodeMarkers[nodeInfo.id]._icon,'marker--nodeplanner-selected');
							L.DomUtil.removeClass(this.nodeMarkers[nodeInfo.id]._icon,'marker--nodeplanner-unselected');
						}

					} else {
						// Find the marker for this node and unhighlight it
						if( this.nodeMarkers[nodeInfo.id]._icon ) {
							L.DomUtil.addClass(this.nodeMarkers[nodeInfo.id]._icon,'marker--nodeplanner-unselected');
							L.DomUtil.removeClass(this.nodeMarkers[nodeInfo.id]._icon,'marker--nodeplanner-selected');
						}
						continue;
					}
				} else {
					for( let nodeid in this.nodeMarkers ) {
						if( !this.nodeMarkers[nodeid] || !this.nodeMarkers[nodeid]._icon ) {
							continue;
						}
						L.DomUtil.removeClass(this.nodeMarkers[nodeid]._icon,'marker--nodeplanner-selected');
						L.DomUtil.removeClass(this.nodeMarkers[nodeid]._icon,'marker--nodeplanner-unselected');
					}
				}

				let loc = {x:nodeInfo.location.x,y:nodeInfo.location.y,fmt:'kr'};

				// Add lines
				for( let k in nodeInfo.links ) {

					if( !this.data.nodes[nodeInfo.links[k]] ) {
						continue;
					}

					if( this.data.nodes[nodeInfo.links[k]].hidden ) {
						continue;
					}

					var id1 = nodeInfo.id;
					var id2 = nodeInfo.links[k];

					var linkKey = id1 < id2 ? (id1+"-"+id2) : (id2+"-"+id1);

					if( this.isNodePlannerActive && (this.data.nodes[nodeInfo.links[k]].contribution == 0 || this.$root.nodePlanner.hasNode(this.data.nodes[nodeInfo.links[k]].id)) ) {
						// We can proceed, we have this node in the planner
					} else {
						// Reset style if it was in plan before
						if( this.nodeConnections[linkKey] && this.nodeConnections[linkKey].isConnectedInPlan ) {
							this.nodeConnections[linkKey].isConnectedInPlan = false;
							this.nodeConnections[linkKey].setStyle(
								this.nodeConnectionTypeStyles[this.nodeConnections[linkKey].nodeConnectionStyle]['default']
							);
						}
						continue;
					}

					if( this.nodeConnections[linkKey] ) {
						this.nodeConnections[linkKey].isConnectedInPlan = true;
						this.nodeConnections[linkKey].setStyle(
							this.nodeConnectionTypeStyles[this.nodeConnections[linkKey].nodeConnectionStyle]['connected']
						);
					}
				}
			}

		},

		onNodeMarkerHover: function(e) {
			this.$dispatch('marker-hovered', e.target.options.data);
			this.showPopup( e, e.target, 'node', e.target.options.data );
			return true;
		},

		onNodeMarkerHoverOut: function(e) {
			//console.log(e);
			this.hidePopup();
			return true;
		},

		onNPCMarkerHover: function(e) {
			//this.$dispatch('marker-hovered', e.target.options.data);
			this.showPopup( e, e.target, 'npc', e.target.options.data );
			return true;
		},

		onNPCMarkerHoverOut: function(e) {
			//this.$dispatch('marker-hovered', e.target.options.data);
			this.hidePopup();
			return true;
		},

		onNodeMarkerClick: function(e) {
			this.$dispatch('marker-clicked', e.target.options.data);
			return true;
		},

		// When we click on a submarker (like a trader or a npc icon)
		onSubMarkerClick: function(e) {
			this.$dispatch('marker-clicked', e.target.options.data.node);
			return true;
		},

		onMapClick: function(e) {
			var xy = this.map.project([e.latlng.lat,e.latlng.lng],7);
			console.log(xy);
			xy = this.cs.convert( [xy.x - this.xOffset,xy.y - this.yOffset], 'sl2', 'kr' );
			console.log(xy);
			this.currentLatLng = {x:Math.round(xy[0]), y: Math.round(xy[1])};
			this.$dispatch('map-clicked', this.currentLatLng);
			return true;
		},

		onDataLayerFeatureClick: function(e) {
			if( !e.target.feature ) {
				return;
			}
			this.$dispatch('marker-clicked', {type: 'feature', layer: e.target.feature.layerName, id: e.target.feature.id});
			return true;
		},

		selectNode: function(id,ping=false,zoom=true) {
			let node = this.data.nodes[id];
			if( !node ) {
				return;
			}
			let marker = this.nodeMarkers[id];

			// Is this a subnode?
			if( node.parent ) {
				this.filters.subnodes.active = true;
			}

			let latlng = marker.getLatLng();
			zoom && this.map.setView( latlng, 6, { animate: true });
			ping && this.pingLayer.ping( latlng );
		},

		pingNode: function(id) {
			let node = this.data.nodes[id];
			if( !node ) {
				return;
			}
			let marker = this.nodeMarkers[id];

			// Do we need to ping the parentnode instead?
			if( node.parent && !this.filters.subnodes.active ) {
				let latlng = this.nodeMarkers[node.parent].getLatLng();
				this.pingLayer.ping( latlng );
			} else {
				let latlng = marker.getLatLng();
				this.pingLayer.ping( latlng );
			}

		},

		selectDataLayerFeature: function(type,id,ping=false,zoom=true) {

			// Show the layer
			if(this.filters[type] && !this.filters[type].active) {
				this.filters[type].active = true;
			}

			// Find the marker/polygon/feature for this item and ping it
			//for( var featureIdx in this.dataLayers ) {
			var features = this.dataLayers[type].getLayers();
			for( var f in features ) {
				if( features[f].feature.id == id ) {
					if( features[f].getLatLng ) {
						zoom && this.map.setView( features[f].getLatLng(), 6, { animate: true });
						ping && this.pingLayer.ping( features[f].getLatLng() );
					} else if(features[f].getBounds ) {
						zoom && this.map.fitBounds(
							features[f].getBounds(),
							{
								animate: true,
								paddingTopLeft: [400, 50],
								paddingBottomRight:	[50,50],
								maxZoom: 6,
								pan:  { animate: true, duration: 1, easeLinearity: 0.4 },
								zoom: { animate: true }
							});
					}
				}
			}
		},

		pingDataLayerFeature: function(type,id) {

			// Don't ping if the layer is turned off
			if(this.filters[type] && !this.filters[type].active) {
				return;
			}

			// Find the marker/polygon/feature for this item and ping it
			for( var featureIdx in this.dataLayers ) {
				var features = this.dataLayers[featureIdx].getLayers();
				for( var f in features ) {
					if( features[f].feature.id == id ) {
						if( features[f].getLatLng ) {
							this.pingLayer.ping( features[f].getLatLng() );
						} else if(features[f].getBounds ) {
							this.pingLayer.ping( features[f].getBounds().getCenter() );
						}
					}
				}
			}
		},

		renderDataLayers: function() {

			console.log('[MapView]', 'renderDataLayers');

			// Render & watch any other layers
			for( var k in this.data.layers ) {

				// No filter exists, must be a work-in-progress data layer so
				// lets skip it
				if( !this.filters[k] ) {
					continue;
				}
				let layerName = k;
				this.renderDataLayer( layerName, this.data.layers[layerName] );
				this.$watch('filters.'+layerName, function(c,k)  {
					if( c.active ) {
						this.showDataLayer( layerName );
					} else {
						this.hideDataLayer( layerName );
					}
				}, {deep: true});

				if( this.filters[layerName].active ) {
					this.showDataLayer( layerName );
				}

			}

		},

		renderDataLayer: function(layerName,layerData) {
			console.log('[MapView]','renderDataLayer',layerName);

			var map = this.map;
			var icon = markerIcons[layerName] || markerIcons.default;

			var testData = {"type": "FeatureCollection","features": [{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":{"x":10816,"y":14540}}}]};
			var newLayer = Leaflet.geoJson(layerData, {

				coordsToLatLng: (xy) => {
					if( xy.x ) {
						return this.unproject( {x:xy.x,y:xy.y,fmt:'kr'} );
					}
					return this.unproject( {x:xy[0],y:xy[1],fmt:'kr'} );
				},

				pointToLayer: (feature, latlng) => {

					if( feature.properties && (feature.properties.labelposition || feature.properties.label)  ) {
						var labelText = '';
						var labelDetail = '';
						var levelRating = '';

						// Get the main label
						if( feature.properties.label ) {
							labelText = feature.properties.label;
						} else if( feature.properties.name ) {
							labelText = feature.properties.name;
						}

						// The second part of the label is specified explicitly in the item properties?
						if( feature.properties.labeldetail ) {
							labelDetail = feature.properties.labeldetail;

						// No specific label detail part? Check to see if it has levelling area info:
						} else {
							if( feature.properties.uselevelforlabel ) {
								levelRating += feature.properties.level;
								labelDetail = levelRating;
							}
							if( feature.properties.useapdpforlabel ) {
								if( feature.properties.uselevelforlabel ) {
									levelRating += '<br>';
								}
								levelRating += feature.properties.apdp;
								labelDetail = levelRating;
							}
						}

						// Do we have transforms specified for this label?
						var labelElementStyle = '';
						if( feature.properties.labelrotation || feature.properties.labelscale ) {
							labelElementStyle = 'transform:';
							if( feature.properties.labelrotation ) {
								labelElementStyle += ' rotate('+feature.properties.labelrotation+'deg)';
							}
							if( feature.properties.labelscale ) {
								labelElementStyle += ' scale('+feature.properties.labelscale+')';
							}
						}

						// Create the icon
						var myIcon = L.divIcon({
							iconSize: new L.Point(10, 10),
							className: "label label-for-data-layer-feaure label-on-data-layer-"+layerName,
							html: (labelElementStyle ? ('<span style="'+labelElementStyle+'">') : '<span>') + '<b>'+labelText+'</b><br><i>'+labelDetail+'</i></span>'
						});
						return L.marker(latlng, {icon: myIcon});
					}
					if( feature.properties && feature.properties.type && markerIcons[layerName+'-'+feature.properties.type] ) {
						return Leaflet.marker(latlng, {icon:markerIcons[layerName+'-'+feature.properties.type]});
					} else if( feature.properties && feature.properties.iconurl ) {
						return Leaflet.marker(latlng, {icon:
							new Leaflet.Icon({
								iconUrl: feature.properties.iconurl,
								iconSize: [16, 21],
								iconAnchor: [8, 21],
								popupAnchor: [8, 0]
							})
						});
					} else if( layerName == 'fishinghotspots' ) {

						// Find the specific icon for this type of fish
						for( var fishIdx in fishlist ) {
							if( fishlist[fishIdx] == feature.properties.type ) {
								// Return 'Other' fish marker
								return Leaflet.marker(latlng, {icon:markerIcons[layerName+'-'+fishIdx]});
							}
						}
						// Return 'Other' fish marker
						return Leaflet.marker(latlng, {icon:markerIcons[layerName+'-'+'16']});
					}
					return Leaflet.marker(latlng, {icon:icon});
				},

				onEachFeature: (feature, layer) => {

					if( feature.id ) {
						layer.feature.id = feature.id;
					}
					layer.feature.layerName = layerName;

					if( !this.tooltip ) {
						this.tooltip = new L.Rrose({
							offset: new L.Point(0,-15),
							closeButton: false,
							autoPan: false,
							zoomAnimation: false
						})
					}
					layer.on('mouseover', e => {
						this.showPopup( e, layer, layerName, feature )
					});
					layer.on('mouseout', e => { this.hidePopup() });
					layer.on('click', this.onDataLayerFeatureClick );
					layer.on('mousemove', e => { this.tooltip.setLatLng(e.latlng) });
				},

				style: (feature) => {
					var style = {
						clickable: true,
						interactive: true
					};

					if( layerName == 'levellingareas' ) {
						style.color = '#FF9800';
					}

					if( feature.properties && feature.properties.style ) {
						return feature.properties.style;
					}
					return style;
				},

				// Don't show features that have the 'hidden' property
				filter: (feature, layer) => {
					if (feature.properties) {
						return feature.properties.hidden !== undefined ? !feature.properties.hidden : true;
					}
					return true;
				},
			});

			this.dataLayers[layerName] = newLayer;

		},

		showDataLayer: function( layerName ) {
			console.log('[MapView]','showDataLayer',layerName);
			this.dataLayers[layerName] && this.map.addLayer(this.dataLayers[layerName]);
		},

		hideDataLayer: function( layerName ) {
			console.log('[MapView]','hideDataLayer',layerName);
			this.dataLayers[layerName] && this.map.removeLayer(this.dataLayers[layerName]);
		},

		showPopup: function( mouseEvt, marker, type, item ) {

			if( type == 'horses' || type == 'elephants' || type == 'whales' ) {
				return;
			}

			var headerContent = '';
			var bodyContent = '';
			var footerContent = '';

			var typeName;
			if( type == 'scrollbosses' ) {
				typeName = 'Scroll Boss';
			} else if( type == 'worldbosses' ) {
				typeName = 'World Boss';
			}

			if( type == 'node' ) {
				let node = this.data.nodes[item.id];
				let nodeResults = this.getPopupContentsForNode(node);
				headerContent = nodeResults.headerContent;
				bodyContent = nodeResults.bodyContent;
				footerContent = nodeResults.footerContent;
			}

			if( type == 'npc' ) {
				if( item.subtype == 'trader' ) {
					let npc = item.npc;
					if( npc.name ) {
						headerContent += '<h2>' + npc.name + '</h2>';
					}
					if( npc.type || npc.role ) {
						headerContent += '<h3>' + (npc.role ? (npc.role) : npc.type) + '</h3>';
					}
				}
				if( item.subtype == 'nodemanager' ) {
					let npc = item.npc;
					if( npc.name ) {
						headerContent += '<h2>' + npc.name + '</h2>';
					}
					if( item.node && this.data.nodes[item.node.id] ) {
						headerContent += '<h3>Node Manager: ' + this.data.nodes[item.node.id].name + '</h3>';
					}
				}
			}

			if( item.properties ) {

				if( type == 'treasurechests' && !item.properties.name ) {
					item.properties.name = 'Treasure Chest';
				}

				if( item.properties.name ) {
					headerContent += '<h2>' + item.properties.name + '</h2>';
				}
				if( item.properties.title ) {
					headerContent += '<h2>' + item.properties.title + '</h2>';
				}
				if( item.properties.type && type != 'treasurechests' ) {
					headerContent += '<h3>' + item.properties.type + (typeName ? (' '+typeName) : '') + '</h3>';
				}
				if( item.properties.level ) {
					bodyContent += '<p>Level ' + item.properties.level + '</p>';
				}
				if( item.properties.rating ) {
					bodyContent += '<p>' + item.properties.rating + '</p>';
				}
				if( type != 'levellingareas' && type != 'searegions' && item.properties.notes ) {
					bodyContent += '<p>' + item.properties.notes + '</p>';
				}

				// If its a sea region, the tooltip should be the origin node
				// followed by the list of fish
				if( type == 'searegions' ) {
					if( item.properties.originnode ) {
						bodyContent += '<p class="originnode"><b>Origin node:</b> ' + item.properties.originnode + '</p>';
					}
					if( item.properties.drops ) {
						// Group the drops by category (which we use to separate multiple areas in the same sea)
						// and sort them by sortorder then name
						var dropGroups = {};
						var drops = item.properties.drops.sort( (a,b) => {
							var aso = ( a && a.sortorder !== undefined && a.sortorder !== null ) ? a.sortorder : false;
							var bso = ( b && b.sortorder !== undefined && b.sortorder !== null ) ? b.sortorder : false;
							if(aso && bso) {
								return aso - bso;
							} else if( aso && !bso ) {
								return -1;
							} else if( bso && !aso ) {
								return 1;
							} else if( a.quality && b.quality ) {
								var qualities = ['white','green','blue','yellow','orange','red'];
								var r = qualities.indexOf(b.quality) - qualities.indexOf(a.quality);
								if( r === 0 ) {
									return (a.name == b.name) ? 0 : (a.name < b.name ? -1 : 1);
								}
								return r;
							} else if( a.rarity && b.rarity ) {
								var qualities = ['white','green','blue','yellow','orange','red'];
								var r = qualities.indexOf(b.rarity) - qualities.indexOf(a.rarity);
								if( r === 0 ) {
									return (a.name == b.name) ? 0 : (a.name < b.name ? -1 : 1);
								}
								return r;
							} else {
								return (a.name == b.name) ? 0 : (a.name < b.name ? -1 : 1);
							}
						} );
						// Quickly check if there are fish categories so they can go first
						// because people care about fishing far more than harpooning
						for( var dropIdx in drops ) {
							if( !dropGroups[drops[dropIdx].category] && drops[dropIdx].category.indexOf('Fish') === 0 ) {
								dropGroups[drops[dropIdx].category] = [];
							}
						}
						// Add the rest of the categories and the items for them
						for( var dropIdx in drops ) {
							if( !dropGroups[drops[dropIdx].category] ) {
								dropGroups[drops[dropIdx].category] = [];
							}
							dropGroups[drops[dropIdx].category].push(drops[dropIdx]);
						}

						for( var dropgroupIdx in dropGroups) {
							bodyContent += '<p class="drops"><b>'+dropgroupIdx+':</b> ';
							var dropText = [];
							for( var dropIdx in dropGroups[dropgroupIdx] ) {
								var drop = dropGroups[dropgroupIdx][dropIdx];
								dropText.push( '<span class="drop--rarity-'+drop.rarity+'">'+drop.name+'</span>' );
							}
							bodyContent += dropText.join(', ');
							bodyContent += '</p>';
						}
					}
				}

			}

			var content = '<div class="map-tooltip ';
			content += headerContent ? 'has-header-content ' : '';
			content += bodyContent ? 'has-body-content ' : '';
			content += footerContent ? 'has-footer-content' : '';
			content += '">';

			content += headerContent ? ('<div class="header">'+headerContent+'</div>') : '';
			content += bodyContent ? ('<div class="body">'+bodyContent+'</div>') : '';
			content += footerContent ? ('<div class="footer">'+footerContent+'</div>') : '';

			content += '</div>';

			if( !headerContent && !bodyContent && !footerContent ) {
				return;
			}

			this.tooltip.setContent(content)
					.setLatLng(mouseEvt.latlng)
					.openOn(this.map);
		},

		getPopupContentsForNode: function( node ) {

			let headerContent = '';
			let bodyContent = '';
			let footerContent = '';

			headerContent += node.contribution ? ('<span class="cp"><b>'+node.contribution+'</b>CP</span>') : '';

			// Ocean nodes get their ID prepended to name so its easier to reference
			if( node.id >= 1400 && node.id <= 1449) {
				headerContent += '<h2>' +node.name+ ' ('+node.id+')</h2>';
			} else {
				headerContent += '<h2>' +node.name+ '</h2>';
			}
			headerContent += '<h3>' +node.type+ ' Node</h3>';

			// Display any output from the current node
			bodyContent += this.getHtmlListOfOutputsForNode(node);

			// Loop through all of the childnodes so we can display what they give
			for( let k in node.childnodes ) {

				// Make sure we have the child node and its not hidden
				if( !this.data.nodes[node.childnodes[k]] || this.data.nodes[node.childnodes[k]].hidden ) {
					continue;
				}

				let childNode = this.data.nodes[node.childnodes[k]];

				// Don't display specialty nodes or banks
				if( childNode.type == 'Specialty' || childNode.type == 'Bank' ) {
					continue;
				}

				let childNodeContent = '';
				childNodeContent += '<h5><b>'+ childNode.type + '</b> &ndash; '+childNode.contribution+'CP</h5>';
				childNodeContent += this.getHtmlListOfOutputsForNode(childNode);

				bodyContent += childNodeContent;
			}

			return {headerContent: headerContent, bodyContent: bodyContent, footerContent: footerContent};
		},

		getHtmlListOfOutputsForNode: function(node) {
			let nodeContent = '';
			if( node.primary_output ) {
				nodeContent += '<ul class="output">';
				for( let po in node.primary_output) {
					nodeContent += '<li class="primary">';
					nodeContent += '<img src="icons/'+node.primary_output[po].id+'.png">';
					nodeContent += '<b>'+ node.primary_output[po].name +'</b>';
					nodeContent += '</li>';
				}
				nodeContent += !node.secondary_output ? '</ul>' : '';
			}
			if( node.secondary_output ) {
				for( let po in node.secondary_output) {
					nodeContent += '<li class="secondary">';
					nodeContent += '<img src="icons/'+node.secondary_output[po].id+'.png">';
					nodeContent += '<b>'+ node.secondary_output[po].name +'</b>';
					nodeContent += '</li>';
				}
				nodeContent += '</ul>';
			}
			return nodeContent;
		},

		hidePopup: function() {
			this.map.closePopup()
		},

		loadExternalGeoJSONFiles: function() {
			// This is a shitty place to have this code
			// but it'll hardly be used so cba to properly architect it in
			var query = this.$root.router.query();
			if( query && query.external ) {
				var urls = query.external.split('|');
				for( var i in urls ) {
					this.loadExternalGeoJSONFile(urls[i]);
				}
			}
		},

		loadExternalGeoJSONFile: function( url ) {
			console.log('[MapView]','loadExternalGeoJSONFile',url);

			return fetch(url).then( (response) => {
				return response.json();
			}).then( (j) => {

				var map = this.map;
				var icon = markerIcons.default;
				var name = '';
				if( j.properties ) {
					if( j.properties.name ) {
						name = j.properties.name;
					} else if( j.properties.id ) {
						name = k.properties.id;
					}
				}
				// If there is no name specified in the properties of the GeoJSON collection,
				// then just use the latter part of the URL
				if(!name) {
					var reg = /.+?\:\/\/.+?(\/.+?)(?:#|\?|$)/;
					var matches = reg.exec( url );
					if( matches && matches[1] ) {
						name = matches[1] + matches[2];
					}
				}
				var newLayer = Leaflet.geoJson(j, {
					coordsToLatLng: (xy) => {
						return this.unproject( {x:xy[0],y:xy[1],fmt:'kr'} );
					},

					pointToLayer: (feature, latlng) => {
						return Leaflet.marker(latlng, {icon:icon});
					},

					// Set-up the tooltip hover
					onEachFeature: (feature, layer) => {
						if( !this.tooltip ) {
							this.tooltip = new L.Rrose({
								offset: new L.Point(0,-15),
								closeButton: false,
								autoPan: false,
								zoomAnimation: false
							})
						}
						layer.on('mouseover', e => {
							if( feature.properties && feature.properties.tooltip ) {
								var content = '<div class="map-tooltip has-body-content"><div class="body"><p>'+feature.properties.tooltip+'</p></div></div>';
								this.tooltip.setContent(content)
										.setLatLng(e.latlng)
										.openOn(this.map);
							}
						});
						layer.on('mouseout', e => { this.hidePopup() });
						layer.on('mousemove', e => { this.tooltip.setLatLng(e.latlng) });
					},

					style: (feature) => {
						if( feature.properties.style ) {
							return feature.properties.style;
						}
						return {};
					}
				});

				this.dataLayers[url] = newLayer;
				this.showDataLayer(url);
				this.$root.registerCustomDataLayer(url,name,j.properties || {});
			});

		},

		onCurrentLatLngClicked: function(e) {

			if( this.currentLatLng ) {
				var x = this.currentLatLng.x;
				var y = this.currentLatLng.y;
			}

			var clipboardContent = '';
			if( e.shiftKey ) {
				clipboardContent = '{x:'+x+' ,y:'+y+'}';
			} else {
				clipboardContent = [x,y].join(',');
			}

			clipboard.copy({
				"text/plain": clipboardContent
			});

			this.currentLatLngRecentlyCopied = true;
			setTimeout( () => {
				this.currentLatLngRecentlyCopied = false;
			}, 200 );
		}

	},

	events: {
		'nodeplanner-plan-changed': function() {
			this.redrawNodePlannerConnections();
		}
	}

};
</script>

<style src="./MapView.scss" lang="sass"></style>
