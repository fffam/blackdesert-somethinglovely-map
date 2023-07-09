<template>
	<img v-bind:src="fishIconSrc"  class="icon datalayer small icon-{{type}}">
</template>

<script>

import markerIcons from '../../markers';
import fishlist from '../../fishlist';

export default {

	name: 'DataLayerFishIcon',

	props: {
		type: {
			type: String,
			required: true
		},
		fishType: {
			type: String,
			required: false
		}
	},

	computed: {
		fishIconSrc: function() {
			if( !this.fishType ) {
				return '';
			}
			var fishIdx = 16;
			for( var i in fishlist ) {
				if( fishlist[i] == this.fishType ) {
					fishIdx = i;
					break;
				}
			}
			var marker = markerIcons[this.type+'-'+fishIdx];
			return marker.options.iconRetinaUrl;
		}
	}

};
</script>
