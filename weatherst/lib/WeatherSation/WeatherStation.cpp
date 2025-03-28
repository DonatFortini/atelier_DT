#include "WeatherStation.h"

void WeatherStation::dht_init()
{
    this->dht.begin();
}

void WeatherStation::hp20x_init()
{
    this->hp20x.begin();
}

void WeatherStation::dht_read()
{
    float newTemp = dht.readTemperature();
    if (!isnan(newTemp))
    {
        this->dht_temperature = newTemp;
    }

    float newHumidity = dht.readHumidity();
    if (!isnan(newHumidity))
    {
        this->humidity = newHumidity;
    }
}

void WeatherStation::hp20x_read()
{
    this->hp20x_pressure = hp20x.ReadPressure();
    this->hp20x_temperature = hp20x.ReadTemperature();
    this->altitude = hp20x.ReadAltitude();
}

WeatherStation::WeatherStation(byte dht_pin)
    : dht(dht_pin, DHTTYPE), hp20x()
{
    this->temperature = 0;
    this->humidity = 0;
    this->pressure = 0;
    this->altitude = 0;
    this->alertState = 0;
}

void WeatherStation::init()
{
    hp20x_init();
    Serial.println("HP20X initialized");
    dht_init();
    Serial.println("DHT11 initialized");
}

void WeatherStation::readSensors()
{
    dht_read();
    hp20x_read();
    adjustMesurements();
    checkThresholds();
}

void WeatherStation::adjustMesurements()
{
    this->temperature = (this->dht_temperature + t_filter.Filter(this->hp20x_temperature / 100.0)) / 2;
    this->pressure = p_filter.Filter(this->hp20x_pressure / 100.0);
    this->altitude = a_filter.Filter(this->altitude / 100.0);
}

void WeatherStation::checkThresholds()
{
    struct Alert
    {
        float value;
        float threshold;
        uint8_t alertType;
        bool greaterThan;
    };

    Alert alerts[] = {
        {temperature, TEMP_THRESHOLD, TEMP_ALERT, true},
        {humidity, HUMI_THRESHOLD, HUMI_ALERT, true},
        {pressure, PRES_THRESHOLD, PRES_ALERT, false},
        {altitude, ALT_THRESHOLD, ALT_ALERT, true}};

    uint8_t alertCount = 0;

    for (const auto &alert : alerts)
    {
        if ((alert.greaterThan && alert.value > alert.threshold) ||
            (!alert.greaterThan && alert.value < alert.threshold))
        {
            alertState = alert.alertType;
            alertCount++;
        }
    }

    if (alertCount > 1)
    {
        alertState = MULTIPLE_ALERT;
    }
}

void WeatherStation::printData()
{
    Serial.println(F("\n===== WEATHER DATA ====="));
    Serial.println("Temp: " + String(temperature) + "°C");
    Serial.println("Pressure: " + String(pressure) + "hPa");
    Serial.println("Humidity: " + String(humidity) + "%");
    Serial.println("Altitude: " + String(altitude) + "m");
    Serial.println("Alert State: " + String(alertState));
}