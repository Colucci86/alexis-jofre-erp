const puppeteer = require('puppeteer-core');

const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = process.env.BASE_URL || 'http://localhost:5180';
const NAV_TOKENS = {
  dashboard: 'Inicio', agenda: 'Agenda', clientes: 'Clientes', presupuestos: 'Presupuestos',
  obras: 'Obras', cobros: 'Cobros', stock: 'Stock', servicios: 'Servicios', proveedores: 'Proveedores',
  tecnicos: 'ecnicos', estadisticas: 'Estad', configuracion: 'Configurac',
};

const results = [];
let consoleErrors = [];
let consoleWarns = [];
let pageErrors = [];
let failedRequests = [];

function log(ok, msg) {
  results.push({ ok, msg });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Body text helpers that run INSIDE the page (no outer scope deps)
const BODY_CHECK = (token) => `document.body.innerText.replace(/[\\u0300-\\u036f]/g, '').toLowerCase().includes(${JSON.stringify(token.toLowerCase())})`;

async function clickNav(page, token) {
  return page.evaluate((txt) => {
    const nodes = [...document.querySelectorAll('nav button')];
    const el = nodes.find((b) => b.textContent.includes(txt));
    if (!el) return false;
    el.click();
    return true;
  }, token);
}

async function clickButtonContaining(page, text) {
  return page.evaluate((txt) => {
    const nodes = [...document.querySelectorAll('button')];
    const el = nodes.find((b) => b.textContent.includes(txt));
    if (!el) return false;
    el.click();
    return true;
  }, text);
}

async function clickDemoRole(page, rol) {
  return page.evaluate((r) => {
    const clean = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const target = clean(r);
    const nodes = [...document.querySelectorAll('button')];
    const el = nodes.find((b) =>
      [...b.querySelectorAll('span')].some((s) => {
        if (!s.className.includes('font-bold')) return false;
        return clean(s.textContent.trim()) === target;
      })
    );
    if (!el) return false;
    el.click();
    return true;
  }, rol);
}

async function sidebarStrippedLabels(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('nav button')]
      .map((b) => b.textContent.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      .filter((t) => t.length > 0)
  );
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarns.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('requestfailed', (req) => failedRequests.push(req.url() + ' :: ' + (req.failure() || {}).errorText));
  page.on('dialog', async (d) => { console.log('DIALOG:', d.type(), d.message().slice(0, 120)); await d.accept(); });

  // 1. Login page renders with demo quick-auth
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForFunction(BODY_CHECK('Iniciar Sesi'), { timeout: 15000 });
  const hasDemo = await page.evaluate(() => {
    const clean = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const txt = [...document.querySelectorAll('button')].map((b) => clean(b.textContent));
    return ['Administrador', 'Administrativo', 'Tecnico'].every((r) => txt.some((t) => t.includes(r)));
  });
  log(hasDemo, `Login page renders with demo quick-auth (all 3 roles present: ${hasDemo})`);

  // 2. Login as Administrador
  await clickDemoRole(page, 'Administrador');
  await page.waitForFunction(BODY_CHECK('Panel'), { timeout: 15000 });
  log(true, 'Login as Administrador lands on Dashboard ("Panel")');

  let labels = await sidebarStrippedLabels(page);
  log(labels.length === 12, `Administrador sidebar shows 12 nav items (got: ${labels.length})`);

  // 3. CRUD smoke test on Clientes
  await clickNav(page, 'Clientes');
  await page.waitForFunction(() => document.querySelector('input[placeholder^="Buscar cliente"]') !== null, { timeout: 10000 });

  await clickButtonContaining(page, 'Nuevo');
  await page.waitForFunction(BODY_CHECK('Nombre Completo'), { timeout: 10000 });
  log(true, 'Nuevo Cliente modal opens');

  const uniq = 'SmokeTest' + Date.now();
  await page.type('input[placeholder^="Ej: Juan"]', uniq);
  await page.type('input[placeholder^="Ej: 2616"]', '2616000000');

  await clickButtonContaining(page, 'Guardar Cliente');
  await page.waitForFunction(BODY_CHECK(uniq), { timeout: 10000 });
  log(true, `Cliente created and visible in list: "${uniq}"`);

  await page.evaluate((name) => {
    const row = [...document.querySelectorAll('h4')].find((h) => h.textContent.trim() === name);
    if (row) row.click();
  }, uniq);
  await page.waitForFunction((name) => {
    const h = [...document.querySelectorAll('h3')].find((el) => el.textContent.trim() === name);
    return !!h;
  }, { timeout: 10000 }, uniq);
  await clickButtonContaining(page, 'Eliminar');
  await page.waitForFunction((name) => !document.body.innerText.includes(name), { timeout: 10000 }, uniq);
  log(true, `Cliente deleted and removed from DOM: "${uniq}"`);

  // 4. Navigate every module (Administrador) - track runtime errors
  for (const nav of Object.keys(NAV_TOKENS)) {
    const prevErr = consoleErrors.length;
    await clickNav(page, NAV_TOKENS[nav]);
    await sleep(900);
    const errAfter = consoleErrors.length;
    log(errAfter === prevErr, `Navigate to ${nav} (runtime errors during render: ${errAfter - prevErr})`);
  }

// 5. Universal search dropdown
  await clickNav(page, 'Inicio');
  await page.waitForFunction(BODY_CHECK('Panel'), { timeout: 10000 });
  await page.type('input[placeholder="Buscar..."]', 'Alexis');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('div')].some((d) =>
      d.className && String(d.className).includes('absolute') &&
      d.textContent.includes('Resultados de b')
    ), { timeout: 8000 }).catch(() => {});
  const searchVisible = await page.evaluate(() =>
    [...document.querySelectorAll('div')].some((d) =>
      d.className && String(d.className).includes('absolute') &&
      d.textContent.includes('Resultados de b')
    )
  );
  const inputValue = await page.evaluate(() => document.querySelector('input[placeholder="Buscar..."]').value);
  log(searchVisible, `Universal search dropdown appears (visible: ${searchVisible}, typed: "${inputValue}")`);
  await page.keyboard.press('Escape');

  // 6. Logout & login as Tecnico
  await page.click('button[title^="Cerrar sesi"]');
  await page.waitForFunction(BODY_CHECK('Iniciar Sesi'), { timeout: 10000 });
  await clickDemoRole(page, 'Tecnico');
  await page.waitForFunction(BODY_CHECK('Agenda'), { timeout: 15000 });
  labels = await sidebarStrippedLabels(page);
  log(labels.length === 3 && labels.join(',') === 'Agenda,Obras,Stock',
    `Tecnico lands on Agenda, sidebar only 3 items (got: ${labels.join(',')})`);
  log(!labels.includes('Clientes') && !labels.includes('Configuracion'), 'Tecnico sidebar excludes Clientes/Configuracion');

  // 7. Logout & login as Administrativo
  await page.click('button[title^="Cerrar sesi"]');
  await page.waitForFunction(BODY_CHECK('Iniciar Sesi'), { timeout: 10000 });
  await clickDemoRole(page, 'Administrativo');
  await page.waitForFunction(BODY_CHECK('Panel'), { timeout: 15000 });
  labels = await sidebarStrippedLabels(page);
  log(labels.length === 10, `Administrativo sidebar has 10 items (got: ${labels.length} -> ${labels.join(',')})`);

  // 8. Summary
  console.log('\n==== CONSOLE ERRORS ====');
  [...new Set(consoleErrors)].slice(0, 25).forEach((e) => console.log('  ', e.slice(0, 300)));
  console.log(`(total=${consoleErrors.length}, unique=${new Set(consoleErrors).size})`);
  console.log('\n==== PAGE ERRORS (uncaught) ====');
  [...new Set(pageErrors)].slice(0, 25).forEach((e) => console.log('  ', e.slice(0, 300)));
  console.log(`(total=${pageErrors.length})`);
  console.log('\n==== CONSOLE WARNINGS ====');
  [...new Set(consoleWarns)].slice(0, 25).forEach((e) => console.log('  ', e.slice(0, 300)));
  console.log(`(total=${consoleWarns.length}, unique=${new Set(consoleWarns).size})`);
  console.log('\n==== FAILED REQUESTS ====');
  failedRequests.slice(0, 20).forEach((e) => console.log('  ', e));
  console.log(`(total=${failedRequests.length})`);

  const fails = results.filter((r) => !r.ok).length;
  console.log(`\nSMOKE TEST DONE: ${results.length - fails}/${results.length} checks passed`);
  await browser.close();
  process.exit(fails > 0 ? 1 : 0);
})().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(2);
});
