var monitorTab = {
  
  init : function() {
    mapRenderer.init();
  },
  
  updateView : function() {
    //console.log('endTime:  ' + gpsPath.getEndTimeSec());
    
   document.getElementById('map-div').style.visibility = "visible";
   
    var currentPos = controller.getLocationAtTime(gpsPath.getEndTimeSec());
    utils.assert(currentPos);
    console.log('last: ' + currentPos.lat + ', ' + currentPos.lon);
    mapRenderer.addMarker(currentPos.lat, currentPos.lon);
  },
}