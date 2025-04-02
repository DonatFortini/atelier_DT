#include <Arduino.h>

#include <LoRaManager.h>
#include <WeatherStation.h>

#define LORA_RX_PIN 10
#define LORA_TX_PIN 11

unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 10000;

LoRaManager loraManager(LORA_RX_PIN, LORA_TX_PIN);
WeatherStation weatherStation(8);

void setup() {
  Serial.begin(9600);
  weatherStation.init();
  Serial.println(F("Weather station starting"));
  loraManager.begin();
  Serial.println(F("Setup completed"));
}

void loop() {

  loraManager.handleLoRaMessages();
  loraManager.processSerialCommands();

  weatherStation.readSensors();
  weatherStation.printData();

  unsigned long currentTime = millis();
  if ((currentTime - lastSendTime >= SEND_INTERVAL) &&
      loraManager.isNetworkJoined()) {
    lastSendTime = currentTime;
    loraManager.sendWeatherData(
        weatherStation.getTemperature(), weatherStation.getPressure(),
        weatherStation.getHumidity(), weatherStation.getAltitude(),
        weatherStation.getAlertState());
  }

  delay(2000);
}