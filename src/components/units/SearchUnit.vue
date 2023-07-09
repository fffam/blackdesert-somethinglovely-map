<template>
	<div id="search-unit">
		<div class="searchfield" v-bind:class="{'has-item': !!autoCompletionImage}">
			<div class="cancel" v-if="searchText" v-on:click="onCancelSearchClicked">×</div>
			<input class="search-hint" v-model="autoCompletionText" disabled>
			<input class="search-field" v-el:search-Input v-model="searchText" placeholder="Search&hellip;" v-on:keyup.enter="onSearchEnterPressed" v-on:keyup.right="onSearchRightPressed" v-on:keyup.down="onSearchDownPressed" v-on:keyup.up="onSearchUpPressed">
			<img class="icon" v-bind:src="autoCompletionImage ? ('icons/'+autoCompletionImage+'.png') : ''" v-if="!!autoCompletionImage">
		</div>
		<ul>
			<li v-for="suggestion in autoCompletionSuggestions" v-bind:class="[ 'type-'+suggestion.type, {'selected': selectedSuggestion && compareSuggestions(selectedSuggestion,suggestion) } ]" v-on:click="onSuggestionClicked(suggestion)" v-on:mouseenter="onSuggestionHovered(suggestion)">

				<b class="icon-holder">
				<img class="icon" v-if="suggestion.type != 'node' && !suggestion.isDataLayer && !suggestion.isDataLayerOutput" v-bind:src="'icons/'+suggestion.id+'.png'">
				<node-icon v-if="suggestion.type =='node'" size="large" :type="suggestion.node.type"></node-icon>
				<data-layer-icon v-if="suggestion.isDataLayer && suggestion.type != 'fishinghotspots'" size="large" :type="suggestion.type"></data-layer-icon>
				<data-layer-fish-icon v-if="suggestion.isDataLayer && suggestion.type == 'fishinghotspots' && suggestion.ref.properties.type" size="large" :type="suggestion.type" :fish-type="suggestion.ref.properties.type"></data-layer-fish-icon>
				<img class="icon" v-if="suggestion.isDataLayerOutput" v-bind:src="'icons/'+suggestion.item.id+'.png'">
				</b>

				<div v-if="suggestion.type=='node'">
					<h4>{{suggestion.name}}</h4>
					<span>{{suggestion.node.type}} Node</span>
				</div>
				<div v-if="suggestion.type=='tradepack'">
					<h4>{{suggestion.name}}</h4>
					<span>Trade Pack <i>&mdash;</i> <skill-level :level="suggestion.ref.level_requirement"></skill-level></span>
					<span><i></i>{{suggestion.node.name}}</span>
				</div>
				<div v-if="suggestion.type=='output'">
					<h4>{{suggestion.name}}</h4>
					<span><i></i>{{suggestion.node.name}}</span>
				</div>
				<div v-if="suggestion.type=='gathering'">
					<h4>{{suggestion.name}}</h4>
					<span>Show gathering locations</span>
				</div>
				<div v-if="suggestion.isDataLayer">
					<h4>{{suggestion.name}}</h4>
					<span>{{suggestion.typeLabel}} <span v-if="suggestion.type == 'fishinghotspots' && suggestion.ref.properties.type">({{suggestion.ref.properties.type}})</span></span>
				</div>
				<div v-if="suggestion.isDataLayerOutput">
					<h4>{{suggestion.item.name}}</h4>
					<span v-if="suggestion.item.category">{{suggestion.item.category}}</span>
					<span><i></i>{{suggestion.name}}</span>
				</div>
			</li>
		</ul>
	</div>
</template>

<script>

import SkillLevel from '../common/SkillLevel.vue';
import NodeIcon from '../common/NodeIcon.vue';
import DataLayerIcon from '../common/DataLayerIcon.vue';
import DataLayerFishIcon from '../common/DataLayerFishIcon.vue';

export default {

	name: 'SearchUnit',

	components: {
		SkillLevel,
		NodeIcon,
		DataLayerIcon,
		DataLayerFishIcon
	},

	props: {
		searchText: {
			type: String,
			default: ''
		},
		selectedSuggestion: {
			default: null
		}
	},

	computed: {
		autoCompletionText: function() {
			if( this.searchText.length < 2 ) {
				return '';
			}

			let currentSuggestions = this.autoCompletionSuggestions;
			let escapedSearchText = this.searchText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			let startRegex = new RegExp( '^' + escapedSearchText ,'');
			if( currentSuggestions[0] && currentSuggestions[0].name.match(startRegex) && currentSuggestions[0].type != 'node' && !currentSuggestions[0].isDataLayer && !currentSuggestions[0].isDataLayerOutput ) {
				return currentSuggestions[0].name;
			} else {
				return '';
			}
			return this.searchText;
		},

		autoCompletionImage: function() {
			if( this.searchText.length < 2 ) {
				return '';
			}

			let currentSuggestions = this.autoCompletionSuggestions;
			let escapedSearchText = this.searchText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			let startRegex = new RegExp( '^' + escapedSearchText ,'');
			if( currentSuggestions[0] && currentSuggestions[0].name.match(startRegex) && currentSuggestions[0].type != 'node' && !currentSuggestions[0].isDataLayer && !currentSuggestions[0].isDataLayerOutput ) {
				return currentSuggestions[0].id;
			} else {
				return '';
			}
		},

		autoCompletionSuggestions: function() {
			return this.suggestionsForCurrentSearch();
		}

	},

	data: function() {
		return {
			mapdata: this.state.mapdata,
			filters: this.state.filters
		};
	},

	ready: function() {
		this.$watch('searchText', (c) => {
			if( this.selectedSuggestion ) {
				this.selectedSuggestion = null;
			}
		});
		this.$els.searchInput.focus();
	},

	events: {
		'marker-clicked': function (msg) {
		}
	},

	methods: {
		suggestionsForCurrentSearch: function() {

			if( this.searchText.length < 2 ) {
				return [];
			}

			let escapedSearchText = this.searchText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			let exactRegex = new RegExp( '^' + escapedSearchText + '$','i');
			let startRegex = new RegExp( '^' + escapedSearchText ,'i');
			let wordRegex = new RegExp( '\b' + escapedSearchText ,'i');
			let allRegex = new RegExp( escapedSearchText,'i');

			let results = [];
			for( let nodeid in this.mapdata.nodes ) {
				let node = this.mapdata.nodes[nodeid];

				if( node.hidden || !node.name ) {
					continue;
				}

				// Calculate relevance for this node
				let nodeRelevance = this.calculateRelevance(node.name,allRegex,startRegex,wordRegex,exactRegex);
				if( nodeRelevance > 0 ) {
					nodeRelevance += 0.3; // Small bump so nodes come first
					nodeRelevance += ((100-node.name.length)/100)*0.1; // Small bump based on length of name (smaller names should match first)
					results.push({
						relevance: nodeRelevance,
						type: 'node',
						id: nodeid,
						node: node,
						ref: this.mapdata.nodes[nodeid],
						name: node.name,
						icon: node.type
					});
				}

				if( node.traders ) {
					for( var traderid in node.traders) {
						for( var packid in node.traders[traderid].packs ) {
							let pack = node.traders[traderid].packs[packid];

							// Calculate relevance for this trade pack
							let packRelevance = this.calculateRelevance(pack.name,allRegex,startRegex,wordRegex,exactRegex);
							if( packRelevance > 0 ) {
								results.push({
									relevance: packRelevance,
									type: 'tradepack',
									id: pack.id,
									ref: pack,
									node: node,
									name: pack.name,
									img: pack.img
								});
							}

						}
					}
				}

				if( node.primary_output ) {
					for( var outputid in node.primary_output) {
						let item = node.primary_output[outputid];
						// Calculate relevance for this item
						if( !item.name ) { console.log(item,node) }
						let itemRelevance = this.calculateRelevance(item.name,allRegex,startRegex,wordRegex,exactRegex);
						if( itemRelevance > 0 ) {
							results.push({
								relevance: itemRelevance+0.2,
								type: 'output',
								id: item.id,
								ref: item,
								node: node,
								name: item.name,
								img: item.img
							});
						}
					}
					for( var outputid in node.secondary_output) {
						let item = node.secondary_output[outputid];
						// Calculate relevance for this item
						if( !item.name ) { console.log(item,node) }
						let itemRelevance = this.calculateRelevance(item.name,allRegex,startRegex,wordRegex,exactRegex);
						if( itemRelevance > 0 ) {
							results.push({
								relevance: itemRelevance+0.1,
								type: 'output',
								id: item.id,
								ref: item,
								node: node,
								name: item.name,
								img: item.img
							});
						}
					}
				}
			}

			for( var layerName in this.mapdata.layers ) {
				let layer = this.mapdata.layers[layerName];

				for( var featureIdx in layer.features ) {
					let feature = layer.features[featureIdx];
					if( feature.properties && feature.properties.name ) {
						let itemRelevance = this.calculateRelevance(feature.properties.name,allRegex,startRegex,wordRegex,exactRegex);
						if( itemRelevance > 0 ) {
							results.push({
								relevance: itemRelevance+0.21,
								isDataLayer: true,
								type: layerName,
								typeLabel: (layer.properties && layer.properties.singular) ? layer.properties.singular : layerName,
								id: feature.id,
								ref: feature,
								name: feature.properties.name,
								icon: layerName
							});
						} else if( layerName == 'fishinghotspots' && feature.properties.type && this.calculateRelevance(feature.properties.type,allRegex,startRegex,wordRegex,exactRegex) ) {
							results.push({
								relevance: itemRelevance+0.01,
								isDataLayer: true,
								type: layerName,
								typeLabel: (layer.properties && layer.properties.singular) ? layer.properties.singular : layerName,
								id: feature.id,
								ref: feature,
								name: feature.properties.name,
								icon: layerName
							});
						}

						// Search through any output/drops from this feature
						if( feature.properties.drops ) {
							for( let dropidx in feature.properties.drops ) {
								if(!feature.properties.drops[dropidx]) {
									continue;
								}
								let dropRelevance = this.calculateRelevance(feature.properties.drops[dropidx].name,allRegex,startRegex,wordRegex,exactRegex);
								if( dropRelevance > 0 ) {
									results.push({
										relevance: dropRelevance+0.11,
										isDataLayerOutput: true,
										type: layerName,
										typeLabel: (layer.properties && layer.properties.singular) ? layer.properties.singular : layerName,
										id: feature.id,
										ref: feature,
										item: feature.properties.drops[dropidx],
										name: feature.properties.name,
										icon: layerName
									});
								}
							}
						}

					}
				}
			}

			// Reverse sort
			return results.sort( (a,b) => b.relevance - a.relevance );

		},

		calculateRelevance: function( text, guardRegex, ...otherRegexes) {
			if( !text.match(guardRegex) ) {
				return 0;
			} else {
				let r = 1;
				for( let k in otherRegexes ) {
					if( text.match(otherRegexes[k]) ) {
						r++;
					}
				}
				return r;
			}
		},

		onSuggestionClicked: function(suggestion) {
			this.$dispatch('search-suggestion-clicked', suggestion);
			this.selectedSuggestion = suggestion;
			return true;
		},

		onSuggestionHovered: function(suggestion) {
			this.$dispatch('search-suggestion-hovered', suggestion);
			this.selectedSuggestion = suggestion;
			return true;
		},

		onCancelSearchClicked: function() {
			this.searchText = '';
			this.selectedSuggestion = null;
		},

		onSearchEnterPressed: function(e) {
			let suggestions = this.suggestionsForCurrentSearch();
			if( suggestions.length ) {
				this.selectedSuggestion = suggestions[0];
				//console.log(this.selectedSuggestion);
				this.$dispatch('search-suggestion-clicked', suggestions[0]);
			}
		},

		onSearchRightPressed: function(e) {
			if (e.target && typeof e.target.selectionStart != "number") {
				return;
			}
			//let isAtStart = (textInput.selectionStart == 0);
			let isAtEnd = (e.target.selectionEnd == e.target.value.length);
			if( !isAtEnd ) {
				return;
			}

			if( this.autoCompletionText ) {
				this.searchText = this.autoCompletionText;
			}
		},

		onSearchDownPressed: function(e) {
			let suggestions = this.suggestionsForCurrentSearch();
			if( suggestions.length ) {
				let found = !this.selectedSuggestion;
				for( let i in suggestions ) {
					if( found ) {
						this.selectedSuggestion = suggestions[i];
						this.$dispatch('search-suggestion-clicked', suggestions[i]);
						return;
					}
					if( this.compareSuggestions(suggestions[i], this.selectedSuggestion) ) {
						found = true;
					}
				}
			}
		},

		onSearchUpPressed: function(e) {
			let suggestions = this.suggestionsForCurrentSearch();
			if( suggestions.length ) {
				let found = false;
				let keys = Object.keys(suggestions).reverse();
				for( let i in keys ) {
					if( found ) {
						this.selectedSuggestion = suggestions[keys[i]];
						this.$dispatch('search-suggestion-clicked', suggestions[keys[i]]);
						return;
					}
					if( this.compareSuggestions(suggestions[keys[i]], this.selectedSuggestion) ) {
						found = true;
					}
				}
			}
		},

		compareSuggestions: function(a,b) {
			return (
				a.id == b.id &&
				a.type == b.type &&
				(!a.node || a.node.id == b.node.id)
			)
		}

	},

};
</script>

<style src="./SearchUnit.scss" lang="sass"></style>
