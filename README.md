# R314-travail_collaboratif

TP interactif (BUT MMI2 — Ressource R3.13) sur le travail collaboratif et le
versionnement : configuration complète de Git/GitHub avec VSCode pour un
binôme, à travers six scénarios progressifs (synchronisation, conflit,
branches, Pull Request, incidents).

## Utiliser ce TP en tant qu'étudiant·e

1. Ouvrir le dossier dans VSCode.
2. Lancer le site avec un serveur local, car les pages `scenarios.html` et
   `evaluation.html` chargent leurs données via `fetch()` (bloqué par les
   navigateurs en ouverture directe d'un fichier `file://`) :
   - le plus simple : installer l'extension VSCode **Live Server**, clic
     droit sur `index.html` > _Open with Live Server_ ;
   - ou en ligne de commande, à la racine du dossier : `npx serve` (ou
     `python3 -m http.server`).
3. Commencer par la page **Prérequis**, puis suivre l'ordre du menu :
   Concepts → Scénarios → Évaluation → Mémo.

## Utiliser ce dépôt en tant qu'enseignant·e

Ce dépôt est aussi, littéralement, le dépôt que chaque binôme doit créer sur
GitHub sous le nom `R314-travail_collaboratif` pour réaliser les scénarios
(voir Scénario 1). Deux façons de le distribuer :

- **Comme support de cours uniquement** : pousser ce dossier tel quel sur un
  dépôt GitHub (public ou privé, activer GitHub Pages sur la branche `main`
  pour un lien cliquable sans serveur local), et laisser chaque binôme créer
  son propre dépôt vide pour le scénario 1.
- **Comme dépôt de départ** : donner ce dépôt (ou un dépôt vide portant le
  même nom) directement à chaque binôme comme point de départ.

## Structure

```
R314-travail_collaboratif/
├── index.html          Page d'accueil, objectifs, déroulé horaire
├── prerequis.html       Installation Git/GitHub/VSCode (à faire avant la séance)
├── concepts.html         Vocabulaire de base + schéma des 4 zones de Git
├── scenarios.html        Les 6 scénarios collaboratifs (interactif)
├── evaluation.html       Grille d'évaluation notée en direct
├── memo.html             Aide-mémoire commandes Git / VSCode
├── css/style.css         Feuille de style partagée
├── js/
│   ├── main.js           Navigation (lien actif)
│   ├── scenarios.js       Chargement + rendu des scénarios, filtre de rôle, suivi
│   └── evaluation.js      Chargement + calcul du score de la grille
└── data/
    ├── scenarios.json     Contenu des 6 scénarios
    └── evaluation.json    Critères et barème de la grille d'évaluation
```

Le contenu pédagogique (scénarios, grille) est entièrement piloté par les
fichiers JSON dans `data/` : modifier un scénario ou un critère ne demande
aucune connaissance de JavaScript.

## Licence

Support pédagogique libre de réutilisation et d'adaptation dans un cadre
d'enseignement.
