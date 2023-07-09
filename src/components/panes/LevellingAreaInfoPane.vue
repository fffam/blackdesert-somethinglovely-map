<template>
	<div v-bind:class="['pane', 'info-pane', 'levellingarea-info-pane', {'pane--is-active': this.active} ]" v-on:click="activatePane()">
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

				<p v-if="item.properties && item.properties.unreleased" class="unreleased">This area is not yet available on NA/EU servers</p>

				<dl class="details" v-if="item.properties">
					<dt>Level Range</dt>
					<dd>{{item.properties.level}}</dd>
					<dt v-if="item.properties.apdp">Recommended AP/DP</dt>
					<dd v-if="item.properties.apdp">{{item.properties.apdp}}</dd>
					<dt v-if="item.properties.ratingxp">Rating for XP</dt>
					<dd v-if="item.properties.ratingxp">{{item.properties.ratingxp}}</dd>
					<dt v-if="item.properties.ratingmoney">Rating for Money</dt>
					<dd v-if="item.properties.ratingmoney">{{item.properties.ratingmoney}}</dd>
					<dt v-if="item.properties.rating && !item.properties.ratingmoney && !item.properties.ratingxp">Rating</dt>
					<dd v-if="item.properties.rating && !item.properties.ratingmoney && !item.properties.ratingxp">{{item.properties.rating}}</dd>
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

				<item-list v-if="item.properties.drops" :items="item.properties.drops"></item-list>

				<h3><span>Next Areas</span></h3>

				<ul class="area-list">
					<li v-for="area in areaList" v-on:click="clickFeature(layerName,area.id)" v-bind:class="{
						'area-list--earlier-level': integerLevel > area.integerLevel,
						'area-list--current': area.id == itemId,
					}">
						<span class="icon"><data-layer-icon size="small" :type="layerName"></data-layer-icon></span>
						<span class="name">{{area.properties.name}}</span>
						<span class="level">{{area.properties.level}}</span>
						<span class="rating">{{area.properties.rating}}</span>
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

	name: 'LevellingAreaInfoPane',

	mixins: [FeaturePaneMixin],

	components: {
		DataLayerIcon,
		ItemList
	},

	data: function() {
		return {
			layerName: 'levellingareas'
		};
	},

	computed: {
		integerLevel: function() {
			return this.parseLevelFromString(this.getProp('level'));
		},

		areaList: function() {
			let level = this.getProp('level');
			if(!level) {
				return [];
			}
			level = this.parseLevelFromString(level);

			// Get all within 8 levels
			let results = [];
			for(var k in this.layer.features) {
				let otherFeature = this.layer.features[k];
				let otherLevel = this.parseLevelFromString(otherFeature.properties.level);
				otherFeature.integerLevel = otherLevel;
				if( Math.abs(level - otherLevel) < (level < 45 ? 8 : 6) ) {
					results.push(otherFeature);
				}
			}

			// Sort by level
			results = results.sort( (a,b) => {
				var cmp = a.integerLevel - b.integerLevel;
				if( cmp === 0 && a.properties.apdp && b.properties.apdp  ) {
					cmp = parseInt(a.properties.apdp,10) - parseInt(b.properties.apdp,10);
				}
				if( cmp === 0 ) {
					return a.id < b.id ? -1 : 1;
				}
				return cmp < 0 ? -1 : 1;
			});
			return results;
		}
	},

	methods: {
		parseLevelFromString:function(str) {
			if( !str ) {
				return -10000;
			}
			var splitStr;
			if( (splitStr = str.split('-')) && splitStr.length == 2) {
				return (parseInt(splitStr[0],10) + parseInt(splitStr[1],10))/2;
			} else {
				return parseInt(str,10);
			}
		}
	}

};
</script>

<style src="./LevellingAreaInfoPane.scss" lang="sass"></style>
