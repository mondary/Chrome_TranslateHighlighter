# Changelog

## [2026.10.04] - 2026-10-02
### Changed
- Landing refaite sur une nouvelle direction visuelle (tokens `#0a0a0a / #111 / liseré .11`,
  typo système tracking -.065em, sections hero → 3 usages → avant/après → réglages → prix → FAQ
  → installation → footer en colonnes)
- Captures, GIF et MP4 refaits sur une nouvelle page de démonstration éditoriale sombre
  (« The Aurelle Review », photo domaine public) — l'ancienne page beige est archivée
- Photo PD ajoutée et crédits documentés dans `store/media-kit/README.md`
### Fixed
- `manifest.version` sans zéro initial : Chrome réinterprétait `2026.10.02` en `2026.10.2` et
  affichait l'avertissement « The extension version is parsed as… » (CalVer à 2 chiffres incompatible)
- `img { height:auto }` sur la landing : les vignettes étaient étirées par l'attribut `height` HTML

## [2026.10.02] - 2026-10-02
### Added
- Landing bilingue FR/EN `store/index.html` (captures réelles, mouvement réduit, sans-JS, Ko-fi)
- Media kit régénérable `store/media-kit/` (capture Chrome for Testing, QA, cartes store)
- Kit Chrome Web Store : 4 captures 1280×800, tuile 440×280, marquee 1400×560, carte OG 1200×630
- GIFs démo (large + compact) et master MP4
- Présence hub `Web_HubApps` et bundle FTP `store/website/` (`scripts/website.sh`)

## [2026.10.01] - 2026-10-02
### Fixed
- `substituteTranslate` n'était pas restauré depuis `chrome.storage.sync` au chargement :
  le mode substitution était perdu à chaque rechargement de page (content.js + background.js)

## [2026.06.1] - 2026-06-29
### Fixed
- Retrait de la permission `scripting` inutilisée (refus Chrome Web Store)
- Nettoyage des chemins d'icônes : `../store/icons/` → `icons/` (zip auto-contenu)
- Mise à jour de `permissions.txt` (suppression de la justification Scripting)

## [0.10] - 2026-06-26
### Added
- Initial project scaffold
