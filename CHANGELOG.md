# Changelog

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
