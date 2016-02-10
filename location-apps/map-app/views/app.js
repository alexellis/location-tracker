var socket = io.connect({transports:['polling']});
var js1 = document.getElementById('map');

  var updateLocation = function(){

    socket.on('locations', function (jstr) {
      if(line) {
        map.removeLayer(line);
      }
      var json = JSON.parse(jstr);
      sorting(json,'timestamp');
      var geojson = rowsToGeoJSON(json);
      line = L.geoJson(geojson, { style: L.mapbox.simplestyle.style }).addTo(map);
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
