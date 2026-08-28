import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import { mapTecnicoRow, mapTecnicoToDb } from './mappers';

export async function fetchTecnicos() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from('tecnicos').select('*').order('apellido');
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return (data || []).map(mapTecnicoRow);
}

export async function updateTecnico(id, tecnico) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('tecnicos')
    .update(mapTecnicoToDb(tecnico))
    .eq('id', id)
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapTecnicoRow(data);
}

export async function createTecnico(tecnico) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('tecnicos')
    .insert(mapTecnicoToDb(tecnico))
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapTecnicoRow(data);
}
