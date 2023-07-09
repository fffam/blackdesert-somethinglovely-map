<template>
	<i class="icon trader icon-{{type | to-css-class}}"> </span>
</template>

<script>

export default {

	name: 'TraderIcon',

	props: {
		type: {
			type: String,
			default: 'Trade Manager'
		}
	}

};
</script>

<style src="./TraderIcon.scss" lang="sass"></style>
