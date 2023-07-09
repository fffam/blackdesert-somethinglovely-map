<template>
	<div v-bind:class="['pane', 'info-pane', 'worldboss-info-pane', {'pane--is-active': this.active} ]" v-on:click="activatePane()">
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

				<p v-if="item.properties && item.properties.unreleased" class="unreleased">This area is not yet available on NA/EU servers</p>

				<div class="notes" v-if="item.properties && item.properties.notes && !item.properties.fullnotes">
					<template v-if="item.properties.notes[0] == '<'">
						{{{item.properties.notes}}}
					</template>
					<template v-else>
						<p>{{{item.properties.notes}}}</p>
					</template>
				</div>

				<div class="fullnotes" v-if="item.properties && item.properties.fullnotes">
					<template v-if="item.properties.fullnotes[0] == '<'">
						{{{item.properties.fullnotes}}}
					</template>
					<template v-else>
						<p>{{{item.properties.fullnotes}}}</p>
					</template>
				</div>

				<item-list v-if="item.properties.drops" :items="item.properties.drops"></item-list>

				<h3><span>Other bosses</span></h3>
				<ul class="feature-list">
					<li v-for="feature in layer.features" v-on:click="clickFeature(layerName,feature)" v-bind:class="{
						'feature-list--current': feature.id == itemId,
					}">
						<span class="icon"><data-layer-icon size="small" :type="layerName"></data-layer-icon></span>
						<span class="name">{{feature.properties.name}}</span>
					</li>
				</ul>

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

	name: 'WorldBossInfoPane',

	mixins: [FeaturePaneMixin],

	components: {
		DataLayerIcon,
		ItemList
	},

	data: function() {
		return {
			layerName: 'worldbosses'
		};
	},

	computed: {

	},

	methods: {

	}

};
</script>

<style src="./WorldBossInfoPane.scss" lang="sass"></style>
