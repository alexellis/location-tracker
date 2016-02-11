var http = require('http'),
    express = require('express'),
    path = require('path');
var rOptions = {
  "host":"locationapps_redis_1"
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
  console.log(req);
  if(req.body.latitude && req.body.longitude && req.body.id){
    var client = redis.createClient(rOptions);
    client.on("error", function (err) {
      console.log("Error " + err);
      res.status(500).send({ error: 'Something Failed!'});
    });
    var date = new Date().getTime();

    res.status(200).send('');
    client.rpush("timestamps", '{"id":"' + req.body.id+'", "timeStamp":"' + date+ '", "longitude":"' + req.body.longitude + '", "latitude":"' + req.body.latitude + '"}',redis.print);
    client.lrange("0", 0,10000, redis.print);
    client.quit();
  } else {
    console.log(req.body.id);
    res.status(500).send({ error: 'Something Failed!'});
  }
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
