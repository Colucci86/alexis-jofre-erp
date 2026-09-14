/** Convierte snake_case de Postgres a camelCase del frontend */

export function mapBitacoraRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    fecha: row.fecha,
    tipo: row.tipo,
    descripcion: row.descripcion,
    usuario: row.usuario_nombre || row.usuario || 'Sistema',
    fotoUrl: row.foto_url || '',
    createdAt: row.created_at || row.fecha || null,
  };
}

export function mapClienteRow(row, bitacora = []) {
  return {
    id: row.id,
    nombre: row.nombre,
    empresa: row.empresa || 'Particular',
    dni: row.dni || '',
    cuit: row.cuit || '',
    telefono: row.telefono || '',
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    direccion: row.direccion || '',
    localidad: row.localidad || 'Mendoza',
    provincia: row.provincia || 'Mendoza',
    notas: row.notas || '',
    fechaAlta: row.fecha_alta || row.created_at?.split('T')[0] || '',
    estado: row.estado || 'Activo',
    bitacora: bitacora.map(mapBitacoraRow),
  };
}

export function mapClienteToDb(cliente) {
  return {
    nombre: cliente.nombre,
    empresa: cliente.empresa || 'Particular',
    dni: cliente.dni || null,
    cuit: cliente.cuit || null,
    telefono: cliente.telefono || null,
    whatsapp: cliente.whatsapp || null,
    email: cliente.email || null,
    direccion: cliente.direccion || null,
    localidad: cliente.localidad || 'Mendoza',
    provincia: cliente.provincia || 'Mendoza',
    notas: cliente.notas || null,
    estado: cliente.estado || 'Activo',
    fecha_alta: cliente.fechaAlta || new Date().toISOString().split('T')[0],
  };
}

export function mapProveedorRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    rubro: row.rubro || '',
    telefono: row.telefono || '',
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    direccion: row.direccion || '',
    cuit: row.cuit || '',
    contacto: row.contacto || '',
    notas: row.notas || '',
    bitacora: [],
  };
}

export function mapProveedorToDb(proveedor) {
  return {
    nombre: proveedor.nombre,
    rubro: proveedor.rubro || null,
    telefono: proveedor.telefono || null,
    whatsapp: proveedor.whatsapp || null,
    email: proveedor.email || null,
    direccion: proveedor.direccion || null,
    cuit: proveedor.cuit || null,
    contacto: proveedor.contacto || null,
    notas: proveedor.notas || null,
  };
}

export function mapTecnicoRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    dni: row.dni || '',
    telefono: row.telefono || '',
    email: row.email || '',
    especialidad: row.especialidad || '',
    estado: row.estado || 'Activo',
    tipo: row.tipo || 'Técnico',
    notas: row.notas || '',
    usuarioId: row.usuario_id || null,
  };
}

export function mapTecnicoToDb(tecnico) {
  return {
    nombre: tecnico.nombre,
    apellido: tecnico.apellido,
    dni: tecnico.dni || null,
    telefono: tecnico.telefono || null,
    email: tecnico.email || null,
    especialidad: tecnico.especialidad || null,
    estado: tecnico.estado || 'Activo',
    tipo: tecnico.tipo || 'Técnico',
    notas: tecnico.notas || null,
    usuario_id: tecnico.usuarioId || null,
  };
}

export function mapProductoRow(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    codigoBarras: row.codigo_barras || '',
    nombre: row.nombre,
    categoria: row.categoria || '',
    marca: row.marca || '',
    descripcion: row.descripcion || '',
    proveedor: row.proveedor_nombre || '',
    proveedorId: row.proveedor_id || null,
    costo: Number(row.costo || 0),
    precioVenta: Number(row.precio_venta || 0),
    stockActual: Number(row.stock_actual || 0),
    stockMinimo: Number(row.stock_minimo || 0),
    unidadMedida: row.unidad_medida || 'unidades',
    ubicacion: row.ubicacion || '',
    estado: row.estado || 'Activo',
  };
}

export function mapProductoToDb(producto) {
  return {
    codigo: producto.codigo,
    codigo_barras: producto.codigoBarras || null,
    nombre: producto.nombre,
    categoria: producto.categoria || null,
    marca: producto.marca || null,
    descripcion: producto.descripcion || null,
    proveedor_id: producto.proveedorId || null,
    proveedor_nombre: producto.proveedor || null,
    costo: Number(producto.costo || 0),
    precio_venta: Number(producto.precioVenta || 0),
    stock_actual: Number(producto.stockActual || 0),
    stock_minimo: Number(producto.stockMinimo || 0),
    unidad_medida: producto.unidadMedida || 'unidades',
    ubicacion: producto.ubicacion || null,
    estado: producto.estado || 'Activo',
  };
}

export function mapServicioRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria || '',
    descripcion: row.descripcion || '',
    precioBase: Number(row.precio_base || 0),
    unidad: row.unidad || 'unidad',
    estado: row.estado || 'Activo',
  };
}

export function mapServicioToDb(servicio) {
  return {
    nombre: servicio.nombre,
    categoria: servicio.categoria || null,
    descripcion: servicio.descripcion || null,
    precio_base: Number(servicio.precioBase || 0),
    unidad: servicio.unidad || 'unidad',
    estado: servicio.estado || 'Activo',
  };
}

export function mapPresupuestoRow(row, items = []) {
  return {
    id: row.id,
    numero: row.numero,
    clienteId: row.cliente_id,
    clienteNombre: row.cliente_nombre || '',
    tipoTrabajo: row.tipo_trabajo,
    fecha: row.fecha,
    validez: row.validez || '15 días hábiles',
    estado: row.estado || 'Pendiente',
    items: items.map(mapPresupuestoItemRow),
    subtotal: Number(row.subtotal || 0),
    desgloseEfectivo: Number(row.desglose_efectivo || 0),
    desgloseCanje: Number(row.desglose_canje || 0),
    observaciones: row.observaciones || '',
    obraCreada: Boolean(row.obra_creada),
    obraId: row.obra_id || '',
  };
}

export function mapPresupuestoItemRow(row) {
  return {
    id: row.id,
    descripcion: row.descripcion,
    cantidad: Number(row.cantidad || 0),
    precioUnitario: Number(row.precio_unitario || 0),
    total: Number(row.total || 0),
  };
}

export function mapPresupuestoToDb(presupuesto) {
  return {
    numero: presupuesto.numero,
    cliente_id: presupuesto.clienteId,
    cliente_nombre: presupuesto.clienteNombre,
    tipo_trabajo: presupuesto.tipoTrabajo,
    fecha: presupuesto.fecha,
    validez: presupuesto.validez,
    estado: presupuesto.estado || 'Pendiente',
    subtotal: Number(presupuesto.subtotal || 0),
    desglose_efectivo: Number(presupuesto.desgloseEfectivo || 0),
    desglose_canje: Number(presupuesto.desgloseCanje || 0),
    observaciones: presupuesto.observaciones || null,
    obra_creada: Boolean(presupuesto.obraCreada),
    obra_id: presupuesto.obraId || null,
  };
}

export function mapObraRow(row, materiales = [], pagos = [], bitacora = []) {
  return {
    id: row.id,
    numero: row.numero,
    clienteId: row.cliente_id,
    clienteNombre: row.cliente_nombre || '',
    tipoTrabajo: row.tipo_trabajo,
    descripcion: row.descripcion,
    direccion: row.direccion || '',
    telefono: row.telefono || '',
    tecnicoAsignadoId: row.tecnico_id || '',
    tecnicoAsignadoNombre: row.tecnico_nombre || 'Sin asignar',
    fechaInicio: row.fecha_inicio,
    hora: row.hora || '08:30',
    estado: row.estado || 'Pendiente',
    progreso: Number(row.progreso || 0),
    presupuestoAsociadoId: row.presupuesto_id || '',
    importeTotal: Number(row.importe_total || 0),
    importePagado: Number(row.importe_pagado || 0),
    importePendiente: Number(row.importe_pendiente || 0),
    formaPago: row.forma_pago || 'Efectivo',
    observaciones: row.observaciones || '',
    eliminada: row.eliminada === true,
    materialesUsados: materiales.map(mapObraMaterialRow),
    pagosRegistrados: pagos.map(mapCobroAsPagoRow),
    bitacora: bitacora.map(mapBitacoraRow),
  };
}

export function mapObraMaterialRow(row) {
  return {
    id: row.id,
    productoId: row.producto_id,
    nombre: row.nombre,
    cantidad: Number(row.cantidad || 0),
    costoUnitario: Number(row.costo_unitario || 0),
  };
}

export function mapObraToDb(obra) {
  return {
    numero: obra.numero,
    cliente_id: obra.clienteId,
    cliente_nombre: obra.clienteNombre,
    tipo_trabajo: obra.tipoTrabajo,
    descripcion: obra.descripcion,
    direccion: obra.direccion || null,
    telefono: obra.telefono || null,
    tecnico_id: obra.tecnicoAsignadoId || null,
    tecnico_nombre: obra.tecnicoAsignadoNombre || null,
    fecha_inicio: obra.fechaInicio,
    hora: obra.hora || '08:30',
    estado: obra.estado || 'Pendiente',
    progreso: Number(obra.progreso || 0),
    presupuesto_id: obra.presupuestoAsociadoId || null,
    importe_total: Number(obra.importeTotal || 0),
    importe_pagado: Number(obra.importePagado || 0),
    importe_pendiente: Number(obra.importePendiente || 0),
    forma_pago: obra.formaPago || 'Efectivo',
    observaciones: obra.observaciones || null,
    ...(obra.eliminada === true ? { eliminada: true } : {}),
  };
}

export function mapCobroRow(row) {
  return {
    id: row.id,
    tipo: row.tipo,
    fecha: row.fecha,
    clienteId: row.cliente_id || '',
    clienteNombre: row.cliente_nombre || '',
    proveedorId: row.proveedor_id || '',
    proveedorNombre: row.proveedor_nombre || '',
    categoria: row.categoria || '',
    concepto: row.concepto,
    obraId: row.obra_id || '',
    importe: Number(row.importe || 0),
    formaPago: row.forma_pago,
    comprobante: row.comprobante_nombre || row.comprobante_url || '',
    observaciones: row.observaciones || '',
  };
}

export function mapCobroAsPagoRow(row) {
  return {
    id: row.id,
    fecha: row.fecha,
    concepto: row.concepto,
    importe: Number(row.importe || 0),
    formaPago: row.forma_pago,
  };
}

export function mapAgendaRow(row) {
  return {
    id: row.id,
    title: row.title,
    start: row.start,
    end: row.end_time || row.end || null,
    clienteId: row.cliente_id || '',
    clienteNombre: row.cliente_nombre || '',
    obraId: row.obra_id || '',
    tecnicoId: row.tecnico_id || '',
    tecnicoNombre: row.tecnico_nombre || '',
    direccion: row.direccion || '',
    notes: row.notes || '',
  };
}

export function mapAgendaToDb(event) {
  return {
    title: event.title,
    start: event.start,
    end_time: event.end || null,
    cliente_id: event.clienteId || null,
    cliente_nombre: event.clienteNombre || null,
    obra_id: event.obraId || null,
    tecnico_id: event.tecnicoId || null,
    tecnico_nombre: event.tecnicoNombre || null,
    direccion: event.direccion || null,
    notes: event.notes || null,
  };
}

export function mapUsuarioRow(row, tecnicoId = null) {
  return {
    id: row.id,
    authId: row.auth_id,
    email: row.email,
    nombre: row.nombre,
    rol: row.rol,
    telefono: row.telefono || '',
    activo: row.activo !== false,
    tecnicoId: tecnicoId || null,
    avatar: (row.nombre || row.email || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
  };
}
