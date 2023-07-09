export default class NodePathCalculator {

	constructor(nodes) {
		this.nodes = nodes;
		this.setupNodeGraph();
	}

	setupNodeGraph( discardUnreleasedNodes=false ) {
		let graph = new DirectedGraph();
		for( let n in this.nodes ) {
			let node = this.nodes[n];
			if( node.hidden ) {
				continue;
			}
			if( !node.links ) {
				continue;
			}

			var nodeEdges = {};
			for( let l in node.links ) {
				if( !this.nodes[node.links[l]] ) {
					continue;
				}
				if( discardUnreleasedNodes && this.nodes[node.links[l]].unreleased ) {
					continue;
				}
				let linkedNode = this.nodes[node.links[l]];
				if( linkedNode.hidden ) {
					continue;
				}
				nodeEdges[linkedNode.id] = linkedNode.contribution || 0;
			}
			graph.addVertex( node.id, nodeEdges );
		}
		if( discardUnreleasedNodes ) {
			this.nodeGraphWithoutUnreleasedNodes = graph;
		} else {
			this.nodeGraph = graph;
		}
	}

	getShortestPath( startNodeId, endNodeId ) {
			if( !this.nodeGraph ) {
				this.setupNodeGraph();
			}
			let shortestPath = this.nodeGraph.getShortestPath(startNodeId + '', endNodeId + '').concat(startNodeId + '').reverse();
			let pathNodes = [];
			let pathContributionTotal = 0;
			for( var i in shortestPath ) {
				pathNodes.push( this.nodes[shortestPath[i]] );
				pathContributionTotal += this.nodes[shortestPath[i]].contribution || 0;
			}
			return {
				pathids: shortestPath,
				path: pathNodes,
				contributionTotal: pathContributionTotal
			}
		}

	getShortestPathWithoutUnreleasedNodes( startNodeId, endNodeId ) {
		if( !this.nodeGraphWithoutUnreleasedNodes ) {
			this.setupNodeGraph( true );
		}
		let shortestPath = this.nodeGraphWithoutUnreleasedNodes.getShortestPath(startNodeId + '', endNodeId + '').concat(startNodeId + '').reverse();
		let pathNodes = [];
		let pathContributionTotal = 0;
		for( var i in shortestPath ) {
			pathNodes.push( this.nodes[shortestPath[i]] );
			pathContributionTotal += this.nodes[shortestPath[i]].contribution || 0;
		}
		return {
			pathids: shortestPath,
			path: pathNodes,
			contributionTotal: pathContributionTotal
		}
	}

}

class PriorityQueue {
	constructor() {
		this._nodes = [];
	}
	enqueue(priority, key) {
		this._nodes.push({key: key, priority: priority});
		this.sort();
	}
	dequeue() {
		return this._nodes.shift().key;
	}
	sort() {
		this._nodes.sort(function (a, b) {
			return a.priority - b.priority;
		});
	}
	isEmpty() {
		return !this._nodes.length;
	}
}


class DirectedGraph {
	constructor() {
		this.vertices = {};
	}

	addVertex(name, edges){
		this.vertices[name] = edges;
	}

	getShortestPath(start, finish) {
		var nodes = new PriorityQueue(),
				distances = {},
				previous = {},
				path = [],
				smallest, vertex, neighbor, alt;

		for(vertex in this.vertices) {
			if(vertex === start) {
				distances[vertex] = 0;
				nodes.enqueue(0, vertex);
			}
			else {
				distances[vertex] = Infinity;
				nodes.enqueue(Infinity, vertex);
			}

			previous[vertex] = null;
		}

		while(!nodes.isEmpty()) {
			smallest = nodes.dequeue();

			if(smallest === finish) {
				path;

				while(previous[smallest]) {
					path.push(smallest);
					smallest = previous[smallest];
				}

				break;
			}

			if(!smallest || distances[smallest] === Infinity){
				continue;
			}

			for(neighbor in this.vertices[smallest]) {
				alt = distances[smallest] + this.vertices[smallest][neighbor];

				if(alt < distances[neighbor]) {
					distances[neighbor] = alt;
					previous[neighbor] = smallest;
					nodes.enqueue(alt, neighbor);
				}
			}
		}

		return path;
	}
}
