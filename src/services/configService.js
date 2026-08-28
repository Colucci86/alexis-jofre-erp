import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';

export function mapConfigRow(row) {
  if (!row) return null;
  return {
    empresa: row.empresa || '',
    titular: row.titular || '',
    telefono: row.telefono || '',
    email: row.email || '',
    ciudad: row.ciudad || '',
    cuit: row.cuit || '',
    validezPresupuesto: Number(row.validez_presupuesto || 15),
    condicionesDefecto: row.condiciones_defecto || '',
    categoriasGastos: row.categorias_gastos || [],
    categoriasIngresos: row.categorias_ingresos || [],
    formasPago: row.formas_pago || [],
  };
}

export async function fetchConfiguracion() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from('configuracion').select('*').eq('id', 1).maybeSingle();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapConfigRow(data);
}

export async function updateConfiguracion(config) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('configuracion')
    .update({
      empresa: config.empresa,
      titular: config.titular,
      telefono: config.telefono,
      email: config.email,
      ciudad: config.ciudad,
      cuit: config.cuit,
      validez_presupuesto: Number(config.validezPresupuesto || 15),
      condiciones_defecto: config.condicionesDefecto,
      categorias_gastos: config.categoriasGastos || [],
      categorias_ingresos: config.categoriasIngresos || [],
      formas_pago: config.formasPago || [],
    })
    .eq('id', 1)
    .select('*')
    .single();
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return mapConfigRow(data);
}
