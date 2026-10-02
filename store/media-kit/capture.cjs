// Capture réelle de l'extension PK Traduction dans Chrome for Testing.
// Profil jetable, données fictives (voir demo-article.html). Aucune donnée perso.
//
// Variables d'environnement :
//   PKT_ROOT : racine du repo (défaut : ../.. relatif à ce script)
//   PKT_CFT  : binaire Chrome for Testing / Chromium (support --load-extension)
//   PKT_PORT : port du serveur HTTP local (défaut 4179)
//   PKT_FRAMES : dossier de sortie des frames GIF (défaut : tmp/pktrad-capture/frames)
//
// Sorties :
//   store/screenshots/01-selection-popup.png   (1280x800, via downscale dsf2)
//   store/screenshots/02-substitution.png
//   store/screenshots/03-page-traduite.png
//   store/screenshots/04-page-origine.png
//   frames brutes 1280x800 dsf1 pour la boucle GIF -> PKT_FRAMES/0000.png...

const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require(path.join(os.tmpdir(), 'opencode', 'pktrad-capture', 'node_modules', 'puppeteer-core'));

const PKT_ROOT = process.env.PKT_ROOT || path.resolve(__dirname, '..', '..');
const SRC = path.join(PKT_ROOT, 'src');
const STORE = path.join(PKT_ROOT, 'store');
const PORT = process.env.PKT_PORT || '4179';
const PAGE_URL = `http://127.0.0.1:${PORT}/store/media-kit/demo-article.html`;
const CFT = process.env.PKT_CFT ||
  path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64',
    'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const FRAMES = process.env.PKT_FRAMES || path.join(os.tmpdir(), 'opencode', 'pktrad-capture', 'frames');

const log = (...a) => console.log('[capture]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function findServiceWorker(browser, timeoutMs = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const t = browser.targets().find(t => t.type() === 'service_worker' && t.url().startsWith('chrome-extension://'));
    if (t) return t;
    await sleep(250);
  }
  throw new Error('Service worker de l\'extension introuvable');
}

// --- helpers exécutés DANS la page -----------------------------------------
function pageHelpers() {
  window.__locate = function (elId, phrase) {
    const el = document.getElementById(elId);
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let n, full = '';
    while ((n = walker.nextNode())) full += n.textContent;
    const gs = full.indexOf(phrase);
    if (gs < 0) return { found: false };
    const ge = gs + phrase.length;
    const walker2 = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let acc = 0, startN = null, startO = 0, endN = null, endO = 0;
    while ((n = walker2.nextNode())) {
      const len = n.textContent.length;
      if (!startN && gs < acc + len) { startN = n; startO = gs - acc; }
      if (ge <= acc + len) { endN = n; endO = ge - acc; break; }
      acc += len;
    }
    const range = document.createRange();
    range.setStart(startN, startO);
    range.setEnd(endN, endO);
    const rects = Array.from(range.getClientRects()).filter(r => r.width > 0);
    return {
      found: true,
      multiLine: rects.length > 1,
      x1: rects[0].left, y1: rects[0].top,
      x2: rects[rects.length - 1].right, y2: rects[rects.length - 1].bottom,
    };
  };
  window.__popup = function () {
    const els = Array.from(document.querySelectorAll('div'))
      .filter(d => d.style.zIndex === '10000');
    if (!els.length) return { present: false };
    const d = els[els.length - 1];
    return { present: true, loading: d.textContent.includes('Traduction en cours'), text: d.textContent.trim() };
  };
}

async function getPhraseInfo(page, elId, phrase) {
  return page.evaluate((id, p) => window.__locate(id, p), elId, phrase);
}

async function selectWithMouse(page, info, onFrame) {
  await page.mouse.move(info.x1, info.y1 + 2);
  if (onFrame) await onFrame();
  await page.mouse.down();
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(info.x1 + (info.x2 - info.x1) * i / steps, info.y2 - 2, { steps: 1 });
    if (onFrame) await onFrame();
  }
  await page.mouse.up();
}

function injectCursor(page) {
  return page.evaluate(() => {
    const c = document.createElement('div');
    c.id = 'pkt-cursor';
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15.5 L12.5 22 L15 20.6 L11.6 14.5 L18 14 Z" fill="#111" stroke="#fff" stroke-width="1.4"/></svg>';
    c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));';
    document.body.appendChild(c);
    window.__cursorTo = (x, y) => { c.style.transform = `translate(${x}px, ${y}px)`; };
  });
}

const POPUP_SELECTOR_FN = () => {
  const els = Array.from(document.querySelectorAll('div')).filter(d => d.style.zIndex === '10000');
  return els.length > 0;
};

async function main() {
  fs.mkdirSync(path.join(STORE, 'screenshots'), { recursive: true });
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode', 'pkt-profile-'));

  const browser = await puppeteer.launch({
    executablePath: CFT,
    headless: true,
    userDataDir: profile,
    args: [
      `--load-extension=${SRC}`,
      `--disable-extensions-except=${SRC}`,
      '--no-first-run', '--no-default-browser-check', '--disable-sync',
      '--disable-features=Translate,ChromeWhatsNewUI',
      '--hide-scrollbars',
      '--window-size=1280,800',
    ],
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
  });

  try {
    // --- extension : service worker ---------------------------------------
    const swTarget = await findServiceWorker(browser);
    const worker = await swTarget.worker();
    const extOrigin = 'chrome-extension://' + new URL(swTarget.url()).host;
    log('extension chargée :', extOrigin);

    // --- page démo ---------------------------------------------------------
    const page = await browser.newPage();
    await page.goto(PAGE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(pageHelpers);

    // id de l'onglet via chrome.tabs dans le SW (sans permission "tabs" :
    // query({url}) renverrait vide — on passe par l'onglet actif)
    const tabId = await worker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs.length ? tabs[0].id : null;
    });
    if (!tabId) throw new Error('onglet introuvable depuis le SW');
    log('tab id :', tabId);

    // phrase sur une seule ligne pour la sélection souris
    const CANDIDATES = [
      ['p3', 'The beam crosses the water every seven seconds'],
      ['p3', 'The beam crosses the water'],
      ['p3', 'every seven seconds, night after night'],
      ['p1', 'The road ends at the last farm gate'],
      ['p1', 'The road ends at the last farm gate, and the rest'],
    ];
    let sel = null, selEl = null;
    for (const [el, ph] of CANDIDATES) {
      const info = await getPhraseInfo(page, el, ph);
      if (info.found && !info.multiLine) { sel = info; selEl = el; log(`phrase retenue [${el}] "${ph}"`); break; }
      if (info.found) log(`phrase multi-lignes écartée : "${ph}"`);
    }
    if (!sel) throw new Error('aucune phrase sur une seule ligne');
    await page.evaluate((el) => document.getElementById(el).scrollIntoView({ block: 'center' }), selEl);
    await sleep(300);
    sel = await getPhraseInfo(page, selEl, CANDIDATES.find(c => c[0] === selEl)[1]);

    // --- scène 1 : popup de traduction (capture réelle) --------------------
    log('scène 1 : sélection → popup');
    await selectWithMouse(page, sel);
    await page.waitForFunction(() => {
      const els = Array.from(document.querySelectorAll('div')).filter(d => d.style.zIndex === '10000');
      return els.some(d => !d.textContent.includes('Traduction en cours') && d.textContent.trim().length > 0);
    }, { timeout: 30000 });
    await sleep(400);
    await page.screenshot({ path: path.join(STORE, 'screenshots', '01-selection-popup.png') });
    const popText = (await page.evaluate(() => window.__popup())).text;
    log('popup :', JSON.stringify(popText));

    // --- scène 2 : substitution directe ------------------------------------
    log('scène 2 : substitution');
    await worker.evaluate(async () => {
      await chrome.storage.sync.set({ autoTranslate: true, substituteTranslate: true, targetLanguage: 'fr' });
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.evaluate(pageHelpers);
    await page.evaluate((el) => document.getElementById(el).scrollIntoView({ block: 'center' }), 'p2');
    await sleep(300);
    const subPhrases = [
      ['p2', 'The tower was built in 1864 by a shipping company'],
      ['p2', 'The tower was built in 1864'],
      ['p2', 'by a shipping company that no longer exists'],
    ];
    let sub = null;
    for (const [el, ph] of subPhrases) {
      const info = await getPhraseInfo(page, el, ph);
      if (info.found && !info.multiLine) { sub = info; log(`substitution sur [${el}] "${ph}"`); break; }
    }
    if (!sub) throw new Error('phrase de substitution introuvable sur une ligne');
    const beforeText = await page.evaluate((el) => document.getElementById(el).textContent, 'p2');
    await selectWithMouse(page, sub);
    await page.waitForFunction((before) => {
      const el = document.getElementById('p2');
      return !el.textContent.includes('Traduction en cours') && el.textContent.trim() !== before;
    }, { timeout: 30000 }, beforeText);
    await sleep(300);
    await page.screenshot({ path: path.join(STORE, 'screenshots', '02-substitution.png') });
    log('substitution OK :', (await page.evaluate((el) => document.getElementById(el).textContent, 'p2')).trim().slice(0, 80), '…');

    // --- scène 3/4 : traduction de page ------------------------------------
    log('scènes 3/4 : traduction de page');
    await worker.evaluate(async () => {
      await chrome.storage.sync.set({ autoTranslate: true, substituteTranslate: false, targetLanguage: 'fr' });
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.evaluate(pageHelpers);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);
    await page.screenshot({ path: path.join(STORE, 'screenshots', '04-page-origine.png') });
    await worker.evaluate(async (tab) => {
      await chrome.tabs.sendMessage(tab, { action: 'translatePage' });
    }, tabId);
    await page.waitForFunction(() => {
      const t = document.body.innerText.toLowerCase();
      return !t.includes('the road ends at the last farm gate') && !t.includes('seven seconds') && t.length > 200;
    }, { timeout: 90000, polling: 500 });
    await sleep(600);
    await page.screenshot({ path: path.join(STORE, 'screenshots', '03-page-traduite.png') });
    log('page traduite OK');

    // --- scène 5 : boucle GIF (frames réelles, curseur synthétique) --------
    log('scène 5 : boucle GIF');
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.evaluate(pageHelpers);
    await page.evaluate((el) => document.getElementById(el).scrollIntoView({ block: 'center' }), selEl);
    await sleep(300);
    sel = await getPhraseInfo(page, selEl, CANDIDATES.find(c => c[0] === selEl)[1]);
    await injectCursor(page);

    let frame = 0;
    const shoot = async () => {
      const name = String(frame).padStart(4, '0') + '.png';
      await page.screenshot({ path: path.join(FRAMES, name) });
      frame++;
    };

    // 1. curseur entre depuis la droite
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      await page.evaluate((x, y) => window.__cursorTo(x, y),
        1100 + (sel.x1 - 1100) * t, 640 + (sel.y1 - 640) * t);
      await shoot();
    }
    // 2. drag de sélection
    await page.mouse.move(sel.x1, sel.y1 + 2);
    await page.evaluate((x, y) => window.__cursorTo(x, y), sel.x1, sel.y1 + 2);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      const x = sel.x1 + (sel.x2 - sel.x1) * i / 12;
      await page.mouse.move(x, sel.y2 - 2, { steps: 1 });
      await page.evaluate((cx, cy) => window.__cursorTo(cx, cy), x, sel.y2 - 2);
      await shoot();
    }
    await page.mouse.up();
    for (let i = 0; i < 6; i++) await shoot(); // sélection posée
    // 3. spinner réel
    await page.waitForFunction(POPUP_SELECTOR_FN, { timeout: 15000 });
    for (let i = 0; i < 14; i++) await shoot();
    // 4. popup final
    await page.waitForFunction(() => {
      const els = Array.from(document.querySelectorAll('div')).filter(d => d.style.zIndex === '10000');
      return els.some(d => !d.textContent.includes('Traduction en cours') && d.textContent.trim().length > 0);
    }, { timeout: 30000 });
    for (let i = 0; i < 24; i++) await shoot();
    // 5. clic dehors → reset propre
    const endX = 1000, endY = 700;
    for (let i = 1; i <= 10; i++) {
      await page.evaluate((x, y) => window.__cursorTo(x, y),
        sel.x2 + (endX - sel.x2) * i / 10, sel.y2 + (endY - sel.y2) * i / 10);
      await shoot();
    }
    await page.mouse.click(endX, endY);
    await page.waitForFunction(() => !window.__popup().present, { timeout: 5000 });
    for (let i = 0; i < 8; i++) await shoot();
    log(`frames : ${frame}`);

    // --- exports ------------------------------------------------------------
    log('export MP4 + GIF');
    await exportMedia();
    log('terminé.');
  } finally {
    await browser.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

async function exportMedia() {
  const { execFileSync } = require('child_process');
  const mp4 = path.join(STORE, 'videos', 'demo.mp4');
  fs.mkdirSync(path.join(STORE, 'videos'), { recursive: true });
  fs.mkdirSync(path.join(STORE, 'gifs'), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-framerate', '12', '-i', path.join(FRAMES, '%04d.png'),
    '-vf', 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720',
    '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  execFileSync('ffmpeg', ['-y', '-i', mp4,
    '-vf', 'fps=12,scale=960:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer',
    path.join(STORE, 'gifs', 'demo-wide.gif')]);
  execFileSync('ffmpeg', ['-y', '-i', mp4,
    '-vf', 'fps=10,scale=480:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer',
    path.join(STORE, 'gifs', 'demo-compact.gif')]);
}

main().catch((e) => { console.error(e); process.exit(1); });
