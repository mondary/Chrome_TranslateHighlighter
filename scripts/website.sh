#!/usr/bin/env bash
# Génère le bundle FTP de la landing dans store/website/.
# Le CONTENU de store/website/ se dépose tel quel dans www/apps/<slug>/ du FTP.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=store/website
rm -rf "$OUT"
mkdir -p "$OUT/screenshots" "$OUT/gifs" "$OUT/assets"

cp store/index.html "$OUT/index.html"
cp store/icon.png "$OUT/icon.png"
cp store/privacy-policy-pktraduction.html "$OUT/privacy-policy-pktraduction.html"
cp store/screenshots/01-selection-popup.png store/screenshots/01-selection-popup.webp \
   store/screenshots/02-substitution.png   store/screenshots/02-substitution.webp \
   store/screenshots/03-page-traduite.png  store/screenshots/03-page-traduite.webp \
   store/screenshots/04-page-origine.png   store/screenshots/04-page-origine.webp \
   "$OUT/screenshots/"
cp store/gifs/demo-wide.gif store/gifs/demo-compact.gif "$OUT/gifs/"
cp store/assets/card-1200x630.png "$OUT/assets/"

echo "bundle prêt : $OUT/ ($(find "$OUT" -type f | wc -l | tr -d ' ') fichiers, $(du -sh "$OUT" | cut -f1))"
