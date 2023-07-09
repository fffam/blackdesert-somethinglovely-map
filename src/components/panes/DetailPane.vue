<template>
	<div v-bind:class="['pane', 'detail-pane', {'pane--is-active': this.active}]">
		<p>This is a detail pane</p>
		<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
	</div>
</template>

<script>

export default {

	name: 'DetailPane',

	props: {
		active: Boolean
	}

};
</script>

<style src="./MenuPane.scss" lang="sass"></style>
