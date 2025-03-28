#include <Arduino.h>
#include "LoRaManager.h"
#include "AirQuality.h"

#define LORA_RX_PIN 10
#define LORA_TX_PIN 11
#define AQI_SENSOR_PIN A0

unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 10000;

LoRaManager loraManager(LORA_RX_PIN, LORA_TX_PIN);
AirQuality airQuality(AQI_SENSOR_PIN);

void setup()
{
  Serial.begin(9600);
  Serial.println(F("Starting Air Quality Monitoring System"));

  if (!airQuality.begin())
    Serial.println(F("Failed to initialize air quality sensors!"));

  loraManager.begin();
  Serial.println(F("Setup completed"));
}

void loop()
{
  if (airQuality.readSensors())
  {
    loraManager.handleLoRaMessages();
    loraManager.processSerialCommands();

    unsigned long currentTime = millis();
    if ((currentTime - lastSendTime >= SEND_INTERVAL) && loraManager.isNetworkJoined())
    {
      lastSendTime = currentTime;
      loraManager.sendAirQualityData(
          airQuality.getPM2_5(),
          airQuality.getPM10(),
          airQuality.getAqiValue(),
          airQuality.getAlertState());
    }
  }
  delay(100);
}