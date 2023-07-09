<template>
	<div v-bind:class="['pane', 'info-pane', 'goldenchest-info-pane', {'pane--is-active': this.active} ]" v-on:click="activatePane()">
		<div class="pane--wrapper" v-if="item">
			<div class="pane--header">

				<header class="detail-intro-unit">
					<div class="close" v-on:click.stop.prevent="close()">×</div>
					<data-layer-icon size="large" :type="layerName"></data-layer-icon>
					<h1 v-if="name">{{name}}</h1>
					<h2>{{layerNameSingular}}</h2>
				</header>

			</div>

			<div class="pane--body">

				<div class="notes" v-if="item.properties && item.properties.notes">
					<template v-if="item.properties.notes[0] == '<'">
						{{{item.properties.notes}}}
					</template>
					<template v-else>
						<p>{{{item.properties.notes}}}</p>
					</template>
				</div>

				<section class="section-image" v-if="item.properties.imageurl">
					<a v-bind:href="item.properties.imagelink ? item.properties.imagelink : item.properties.imageurl" target="_blank"><img v-bind:src="item.properties.imageurl"></a>
				</section>

			</div>
			<div class="pane--footer">
				<div id="feature-attribution-unit">
					<p v-if="item.properties && item.properties.attribution">{{{item.properties.attribution}}}</p>
					<p v-if="layer.properties && layer.properties.attribution">{{{layer.properties.attribution}}}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script>

import DataLayerIcon from '../common/DataLayerIcon.vue';
import FeaturePaneMixin from '../../mixins/FeaturePaneMixin.js';

export default {

	name: 'GoldenChestInfoPane',

	mixins: [FeaturePaneMixin],

	components: {
		DataLayerIcon
	},

	data: function() {
		return {
			layerName: 'goldenchests'
		};
	},

	computed: {
		name: function() {
			if( this.item.properties ) {
				if( this.item.properties.name ) {
					return this.item.properties.name;
				}
			}
			return this.itemId.toUpperCase();
		}
	}
};
</script>

<style src="./GoldenChestInfoPane.scss" lang="sass"></style>
