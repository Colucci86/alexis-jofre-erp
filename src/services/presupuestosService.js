import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import {
  mapPresupuestoRow, mapPresupuestoToDb, mapPresupuestoItemRow,
} from './mappers';

export async function fetchPresupuestos() {
  const supabase = getSupabaseOrThrow();
  const { data: presupuestos, error } = await supabase
    .from('presupuestos')
    .select('*')
    .order('created_at', { ascending: false });

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  if (!presupuestos?.length) return [];

  const ids = presupuestos.map(p => p.id);
  const { data: items, error: itemsError } = await supabase
    .from('presupuesto_items')
    .select('*')
    .in('presupuesto_id', ids);

  const itemsServiceError = handleSupabaseError(itemsError);
  if (itemsServiceError) throw itemsServiceError;

  const itemsByPres = new Map();
  (items || []).forEach(item => {
    if (!itemsByPres.has(item.presupuesto_id)) itemsByPres.set(item.presupuesto_id, []);
    itemsByPres.get(item.presupuesto_id).push(mapPresupuestoItemRow(item));
  });

  return presupuestos.map(row => mapPresupuestoRow(row, itemsByPres.get(row.id) || []));
}

export async function createPresupuesto(presupuesto) {
  const supabase = getSupabaseOrThrow();
  const { items, ...header } = presupuesto;

  const { data, error } = await supabase
    .from('presupuestos')
    .insert(mapPresupuestoToDb(header))
    .select('*')
    .single();

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  if (items?.length) {
    const itemsPayload = items.map(item => ({
      presupuesto_id: data.id,
      descripcion: item.descripcion,
      cantidad: Number(item.cantidad || 0),
      precio_unitario: Number(item.precioUnitario || 0),
      total: Number(item.total || 0),
    }));
    const { error: itemsError } = await supabase.from('presupuesto_items').insert(itemsPayload);
    const itemsServiceError = handleSupabaseError(itemsError);
    if (itemsServiceError) throw itemsServiceError;
  }

  return mapPresupuestoRow(data, items || []);
}

export async function updatePresupuesto(id, presupuesto) {
  const supabase = getSupabaseOrThrow();
  const { items, ...header } = presupuesto;

  const { data, error } = await supabase
    .from('presupuestos')
    .update(mapPresupuestoToDb({ ...header, id }))
    .eq('id', id)
    .select('*')
    .single();

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  if (items) {
    await supabase.from('presupuesto_items').delete().eq('presupuesto_id', id);
    if (items.length) {
      const itemsPayload = items.map(item => ({
        presupuesto_id: id,
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad || 0),
        precio_unitario: Number(item.precioUnitario || 0),
        total: Number(item.total || 0),
      }));
      const { error: itemsError } = await supabase.from('presupuesto_items').insert(itemsPayload);
      const itemsServiceError = handleSupabaseError(itemsError);
      if (itemsServiceError) throw itemsServiceError;
    }
  }

  return mapPresupuestoRow(data, items || []);
}

export async function deletePresupuesto(id) {
  const supabase = getSupabaseOrThrow();
  const { error } = await supabase.from('presupuestos').delete().eq('id', id);
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
}

export async function convertPresupuestoToObra(presupuestoId) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc('convertir_presupuesto_a_obra', {
    p_presupuesto_id: presupuestoId,
  });

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  if (!data?.success) {
    throw new Error(data?.error || 'No se pudo convertir el presupuesto.');
  }

  return data;
}
