#ifndef AIR_QUALITY_H
#define AIR_QUALITY_H

#include <Arduino.h>
#include "Seeed_HM330X.h"
#include "Air_Quality_Sensor.h"

#define PM25_THRESHOLD 25 // μg/m3 (WHO recommandation)
#define PM10_THRESHOLD 50 // μg/m3 (WHO recommandation)
#define AQI_HIGH_THRESHOLD AirQualitySensor::HIGH_POLLUTION

#define ALERT_NONE 0
#define ALERT_PM25 1
#define ALERT_PM10 2
#define ALERT_AQI 4

class AirQuality
{
private:
    HM330X particleSensor;
    AirQualitySensor *aqiSensor;

    uint8_t particleBuffer[30];

    uint16_t pm1_0;
    uint16_t pm2_5;
    uint16_t pm10;
    byte aqiValue;
    char aqiQuality;

    uint8_t alertState;

    bool initParticleSensor();
    bool initAqiSensor(byte pin);
    void checkThresholds();

public:
    AirQuality(byte aqiPin);
    bool begin();
    bool readSensors();

    uint16_t getPM1_0() { return pm1_0; }
    uint16_t getPM2_5() { return pm2_5; }
    uint16_t getPM10() { return pm10; }
    byte getAqiValue() { return aqiValue; }
    char getAqiQuality() { return aqiQuality; }
    uint8_t getAlertState() { return alertState; }
};

#endif // AIR_QUALITY_H