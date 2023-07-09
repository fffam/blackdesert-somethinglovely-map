<template>
	<i class="icon datalayer small icon-{{type}}"> </span>
</template>

<script>

export default {

	name: 'DataLayerIcon',

	props: {
		type: {
			type: String,
			required: true
		}
	},

};
</script>

<style src="./DataLayerIcon.scss" lang="sass"></style>
