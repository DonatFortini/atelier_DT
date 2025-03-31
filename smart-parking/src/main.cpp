#include <Arduino.h>
#include <LoRaManager.h>
#include <ParkingSensor.h>

#define TRIGGER_PIN 5
#define ECHO_PIN 6
#define LED_DATA_PIN 7
#define LED_CLOCK_PIN 8
#define LORA_RX_PIN 10
#define LORA_TX_PIN 11

#define PARKING_CONFIRMATION_TIME 5000

ParkingSensor parkingSensor(TRIGGER_PIN, ECHO_PIN, LED_DATA_PIN, LED_CLOCK_PIN);
LoRaManager loraManager(LORA_RX_PIN, LORA_TX_PIN);

uint8_t previousParkingState = 255;
unsigned long lastLoraUpdate = 0;
const unsigned long LORA_UPDATE_INTERVAL = 10000;

void setup() {
  Serial.begin(9600);
  Serial.println(F("Smart Parking System Starting..."));

  parkingSensor.begin();
  loraManager.begin();

  Serial.println(F("Setup complete. Smart parking system initialized."));
}

void loop() {
  parkingSensor.update();
  loraManager.handleLoRaMessages();
  loraManager.processSerialCommands();

  uint8_t currentParkingState = parkingSensor.getParkingState();
  if (currentParkingState != previousParkingState &&
      loraManager.isNetworkJoined()) {
    Serial.println(F("Parking state changed - sending update"));
    loraManager.sendSensorData(parkingSensor.getOccupancyTime(),
                               currentParkingState);
    previousParkingState = currentParkingState;
    lastLoraUpdate = millis();
  }

  unsigned long currentTime = millis();
  if (currentTime - lastLoraUpdate >= LORA_UPDATE_INTERVAL &&
      loraManager.isNetworkJoined()) {
    Serial.println(F("Sending regular parking status update"));
    loraManager.sendSensorData(parkingSensor.getOccupancyTime(),
                               currentParkingState);
    lastLoraUpdate = currentTime;
  }
}
