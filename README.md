# Digital Twin - Jumeaux Numériques

Ce dépôt a été créé dans le contexte du Forum des Mathématiques 2025, au cours duquel j'ai présenté le concept des jumeaux numériques. Pour illustrer ce concept, j'ai développé un système complet comprenant :

- Un mini-réseau LoRaWAN de capteurs IoT
- Un modèle 3D interactif d'une ville
- Des tableaux de bord en temps réel affichant les données des capteurs
- Une visualisation dynamique des effets des données capteurs sur le modèle 3D

## Architecture du projet

Le projet est structuré en quatre composants principaux :

1. **Digital-Twin** : Application web principale avec le modèle 3D et les dashboards
2. **weatherst** : Capteur de météo avec Arduino, DHT11 et capteur barométrique HP206C
3. **air_quality** : Capteur de qualité de l'air avec Arduino, HM330X et Air Quality Sensor de Grove
4. **smart-parking** : Capteur de stationnement avec Arduino et capteur à ultrasons HC-SR04

## Fonctionnalités

- **Communication LoRaWAN** : Tous les capteurs envoient leurs données via le protocole LoRaWAN
- **Visualisation 3D** : Un modèle 3D interactif permet de visualiser les données en temps réel
- **Tableaux de bord** : Interfaces utilisateur pour chaque type de capteur avec visualisations
- **Alertes** : Système d'alerte basé sur les seuils définis pour chaque type de capteur

## Technologies utilisées

- **Frontend** : React, Three.js, TailwindCSS, Recharts
- **Backend** : Vite, bun
- **IoT** : Arduino, Dragino LA66 LoRa Shield
- **Capteurs** : DHT11, HP206C, HM330X, HC-SR04
- **Protocoles** : LoRaWAN, I2C, UART

## Installation et démarrage

Chaque sous-projet contient son propre README avec des instructions d'installation spécifiques. Pour démarrer l'ensemble du système :

1. Configurez et déployez les capteurs selon les instructions de chaque sous-projet
2. Démarrez l'application principale Digital-Twin

```bash
cd Digital-Twin
npm install
npm run dev
```

## Structure du dépôt

```
.
├── Digital-Twin/         # Application web principale
├── air_quality/          # Code pour le capteur de qualité d'air
├── smart-parking/        # Code pour le capteur de stationnement
└── weatherst/            # Code pour la station météo
```

## Licence

Ce projet est distribué sous licence MIT.

## Remerciements

Merci à tous ceux qui ont contribué à ce projet et aux organisateurs du Forum des Mathématiques 2025 pour l'opportunité de présenter ce travail.
