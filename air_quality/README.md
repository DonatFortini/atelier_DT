# Capteur de Qualité de l'Air

Code Arduino pour le capteur de qualité de l'air qui mesure les particules fines et l'indice de qualité de l'air.

## Objectif

Ce projet implémente un capteur de qualité de l'air connecté qui mesure :

- Les particules fines PM2.5
- Les particules fines PM10
- L'indice de qualité de l'air (AQI)

Les données sont transmises au jumeau numérique via LoRaWAN pour être visualisées et analysées en temps réel.

## Matériel requis

- Arduino Uno ou compatible
- Module HM3301 Grove Laser PM2.5
- Module Grove Air Quality Sensor
- Module Dragino LA66 (shield LoRaWAN)
- Fils de connexion
- Alimentation (batterie ou adaptateur secteur)

## Branchements

- **HM3301** : Connexion I2C (SDA → A4, SCL → A5)
- **Air Quality Sensor** : Broche analogique connectée à A0
- **Dragino LA66** :
  - RX → Broche 10 de l'Arduino
  - TX → Broche 11 de l'Arduino

## Installation

1. Installez l'IDE Arduino ou PlatformIO
2. Installez les bibliothèques requises :
   - Grove Air Quality Sensor
   - Grove Laser PM2.5 Sensor HM3301
   - SoftwareSerial
3. Connectez l'Arduino à votre ordinateur
4. Compilez et téléversez le code

## Configuration de la connexion LoRaWAN

Avant de déployer le capteur, vous devez configurer le module LA66 avec les paramètres LoRaWAN :

1. Définissez l'EUI de l'appareil
2. Configurez la clé d'application
3. Réglez les paramètres régionaux LoRaWAN selon votre localisation

Ces configurations peuvent être effectuées via des commandes AT envoyées au module LA66.

## Format des données

Les données transmises suivent un format binaire spécifique :

- 2 octets pour PM2.5 (uint16_t)
- 2 octets pour PM10 (uint16_t)
- 2 octets pour la valeur AQI (uint16_t)
- 1 octet pour l'état d'alerte

Le décodeur LoRaWAN associé (codec.js) traite ces données pour les convertir en format lisible.

## Alertes

Le système génère des alertes dans les conditions suivantes :

- PM2.5 > 25 μg/m³ (seuil recommandé par l'OMS)
- PM10 > 50 μg/m³ (seuil recommandé par l'OMS)
- AQI dans la catégorie de pollution élevée ou très élevée
