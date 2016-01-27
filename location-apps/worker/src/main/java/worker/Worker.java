package worker;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.exceptions.JedisConnectionException;
import java.sql.*;
import org.json.JSONObject;

class Worker {
  public static void main(String[] args) {
    try {
      Jedis redis = connectToRedis("location_redis_1");
      Connection dbConn = connectToDB("location_db_1");

      System.err.println("Watching location queue");

      while (true) {
        List<String> locationJSON = jedis.lrange(0,0,4);
        JSONObject locationData = new JSONObject(locationJSON);
        String deviceID = locationData[0];
        String timeStamp = locationData[1];
        String location = ("POINT(%s %s)",location[2],location[3]);
        System.err.printf("Processing location for '%s' by '%s'\n", location, deviceID);
        updatelocation(dbConn, deviceID, location);
      }
    } catch (SQLException e) {
      e.printStackTrace();
      System.exit(1);
    }
  }

  static void updatelocation(Connection dbConn, String deviceID, String timeStamp, String location) throws SQLException {
    PreparedStatement insert = dbConn.prepareStatement(
      "INSERT INTO locations (id, timestamp,location) VALUES (?, ?, ?)");
    insert.setString(1, deviceID);
    insert.setString(2, timeStamp);
    insert.setString(3, location);

    try {
      insert.executeUpdate();
    } catch (SQLException e) {
      System.err.println(e);
    }
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
          conn = DriverManager.getConnection(url, "postgres", "");
        } catch (SQLException e) {
          System.err.println("Failed to connect to db - retrying");
          sleep(1000);
        }
      }

      PreparedStatement st = conn.prepareStatement(
        "CREATE TABLE IF NOT EXISTS locations (id VARCHAR(255) NOT NULL, timestamp timestamp DEFAULT current_timestamp, location geography(POINT,4326), latitude VARCHAR(25) NOT NULL)");
      st.executeUpdate();

    } catch (ClassNotFoundException e) {
      e.printStackTrace();
      System.exit(1);
    }

    return conn;
  }

  static void sleep(long duration) {
    try {
      Thread.sleep(duration);
    } catch (InterruptedException e) {
      System.exit(1);
    }
  }
}
