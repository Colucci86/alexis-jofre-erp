import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import { mapProductoRow, mapProductoToDb } from './mappers';

export async function fetchProductos() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from('productos').select('*').order('nombre');
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return (data || []).map(mapProductoRow);
}

export async function createProducto(producto) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('productos')
    .insert(mapProductoToDb(producto))
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapProductoRow(data);
}

export async function updateProducto(id, producto) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('productos')
    .update(mapProductoToDb(producto))
    .eq('id', id)
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapProductoRow(data);
}

export async function deleteProducto(id) {
  const supabase = getSupabaseOrThrow();
  const { error } = await supabase.from('productos').delete().eq('id', id);
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
}
