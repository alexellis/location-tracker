var socket = io.connect({transports:['polling']});
var js1 = document.getElementById('map');

  var updateLocation = function(){

    socket.on('locations', function (jstr) {
      if(lines.length > 0) {
        for(var i=0;i<lines.length;i++) {
          map.removeLayer(lines[i]);
        }
      }
      var json = JSON.parse(jstr);
      sorting(json,'timestamp');
      var tracks = separateTracks(json);
      createTracks(tracks);

    });
  };

  var init = function(){
    document.body.style.opacity=1;
    updateLocation();
  };
  socket.on('message',function(data){
    init();
  });

  function sorting(json_object, key_to_sort_by) {
      function sortByKey(a, b) {
          var x = a[key_to_sort_by];
          var y = b[key_to_sort_by];
          return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      }

      json_object.sort(sortByKey);
  }
function separateTracks(json) {
  var keys = uniqueIds(json);
  var tracks = [];
  for(var i=0; i<keys.length; i++) {
    var track = [];
    //var counter = 0;
    for(var j=0; j<json.length; j++){
      if (json[j].id == keys[i]){
        track.push(json[j]);
        //counter++;
    }

    }
    tracks.push(track);
  }
  return tracks;
}
function uniqueIds(json) {
  var keys = [];
  for(var key in json){
    if(keys.indexOf(json[key].id) < 0) {
      keys.push(json[key].id);
    }
  }
  return keys;
}
function createTracks(tracksArray){
  for(var i=0;i<tracksArray.length;i++) {
    var geojson = rowsToGeoJSON(tracksArray[i]);
    lines[i] = L.geoJson(geojson, { style: L.mapbox.simplestyle.style }).addTo(map);
  }
}
function rowsToGeoJSON(rows) {
  var coordinates = [];
  for(var row in rows) {
    var coord = [rows[row].longitude,rows[row].latitude];
    coordinates.push(coord);
  }
  var geojson = [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": coordinates
      },
      "properties": {
        "stroke": "#fc4353",
        "stroke-width": 5
      }
    }
  ];
  return geojson;

}
