<template>
	<div v-bind:class="['pane', 'menu-pane', {'pane--is-active': this.active && !this.minimized}]" v-on:click="activatePane()">
		<div class="pane--wrapper">
			<div class="pane--header">
				<div id="intro-unit">
					<menu-button v-on:click="minimizeOrMaximize()"></menu-button>
					<h1><span v-on:dblclick="onDoubleClickSiteTitle()">Famme's</span> <b>BDO Map</b></h1>
					<!--<div class="donate-button"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADQklEQVR4nO2aSWsUQRiG388tElERiWIEN8QtEYKi4iUnRRHRkwcRPSjo0e0n6A/Qi+BR8CQiQQkKEURFRRHxIIG4xi24xSXiFqOPh8nAKNM1k56qLgb7uQRSqXzv86bS9My0lJOTk5OTk/O/Ymk3Ao2S1knaLGm5pGZJkyW9k/RS0nVJHZIum9lQyhljJLVL2iRptaSZkpokfZTUJ+mOpLOSuszsa1qXkYZqAA4C/VTHE2AbUHXZgAFbh/dWQz+wHxgX0l1AK/CoylD/cg2YXsWMacCVlDPuA4tDya8DPqUMVqQXaHXMWAw8rnHGR2CNb/kVwPcagxXpB5aWmdECvPU04xuwzJd8E/DMU7Air4CFJTMWDH/PJ73AVB8FdHgOVuQFMA+YCzwPNONMJT/nlRlYKelmzS0m0zv8dU7AGSvM7HbSYqUCOiVt8B4pWzrNbGPSYmIBwAwVbjbqHSQ1m9mrcoujHBvXh8mTOabCHWtZXAUkbqpDEv+YrgIWBAgSi0QXVwEVb1vriEQX10Xwh6SwLy6yY9DMGsotuE7A50BhYjCQtOAq4HWAILFIdHEV8DxAkFi8SFpwFXApQJBYJLq4CrgQIEgszictVHot0KP6vx+4b2YLkxZdJ0CSDnsOE4NDrsVKJ2C0pHuSFvlMlCE9klrM7FfSDzhPwPDGnZIGPQfLgp+Sdrnkpcr/AjKzG5L2+0qVIQfM7Jq33wYcC/S2VQiOexMvKcCAE7HNquAkUPFkpy1hNHAqsqCL0xQu3OEAxgLnIouWoxMYG1S+pIQGoCuycCkXgfGZyJeU0Ej6z/B8chWYkKl8SQkTgZsR5W8Bk6LIl5QwBbgbQf4uMCWqfBEKnx92ZyjfDTTF9v4LYAbwIAP5h0BzbN+yALOApwHlnwKzY3s6AeYDfQHk+4D5sf2qgsKTHm88yr8FlsT2GhFAG/Deg/wHoC22TyqAlcBADfIDwKrYHjUBtANfUsh/Adpj5/cCsJaRPWT1HVgbO7dXgI3AYBXyg0DiEx11DbAFGHLIDwFbYucMCrAD+F1G/jewPXa+TAD2lClgd+xcmQLsK5HfGyvHmFiDzewIhTcyMLOjsXLk5OTk5OTk/L/8AfwzRb4K6w54AAAAAElFTkSuQmCC" alt="Heart" /> Donate</div>-->
				</div>
				<extra-links-unit></extra-links-unit>
				<search-unit></search-unit>
				<site-message-unit></site-message-unit>
			</div>
			<div class="pane--body" v-el="body">
				<filters-unit></filters-unit>
			</div>
			<div class="pane--footer">
				<filters-attribution-unit v-ref:filtersattributionunit></filters-attribution-unit>
				<clock-unit v-ref:clockunit></clock-unit>
			</div>
		</div>
	</div>
</template>

<script>

import ClockUnit from '../units/ClockUnit.vue';
import MenuButton from '../common/MenuButton.vue';
import ExtraLinksUnit from '../units/ExtraLinksUnit.vue';
import SearchUnit from '../units/SearchUnit.vue';
import FiltersUnit from '../units/FiltersUnit.vue';
import SiteMessageUnit from '../units/SiteMessageUnit.vue';
import FiltersAttributionUnit from '../units/FiltersAttributionUnit.vue';

export default {

	name: 'MenuPane',

	components: {
		ClockUnit,
		ExtraLinksUnit,
		SearchUnit,
		SiteMessageUnit,
		MenuButton,
		FiltersUnit,
		FiltersAttributionUnit
	},

	props: {
		active: Boolean
	},

	data: function() {
		return {
			minimized: false,
			//hasSpaceToDisplayTwitchFeature: false
		};
	},

	ready: function() {
		//window.addEventListener('resize', this.determineTwitchFeatureVisibility)
		//this.determineTwitchFeatureVisibility();
	},

	beforeDestroy: function () {
		//window.removeEventListener('resize', this.determineTwitchFeatureVisibility)
	},

	events: {
		'size-changed': function() {
			//this.determineTwitchFeatureVisibility();
		}
	},

	methods: {
		activatePane: function() {
			if( !this.active ) {
				this.minimized = false;
				this.$parent.selectedPane = 'menu';
			}
		},
		minimizeOrMaximize: function() {
			this.minimized = !this.minimized;
		},
		determineTwitchFeatureVisibility: function() {
			// Get the screen position of the gathering section (its the last one in the body of the pane)
			let gatheringElBounds = this.$el.querySelector('.pane--body .section-gathering').getBoundingClientRect();

			// Get the screen position of the attribution section
			let attributionUnitBounds = this.$el.querySelector('.pane--footer #filters-attribution-unit').getBoundingClientRect();

			// Get the screen position of the attribution section
			let clockUnitBounds = this.$el.querySelector('.pane--footer #clock-unit').getBoundingClientRect();

			// Get the screen position of the twitch feature unit
			let twitchFeatureBounds = this.$el.querySelector('.pane--footer #twitch-feature-unit').getBoundingClientRect();

			// We should probably work this out based on screen scale, but for now lets assume its this
			let heightOfTwitchFeature = 192;
			let padding = 10;

			// Calculate the difference between bottom of gathering bounds and bottom of twitch feature
			// to see if theres enough room to display the full twitch feature
			if( twitchFeatureBounds.bottom - gatheringElBounds.bottom < heightOfTwitchFeature + padding + attributionUnitBounds.height + clockUnitBounds.height) {
				this.hasSpaceToDisplayTwitchFeature = false;
			} else {
				this.hasSpaceToDisplayTwitchFeature = true;
			}
		},
		// This is a secret way to activate a prompt, letting users
		// more easily add custom external layers
		onDoubleClickSiteTitle: function() {
			var url = prompt("Advanced Mode:\nEnter a URL to a GeoJSON file:");
			if( url ) {
				this.$root.$refs.map.loadExternalGeoJSONFile(url);
			}
		}
	}

};
</script>

<style src="./MenuPane.scss" lang="sass"></style>
