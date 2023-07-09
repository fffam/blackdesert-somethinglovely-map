<template>
	<div id="filters-unit">
	<h1>Filters</h1>
	<section class="section-nodes">
		<h2><span>Map</span></h2>
		<div class="checkbox-group main-filters">
			<h3>Nodes</h3>
			<ul>
				<li>
					<filter :current-state.sync="filters.nodes" label-text="Nodes"></filter>
				</li>
				<li>
					<filter :current-state.sync="filters.subnodes" :disabled="!filters.nodes.active" label-text="Resource Nodes"></filter>
				</li>

				<li v-if="filters.levellingareas && data && data.layers && data.layers.levellingareas">
					<filter :current-state.sync="filters.levellingareas" :label-text="levellingAreasLabel"></filter>
				</li>

				<li v-if="filters.villas">
					<filter :current-state.sync="filters.villas" label-text="Villas"></filter>
				</li>

				<li v-if="filters.worldbosses">
					<filter :current-state.sync="filters.worldbosses" label-text="World Bosses"></filter>
				</li>
				<li v-if="filters.scrollbosses">
					<filter :current-state.sync="filters.scrollbosses" label-text="Scroll Bosses"></filter>
				</li>
				
				<li v-if="filters.horses">
					<filter :current-state.sync="filters.horses" label-text="Wild Horses" label-html="Horses &lt;i&gt;/&lt;/i&gt; <span class='el'>Elephants</span>"></filter>
				</li>

				<li v-if="filters.treasurechests">
					<filter :current-state.sync="filters.treasurechests" label-text="Treasure Chests"></filter>
				</li>
				<li v-if="filters.goldenchests && data && data.layers && data.layers.goldenchests && (!data.layers.goldenchests.properties.beta || $root.isBeta())">
					<filter :current-state.sync="filters.goldenchests" label-text="Golden Chests"></filter>
				</li>

				<li v-if="filters.fishinghotspots">
					<filter :current-state.sync="filters.fishinghotspots" label-text="Fishing Hotspots"></filter>
				</li>
				<li v-if="filters.hunting">
					<filter :current-state.sync="filters.hunting" label-text="Hunting" label-html="Whales &lt;i&gt;/&lt;/i&gt; Hunting"></filter>
				</li>

				<li v-if="filters.searegions">
					<filter :current-state.sync="filters.searegions" label-text="Sea Regions"></filter>
				</li>

				<li v-if="filters.eggs && data && data.layers && data.layers.eggs">
					<filter :current-state.sync="filters.eggs" label-text="Goose Eggs"></filter>
				</li>

			</ul>
		</div>
	</section>

	<section class="section-custom" v-if="hasCustomFilters">
		<div class="checkbox-group open checkbox-group--selected">
			<ul>
				<li v-for="filterData in filters.custom" :title="filterData.url">
					<filter :current-state.sync="filterData" :label-text="filterData.name" :show-bullet="true"></filter>
				</li>
			</ul>
		</div>
	</section>

	<section class="section-gathering">

		<div class="checkbox-group open checkbox-group--selected">
			<ul>
				<li v-for="filterData in selectedFilters">
					<filter :current-state.sync="filterData.filter" :label-text="filterData.filter.name" :show-bullet="true"></filter>
					<b class="cancel" v-on:click.stop.prevent="removeGatheringFilter(filterData.name)">×</b>
				</li>
			</ul>
		</div>

		<span v-on:click="toggleGatheringFilters()" v-bind:class="['ui-button', !areGatheringFiltersDisplayed ? 'ui-button--positive' : 'ui-button--negative']"> <span v-show="!areGatheringFiltersDisplayed">Show Gathering Locations</span><span v-show="areGatheringFiltersDisplayed">Hide</span></span>

		<div v-show="areGatheringFiltersDisplayed" class="gatheringfilters">
			<div v-bind:class="['checkbox-group',{open: currentOpenGroup === 'gathering-'+$key, }]" v-for="filterGroup in filters.gathering">
				<h3 v-on:click="clickGroup('gathering-'+$key)">{{ filterGroup.name }}</h3>
				<ul>
					<li v-for="filterData in filterGroup.items">
						<filter :current-state.sync="filterData" :label-text="filterData.name" :show-bullet="true"></filter>
					</li>
				</ul>
			</div>
		</div>

	</section>
	</div>
</template>

<script>

import Filter from '../common/Filter.vue';

export default {

	name: 'FiltersUnit',

	data: function() {
		return {
			data: this.state.mapdata,
			filters: this.state.filters,
			selectedFilters: [],
			currentOpenGroup: null,
			areGatheringFiltersDisplayed: false,
			levellingAreasLabel: 'Levelling Areas'
		};
	},

	components: {
		Filter
	},

	computed: {
		hasCustomFilters: function() {
			if( this.filters && this.filters.custom && Object.keys(this.filters.custom).length > 0 ) {
				return true;
			}
			return false;
		}
	},

	ready: function() {

		// Determine if we are american
		// This is hacky because browsers don't expose locale info
		try {
			var tzOffset = new Date().getTimezoneOffset()/60;
			if( tzOffset && tzOffset < -3 && tzOffset > -10 ) {
				this.levellingAreasLabel = 'Leveling Areas';
			}
		} catch( e ) {
			// We have a third-world browser RIP
		}

		// When filters change, save state in cookie
		this.$watch('filters', (c) => {
			this.$action('filters:storeStateInBrowserStorage');
		}, {deep:true});

		this.$watch('areGatheringFiltersDisplayed', (c) => {
			this.$dispatch('size-changed');
		});

		this.$watch('currentOpenGroup', (c) => {
			this.$dispatch('size-changed');
		});

		this.$watch('filters.nodes', (c) => {
			if( !c.active ) {
				this.filters.subnodes.active = false;
			}
		}, {deep:true});

		this.$watch('filters.gathering', (c) => {
			// Add any new selected filters and remove any unselected
			var activeFilters = {};
			for( var gatheringSection in this.filters.gathering ) {
				for( var gatheringResource in this.filters.gathering[gatheringSection].items ) {
					var filter = this.filters.gathering[gatheringSection].items[gatheringResource];
					if( filter.active ) {
						filter.category = gatheringSection;
						activeFilters[gatheringResource] = filter;
					}
				}
			}
			for( var i in this.selectedFilters ) {
				if( activeFilters[this.selectedFilters[i].name] ) {
					delete activeFilters[this.selectedFilters[i].name];
				}
			}
			for( var i in activeFilters ) {
				this.selectedFilters.push( {
					name: i,
					filter: activeFilters[i]
				});
			}
		}, {deep:true});

		this.$watch('selectedFilters', (c) => {
			var hasSelectedFilterTurnedOn = false;
			var hasMeatBloodHideTurnedOn = false;

			for( var i in this.selectedFilters ) {
				if( this.selectedFilters[i].filter.active ) {
					hasSelectedFilterTurnedOn = true;

					var cat = this.selectedFilters[i].filter.category;
					if(
						 cat == 'meat' ||
					   cat == 'bird-meat' ||
					   cat == 'repile-meat' ||
					   cat == 'blood-group-1' ||
					   cat == 'blood-group-2' ||
					   cat == 'blood-group-3' ||
					   cat == 'blood-group-4' ||
					   cat == 'blood-group-5' ||
					   cat == 'soft-hide' ||
					   cat == 'tough-hide' ||
					   cat == 'hard-hide' ||
					   cat == 'thin-hide' ||
					   cat == 'thick-fur' ||
					   cat == 'fancy-fur' ||
					   cat == 'feathers-plumes'
					) {
						hasMeatBloodHideTurnedOn = true;
					}
				}
			}

			if( this.$parent.$refs.filtersattributionunit ) {
				this.$parent.$refs.filtersattributionunit.areGatheringFiltersDisplayed = hasSelectedFilterTurnedOn;
				// Has blood/hide/meat?
				this.$parent.$refs.filtersattributionunit.areMeatBloodHideFiltersDisplayed = hasMeatBloodHideTurnedOn;
			}

			this.$dispatch('size-changed');
		});

	},

	methods: {

		toggleGatheringFilters: function() {
			this.areGatheringFiltersDisplayed = !this.areGatheringFiltersDisplayed;
			this.$dispatch('size-changed');
		},

		clickGroup: function(group) {
			if( this.currentOpenGroup == group ) {
				this.currentOpenGroup = null;
			} else {
				this.currentOpenGroup = group;
			}
		},

		removeGatheringFilter: function(name) {
			for( var i in this.selectedFilters ) {
				if( this.selectedFilters[i].name == name ) {
					console.log("Removing",name);
					this.selectedFilters[i].filter.active = false;
					this.selectedFilters.splice(i,1);
				}
			}
		}

	}

};
</script>

<style src="./FiltersUnit.scss" lang="sass"></style>
