import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import { mapUsuarioRow } from './mappers';

export async function fetchProfileByAuthId(authId) {
  const supabase = getSupabaseOrThrow();

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle();

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  if (!data) return null;

  let tecnicoId = null;
  if (data.rol === 'Técnico') {
    const { data: tecnico } = await supabase
      .from('tecnicos')
      .select('id')
      .eq('usuario_id', data.id)
      .maybeSingle();
    tecnicoId = tecnico?.id || null;
  }

  return mapUsuarioRow(data, tecnicoId);
}

export async function fetchAllUsuarios() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from('usuarios').select('*').order('nombre');
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return (data || []).map(row => mapUsuarioRow(row));
}

export async function updateUsuarioRol(usuarioId, rol) {
  const supabase = getSupabaseOrThrow();
  const { error } = await supabase.from('usuarios').update({ rol }).eq('id', usuarioId);
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
}

export async function updateUsuarioActivo(usuarioId, activo) {
  const supabase = getSupabaseOrThrow();
  const { error } = await supabase.from('usuarios').update({ activo }).eq('id', usuarioId);
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
}
