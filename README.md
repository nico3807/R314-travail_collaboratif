# R314-travail_collaboratif

TP interactif (BUT MMI2 — Ressource R3.13) sur le travail collaboratif et le
versionnement : configuration complète de Git/GitHub avec VSCode pour un
binôme, à travers six scénarios progressifs (synchronisation, conflit,
branches, Pull Request, incidents).

## Utiliser ce TP en tant qu'étudiant·e

1. Ouvrir le dossier dans VSCode.
2. Lancer le site avec un serveur local, car les pages `scenarios.html` et
   `sae.html` chargent leurs données via `fetch()` (bloqué par les navigateurs
   en ouverture directe d'un fichier `file://`) :
   - le plus simple : installer l'extension VSCode **Live Server**, clic
     droit sur `index.html` > _Open with Live Server_ ;
   - ou en ligne de commande, à la racine du dossier : `npx serve` (ou
     `python3 -m http.server`).
3. Commencer par la page **Prérequis**, puis suivre l'ordre du menu :
   Concepts → Scénarios → Mémo. La page **Préparation SAé** est indépendante
   du TP : c'est la fiche consigne pour contribuer au projet Arcade.

## Utiliser ce dépôt en tant qu'enseignant·e

Attention à ne pas confondre deux dépôts :

- **celui-ci**, `R314-travail_collaboratif`, qui contient le support de TP ;
- **`depot-partage`**, que chaque binôme crée lui-même au scénario 1 et dans
  lequel se déroulent tous les scénarios.

Pour distribuer le support, pousser ce dossier tel quel sur un dépôt GitHub
(public ou privé, activer GitHub Pages sur la branche `main` pour un lien
cliquable sans serveur local). Chaque binôme crée ensuite son propre dépôt
vide `depot-partage`.

## Structure

```
R314-travail_collaboratif/
├── index.html          Page d'accueil, objectifs, déroulé horaire
├── prerequis.html       Installation Git/GitHub/VSCode (à faire avant la séance)
├── concepts.html         Vocabulaire de base + schéma des 4 zones de Git
├── scenarios.html        Les 6 scénarios collaboratifs (interactif)
├── sae.html              Fiche consigne SAé : contribuer au projet Arcade
├── memo.html             Aide-mémoire commandes Git / VSCode
├── css/style.css         Feuille de style partagée
├── img/                  Captures d'écran illustrant les étapes
├── js/
│   ├── main.js           Navigation (lien actif)
│   └── scenarios.js       Rendu des fiches (scénarios ET SAé), filtre de rôle, suivi
└── data/
    ├── scenarios.json     Contenu des 6 scénarios
    └── sae.json           Contenu des 5 étapes de la fiche SAé
```

Le contenu pédagogique est entièrement piloté par les fichiers JSON de
`data/` : modifier un scénario ou une étape ne demande aucune connaissance de
JavaScript. `js/scenarios.js` sert les deux pages ; chacune indique son
fichier de données via l'attribut `data-source` du conteneur.

## Licence

Support pédagogique libre de réutilisation et d'adaptation dans un cadre
d'enseignement.
