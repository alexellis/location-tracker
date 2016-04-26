var express = require('express'),
    async = require('async'),
    pg = require("pg"),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server);

io.set('transports', ['polling']);

var port = process.env.PORT || 4000;

var redisClient = redis.createClient({host: "redis", port: 6379});
redisClient.on('connection', function() {
  console.log("Redis connected and listening");

  redisClient.subscribe('updates', function() {
    // Always notify clients when updates come from Worker.
    getLocations(postgresClient, function(err, locations) {
        io.sockets.emit("locations", locations);
    });
  });
});

io.sockets.on('connection', function (socket) {
  // Initial connect, push the locations.
  getLocations(postgresClient, function(err, locations) {
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
  server.listen(port, function () {
    var port = server.address().port;
    console.log('App running on port ' + port);
  });

});
