<template>
	<div v-bind:class="['item-detail', 'item-detail--rarity-'+(item.rarity ? item.rarity : 'white')]">
		<div class="img">
			<img v-if="item.id" v-bind:src="'icons/'+item.id+'.png'">
		</div>
		<div class="detail">
			<h4>{{ item.name }}</h4>
			<p class="item-details" v-if="item.weight || item.price || item.type">
				<span v-if="item.type" class="type">{{item.type}}</span>
				<span v-if="item.weight" class="weight">{{item.weight}}LT</span>
				<span v-if="item.price" class="price">{{item.price | currency '' 0}}</span>
			</p>
			<p v-if="item.notes">{{item.notes}}</p>
		</div>
	</div>
</template>

<script>

export default {

	name: 'ItemDetail',

	props: {
		item: {}
	}

};
</script>

<style src="./ItemDetail.scss" lang="sass"></style>
