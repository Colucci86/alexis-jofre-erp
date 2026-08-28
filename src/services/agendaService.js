import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import { mapAgendaRow, mapAgendaToDb } from './mappers';

export async function fetchAgenda() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from('agenda').select('*').order('start');
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return (data || []).map(mapAgendaRow);
}

export async function createAgendaEvent(event) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('agenda')
    .insert(mapAgendaToDb(event))
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapAgendaRow(data);
}

export async function updateAgendaEvent(id, event) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('agenda')
    .update(mapAgendaToDb(event))
    .eq('id', id)
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapAgendaRow(data);
}

export async function deleteAgendaEvent(id) {
  const supabase = getSupabaseOrThrow();
  const { error } = await supabase.from('agenda').delete().eq('id', id);
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
}
