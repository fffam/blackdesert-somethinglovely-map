import Cookies from 'js-cookie';
import gatheringFilters from './../gathering.js';

var filters = {
	nodes: {active: true, loaded: true},
	subnodes: {active: false, loaded: true},
	villas: {active: true, loaded: true},

	horses: {active: false, loaded: true},
	elephants: {active: false, loaded: true},

	scrollbosses: {active: false, loaded: true},
	worldbosses: {active: false, loaded: true},

	searegions: {active: false, loaded: true},
	fishinghotspots: {active: false, loaded: true},

	hunting: {active: false, loaded: true},
	whales: {active: false, loaded: true},
	khalks: {active: false, loaded: true},
	bluewhales: {active: false, loaded: true},
	crocodiles: {active: false, loaded: true},

	sandbox: {active: true, loaded: true},

	levellingareas: {active: false, loaded: true},
	treasurechests: {active: false, loaded: true},
	goldenchests: {active: false, loaded: true},

	// Easter eggs
	eggs: {active: false, loaded: true},

	gathering: gatheringFilters,

	custom: {}
};

export default {

	name: 'filters',

	state: filters,

	loadStateFromBrowserStorage: function() {
		try {
			var prevState = Cookies.getJSON('filter-state');
			console.log('[FilterStore]','Loading filter state');
			if( prevState ) {
				for( var k in prevState ) {
					if( !this.state[k] ) {
						continue;
					}
					if( k == 'gathering' ) {
						for( var gatheringCategory in prevState[k] ) {
							for( var gatheringItem in prevState[k][gatheringCategory] ) {
								if( this.state[k][gatheringCategory] && this.state[k][gatheringCategory].items[gatheringItem] ) {
									this.state[k][gatheringCategory].items[gatheringItem].active = true;
								}
							}
						}
					} else {
						this.state[k].active = prevState[k];
					}
				}
			}
		}
		catch(err) {
			// Lets just revert to default settings
		}
	},

	storeStateInBrowserStorage: function() {
		var s = {};
		for( var k in this.state ) {
			if( this.state[k].loaded ) {
				s[k] = this.state[k].active;
			} else if( k == 'gathering' ) {
				s[k] = {};
				for( var gatheringCategory in this.state[k] ) {
					for( var gatheringItem in this.state[k][gatheringCategory].items ) {
						if( this.state[k][gatheringCategory].items[gatheringItem].active ) {
							if( !s[k][gatheringCategory] ) {
								s[k][gatheringCategory] = {};
							}
							s[k][gatheringCategory][gatheringItem] = true;
						}
					}
				}
			}
		}
		console.log('[FilterStore]','Saving filter state');
		Cookies.set('filter-state', s);
	}

}
