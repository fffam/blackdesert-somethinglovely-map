<template>
	<div v-bind:class="['pane', 'info-pane', 'villa-info-pane', {'pane--is-active': this.active} ]" v-on:click="activatePane()">
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

				<item-list v-if="item.properties.drops" :items="item.properties.drops"></item-list>

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
import ItemList from '../common/ItemList.vue';
import FeaturePaneMixin from '../../mixins/FeaturePaneMixin.js';

export default {

	name: 'VillaInfoPane',

	mixins: [FeaturePaneMixin],

	components: {
		DataLayerIcon,
		ItemList
	},

	data: function() {
		return {
			layerName: 'villas'
		};
	},

	computed: {

	},

	methods: {

	}

};
</script>

<style src="./VillaInfoPane.scss" lang="sass"></style>
