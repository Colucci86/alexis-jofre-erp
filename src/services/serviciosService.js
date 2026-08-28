import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import { mapServicioRow, mapServicioToDb } from './mappers';

export async function fetchServicios() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from('servicios').select('*').order('nombre');
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return (data || []).map(mapServicioRow);
}

export async function createServicio(servicio) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('servicios')
    .insert(mapServicioToDb(servicio))
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapServicioRow(data);
}

export async function updateServicio(id, servicio) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('servicios')
    .update(mapServicioToDb(servicio))
    .eq('id', id)
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapServicioRow(data);
}

export async function deleteServicio(id) {
  const supabase = getSupabaseOrThrow();
  const { error } = await supabase.from('servicios').delete().eq('id', id);
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
}
