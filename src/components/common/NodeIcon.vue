<template>
	<i class="icon node {{size}} icon-{{type | to-css-class}}"> </span>
</template>

<script>

export default {

	name: 'NodeIcon',

	props: {
		type: {
			type: String,
			required: true
		},
		size: {
			type: String,
			required: false,
			default: 'large'
		}
	},

};
</script>

<style src="./NodeIcon.scss" lang="sass"></style>
