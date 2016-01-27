var http = require('http'),
    express = require('express'),
    path = require('path');
var rOptions = {
  "host":"192.168.99.100",
  "port":32782
}
var redis = require("redis");

var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json({strict:"false"}));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views')); //A

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.send('<html><body><h1>Hello World</h1></body></html>');
});
app.post('/location',function(req,res){
  if(req.body.latitude && req.body.longitude && req.body.id && req.body.timestamp){
    var client = redis.createClient(rOptions);
    client.on("error", function (err) {
      console.log("Error " + err);
    });

    res.status(200).send();
    client.rpush(0, req.body.id, redis.print);
    client.rpush(0, req.body.timestamp, redis.print);
    client.rpush(0, req.body.longitude, redis.print);
    client.rpush(0, req.body.latitude, redis.print);
    client.lrange(0, 0,10000, redis.print);
    client.quit();
    //console.log("starts here\n" + req.body.id + ' ' + req.body.latitude + ',' +req.body.longitude);
  } else {
    console.log(req.body.id);
    res.status(500).send({ error: 'Something Failed!'});
  }
});
app.get('/location',function(req,res){
  res.sendStatus(200);
  console.log("starts here\n" + req.body);
});
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
