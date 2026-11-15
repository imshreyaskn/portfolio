// Renders scripts/og/og-card.html to public/og-image.jpg (1200×630) with a
// local headless Chrome/Edge, then compresses it with sharp.
// Run: node scripts/og/render.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import sharp from 'sharp';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = pathToFileURL(path.join(here, 'og-card.html')).href;
const out = path.resolve(here, '../../public/og-image.jpg');
const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'og-'));
const png = path.join(tmpDir, 'og.png');

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = candidates.find((p) => existsSync(p));
if (!browser) {
  console.error('No Chrome/Edge found. Set CHROME_PATH to a Chromium-based browser.');
  process.exit(1);
}

execFileSync(browser, [
  '--headless=new',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1200,630',
  '--allow-file-access-from-files',
  // Gives the Google Fonts request time to land before the screenshot.
  '--virtual-time-budget=8000',
  `--screenshot=${png}`,
  html,
], { stdio: 'ignore' });

// JPEG keeps the portrait's gradients smooth at a fraction of the PNG size.
await sharp(png).jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(out);
rmSync(tmpDir, { recursive: true, force: true });

console.log(`wrote ${out} (${Math.round(statSync(out).size / 1024)} KB)`);
