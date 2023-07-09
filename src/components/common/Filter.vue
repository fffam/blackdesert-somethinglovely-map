<template>
	<span v-bind:class="[className,'filter-checkbox',{'disabled':disabled}]">
		<i class="loading" v-if="currentState.active && !currentState.loaded">&nbsp;</i>
		<input v-bind:disabled="disabled" id="{{elementid}}" v-if="!currentState.active || currentState.loaded" type="checkbox" v-model="currentState.active">
		<label v-if="!labelHtml" for="{{elementid}}"><b v-if="showBullet" v-bind:style="styles">⬤</b> {{labelText}}</label>
		<label v-if="labelHtml" for="{{elementid}}"><b v-if="showBullet" v-bind:style="styles">⬤</b> {{{labelHtml}}}</label>
	</span>
</template>

<script>

export default {

	name: 'Filter',

	props: {
		labelText: {
			type: String,
			required: true
		},
		labelHtml: {
			type: String,
			required: false
		},
		currentState: {
			type: Object,
			twoWay: true,
			'default': () => {return {active:false,loaded:false}}
		},
		disabled: {
			type: Boolean,
			'default': false
		},
		showBullet: {
			type: Boolean,
			'default': false
		}
	},

	data: function() {
		return {
			rand: Math.floor(Math.random()*10000)
		};
	},

	computed: {
		elementid: function() {
			return 'filter-'+this.labelText.replace(/\W/g,'-')+'-'+this.rand;
		},
		className: function() {
			return 'filter-'+this.labelText.replace(/\W/g,'-');
		},
		styles: function() {

			if( !this.currentState.styles ) {
				return 'display: none !important';
			}
			// color: #ff41f4; -webkit-text-stroke: 2px #FFF;
			//console.log(this.currentState);
			let strokeColor = this.currentState.styles.color;
			let fillColor = this.currentState.styles.fillColor;

			if( strokeColor && fillColor ) {
				return '-webkit-text-stroke: 2px ' + strokeColor + '; color: ' + fillColor;
			} else if( fillColor ) {
				return 'color: ' + fillColor;
			} else {
				return 'display: none !important';
			}
		}
	}

}
</script>

<style src="./Filter.scss" lang="sass"></style>
