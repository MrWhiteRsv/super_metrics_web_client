function testRevolutionPath() {
  utils.assert(testRevolutionPath5());
  /*return testRevolutionPath0() &&
      testRevolutionPath1() &&
      testRevolutionPath2() &&*/
   return testRevolutionPath5();
}

/**
 * Test getCartLatLng without any revolution events, and acceding temporal bounds.
 */
function testRevolutionPath0() {
  var rawBeacons = {
    'a' : {location : {lat : 10, lon : 0}},
    'b' : {location : {lat : 10, lon : 10}},
  };
  var beacons = new Beacons(rawBeacons);
  var revolutionPath = new RevolutionPath(rawBeacons);
  revolutionPath.init(beacons);
  revolutionPath.addProximityEvent('a', 0);
  revolutionPath.addProximityEvent('b', 1);
  if (revolutionPath.getCartLatLng(- 1).lon != 0) {
    return false;
  }
  if (revolutionPath.getCartLatLng(0.5).lon != 0.0) {
    return false;
  }
  if (revolutionPath.getCartLatLng(2).lon != 10) {
    return false;
  }
  return true;
}

/**
 * Tests getCartLatLng basic functionality.
 */
function testRevolutionPath1() {
  var rawBeacons = {
    'a' : {location : {lat : 10, lon : 0}},
    'b' : {location : {lat : 10, lon : 10}},
  };
  var beacons = new Beacons(rawBeacons);
  var revolutionPath = new RevolutionPath(beacons);
  revolutionPath.init(beacons);
  revolutionPath.addProximityEvent('a', 0);
  revolutionPath.addProximityEvent('b', 1);
  revolutionPath.addRevolutionEvent(true, 0.5);
  console.log(revolutionPath.toString());
  /*if (revolutionPath.getCartLatLng(0.25).lon != 0.0) {
    return false;
  }*/
  if (revolutionPath.getCartLatLng(0.75).lon != 10.0) {
    return false;
  }
  return true;
}

/**
 * Tests getCartLatLng with 2 segments, multiple beacons and out of order revolution events.
 */
function testRevolutionPath2() {
  var rawBeacons = {
    'a' : {location : {lat : 0, lon : 0}},
    'b' : {location : {lat : 10, lon : 0}},
    'c' : {location : {lat : 20, lon : 0}},
  };
  var beacons = new Beacons(rawBeacons);
  var revolutionPath = new RevolutionPath(beacons);
  revolutionPath.init(beacons);
  revolutionPath.addProximityEvent('a', 0);
  revolutionPath.addProximityEvent('b', 1);
  revolutionPath.addProximityEvent('c', 2);
  revolutionPath.addRevolutionEvent(true, 1.2);
  revolutionPath.addRevolutionEvent(true, 1.4);
  revolutionPath.addRevolutionEvent(true, 1.8);
  revolutionPath.addRevolutionEvent(true, 1.6);
  if (revolutionPath.getCartLatLng(1.1).lat != 10.0) {
    return false;
  }
  if (revolutionPath.getCartLatLng(1.3).lat != 12.5) {
    return false;
  }
  if (revolutionPath.getCartLatLng(1.5).lat != 15.0) {
    return false;
  }
  if (revolutionPath.getCartLatLng(1.7).lat != 17.5) {
    return false;
  }
  if (revolutionPath.getCartLatLng(1.9).lat != 20.0) {
    return false;
  }
  return true;
}

/**
 * Add revolutions without proximitity events.
 */
function testRevolutionPath3() {
  var rawBeacons = {};
  var beacons = new Beacons();
  var revolutionPath = new RevolutionPath(rawBeacons);
  revolutionPath.init(beacons);
  revolutionPath.addRevolutionEvent(true, 1);
  if (revolutionPath.getCartLatLng(2) != undefined) {
    return false;
  }
  return true;
}

function testRevolutionPath4() {
  var rawBeacons = {};
  var beacons = new Beacons(rawBeacons);
  var revolutionPath = new RevolutionPath(beacons);
  revolutionPath.init(beacons);
  rawBeacons['a'] = {location : {lat : 10, lon : 0}};
  rawBeacons['b'] = {location : {lat : 10, lon : 10}};
  revolutionPath.addProximityEvent('a', 0);
  revolutionPath.addProximityEvent('b', 1);
  revolutionPath.addRevolutionEvent(true, 0.5);
  revolutionPath.addProximityEvent('a', 0);
  revolutionPath.addProximityEvent('b', 1);
  if (revolutionPath.getCartLatLng(0.25).lon != 0.0) {
    utils.assert(false);
    return false;
  }
  if (revolutionPath.getCartLatLng(0.75).lon != 10.0) {
    utils.assert(false);
    return false;
  }
  return true;
}

function testRevolutionPath5() {
  var rawBeacons = {
    'a' : {location : {lat : 10, lon : 0}},
    'b' : {location : {lat : 10, lon : 10}},
  };
  var beacons = new Beacons(rawBeacons);
  var revolutionPath = new RevolutionPath(beacons);
  revolutionPath.init(beacons);
  revolutionPath.addRevolutionEvent(true, 0.5);
  revolutionPath.addProximityEvent('a', 0);
  revolutionPath.addProximityEvent('b', 1);
  if (revolutionPath.getCartLatLng(0.25).lon != 0.0) {
    utils.assert(false);
    return false;
  }
  if (revolutionPath.getCartLatLng(0.75).lon != 10.0) {
    utils.assert(false);
    return false;
  }
  return true;
}
