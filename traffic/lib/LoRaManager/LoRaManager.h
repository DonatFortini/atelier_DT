#ifndef LORA_MANAGER_H
#define LORA_MANAGER_H

#include <Arduino.h>
#include <SoftwareSerial.h>

class LoRaManager
{
private:
    SoftwareSerial *loraSerial;
    long previousTTN;
    long uplinkInterval;
    bool receiveCallback;
    bool getDataStatus;
    bool networkJoinedStatus;

    String inputString;
    bool stringComplete;

    char rxbuff[128];
    uint8_t rxbuff_index;

    void processLoRaData();

public:
    LoRaManager(int rxPin, int txPin);
    void begin();
    void handleLoRaMessages();
    void sendSensorData(float speed, uint8_t ledState);
    bool isNetworkJoined();
    void processSerialCommands();
};

#endif // LORA_MANAGER_H