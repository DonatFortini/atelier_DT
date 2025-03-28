#include "LoRaManager.h"

LoRaManager::LoRaManager(byte rxPin, byte txPin)
{
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

void LoRaManager::begin()
{
    loraSerial->begin(9600);
    loraSerial->println("ATZ");
}

void LoRaManager::handleLoRaMessages()
{
    loraSerial->listen();

    unsigned long currentTime = millis();
    if ((currentTime - previousTTN >= uplinkInterval) && (networkJoinedStatus == true))
    {
        previousTTN = currentTime;
        getDataStatus = false;

        Serial.println(F("\n===== LORA STATUS ====="));
        Serial.println(F("LoRa network is joined and ready to send data"));
    }

    if (receiveCallback == true)
    {
        receiveCallback = false;
        getDataStatus = true;
        delay(1000);

        loraSerial->println("AT+CFG");
    }

    processLoRaData();
}

void LoRaManager::processLoRaData()
{
    while (loraSerial->available())
    {
        char inChar = (char)loraSerial->read();
        inputString += inChar;

        rxbuff[rxbuff_index++] = inChar;

        if (rxbuff_index > 128)
            break;

        if (inChar == '\n' || inChar == '\r')
        {
            stringComplete = true;
            rxbuff[rxbuff_index] = '\0';

            if (strncmp(rxbuff, "JOINED", 6) == 0)
            {
                networkJoinedStatus = true;
                Serial.println("Network joined!");
            }

            if (strncmp(rxbuff, "Dragino LA66 Device", 19) == 0)
            {
                networkJoinedStatus = false;
                Serial.println("Network connection reset");
            }

            if (strncmp(rxbuff, "Run AT+RECVB=? to see detail", 28) == 0)
            {
                receiveCallback = true;
                stringComplete = false;
                inputString = "\0";
            }

            if (strncmp(rxbuff, "AT+RECVB=", 9) == 0)
            {
                stringComplete = false;
                inputString = "\0";
                Serial.print("\r\nGet downlink data(FPort & Payload) ");
                Serial.println(&rxbuff[9]);
            }

            rxbuff_index = 0;

            if (getDataStatus == true)
            {
                stringComplete = false;
                inputString = "\0";
            }
        }
    }

    if (stringComplete)
    {
        Serial.print(inputString);

        inputString = "\0";
        stringComplete = false;
    }
}

void LoRaManager::sendWeatherData(float temperature, float pressure, float humidity, float altitude, uint8_t alertState)
{
    if (!networkJoinedStatus)
    {
        Serial.println("Network not joined, cannot send data");
        return;
    }

    Serial.println(F("\n===== SENDING WEATHER DATA ====="));
    Serial.println("Temp: " + String(temperature) + "°C");
    Serial.println("Pressure: " + String(pressure) + "hPa");
    Serial.println("Humidity: " + String(humidity) + "%");
    Serial.println("Altitude: " + String(altitude) + "m");
    Serial.println("Alert State: " + String(alertState));

    uint8_t payload[17];

    union
    {
        float f;
        uint8_t bytes[4];
    } converter;

    converter.f = temperature;
    payload[0] = converter.bytes[0];
    payload[1] = converter.bytes[1];
    payload[2] = converter.bytes[2];
    payload[3] = converter.bytes[3];

    converter.f = pressure;
    payload[4] = converter.bytes[0];
    payload[5] = converter.bytes[1];
    payload[6] = converter.bytes[2];
    payload[7] = converter.bytes[3];

    converter.f = humidity;
    payload[8] = converter.bytes[0];
    payload[9] = converter.bytes[1];
    payload[10] = converter.bytes[2];
    payload[11] = converter.bytes[3];

    converter.f = altitude;
    payload[12] = converter.bytes[0];
    payload[13] = converter.bytes[1];
    payload[14] = converter.bytes[2];
    payload[15] = converter.bytes[3];

    payload[16] = alertState;

    Serial.print(F("Raw payload: "));
    for (int i = 0; i < 17; i++)
    {
        Serial.print(payload[i], HEX);
        Serial.print(" ");
    }
    Serial.println();

    char hexPayload[35] = {0};
    for (int i = 0; i < 17; i++)
    {
        sprintf(&hexPayload[i * 2], "%02X", payload[i]);
    }

    char sensor_data_buff[128] = {0};
    sprintf(sensor_data_buff, "AT+SENDB=%d,%d,%d,%s", 1, 2, 17, hexPayload);

    Serial.println("Sending command: " + String(sensor_data_buff));
    loraSerial->println(sensor_data_buff);
}

bool LoRaManager::isNetworkJoined()
{
    return networkJoinedStatus;
}

void LoRaManager::processSerialCommands()
{
    while (Serial.available())
    {
        char inChar = (char)Serial.read();
        inputString += inChar;
        if (inChar == '\n' || inChar == '\r')
        {
            loraSerial->print(inputString);
            inputString = "\0";
        }
    }
}