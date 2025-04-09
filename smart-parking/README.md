# Capteur de Stationnement Intelligent

Code Arduino pour le capteur de stationnement qui détecte l'occupation des places et calcule le temps d'occupation.

## Objectif

Ce projet implémente un capteur de stationnement connecté qui :

- Détecte la présence de véhicules sur une place de parking
- Mesure la durée d'occupation de la place
- Transmet ces informations au jumeau numérique via LoRaWAN
- Indique visuellement l'état de la place (libre/occupée) via une LED

## Matériel requis

- Arduino Uno ou compatible
- Capteur à ultrasons HC-SR04
- Module LED RVB Grove Chainable
- Module Dragino LA66 (shield LoRaWAN)
- Fils de connexion
- Boîtier résistant aux intempéries
- Alimentation (batterie ou panneau solaire)

## Branchements

- **HC-SR04** :
  - Trigger → Broche 5 de l'Arduino
  - Echo → Broche 6 de l'Arduino
- **LED RVB** :
  - Data → Broche 7 de l'Arduino
  - Clock → Broche 8 de l'Arduino
- **Dragino LA66** :
  - RX → Broche 10 de l'Arduino
  - TX → Broche 11 de l'Arduino

## Installation

1. Installez l'IDE Arduino ou PlatformIO
2. Installez les bibliothèques requises :
   - HCSR04 (ultrasonic sensor)
   - ChainableLED
   - SoftwareSerial
3. Connectez l'Arduino à votre ordinateur
4. Compilez et téléversez le code

## Calibration

Le capteur nécessite une calibration initiale pour déterminer la distance de référence (sans véhicule) :

1. Placez le capteur dans sa position finale (au-dessus ou à côté de la place de parking)
2. Assurez-vous qu'aucun véhicule n'est présent
3. À la première mise sous tension, le système effectue automatiquement une calibration de la ligne de base
4. La LED clignote en vert lorsque la calibration est terminée

## Configuration de la connexion LoRaWAN

Avant de déployer le capteur, vous devez configurer le module LA66 avec les paramètres LoRaWAN :

1. Définissez l'EUI de l'appareil
2. Configurez la clé d'application
3. Réglez les paramètres régionaux LoRaWAN selon votre localisation

## Format des données

Les données transmises suivent un format binaire spécifique :

- 2 octets pour le temps d'occupation (en secondes)
- 1 octet pour l'état de la place (0 = libre, 1 = occupée)

Le décodeur LoRaWAN associé (codec.js) traite ces données et ajoute des informations comme :

- Le formatage du temps d'occupation en heures/minutes/secondes
- Le statut textuel de la place (FREE/OCCUPIED)
- Un horodatage au format ISO

## Consommation d'énergie

Le capteur est optimisé pour une faible consommation d'énergie :

- Mode veille entre les lectures
- Fréquence de transmission ajustable
- Compatible avec une alimentation par batterie ou panneau solaire
