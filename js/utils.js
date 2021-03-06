var utils = {

  assert : function(condition, message) {
    if (!condition) {
      message = message || "Assertion failed";
      if (typeof Error !== "undefined") {
        throw new Error(message);
      }
      throw message; // Fallback
    }
  },

  assertIsString : function(variable, message) {
    this.assert(typeof variable === 'string' || variable instanceof String, message);
  },

  assertIsInteger : function(variable, message) {
    this.assert(Number.isInteger(variable), message);
  },

  isNumeric : function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  },
  
  getDistanceFromLatLonInMeter : function(lat1,lon1,lat2,lon2) {
   var R = 6371; // Radius of the earth in km
   var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
   var dLon = this.deg2rad(lon2-lon1); 
   var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
       Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
       Math.sin(dLon/2) * Math.sin(dLon/2); 
   var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
   var d = R * c; // Distance in km
   return d * 1000;
 },

  deg2rad : function(deg) {
    return deg * (Math.PI/180)
  },
  
}