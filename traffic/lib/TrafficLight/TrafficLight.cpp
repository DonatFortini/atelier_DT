#include "TrafficLight.h"

TrafficLight::TrafficLight(int trigger, int echo, int dataPin, int clockPin, float threshold)
{
    leds = new ChainableLED(dataPin, clockPin, 1);
    speedThreshold = threshold;
    ledState = LED_GREEN;

    triggerPin = trigger;
    echoPin = echo;

    speed = 0;
    distanceSensor = new UltraSonicDistanceSensor(triggerPin, echoPin);

    distanceHistory[0] = 0;
    distanceHistory[1] = 0;
    distanceHistory[2] = 0;
    currentDistanceIndex = 0;
    lastCalculationTime = 0;
    movingTooFast = false;
    cooldownTimer = 0;
    measurementCount = 0;
}

void TrafficLight::begin()
{
    leds->setColorRGB(0, 0, 255, 0);
    ledState = LED_GREEN;

    pinMode(triggerPin, OUTPUT);
    pinMode(echoPin, INPUT);

    Serial.println(F("Traffic Light initialized in GREEN state"));
}

void TrafficLight::update()
{
    unsigned long currentTime = millis();
    float currentDistance = distanceSensor->measureDistanceCm();
    Serial.print(F("Raw distance: "));
    Serial.print(currentDistance);
    Serial.println(F(" cm"));

    if (currentDistance > 0 && currentDistance < 50)
    {
        distanceHistory[currentDistanceIndex] = currentDistance;
        currentDistanceIndex = (currentDistanceIndex + 1) % 3;

        measurementCount++;
        if (measurementCount >= 3 && (currentTime - lastCalculationTime) > 300)
        {
            float avgDistance = (distanceHistory[0] + distanceHistory[1] + distanceHistory[2]) / 3.0;

            if (lastDistance > 0)
            {
                float timeDelta = (currentTime - lastCalculationTime) / 1000.0;
                float distanceDelta = abs(lastDistance - avgDistance);
                speed = distanceDelta / timeDelta;
                speed = 0.7 * speed + 0.3 * lastSpeed;

                Serial.print(F("Avg distance: "));
                Serial.print(avgDistance);
                Serial.print(F(" cm, Speed: "));
                Serial.print(speed);
                Serial.println(F(" cm/s"));

                bool isApproaching = avgDistance < lastDistance;
                if (speed > speedThreshold && isApproaching && avgDistance < 40)
                {

                    if (ledState != LED_RED)
                    {
                        Serial.println(F("ALERT: Fast approaching object detected! Switching to RED"));
                        leds->setColorRGB(0, 255, 0, 0);
                        ledState = LED_RED;
                        Serial.println(F("LED STATE CHANGED: Now RED"));
                        movingTooFast = true;
                        cooldownTimer = 0;
                    }
                }
                else if (movingTooFast && speed < 5)
                {
                    if (cooldownTimer == 0)
                        cooldownTimer = currentTime;

                    if (currentTime - cooldownTimer > 2000)
                    {
                        Serial.println(F("Object has slowed down. Switching to GREEN"));
                        leds->setColorRGB(0, 0, 255, 0); // Green
                        ledState = LED_GREEN;
                        Serial.println(F("LED STATE CHANGED: Now GREEN"));
                        movingTooFast = false;
                        cooldownTimer = 0;
                    }
                }
                else if (speed > 5)
                    cooldownTimer = 0;
            }

            lastDistance = avgDistance;
            lastSpeed = speed;
            lastCalculationTime = currentTime;
        }
    }
    else
    {
        if (movingTooFast && currentTime - lastCalculationTime > 5000)
        {
            Serial.println(F("No valid readings. Resetting to GREEN"));
            leds->setColorRGB(0, 0, 255, 0);
            ledState = LED_GREEN;
            Serial.println(F("LED STATE CHANGED: Reset to GREEN"));
            movingTooFast = false;
            cooldownTimer = 0;
        }
    }

    delay(100);
}
