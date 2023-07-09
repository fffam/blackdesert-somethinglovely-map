var EventEmitter = require('eventemitter3');

export default class NodePlanner extends EventEmitter {

	constructor( nodes ) {
		super();
		this.nodes = nodes;
		this.plan = {
			nodes: {},
			extraCPforNodes: {}
		};
		this.allPlans = {};

		this.serviceUrls = {
			get: 'https://us-central1-bdo-map-30607.cloudfunctions.net/nodeplan',
			create: 'https://us-central1-bdo-map-30607.cloudfunctions.net/nodeplancreate',
			update: 'https://us-central1-bdo-map-30607.cloudfunctions.net/nodeplanupdate'
		}

		this.plan.nodes[1] = this.nodes[1];
		this.plan.nodes[21] = this.nodes[21];
		this.plan.nodes[131] = this.nodes[131];
		this.plan.extraCPforNodes[1] = 2;
		this.emit('plan-changed',this.plan);
		this.emit('plan-updated');
		this.emit('plans-updated');
	}

	hasNode( nodeId ) {
		return !!(this.plan.nodes[+nodeId]);
	}

	loadPlan( planId ) {
		window.console.log('[NodePlanner]','loadPlan',planId);

		var fetchOptions = {
			credentials: 'omit',
			headers: {
				'Accept': 'application/json'
			} 
		};
		var params = {
			id: planId
		};
		var query = Object.keys(params)
			.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
			.join('&');
		var url = this.serviceUrls.get + '?' + query;

		// Load the remote JSON
		this.loading = true;
		return fetch(url,fetchOptions).then( (response) => {
			return response.json();
		}).then( (j) => {

			let plan = {
				id: planId,
				isExternal: true,
				name: j.name,
				nodes: {},
				extraCPforNodes: {},
			};
			for( let idx in j.nodeids ) {
				if( this.nodes[j.nodeids[idx]] ) {
					plan.nodes[+(j.nodeids[idx])] = this.nodes[j.nodeids[idx]];
				}
			}
			for( let nodeid in j.extracp ) {
				plan.extraCPforNodes[nodeid*1] = j.extracp[nodeid]*1;
			}

			this.plan = plan;
			this.allPlans[this.generateUUID()] = plan;

			this.emit('plan-changed',this.plan);
			this.emit('plan-updated');
			this.emit('plans-updated');

			this.loading = false;
			return plan;
		}).catch( (e) => {
			window.console.error('Could not load node plan',e);
			this.loading = false;
			throw e;
		});
	}

	savePlan( plan ) {
		window.console.log('[NodePlanner]','savePlan');

		// Build the data to send to server
		var formData = new FormData();
		formData.append( 'name', val );
		formData.append( 'nodeids', Object.keys(plan.nodes).map( a => a*1 ).join(',') );
		formData.append( 'extracp', JSON.stringify(extraCP) );

		// URL for API
		var url;

		// If the plan has an 'id' property, then it has already been saved
		// and we should update, otherwise save as new plan
		if( plan.id && plan.key ) {
			window.console.log('[NodePlanner]','savePlan','→ Update');
			url = this.serviceUrls.update;
			formData.append( 'id', plan.id );
			formData.append( 'key', plan.key );
		} else {
			window.console.log('[NodePlanner]','savePlan','→ Create');
			url = this.serviceUrls.create;
		}

		let extraCP = {};
		if( plan.extraCP ) {
			for( var nodeid in plan.extraCP ) {
				extraCP[''+nodeid] = plan.extraCP * 1;
			}
		}

		this.loading = true;
		fetch(url,
		{
			credentials: 'omit',
			headers: {
			  'Accept': 'application/json',
			  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			method: "POST",
			body: formData
		}).then( (response) => {
			return response.json();
		}).then( (j) => {

			// If the ID & key for saving were supplied in response,
			// attach them back to the original plan
			if( j.id ) {
				plan.id = j.id;
				plan.key = j.key;
			}
			plan.isExternal = false;

			this.loading = false;
			return plan;
		}).catch( (e) => {
			window.console.error('Could not save node plan',e);
			this.loading = false;
		});
	}

	addNodeById( nodeId ) {
		this.plan.nodes[nodeId] = this.nodes[nodeId];
		this.emit('plan-node-added',{plan:this.plan, node: this.nodes[nodeId]});
		this.emit('plan-changed',this.plan);
		this.emit('plan-updated');
	}

	removeNodeById( nodeId ) {
		if( !this.nodes[nodeId] ) {
			throw new Error('Cannot find node',nodeId);
			return;
		}
		let node = this.nodes[nodeId];

		if( this.plan.nodes[+nodeId] ) {
			delete this.plan.nodes[+nodeId];
		}
		if( this.plan.extraCPforNodes[+nodeId] ) {
			delete this.plan.extraCPforNodes[+nodeId];
		}

		this.emit('plan-node-removed',{plan:this.plan, node: node});
		this.emit('plan-changed',this.plan);
		this.emit('plan-updated');

	}

	isLocalStorageAvailable() {

	}

	onStorageChangedRemotely( e ) {

	}

	saveStateIntoStorage() {

	}

	restoreStateFromStorage() {

	}

	clearStorage() {

	}

	generateUUID(){
		var d = new Date().getTime();
		if(window.performance && typeof window.performance.now === "function"){
			d += performance.now(); //use high-precision timer if available
		}
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (d + Math.random()*16)%16 | 0;
			d = Math.floor(d/16);
			return (c=='x' ? r : (r&0x3|0x8)).toString(16);
		});
		return uuid;
	}

	getPlans() {
		return {
			'default': 'Test Plan'
		}
	}

	selectPlan( planId ) {
		let plan = {};
		this.emit('plan-selected',plan);
	}

}
