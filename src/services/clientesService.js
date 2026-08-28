import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import {
  mapClienteRow, mapClienteToDb, mapBitacoraRow,
} from './mappers';

async function fetchBitacoraForEntities(entidadTipo, ids) {
  if (!ids.length) return new Map();
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('bitacora')
    .select('*')
    .eq('entidad_tipo', entidadTipo)
    .in('entidad_id', ids)
    .order('fecha', { ascending: false });

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  const map = new Map();
  (data || []).forEach(row => {
    if (!map.has(row.entidad_id)) map.set(row.entidad_id, []);
    map.get(row.entidad_id).push(mapBitacoraRow(row));
  });
  return map;
}

export async function fetchClientes() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from('clientes').select('*').order('nombre');
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  const ids = (data || []).map(c => c.id);
  const bitacoraMap = await fetchBitacoraForEntities('Cliente', ids);

  return (data || []).map(row => mapClienteRow(row, bitacoraMap.get(row.id) || []));
}

export async function createCliente(cliente) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('clientes')
    .insert(mapClienteToDb(cliente))
    .select('*')
    .single();

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  await addClienteBitacora(data.id, {
    tipo: 'Nota Manual',
    descripcion: 'Alta de cliente en el sistema.',
  });

  const bitacora = await fetchBitacoraForEntities('Cliente', [data.id]);
  return mapClienteRow(data, bitacora.get(data.id) || []);
}

export async function updateCliente(id, cliente) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('clientes')
    .update(mapClienteToDb(cliente))
    .eq('id', id)
    .select('*')
    .single();

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  const bitacora = await fetchBitacoraForEntities('Cliente', [data.id]);
  return mapClienteRow(data, bitacora.get(data.id) || []);
}

export async function deleteCliente(id) {
  const supabase = getSupabaseOrThrow();
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
}

export async function addClienteBitacora(clienteId, entry, usuarioNombre) {
  const supabase = getSupabaseOrThrow();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('bitacora').insert({
    entidad_tipo: 'Cliente',
    entidad_id: clienteId,
    tipo: entry.tipo,
    descripcion: entry.descripcion,
    foto_url: entry.fotoUrl || null,
    usuario_nombre: usuarioNombre || user?.email || 'Sistema',
  });

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
}
