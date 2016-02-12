A location collection app with Docker, Redis, Node.js

This was originally inspired by the [Docker Voting Example App](https://github.com/docker/example-voting-app/ Docker Voting App Docker Voting Example App). I ended up borrowing a bunch of code from there. But I chose to remove the Flask front-end because, well, I like Node.js better.

This app takes locations in the form
```bash
curl -d '{"latitude": "48.84088179130599", "longitude": "2.3410749435424805","id":"manomarks"}' -H "Content-Type: application/json" http://192.168.99.100:5000/location
```
Assuming the ip address of the host is 192.168.99.100. The collection app parses out the location and id, and adds a timestamp. That gets pushed into the Redis. The Worker then comes along and pulls all the data from Redis and pushes it into a Postgres database. There's also a map app that parses the data in Postgres and pushes separate tracks onto a Mapbox map.

You'll need a [Mapbox access token](https://www.mapbox.com/help/define-access-token/ "Mapbox Access Token"). At some point I'll separate that out into a separate config file, but for now it's in the index.html file in the map app.

This is pretty alpha. Right now, it constantly pings the database and pushes data to the browser client. The client then destroys and rewrites the tracks. Ideally we would check whether the data has changed and only then push data back to the client.

To get it running, all you should have to do is
```bash
cd location-apps
docker-compose up
```
