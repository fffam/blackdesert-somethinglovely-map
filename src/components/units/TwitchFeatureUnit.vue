<template>
	<div id="twitch-feature-unit">
		<article v-bind:class="{ nostream: !stream, active: !!stream, hidden: !!hidden, 'no-space-available': !hasSpace, 'has-space': hasSpace }">
			<header v-if="stream" class="stream-header">
				<span v-if="!hidden">Streaming BDO on <b>Twitch</b></span>
				<span class="hide" v-on:click.prevent="toggle()">
					<span v-if="!hidden">Hide <i>✖</i></span>
					<span v-if="hidden">Show streams <i>⇑</i></span>
				</span>
			</header>
			<a v-if="stream && !hidden" v-bind:class="[ 'stream', hasSpace ? 'has-space' : 'no-space-available' ]" target="_blank" v-bind:href="stream.channel.url">

				<span class="viewers">{{stream.viewers}}</span>

				<img v-if="stream.preview && stream.preview.medium" v-bind:src="stream.preview.medium" class="preview">

				<div class="info">
					<img class="channel-logo" v-if="stream.channel.logo" v-bind:src="stream.channel.logo">
					<h3>{{stream.channel.display_name}}</h3>
					<h4>{{stream.channel.status}}</h4>
				</div>
			</a>
		</article>
	</div>
</template>

<script>

import Cookies from 'js-cookie';

export default {

	name: 'TwitchFeatureUnit',

	props: {
		hasSpace: true
	},

	data: function() {
		return {
			hidden: false,
			stream: null
		}
	},

	ready: function() {
		setInterval( () => {
			this.update();
		}, 1000 * 60 * 15 );

		setTimeout( () => {
			this.update();
		}, 1000 * 6 );

		var userPrefToHideTwitch = !!Cookies.get('hide-twitch');
		console.log('userPrefToHideTwitch',userPrefToHideTwitch);
		if( userPrefToHideTwitch ) {
			this.hidden = true;
		}
	},

	methods: {
		update: function() {
			var url = 'https://api.twitch.tv/kraken/streams?game=Black%20Desert&client_id=fk7le058uqz52fg26n8gwa9kn4xorri';

			var streamers = {
				'zethiann': [4.2,5],
				'morrolantv': [40,49],
				'ansgar224': [40,51],
				'bladeboques': [3,5.5],
				'macilus': [12,11],
				'maomaoprince': [6,5.5],
				'goodvibesguy': [3,5],
				'notlacari': [3,5],
				'catsensual': [4,6],
				'orcanaria': [4,6]
			};

			fetch(url).then( (r) => {
				return r.json();
			}).then( (j) => {
				if( j.error || !j._total ) {
					this.reset();
				} else {
					var candidates = [];
					for( var k in j.streams ) {
						if( streamers[j.streams[k].channel.name] ) {
							j.streams[k].famscore = streamers[j.streams[k].channel.name][0] / streamers[j.streams[k].channel.name][1];
							if( new Date() - Date.parse(j.streams[k]['created_at']) < 3600000 ) {
								 j.streams[k].famscore += 0.15;
							}
							if( new Date() - Date.parse(j.streams[k]['created_at']) < 1800000 ) {
								 j.streams[k].famscore += 0.3;
							}
							j.streams[k].famscore += Math.random() * 0.5;
							candidates.push(j.streams[k]);
						}
					}
					if( candidates.length ) {
						candidates = candidates.sort( (a,b) => {
							return a.famscore - b.famscore;
						});
						this.stream = candidates[0];
					} else {
						this.reset();
					}
				}
			}).catch( (err) => {
				this.reset();
				console.log('[err]',err);
			});
		},

		reset: function() {
			this.stream = null;
		},

		toggle: function() {
			this.hidden = !this.hidden;
			Cookies.set('hide-twitch',this.hidden?'true':'');
		}
	}

};
</script>

<style src="./TwitchFeatureUnit.scss" lang="sass"></style>
