package worker;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.exceptions.JedisConnectionException;
import java.sql.*;
import org.json.JSONObject;
import java.util.List;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Set;
import java.util.Iterator;
import java.lang.Long;

class Worker {
  public static void main(String[] args) {
    try {
      Jedis redis = connectToRedis("locationapps_redis_1");
      Connection dbConn = connectToDB("locationapps_db_1");

      System.err.println("Watching location queue");

      while (true) {
          System.err.println("trying again");

          String key = "timestamps";

          String locationJSON = redis.blpop(0,"timestamps").get(1);
          System.err.println(locationJSON.toString());
          JSONObject locationData = new JSONObject(locationJSON);
          System.err.println(locationData);

          try {
              if(locationData != null & locationData.getString("id") != null){

                String deviceID = locationData.getString("id");
                long timeStamp = Long.parseLong(locationData.getString("timeStamp"));
                String longitude = locationData.getString("longitude");
                String latitude = locationData.getString("latitude");
                System.err.printf("Processing location for '%s','%s' by '%s'\n", longitude,latitude, deviceID);
                if(updatelocation(dbConn, deviceID, timeStamp, longitude, latitude)==true) {
                  System.err.printf("updating location");
                  System.out.println("Publishing updates/db.location");
                  redis.publish("updates", "db.location");
                }
            }
          } catch (org.json.JSONException j) {
            System.err.println(j);
            //System.exit(1);
          }
        }
      } catch (SQLException e) {
        e.printStackTrace();
        //System.exit(1);
    }
  }

  static Boolean updatelocation(Connection dbConn, String deviceID, long timeStamp, String longitude, String latitude) throws SQLException {
    Boolean inserted=false;
    PreparedStatement insert = dbConn.prepareStatement(
      "INSERT INTO locations (id,longitude, latitude, timestamp) VALUES (?, ?, ?, ?)");
    Timestamp ts = new Timestamp(timeStamp);
    System.err.println(ts.toString());
    insert.setString(1, deviceID);
    insert.setString(2, longitude);
    insert.setString(3, latitude);
    insert.setTimestamp(4, ts);

    try {
      insert.executeUpdate();
      inserted = true;
    } catch (SQLException e) {
      System.err.println(e);
    }
    return inserted;
  }

  static Jedis connectToRedis(String host) {
    Jedis conn = new Jedis(host);

    while (true) {
      try {
        conn.keys("*");
        break;
      } catch (JedisConnectionException e) {
        System.err.println("Failed to connect to redis - retrying");
        sleep(1000);
      }
    }

    System.err.println("Connected to redis");
    return conn;
  }

  static Connection connectToDB(String host) throws SQLException {
    Connection conn = null;

    try {

      Class.forName("org.postgresql.Driver");
      String url = "jdbc:postgresql://" + host + "/postgres";

      while (conn == null) {
        try {
          conn = DriverManager.getConnection(url, "docker", "docker");
        } catch (SQLException e) {
          System.err.println("Failed to connect to db - retrying");
          sleep(1000);
        }
      }

      PreparedStatement st = conn.prepareStatement(
        "CREATE TABLE IF NOT EXISTS locations (id VARCHAR(255) NOT NULL, timestamp timestamp with time zone DEFAULT current_timestamp, longitude VARCHAR(25), latitude VARCHAR(25) NOT NULL)");
      st.executeUpdate();

    } catch (ClassNotFoundException e) {
      e.printStackTrace();
      //System.exit(1);
    }

    return conn;
  }

  static void sleep(long duration) {
    try {
      Thread.sleep(duration);
    } catch (InterruptedException e) {
      //System.exit(1);
    }
  }
}
