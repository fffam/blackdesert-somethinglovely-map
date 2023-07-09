import Vue from 'vue'
import VueSimpleStore from 'vue-simple-store'
import MapDataStore from './store/MapDataStore';
import FiltersStore from './store/FiltersStore';
import VueFilters from './VueFilters.js';

Vue.config.debug = process.env.NODE_ENV !== 'production'

// Setup stores
MapDataStore.state.filters = FiltersStore.state;
Vue.use( VueSimpleStore, {
	stores: [ MapDataStore,FiltersStore ]
});

const App = Vue.extend(require('./App.vue'));
let app = new App({el:'#app'});
