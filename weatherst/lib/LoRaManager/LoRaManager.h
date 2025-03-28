#ifndef LORA_MANAGER_H
#define LORA_MANAGER_H

#include <Arduino.h>
#include <SoftwareSerial.h>

class LoRaManager
{
private:
    SoftwareSerial *loraSerial;
    long previousTTN;
    unsigned long uplinkInterval;
    bool receiveCallback;
    bool getDataStatus;
    bool networkJoinedStatus;

    String inputString;
    bool stringComplete;

    char rxbuff[128];
    uint8_t rxbuff_index;

    void processLoRaData();

public:
    LoRaManager(byte rxPin, byte txPin);
    void begin();
    void handleLoRaMessages();
    void sendWeatherData(float temperature, float pressure, float humidity, float altitude, uint8_t alertState);
    bool isNetworkJoined();
    void processSerialCommands();
};

#endif // LORA_MANAGER_H