const mixin = {

	data: function() {
		return {
			mapdata: this.state.mapdata,
			filters: this.state.filters,
			item: null,
			layer: null
		};
	},

	props: {
		active: false,
		itemId: 1
	},

	ready: function() {

		if( this.itemId && !this.item ) {
			this.setFeatureForId(this.itemId);
		}

		this.$watch('itemId', (c) => {
			this.setFeatureForId(this.itemId);
		});

		this.layer = this.mapdata.layers[this.layerName];

	},

	events: {
		'marker-clicked': function (msg) {
			if( msg.type != 'feature' || msg.layer != this.layerName) {
				return false;
			}
			return this.setFeatureForId(msg.id);
		}
	},

	computed: {
		layerNamePlural: function() {
			return (this.layer.properties && this.layer.properties.name) ? this.layer.properties.name : this.layerName;
		},

		layerNameSingular: function() {
			return (this.layer.properties && this.layer.properties.singular) ? this.layer.properties.singular : this.layerName;
		},

		name: function() {
			return this.item.properties && this.item.properties.name ? this.item.properties.name : '';
		},

		bannerimage: function() {
			return this.item.properties && this.item.properties.img ? this.item.properties.img : false;
		},
	},

	methods: {
		setFeatureForId: function(id) {
			let features = this.mapdata.layers[this.layerName].features;
			for( var i in features ) {
				if( features[i].id == id ) {
					this.itemId = id;
					this.item = features[i];
					return true;
				}
			}
			this.itemId = null;
			this.item = null;
			return false;
		},
		activatePane: function() {
			if( !this.active ) {
				this.$parent.selectedPane = 'detail';
			}
		},
		getProp: function(key,defaultVal='') {
			return this.item.properties[key] ? this.item.properties[key] : defaultVal;
		},
		clickFeature: function(type,id) {
			this.$root.selectDataLayerFeature(type,id,true,true);
		},
		clickNode: function(id) {
			this.$root.selectNode(id,true,true);
		},
		close: function() {
			this.$dispatch('detail-pane-closed');
			return true;
		}
	}

};

export default mixin;
