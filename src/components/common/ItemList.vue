<template>
	<div class="item-list">
		<template v-for="(category,items) in items | groupByCategories">
		<h3><span>{{category}}</span></h3>
		<ul>
			<li v-for="item in items">
				<item-detail :item="item"></item-detail>
			</li>
		</ul>
		</template>
	</div>
</template>

<script>

import ItemDetail from './ItemDetail.vue';

export default {

	name: 'ItemList',

	props: {
		items: {}
	},

	components: [
		ItemDetail
	],

	filters: {
		groupByCategories: function() {
			let categories = {};

			// Shallow clone the array/object (depending on what firebase says it is)
			let originalItems = this.items.slice ? this.items.slice() : Object.assign({}, this.items);
			// Sort by 'sortorder' or name
			let sortedItems = originalItems.sort( (a,b) => {
				var aso = ( a && a.sortorder !== undefined && a.sortorder !== null ) ? a.sortorder : false;
				var bso = ( b && b.sortorder !== undefined && b.sortorder !== null ) ? b.sortorder : false;
				
				if(aso && bso) {
					return aso - bso;
				} else if( aso && !bso ) {
					return -1;
				} else if( bso && !aso ) {
					return 1;
				} else if( a.quality && b.quality ) {
					var qualities = ['white','green','blue','yellow','orange','red'];
					var r = qualities.indexOf(b.quality) - qualities.indexOf(a.quality);
					if( r === 0 ) {
						return (a.name == b.name) ? 0 : (a.name < b.name ? -1 : 1);
					}
					return r;
				} else if( a.rarity && b.rarity ) {
					var qualities = ['white','green','blue','yellow','orange','red'];
					var r = qualities.indexOf(b.rarity) - qualities.indexOf(a.rarity);
					if( r === 0 ) {
						return (a.name == b.name) ? 0 : (a.name < b.name ? -1 : 1);
					}
					return r;
				} else {
					return (a.name == b.name) ? 0 : (a.name < b.name ? -1 : 1);
				}
			});

			// Quickly check if there are fish categories so they can go first
			// because people care about fishing far more than harpooning
			for( var k in sortedItems ) {
				if( sortedItems[k].category && sortedItems[k].category.indexOf('Fish') === 0 ) {
					if( !categories[sortedItems[k].category] ) {
						categories[sortedItems[k].category] = [];
					}
				}
			}

			// Put into grouped categories
			for( var k in sortedItems ) {
				if( !sortedItems[k] ) {
					continue;
				}
				let category = sortedItems[k].category ? sortedItems[k].category : 'Items';
				if( !categories[category] ) {
					categories[category] = [];
				}
				categories[category].push(sortedItems[k]);
			}
			return categories;
		}
	}

};
</script>

<style src="./ItemList.scss" lang="sass"></style>
