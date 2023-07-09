<template>
	<div class="trade-pack">
		<div class="img">
			<img v-if="item.id" v-bind:src="'icons/'+item.id+'.png'">
		</div>
		<div class="detail">
			<h4><span v-if="item.quantity" title="Quantity" class="quantity">{{item.quantity}}×&nbsp;</span>{{ item.name }}</h4>
			<p>
				<span class="skill-level"><skill-level :level="item.level_requirement"></skill-level></span>
				<span class="weight">{{item.weight}}LT</span>
				<span class="price">{{item.price | currency '' 0}}</span>
			</p>
		</div>
	</div>
</template>

<script>

import SkillLevel from './SkillLevel.vue';

export default {

	name: 'TradePack',

	props: {
		item: {}
	},

	components: [
		SkillLevel
	]

};
</script>

<style src="./TradePack.scss" lang="sass"></style>
