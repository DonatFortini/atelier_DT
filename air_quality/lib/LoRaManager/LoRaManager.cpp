#include "LoRaManager.h"

LoRaManager::LoRaManager(byte rxPin, byte txPin) {
  loraSerial = new SoftwareSerial(rxPin, txPin);
  previousTTN = millis();
  uplinkInterval = 10000;
  receiveCallback = false;
  getDataStatus = false;
  networkJoinedStatus = false;

  inputString.reserve(200);
  stringComplete = false;
  rxbuff_index = 0;
}

void LoRaManager::begin() {
  loraSerial->begin(9600);
  loraSerial->println("ATZ");
}

void LoRaManager::handleLoRaMessages() {
  loraSerial->listen();

  unsigned long currentTime = millis();
  if ((currentTime - previousTTN >= uplinkInterval) &&
      (networkJoinedStatus == true)) {
    previousTTN = currentTime;
    getDataStatus = false;

    Serial.println(F("\n===== LORA STATUS ====="));
    Serial.println(F("LoRa network is joined and ready to send data"));
  }

  if (receiveCallback == true) {
    receiveCallback = false;
    getDataStatus = true;
    delay(1000);

    loraSerial->println("AT+CFG");
  }

  processLoRaData();
}

void LoRaManager::processLoRaData() {
  while (loraSerial->available()) {
    char inChar = (char)loraSerial->read();
    inputString += inChar;

    rxbuff[rxbuff_index++] = inChar;

    if (rxbuff_index > 128)
      break;

    if (inChar == '\n' || inChar == '\r') {
      stringComplete = true;
      rxbuff[rxbuff_index] = '\0';

      if (strncmp(rxbuff, "JOINED", 6) == 0) {
        networkJoinedStatus = true;
        Serial.println("Network joined!");
      }

      if (strncmp(rxbuff, "Dragino LA66 Device", 19) == 0) {
        networkJoinedStatus = false;
        Serial.println("Network connection reset");
      }

      if (strncmp(rxbuff, "Run AT+RECVB=? to see detail", 28) == 0) {
        receiveCallback = true;
        stringComplete = false;
        inputString = "\0";
      }

      if (strncmp(rxbuff, "AT+RECVB=", 9) == 0) {
        stringComplete = false;
        inputString = "\0";
        Serial.print("\r\nGet downlink data(FPort & Payload) ");
        Serial.println(&rxbuff[9]);
      }

      rxbuff_index = 0;

      if (getDataStatus == true) {
        stringComplete = false;
        inputString = "\0";
      }
    }
  }

  if (stringComplete) {
    Serial.print(inputString);

    inputString = "\0";
    stringComplete = false;
  }
}

void LoRaManager::sendAirQualityData(uint16_t pm25, uint16_t pm10, int aqiValue,
                                     uint8_t alertState) {
  if (!networkJoinedStatus) {
    Serial.println("Network not joined, cannot send data");
    return;
  }

  Serial.println(F("\n===== SENDING AIR QUALITY DATA ====="));
  Serial.println("PM2.5: " + String(pm25) + " μg/m³");
  Serial.println("PM10: " + String(pm10) + " μg/m³");
  Serial.println("AQI Value: " + String(aqiValue));
  Serial.println("Alert State: " + String(alertState));

  uint8_t payload[7];
  payload[0] = (pm25 >> 8) & 0xFF;
  payload[1] = pm25 & 0xFF;
  payload[2] = (pm10 >> 8) & 0xFF;
  payload[3] = pm10 & 0xFF;
  payload[4] = (aqiValue >> 8) & 0xFF;
  payload[5] = aqiValue & 0xFF;
  payload[6] = alertState & 0xFF;

  Serial.print(F("Raw payload: "));
  for (int i = 0; i < 7; i++) {
    Serial.print(payload[i], HEX);
    Serial.print(" ");
  }
  Serial.println();

  char hexPayload[15] = {0};
  for (int i = 0; i < 7; i++) {
    sprintf(&hexPayload[i * 2], "%02X", payload[i]);
  }

  char sensor_data_buff[128] = {0};
  sprintf(sensor_data_buff, "AT+SENDB=%d,%d,%d,%s", 1, 2, 7, hexPayload);

  Serial.println("Sending command: " + String(sensor_data_buff));
  loraSerial->println(sensor_data_buff);
}

bool LoRaManager::isNetworkJoined() { return networkJoinedStatus; }

void LoRaManager::processSerialCommands() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    inputString += inChar;
    if (inChar == '\n' || inChar == '\r') {
      loraSerial->print(inputString);
      inputString = "\0";
    }
  }
}
