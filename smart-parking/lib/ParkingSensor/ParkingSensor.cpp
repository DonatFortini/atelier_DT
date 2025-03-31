#include "ParkingSensor.h"

ParkingSensor::ParkingSensor(int trigger, int echo, int dataPin, int clockPin) {
  leds = new ChainableLED(dataPin, clockPin, 1);
  parkingState = PARKING_FREE;

  triggerPin = trigger;
  echoPin = echo;

  currentDistance = 0;
  baselineDistance = 0;
  baselineCalibrated = false;
  distanceSensor = new UltraSonicDistanceSensor(triggerPin, echoPin);

  distanceHistory[0] = 0;
  distanceHistory[1] = 0;
  distanceHistory[2] = 0;
  currentDistanceIndex = 0;
  lastCalculationTime = 0;
  measurementCount = 0;

  vehicleDetected = false;
  vehicleDetectionTime = 0;
  occupancyStartTime = 0;
  occupancyTime = 0;
}

void ParkingSensor::begin() {
  leds->setColorRGB(0, 0, 255, 0);
  parkingState = PARKING_FREE;

  pinMode(triggerPin, OUTPUT);
  pinMode(echoPin, INPUT);

  Serial.println(F("Parking sensor initialized. Calibrating baseline..."));

  calibrateBaseline();
}

void ParkingSensor::calibrateBaseline() {
  float readings[15];
  int validReadings = 0;

  Serial.println(F("Measuring baseline distance..."));

  for (int i = 0; i < 15; i++) {
    float distance = distanceSensor->measureDistanceCm();

    if (distance > 0.5 && distance < 200) {
      readings[validReadings] = distance;
      validReadings++;
      Serial.print(F("Calibration reading #"));
      Serial.print(i + 1);
      Serial.print(F(": "));
      Serial.print(distance);
      Serial.println(F(" cm"));
    }
    delay(200);
  }

  if (validReadings >= 10) {
    for (int i = 0; i < validReadings - 1; i++) {
      for (int j = i + 1; j < validReadings; j++) {
        if (readings[i] > readings[j]) {
          float temp = readings[i];
          readings[i] = readings[j];
          readings[j] = temp;
        }
      }
    }

    int startIndex = validReadings * 0.2;
    int endIndex = validReadings * 0.8;
    float sum = 0;
    int count = 0;

    for (int i = startIndex; i < endIndex; i++) {
      sum += readings[i];
      count++;
    }

    baselineDistance = sum / count;
    baselineCalibrated = true;
    Serial.print(F("Baseline distance calibrated: "));
    Serial.print(baselineDistance);
    Serial.println(F(" cm"));
    Serial.println(F("Using middle 60% of readings with outliers removed"));
  } else {
    Serial.println(F("Calibration failed! Not enough valid readings. Will "
                     "retry in update loop."));
  }
}

void ParkingSensor::update() {
  unsigned long currentTime = millis();

  if (!baselineCalibrated) {
    calibrateBaseline();
    return;
  }

  float rawDistance = distanceSensor->measureDistanceCm();
  Serial.print(F("Raw distance: "));
  Serial.print(rawDistance);
  Serial.println(F(" cm"));

  if (rawDistance > 0 && rawDistance < 200) {
    distanceHistory[currentDistanceIndex] = rawDistance;
    currentDistanceIndex = (currentDistanceIndex + 1) % 3;

    measurementCount++;
    if (measurementCount >= 3 && (currentTime - lastCalculationTime) > 200) {
      float avgDistance =
          (distanceHistory[0] + distanceHistory[1] + distanceHistory[2]) / 3.0;
      currentDistance = avgDistance;

      bool consistentReadings = true;
      for (int i = 0; i < 3; i++) {
        if (abs(distanceHistory[i] - avgDistance) > 0.5) {
          consistentReadings = false;
          break;
        }
        if (distanceHistory[i] <= 0.1) {
          consistentReadings = false;
          break;
        }
      }

      Serial.print(F("Avg distance: "));
      Serial.print(avgDistance);
      Serial.print(F(" cm, Baseline: "));
      Serial.print(baselineDistance);
      Serial.print(F(" cm, Difference: "));
      Serial.print(abs(avgDistance - baselineDistance));
      Serial.print(F(" cm, Consistent: "));
      Serial.println(consistentReadings ? F("Yes") : F("No"));

      if (consistentReadings &&
          (abs(avgDistance - baselineDistance) > DISTANCE_CHANGE_THRESHOLD)) {
        if (!vehicleDetected) {
          vehicleDetected = true;
          vehicleDetectionTime = currentTime;

          leds->setColorRGB(0, 255, 0, 0);
          Serial.println(F("Vehicle detected!"));
        } else {
          if (parkingState == PARKING_FREE &&
              (currentTime - vehicleDetectionTime >= 5000)) {
            parkingState = PARKING_OCCUPIED;
            occupancyStartTime = vehicleDetectionTime;
            Serial.println(F("Parking confirmed after 5 seconds. "));
            leds->setColorRGB(0, 255, 0, 0);
          }
        }
      } else {
        if (vehicleDetected) {
          vehicleDetected = false;

          if (parkingState == PARKING_OCCUPIED) {
            parkingState = PARKING_FREE;
            occupancyTime = 0;

            Serial.println(F("Vehicle left. Parking spot is now FREE"));
            leds->setColorRGB(0, 0, 255, 0);
          } else {
            leds->setColorRGB(0, 0, 255, 0);
            Serial.println(F("False detection. Switching back to GREEN"));
          }
        }
      }

      lastCalculationTime = currentTime;
    }
  }

  delay(100);
}

unsigned long ParkingSensor::getOccupancyTime() {
  if (parkingState == PARKING_OCCUPIED) {
    return (millis() - occupancyStartTime) / 1000;
  }
  return 0;
}
