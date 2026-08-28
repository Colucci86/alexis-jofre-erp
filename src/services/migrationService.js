import { getSupabaseOrThrow } from '../lib/supabase';
import { handleSupabaseError } from './errors';
import { mapClienteToDb } from './mappers';

function newId() {
  return crypto.randomUUID();
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function mapped(map, oldId) {
  if (!oldId) return null;
  if (map.has(oldId)) return map.get(oldId);
  if (isUuid(oldId)) return oldId;
  return null;
}

export async function fetchMigrationStatus() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('migracion_local')
    .select('*')
    .order('ejecutada_at', { ascending: false })
    .limit(1);
  const serviceError = handleSupabaseError(error);
  if (serviceError) throw serviceError;
  return data?.[0] || null;
}

export async function countRemoteRecords() {
  const supabase = getSupabaseOrThrow();
  const tables = ['clientes', 'proveedores', 'tecnicos', 'productos', 'presupuestos', 'obras', 'cobros', 'agenda'];
  const counts = {};
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
    const serviceError = handleSupabaseError(error);
    if (serviceError) throw serviceError;
    counts[table] = count || 0;
  }
  return counts;
}

/**
 * Importa un snapshot de localStorage una sola vez.
 * No borra datos remotos existentes. Si ya hubo una migración, se rechaza.
 */
export async function importLocalSnapshot(snapshot, { allowIfRemoteHasData = false } = {}) {
  const supabase = getSupabaseOrThrow();
  const existing = await fetchMigrationStatus();
  if (existing) {
    throw new Error('Ya se ejecutó una importación desde localStorage. No se vuelve a importar para no duplicar datos.');
  }

  const counts = await countRemoteRecords();
  const remoteHasData = Object.values(counts).some(n => n > 0);
  if (remoteHasData && !allowIfRemoteHasData) {
    throw new Error('Supabase ya tiene datos. Marcá la confirmación para importar solo registros adicionales, o exportá un respaldo antes.');
  }

  const ids = {
    clientes: new Map(),
    proveedores: new Map(),
    tecnicos: new Map(),
    productos: new Map(),
    servicios: new Map(),
    presupuestos: new Map(),
    obras: new Map(),
    cobros: new Map(),
    agenda: new Map(),
  };

  const clientes = snapshot.aj_clientes || [];
  const proveedores = snapshot.aj_proveedores || [];
  const tecnicos = snapshot.aj_tecnicos || [];
  const productos = snapshot.aj_productos || [];
  const servicios = snapshot.aj_servicios || [];
  const presupuestos = snapshot.aj_presupuestos || [];
  const obras = snapshot.aj_obras || [];
  const cobros = snapshot.aj_cobros || [];
  const agenda = snapshot.aj_agenda || [];
  const config = snapshot.aj_config;

  const insertMany = async (table, rows) => {
    if (!rows.length) return;
    const { error } = await supabase.from(table).insert(rows);
    const serviceError = handleSupabaseError(error);
    if (serviceError) throw serviceError;
  };

  if (config) {
    await supabase.from('configuracion').update({
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
    }).eq('id', 1);
  }

  const clienteRows = clientes.map(c => {
    const id = isUuid(c.id) ? c.id : newId();
    ids.clientes.set(c.id, id);
    return { id, ...mapClienteToDb(c) };
  });
  await insertMany('clientes', clienteRows);

  const proveedorRows = proveedores.map(p => {
    const id = isUuid(p.id) ? p.id : newId();
    ids.proveedores.set(p.id, id);
    return {
      id,
      nombre: p.nombre,
      rubro: p.rubro || null,
      telefono: p.telefono || null,
      whatsapp: p.whatsapp || null,
      email: p.email || null,
      direccion: p.direccion || null,
      cuit: p.cuit || null,
      contacto: p.contacto || null,
      notas: p.notas || null,
    };
  });
  await insertMany('proveedores', proveedorRows);

  const tecnicoRows = tecnicos.map(t => {
    const id = isUuid(t.id) ? t.id : newId();
    ids.tecnicos.set(t.id, id);
    return {
      id,
      nombre: t.nombre,
      apellido: t.apellido,
      dni: t.dni || null,
      telefono: t.telefono || null,
      email: t.email || null,
      especialidad: t.especialidad || null,
      estado: t.estado || 'Activo',
      notas: t.notas || null,
    };
  });
  await insertMany('tecnicos', tecnicoRows);

  const productoRows = productos.map(p => {
    const id = isUuid(p.id) ? p.id : newId();
    ids.productos.set(p.id, id);
    return {
      id,
      codigo: p.codigo,
      codigo_barras: p.codigoBarras || null,
      nombre: p.nombre,
      categoria: p.categoria || null,
      marca: p.marca || null,
      descripcion: p.descripcion || null,
      proveedor_id: mapped(ids.proveedores, p.proveedorId) || null,
      proveedor_nombre: p.proveedor || null,
      costo: Number(p.costo || 0),
      precio_venta: Number(p.precioVenta || 0),
      stock_actual: Math.max(0, Number(p.stockActual || 0)),
      stock_minimo: Number(p.stockMinimo || 0),
      unidad_medida: p.unidadMedida || 'unidades',
      ubicacion: p.ubicacion || null,
      estado: p.estado || 'Activo',
    };
  });
  await insertMany('productos', productoRows);

  const servicioRows = servicios.map(s => {
    const id = isUuid(s.id) ? s.id : newId();
    ids.servicios.set(s.id, id);
    return {
      id,
      nombre: s.nombre,
      categoria: s.categoria || null,
      descripcion: s.descripcion || null,
      precio_base: Number(s.precioBase || 0),
      unidad: s.unidad || 'unidad',
      duracion_estimada: s.duracionEstimada || null,
      costo_mano_obra: Number(s.costoManoObra || 0),
      estado: s.estado || 'Activo',
    };
  });
  await insertMany('servicios', servicioRows);

  const presupuestoRows = presupuestos.map(p => {
    const id = isUuid(p.id) ? p.id : newId();
    ids.presupuestos.set(p.id, id);
    return {
      id,
      numero: p.numero,
      cliente_id: mapped(ids.clientes, p.clienteId),
      cliente_nombre: p.clienteNombre,
      tipo_trabajo: p.tipoTrabajo,
      fecha: p.fecha,
      validez: p.validez,
      estado: p.estado || 'Pendiente',
      subtotal: Number(p.subtotal || 0),
      desglose_efectivo: Number(p.desgloseEfectivo || 0),
      desglose_canje: Number(p.desgloseCanje || 0),
      observaciones: p.observaciones || null,
      obra_creada: Boolean(p.obraCreada),
    };
  });
  await insertMany('presupuestos', presupuestoRows);

  const itemRows = [];
  presupuestos.forEach(p => {
    (p.items || []).forEach(item => {
      itemRows.push({
        presupuesto_id: ids.presupuestos.get(p.id),
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad || 0),
        precio_unitario: Number(item.precioUnitario || 0),
        total: Number(item.total || 0),
      });
    });
  });
  await insertMany('presupuesto_items', itemRows);

  const obraRows = obras.map(o => {
    const id = isUuid(o.id) ? o.id : newId();
    ids.obras.set(o.id, id);
    return {
      id,
      numero: o.numero,
      cliente_id: mapped(ids.clientes, o.clienteId),
      cliente_nombre: o.clienteNombre,
      tipo_trabajo: o.tipoTrabajo,
      descripcion: o.descripcion,
      direccion: o.direccion || null,
      telefono: o.telefono || null,
      tecnico_id: mapped(ids.tecnicos, o.tecnicoAsignadoId),
      tecnico_nombre: o.tecnicoAsignadoNombre || null,
      fecha_inicio: o.fechaInicio,
      hora: o.hora || '08:30',
      estado: o.estado || 'Pendiente',
      progreso: Number(o.progreso || 0),
      presupuesto_id: mapped(ids.presupuestos, o.presupuestoAsociadoId),
      importe_total: Number(o.importeTotal || 0),
      importe_pagado: Number(o.importePagado || 0),
      importe_pendiente: Number(o.importePendiente || 0),
      forma_pago: o.formaPago || 'Efectivo',
      observaciones: o.observaciones || null,
    };
  });
  await insertMany('obras', obraRows);

  const presupuestoObraUpdates = presupuestos
    .filter(p => p.obraId)
    .map(p => ({
      id: ids.presupuestos.get(p.id),
      obra_id: mapped(ids.obras, p.obraId),
      obra_creada: true,
    }));
  for (const row of presupuestoObraUpdates) {
    if (!row.id) continue;
    await supabase.from('presupuestos').update({ obra_id: row.obra_id, obra_creada: true }).eq('id', row.id);
  }

  const materialRows = [];
  obras.forEach(o => {
    (o.materialesUsados || []).forEach(m => {
      materialRows.push({
        obra_id: ids.obras.get(o.id),
        producto_id: mapped(ids.productos, m.productoId),
        nombre: m.nombre,
        cantidad: Number(m.cantidad || 0),
        costo_unitario: Number(m.costoUnitario || 0),
      });
    });
  });
  await insertMany('obra_materiales', materialRows.filter(m => m.cantidad > 0));

  const cobroRows = cobros.map(c => {
    const id = isUuid(c.id) ? c.id : newId();
    ids.cobros.set(c.id, id);
    return {
      id,
      tipo: c.tipo,
      fecha: c.fecha,
      cliente_id: mapped(ids.clientes, c.clienteId),
      cliente_nombre: c.clienteNombre || null,
      proveedor_id: mapped(ids.proveedores, c.proveedorId),
      proveedor_nombre: c.proveedorNombre || null,
      categoria: c.categoria || null,
      concepto: c.concepto,
      obra_id: mapped(ids.obras, c.obraId),
      importe: Number(c.importe || 0),
      forma_pago: c.formaPago,
      comprobante_nombre: c.comprobante || null,
      observaciones: c.observaciones || null,
    };
  }).filter(c => c.importe > 0 && c.concepto);
  await insertMany('cobros', cobroRows);

  const agendaRows = agenda.map(e => {
    const id = isUuid(e.id) ? e.id : newId();
    ids.agenda.set(e.id, id);
    return {
      id,
      title: e.title,
      start: e.start,
      end_time: e.end || null,
      cliente_id: mapped(ids.clientes, e.clienteId),
      cliente_nombre: e.clienteNombre || null,
      obra_id: mapped(ids.obras, e.obraId),
      tecnico_id: mapped(ids.tecnicos, e.tecnicoId),
      tecnico_nombre: e.tecnicoNombre || null,
      direccion: e.direccion || null,
      notes: e.notes || null,
    };
  });
  await insertMany('agenda', agendaRows);

  const bitacoraRows = [];
  clientes.forEach(c => {
    (c.bitacora || []).forEach(b => {
      bitacoraRows.push({
        entidad_tipo: 'Cliente',
        entidad_id: ids.clientes.get(c.id),
        tipo: b.tipo,
        descripcion: b.descripcion,
        foto_url: b.fotoUrl || null,
        usuario_nombre: b.usuario || 'Migración',
        fecha: b.fecha || new Date().toISOString(),
      });
    });
  });
  obras.forEach(o => {
    (o.bitacora || []).forEach(b => {
      bitacoraRows.push({
        entidad_tipo: 'Obra',
        entidad_id: ids.obras.get(o.id),
        tipo: b.tipo,
        descripcion: b.descripcion,
        foto_url: b.fotoUrl || null,
        usuario_nombre: b.usuario || 'Migración',
        fecha: b.fecha || new Date().toISOString(),
      });
    });
  });
  await insertMany('bitacora', bitacoraRows);

  const resumen = {
    clientes: clienteRows.length,
    proveedores: proveedorRows.length,
    tecnicos: tecnicoRows.length,
    productos: productoRows.length,
    servicios: servicioRows.length,
    presupuestos: presupuestoRows.length,
    obras: obraRows.length,
    cobros: cobroRows.length,
    agenda: agendaRows.length,
    bitacora: bitacoraRows.length,
  };

  const { data: { user } } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from('usuarios').select('id').eq('auth_id', user.id).maybeSingle();

  const { error: migError } = await supabase.from('migracion_local').insert({
    ejecutada_por: perfil?.id || null,
    origen: 'localStorage',
    resumen,
  });
  const migServiceError = handleSupabaseError(migError);
  if (migServiceError) throw migServiceError;

  return resumen;
}

export function collectLocalSnapshot() {
  const snapshot = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith('aj_') && key !== 'aj_user' && key !== 'aj_demo_session') {
      try {
        snapshot[key] = JSON.parse(localStorage.getItem(key));
      } catch {
        snapshot[key] = null;
      }
    }
  }
  return snapshot;
}
