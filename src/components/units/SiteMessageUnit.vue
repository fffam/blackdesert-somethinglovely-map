<template>
	<div id="site-message-unit" v-bind:class="cssClasses">
		<div class="message-wrapper">
		<button class="hide" v-on:click.stop.prevent="hide()">×</button>
		<div class="content">
			{{{mapdata.sitemessage}}}
		</div>
	</div>
</template>

<script>

import Cookies from 'js-cookie';

export default {

	name: 'SiteMessageUnit',

	props: {
		hidden: {
			type: Boolean,
			default: false
		}
	},

	data: function() {
		return {
			mapdata: this.state.mapdata
		};
	},

	ready: function() {
		//this.message = '<p>Lorem ipsum dolor sit amet, <a href="#">consectetur adipisicing elit</a>, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p><p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>';
		this.$watch('mapdata.sitemessage', (c) => {
			let cookieText = Cookies.get('last-seen-site-message');
			if( cookieText && this.mapdata.sitemessage == cookieText ) {
				this.hidden = true;
			}
			// If we have a takeover message, show it every time the user visits
			if( this.mapdata.sitemessagetakeover ) {
				this.hidden = false;
			}
			this.$dispatch('size-changed');
		});
	},

	methods: {
		hide: function() {
			this.hidden = true;
			Cookies.set('last-seen-site-message', this.mapdata.sitemessage);
			this.$dispatch('size-changed');
		}
	},

	computed: {
		cssClasses: function() {
			return {
				hidden: this.hidden || !this.mapdata.sitemessage,
				takeover: this.mapdata.sitemessagetakeover || false
			}
		}
	}

};
</script>

<style src="./SiteMessageUnit.scss" lang="sass"></style>
