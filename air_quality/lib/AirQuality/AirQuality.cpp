#include "AirQuality.h"

AirQuality::AirQuality(byte aqiPin)
{
    aqiSensor = new AirQualitySensor(aqiPin);
    pm1_0 = 0;
    pm2_5 = 0;
    pm10 = 0;
    aqiValue = 0;
    aqiQuality = 0;
    alertState = ALERT_NONE;
}

bool AirQuality::begin()
{
    bool particleStatus = initParticleSensor();
    bool aqiStatus = initAqiSensor(A0);

    delay(2000);

    return particleStatus && aqiStatus;
}

bool AirQuality::initParticleSensor()
{
    bool status = particleSensor.init() == 0;
    if (status)
    {
        Serial.println(F("HM330X initialized successfully"));
    }
    else
    {
        Serial.println(F("HM330X init failed!"));
    }
    return status;
}

bool AirQuality::initAqiSensor(byte pin)
{
    bool status = aqiSensor->init();
    if (status)
    {
        Serial.println(F("Air Quality Sensor initialized successfully"));
    }
    else
    {
        Serial.println(F("Air Quality Sensor init failed!"));
    }
    return status;
}

bool AirQuality::readSensors()
{
    bool success = true;

    if (particleSensor.read_sensor_value(particleBuffer, 29))
    {
        Serial.println(F("HM330X read failed!"));
        success = false;
    }
    else
    {
        pm1_0 = (uint16_t)particleBuffer[4 * 2] << 8 | particleBuffer[4 * 2 + 1];
        pm2_5 = (uint16_t)particleBuffer[5 * 2] << 8 | particleBuffer[5 * 2 + 1];
        pm10 = (uint16_t)particleBuffer[6 * 2] << 8 | particleBuffer[6 * 2 + 1];
    }

    aqiValue = aqiSensor->getValue();
    aqiQuality = aqiSensor->slope();

    checkThresholds();

    return success;
}

void AirQuality::checkThresholds()
{
    alertState = ALERT_NONE;

    if (pm2_5 > PM25_THRESHOLD)
        alertState |= ALERT_PM25;

    if (pm10 > PM10_THRESHOLD)
        alertState |= ALERT_PM10;

    if (aqiQuality == AirQualitySensor::HIGH_POLLUTION ||
        aqiQuality == AirQualitySensor::FORCE_SIGNAL)
        alertState |= ALERT_AQI;
}
