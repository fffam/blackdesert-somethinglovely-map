<template>
	<div v-bind:class="['pane', 'info-pane', 'fishinghotspot-info-pane', {'pane--is-active': this.active} ]" v-on:click="activatePane()">
		<div class="pane--wrapper" v-if="item">
			<div class="pane--header">

				<header class="detail-intro-unit">
					<div class="close" v-on:click.stop.prevent="close()">×</div>
					<data-layer-fish-icon size="large" :type="layerName" :fish-type="item.properties.type"></data-layer-fish-icon>
					<h1 v-if="name">{{name}}</h1>
					<h2>{{layerNameSingular}}</h2>
				</header>

			</div>

			<div class="pane--body">

				<dl class="details">
					<dt v-if="item.properties.level">Level</dt>
					<dd v-if="item.properties.level">{{item.properties.level}}</dd>
				</dl>

				<section class="section-image" v-if="bannerimage">
					<img v-bind:src="bannerimage">
				</section>

				<div class="notes" v-if="item.properties && item.properties.notes">
					<template v-if="item.properties.notes[0] == '<'">
						{{{item.properties.notes}}}
					</template>
					<template v-else>
						<p>{{{item.properties.notes}}}</p>
					</template>
				</div>

				<item-list :items="drops" v-if="drops"></item-list>

			</div>
			<div class="pane--footer">
				<div id="feature-attribution-unit">
					<p v-if="item.properties && item.properties.attribution">Submitted by: <b>{{item.properties.attribution}}</b></p>
					<p v-if="layer.properties && layer.properties.attribution">{{{layer.properties.attribution}}}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script>

import DataLayerFishIcon from '../common/DataLayerFishIcon.vue';
import ItemList from '../common/ItemList.vue';
import FeaturePaneMixin from '../../mixins/FeaturePaneMixin.js';

export default {

	name: 'FishingHotspotInfoPane',

	mixins: [FeaturePaneMixin],

	components: {
		DataLayerFishIcon,
		ItemList
	},

	data: function() {
		return {
			layerName: 'fishinghotspots'
		};
	},

	computed: {
		drops: function() {

			if( this.item.properties.drops ) {
				return this.item.properties.drops;
			}

			var allfish = this.layer.properties.fish;
			if( !allfish ) return false;
			if( !allfish[this.item.properties.type] ) return false;

			return [
				allfish[this.item.properties.type]
			]
		}
	}

};
</script>

<style src="./FishingHotspotInfoPane.scss" lang="sass"></style>
