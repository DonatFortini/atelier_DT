#include "LoRaManager.h"

LoRaManager::LoRaManager(int rxPin, int txPin) {
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
    Serial.println("\n===== PARKING SENSOR STATUS");
    Serial.println("LoRa network is joined and ready to send data");
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

void LoRaManager::sendSensorData(unsigned long occupancyTime,
                                 uint8_t parkingState) {
  if (!networkJoinedStatus) {
    Serial.println("Network not joined, cannot send data");
    return;
  }

  Serial.println("\n===== PARKING SENSOR PARAMETERS");

  Serial.println("Occupancy Time: " + String(occupancyTime) + " seconds");
  Serial.println("Parking State: " +
                 String(parkingState == 0 ? "FREE" : "OCCUPIED"));

  char sensor_data_buff[128] = "\0";

  Serial.println("===== SEND DATA TO TTN");

  // Convert occupancy time to 2 bytes (uint16_t)
  uint16_t occupancyTimeInt = (uint16_t)(occupancyTime & 0xFFFF);

  snprintf(sensor_data_buff, sizeof(sensor_data_buff),
           "AT+SENDB=%d,%d,%d,%02X%02X%02X", 1, 2, 3,
           (occupancyTimeInt >> 8) & 0xFF, occupancyTimeInt & 0xFF,
           parkingState & 0xFF);

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