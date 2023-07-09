import Vue from 'vue'
import 'whatwg-fetch';

export default {

	name: 'mapdata',

	state: {
		sitemessage: "",
		sitemessagetakeover: false,
		nodes: {},
		layers: {},
		gathering: {},
		ready: false,
		loading: false,
		settings: {},
		filters: {}
	},

/*
	nodes: function() {
		if( this.nodeData ) {
			return new Promise(function(resolve) {
				resolve(this.nodeData);
			});
		} else {
			return this.loadNodeData();
		}
	},
*/

	load: function() {
		window.console.log('[MapDataStore]','load');
		this.state.loading = true;
		Promise.all( [this.loadNodes()] ).then( (j) => {
			this.state.ready = true;
			this.state.loading = false;
		}).catch( (e) => {
			window.console.error('Could not load map data',e);
			this.state.ready = false;
			this.state.loading = false;
		});
	},

	loadNodes: function() {
		window.console.log('[MapDataStore]','loadNodes');
		var devmode = window.location && window.location.hash && (window.location.hash.indexOf('devmode') > -1);

		var url = 'data.json';
		return fetch(url).then( (response) => {
			return response.json();
		}).then( (j) => {

			// If there is a 'map' key, use this data instead
			// so we can eventually move over to /map.json instead of
			// /.json
			if( j.map ) {
				j = j.map;
			}

			// Setup nodes
			this.state.nodes = j.nodes;

			// Unhide nodes in dev mode
			if( devmode ) {
				for( var nodeId in this.state.nodes ) {
					this.state.nodes[nodeId].hidden = false;
				}
			}

			// Is it April Fools? Lets unhide the southern mediah nodes
			let aprilFoolsStartTime = new Date('2018-04-01T00:00:00+00:00');
			let aprilFoolsEndTime = new Date('2018-04-02T10:00:00-00:00');
			let nowTime = new Date();
			if( nowTime.getTime() > aprilFoolsStartTime.getTime() && nowTime.getTime() < aprilFoolsEndTime.getTime() ) {
				for( var nodeId in this.state.nodes ) {
					if( nodeId >= 1700 && nodeId < 1800 ) {
						this.state.nodes[nodeId].hidden = false;
						if( !this.state.nodes[nodeId].type ) {
							this.state.nodes[nodeId].type = 'Connection';
						}
					}
				}
			}
			this.state.settings = j.settings || {};

			// Setup layers
			for( var l in j.layers ) {

				// Is this layer a dev-only layer?
				if( !devmode && j.layers[l].properties && (j.layers[l].properties.hidden) ) {
					delete j.layers[l];
					continue;
				}
				// Is this the levelling areas layer or the sea regions layer? If so we need to
				// convert them from polygons to featurecollections with the polygons
				// inside
				if( l == 'levellingareas' || l == 'searegions' || (j.layers[l].properties && j.layers[l].properties.labelPosition) ) {
					var features = [];
					for( var i in j.layers[l].features ) {
						var labelPosition = j.layers[l].features[i].properties.labelposition ? j.layers[l].features[i].properties.labelposition.split(',') : false;

						// No label position? Average out the geometry points
						if( !labelPosition ) {
							var totalx = 0;
							var totaly = 0;
							var totalcount = 0;
							for( var geo_i in j.layers[l].features[i].geometry.coordinates ) {
								if( !j.layers[l].features[i].geometry.coordinates[geo_i].x ) {
									for( var geo_k in j.layers[l].features[i].geometry.coordinates[geo_i] ) {
										totalx += j.layers[l].features[i].geometry.coordinates[geo_i][geo_k].x/100;
										totaly += j.layers[l].features[i].geometry.coordinates[geo_i][geo_k].y/100;
										totalcount++;
									}
								}
							}
							if( totalcount ) {
								labelPosition = [100*totalx/totalcount,100*totaly/totalcount];
							} else {
								labelPosition = [0,0];
							}
						}
						j.layers[l].features[i].properties.labelposition = labelPosition;
						var geomCollection = {
							id: j.layers[l].features[i].id,
							type: "GeometryCollection",
							properties: j.layers[l].features[i].properties,
							geometries: [
								j.layers[l].features[i].geometry,
								{
									type: "Point",
									coordinates: {x:labelPosition[0]*1,y:labelPosition[1]*1},
								}
							]
						}
						features.push( geomCollection );
					}
					j.layers[l].features = features;

				// If its not the levellingareas layer, just
				// convert it from an object to an array
				} else {
					var features = [];
					for( var f in j.layers[l].features ) {
						features.push(j.layers[l].features[f]);
					}
					j.layers[l].features = features;
				}
			}
			this.state.layers = j.layers;

			if( j.defaultlayer ) {
				var features = [];
				for( var f in j.defaultlayer.features ) {
					features.push(j.defaultlayer.features[f]);
				}
				j.defaultlayer.features = features;
				this.state.defaultlayer = j.defaultlayer;
			}

			// Get site message
			this.state.sitemessage = j.sitemessage;
			this.state.sitemessagetakeover = !!(j.sitemessagetakeover);

		}).catch( (e) => {
			window.console.error('Could not load node data',e);
			this.state.nodes = {};
			this.state.ready = false;
			this.state.loading = false;
		});
	},

	loadGatheringData: function( resource ) {
		window.console.log('[MapDataStore]','loadGatheringData',resource.name,resource.item);
		let resourceCategory = resource.category;
		let resourceType = resource.name;
		let resourceDetails = resource.item;

		// Is this a single ID per file or multiple?
		// Multiple IDs is used for the meat/hides/blood
		var url;
		if( resource.item.ids ) {
			var url = 'gathering/item-'+resource.item.id+'.json';
		} else {
			var url = 'gathering/a'+resource.item.id+'.json';
		}

		// Load the remote JSON
		this.state.loading = true;
		return fetch(url).then( (response) => {
			return response.json();
		}).then( (j) => {

			// Is it an array?
			// If YES: Its an array of xy coords for a single gathering node ID
			if( Array.isArray(j) ) {
				let gatheringFilters = this.state.filters.gathering;

				// Set the data
				if( !this.state.gathering[resourceCategory] ) {
					Vue.set(this.state.gathering,resourceCategory,{[resourceType]:j});
				} else {
					Vue.set(this.state.gathering[resourceCategory],resourceType,j);
				}

				// Set the filter as loaded
				gatheringFilters[resourceCategory].items[resourceType].loaded = true
				this.state.loading = false;


			// If NO: Its an object, keyed by ID of the npc that gives the item
		} else {
				let gatheringFilters = this.state.filters.gathering;
				let currentData = [];

				for( var i in resource.item.ids ) {
					if( j[i] ) {
						currentData = currentData.concat(j[i]);
					}
				}

				// Set the data
				if( !this.state.gathering[resourceCategory] ) {
					Vue.set(this.state.gathering,resourceCategory,{[resourceType]:currentData});
				} else {
					Vue.set(this.state.gathering[resourceCategory],resourceType,currentData);
				}

				// Set the filter as loaded
				gatheringFilters[resourceCategory].items[resourceType].loaded = true;
				this.state.loading = false;
			}

		}).catch( (e) => {
			window.console.error('Could not load gathering data',resource,e);
			this.state.loading = false;
		});
	},


}
