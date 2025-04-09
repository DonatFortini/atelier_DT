# Station Météo (Weather Station)

Code Arduino pour la station météo qui collecte des données environnementales et les transmet via LoRaWAN.

## Objectif

Ce projet implémente une station météo connectée qui mesure :
- La température ambiante
- L'humidité relative de l'air
- La pression atmosphérique 
- L'altitude estimée

Les données sont traitées avec un filtre de Kalman pour réduire le bruit, puis transmises au jumeau numérique via LoRaWAN.

## Matériel requis

- Arduino Uno ou compatible
- Module DHT11 (capteur de température et d'humidité)
- Module HP206C (capteur barométrique de précision)
- Module Dragino LA66 (shield LoRaWAN)
- Fils de connexion
- Alimentation (batterie ou adaptateur secteur)

## Branchements

- **DHT11** : Broche de données connectée à la broche 8 de l'Arduino
- **HP206C** : Connexion I2C (SDA → A4, SCL → A5)
- **Dragino LA66** : 
  - RX → Broche 10 de l'Arduino
  - TX → Broche 11 de l'Arduino

## Installation

1. Installez l'IDE Arduino ou PlatformIO
2. Installez les bibliothèques requises :
   - DHT sensor library
   - HP20x_dev
   - KalmanFilter
   - SoftwareSerial
3. Connectez l'Arduino à votre ordinateur
4. Compilez et téléversez le code

## Configuration de la connexion LoRaWAN

Avant de déployer la station météo, vous devez configurer le module LA66 avec les paramètres LoRaWAN :

1. Définissez l'EUI de l'appareil
2. Configurez la clé d'application
3. Réglez les paramètres régionaux LoRaWAN selon votre localisation

Ces configurations peuvent être effectuées via des commandes AT envoyées au module LA66.

## Format des données

Les données transmises suivent un format binaire spécifique :
- 4 octets pour la température (float)
- 4 octets pour la pression (float)
- 4 octets pour l'humidité (float)
- 4 octets pour l'altitude (float)
- 1 octet pour l'état d'alerte

Le décodeur LoRaWAN associé (codec.js) traite ces données pour les convertir en format lisible.

## Alertes

Le système génère des alertes dans les conditions suivantes :
- Température > 30°C
- Humidité > 70%
- Pression < 1000 hPa
