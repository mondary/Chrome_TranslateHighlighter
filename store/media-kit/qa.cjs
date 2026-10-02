// QA de la landing + export des visuels store (cards.html).
// Vérifie FR/EN, sans-JS, mouvement réduit, responsive ; capture les cartes à taille exacte.
//
// Sorties :
//   store/media-kit/qa/landing-<w>-<lang>.png     (1440/768/390, fr + en)
//   store/media-kit/qa/landing-nojs-1440.png
//   store/assets/card-1200x630.png
//   store/assets/cws-tile-440x280.png
//   store/assets/cws-marquee-1400x560.png

const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require(path.join(os.tmpdir(), 'opencode', 'pktrad-capture', 'node_modules', 'puppeteer-core'));

const PKT_ROOT = process.env.PKT_ROOT || path.resolve(__dirname, '..', '..');
const STORE = path.join(PKT_ROOT, 'store');
const PORT = process.env.PKT_PORT || '4179';
const BASE = `http://127.0.0.1:${PORT}/store`;
const CFT = process.env.PKT_CFT ||
  path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64',
    'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const QA = path.join(STORE, 'media-kit', 'qa');
const log = (...a) => console.log('[qa]', ...a);

async function main() {
  fs.mkdirSync(QA, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CFT, headless: true,
    args: ['--no-first-run', '--no-default-browser-check', '--hide-scrollbars'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });

  try {
    // ---- responsive + langues --------------------------------------------
    for (const [w, h] of [[1920, 1080], [1440, 900], [768, 1024], [390, 844]]) {
      for (const lang of ['fr', 'en']) {
        const page = await browser.newPage();
        await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
        await page.goto(`${BASE}/index.html?lang=${lang}`, { waitUntil: 'networkidle0' });
        await page.evaluate((l) => window.__pktSetLang(l), lang);
        await page.evaluate(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('on')));
        // scroll progressif : déclenche les images loading="lazy" avant la capture pleine page
        // (scroll-behavior:smooth désactivé sinon les sauts animés n'atteignent jamais le bas)
        await page.evaluate(async () => {
          const prev = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          const step = window.innerHeight / 2;
          for (let y = 0; y <= document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 120));
          }
          window.scrollTo(0, 0);
          await Promise.race([
            Promise.all(Array.from(document.images)
              .filter(img => !img.complete)
              .map(img => new Promise(r => { img.onload = img.onerror = r; }))),
            new Promise(r => setTimeout(r, 3000)),
          ]);
          document.documentElement.style.scrollBehavior = prev;
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(QA, `landing-${w}-${lang}.png`), fullPage: true });
        log(`landing ${w}px ${lang} OK`);
        await page.close();
      }
    }

    // ---- mouvement réduit : reveals visibles immédiatement ----------------
    {
      const page = await browser.newPage();
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 300));
      const hidden = await page.evaluate(() => Array.from(document.querySelectorAll('.reveal'))
        .filter(el => getComputedStyle(el).opacity !== '1').length);
      log('mouvement réduit — reveals masqués :', hidden, hidden === 0 ? '(OK)' : '(KO)');
      await page.screenshot({ path: path.join(QA, 'landing-reduced-motion.png') });
      await page.close();
    }

    // ---- sans JS : FR complet lisible, aucun CTA inactif ------------------
    {
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });
      // scroll via molette CDP (evaluate est inopérant sans JS dans la page)
      for (let i = 0; i < 30; i++) { await page.mouse.wheel({ deltaY: 500 }); await new Promise(r => setTimeout(r, 60)); }
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 300));
      await page.screenshot({ path: path.join(QA, 'landing-nojs-1440.png'), fullPage: true });
      const visibleFr = await page.evaluate(() => document.body.innerText.includes('Sélectionnez un mot'));
      log('sans JS — FR lisible :', visibleFr ? 'OK' : 'KO');
      await page.close();
    }

    // ---- clavier + bascule FR/EN mémorisée --------------------------------
    {
      const page = await browser.newPage();
      await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });
      const order = [];
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab');
        order.push(await page.evaluate(() => document.activeElement.id || document.activeElement.className || document.activeElement.tagName));
      }
      const outline = await page.evaluate(() => {
        const el = document.activeElement;
        return getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth;
      });
      log('ordre tabulation :', order.join(' → '), '| outline :', outline);
      await page.click('#btn-en');
      const state = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        title: document.title,
        stored: localStorage.getItem('pkt-lang'),
        h1: document.querySelector('h1').textContent.trim().slice(0, 24),
      }));
      log('bascule EN :', JSON.stringify(state));
      await page.reload({ waitUntil: 'networkidle0' });
      const persisted = await page.evaluate(() => document.documentElement.lang);
      log('persistance après reload :', persisted, persisted === 'en' ? '(OK)' : '(KO)');
      await page.close();
    }

    // ---- cartes store -----------------------------------------------------
    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 1200, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/media-kit/cards.html`, { waitUntil: 'networkidle0' });
    const out = {
      card: path.join(STORE, 'assets', 'card-1200x630.png'),
      tile: path.join(STORE, 'assets', 'cws-tile-440x280.png'),
      marquee: path.join(STORE, 'assets', 'cws-marquee-1400x560.png'),
    };
    for (const [id, file] of Object.entries(out)) {
      const el = await page.$(`#${id}`);
      await el.screenshot({ path: file });
      log(path.basename(file), 'OK');
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
