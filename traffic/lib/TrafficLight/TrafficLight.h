#ifndef TRAFFIC_LIGHT_H
#define TRAFFIC_LIGHT_H

#include <Arduino.h>
#include <ChainableLED.h>
#include <HCSR04.h>

#define LED_GREEN 0
#define LED_RED 1

class TrafficLight
{
private:
    ChainableLED *leds;
    uint8_t ledState;

    byte triggerPin;
    byte echoPin;
    UltraSonicDistanceSensor *distanceSensor;

    float speed;
    float speedThreshold;

    float distanceHistory[3];
    int currentDistanceIndex;
    float lastDistance;
    float lastSpeed;
    unsigned long lastCalculationTime;
    int measurementCount;

    bool movingTooFast;
    unsigned long cooldownTimer;

public:
    TrafficLight(int triggerPin, int echoPin, int dataPin, int clockPin, float threshold);
    void begin();
    void update();
    float getSpeed() { return speed; }
    float getDistance() { return lastDistance; }
    uint8_t getLedState() { return ledState; }
};

#endif // TRAFFIC_LIGHT_H