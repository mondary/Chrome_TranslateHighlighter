# Changelog

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
