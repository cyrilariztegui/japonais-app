# Application d'apprentissage du japonais

PWA personnelle pour iPhone, conçue pour apprendre le japonais en partant de zéro avant un départ à Tokyo en février.

## Objectifs

- Lire un peu de japonais en comprenant sa logique (kana, kanji en reconnaissance, phrases simples)
- Comprendre et parler à l'oral
- L'écriture manuscrite n'est pas un objectif : les kanji sont travaillés en reconnaissance uniquement

## Contraintes

| Contrainte | Valeur |
|---|---|
| Utilisateur | Usage personnel uniquement |
| Niveau de départ | Débutant complet |
| Temps d'étude | 15 à 30 min par jour |
| Temps de développement | Quelques heures par semaine |
| Plateforme | iPhone, en PWA |
| Budget | Gratuit uniquement (aucune API payante) |
| Échéance | Février (environ 19 semaines) |

## Architecture

Le projet se découpe en trois couches.

**Préparation des données.** Des scripts Python, exécutés une fois en local, transforment les ressources brutes (JMdict, listes JLPT, Tatoeba) en fichiers JSON légers placés dans `public/data/`.

**Application.** Un site statique (HTML, CSS, JavaScript) qui charge ces JSON. La progression est stockée localement sur l'iPhone, avec une fonction d'export pour la sauvegarder, Safari ne garantissant pas une conservation indéfinie.

**Hébergement.** GitHub Pages sert les fichiers en HTTPS, condition nécessaire à l'installation en PWA et à l'accès au micro. Aucun serveur, aucun coût.

### Oral sans API payante

- **Écoute** : synthèse vocale via l'API Web Speech, qui utilise les voix japonaises intégrées à iOS.
- **Dialogues** : générés une fois à l'avance, stockés en JSON, lus par la synthèse vocale.
- **Prononciation** : reconnaissance vocale de Safari, qui vérifie que la phrase prononcée correspond à la phrase attendue. Elle ne corrige pas finement la prononciation, et son fonctionnement en mode PWA peut être instable : à tester tôt.

## Outils nécessaires

- VS Code
- Git et un compte GitHub
- Python (préparation des données)
- Node.js (pour Vite : serveur de développement, gestion des bibliothèques, génération de la PWA via `vite-plugin-pwa`)

Bibliothèque principale : [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) pour la répétition espacée.

## Structure du dépôt

```
japonais-app/
├── data-prep/        scripts Python (données brutes non versionnées)
├── public/
│   ├── data/         vocab.json, kanji.json, dialogues.json
│   └── icons/
├── src/
│   ├── main.js
│   ├── srs.js        répétition espacée
│   ├── audio.js      synthèse et reconnaissance vocale
│   └── storage.js    progression et export
├── index.html
└── vite.config.js
```

## Développement

```bash
npm install
npm run dev -- --host
```

L'option `--host` rend l'app accessible depuis l'iPhone sur le même réseau Wi-Fi. Le micro exigeant HTTPS, la reconnaissance vocale se teste sur la version déployée.

## Déploiement

1. Une GitHub Action construit et publie le site sur GitHub Pages à chaque `git push`.
2. Dans `vite.config.js`, déclarer le sous-dossier de publication, sinon rien ne se charge :
   ```js
   base: '/japonais-app/'
   ```
3. Sur l'iPhone : ouvrir l'adresse dans Safari, puis Partager, puis « Sur l'écran d'accueil ».

## Feuille de route

| Période | Étape |
|---|---|
| Immédiatement | Apprendre les kana avec un outil gratuit existant, sans attendre l'app |
| Semaines 1 à 4 | MVP : cartes de vocabulaire JLPT N5 (environ 800 mots), répétition espacée, audio |
| Semaines 5 à 8 | Reconnaissance des kanji, lecture de phrases courtes avec furigana |
| Semaines 9 à 12 | Dialogues en compréhension orale |
| Ensuite | Exercices de prononciation par reconnaissance vocale |

L'ordre suit le rapport valeur/effort : les premières étapes servent chaque jour, la dernière est la plus incertaine techniquement.

## Données et licences

- [JMdict / KANJIDIC](https://www.edrdg.org/) : licence Creative Commons Attribution-ShareAlike
- [Tatoeba](https://tatoeba.org/) : phrases sous licence Creative Commons Attribution

Ces licences imposent une attribution : l'app comporte une page « Crédits » qui cite ces sources.
