<template>
	<div id="filters-attribution-unit" v-bind:class="{empty: isEmpty}">
		<p v-if="areGatheringFiltersDisplayed">Gathering node data from <a target="_blank" href="http://bdocodex.com/us/">BDO Codex</a></p>
		<p v-if="areMeatBloodHideFiltersDisplayed">Meat/Blood/Hide data contributed by <b>Mortis</b></p>
		<p v-if="filters.searegions.active">Fish region data by <a target="_blank" href="http://forum.blackdesertonline.com/index.php?/topic/102746-bdo-%E2%80%98new-fishing%E2%80%99-ocean-fish-species-list/">Moonraker</a></p>
		<p v-if="filters.fishinghotspots.active">Fish hotspots spawn randomly &amp; depend on fishing level.</p>
		<p v-if="filters.goldenchests.active">Golden Treasure Chests randomly appear at the shown locations. A Gold Key is required to open a chest.</p>
	</div>
</template>

<script>

export default {

	name: 'FiltersAttributionUnit',

	data: function() {
		return {
			data: this.state.mapdata,
			filters: this.state.filters,
			areGatheringFiltersDisplayed: false,
			areMeatBloodHideFiltersDisplayed: false
		};
	},

	computed: {
		isEmpty: function() {
			return !(this.areMeatBloodHideFiltersDisplayed || this.areGatheringFiltersDisplayed || this.filters.searegions.active);
		}
	}

};
</script>

<style src="./FiltersAttributionUnit.scss" lang="sass"></style>
