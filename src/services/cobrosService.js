import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import { mapCobroRow } from './mappers';

export async function fetchCobros() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from('cobros').select('*').order('fecha', { ascending: false });
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return (data || []).map(mapCobroRow);
}

export async function registrarCobro(cobroData) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc('registrar_cobro', {
    p_tipo: cobroData.tipo,
    p_fecha: cobroData.fecha,
    p_cliente_id: cobroData.clienteId || null,
    p_cliente_nombre: cobroData.clienteNombre || null,
    p_proveedor_id: cobroData.proveedorId || null,
    p_proveedor_nombre: cobroData.proveedorNombre || null,
    p_categoria: cobroData.categoria || null,
    p_concepto: cobroData.concepto,
    p_obra_id: cobroData.obraId || null,
    p_importe: Number(cobroData.importe),
    p_forma_pago: cobroData.formaPago,
    p_comprobante_url: cobroData.comprobanteUrl || null,
    p_comprobante_nombre: cobroData.comprobante || null,
    p_observaciones: cobroData.observaciones || null,
  });

  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;

  if (!data?.success) {
    throw new Error(data?.error || 'No se pudo registrar el cobro.');
  }

  const { data: cobro, error: fetchError } = await supabase
    .from('cobros')
    .select('*')
    .eq('id', data.cobro_id)
    .single();

  const fetchServiceError = handleSupabaseError(fetchError);
  if (fetchServiceError) throw fetchServiceError;

  return mapCobroRow(cobro);
}
