#ifndef PARKING_SENSOR_H
#define PARKING_SENSOR_H

#include <Arduino.h>
#include <ChainableLED.h>
#include <HCSR04.h>

#define PARKING_FREE 0
#define PARKING_OCCUPIED 1

#define DISTANCE_CHANGE_THRESHOLD 0.6

class ParkingSensor {
private:
  ChainableLED *leds;
  uint8_t parkingState;

  byte triggerPin;
  byte echoPin;
  UltraSonicDistanceSensor *distanceSensor;

  float baselineDistance;
  float currentDistance;
  bool baselineCalibrated;

  bool vehicleDetected;
  unsigned long vehicleDetectionTime;
  unsigned long occupancyStartTime;
  unsigned long occupancyTime;

  float distanceHistory[3];
  int currentDistanceIndex;
  float lastDistance;
  unsigned long lastCalculationTime;
  int measurementCount;

  void calibrateBaseline();

public:
  ParkingSensor(int triggerPin, int echoPin, int dataPin, int clockPin);
  void begin();
  void update();
  float getCurrentDistance() { return currentDistance; }
  float getBaselineDistance() { return baselineDistance; }
  uint8_t getParkingState() { return parkingState; }
  unsigned long getOccupancyTime();
};

#endif // PARKING_SENSOR_H