# Electron Labyrinthe

Bienvenue dans Electron Labyrinthe — une petite application de bureau pour créer, jouer
et administrer des labyrinthes, construite avec Electron.

Ce dépôt contient une version simple et extensible d'un jeu de labyrinthe : interface
utilisateur dans `renderer/`, logique métier dans `src/` et code d'initialisation dans
`main.js`.

Electron Labyrinthe permet de générer des labyrinthes dynamiques, de les afficher dans
une fenêtre Electron, d'enregistrer des parties localement et d'offrir quelques outils
d'administration (gestion d'utilisateurs, statistiques, import/export).

Principales caractéristiques :
Génération de labyrinthes en fonction de la taille et de la difficulté
Interface de jeu simple et interactive
Authentification basique et gestion d'utilisateurs
Stockage local (SQLite) et données de test dans `test-db/`
Outils d'administration accessibles depuis l'interface

`main.js` : point d'entrée Electron, routes IPC et initialisation
`preload.js` : canal sécurisé entre le renderer et le main
`renderer/` : interface utilisateur (HTML, CSS, JS)
`index.html`, `app.js`, `admin-features.js`, `style.css`
`src/` : logique applicative
`auth.js`, `database.js`, `labyrinth.js`
`test-db/` : exemples de base de données ou données de test

1. Cloner le dépôt et ouvrir le dossier dans VS Code
2. Installer les dépendances :

bash

```
npm install

Puis

npm start
```
