# Digital Twin

Application web principale qui intègre le modèle 3D d'une petite ville et les tableaux de bord pour visualiser les données des capteurs.

## Objectif

Cette application sert d'interface utilisateur principale pour le projet de jumeau numérique. Elle permet de :

- Visualiser le modèle 3D d'une ville
- Interagir avec différents bâtiments
- Afficher les données en temps réel des capteurs
- Visualiser l'impact des données sur le modèle 3D (par exemple : occupation d'une place de parking)
- Consulter les tableaux de bord spécifiques pour chaque type de capteur

## Prérequis

- Node.js 18 ou supérieur ou bun
- NPM 9 ou supérieur

- Un modèle 3D de la ville au format GLTF
- Des données de capteurs au format JSON

## Installation

1. Clonez le dépôt
2. Accédez au répertoire Digital-Twin
3. Installez les dépendances

```bash
cd Digital-Twin

bun install

# ou

npm install
```

## Démarrage de l'application

```bash
bun run dev
```

ou

```bash
npm run dev
```

L'application sera accessible à l'adresse http://localhost:5050

## Structure du projet

- `src/` : Code source de l'application
  - `components/` : Composants React
    - `CityViewer.tsx` : Composant pour le modèle 3D
    - `dashboard/` : Composants des tableaux de bord
  - `lib/` : Utilitaires et fonctions
  - `App.tsx` : Composant principal
  - `main.tsx` : Point d'entrée de l'application

## Technologies utilisées

- **React 19** : Framework frontend
- **Three.js/React Three Fiber** : Rendu 3D
- **TailwindCSS** : Styles et composants UI
- **Recharts** : Graphiques et visualisations
- **Vite** : Bundler et serveur de développement

## API

L'application expose les endpoints suivants :

- `/api/weather` : Données météorologiques
- `/api/air-quality` : Données de qualité de l'air
- `/api/parking` : Données de stationnement
- `/api/all` : Toutes les données combinées

## Notes importantes

- Le modèle 3D doit être placé dans le dossier `public/models/`
- L'application attend des données au format spécifique pour chaque type de capteur
