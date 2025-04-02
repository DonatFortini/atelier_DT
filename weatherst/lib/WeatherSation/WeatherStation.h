#ifndef WEATHER_STATION_H
#define WEATHER_STATION_H

#include <Arduino.h>

#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>
#include <HP20x_dev.h>
#include <KalmanFilter.h>

#define TEMP_THRESHOLD 30
#define HUMI_THRESHOLD 70
#define PRES_THRESHOLD 1000

#define TEMP_ALERT 0x01
#define HUMI_ALERT 0x02
#define PRES_ALERT 0x03
#define MULTIPLE_ALERT 0x06

#define DHTTYPE DHT11

class WeatherStation {
private:
  // DHT11 temperature and humidity sensor
  DHT dht;

  // I2C BAROMETER sensor
  KalmanFilter t_filter; // temperature filter
  KalmanFilter p_filter; // pressure filter
  KalmanFilter a_filter; // altitude filter

  HP20x_dev hp20x;
  void dht_init();
  void hp20x_init();
  void dht_read();
  void hp20x_read();
  void checkThresholds();

  float temperature;
  float dht_temperature;
  float hp20x_temperature;
  float humidity;
  float pressure;
  float hp20x_pressure;
  float altitude;
  uint8_t alertState;

public:
  WeatherStation(byte dht_pin);
  void init();
  void readSensors();
  void adjustMesurements();

  float getTemperature() { return temperature; }
  float getHumidity() { return humidity; }
  float getPressure() { return pressure; }
  float getAltitude() { return altitude; }
  uint8_t getAlertState() { return alertState; }

  void printData();
};

#endif // WEATHER_STATION_H