import { supabase, isSupabaseConfigured, getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import { mapPlanoRow, mapPuntoRow, mapEventoRow, mapPuntoToDb } from './mappers';

const BUCKET = 'obra-planos';
const MAX_BYTES = 25 * 1024 * 1024;
const LOCAL_KEY = 'aj_obra_planos';
const SOLO_LOCAL_KEY = 'aj_planos_solo_local';

/**
 * Si el proyecto todavía no tiene la migración 012 (tablas + bucket), la app
 * sigue siendo usable guardando el plano en el dispositivo en vez de fallar.
 */
let soloLocal = (() => {
  try { return localStorage.getItem(SOLO_LOCAL_KEY) === '1'; } catch { return false; }
})();

export function planosEnLocal() {
  return soloLocal;
}

function marcarSoloLocal(valor) {
  soloLocal = !!valor;
  try { localStorage.setItem(SOLO_LOCAL_KEY, soloLocal ? '1' : '0'); } catch { /* ignorar */ }
}

/** Falta la migración 012 en el servidor. */
function esFaltaDeInfra(error) {
  const msg = String(error?.message || '');
  const code = error?.code || '';
  return /bucket not found/i.test(msg)
    || /schema cache/i.test(msg)
    || /relation .* does not exist/i.test(msg)
    || code === '42P01'
    || code === 'PGRST205'
    || (code === '404' && /storage|not found/i.test(msg));
}

function extensionFor(file) {
  const fromName = file.name && file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  return fromName || 'pdf';
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el PDF.'));
    reader.readAsDataURL(file);
  });
}

function useLocal() {
  return !isSupabaseConfigured || !supabase || soloLocal;
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLocal(data) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {
    // localStorage lleno: el plano se mantiene solo en memoria
  }
}

function genId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Sube el PDF del plano a Storage y crea/actualiza el registro del plano de la obra. */
export async function guardarPlanoObra(obraId, file, { paginas = 1, usuarioId = null } = {}) {
  if (!file) throw new Error('No se seleccionó ningún PDF.');
  const esPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  if (!esPdf) throw new Error('El plano debe ser un PDF.');
  if (file.size > MAX_BYTES) throw new Error('El PDF supera el límite de 25 MB.');

  const nombre = (file.name || 'plano.pdf').trim();

  if (useLocal()) return guardarPlanoLocal(obraId, file, nombre, paginas);

  const supabaseClient = getSupabaseOrThrow();
  const path = `${obraId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(file)}`;

  const { error: upErr } = await supabaseClient.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'application/pdf',
  });
  if (upErr) {
    if (esFaltaDeInfra(upErr)) {
      marcarSoloLocal(true);
      return guardarPlanoLocal(obraId, file, nombre, paginas);
    }
    const msg = String(upErr.message || '');
    if (/exceeded the maximum allowed size/i.test(msg)) {
      throw new Error('El PDF supera el tamaño máximo permitido (25 MB).');
    }
    throw new Error(upErr.message || 'No se pudo subir el PDF.');
  }

  const { urlData } = supabaseClient.storage.from(BUCKET).getPublicUrl(path);
  const registro = {
    obra_id: obraId,
    nombre,
    archivo_path: path,
    archivo_url: urlData.publicUrl,
    tamano_bytes: file.size,
    paginas,
    created_by: usuarioId,
  };

  const { data, error } = await supabaseClient
    .from('obra_planos')
    .upsert(registro, { onConflict: 'obra_id' })
    .select('*')
    .single();
  if (esFaltaDeInfra(error)) {
    marcarSoloLocal(true);
    return guardarPlanoLocal(obraId, file, nombre, paginas);
  }
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  return mapPlanoRow(data);
}

async function guardarPlanoLocal(obraId, file, nombre, paginas) {
  const archivoUrl = await readAsDataUrl(file);
  const data = readLocal();
  const previo = data[obraId];
  const plano = {
    id: previo?.id || genId(),
    obraId,
    nombre,
    archivoPath: `local/${obraId}/${nombre}`,
    archivoUrl,
    tamanoBytes: file.size,
    paginas,
    puntos: previo?.puntos || [],
    eventos: previo?.eventos || [],
    createdAt: new Date().toISOString(),
  };
  data[obraId] = plano;
  writeLocal(data);
  return plano;
}

export async function fetchPlanoObra(obraId) {
  if (!isSupabaseConfigured || !supabase) return leerPlanoLocal(obraId);

  const supabaseClient = getSupabaseOrThrow();
  const { data, error } = await supabaseClient
    .from('obra_planos')
    .select('*')
    .eq('obra_id', obraId)
    .maybeSingle();
  if (error) {
    // Sin migración 012 en el servidor: se usa lo guardado en el dispositivo.
    if (esFaltaDeInfra(error)) {
      marcarSoloLocal(true);
      return leerPlanoLocal(obraId);
    }
    const serviceError = handleSupabaseError(error);
    if (serviceError) throw serviceError;
    return null;
  }
  if (!data) {
    if (soloLocal) return leerPlanoLocal(obraId);
    return null;
  }

  // El servidor ya tiene la migración: se olvida el modo local.
  marcarSoloLocal(false);

  const plano = mapPlanoRow(data);
  const [puntosRes, eventosRes] = await Promise.all([
    supabaseClient.from('obra_plano_puntos').select('*').eq('plano_id', plano.id).order('created_at'),
    supabaseClient
      .from('obra_plano_eventos')
      .select('*')
      .eq('plano_id', plano.id)
      .order('created_at', { ascending: false })
      .limit(40),
  ]);

  const puntosErr = handleSupabaseError(puntosRes.error);
  if (puntosErr && !esFaltaDeInfra(puntosRes.error)) throw puntosErr;

  return {
    ...plano,
    puntos: (puntosRes.data || []).map(mapPuntoRow),
    eventos: (eventosRes.data || []).map(mapEventoRow),
  };
}

function leerPlanoLocal(obraId) {
  const local = readLocal()[obraId];
  if (!local) return null;
  return { ...local, puntos: local.puntos || [], eventos: local.eventos || [] };
}

/** Quita el plano de la obra: borra puntos, historial, fila y archivo. */
export async function eliminarPlanoObra(planoId, { archivoPath, obraId } = {}) {
  if (useLocal()) {
    const data = readLocal();
    if (obraId) delete data[obraId];
    else for (const [k, v] of Object.entries(data)) if (v.id === planoId) delete data[k];
    writeLocal(data);
    return;
  }

  const supabaseClient = getSupabaseOrThrow();
  const { error } = await supabaseClient.from('obra_planos').delete().eq('id', planoId);
  if (error) {
    if (/row-level security|permission denied/i.test(error.message)) {
      throw new Error('Sólo un administrador puede quitar el plano de la obra.');
    }
    const serviceError = handleSupabaseError(error);
    if (serviceError) throw serviceError;
  }

  if (archivoPath) {
    // El bucket solo deja borrar a admins: si falla, el archivo queda huérfano.
    const { error: errStorage } = await supabaseClient.storage.from('obra-planos').remove([archivoPath]);
    if (errStorage) console.warn('No se pudo borrar el archivo del plano:', errStorage.message);
  }
}

/** ── Modo local (demo): los puntos viven en localStorage junto al PDF ── */

function mutarLocal(obraId, mutador) {
  const data = readLocal();
  const plano = data[obraId];
  if (!plano) return null;
  const actualizado = mutador(plano) || plano;
  data[obraId] = actualizado;
  writeLocal(data);
  return actualizado;
}

function eventoLocal(obraId, puntoId, accion, detalle, usuarioNombre) {
  return mutarLocal(obraId, plano => ({
    ...plano,
    eventos: [{
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      puntoId,
      accion,
      detalle,
      usuario: usuarioNombre || 'Sistema',
      createdAt: new Date().toISOString(),
    }, ...(plano.eventos || [])].slice(0, 40),
  }));
}

export async function crearPunto(planoId, punto, usuarioNombre, obraId) {
  if (useLocal()) {
    const guardado = { ...punto, id: genId(), planoId, obraId, hecho: false, marcadoPor: '', marcadoAt: null };
    mutarLocal(obraId, plano => ({ ...plano, puntos: [...(plano.puntos || []), guardado] }));
    eventoLocal(obraId, guardado.id, 'creado', `${guardado.etiqueta} agregado al plano`, usuarioNombre);
    return guardado;
  }

  const supabaseClient = getSupabaseOrThrow();
  const { data, error } = await supabaseClient
    .from('obra_plano_puntos')
    .insert({ ...mapPuntoToDb(punto), plano_id: planoId })
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  await registrarEvento(planoId, data.id, 'creado', `${data.etiqueta} agregado al plano`, usuarioNombre);
  return mapPuntoRow(data);
}

export async function actualizarPunto(puntoId, cambios, { planoId, usuarioNombre, evento, obraId } = {}) {
  if (useLocal()) {
    mutarLocal(obraId, plano => ({
      ...plano,
      puntos: (plano.puntos || []).map(p => (p.id === puntoId ? { ...p, ...cambios } : p)),
    }));
    if (evento) {
      eventoLocal(obraId, puntoId, evento.accion, evento.detalle, usuarioNombre);
    }
    return { ...cambios, id: puntoId };
  }

  const supabaseClient = getSupabaseOrThrow();
  const { data, error } = await supabaseClient
    .from('obra_plano_puntos')
    .update(mapPuntoToDb(cambios))
    .eq('id', puntoId)
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  if (planoId && evento) {
    await registrarEvento(planoId, puntoId, evento.accion, evento.detalle, usuarioNombre);
  }
  return mapPuntoRow(data);
}

export async function borrarPunto(puntoId, { planoId, usuarioNombre, etiqueta, obraId } = {}) {
  if (useLocal()) {
    mutarLocal(obraId, plano => ({ ...plano, puntos: (plano.puntos || []).filter(p => p.id !== puntoId) }));
    eventoLocal(obraId, puntoId, 'eliminado', `${etiqueta || 'Punto'} eliminado del plano`, usuarioNombre);
    return;
  }

  const supabaseClient = getSupabaseOrThrow();
  const { error } = await supabaseClient.from('obra_plano_puntos').delete().eq('id', puntoId);
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  if (planoId) {
    await registrarEvento(planoId, puntoId, 'eliminado', `${etiqueta || 'Punto'} eliminado del plano`, usuarioNombre);
  }
}

export async function registrarEvento(planoId, puntoId, accion, detalle, usuarioNombre) {
  if (useLocal()) return;
  const supabaseClient = getSupabaseOrThrow();
  const { error } = await supabaseClient.from('obra_plano_eventos').insert({
    plano_id: planoId,
    punto_id: puntoId || null,
    accion,
    detalle: detalle || null,
    usuario_nombre: usuarioNombre || null,
  });
  // El historial es informativo: no hacemos fallar la acción principal si falla.
  if (error) console.warn('No se pudo registrar el evento del plano:', error.message);
}
