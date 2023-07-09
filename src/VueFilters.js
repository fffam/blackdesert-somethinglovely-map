import Vue from 'vue';

Vue.filter('to-css-class', function (value) {
	return value.replace(/\s/g,'-');
});
