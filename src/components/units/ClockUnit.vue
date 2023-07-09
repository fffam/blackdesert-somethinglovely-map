<template>
	<div id="clock-unit" v-bind:class="{isDay:isDay, isNight:!isDay}">
		<div class="time-of-day">
		<p class="currentTime">
			<span class="ampm" v-text="ampm"></span>
			<span class="h" v-text="displayHour"></span><span class="colon">:</span><span class="m" v-text="displayMinute"></span>
		</p>
		<p class="untilNight">
			<span>Night in</span> <b>{{secsUntilNightStart | clocktime}}</b>
		</p>
		<p class="untilDaytime">
			<span>Daytime in</span> <b>{{secsUntilNightEnd | clocktime}}</b>
		</p>
		</div>
		<div class="resets">
		<p v-bind:class="{untilDailyReset:true, soon: secsUntilDailyReset < 30*60}">
			<span>Daily reset in</span> <b>{{secsUntilDailyReset | clocktime}}</b>
		</p>
		<p v-bind:class="{untilImperialReset:true, soon: secsUntilImperialReset < 30*60}">
			<span title="Imperial Trade, Imperial Cooking &amp; Imperial Alchemy Delivery (50% chance to reset per channel, every 3 hours)">Imperial reset in</span> <b>{{secsUntilImperialReset | clocktime}}</b>
		</p>
		<p v-bind:class="{untilImperialReset:true, soon: secsUntilTradeReset < 30*60}">
			<span title="Imperial Trade Delivery (required items change every 4 hours)">Imp. Trading reset in</span> <b>{{secsUntilTradeReset | clocktime}}</b>
		</p>

		<p v-bind:class="{untilImperialReset:true, soon: secsUntilJumanjiReset < 3*60*60}" v-if="showJumanji">
			<span title="Black Spirit Adventures">Boardgame reset in</span> <b>{{secsUntilJumanjiReset | clocktime}}</b>
		</p>

		</div>
	</div>
</template>

<script>

export default {

	name: 'ClockUnit',

	data: function() {
		return {
			isDay: false,
			inGameHour: 0,
			inGameMinute: 0,
			secsUntilNightStart: 0,
			secsUntilNightEnd: 0,
			secsUntilDailyReset: 0,
			secsUntilImperialReset: 0,
			secsUntilTradeReset: 0,
			secsUntilJumanjiReset: 0
		}
	},

	ready: function() {
		let baseTick = 4444.444444;
		setInterval( this.updateClockActive, baseTick );
		setInterval( this.updateClock, baseTick * 6 );
		setInterval( this.updateCountdowns, 20*1000 );
		this.updateClock();
		this.updateCountdowns();
	},

	methods: {

		updateCountdowns: function() {

			var d = new Date();
			var startHour = Date.UTC( d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),0,0,0,0);
			var rlDayElapsedS = (Date.now() - startHour)/1000;

			// Midnight UTC
			this.secsUntilDailyReset = (24*60*60)-rlDayElapsedS;

			// Imperial cooking/alchemy reset is every 3 hours from reset
			this.secsUntilImperialReset = (3*60*60)-(rlDayElapsedS%(60*60*3));

			// Imperial delivery (trade) reset is every 4 hours from reset
			this.secsUntilTradeReset = (4*60*60)-(rlDayElapsedS%(60*60*4));

			// Jumani board game reset is at 5am UTC
			this.secsUntilJumanjiReset = (60*60*24) - ((rlDayElapsedS-(5*60*60))%(60*60*24));
			if( this.secsUntilJumanjiReset > (60*60*24) ) {
				this.secsUntilJumanjiReset -= (60*60*24);
			}

		},

		// This version gets called far more often but doesn't update if
		// the site is not the active tab (using HTML page visibility api)
		updateClockActive: function() {
			if( document.hidden ) {
				return;
			}
			this.updateClock();
		},

		updateClock: function() {

			var d = new Date();
			var startHour = Date.UTC( d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),0,0,0,0);
			var rlDayElapsedS = (Date.now() - startHour)/1000;
			var secsIntoGameDay = (rlDayElapsedS+(200*60)+(20*60))%(240*60);

			// Last part of the shifted day is night
			if( secsIntoGameDay >= 12000 ) {

				var secsIntoGameNight = secsIntoGameDay - 12000;
				var pctOfNightDone = secsIntoGameNight / ((40)*60);
				var gameHour = 9*pctOfNightDone;
				gameHour = gameHour<2? (22+gameHour) : (gameHour-2);
				var secsUntilNightEnd = (40*60)-secsIntoGameNight;

				this.isDay = false;
				this.inGameHour = (gameHour/1)>>0;
				this.inGameMinute = ((gameHour%1)*60)>>0;
				this.secsUntilNightEnd = secsUntilNightEnd;
				this.secsUntilNightStart = secsUntilNightEnd + 12000;

			} else {

				var secsIntoGameDaytime = secsIntoGameDay;
				var pctOfDayDone = secsIntoGameDay / ((200)*60);
				var gameHour = 7 + ((22-7)*pctOfDayDone);
				var secsUntilNightStart = 12000 - secsIntoGameDaytime;

				this.isDay = true;
				this.inGameHour = (gameHour/1)>>0;
				this.inGameMinute = ((gameHour%1)*60)>>0;
				this.secsUntilNightEnd = secsUntilNightStart + (40*60);
				this.secsUntilNightStart = secsUntilNightStart;

			}
		}
	},

	computed: {
		ampm: function() {
			return this.inGameHour < 12 ? 'AM' : 'PM'
		},
		displayHour: function() {
			var t = this.inGameHour % 12;
			if( t === 0 ) { t = 12; }
			return (this.inGameHour > 0 && this.inGameHour < 10) ? ('0' + (+t)) : t;
		},
		displayMinute: function() {
			return this.inGameMinute < 10 ? ('0' + (+this.inGameMinute)) : this.inGameMinute;
		},
		showJumanji: function() {
			if( !this.$root.state.mapdata.settings ) {
				return false;
			}
			return !!this.$root.state.mapdata.settings.showboardgameonclock;
		}
	},

	filters: {
		clocktime: function(secs) {
			if( secs < 60 ) {
				return '<1 min';
			} else if( secs < 60*60 ) {
				return ((secs/60)>>0)+'m';
			} else {
				return ((secs/3600)>>0)+'h'+(((secs%3600)/60)>>0)+'m';
			}
		}
	}
};
</script>

<style src="./ClockUnit.scss" lang="sass"></style>
