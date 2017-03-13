var controller = {
  beacons : undefined,
  revolutionPath : undefined,
  beaconsGraph : undefined,
  hardCodedBeaconDistance : true,
  firstInvalidBeaconWarningIssued : false,
  googleChartsLoaded : false,
  mqttConnected : false,
  singleSensorMode : true,
  hyperSentistiveBeacons : false,
  publishLocation : true,  
  adMode : false, 
  adaptiveBleThreshold : true,
  
  setHardCodedBeaconDistance: function(value) {
  	controller.hardCodedBeaconDistance = value;
  },
  
  setGoogleChartsLoadedTrue: function() {
  	controller.googleChartsLoaded = true;
  },
  
  setSingleSensorMode: function(value) {
  	this.singleSensorMode = value;
  },

  setHyperSentistiveBeacons: function(value) {
  	this.hyperSentistiveBeacons = value;
  },
  
  setAdaptiveBleThreshold: function(value) {
  	this.adaptiveBleThreshold = value;
  },
  
  setPublishLocation: function(value) {
  	this.publishLocation = value;
  },
  
  getPublishLocation : function() {
  	return this.publishLocation;
  },
  
  getHyperSentistiveBeacons : function() {
  	return this.hyperSentistiveBeacons;
  },

  getSingleSensorMode : function() {
  	return this.singleSensorMode;
  },
  
  getGoogleChartsLoaded : function() {
  	return this.googleChartsLoaded;
  },

  getAllBeaconsMac : function() {
    return this.beacons.getAllBeaconsMac();
  },

  getBeacons : function() {
  	return this.beacons;
  },
    
  getBeaconMarkerType : function(mac) {
    return this.beacons.getBeaconMarkerType(mac);
  },
  
  getBeaconsGraph : function() {
  	return this.beaconsGraph;
  },
  
  getBeaconAverageRssi : function(mac) {
    return this.mapMacToBeaconData[mac].avgRssi;
  },
  
  getAdaptiveBleThreshold: function() {
  	return this.adaptiveBleThreshold;
  },
  
  getProductDetails : function(uuid) {
  	var allProducts = this.getAllProducts();
    for (var i = 0; i < allProducts.length; i++) {
    	if (allProducts[i].uuid == uuid) {
    		return allProducts[i];
    	}
    }
    return undefined;
  },
  
  getBeaconProximityThreshold : function(mac) {
  	if (this.getAdaptiveBleThreshold()) {
  		var average = this.getBeacons().getBeaconAverageRssi(mac);
  	  return average == undefined ? undefined : average + 10;
  	} else {
      return -50;
    }
  },
  
  /**
   * Main Entry Point.
   * Called once map is loaded.
   */
  onMapLoaded : function() {
  	// One time actions.
  	mqtt_listener.init();
  	graph.build();
  	graph.mockEdgeTraficVolume();
    graph.mockEdgeTraficSpeed();
  	// testAll();
  	this.hardCodedBeaconDistance = false;
  	this.init();
  	adManagementTab.updateView();
    // supermarketTab.updateView();
  },

  /**
   * Handle a change in the BLE threshold triggered by the UI.
   */  
  onBleThresholdMethodChange : function() {
  	this.publishBleProximityThresholds();
  },
  
  init : function() {
    mainPage.init();
  	this.beaconsGraph = new BeaconsGraph();
    this.beacons = new Beacons();
    this.revolutionPath = new RevolutionPath(this.beacons);
    this.firstInvalidBeaconWarningIssued = false;
    this.initBeacons();
    this.initBeaconsGraph();
    if (this.mqttConnected) {
      this.resetCartDetector();
    }
  },
  
  onMqttConnect : function() {
  	this.mqttConnected = true;
  	this.resetCartDetector();
  },
  
  resetCartDetector : function() {
  	topic = "monitor/cartId/command";
    var payload = JSON.stringify({reset: true});
    mqtt_listener.sendMessage(topic, payload);
 	},

  publishCurrentLocation : function() {
  	if (this.getPublishLocation()) {
	  	topic = "monitor/cartId/location";
	  	var latestPixel = controller.getCartPixel();
			if (latestPixel) {
	      var payload = JSON.stringify({px: latestPixel['px'], py : latestPixel['py']});
	      mqtt_listener.sendMessage(topic, payload);
	    }
	  }
 	},
 	
  toggleAdMode : function() {
  	topic = "monitor/cartId/command";
  	this.adMode = !this.adMode;
    var payload = JSON.stringify({publishAd: this.adMode});
    mqtt_listener.sendMessage(topic, payload);
 	},
 	
  captureImageWithCart : function(imageName) {
  	topic = "monitor/cartId/command";
    var payload = JSON.stringify({captureImageWithCart: true, image_name: imageName});
    mqtt_listener.sendMessage(topic, payload);
 	}, 	 
 	 
  initBeacons : function() {
    this.beacons.addBeacon('34:b1:f7:d3:91:f8',
      {color : '#B71C1C', markerType : 'RED_MARKER', location : undefined, samples : 0, px : 0.118, py : 0.78});
    this.beacons.addBeacon('34:b1:f7:d3:9c:cb',
      {color : '#1B5E20', markerType : 'GREEN_MARKER', location : undefined, samples : 0, px : 0.19, py : 0.78});
    this.beacons.addBeacon('34:b1:f7:d3:9e:2b',
      {color : '#1A237E', markerType : 'BLUE_MARKER', location : undefined, samples : 0, px : 0.19, py : 0.12}); //0.152,
    this.beacons.addBeacon('34:b1:f7:d3:9d:eb',
      {color : '#FFFF00', markerType : 'YELLOW_MARKER', location : undefined, samples : 0, px : 0.118, py : 0.12});
    /*this.beacons.addBeacon('34:b1:f7:d3:90:8e',
      {color : '#4A148C', markerType : 'PURPLE_MARKER', location : undefined, samples : 0, px : 0.195, py : 0.3}); */
  },
  
  initBeaconsGraph : function() {
  	this.beaconsGraph.init();
    if (this.hardCodedBeaconDistance) {
    	this.beaconsGraph.addEdgeLength('34:b1:f7:d3:91:f8', '34:b1:f7:d3:9c:cb', 10);
    	this.beaconsGraph.addEdgeLength('34:b1:f7:d3:9c:cb', '34:b1:f7:d3:9e:2b', 80);
    	this.beaconsGraph.addEdgeLength('34:b1:f7:d3:9e:2b', '34:b1:f7:d3:9d:eb', 10);
    	this.beaconsGraph.addEdgeLength('34:b1:f7:d3:9d:eb', '34:b1:f7:d3:91:f8', 80);
    }
    this.beaconsGraph.addEdgeLength('34:b1:f7:d3:91:f8', '34:b1:f7:d3:91:f8', 0);
    this.beaconsGraph.addEdgeLength('34:b1:f7:d3:9c:cb', '34:b1:f7:d3:9c:cb', 0);
    this.beaconsGraph.addEdgeLength('34:b1:f7:d3:9e:2b', '34:b1:f7:d3:9e:2b', 0);
    this.beaconsGraph.addEdgeLength('34:b1:f7:d3:9d:eb', '34:b1:f7:d3:9d:eb', 0);
  },
  
  treatMsg : function(type, jsonPayload) {
    var payload = JSON.parse(jsonPayload);
    switch (type) {
      case 'revolution':
        this.treatRevolutionMsg(payload);
        break;
      case 'ble':
        this.treatBleMsg(payload);
        break;
    }
  },
  
  getCartPixel : function() {
    var expectedNextBeacon = this.guessNextBeacon(
    	  this.revolutionPath.findLatestNearbyBeacon());
  	return this.revolutionPath.getCartPixel(this.beaconsGraph, expectedNextBeacon);
  },
  
  getRevolutionBasedLocationAtTime : function(ts) {
    return (this.revolutionPath.getCartLatLng(ts));
  },
  
  treatGpsMsg : function(payload) {
    gpsPath.pushPoint(payload);
    mainPage.updateView(/*clearMonitorTab*/ false);
  },
  
  getGraph : function() {
    return graph;
  },
  
  // Temp
  
  getAllProducts : function() {
  	res = [


{"category": "discount", "location_str": "aisle 2", "uuid": "836093010028", "ingredients": "CARBONATED WATER, ORGANIC CANE SUGAR, CERTIFIED ORGANIC NATURAL FLAVORS, CITRIC ACID", "ndbno": "45243227", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "3"}, {"unit": "g", "name": "Protein", "value": "0.00"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "0.56"}, {"unit": "g", "name": "Sugars, total", "value": "0.56"}, {"unit": "mg", "name": "Sodium, Na", "value": "3"}], "price": "$7.99", "location_px": {"px": 0.094, "py": 0.3}, "description": "IZZE, SPARKLING WATER BEVERAGE, RASPBERRY WATERMELON, UPC: 836093010028", "discount_percent": 20, "images": ["836093010028.png"], "name": "IZZE"}

, {"category": "gourmet", "location_str": "aisle 16", "uuid": "14602", "ndbno": 14602, "nutrients": [{"unit": "g", "name": "Water", "value": "86.59"}, {"unit": "kcal", "name": "Energy", "value": "83"}, {"unit": "g", "name": "Protein", "value": "0.07"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "2.51"}, {"unit": "g", "name": "Fiber, total dietary", "value": "0.0"}, {"unit": "g", "name": "Sugars, total", "value": "0.62"}, {"unit": "mg", "name": "Calcium, Ca", "value": "8"}, {"unit": "mg", "name": "Iron, Fe", "value": "0.46"}, {"unit": "mg", "name": "Magnesium, Mg", "value": "12"}, {"unit": "mg", "name": "Phosphorus, P", "value": "23"}, {"unit": "mg", "name": "Potassium, K", "value": "127"}, {"unit": "mg", "name": "Sodium, Na", "value": "4"}, {"unit": "mg", "name": "Zinc, Zn", "value": "0.14"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "0.0"}, {"unit": "mg", "name": "Thiamin", "value": "0.005"}, {"unit": "mg", "name": "Riboflavin", "value": "0.031"}, {"unit": "mg", "name": "Niacin", "value": "0.224"}, {"unit": "mg", "name": "Vitamin B-6", "value": "0.057"}, {"unit": "\u00b5g", "name": "Vitamin B-12", "value": "0.00"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.000"}], "price": "$43.99", "location_px": {"px": 0.575, "py": 0.3}, "description": "Alcoholic Beverage, wine, table, red, Merlot", "discount_percent": 20, "images": ["merlot.png"], "name": "Miolo Reserva Merlot 2009"}

, {"category": "discount", "location_str": "aisle 16", "uuid": "14097", "ndbno": 14097, "nutrients": [{"unit": "g", "name": "Water", "value": "86.56"}, {"unit": "kcal", "name": "Energy", "value": "83"}, {"unit": "g", "name": "Protein", "value": "0.07"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "2.60"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.000"}], "price": "$18.99", "location_px": {"px": 0.595, "py": 0.6}, "description": "Alcoholic Beverage, wine, table, red, Cabernet Sauvignon", "discount_percent": 0, "images": ["cab.png"], "name": "Biltmore Estate Cabernet Sauvignon"}

, {"category": "discount", "location_str": "aisle 17", "uuid": "14004", "ndbno": 14004, "nutrients": [{"unit": "g", "name": "Water", "value": "92.77"}, {"unit": "kcal", "name": "Energy", "value": "41"}, {"unit": "g", "name": "Protein", "value": "0.36"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "2.97"}, {"unit": "g", "name": "Fiber, total dietary", "value": "0.0"}, {"unit": "mg", "name": "Calcium, Ca", "value": "4"}, {"unit": "mg", "name": "Iron, Fe", "value": "0.00"}, {"unit": "mg", "name": "Magnesium, Mg", "value": "7"}, {"unit": "mg", "name": "Phosphorus, P", "value": "13"}, {"unit": "mg", "name": "Potassium, K", "value": "33"}, {"unit": "mg", "name": "Sodium, Na", "value": "3"}, {"unit": "mg", "name": "Zinc, Zn", "value": "0.00"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.000"}, {"unit": "mg", "name": "Cholesterol", "value": "0"}], "price": "$7.99", "location_px": {"px": 0.61, "py": 0.4}, "description": "Alcoholic beverage, beer, regular, BUDWEISER", "discount_percent": 15, "images": ["budweiser.png"], "name": "Budweiser Beer"}

, {"category": "gourmet", "location_str": "aisle 17", "uuid": "046567000299", "ingredients": "CARBONATED WATER, HIGH FRUCTOSE CORN SYRUP, CARAMEL COLOR, POTASSIUM BENZOATE (A PRESERVATIVE), NATURAL AND ARTIFICIAL FLAVOR, CITRIC ACID.", "ndbno": "45137570", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "48"}, {"unit": "g", "name": "Protein", "value": "0.00"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "13.24"}, {"unit": "g", "name": "Sugars, total", "value": "13.24"}, {"unit": "mg", "name": "Sodium, Na", "value": "10"}], "price": "$12.99", "location_px": {"px": 0.63, "py": 0.7}, "description": "RALEY'S, CABLE CAR, ROOT BEER SODA, ROOT BEER, UPC: 046567000299", "discount_percent": 0, "images": ["root_beer.png"], "name": "Raley's Root Beer"}

, {"category": "discount", "location_str": "aisle 22", "uuid": "00049000000443", "ingredients": "Carbonated Water, High Fructose Corn Syrup, Caramel Color, Phosphoric Acid, Natural Flavors, Caffeine", "ndbno": "45130947", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "39"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "10.58"}, {"unit": "g", "name": "Sugars, total", "value": "10.58"}, {"unit": "mg", "name": "Sodium, Na", "value": "12"}, {"unit": "mg", "name": "Caffeine", "value": "9"}], "price": "$1.59", "location_px": {"px": 0.79, "py": 0.4}, "description": "Coca-Cola 20 fluid ounce (US) Non-Refillable Plastic other Bottle Contour, PREPARED, GTIN: 00049000000443", "discount_percent": 25, "images": ["coke_bottle.png"], "name": "Coca Cola Bottle"}

, {"category": "gourmet", "location_str": "aisle 11", "uuid": "45155607", "ingredients": "CARBONATED MINERAL WATER.", "ndbno": "45155607", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "0"}, {"unit": "g", "name": "Protein", "value": "0.00"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "0.00"}, {"unit": "g", "name": "Sugars, total", "value": "0.00"}, {"unit": "mg", "name": "Calcium, Ca", "value": "17"}, {"unit": "mg", "name": "Sodium, Na", "value": "4"}], "price": "$19.99", "location_px": {"px": 0.395, "py": 0.2}, "description": "S.PELLEGRINO, SPARKLING NATURAL MINERAL WATER, UPC: 041508934831", "discount_percent": 0, "images": ["pellergino.png"], "name": "Pellergino"}

, {"category": "gourmet", "location_str": "aisle 11", "uuid": "762111083173", "ingredients": "GREEN TEAS, NATURAL FLAVORS, LEMON VERBENA, SPEARMINT, LEMONGRASS, LICORICE ROOT.", "ndbno": "45110599", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "0"}, {"unit": "g", "name": "Protein", "value": "0.00"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "0.00"}, {"unit": "mg", "name": "Sodium, Na", "value": "0"}], "price": "$4.49", "location_px": {"px": 4175, "py": 0.2}, "description": "TAZO, GREEN TEA WITH BRIGHT MANGO & CITRUS NOTES, ICED MANGO GREEN, UPC: 762111083173", "discount_percent": 0, "images": ["tazo.png"], "name": "Tazo"}

, {"category": "gourmet", "location_str": "aisle 12", "uuid": "45146174", "ingredients": "COLD BREWED COFFEE", "ndbno": "45146174", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "1"}, {"unit": "g", "name": "Protein", "value": "0.00"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "0.00"}, {"unit": "mg", "name": "Sodium, Na", "value": "1"}], "price": "$13.99", "location_px": {"px": 0.454, "py": 0.6}, "description": "PEET'S COFFEE, COLD BREW COFFEE, BOLD SMOOTH EAST AFRICAN COFFEE, BARIDI BLACK, UPC: 785357016651", "discount_percent": 0, "images": ["peets_coffee.png"], "name": "Peet's coffee"}

, {"category": "discount", "location_str": "aisle 14", "uuid": "072036080196", "ingredients": "TOMATO CONCENTRATE, SUGAR, DISTILLED VINEGAR, SALT, ONION POWDER, SPICE, NATURAL FLAVOR.", "ndbno": "45054780", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "118"}, {"unit": "g", "name": "Protein", "value": "0.00"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "23.53"}, {"unit": "g", "name": "Sugars, total", "value": "23.53"}, {"unit": "mg", "name": "Sodium, Na", "value": "941"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "0"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "0.00"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.00"}], "price": "$2.99", "location_px": {"px": 0.5, "py": 0.5}, "description": "TOMATO KETCHUP, UPC: 072036080196", "discount_percent": 15, "images": ["heinz_ketchup.png"], "name": "Tomato Ketchup"}

, {"category": "discount", "location_str": "aisle 14", "uuid": "45035266", "ingredients": "SUGAR, PALM OIL, HAZELNUTS, COCOA, SKIM MILK, WHEY (MILK), LECITHIN AS EMULSIFIER (SOY), VANILLIN: AN ARTIFICIAL FLAVOR.", "ndbno": "45035266", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "541"}, {"unit": "g", "name": "Protein", "value": "5.41"}, {"unit": "g", "name": "Total lipid (fat)", "value": "32.43"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "62.16"}, {"unit": "g", "name": "Fiber, total dietary", "value": "2.7"}, {"unit": "g", "name": "Sugars, total", "value": "56.76"}, {"unit": "mg", "name": "Calcium, Ca", "value": "108"}, {"unit": "mg", "name": "Iron, Fe", "value": "1.95"}, {"unit": "mg", "name": "Sodium, Na", "value": "41"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "0.0"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "0"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "10.81"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.00"}, {"unit": "mg", "name": "Cholesterol", "value": "14"}], "price": "$2.99", "location_px": {"px": 0.525, "py": 0.55}, "description": "NUTELLA, FERRERO, HAZELNUT SPREAD WITH COCOA, THE ORIGINAL, UPC: 090800895007", "discount_percent": 15, "images": ["nutella.png"], "name": "Nutella Spread"}

, {"category": "discount", "location_str": "aisle 19", "uuid": "035000741264", "price": "$19.99", "location_px": {"px": 0.682, "py": 0.4}, "discount_percent": 10, "images": ["colgate.png"], "name": "Colgate Toothpaste Whitening"}

, {"category": "discount", "location_str": "aisle 21", "uuid": "037000138785", "price": "$2.96", "location_px": {"px": 0.755, "py": 0.45}, "discount_percent": 15, "images": ["tide.png"], "name": "Tide Laundry Detergent"}

, {"category": "gourmet", "location_str": "aisle 4", "uuid": "11531", "ndbno": "11531", "nutrients": [{"unit": "g", "name": "Water", "value": "94.75"}, {"unit": "kcal", "name": "Energy", "value": "16"}, {"unit": "g", "name": "Protein", "value": "0.79"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.25"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "3.47"}, {"unit": "g", "name": "Fiber, total dietary", "value": "1.9"}, {"unit": "g", "name": "Sugars, total", "value": "2.55"}, {"unit": "mg", "name": "Calcium, Ca", "value": "33"}, {"unit": "mg", "name": "Iron, Fe", "value": "0.57"}, {"unit": "mg", "name": "Magnesium, Mg", "value": "10"}, {"unit": "mg", "name": "Phosphorus, P", "value": "17"}, {"unit": "mg", "name": "Potassium, K", "value": "191"}, {"unit": "mg", "name": "Sodium, Na", "value": "115"}, {"unit": "mg", "name": "Zinc, Zn", "value": "0.12"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "12.6"}, {"unit": "mg", "name": "Thiamin", "value": "0.575"}, {"unit": "mg", "name": "Riboflavin", "value": "0.055"}, {"unit": "mg", "name": "Niacin", "value": "0.712"}, {"unit": "mg", "name": "Vitamin B-6", "value": "0.111"}, {"unit": "\u00b5g", "name": "Folate, DFE", "value": "8"}, {"unit": "\u00b5g", "name": "Vitamin B-12", "value": "0.00"}, {"unit": "\u00b5g", "name": "Vitamin A, RAE", "value": "20"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "408"}, {"unit": "mg", "name": "Vitamin E (alpha-tocopherol)", "value": "0.59"}, {"unit": "\u00b5g", "name": "Vitamin D (D2 + D3)", "value": "0.0"}, {"unit": "IU", "name": "Vitamin D", "value": "0"}, {"unit": "\u00b5g", "name": "Vitamin K (phylloquinone)", "value": "2.6"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "0.034"}, {"unit": "g", "name": "Fatty acids, total monounsaturated", "value": "0.040"}, {"unit": "g", "name": "Fatty acids, total polyunsaturated", "value": "0.101"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.000"}, {"unit": "mg", "name": "Cholesterol", "value": "0"}, {"unit": "mg", "name": "Caffeine", "value": "0"}], "price": "$2.96", "location_px": {"px": 0.141, "py": 0.6}, "description": "Tomatoes, red, ripe, canned, packed in tomato juice", "discount_percent": 0, "images": ["whole_tomatos.png"], "name": "San Marzano Crushed Tomatoes"}

, {"category": "gourmet", "location_str": "aisle 5", "uuid": "02046", "ndbno": "02046", "nutrients": [{"unit": "g", "name": "Water", "value": "83.72"}, {"unit": "kcal", "name": "Energy", "value": "60"}, {"unit": "g", "name": "Protein", "value": "3.74"}, {"unit": "g", "name": "Total lipid (fat)", "value": "3.34"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "5.83"}, {"unit": "g", "name": "Fiber, total dietary", "value": "4.0"}, {"unit": "g", "name": "Sugars, total", "value": "0.92"}, {"unit": "mg", "name": "Calcium, Ca", "value": "63"}, {"unit": "mg", "name": "Iron, Fe", "value": "1.61"}, {"unit": "mg", "name": "Magnesium, Mg", "value": "48"}, {"unit": "mg", "name": "Phosphorus, P", "value": "108"}, {"unit": "mg", "name": "Potassium, K", "value": "152"}, {"unit": "mg", "name": "Sodium, Na", "value": "1104"}, {"unit": "mg", "name": "Zinc, Zn", "value": "0.64"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "0.3"}, {"unit": "mg", "name": "Thiamin", "value": "0.177"}, {"unit": "mg", "name": "Riboflavin", "value": "0.070"}, {"unit": "mg", "name": "Niacin", "value": "0.565"}, {"unit": "mg", "name": "Vitamin B-6", "value": "0.070"}, {"unit": "\u00b5g", "name": "Folate, DFE", "value": "7"}, {"unit": "\u00b5g", "name": "Vitamin B-12", "value": "0.00"}, {"unit": "\u00b5g", "name": "Vitamin A, RAE", "value": "5"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "109"}, {"unit": "mg", "name": "Vitamin E (alpha-tocopherol)", "value": "0.36"}, {"unit": "\u00b5g", "name": "Vitamin D (D2 + D3)", "value": "0.0"}, {"unit": "IU", "name": "Vitamin D", "value": "0"}, {"unit": "\u00b5g", "name": "Vitamin K (phylloquinone)", "value": "1.4"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "0.214"}, {"unit": "g", "name": "Fatty acids, total monounsaturated", "value": "2.182"}, {"unit": "g", "name": "Fatty acids, total polyunsaturated", "value": "0.774"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.009"}, {"unit": "mg", "name": "Cholesterol", "value": "0"}, {"unit": "mg", "name": "Caffeine", "value": "0"}], "price": "$2.96", "location_px": {"px": 0.201, "py": 0.2}, "description": "Mustard, prepared, yellow", "discount_percent": 0, "images": ["mustard.png"], "name": "English Mustard"}

, {"category": "gourmet", "location_str": "aisle 4", "uuid": "45226473", "ingredients": "PASTEURIZED PART-SKIM MILK, CHEESE CULTURES, SALT, AND ENZYMES.", "ndbno": "45226473", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "286"}, {"unit": "g", "name": "Protein", "value": "28.57"}, {"unit": "g", "name": "Total lipid (fat)", "value": "21.43"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "3.57"}, {"unit": "g", "name": "Fiber, total dietary", "value": "0.0"}, {"unit": "g", "name": "Sugars, total", "value": "0.00"}, {"unit": "mg", "name": "Calcium, Ca", "value": "714"}, {"unit": "mg", "name": "Iron, Fe", "value": "0.00"}, {"unit": "mg", "name": "Sodium, Na", "value": "714"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "0.0"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "714"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "12.500"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.000"}, {"unit": "mg", "name": "Cholesterol", "value": "54"}], "price": "$6.99", "location_px": {"px": 0.16, "py": 0.2}, "description": "MOZZARELLA STRING CHHESE, UPC: 725439114530", "discount_percent": 0, "images": ["mozzarella.png"], "name": "Fresh Mozzarella"}

, {"category": "asian", "location_str": "aisle 6", "uuid": "45016242", "ingredients": "ORGANIC BLACK RICE FLOUR, ORGANIC BROWN RICE FLOUR, ORGANIC WHITE RICE FLOUR.", "ndbno": "45016242", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "371"}, {"unit": "g", "name": "Protein", "value": "8.57"}, {"unit": "g", "name": "Total lipid (fat)", "value": "4.29"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "77.14"}, {"unit": "g", "name": "Fiber, total dietary", "value": "2.9"}, {"unit": "g", "name": "Sugars, total", "value": "0.00"}, {"unit": "mg", "name": "Calcium, Ca", "value": "0"}, {"unit": "mg", "name": "Iron, Fe", "value": "1.03"}, {"unit": "mg", "name": "Potassium, K", "value": "400"}, {"unit": "mg", "name": "Sodium, Na", "value": "0"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "0.0"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "0"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "0.00"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.00"}, {"unit": "mg", "name": "Cholesterol", "value": "0"}], "price": "$20.81", "location_px": {"px": 0.235, "py": 0.3}, "description": "LOTUS FOODS, ORGANIC FORBIDDEN RICE RAMEN, UPC: 708953602011", "discount_percent": 0, "images": ["rice_ramen.png"], "name": "Rice Ramen"}

, {"category": "asian", "location_str": "aisle 6", "uuid": "45047738", "ingredients": "NOODLES: ENRICHED WHEAT FLOUR (FLOUR, NIACIN, IRON, THIAMINE MONONITRATE, RIBOFLAVIN AND FOLIC ACID), TAPIOCA STARCH, WATER, SALT, LACTIC ACID AND SODIUM BENZOATE ADDED TO RETARD SPOILAGE. SOUP BASE: SALT, SUGAR, MONOSODIUM GLUTAMATE, HYDROLYZED SOYBEAN PROTEIN, SOY SAUCE POWDER (SOYBEANS, WHEAT AND SALT), ONION POWDER, GARLIC POWDER, NATURAL SHRIMP POWDER, LEEK CHIPS, CARAMEL COLOR, ARTIFICIAL FLAVOR, WHITE PEPPER, DISODIUM INOSINATE. SODIUM GUALYLATE AND SODIUM CARBONATE.", "ndbno": "45047738", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "127"}, {"unit": "g", "name": "Protein", "value": "3.41"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.49"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "26.34"}, {"unit": "g", "name": "Fiber, total dietary", "value": "0.5"}, {"unit": "g", "name": "Sugars, total", "value": "0.49"}, {"unit": "mg", "name": "Calcium, Ca", "value": "10"}, {"unit": "mg", "name": "Iron, Fe", "value": "1.32"}, {"unit": "mg", "name": "Sodium, Na", "value": "683"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "0.0"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "0"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "0.00"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.00"}, {"unit": "mg", "name": "Cholesterol", "value": "1"}], "price": "$2.96", "location_px": {"px": 0.215, "py": 0.55}, "description": "UDON, JAPANESE STYLE NOODLES WITH SOUP BASE, SHRIMP, UPC: 011152453859", "discount_percent": 0, "images": ["udon.png"], "name": "Udon Noodles"}

, {"category": "asian", "location_str": "aisle 4", "uuid": "45007485", "ingredients": "LYCHEES, WATER, SUGAR.", "ndbno": "45007485", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "81"}, {"unit": "g", "name": "Protein", "value": "0.74"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "20.00"}, {"unit": "g", "name": "Fiber, total dietary", "value": "0.7"}, {"unit": "g", "name": "Sugars, total", "value": "19.26"}, {"unit": "mg", "name": "Calcium, Ca", "value": "0"}, {"unit": "mg", "name": "Iron, Fe", "value": "0.53"}, {"unit": "mg", "name": "Sodium, Na", "value": "33"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "8.9"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "0"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "0.00"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.00"}, {"unit": "mg", "name": "Cholesterol", "value": "0"}], "price": "$3.69", "location_px": {"px": 0.16, "py": 0.6}, "description": "ASIAN GOURMET, WHOLE LYCHEES IN HEAVY SYRUP, UPC: 076606659652", "discount_percent": 0, "images": ["lychee.png"], "name": "Lychee"}

, {"category": "asian", "location_str": "aisle 5", "uuid": "070844005073", "ingredients": "WATER, SUGAR, SOYBEAN PASTE (FERMENTED SOYBEANS, WHEAT FLOUR, SOY SAUCE, SUGAR), GARLIC, CORN STARCH, SALT, VINEGAR, SESAME OIL, CARAMEL COLOR, SPICES, XANTHAN GUM (FOR TEXTURE) AND CITRIC ACID (ACIDULANT).", "ndbno": "45042286", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "156"}, {"unit": "g", "name": "Protein", "value": "0.00"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "37.50"}, {"unit": "g", "name": "Fiber, total dietary", "value": "0.0"}, {"unit": "g", "name": "Sugars, total", "value": "18.75"}, {"unit": "mg", "name": "Calcium, Ca", "value": "0"}, {"unit": "mg", "name": "Iron, Fe", "value": "0.00"}, {"unit": "mg", "name": "Sodium, Na", "value": "3062"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "0.0"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "0"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "0.00"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.00"}, {"unit": "mg", "name": "Cholesterol", "value": "0"}], "price": "$2.29", "location_px": {"px": 0.181, "py": 0.3}, "description": "KA-ME, HOISIN SAUCE, UPC: 070844005073", "discount_percent": 0, "images": ["hoisin.png"], "name": "Hoisin Sauce"}

, {"category": "asian", "location_str": "aisle 6", "uuid": "041390002847", "ingredients": "WATER, WHEAT, SOYBEANS, SALT, SODIUM BENZOATE; LESS THAN 1/10 OF 1% AS A PRESERVATIVE", "ndbno": "45135919", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "67"}, {"unit": "g", "name": "Protein", "value": "13.33"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "0.00"}, {"unit": "mg", "name": "Sodium, Na", "value": "6133"}], "price": "$2.29", "location_px": {"px": 0.215, "py": 0.45}, "description": "KIKKOMAN, SOY SAUCE, UPC: 041390002847", "discount_percent": 0, "images": ["soy_sauce.png"], "name": "Soy Sauce"}

, {"category": "asian", "location_str": "aisle 6", "uuid": "8084360115101", "ingredients": "100% MECHANICALLY (EXPELLER) PRESSED REFINED SESAME OIL", "ndbno": "45017750", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "857"}, {"unit": "g", "name": "Protein", "value": "0.00"}, {"unit": "g", "name": "Total lipid (fat)", "value": "100.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "0.00"}, {"unit": "mg", "name": "Sodium, Na", "value": "0"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "14.29"}, {"unit": "g", "name": "Fatty acids, total monounsaturated", "value": "42.86"}, {"unit": "g", "name": "Fatty acids, total polyunsaturated", "value": "42.86"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.00"}, {"unit": "mg", "name": "Cholesterol", "value": "0"}], "price": "$7.99", "location_px": {"px": 0.215, "py": 0.58}, "description": "SPECTRUM, SESAME OIL, UPC: 8084360115101", "discount_percent": 0, "images": ["sesame_oil.png"], "name": "Sesame Oil"}

, {"category": "asian", "location_str": "aisle 4", "images": ["water_chestnut.png"], "uuid": "738055039545", "price": "$1.29", "location_px": {"px": 0.141, "py": 0.2}, "discount_percent": 0, "name": "Water Chestnut"}


, {"category": "gluten_free", "location_str": "aisle 14", "uuid": "039978025357", "ingredients": "TAPIOCA.", "ndbno": "45026808", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "333"}, {"unit": "g", "name": "Protein", "value": "0.00"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "86.67"}, {"unit": "g", "name": "Fiber, total dietary", "value": "0.0"}, {"unit": "g", "name": "Sugars, total", "value": "0.00"}, {"unit": "mg", "name": "Calcium, Ca", "value": "0"}, {"unit": "mg", "name": "Iron, Fe", "value": "1.20"}, {"unit": "mg", "name": "Sodium, Na", "value": "0"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "0.0"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "0"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "0.00"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.00"}, {"unit": "mg", "name": "Cholesterol", "value": "0"}], "price": "$7.99", "location_px": {"px": 0.525, "py": 0.75}, "description": "BOB'S RED MILL, FINELY GROUND TAPIOCA FLOUR, UPC: 039978025357", "discount_percent": 0, "images": ["tapioca_flower.png"], "name": "Bob Red's Mill Tapioca Flour"}

, {"category": "gluten_free", "location_str": "Dairy Fridge", "uuid": "795709040029", "ingredients": "ORGANIC CULTURED PASTEURIZED REDUCED FAT MILK. LIVE ACTIVE CULTURES: L. ACIDOPHILUS, L. BULGARICUS, S. THERMOPHILUS, BIFIDUS.", "ndbno": "45002134", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "53"}, {"unit": "g", "name": "Protein", "value": "4.89"}, {"unit": "g", "name": "Total lipid (fat)", "value": "0.00"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "7.11"}, {"unit": "g", "name": "Fiber, total dietary", "value": "0.0"}, {"unit": "g", "name": "Sugars, total", "value": "4.44"}, {"unit": "mg", "name": "Calcium, Ca", "value": "178"}, {"unit": "mg", "name": "Iron, Fe", "value": "0.48"}, {"unit": "mg", "name": "Sodium, Na", "value": "58"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "0.0"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "0"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "0.00"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.00"}, {"unit": "mg", "name": "Cholesterol", "value": "7"}], "price": "$4.49", "location_px": {"px": 0.907, "py": 0.727}, "description": "WALLABY ORGANIC PLAIN YOGURT, UPC: 795709040029", "discount_percent": 0, "images": ["wallaby_plain_yogurt.jpeg"], "name": "Wallaby Plain Yogurt"}

, {"category": "gluten_free", "location_str": "aisle 14", "uuid": "45015721", "ingredients": "ORGANIC BROWN RICE.", "ndbno": "45015721", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "350"}, {"unit": "g", "name": "Protein", "value": "8.33"}, {"unit": "g", "name": "Total lipid (fat)", "value": "2.50"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "75.00"}, {"unit": "g", "name": "Fiber, total dietary", "value": "3.3"}, {"unit": "g", "name": "Sugars, total", "value": "0.00"}, {"unit": "mg", "name": "Calcium, Ca", "value": "0"}, {"unit": "mg", "name": "Iron, Fe", "value": "1.20"}, {"unit": "mg", "name": "Magnesium, Mg", "value": "133"}, {"unit": "mg", "name": "Phosphorus, P", "value": "333"}, {"unit": "mg", "name": "Potassium, K", "value": "233"}, {"unit": "mg", "name": "Sodium, Na", "value": "0"}, {"unit": "mg", "name": "Zinc, Zn", "value": "2.50"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "0.0"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "0"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "0.83"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.00"}, {"unit": "mg", "name": "Cholesterol", "value": "0"}], "price": "$5.79", "location_px": {"px": 0.525, "py": 0.65}, "description": "LOTUS FOODS, ORGANIC BROWN MEKONG FLOWER RICE, JASMINE, UPC: 708953502588", "discount_percent": 0, "images": ["brown_rice_flower.png"], "name": "Brown Rice Flower"}

, {"category": "gluten_free", "location_str": "register", "uuid": "19159", "ndbno": "19159", "nutrients": [{"unit": "g", "name": "Water", "value": "5.80"}, {"unit": "kcal", "name": "Energy", "value": "436"}, {"unit": "g", "name": "Protein", "value": "2.60"}, {"unit": "g", "name": "Total lipid (fat)", "value": "12.75"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "77.77"}, {"unit": "g", "name": "Fiber, total dietary", "value": "1.5"}, {"unit": "g", "name": "Sugars, total", "value": "66.89"}, {"unit": "mg", "name": "Calcium, Ca", "value": "54"}, {"unit": "mg", "name": "Iron, Fe", "value": "0.67"}, {"unit": "mg", "name": "Magnesium, Mg", "value": "29"}, {"unit": "mg", "name": "Phosphorus, P", "value": "69"}, {"unit": "mg", "name": "Potassium, K", "value": "133"}, {"unit": "mg", "name": "Sodium, Na", "value": "194"}, {"unit": "mg", "name": "Zinc, Zn", "value": "0.55"}, {"unit": "mg", "name": "Vitamin C, total ascorbic acid", "value": "0.2"}, {"unit": "mg", "name": "Thiamin", "value": "0.034"}, {"unit": "mg", "name": "Riboflavin", "value": "0.056"}, {"unit": "mg", "name": "Niacin", "value": "0.230"}, {"unit": "mg", "name": "Vitamin B-6", "value": "0.015"}, {"unit": "\u00b5g", "name": "Folate, DFE", "value": "4"}, {"unit": "\u00b5g", "name": "Vitamin B-12", "value": "0.16"}, {"unit": "\u00b5g", "name": "Vitamin A, RAE", "value": "20"}, {"unit": "IU", "name": "Vitamin A, IU", "value": "67"}, {"unit": "mg", "name": "Vitamin E (alpha-tocopherol)", "value": "0.98"}, {"unit": "\u00b5g", "name": "Vitamin D (D2 + D3)", "value": "0.0"}, {"unit": "IU", "name": "Vitamin D", "value": "0"}, {"unit": "\u00b5g", "name": "Vitamin K (phylloquinone)", "value": "2.9"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "8.646"}, {"unit": "g", "name": "Fatty acids, total monounsaturated", "value": "2.373"}, {"unit": "g", "name": "Fatty acids, total polyunsaturated", "value": "0.316"}, {"unit": "g", "name": "Fatty acids, total trans", "value": "0.129"}, {"unit": "mg", "name": "Cholesterol", "value": "5"}, {"unit": "mg", "name": "Caffeine", "value": "7"}], "price": "$4.19", "location_px": {"px": 0.2, "py": 0.89}, "description": "Candies, MARS SNACKFOOD US, 3 MUSKETEERS Bar", "discount_percent": 0, "images": ["3_musketeers.png"], "name": "3 Musketeers"}

, {"category": "gluten_free", "location_str": "register", "uuid": "079200975852", "ingredients": "CORN SYRUP, SUGAR, PALM OIL, AND LESS THAN 2% OF MALIC ACID, MONO- AND DIGLYCERIDES, HYDROGENATED COTTONSEED OIL, SALT LECITHIN, NATURAL FLAVOR, BLUE 1, YELLOW 5.", "ndbno": "45158034", "nutrients": [{"unit": "kcal", "name": "Energy", "value": "359"}, {"unit": "g", "name": "Protein", "value": "0.00"}, {"unit": "g", "name": "Total lipid (fat)", "value": "5.13"}, {"unit": "g", "name": "Carbohydrate, by difference", "value": "76.92"}, {"unit": "g", "name": "Sugars, total", "value": "48.72"}, {"unit": "mg", "name": "Sodium, Na", "value": "128"}, {"unit": "g", "name": "Fatty acids, total saturated", "value": "3.850"}], "price": "$2.99", "location_px": {"px": 0.22, "py": 0.89}, "description": "LAFFY TAFFY, TAFFY CANDY, SOUR APPLE, BLUE RASPBERRY, UPC: 079200975852", "discount_percent": 0, "images": ["laffy_taffy.png"], "name": "Laffy Taffy"}

       ];
       
       
       
    return res;
  },
  

  
  // Implementation
  
  guessNextBeacon : function(currentMac) {
  	var expectedPath = ['34:b1:f7:d3:91:f8', '34:b1:f7:d3:9c:cb', '34:b1:f7:d3:9e:2b', '34:b1:f7:d3:9d:eb'];
  	var index = expectedPath.indexOf(currentMac);
  	if (!index && index != 0) {
  		return undefined;
  	}
  	return expectedPath[(index + 1) % expectedPath.length];
  },
  
  // Returns true if beacon is one of pre configured beacons.
  isValidBeacon : function(mac) {
  	return this.beacons.getAllBeaconsMac().indexOf(mac) != -1;
  },
  
  // Issued only once.
  issueBeaconDoesNotExistWarning : function() {
  	if (!this.firstInvalidBeaconWarningIssued) {
  	  this.firstInvalidBeaconWarningIssued = true;
  	  mainPage.displayBeaconDoesNotExistWarning();
  	}
  },
  
  treatRevolutionMsg : function(payload) {
    // {"start_time": 1487295518.0, "forward_counter": 7, "backward_counter": 0, "forward_revolution": true}
    this.revolutionPath.addRevolutionEvent(payload.forward_revolution, payload.start_time);
    this.publishCurrentLocation();
    mainPage.updateView(/*clearMonitorTab*/ false);
  },
  
  treatBleMsg : function(payload) {
    var mac = payload["mac"];
    var rssi = payload["nearest_rssi"];
    if (!this.isValidBeacon(mac)) {
    	this.issueBeaconDoesNotExistWarning();
      return;    	
    }
    var prevMac = this.revolutionPath.findLatestNearbyBeacon();
    var nearestTime = payload['nearest_time'];
    if (!this.hardCodedBeaconDistance) {  // Learn beacons distance.
    	if (prevMac) {
	    	var dist = prevMac === mac ?
	    	    0 : this.revolutionPath.countRevolutionsSinceLatestProximityEvent();
	    	if (dist >= 0) {
	    	  this.beaconsGraph.addEdgeLength(prevMac, mac, dist);
	    	}
	    }
    }
    this.beacons.addBeaconSample(mac, rssi)
    this.revolutionPath.addProximityEvent(mac, nearestTime);
    this.publishCurrentLocation();
    mainPage.updateView(/*clearMonitorTab*/ true);
  },
  
  publishBleProximityThresholds : function() {
  	var topic = "monitor/cartId/command";
  	var allBeaconsMac = controller.getAllBeaconsMac();
    for (var i = 0; i < allBeaconsMac.length; i++) {
    	var mac = allBeaconsMac[i];
    	var threshold = this.getBeaconProximityThreshold(mac);
    	if (threshold != undefined) {
    	  var payload = JSON.stringify({changeThreshold: true, mac: mac, threshold: threshold});
    	  mqtt_listener.sendMessage(topic, payload);
    	}
    }
  },
  
}