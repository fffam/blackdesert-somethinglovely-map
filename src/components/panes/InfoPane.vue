<template>
	<div v-bind:class="['pane', 'info-pane', {'pane--is-active': this.active}]">
		<div class="pane--wrapper">
			<div class="pane--header">
				<div id="intro-unit">
					<h1><span>Famme's</span> <b>BDO Map</b></h1>
				</div>
			</div>
			<div class="pane--body">
				<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
			</div>
			<div class="pane--footer"></div>
		</div>
	</div>
</template>

<script>

export default {

	name: 'InfoPane',

	components: {
	},

	props: {
		active: Boolean
	}

};
</script>

<style src="./InfoPane.scss" lang="sass"></style>
