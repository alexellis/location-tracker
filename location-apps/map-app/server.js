var express = require('express'),
    async = require('async'),
    pg = require("pg"),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    redis = require('redis');

io.set('transports', ['polling']);

var port = process.env.PORT || 4000;

io.sockets.on('connection', function (socket) {
  // Initial connect, push the locations.
  console.log("connection, sending intial locations.")
  getLocations(postgresClient, function(err, locations) {
      if(err) {
        return console.error(err);
      }
      io.sockets.emit("locations", locations);
      socket.emit('message', { text : 'Welcome!' });
      socket.on('subscribe', function (data) {
        socket.join(data.channel);
      });
  });
});

app.use(cookieParser());
app.use(bodyParser());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});

app.use(express.static(__dirname + '/views'));

app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname + '/views/index.html'));
});

function getLocations(client, done) {
  console.log("getLocations");
  client.query('SELECT * FROM locations ORDER BY id, timestamp', [], function(err, result) {
    if (err) {
      console.error("Error performing query: " + err);
      return done(err);
    } else {
      var rows = result.rows;
      var data = JSON.stringify(result.rows);
      done(null, data);
    }
  });
}

var postgresClient;

pg.connect('postgres://docker:docker@db/postgres', function(err, dbClient, done) {
  postgresClient = dbClient;
  console.log("DB Connected, starting server.");

  var redisClient = redis.createClient({host: "redis", port: 6379});
  redisClient.on('connect', function() {
    console.log("Redis connected and listening");

    redisClient.subscribe('updates');
    redisClient.on("message", function(channel, message) {
      if(channel=="updates") {
        console.log("Message came in on update channel.");
        // Always notify clients when updates come from Worker.
        getLocations(postgresClient, function(err, locations) {
          if(err) {
            return console.error(err);
          }
          io.sockets.emit("locations", locations);
        });
      }
    });
  });

  server.listen(port, function () {
    var port = server.address().port;
    console.log('App running on port ' + port);
  });

});
