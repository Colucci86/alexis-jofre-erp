const puppeteer = require('puppeteer-core');

const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = process.env.BASE_URL || 'http://localhost:5180';

const results = [];
let consoleErrors = [];
let pageErrors = [];

function log(ok, msg) {
  results.push({ ok, msg });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BODY_CHECK = (token) => `document.body.innerText.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().includes(${JSON.stringify(token.toLowerCase())})`;

async function clickNav(page, token) {
  return page.evaluate((txt) => {
    const clean = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const target = clean(txt);
    const nodes = [...document.querySelectorAll('nav button')];
    const el = nodes.find((b) => clean(b.textContent).includes(target));
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

async function setReactInput(page, selector, value) {
  return page.evaluate(({ sel, val }) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, { sel: selector, val: value });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  let alertSeen = false;
  let alertMsg = '';
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('dialog', async (d) => {
    if (d.type() === 'alert') { alertSeen = true; alertMsg = d.message(); }
    await d.accept();
  });

  // ── Login ──────────────────────────────────────────────
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForFunction(BODY_CHECK('Iniciar Sesi'), { timeout: 15000 });
  await clickDemoRole(page, 'Administrador');
  await page.waitForFunction(BODY_CHECK('Panel'), { timeout: 20000 });
  log(true, 'Login as Administrador (lazy routes load)');

  // ── A. Dashboard: periodo selector reactivo + eventos próximos ──
  await page.waitForFunction(BODY_CHECK('Hola, Alexis'), { timeout: 20000 });
  const readPresupuestoCard = () => page.evaluate(() => {
    const cards = [...document.querySelectorAll('div')].filter((d) => {
      const t = d.className || '';
      return typeof t === 'string' && t.includes('rounded-xl') &&
        [...d.querySelectorAll('p')].some((p) => p.textContent.trim() === 'Presupuestos');
    });
    if (cards.length === 0) return null;
    const h3 = cards[0].querySelector('h3');
    return h3 ? h3.textContent.trim() : null;
  });

  const clickPeriod = async (label) => {
    return page.evaluate((l) => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(l));
      if (!btn) return false;
      btn.click();
      return true;
    }, label);
  };

  await clickPeriod('Hoy');
  await sleep(400);
  const hoyNum = await readPresupuestoCard();
  await clickPeriod('Este año');
  await sleep(400);
  const yearNum = await readPresupuestoCard();
  log(/^\d+$/.test(hoyNum || '') && /^\d+$/.test(yearNum || ''), `Dashboard: periodo filters card numbers (Hoy=${hoyNum}, Ano=${yearNum})`);

  const hasOldEmptyMsg = await page.evaluate(BODY_CHECK('No hay visitas programadas hoy'));
  log(!hasOldEmptyMsg, 'Dashboard: old "visitas programadas hoy" message removed');

  // ── B. Obras: fecha/hora editables en modal Nueva Obra ──
  await clickNav(page, 'Obras');
  await page.waitForFunction(BODY_CHECK('Nueva Obra'), { timeout: 15000 });
  await clickButtonContaining(page, 'Nueva Obra');
  await sleep(600);
  const dateTimeInputs = await page.evaluate(() => {
    const dateEl = document.querySelector('input[type="date"]');
    const timeEl = document.querySelector('input[type="time"]');
    return { date: dateEl ? dateEl.value : null, time: timeEl ? timeEl.value : null };
  });
  log(!!dateTimeInputs.date && !!dateTimeInputs.time, `Obras: modal has editable Fecha (${dateTimeInputs.date}) y Hora (${dateTimeInputs.time})`);

  await page.evaluate(() => {
    const setV = (el, val) => {
      const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const dateEl = document.querySelector('input[type="date"]');
    const timeEl = document.querySelector('input[type="time"]');
    setV(dateEl, '2026-12-01');
    setV(timeEl, '10:45');

    const clienteSel = [...document.querySelectorAll('select')].find((s) => s.required && s.options.length > 1 && s.value === '');
    if (clienteSel) {
      const setterS = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setterS.call(clienteSel, clienteSel.options[1].value);
      clienteSel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const importeInput = [...document.querySelectorAll('input[type="number"]')].find((i) => i.required);
    if (importeInput) setV(importeInput, '5000');
    const desc = document.querySelector('textarea');
    if (desc) setV(desc, 'Obra de prueba de fecha');
  });
  await sleep(300);
  await clickButtonContaining(page, 'Crear Obra');
  await page.waitForFunction(() => document.body.innerText.includes('Obra #'), { timeout: 15000 });
  await sleep(500);
  const worksList = await page.evaluate(() => [...document.querySelectorAll('h4')].filter((h) => h.textContent.includes('Obra #')).map((h) => h.textContent.trim()));
  log(worksList.length > 0, `Obras: obra creada (lista: ${worksList[0] || 'n/a'})`);
  await page.evaluate(() => { const hs = [...document.querySelectorAll('h4')].filter((h) => h.textContent.includes('Obra #')); if (hs.length) hs[hs.length - 1].click(); });
  await sleep(700);
  const fichaHasDate = await page.evaluate(BODY_CHECK('2026-12-01'));
  const fichaHasTime = await page.evaluate(BODY_CHECK('10:45'));
  log(fichaHasDate && fichaHasTime, `Obras: ficha muestra fecha/hora elegidas (${fichaHasDate}/${fichaHasTime})`);

  // ── B2. Obras: bitácora con fecha/hora/foto + eliminar obra ──
  await clickButtonContaining(page, 'Bitácora de Progreso');
  await sleep(500);
  const bitacoraHas = await page.evaluate(() => ({
    fecha: !!document.querySelector('input[type="date"]'),
    hora: !!document.querySelector('input[type="time"]'),
    foto: !!document.querySelector('input[type="url"]'),
    lapices: [...document.querySelectorAll('button[title="Corregir fecha/hora"]')].length,
  }));
  log(bitacoraHas.fecha && bitacoraHas.hora && bitacoraHas.foto && bitacoraHas.lapices > 0,
    `Obras: bitácora con fecha/hora/foto y edición de entrada (fecha=${bitacoraHas.fecha}, hora=${bitacoraHas.hora}, foto=${bitacoraHas.foto}, lapices=${bitacoraHas.lapices})`);
  const hasEliminarObra = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Eliminar Obra')));
  log(hasEliminarObra, 'Obras: botón Eliminar Obra presente en el detalle');

  // ── C. Presupuestos: validación Efectivo + Canje = subtotal ──
  await clickNav(page, 'Presupuestos');
  await page.waitForFunction(BODY_CHECK('Nuevo Presupuesto'), { timeout: 15000 });
  await clickButtonContaining(page, 'Nuevo Presupuesto');
  await page.waitForFunction(() => document.body.innerText.includes('Continuar'), { timeout: 15000 });
  await clickButtonContaining(page, 'Continuar');

  await page.waitForFunction(() => document.querySelector('input[placeholder="Ítem personalizado..."]') !== null, { timeout: 15000 });
  await page.evaluate(() => {
    const setV = (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const form = [...document.querySelectorAll('form')].find((f) => f.querySelector('input[placeholder="Ítem personalizado..."]'));
    setV(form.querySelector('input[placeholder="Ítem personalizado..."]'), 'Item de prueba');
    const nums = form.querySelectorAll('input[type="number"]');
    setV(nums[1], '1000');
  });
  await sleep(200);
  await page.evaluate(() => {
    const form = [...document.querySelectorAll('form')].find((f) => f.querySelector('input[placeholder="Ítem personalizado..."]'));
    const submit = form.querySelector('button[type="submit"]');
    submit.click();
  });
  await sleep(500);
  const hasItem = await page.evaluate(() => document.body.innerText.includes('Item de prueba'));
  log(hasItem, 'Presupuestos: item agregado en paso 2');
  await clickButtonContaining(page, 'Continuar');

  await page.waitForFunction(() => document.body.innerText.includes('Desglose de Pago'), { timeout: 15000 });
  await setReactInput(page, 'input[type="number"]', '500');

  const effInputs = await page.evaluate(() => {
    const nums = [...document.querySelectorAll('input[type="number"]')];
    return nums.map((n) => n.value);
  });
  // Cambiá efectivo a 500 (subtotal queda 1000) → indicador de faltante
  await page.evaluate(() => {
    const nums = [...document.querySelectorAll('input[type="number"]')];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(nums[0], '500');
    nums[0].dispatchEvent(new Event('input', { bubbles: true }));
    nums[0].dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(300);
  const faltaText = await page.evaluate(BODY_CHECK('Faltan $500'));
  log(faltaText, `Presupuestos: indicador en vivo muestra faltante (${faltaText})`);

  alertSeen = false;
  await clickButtonContaining(page, 'Generar Presupuesto');
  await sleep(600);
  log(alertSeen, 'Presupuestos: guardado bloqueado por alert si Efectivo+Canje != subtotal');

  await page.evaluate(() => {
    const nums = [...document.querySelectorAll('input[type="number"]')];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(nums[1], '500');
    nums[1].dispatchEvent(new Event('input', { bubbles: true }));
    nums[1].dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(300);
  const cubreText = await page.evaluate(BODY_CHECK('cubre el subtotal'));
  log(cubreText, `Presupuestos: indicador verde cuando cuadra (${cubreText})`);

  alertSeen = false;
  await clickButtonContaining(page, 'Generar Presupuesto');
  await sleep(800);
  const wizardClosed = await page.evaluate(() => !document.body.innerText.includes('Desglose de Pago'));
  log(!alertSeen && wizardClosed, `Presupuestos: se guarda sin alert con desglose correcto (alert=${alertSeen}, wizardClosed=${wizardClosed})`);
  const savedOk = await page.evaluate(() => document.body.innerText.includes('PRESUPUESTO') || document.body.innerText.includes('Cant.'));
  log(savedOk, 'Presupuestos: wizard se cerró y muestra el detalle creado');

  // ── C3. Presupuestos: etiqueta Eliminar + categorías compartidas + consolidación ──
  const hasEliminarLabel = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim().includes('Eliminar')));
  log(hasEliminarLabel, 'Presupuestos: botón Eliminar con etiqueta visible en el detalle');

  await clickButtonContaining(page, 'Nuevo Presupuesto');
  await sleep(600);
  const step1Cats = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .map((b) => b.textContent.trim())
      .filter((t) => ['Electricidad', 'Construcción en seco', 'Pintura', 'Remodelación', 'Plomería', 'Otro', 'Durlock', 'Gas', 'Albañilería'].includes(t))
  );
  const expectedCats = ['Electricidad', 'Construcción en seco', 'Pintura', 'Remodelación', 'Plomería', 'Otro'];
  const okCats = expectedCats.every((c) => step1Cats.includes(c)) && !['Durlock', 'Gas', 'Albañilería'].some((c) => step1Cats.includes(c));
  log(okCats, `Presupuestos: categorías únicas compartidas (${step1Cats.join(', ')})`);

  await clickButtonContaining(page, 'Continuar');
  await page.waitForFunction(() => document.querySelector('input[placeholder="Ítem personalizado..."]') !== null, { timeout: 15000 });
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      const setV = (el, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const form = [...document.querySelectorAll('form')].find((f) => f.querySelector('input[placeholder="Ítem personalizado..."]'));
      setV(form.querySelector('input[placeholder="Ítem personalizado..."]'), 'Consolidado X');
      const nums = form.querySelectorAll('input[type="number"]');
      setV(nums[0], '1');
      setV(nums[1], '100');
      form.querySelector('button[type="submit"]').click();
    });
    await sleep(500);
  }
  const consol = await page.evaluate(() => {
    const t = document.body.innerText;
    return t.includes('Consolidado X') && t.includes('Ítems (1)');
  });
  let qtyAfter = null;
  for (let k = 0; k < 12; k++) {
    qtyAfter = await page.evaluate(() => {
      // el div más profundo que contenga descripción y "x $100" es la fila del ítem
      const item = [...document.querySelectorAll('div')]
        .filter((d) => d.textContent.includes('Consolidado X') && d.textContent.includes('x $100'))
        .pop();
      if (!item) return null;
      const input = item.querySelector('input[type="number"]');
      return input ? input.value : null;
    });
    if (qtyAfter === '2') break;
    await sleep(300);
  }
  const qtyTextOk = await page.evaluate(() => document.body.innerText.includes('x $100'));
  log(consol && qtyTextOk && qtyAfter === '2', `Presupuestos: ítem duplicado consolidado en 1 línea (items(1) ok=${consol}, qtyTextOk=${qtyTextOk}, cantidad="${qtyAfter}")`);

  await clickButtonContaining(page, 'Atrás');
  await sleep(300);
  await clickButtonContaining(page, 'Cancelar');
  await sleep(300);

  // ── C2. PDF: librerías cargadas bajo demanda (jspdf/html2canvas) ──
  alertSeen = false; alertMsg = '';
  const pdfClicked = await clickButtonContaining(page, 'PDF');
  await sleep(6000);
  const pdfConsoleErr = consoleErrors.some((e) => e.includes('Error generando PDF') || e.toLowerCase().includes('jspdf') || e.toLowerCase().includes('html2canvas'));
  log(pdfClicked && !pdfConsoleErr && !alertMsg.includes('Ocurrió un error'),
    `Presupuestos: PDF generado con libs lazy (click=${pdfClicked}, consoleErr=${pdfConsoleErr}, alert="${alertMsg.slice(0, 40)}")`);

  // ── D. Cobros: borrado de transacciones ──
  await clickNav(page, 'Cobros');
  await page.waitForFunction(BODY_CHECK('Cobros y Finanzas'), { timeout: 15000 });
  const hasDeleteBtn = await page.evaluate(() => !!document.querySelector('button[title="Eliminar registro"]'));
  log(hasDeleteBtn, 'Cobros: botón de eliminar presente en la tabla');
  const rowsBefore = await page.evaluate(() => document.querySelectorAll('tr').length);
  await page.evaluate(() => { const btn = document.querySelector('button[title="Eliminar registro"]'); if (btn) btn.click(); });
  await sleep(900);
  const rowsAfter = await page.evaluate(() => document.querySelectorAll('tr').length);
  log(rowsBefore > rowsAfter, `Cobros: transacción eliminada de la fila (${rowsBefore} -> ${rowsAfter})`);

  // ── E. Proveedores: eliminación en UI ──
  await clickNav(page, 'Proveedores');
  await page.waitForFunction(BODY_CHECK('Selecciona un proveedor'), { timeout: 15000 });
  await page.evaluate(() => {
    const row = [...document.querySelectorAll('div')].find((d) => d.className.includes('cursor-pointer') && d.innerText.includes('Electricidad Mendoza') && !d.innerText.includes('Eliminar'));
    if (row) row.click();
  });
  await sleep(700);
  const hasEliminar = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Eliminar')));
  log(hasEliminar, 'Proveedores: botón Eliminar presente en la ficha');
  await clickButtonContaining(page, 'Eliminar');
  await sleep(900);
  const provDeleted = await page.evaluate(() => !document.body.innerText.includes('Electricidad Mendoza') || document.body.innerText.includes('Selecciona un proveedor'));
  log(provDeleted, 'Proveedores: proveedor eliminado y ficha reseteada');

  // ── F. Técnicos: editar y eliminar ──
  await clickNav(page, 'Tecnicos');
  await page.waitForFunction(BODY_CHECK('Tecnicos de Mantenimiento'), { timeout: 15000 });
  const hasEdit = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Editar')));
  const hasDel = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Eliminar') && !b.textContent.includes('Editar')));
  log(hasEdit && hasDel, `Tecnicos: botones Editar/Eliminar presentes (${hasEdit}/${hasDel})`);

  const newName = 'Editado' + Date.now();
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Editar')); if (b) b.click(); });
  await sleep(700);
  await setReactInput(page, 'input[placeholder="Ej: Carlos"]', newName);
  await clickButtonContaining(page, 'Guardar Cambios');
  await page.waitForFunction(BODY_CHECK(newName), { timeout: 10000 });
  log(true, `Tecnicos: técnico editado y visible (${newName})`);

  await page.evaluate((n) => {
    const h4 = [...document.querySelectorAll('h4')].find((h) => h.textContent.includes(n));
    if (!h4) return;
    let card = h4.parentElement;
    while (card && !String(card.className || '').includes('rounded-xl')) card = card.parentElement;
    if (!card) return;
    const btn = [...card.querySelectorAll('button')].find((b) => b.textContent.includes('Eliminar') && !b.textContent.includes('Editar'));
    if (btn) btn.click();
  }, newName);
  await sleep(900);
  const techDeleted = await page.evaluate((n) => !document.body.innerText.includes(n), newName);
  log(techDeleted, `Tecnicos: técnico eliminado de la lista (${techDeleted})`);

  // ── G. Servicios: página propia con categorías normalizadas ──
  await clickNav(page, 'Servicios');
  await page.waitForFunction(BODY_CHECK('Tarifario de Servicios'), { timeout: 15000 });
  await clickButtonContaining(page, 'Nuevo Servicio');
  await sleep(700);
  const catValues = await page.evaluate(() => {
    const label = [...document.querySelectorAll('label')].find((l) => l.textContent.includes('Categor'));
    if (!label) return [];
    const select = label.parentElement.querySelector('select');
    return [...select.options].map((o) => o.value);
  });
  const allTitleCase = catValues.length > 0 && catValues.every((v) => /^[A-ZÁÉÍÓÚÑ]/.test(v));
  log(allTitleCase && catValues.includes('Mantenimiento General'), `Servicios: categorías en mayúsculas (${JSON.stringify(catValues.slice(0, 4))}...)`);
  // close modal via X (scoped al modal abierto)
  await page.evaluate(() => {
    const overlay = [...document.querySelectorAll('div')].find((d) => (d.className || '').includes('fixed inset-0'));
    if (!overlay) return;
    const x = [...overlay.querySelectorAll('button')].find((b) => b.textContent.trim() === '');
    if (x) x.click();
  });
  await sleep(300);

  // ── G2. Stock: solo productos, sin pestaña de servicios ──
  await clickNav(page, 'Stock');
  await page.waitForFunction(BODY_CHECK('Gestion de Stock'), { timeout: 15000 });
  const stockOnlyProducts = await page.evaluate(() => {
    const scope = document.querySelector('main') || document;
    const btns = [...scope.querySelectorAll('button')].map((b) => b.textContent.trim());
    return {
      ok: !btns.some((b) => b === 'Servicios') && btns.some((b) => b.includes('Nuevo Producto')),
      btns: [...new Set(btns)].slice(0, 10),
    };
  });
  log(stockOnlyProducts.ok, `Stock: solo productos (sin tab Servicios) [${JSON.stringify(stockOnlyProducts.btns)}]`);

  // ── Summary ──
  console.log('\n==== CONSOLE ERRORS ====');
  console.log(`(total=${consoleErrors.length}, unique=${[...new Set(consoleErrors)].length})`);
  console.log([...new Set(consoleErrors)].join('\n'));
  console.log('==== PAGE ERRORS (uncaught) ====');
  console.log(`(total=${pageErrors.length})`);
  [...new Set(pageErrors)].forEach((e) => console.log(e));

  const failed = results.filter((r) => !r.ok);
  console.log(`\nVERIFY CORRECTIONS DONE: ${results.length - failed.length}/${results.length} checks passed`);
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error('FATAL:', err);
  process.exit(2);
});