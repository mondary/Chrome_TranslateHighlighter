# PLAN — Landing + kit store PK Traduction (approuvé le 2026-10-02)

Dossier de sortie : `store/` (défaut). Les assets existants remplacés partent dans
`store/archive/`, jamais supprimés silencieusement.

## Produit (vérifié dans le code, pas dans le README)

| Fonction | Code réel | Scène |
|---|---|---|
| Popup de traduction à la sélection | `content.js` `mouseup` → `createTranslationPopup` + spinner | Sélection d'une phrase → spinner « Traduction en cours… » → popup traduit sous la sélection |
| Substitution directe | `content.js` `substituteTranslate` (range.deleteContents) | Même sélection, texte remplacé par la traduction |
| Traduction de page par lots | `content.js` `translatePage()` (lots de 10, délai 100 ms) déclenchée par `background.js` au clic d'icône | Article avant/après |
| Menu contextuel de l'icône | `background.js` : langue (FR/EN/ES/DE/IT) + mode (popup/replace) | Panneau stylisé **illustratif** (jamais présenté comme capture native) |
| Réglages | `chrome.storage.sync` : `targetLanguage`, `autoTranslate`, `substituteTranslate` | — |

Preuves qualifiées (grille de la skill) :
- Captures 1–3 : **extension réelle chargée** (`--load-extension`, profil Chrome jetable),
  données fictives, requête Google Translate réelle.
- Panneau réglages : **illustration** reconstruite pour la narration (le menu natif n'est
  pas capturable in-page) ; signalée comme telle dans `media-kit/README.md`.

## Storyboard de la landing (`store/index.html`)

1. **Hero** — thèse « Traduction instantanée, sans quitter la page. » + mockup navigateur
   dominant avec popup réel. Fondu lent à l'ouverture.
2. **Boucle démo** — GIF large + compact : curseur → sélection → spinner → popup → reset.
3. **Deux modes** — popup vs substitution, toggle illustratif avant/après (captures réelles).
4. **Page entière** — avant/après traduction par lots (captures réelles, même viewport).
5. **Réglages** — 5 langues, 2 modes (illustration stylisée, pas une fausse capture macOS).
6. **Installation + soutien** — repo GitHub (installer en 4 étapes), CTA Chrome Web Store
   activé seulement si l'URL réelle de la fiche est fournie (actuellement `/detail/` = placeholder),
   **bouton Ko-fi visible près du CTA** (https://ko-fi.com/pouark).

Bilingue FR/EN même fichier : FR complet dans le HTML (lisible sans JS), détection
`navigator.languages` → `navigator.language` → FR, bascule manuelle mémorisée
(localStorage, repli mémoire de page), `document.documentElement.lang` synchronisé,
bascule appliquée avant premier rendu (pas de flash EN→FR).
Mouvement : uniquement `transform`/`opacity` ; `prefers-reduced-motion` → rendu statique.

## Captures et exports

| Asset | Source | Dimensions finales |
|---|---|---|
| `screenshots/01-selection-popup.png` | extension réelle | 1280×800 |
| `screenshots/02-substitution.png` | extension réelle | 1280×800 |
| `screenshots/03-page-traduite.png` | extension réelle | 1280×800 |
| `screenshots/04-page-origine.png` | extension réelle (avant traduction) | 1280×800 |
| `assets/cws-tile-440x280.png` | dérivé du master hero | 440×280 |
| `assets/cws-marquee-1400x560.png` | dérivé du master hero | 1400×560 |
| `assets/card-1200x630.png` | dérivé landing (OG) | 1200×630 (l'ancien 1200×675 part en archive) |
| `assets/banner-1544x500.png` | existant, conservé | 1544×500 |
| `gifs/demo-wide.gif` + `gifs/demo-compact.gif` | boucle scénarisée réelle | 960 px / 480 px |
| `videos/demo.mp4` | master des frames (1280×720, H.264 yuv420p) | ~10–14 s |

## Critères de réception

- [x] Visuel : images lues à 1920/1440/768/390 (hero, GIF, captures, avant/après) — revues une à une.
- [x] Captures réelles : viewport identique avant/après, spinner et popup visibles, aucune donnée perso.
- [x] FR/EN : bascule clavier, `lang` + titre à jour, bascule CSS appliquée avant premier rendu, sans JS → FR complet.
- [x] Clavier : tabulation brand → FR → EN → CTA, outline visible 2px.
- [x] Mouvement réduit : préférence système testée (reveals immédiatement visibles) — aucun bouton mouvement sur cette landing.
- [x] Sans JS : promesses, captures, liens et installation lisibles (vérifié en capture + texte).
- [x] Liens : GitHub, confidentialité, Ko-fi (×3) — destinations réelles vérifiées ; CWS remplacé par un placeholder honnête en attendant l'URL de fiche.
- [x] Performance : contenu initial ≈ 130 Ko (HTML+CSS+JS+icône+hero WebP) — cible < 1,5 Mo largement tenue, GIFs et captures en lazy-loading.
- [x] `git diff --check` propre ; README FR/EN + `description-store.md` mis à jour ; version 2026.10.1.
- [x] `media-kit/README.md` : commandes, sources, limites, régénération.
- [x] Présence complète : entrée hub FR/EN ajoutée, hub + landing publiés et vérifiés en ligne
  (14 cartes, médias 200, 429 = throttling en rafale uniquement).
