#include <Arduino.h>
#include <LoRaManager.h>
#include <TrafficLight.h>

#define TRIGGER_PIN 5
#define ECHO_PIN 6
#define LED_DATA_PIN 7
#define LED_CLOCK_PIN 8
#define LORA_RX_PIN 10
#define LORA_TX_PIN 11

#define SPEED_THRESHOLD 10

TrafficLight trafficLight(TRIGGER_PIN, ECHO_PIN, LED_DATA_PIN, LED_CLOCK_PIN, SPEED_THRESHOLD);
LoRaManager loraManager(LORA_RX_PIN, LORA_TX_PIN);

uint8_t previousLedState = 255;

void setup()
{
  Serial.begin(9600);
  Serial.println(F("Traffic Light Simulator Starting..."));

  trafficLight.begin();
  loraManager.begin();

  Serial.println(F("Setup complete. Traffic light system initialized."));
}

void loop()
{
  trafficLight.update();
  loraManager.handleLoRaMessages();
  loraManager.processSerialCommands();
  uint8_t currentLedState = trafficLight.getLedState();
  if (currentLedState != previousLedState && loraManager.isNetworkJoined())
  {
    Serial.println(F("LED state changed - sending update"));
    loraManager.sendSensorData(
        trafficLight.getSpeed(),
        currentLedState);
    previousLedState = currentLedState;
  }
}