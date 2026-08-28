import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import { mapProveedorRow, mapProveedorToDb } from './mappers';

export async function fetchProveedores() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from('proveedores').select('*').order('nombre');
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return (data || []).map(mapProveedorRow);
}

export async function createProveedor(proveedor) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('proveedores')
    .insert(mapProveedorToDb(proveedor))
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapProveedorRow(data);
}

export async function updateProveedor(id, proveedor) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('proveedores')
    .update(mapProveedorToDb(proveedor))
    .eq('id', id)
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapProveedorRow(data);
}
