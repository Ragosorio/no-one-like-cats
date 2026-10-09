// Headless visual/perf harness for rupturas.html (real GPU via ANGLE Metal on macOS).
// Setup (dev only, not a dependency):  npm i --no-save puppeteer-core@24
// Run: npx vite --port 5191 --strictPort  then  node scripts/headless-shot.mjs steps.json out/
// steps.json: { "url": "http://127.0.0.1:5191/rupturas.html", "do": [{"eval":"window.__rupturas.setHour(23)","wait":2000,"shot":"night"}] }
// Screenshots are PNG: keep them OUTSIDE the repo (raster never lands in git).
// usage: node shot.mjs <script.json>  — drives part2.html in headless Chrome and takes screenshots
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const steps = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] ?? '.';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  userDataDir: process.env.PROFILE_DIR ?? "/tmp/nolc-rupturas-profile",
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--window-size=1600,900', '--disable-gpu-vsync', '--disable-frame-rate-limit'],
  defaultViewport: { width: 1600, height: 900 },
  protocolTimeout: 600000,
});
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(steps.url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__rupturas?.ready?.(), { timeout: 180000 });
const gl = await page.evaluate(() => {
  const c = document.createElement('canvas').getContext('webgl2');
  const e = c.getExtension('WEBGL_debug_renderer_info');
  return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'n/a';
});
console.log('GL:', gl);
for (const s of steps.do) {
  if (s.eval) {
    const r = await page.evaluate(s.eval);
    if (r !== undefined) console.log(s.label ?? 'eval', JSON.stringify(r));
  }
  if (s.wait) await new Promise((r) => setTimeout(r, s.wait));
  if (s.click) await page.mouse.click(s.click[0], s.click[1]);
  if (s.clickEval) {
    const xy = await page.evaluate(s.clickEval);
    console.log('click at', JSON.stringify(xy));
    if (xy) await page.mouse.click(xy[0], xy[1]);
  }
  if (s.shot) {
    await page.screenshot({ path: `${out}/${s.shot}.png` });
    console.log('shot', s.shot);
  }
}
console.log(logs.filter((l) => !l.includes('[vite]')).slice(0, 30).join('\n'));
await browser.close();
