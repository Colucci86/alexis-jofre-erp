import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';

/**
 * Actualiza campos de una entrada de bitácora (fecha/hora del evento, tipo,
 * descripción o adjunto). La columna created_at queda intacta.
 */
export async function updateBitacoraEntrada(id, cambios) {
  const supabase = getSupabaseOrThrow();
  const payload = {};
  if (cambios.fecha !== undefined) payload.fecha = cambios.fecha;
  if (cambios.tipo !== undefined) payload.tipo = cambios.tipo;
  if (cambios.descripcion !== undefined) payload.descripcion = cambios.descripcion;
  if (cambios.fotoUrl !== undefined) payload.foto_url = cambios.fotoUrl;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from('bitacora').update(payload).eq('id', id);
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
}