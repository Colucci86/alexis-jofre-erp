import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import {
  mapObraRow, mapObraToDb, mapBitacoraRow, mapObraMaterialRow, mapCobroAsPagoRow,
} from './mappers';

async function fetchObraRelations(obraIds) {
  if (!obraIds.length) {
    return { materiales: new Map(), pagos: new Map(), bitacora: new Map() };
  }

  const supabase = getSupabaseOrThrow();

  const [matRes, cobRes, bitRes] = await Promise.all([
    supabase.from('obra_materiales').select('*').in('obra_id', obraIds),
    supabase.from('cobros').select('*').in('obra_id', obraIds).eq('tipo', 'Ingreso').order('fecha', { ascending: false }),
    supabase.from('bitacora').select('*').eq('entidad_tipo', 'Obra').in('entidad_id', obraIds).order('fecha', { ascending: false }),
  ]);

  [matRes.error, cobRes.error, bitRes.error].forEach(err => {
    const serviceError = handleSupabaseError(err);
    if (serviceError) throw serviceError;
  });

  const materiales = new Map();
  (matRes.data || []).forEach(row => {
    if (!materiales.has(row.obra_id)) materiales.set(row.obra_id, []);
    materiales.get(row.obra_id).push(mapObraMaterialRow(row));
  });

  const pagos = new Map();
  (cobRes.data || []).forEach(row => {
    if (!pagos.has(row.obra_id)) pagos.set(row.obra_id, []);
    pagos.get(row.obra_id).push(mapCobroAsPagoRow(row));
  });

  const bitacora = new Map();
  (bitRes.data || []).forEach(row => {
    if (!bitacora.has(row.entidad_id)) bitacora.set(row.entidad_id, []);
    bitacora.get(row.entidad_id).push(mapBitacoraRow(row));
  });

  return { materiales, pagos, bitacora };
}

export async function fetchObras() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from('obras').select('*').order('created_at', { ascending: false });
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  const ids = (data || []).map(o => o.id);
  const { materiales, pagos, bitacora } = await fetchObraRelations(ids);

  return (data || []).map(row =>
    mapObraRow(row, materiales.get(row.id) || [], pagos.get(row.id) || [], bitacora.get(row.id) || [])
  );
}

export async function fetchObraById(id) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from('obras').select('*').eq('id', id).single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  const { materiales, pagos, bitacora } = await fetchObraRelations([id]);
  return mapObraRow(data, materiales.get(id) || [], pagos.get(id) || [], bitacora.get(id) || []);
}

export async function createObra(obra) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('obras')
    .insert(mapObraToDb(obra))
    .select('*')
    .single();

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  await supabase.from('bitacora').insert({
    entidad_tipo: 'Obra',
    entidad_id: data.id,
    tipo: 'Creación',
    descripcion: 'Registro inicial de la obra.',
  });

  return fetchObraById(data.id);
}

export async function updateObra(id, obra) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('obras')
    .update(mapObraToDb(obra))
    .eq('id', id)
    .select('*')
    .single();

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  return fetchObraById(data.id);
}

export async function addObraBitacora(obraId, entry, usuarioNombre) {
  const supabase = getSupabaseOrThrow();
  const { error } = await supabase.from('bitacora').insert({
    entidad_tipo: 'Obra',
    entidad_id: obraId,
    tipo: entry.tipo,
    descripcion: entry.descripcion,
    foto_url: entry.fotoUrl || null,
    usuario_nombre: usuarioNombre,
  });
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
}

export async function consumirMaterialObra(obraId, productoId, cantidad) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc('consumir_material_obra', {
    p_obra_id: obraId,
    p_producto_id: productoId,
    p_cantidad: cantidad,
  });

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  if (!data?.success) {
    return { error: data?.error || 'No se pudo consumir el material.' };
  }

  return { success: true, stockRestante: data.stock_restante };
}
