export default class CoordinateSystems {

	constructor() {
		this.systems = ['sl','sl2','bd1','bd2','kr'];
		this.conversions = {};

		// Register the scale/translate factors for the different conversions
		this.conversions['bd1'+'-'+'sl'] = this.createConversionForBd1ToSl();
		this.conversions['bd2'+'-'+'sl'] = this.createConversionForBd2ToSl();
		this.conversions['kr'+'-'+'sl'] = this.createConversionForKrToSl();

		this.conversions['bd1'+'-'+'sl2'] = this.createConversionForBd1ToSl2();
		this.conversions['bd2'+'-'+'sl2'] = this.createConversionForBd2ToSl2();
		this.conversions['bd2'+'-'+'kr'] = this.createConversionForBd2ToKr();
		//this.conversions['sl'+'-'+'sl2'] = this.createConversionForKrToSl2();
		this.conversions['kr'+'-'+'sl2'] = this.createConversionForKrToSl2();
		this.conversions['sl2'+'-'+'kr'] = this.createConversionForSl2ToKr();

		this.conversions['gatheringdata-kr'] = this.createConversionForBd2GatheringDataToKr();
	}

	convert( coord, from='kr', to='sl2' ) {

		var conversion = this.conversions[from+'-'+to];
		if( !conversion ) {
			throw 'No conversion found for '+from+'-'+to;
		}

		if( conversion.pretranslate ) {
			coord = [
				conversion.pretranslate.x + (+coord[0]),
				conversion.pretranslate.y + (+coord[1])
			];
		}

		return [
				(conversion.translate.x + conversion.scale.x * coord[0]),
				(conversion.translate.y + conversion.scale.y * coord[1])
		];

	}

	batch( coords, from='bd1', to='sl2' ) {

		var conversion = this.conversions[from+'-'+to];
		if( !conversion ) {
			throw 'No conversion found for '+from+'-'+to;
		}

		var translate = conversion.translate;
		var scale = conversion.scale;

		return coords.map( coord => {

			if( conversion.pretranslate ) {
				coord = [
					conversion.pretranslate.x + (+coord[0]),
					conversion.pretranslate.y + (+coord[1])
				];
			}

			return [
				(translate.x + scale.x * coord[0]),
				(translate.y + scale.y * coord[1])
			]
		});
	}

	createConversionForKrToSl2() {
		return {
			pretranslate: {x:0,y:0},
			translate: {x:(64*256)+(915),y:(64*256)+(1675)},
			scale: {x:1/100,y:-1/100}
		}
	}

	createConversionForSl2ToKr() {
		return {
			pretranslate: {x:((64*256)+(915)) * -1,y: ((64*256)+(1675)) * -1},
			translate: {x:0,y:0},
			scale: {x:100,y:-100}
		}
	}

	createConversionForKrToSl() {
		return {
			pretranslate: {x:-14000,y:250000},
			translate: {x:11950,y:18550},
			scale: {x:0.0164,y:-0.0164}
		}
	}

	createConversionForBd1ToSl2() {
		return {
			pretranslate: {x:0,y:0},
			translate: {x:64*64*2.5,y:64*128*1.25},
			scale: {x:0.6,y:0.6}
		}
	}

	createConversionForBd2ToKr() {
		return {
			pretranslate: {x:-20872.145,y:-16777.435},
			translate: {x:372214.5,y:127456.5},
			scale: {x:100,y:-100}
		}
	}

	createConversionForBd2GatheringDataToKr() {

		var xOffset = -1790;
		var yOffset = 190;

		var sourceCoords = [
			{"x":3041+xOffset,"y":7444+yOffset},
			{"x":31714+xOffset,"y":19605+yOffset}
		];

		var targetCoords = [
			{"x":-521100,"y":426100},
			{x: 1217745,y:-293217}
		];

		var translateFactors = {
				"x":(targetCoords[1].x * sourceCoords[0].x - targetCoords[0].x * sourceCoords[1].x) / (sourceCoords[0].x - sourceCoords[1].x),
				"y":(targetCoords[1].y * sourceCoords[0].y - targetCoords[0].y * sourceCoords[1].y) / (sourceCoords[0].y - sourceCoords[1].y)
		};

		var scaleFactors = {
				"x":(targetCoords[1].x - targetCoords[0].x) / (sourceCoords[1].x - sourceCoords[0].x),
				"y":(targetCoords[1].y - targetCoords[0].y) / (sourceCoords[1].y - sourceCoords[0].y)
		};

		return {
			translate: translateFactors,
			scale: scaleFactors
		}
	}

	// Create the conversion parameters for converting from
	// BDDatabase's initial gathering data map coordinate system (Aug 2016)
	// to their the Coord system that this map uses
	createConversionForBd1ToSl() {
		return {
			pretranslate: {x:-10000,y:-10000},
			translate: {x:10000,y:10000},
			scale: {x:0.99945,y:0.99945}
		}
	}

	// Create the conversion parameters for converting from
	// BDDatabase's updated gathering data map coordinate system (Oct 2016)
	// to their the Coord system that this map uses
	createConversionForBd2ToSl() {
		var sourceCoords = [
			{"x":3041,"y":7444},
			{"x":31714,"y":19605}
		];

		var targetCoords = [
			{"x":5185,"y":7433},
			{"x":32693,"y":18960}
		];

		var translateFactors = {
				"x":(targetCoords[1].x * sourceCoords[0].x - targetCoords[0].x * sourceCoords[1].x) / (sourceCoords[0].x - sourceCoords[1].x),
				"y":(targetCoords[1].y * sourceCoords[0].y - targetCoords[0].y * sourceCoords[1].y) / (sourceCoords[0].y - sourceCoords[1].y)
		};

		var scaleFactors = {
				"x":(targetCoords[1].x - targetCoords[0].x) / (sourceCoords[1].x - sourceCoords[0].x),
				"y":(targetCoords[1].y - targetCoords[0].y) / (sourceCoords[1].y - sourceCoords[0].y)
		};

		return {
			translate: translateFactors,
			scale: scaleFactors
		}
	}

	// Create the conversion parameters for converting from
	// BDDatabase's updated gathering data map coordinate system (Oct 2016)
	// to their the Coord system that this map uses
	createConversionForBd2ToSl2() {
		return {
			pretranslate: {x:256*64,y:256*64},
			translate: {x:0,y:0},
			scale: {x:0.5,y:0.5}
		}
	}

}
