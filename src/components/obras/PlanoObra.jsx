import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Upload, Trash2, ZoomIn, ZoomOut, Maximize2, Palette, CheckCircle2,
  Circle, Pencil, X, History, FileUp, Loader2, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  guardarPlanoObra, fetchPlanoObra, crearPunto, actualizarPunto, borrarPunto, eliminarPlanoObra,
} from '../../services/planosService';

const TIPOS_PUNTO = ['Toma', 'Luminaria', 'Interruptor', 'Tablero', 'Punto de luz', 'Bocina', 'Otro'];
const COLOR_POR_DEFECTO = '#9CA3AF';
const GRIS_PENDIENTE = '#9CA3AF';

let pdfjsCargado = null;

/** Carga perezosa de pdf.js (chunk aparte) + worker compatible con Vite. */
async function cargarPdfjs() {
  if (!pdfjsCargado) {
    pdfjsCargado = (async () => {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).href;
      return pdfjs;
    })();
  }
  return pdfjsCargado;
}

function hexDesdeRgb(r, g, b) {
  return `#${[r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

/** Percibe si un color es "coloreado" (no gris/negro/blanco) para descartar el muro. */
function esColorMarcado(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max < 90) return false;            // negro o muy oscuro
  if (min > 235) return false;           // blanco
  return max - min > 28;                 // gris puro => no es un circuito
}

/** Etiquetas quick para un color circuito (aproximación por tono). */
function nombreColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (Math.max(r, g, b) - Math.min(r, g, b) < 28) return 'Gris';
  if (b > r + 45 && b > g + 25) return 'Azul';
  if (r > g + 45 && g > b + 45) return 'Amarillo';
  if (r > 150 && g > 60 && b < 90) return 'Naranja';
  if (g > r + 40 && g > b + 40) return 'Verde';
  if (r > 120 && b > 100 && g < r - 30) return 'Magenta';
  if (r > 150 && g > 150 && b > 150) return 'Gris claro';
  return 'Circuito';
}

export default function PlanoObra({ obra }) {
  const { user, config } = useApp();
  const usuarioNombre = user?.nombre || config?.titular || 'Sistema';

  const [plano, setPlano] = useState(null);
  const [puntos, setPuntos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const [pagina, setPagina] = useState(1);
  const [paginasTotal, setPaginasTotal] = useState(1);
  const [enColor, setEnColor] = useState(false);
  const [escala, setEscala] = useState(1);
  const [desplazamiento, setDesplazamiento] = useState({ x: 0, y: 0 });
  const [agregando, setAgregando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [renderizando, setRenderizando] = useState(false);
  const [medidas, setMedidas] = useState(null);

  const canvasRef = useRef(null);
  const contenedorRef = useRef(null);
  const capaRef = useRef(null);
  const pdfRef = useRef(null);
  const aspectoRef = useRef(1.414);
  const escalaRenderRef = useRef(1);
  const punterosRef = useRef(new Map());
  const arrastreRef = useRef(null);

  const puntosPagina = useMemo(
    () => puntos.filter(p => (p.pagina || 1) === pagina),
    [puntos, pagina],
  );
  const hechos = useMemo(() => puntos.filter(p => p.hecho).length, [puntos]);
  const avance = puntos.length ? Math.round((hechos / puntos.length) * 100) : 0;

  // ─── Carga inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError('');
    fetchPlanoObra(obra.id)
      .then(data => {
        if (!vigente) return;
        setPlano(data);
        setPuntos(data?.puntos || []);
        setEventos(data?.eventos || []);
      })
      .catch(err => vigente && setError(err.message || 'No se pudo leer el plano.'))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [obra.id]);

  // ─── Subir / reemplazar PDF ──────────────────────────────────────────────────
  const handleSubir = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSubiendo(true);
    setError('');
    try {
      const { paginas: pgs } = await leerPaginasPdf(file);
      const guardado = await guardarPlanoObra(obra.id, file, {
        paginas: pgs,
        usuarioId: user?.id || null,
      });
      setPlano(guardado);
      setPuntos([]);
      setEventos([]);
      setPagina(1);
      setPaginasTotal(pgs);
      setEscala(1);
      setDesplazamiento({ x: 0, y: 0 });
    } catch (err) {
      setError(err.message || 'No se pudo subir el plano.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleQuitarPlano = async () => {
    if (!window.confirm('¿Quitar el plano de esta obra? Se borran los puntos cargados.')) return;
    setSubiendo(true);
    try {
      await eliminarPlanoObra(plano.id, { archivoPath: plano.archivoPath, obraId: obra.id });
      setPuntos([]);
      setEventos([]);
      setPlano(null);
      setPaginasTotal(1);
      setSeleccionado(null);
    } catch (err) {
      setError(err?.message || 'No se pudo quitar el plano.');
    } finally {
      setSubiendo(false);
    }
  };

  // ─── Render del PDF ──────────────────────────────────────────────────────────
  useEffect(() => {
    let vigente = true;
    async function abrir() {
      if (!plano?.archivoUrl) return;
      try {
        setRenderizando(true);
        const pdfjs = await cargarPdfjs();
        if (pdfRef.current) {
          try { await pdfRef.current.destroy(); } catch { /* ignorar */ }
          pdfRef.current = null;
        }
        const doc = await pdfjs.getDocument({ url: plano.archivoUrl, withCredentials: false }).promise;
        if (!vigente) return;
        pdfRef.current = doc;
        setPaginasTotal(doc.numPages);
        setPagina(prev => Math.min(prev, doc.numPages));
        const primera = await doc.getPage(1);
        const vp = primera.getViewport({ scale: 1 });
        if (vigente) aspectoRef.current = vp.width / vp.height;
      } catch (err) {
        if (vigente) setError('No se pudo abrir el PDF del plano.');
      }
    }
    abrir();
    return () => { vigente = false; };
  }, [plano?.archivoUrl]);

  /** Tamaño en pantalla de la página (ya ajustada al contenedor). El zoom es un transform CSS. */
  const calcularMedidas = useCallback(() => {
    const cont = contenedorRef.current;
    if (!cont) return;
    const rel = cont.getBoundingClientRect();
    if (!rel.width || !rel.height) return;
    const dispAncho = Math.max(220, rel.width - 20);
    const dispAlto = Math.max(160, rel.height - 20);
    const aspecto = aspectoRef.current || 1.414;
    let ancho = dispAncho;
    let alto = ancho / aspecto;
    if (alto > dispAlto) {
      alto = dispAlto;
      ancho = alto * aspecto;
    }
    setMedidas(prev => (
      prev && Math.abs(prev.ancho - ancho) < 1 && Math.abs(prev.alto - alto) < 1
        ? prev
        : { ancho, alto }
    ));
  }, []);

  useEffect(() => {
    const cont = contenedorRef.current;
    if (!cont) return undefined;
    calcularMedidas();
    const ro = new ResizeObserver(() => calcularMedidas());
    ro.observe(cont);
    return () => ro.disconnect();
  }, [calcularMedidas, plano?.id]);

  // Re-render cuando cambia la página, el zoom o el tamaño (con rebote para no trabar el dedo).
  useEffect(() => {
    if (!plano?.archivoUrl || !medidas) return undefined;
    const timer = setTimeout(() => { renderizarPagina(); }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plano?.archivoUrl, pagina, escala, medidas]);

  const renderizarPagina = useCallback(async () => {
    const doc = pdfRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas || !medidas) return;
    try {
      setRenderizando(true);
      const page = await doc.getPage(pagina);
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // resolución acorde al zoom (para que se vea nítido al acercarse), con tope de memoria
      const escalaRender = Math.min((medidas.ancho * escala * dpr) / base.width, 6000 / base.width);
      escalaRenderRef.current = escalaRender;
      const viewport = page.getViewport({ scale: escalaRender });
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, background: '#ffffff' }).promise;
    } catch (err) {
      console.warn('No se pudo dibujar la página del plano:', err?.message);
    } finally {
      setRenderizando(false);
    }
  }, [pagina, escala, medidas]);

  // ─── Muestreo del color del PDF ──────────────────────────────────────────────
  const colorEnPunto = useCallback((nx, ny) => {
    const canvas = canvasRef.current;
    if (!canvas) return COLOR_POR_DEFECTO;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const px = Math.round(nx * canvas.width);
    const py = Math.round(ny * canvas.height);
    const radio = Math.max(2, Math.round(canvas.width / 400));
    const x0 = Math.max(0, px - radio);
    const y0 = Math.max(0, py - radio);
    const w = Math.min(canvas.width - x0, radio * 2 + 1);
    const h = Math.min(canvas.height - y0, radio * 2 + 1);
    if (w <= 0 || h <= 0) return COLOR_POR_DEFECTO;
    const data = ctx.getImageData(x0, y0, w, h).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 248 && data[i + 1] > 248 && data[i + 2] > 248) continue; // ignore blanco
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
    if (!n) return COLOR_POR_DEFECTO;
    return hexDesdeRgb(r / n, g / n, b / n);
  }, []);

  // ─── Alta de puntos ──────────────────────────────────────────────────────────
  const agregarPunto = useCallback(async (nx, ny) => {
    const colorMuestreado = colorEnPunto(nx, ny);
    const color = esColorMarcado(colorMuestreado) ? colorMuestreado : COLOR_POR_DEFECTO;
    const n = puntos.length + 1;
    const punto = {
      pagina,
      etiqueta: `P${n}`,
      tipo: 'Toma',
      x: Number(nx.toFixed(5)),
      y: Number(ny.toFixed(5)),
      color,
      nota: '',
    };
    const temporal = { ...punto, id: `tmp-${Date.now()}`, hecho: false, marcadoPor: '', marcadoAt: null };
    setPuntos(prev => [...prev, temporal]);
    try {
      const guardado = await crearPunto(plano.id, punto, usuarioNombre, obra.id);
      setPuntos(prev => prev.map(p => (p.id === temporal.id ? guardado : p)));
      setEventos(prev => [{
        id: `tmp-ev-${Date.now()}`,
        accion: 'creado',
        detalle: `${punto.etiqueta} agregado al plano`,
        usuario: usuarioNombre,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      if (!esColorMarcado(colorMuestreado)) {
        setAviso('El punto quedó en gris: tocá una línea de color del plano para tomar su color.');
        setTimeout(() => setAviso(''), 5000);
      }
    } catch (err) {
      setPuntos(prev => prev.filter(p => p.id !== temporal.id));
      setError(err.message || 'No se pudo agregar el punto.');
    }
  }, [colorEnPunto, pagina, plano?.id, puntos.length, usuarioNombre]);

  // ─── Zoom / pan / tap sobre el plano ────────────────────────────────────────
  const clampEscala = useCallback(v => Math.min(6, Math.max(0.6, v)), []);

  const aplicarZoom = useCallback((factor, centro) => {
    setEscala(prev => {
      const siguiente = clampEscala(prev * factor);
      if (!centro) return siguiente;
      const cont = contenedorRef.current;
      if (!cont) return siguiente;
      const rect = cont.getBoundingClientRect();
      const cx = centro.x - rect.left - rect.width / 2;
      const cy = centro.y - rect.top - rect.height / 2;
      setDesplazamiento(d => ({
        x: cx - (cx - d.x) * (siguiente / prev),
        y: cy - (cy - d.y) * (siguiente / prev),
      }));
      return siguiente;
    });
  }, [clampEscala]);

  const ajustarAjuste = useCallback(() => {
    setEscala(1);
    setDesplazamiento({ x: 0, y: 0 });
  }, []);

  const onPointerDown = (e) => {
    punterosRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punterosRef.current.size === 2) {
      const [a, b] = [...punterosRef.current.values()];
      arrastreRef.current = {
        tipo: 'pinch',
        distancia: Math.hypot(a.x - b.x, a.y - b.y),
      };
      return;
    }
    arrastreRef.current = {
      tipo: 'posible-tap',
      x: e.clientX,
      y: e.clientY,
      desplazamiento: { ...desplazamiento },
      id: e.pointerId,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!punterosRef.current.has(e.pointerId)) return;
    punterosRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const arrastre = arrastreRef.current;
    if (!arrastre) return;

    if (arrastre.tipo === 'pinch' && punterosRef.current.size === 2) {
      const [a, b] = [...punterosRef.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (arrastre.distancia > 0) {
        setEscala(prev => clampEscala(prev * (dist / arrastre.distancia)));
        arrastre.distancia = dist;
      }
      return;
    }

    if (arrastre.tipo === 'posible-tap') {
      const dx = e.clientX - arrastre.x;
      const dy = e.clientY - arrastre.y;
      if (Math.hypot(dx, dy) > 7) arrastre.tipo = 'pan';
    }

    if (arrastre.tipo === 'pan') {
      setDesplazamiento({
        x: arrastre.desplazamiento.x + (e.clientX - arrastre.x),
        y: arrastre.desplazamiento.y + (e.clientY - arrastre.y),
      });
    }
  };

  const onPointerUp = (e) => {
    punterosRef.current.delete(e.pointerId);
    const arrastre = arrastreRef.current;
    if (!arrastre) return;
    if (arrastre.tipo === 'posible-tap' && arrastre.id === e.pointerId && capaRef.current) {
      const rect = capaRef.current.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1 && agregando) {
          agregarPunto(nx, ny);
        }
      }
    }
    if (punterosRef.current.size === 0) arrastreRef.current = null;
  };

  const onWheel = (e) => {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 4) return;
    e.preventDefault();
    aplicarZoom(e.deltaY < 0 ? 1.12 : 0.89, { x: e.clientX, y: e.clientY });
  };

  // ─── Edición de puntos ───────────────────────────────────────────────────────
  const alternarHecho = async (punto) => {
    const hecho = !punto.hecho;
    setPuntos(prev => prev.map(p => (p.id === punto.id
      ? { ...p, hecho, marcadoPor: hecho ? usuarioNombre : '', marcadoAt: hecho ? new Date().toISOString() : null }
      : p)));
    try {
      await actualizarPunto(punto.id, {
        hecho,
        marcadoPor: hecho ? usuarioNombre : '',
        marcadoAt: hecho ? new Date().toISOString() : null,
      }, {
        planoId: plano.id,
        usuarioNombre,
        obraId: obra.id,
        evento: {
          accion: hecho ? 'marcado' : 'desmarcado',
          detalle: `${punto.etiqueta} ${hecho ? 'completado' : 'vuelve a pendiente'}`,
        },
      });
      setEventos(prev => [{
        id: `tmp-ev-${Date.now()}`,
        accion: hecho ? 'marcado' : 'desmarcado',
        detalle: `${punto.etiqueta} ${hecho ? 'completado' : 'vuelve a pendiente'}`,
        usuario: usuarioNombre,
        createdAt: new Date().toISOString(),
      }, ...prev]);
    } catch (err) {
      setPuntos(prev => prev.map(p => (p.id === punto.id ? punto : p)));
      setError(err.message || 'No se pudo guardar el cambio.');
    }
  };

  const guardarCambioPunto = async (punto, cambios, evento) => {
    const anterior = punto;
    setPuntos(prev => prev.map(p => (p.id === punto.id ? { ...p, ...cambios } : p)));
    try {
      await actualizarPunto(punto.id, cambios, { planoId: plano.id, usuarioNombre, obraId: obra.id, evento });
      if (evento) {
        setEventos(prev => [{
          id: `tmp-ev-${Date.now()}`,
          accion: evento.accion,
          detalle: evento.detalle,
          usuario: usuarioNombre,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
    } catch (err) {
      setPuntos(prev => prev.map(p => (p.id === punto.id ? anterior : p)));
      setError(err.message || 'No se pudo guardar el punto.');
    }
  };

  const eliminarPunto = async (punto) => {
    setPuntos(prev => prev.filter(p => p.id !== punto.id));
    setSeleccionado(null);
    try {
      await borrarPunto(punto.id, { planoId: plano.id, usuarioNombre, etiqueta: punto.etiqueta, obraId: obra.id });
      setEventos(prev => [{
        id: `tmp-ev-${Date.now()}`,
        accion: 'eliminado',
        detalle: `${punto.etiqueta} eliminado del plano`,
        usuario: usuarioNombre,
        createdAt: new Date().toISOString(),
      }, ...prev]);
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el punto.');
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando plano...
      </div>
    );
  }

  if (!plano) {
    return (
      <div className="space-y-4">
        <div className="bg-[#111827]/40 rounded-xl p-6 border border-dashed border-[#334155] text-center space-y-3">
          <FileUp className="w-8 h-8 mx-auto text-blue-400" />
          <div>
            <h4 className="text-white text-sm font-bold">Plano eléctrico</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              Subí el PDF que te pasó el arquitecto. Vas a poder marcar cada toma sobre el plano:
              en gris hasta que la completes, y del color del circuito cuando la terminás.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold cursor-pointer">
            {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {subiendo ? 'Subiendo plano...' : 'Subir PDF del plano'}
            <input type="file" accept="application/pdf,.pdf" onChange={handleSubir} className="hidden" disabled={subiendo} />
          </label>
          <p className="text-[10px] text-gray-500">PDF de hasta 25 MB. Un plano por obra.</p>
        </div>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>
        )}
      </div>
    );
  }

  const puntoSel = puntos.find(p => p.id === seleccionado) || null;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Plano */}
      <div className="flex-1 min-h-[260px] min-w-0 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 truncate">{plano.nombre}</span>
            {paginasTotal > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina <= 1}
                  className="p-1 rounded bg-[#111827] border border-[#334155] text-gray-300 disabled:opacity-40"
                ><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span className="text-[10px] text-gray-400">{pagina}/{paginasTotal}</span>
                <button
                  onClick={() => setPagina(p => Math.min(paginasTotal, p + 1))}
                  disabled={pagina >= paginasTotal}
                  className="p-1 rounded bg-[#111827] border border-[#334155] text-gray-300 disabled:opacity-40"
                ><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAgregando(v => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                agregando
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-[#111827] text-gray-400 border-[#334155]'
              }`}
              title={agregando ? 'Tocá el plano para agregar una toma' : 'Pausar el agregado de puntos'}
            >
              {agregando ? '+ Agregar toma' : 'Agregar: pause'}
            </button>
            <button
              onClick={() => setEnColor(v => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                enColor ? 'bg-[#111827] text-gray-300 border-[#334155]' : 'bg-[#111827] text-gray-400 border-[#334155]'
              }`}
              title="Ver el plano con los colores del arquitecto o todo en gris"
            >
              <Palette className="w-3.5 h-3.5" /> {enColor ? 'En color' : 'En gris'}
            </button>
            <div className="flex items-center gap-1 bg-[#111827] border border-[#334155] rounded-lg p-0.5">
              <button onClick={() => aplicarZoom(0.8)} className="p-1.5 text-gray-300 hover:text-white" title="Alejar">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-gray-400 w-9 text-center">{Math.round(escala * 100)}%</span>
              <button onClick={() => aplicarZoom(1.25)} className="p-1.5 text-gray-300 hover:text-white" title="Acercar">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={ajustarAjuste} className="p-1.5 text-gray-300 hover:text-white" title="Ajustar a la pantalla">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={handleQuitarPlano}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
            >
              Quitar
            </button>
          </div>
        </div>

        <div
          ref={contenedorRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative flex-1 min-h-[280px] overflow-hidden bg-[#0B1220] rounded-xl border border-[#334155] touch-none select-none"
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{ transform: `translate(calc(-50% + ${desplazamiento.x}px), calc(-50% + ${desplazamiento.y}px)) scale(${escala})` }}
          >
            <div
              ref={capaRef}
              className="relative"
              style={{ width: medidas ? medidas.ancho : 1, height: medidas ? medidas.alto : 1 }}
            >
              <canvas
                ref={canvasRef}
                className="block rounded-sm shadow-2xl"
                style={{ width: '100%', height: '100%', filter: enColor ? 'none' : 'grayscale(1) contrast(1.05)' }}
              />
              {puntosPagina.map(p => (
                <button
                  key={p.id}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setSeleccionado(p.id); }}
                  title={`${p.etiqueta} · ${p.tipo}${p.hecho ? ' · hecho' : ''}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full font-bold text-[9px] shadow-lg transition-transform hover:scale-110"
                  style={{
                    left: `${p.x * 100}%`,
                    top: `${p.y * 100}%`,
                    width: 22,
                    height: 22,
                    backgroundColor: p.hecho ? p.color : GRIS_PENDIENTE,
                    border: `2px solid ${p.hecho ? '#ffffff' : 'rgba(255,255,255,0.55)'}`,
                    color: '#0B1220',
                    outline: seleccionado === p.id ? '2px solid #60A5FA' : 'none',
                    opacity: p.hecho ? 1 : 0.85,
                  }}
                >
                  {p.hecho ? <CheckCircle2 className="w-3 h-3" /> : p.etiqueta.replace(/^P/, '')}
                </button>
              ))}
            </div>
          </div>

          {renderizando && (
            <div className="absolute top-2 right-2 bg-[#0B1220]/80 rounded px-2 py-1 text-[10px] text-gray-300 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Dibujando
            </div>
          )}
          {agregando && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-500/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full pointer-events-none">
              Tocá el plano donde va la toma
            </div>
          )}
        </div>

        {aviso && (
          <p className="text-[10px] text-amber-400 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {aviso}</p>
        )}
        {error && (
          <p className="text-[10px] text-red-400 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {error}</p>
        )}
      </div>

      {/* Lista + panel del punto */}
      <div className="w-full shrink-0 flex flex-col gap-3 max-h-[46%] min-h-0 overflow-y-auto">
        <div className="bg-[#111827]/40 rounded-xl border border-[#334155] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Avance del plano</h4>
            <span className="text-sm font-extrabold text-white">{avance}%</span>
          </div>
          <div className="h-2 bg-[#0F1729] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all"
              style={{ width: `${avance}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500">{hechos} de {puntos.length} puntos completados</p>
        </div>

        {puntoSel && (
          <div className="bg-[#111827]/60 rounded-xl border border-blue-500/40 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: puntoSel.hecho ? puntoSel.color : GRIS_PENDIENTE }} />
                {puntoSel.etiqueta}
              </span>
              <button onClick={() => setSeleccionado(null)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] text-gray-500 font-semibold">Etiqueta</span>
                <input
                  defaultValue={puntoSel.etiqueta}
                  onBlur={(e) => {
                    const valor = e.target.value.trim() || puntoSel.etiqueta;
                    if (valor !== puntoSel.etiqueta) {
                      guardarCambioPunto(puntoSel, { etiqueta: valor }, { accion: 'editado', detalle: `${valor} renombrado` });
                    }
                  }}
                  className="w-full mt-1 bg-[#0F1729] border border-[#334155] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[10px] text-gray-500 font-semibold">Tipo</span>
                <select
                  value={puntoSel.tipo}
                  onChange={(e) => guardarCambioPunto(puntoSel, { tipo: e.target.value }, { accion: 'editado', detalle: `${puntoSel.etiqueta}: tipo ${e.target.value}` })}
                  className="w-full mt-1 bg-[#0F1729] border border-[#334155] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                >
                  {TIPOS_PUNTO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-[10px] text-gray-500 font-semibold">Nota</span>
              <textarea
                defaultValue={puntoSel.nota}
                onBlur={(e) => {
                  const valor = e.target.value.trim();
                  if (valor !== puntoSel.nota) {
                    guardarCambioPunto(puntoSel, { nota: valor }, { accion: 'nota', detalle: `Nota en ${puntoSel.etiqueta}` });
                  }
                }}
                rows={2}
                placeholder="Ej: falta rosca en la caja"
                className="w-full mt-1 bg-[#0F1729] border border-[#334155] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none resize-none"
              />
            </label>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => alternarHecho(puntoSel)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  puntoSel.hecho
                    ? 'bg-green-500/15 text-green-300 border border-green-500/30'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {puntoSel.hecho ? 'Completado' : 'Marcar como hecho'}
              </button>
              <button
                onClick={() => eliminarPunto(puntoSel)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                title="Eliminar punto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {puntoSel.marcadoAt && (
              <p className="text-[10px] text-gray-500">
                Marcado por {puntoSel.marcadoPor} el {new Date(puntoSel.marcadoAt).toLocaleString('es-AR')}
              </p>
            )}
          </div>
        )}

        <div className="bg-[#111827]/40 rounded-xl border border-[#334155] flex flex-col overflow-hidden shrink-0">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 px-3 py-2 border-b border-[#334155] flex items-center gap-1.5">
            <Pencil className="w-3 h-3" /> Puntos ({puntos.length})
          </h4>
          <div className="overflow-y-auto flex-1 min-h-0">
            {puntos.length === 0 && (
              <p className="text-[10px] text-gray-500 px-3 py-4">
                Todavía no cargaste puntos. Tocá el plano en la toma y se agrega sola con el color del circuito.
              </p>
            )}
            {puntos.map(p => (
              <button
                key={p.id}
                onClick={() => setSeleccionado(p.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 border-b border-[#1E293B] text-left transition-colors ${
                  seleccionado === p.id ? 'bg-blue-500/10' : 'hover:bg-[#16223F]/40'
                }`}
              >
                {p.hecho
                  ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  : <Circle className="w-4 h-4 text-gray-600 shrink-0" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-white truncate">{p.etiqueta} · {p.tipo}</span>
                  <span className="block text-[10px] text-gray-500 truncate">
                    {nombreColor(p.color)}{p.nota ? ` · ${p.nota}` : ''}
                  </span>
                </span>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              </button>
            ))}
          </div>
        </div>

        {eventos.length > 0 && (
          <div className="bg-[#111827]/40 rounded-xl border border-[#334155] p-3">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5 mb-2">
              <History className="w-3 h-3" /> Últimos cambios
            </h4>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {eventos.slice(0, 12).map(ev => (
                <p key={ev.id} className="text-[10px] text-gray-400 leading-tight">
                  <span className="text-gray-500">{new Date(ev.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>{' '}
                  {ev.detalle} <span className="text-gray-600">· {ev.usuario}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Lee la cantidad de páginas del PDF antes de subirlo (para avisar el multi-página). */
async function leerPaginasPdf(file) {
  try {
    const pdfjs = await cargarPdfjs();
    const buffer = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const paginas = doc.numPages;
    await doc.destroy();
    return { paginas };
  } catch {
    return { paginas: 1 };
  }
}
