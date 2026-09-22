# Criblage in silico des protéines impliquées dans l’élimination programmée de l’ADN chez les nématodes

## Description

Ce projet vise à identifier et caractériser les protéines impliquées dans l’élimination programmée de l’ADN (PDE) chez les nématodes *Mesorhabditis*.\
Les structures protéiques prédites par AlphaFold3 sont analysées à l’aide de R et Python pour évaluer leur fiabilité (scores pTM, ipTM) et détecter des homodimères ou hétérodimères pertinents.\
L’approche combine analyse structurale, visualisation 3D (ChimeraX) et comparaison par Foldseek, offrant un pipeline reproductible et sécurisé.\

------------------------------------------------------------------------

## Installation

### 1. Cloner le dépôt

``` bash
git clone https://gitlab.com/username/nom_du_projet.git
cd nom_du_projet
```

### 2. Installer les dépendances R

``` r
install.packages(c("ggplot2", "gridExtra", "glue"))
```

------------------------------------------------------------------------

## Utilisation

Exemple pour générer le fichier .tsv contenant les données issues des prédictions par AlphaFold3 :

``` bash
/home/user/.pyenv/versions/3.13.2/bin/python code.py AF3_CRI_Mbelari_21_proteins data.tsv
```

Le chemin vers l'installation python doit être modifié. Le fichier python doit être placé dans le même dossier que le dossier `AF3_CRI_Mbelari_21_proteins`. Le fichier `data.tsv` est alors généré dans ce dossier.

Le fichier `data.tsv` peut ensuite être chargé dans R avec le code `Graphics.R`. Son exécution crée des graphiques permettant de visualiser le **ranking score** de chaque protéine.

------------------------------------------------------------------------

## Auteurs

Projet réalisé par :\
My Anh LA, Cyril ARIZTEGUI, Ahmad JARKAS, Janice NAVARRO\
Encadré par Brice Letcher (LBMC, ENS de Lyon) et Vincent Lacroix (UCBL1).

------------------------------------------------------------------------

## État du projet

Projet en cours (septembre – décembre 2025).
