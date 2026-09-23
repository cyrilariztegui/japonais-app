# Application d'apprentissage du japonais

PWA personnelle pour iPhone, conçue pour apprendre le japonais en partant de zéro avant un départ à Tokyo en février 2027. Elle fonctionne hors ligne, sans serveur ni API payante.

Adresse : https://cyrilariztegui.github.io/japonais-app/

## Objectifs

- Lire un peu de japonais en comprenant sa logique (kana, kanji en reconnaissance, phrases simples)
- Comprendre et parler à l'oral
- L'écriture manuscrite n'est pas un objectif

L'app est un outil de mémorisation. Elle se complète d'un cours de grammaire et d'échanges avec des locuteurs japonais.

## Fonctionnalités

### Cinq paquets

| Paquet | Contenu | Ordre d'introduction |
|---|---|---|
| Hiragana | 104 caractères : 46 de base, 25 variantes (が, ぱ…), 33 combinaisons (きゃ…) | Tableau traditionnel |
| Katakana | Les mêmes 104 caractères en katakana | Tableau traditionnel |
| Mots | 662 mots du JLPT N5, avec lecture, sens, exemples et, pour les 110 verbes, formes polie et neutre | Fréquence d'usage |
| Kanji | 79 kanji du N5, avec sens, lectures et mots associés du vocabulaire | Fréquence d'usage |
| Écoute | 78 répliques réparties en 23 dialogues et 8 situations du quotidien | Ordre des dialogues |

### Répétition espacée

Chaque carte est notée « À revoir », « Difficile », « Correct » ou « Facile ». L'algorithme FSRS (bibliothèque ts-fsrs) en déduit la date de la prochaine révision. Chaque paquet a sa propre file et sa propre limite de nouveautés par jour (10 par défaut).

### Écrans

- **Accueil** : les paquets avec leurs compteurs du jour, la série de jours consécutifs, et « Commencer la séance », qui enchaîne tous les paquets.
- **Séance** : une carte à la fois, avec barre de progression, audio et boutons de notation.
- **Réglages** : nouveautés par jour, transcription française, lecture automatique, sauvegarde, crédits et date de version.

### Audio

- **Synthèse vocale** : voix japonaises intégrées à iOS (API Web Speech). Dans les dialogues, chaque personnage peut avoir sa voix.
- **Reconnaissance vocale (essai)** : dans l'onglet Écoute, « Répéter à voix haute » transcrit la phrase prononcée et la compare à la phrase attendue. Son fonctionnement dans l'app installée reste à confirmer.

### Transcription française

Une transcription pensée pour un lecteur francophone (« ta-bé-rou », « tô-kyô »), désactivable dans les Réglages. Dans les phrases, les particules は, へ et を se transcrivent « wa », « é » et « o », et le « u » presque muet de です et ます est noté « dèss » et « mass ».

## Architecture

**Préparation des données** : des scripts Python, lancés en local, produisent les fichiers JSON de `public/data/`. Les dialogues sont rédigés à la main.

**Application** : un site statique en JavaScript sans framework, construit avec Vite. `vite-plugin-pwa` génère le manifeste et le service worker qui permettent l'installation et l'usage hors ligne.

**Hébergement** : GitHub Pages, publié par GitHub Actions à chaque `git push`.

## Structure du dépôt

```
japonais-app/
├── .github/workflows/deploy.yml   build et publication
├── data-prep/
│   ├── build_vocab.py      vocabulaire N5 (tri, exemples, conjugaisons)
│   ├── conjugation.py      formes polie et neutre des verbes
│   ├── build_kanji.py      kanji N5 et mots associés
│   └── .venv/              environnement Python (non versionné)
├── public/
│   ├── data/               vocab.json, kanji.json, dialogues.json
│   └── icons/              icônes de l'écran d'accueil
├── src/
│   ├── main.js             état, navigation, événements
│   ├── views.js            HTML des écrans
│   ├── icons.js            pictogrammes SVG de l'interface
│   ├── style.css           styles, thèmes clair et sombre
│   ├── srs.js              répétition espacée, série de jours
│   ├── storage.js          progression, réglages, export et import
│   ├── audio.js            synthèse et reconnaissance vocale
│   ├── pronunciation.js    comparaison de la phrase prononcée
│   ├── phonetic.js         transcription française
│   ├── kana.js             cartes de kana
│   └── listening.js        cartes d'écoute
├── index.html
└── vite.config.js
```

## Préparation des données

Une seule fois, créer l'environnement Python :

```bash
python3 -m venv data-prep/.venv
source data-prep/.venv/bin/activate
pip install openjlpt "wordfreq[mecab]"
```

Puis, à chaque modification des scripts, dans cet ordre (`build_kanji.py` lit `vocab.json`) :

```bash
source data-prep/.venv/bin/activate
python data-prep/build_vocab.py
python data-prep/build_kanji.py
deactivate
```

Résultats attendus : `662 cartes, 57 sans exemple` puis `79 kanji, 2 sans mot associé`.

Détails du traitement :
- **Tri** : les mots sont triés par fréquence d'usage (wordfreq), niveau par niveau (`--levels N5 N4` pour ajouter un niveau).
- **Exemples** : une phrase n'est gardée que si MeCab y trouve le mot en entier, et non comme morceau d'un autre mot.
- **Conjugaisons** : MeCab identifie le groupe de chaque verbe, puis `conjugation.py` calcule ses formes.
- **Identifiants** : chaque carte est identifiée par `mot|lecture`, `kana:あ`, `kanji:日` ou `dlg:<dialogue>:<réplique>`. Ils ne dépendent pas de l'ordre, donc régénérer les données ne mélange jamais la progression.

## Développement

```bash
npm install
npm run dev -- --host
```

`--host` rend l'app accessible depuis l'iPhone sur le même Wi-Fi. Le micro exigeant HTTPS, la reconnaissance vocale se teste sur la version en ligne.

## Déploiement

```bash
git add .
git commit -m "Description du changement"
git push
gh run watch
```

La date de version en bas des Réglages indique quelle version tourne sur le téléphone (heure UTC). L'app vérifie les mises à jour à chaque retour au premier plan et se recharge d'elle-même. En cas de doute, fermer complètement l'app puis la rouvrir.

Ne jamais supprimer l'app de l'écran d'accueil sans avoir exporté la progression : la suppression efface son stockage.

## Sauvegarde

- **Automatique** : la progression est enregistrée sur le téléphone (`localStorage`, clé `progress:v1`) à chaque carte notée.
- **Manuelle** : Réglages, puis « Exporter », puis « Enregistrer dans Fichiers », de préférence sur iCloud Drive. « Importer » restaure un fichier de sauvegarde.
- **Rappel** : un point rouge apparaît sur l'onglet Réglages après une semaine sans export.

## Feuille de route

Fait :
- Répétition espacée, kana complets, vocabulaire N5 trié par fréquence, kanji N5
- Dialogues d'écoute avec voix par personnage
- Formes polie et neutre sur les cartes de verbes
- Interface Accueil, Séance, Réglages, avec thème sombre
- Sauvegarde, mise à jour automatique, date de version

À venir :
- Tester la reconnaissance vocale sur iPhone, puis la développer ou y renoncer
- Paquets alignés sur les leçons du cours de grammaire suivi
- Nouveaux dialogues, dont des échanges en registre familier
- Entraînement actif à la conjugaison, quand le cours abordera la forme neutre
- Mettre à jour les versions des actions GitHub (avertissement Node.js 20)

## Données et licences

- [OpenJLPT](https://pypi.org/project/openjlpt/) : listes de vocabulaire et de kanji JLPT, CC BY-SA 4.0
- [JMdict et KANJIDIC](https://www.edrdg.org/) (EDRDG) : CC BY-SA
- [Tatoeba](https://tatoeba.org/) : phrases d'exemple, CC BY
- [wordfreq](https://github.com/rspeer/wordfreq) : fréquences d'usage, données CC BY-SA 4.0
- [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) et [wanakana](https://github.com/WaniKani/WanaKana) : MIT

Les attributions figurent aussi en bas de l'écran Réglages.
