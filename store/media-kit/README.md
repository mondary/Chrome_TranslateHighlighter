# Media kit — PK Traduction

Génération des captures, GIFs, vidéo et visuels store. Tout est régénérable depuis ce dossier.

## Source des visuels

- **Captures : extension réelle** chargée dans Chrome for Testing (`--load-extension`),
  profil jetable (`mktemp`), données 100 % fictives. Aucune donnée perso, aucun presse-papiers.
  La traduction affichée est la réponse réelle de l'API Google Translate sur l'article fictif.
- Page d'article fictive : `demo-article.html` (« The Meridian Gazette » — lieux et personnes
  inventés, mention explicite dans le pied de page).
- **Cadres navigateur à 3 points = cadre de présentation**, pas une capture native de Chrome.
- **Menu réglages de la landing = illustration** reconstruite en HTML/CSS ; le menu natif du
  navigateur n'est pas capturable in-page. Signalé comme tel sur la landing.
- Curseur de la boucle GIF : **synthétique** (SVG injecté pour la capture, n'existe pas dans
  le produit). Spinner, popup et traductions sont réels.
- Aucun wallpaper de la bibliothèque commune n'est utilisé (fond uni + dégradé radial dans le
  marquee) — donc aucun `provenance.json` requis.

## Prérequis

```bash
# Une seule fois, hors repo :
mkdir -p /private/var/folders/jb/07k9zyks6_d60c27tclhjd2h0000gn/T/opencode/pktrad-capture
cd /private/var/folders/jb/07k9zyks6_d60c27tclhjd2h0000gn/T/opencode/pktrad-capture
npm init -y && npm install puppeteer-core@24
```

Chrome for Testing / Chromium est requis car le Chrome stable branded ignore
`--load-extension` depuis la v137. Chemin par défaut attendu par les scripts
(surchargeable via `PKT_CFT`) :

```
~/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/.../Google Chrome for Testing
```

## Commandes (depuis la racine du projet)

```bash
# 1. Serveur local pour la page d'article fictive et la landing
python3 -m http.server 4179 --bind 127.0.0.1 &

# 2. Captures réelles de l'extension + frames GIF + export MP4/GIFs
PKT_ROOT="$PWD" node store/media-kit/capture.cjs

# 3. QA landing (1440/768/390 FR+EN, mouvement réduit, sans-JS, clavier, bascule)
#    + export des visuels store (card, tuile CWS, marquee)
PKT_ROOT="$PWD" node store/media-kit/qa.cjs
```

Ensuite, réindexer les PNG maîtres (dsf2) et les WebP de la landing :

```bash
for f in 01-selection-popup 02-substitution 03-page-traduite 04-page-origine; do
  cp "store/screenshots/$f.png" "store/media-kit/masters/$f-2560.png"
  sips -z 800 1280 "store/screenshots/$f.png"   # 1280x800 exacts (Chrome Web Store)
  cwebp -q 82 -quiet "store/screenshots/$f.png" -o "store/screenshots/$f.webp"
done
```

## Sorties

| Fichier | Usage | Taille |
|---|---|---|
| `store/screenshots/01-selection-popup.png` | CWS screenshot + hero + mode popup | 1280×800 |
| `store/screenshots/02-substitution.png` | CWS screenshot + mode substitution | 1280×800 |
| `store/screenshots/03-page-traduite.png` | CWS screenshot + avant/après (après) | 1280×800 |
| `store/screenshots/04-page-origine.png` | CWS screenshot + avant/après (avant) | 1280×800 |
| `store/screenshots/*.webp` | mêmes scènes, format landing | 1280×800 |
| `store/assets/card-1200x630.png` | carte Open Graph | 1200×630 |
| `store/assets/cws-tile-440x280.png` | tuile promo Chrome Web Store | 440×280 |
| `store/assets/cws-marquee-1400x560.png` | marquee Chrome Web Store | 1400×560 |
| `store/assets/banner-1544x500.png` | bannière large (campagne précédente) | 1544×500 |
| `store/gifs/demo-wide.gif` | boucle démo large (landing desktop) | 960×540 |
| `store/gifs/demo-compact.gif` | boucle compacte (landing mobile) | 480×270 |
| `store/videos/demo.mp4` | master de la boucle | 1280×720, ~7 s |
| `store/media-kit/masters/*-2560.png` | PNG maîtres Retina | 2560×1600 |
| `store/media-kit/qa/*.png` | artefacts de QA (landings à 3 largeurs, sans-JS) | — |

## Limites connues

- L'encodage GIF/MP4 utilise l'ffmpeg Homebrew **sans libwebp** : les WebP sont produits par
  `cwebp` (paquet `webp`). 
- La boucle GIF est capturée à 12 fps puis encodée en 24 fps (frames répétées) : le spinner
  tourne réellement mais en pas à pas 12 Hz.
- Le master `store/videos/demo.mp4` de la campagne précédente (sept. 2025) a été écrasé avant
  archivage — il n'était pas suivi par git et n'est pas récupérable. Toute nouvelle campagne
  archive d'abord dans `store/archive/`.
- Les traductions affichées dépendent de la réponse de l'API Google Translate au moment de la
  capture ; une recapture peut produire des variantes de traduction.
