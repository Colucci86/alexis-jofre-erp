import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/id';
import { shouldUseRemoteData } from '../lib/config';
import { useAuth } from './AuthContext';
import { validateMaterialConsumption } from '../utils/stockValidation.js';
import * as clientesApi from '../services/clientesService';
import * as proveedoresApi from '../services/proveedoresService';
import * as tecnicosApi from '../services/tecnicosService';
import * as productosApi from '../services/productosService';
import * as serviciosApi from '../services/serviciosService';
import * as presupuestosApi from '../services/presupuestosService';
import * as obrasApi from '../services/obrasService';
import * as cobrosApi from '../services/cobrosService';
import * as agendaApi from '../services/agendaService';
import * as configApi from '../services/configService';
import { ServiceError } from '../services/errors';

const AppContext = createContext();

// ─── Safe localStorage helpers ──────────────────────────────────────────────

/**
 * Lee un valor de localStorage de forma segura.
 * Si el JSON está corrupto, vacío, o es un tipo inesperado, devuelve el fallback.
 */
function safeGetItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    const parsed = JSON.parse(raw);
    // Validar que el tipo coincida con el fallback (array vs object)
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    if (typeof fallback === 'object' && !Array.isArray(fallback) && Array.isArray(parsed)) return fallback;
    return parsed;
  } catch (e) {
    console.warn(`[AppContext] Error leyendo localStorage key "${key}". Usando datos iniciales.`, e);
    return fallback;
  }
}

// ─── Datos iniciales ────────────────────────────────────────────────────────

const initialConfig = {
  empresa: "Alexis Jofré - Mantenimiento Integral",
  titular: "Alexis Jofré",
  telefono: "0261152414101",
  email: "alexisjofre1995@gmail.com",
  ciudad: "Ciudad de Mendoza, Mendoza",
  cuit: "20-38491029-9",
  validezPresupuesto: 15,
  condicionesDefecto: "Presupuesto de acuerdo con render recibido, valido por 15 dias habiles. No incluye materiales.",
  categoriasGastos: ["Materiales", "Herramientas", "Combustible", "Sueldos / Técnicos", "Gastos Administrativos", "Otros"],
  categoriasIngresos: ["Obras Mantenimiento", "Presupuestos Aprobados", "Anticipos de Obra", "Venta de Productos", "Otros"],
  formasPago: ["Efectivo", "Canje", "Transferencia", "Tarjeta", "Mercado Pago", "Cuenta Corriente"]
};

const initialClientes = [
  {
    id: "c1",
    nombre: "Martín Colucci / Pía Leiva",
    empresa: "Particular",
    dni: "27.458.120",
    cuit: "27-27458120-4",
    telefono: "2616554321",
    whatsapp: "2616554321",
    email: "martin.colucci@gmail.com",
    direccion: "Tandil 462, Dorrego",
    localidad: "Guaymallén",
    provincia: "Mendoza",
    notas: "Cliente preferencial, se acepta forma de pago mixta (Efectivo + Canje).",
    fechaAlta: "2026-04-10",
    estado: "Activo",
    bitacora: [
      { id: "b1_1", fecha: "2026-04-20T10:00:00-03:00", tipo: "Presupuesto Enviado", descripcion: "Se envió el presupuesto de electricidad, durlock, colocación de zócalos y pintura por un total de $730.000.", usuario: "Alexis Jofré" },
      { id: "b1_2", fecha: "2026-04-21T15:30:00-03:00", tipo: "Llamada", descripcion: "El cliente llamó para confirmar el inicio de la obra y acordar la entrega de las llaves.", usuario: "Alexis Jofré" }
    ]
  },
  {
    id: "c2",
    nombre: "Familia Gómez",
    empresa: "Particular",
    dni: "30.123.456",
    cuit: "",
    telefono: "2612345678",
    whatsapp: "2612345678",
    email: "familiagomez@gmail.com",
    direccion: "Av. San Martín 1234",
    localidad: "Ciudad",
    provincia: "Mendoza",
    notas: "Obra eléctrica completa en su domicilio.",
    fechaAlta: "2026-05-15",
    estado: "Activo",
    bitacora: [
      { id: "b2_1", fecha: "2026-05-20T09:00:00-03:00", tipo: "Nota Manual", descripcion: "Visita de relevamiento realizada. Se constataron 12 bocas de luz y tomas dañadas.", usuario: "Alexis Jofré" }
    ]
  },
  {
    id: "c3",
    nombre: "Estudio Integral SRL",
    empresa: "Estudio Integral",
    dni: "",
    cuit: "30-71459201-3",
    telefono: "2615987654",
    whatsapp: "2615987654",
    email: "contacto@estudiointegral.com",
    direccion: "Av. Mitre 1000",
    localidad: "San Rafael",
    provincia: "Mendoza",
    notas: "Oficinas comerciales, mantenimiento mensual programado.",
    fechaAlta: "2026-06-01",
    estado: "Activo",
    bitacora: []
  }
];

const initialProveedores = [
  { id: "p1", nombre: "Electricidad Mendoza", rubro: "Electricidad", telefono: "2614203040", whatsapp: "2614203040", email: "ventas@elecmendoza.com.ar", direccion: "Av. España 450, Mendoza", cuit: "30-58963245-2", contacto: "Carlos Pérez", notas: "Descuento del 10% por pago en efectivo. Entrega a domicilio sin cargo por compras mayores a $50.000.", bitacora: [] },
  { id: "p2", nombre: "Materiales Durlock Oeste", rubro: "Durlock y Yeso", telefono: "2614987654", whatsapp: "2614987654", email: "presupuestos@durlockoeste.com", direccion: "Carril Rodríguez Peña 3200, Godoy Cruz", cuit: "30-68932456-1", contacto: "Roberto Gómez", notas: "Tienen el mejor precio en placas antihumedad. Entregan los martes y jueves.", bitacora: [] }
];

const initialTecnicos = [
  { id: "t1", nombre: "Carlos", apellido: "Pereyra", dni: "32.145.987", telefono: "2614667890", email: "carlos.p@gmail.com", especialidad: "Electricidad", estado: "Activo", notas: "Técnico principal matriculado." },
  { id: "t2", nombre: "María", apellido: "López", dni: "35.987.654", telefono: "2613324455", email: "maria.l@gmail.com", especialidad: "Pintura y Albañilería", estado: "Activo", notas: "Especialista en acabados finos y durlock." },
  { id: "t3", nombre: "Julieta", apellido: "Duarte", dni: "38.223.444", telefono: "2612234455", email: "julieta.d@gmail.com", especialidad: "Plomería y Gas", estado: "Activo", notas: "Matriculada de segunda categoría." }
];

const initialProductos = [
  { id: "prod1", codigo: "ELE-001", codigoBarras: "7791234567890", nombre: "Cable Eléctrico 2.5mm", categoria: "Electricidad", marca: "Prismien", descripcion: "Rollo de 100 metros, color celeste", proveedor: "Electricidad Mendoza", costo: 18000, precioVenta: 26000, stockActual: 15, stockMinimo: 5, unidadMedida: "rollos", ubicacion: "Estante A1", estado: "Activo" },
  { id: "prod2", codigo: "DUR-002", codigoBarras: "7791234567891", nombre: "Placa Durlock Standard 12.5mm", categoria: "Durlock", marca: "Knauf", descripcion: "Placa de yeso 1.20 x 2.40", proveedor: "Materiales Durlock Oeste", costo: 9500, precioVenta: 14500, stockActual: 24, stockMinimo: 10, unidadMedida: "unidades", ubicacion: "Estante B3", estado: "Activo" },
  { id: "prod3", codigo: "PIN-003", codigoBarras: "7791234567892", nombre: "Látex Satinado Blanco 20L", categoria: "Pintura", marca: "Alba", descripcion: "Pintura lavable satinada de alta cobertura", proveedor: "Materiales Durlock Oeste", costo: 42000, precioVenta: 62000, stockActual: 3, stockMinimo: 4, unidadMedida: "baldes", ubicacion: "Depósito Piso", estado: "Activo" }
];

const initialServicios = [
  { id: "srv1", nombre: "Instalación Boca de Luz", categoria: "electricidad", descripcion: "Instalación completa de boca de techo/pared con cableado", precioBase: 13300, unidad: "boca", duracionEstimada: "2 hs", costoManoObra: 8000, estado: "Activo" },
  { id: "srv2", nombre: "Colocación Placas Yeso Antihumedad", categoria: "durlock", descripcion: "Instalación de placas con perfilería y masillado completo", precioBase: 15500, unidad: "mts2", duracionEstimada: "4 hs", costoManoObra: 9000, estado: "Activo" },
  { id: "srv3", nombre: "Pintura Látex Satinado (Paredes)", categoria: "pintura", descripcion: "Preparación de superficie y 2 manos de pintura", precioBase: 13500, unidad: "mts2", duracionEstimada: "3 hs", costoManoObra: 7500, estado: "Activo" }
];

const initialPresupuestos = [
  {
    id: "pres1", numero: "00016", clienteId: "c1", clienteNombre: "Martín Colucci / Pía Leiva", tipoTrabajo: "Remodelación", fecha: "2026-04-20", validez: "15 días hábiles", estado: "Aceptado",
    items: [
      { id: "i1", descripcion: "Zócalo placas de yeso antihumedad, perfil de ajuste, 60 cm alto", cantidad: 4.5, precioUnitario: 15500, total: 70000 },
      { id: "i2", descripcion: "Reparación y masillado completo paredes, 1 mano sellador fijador (material incluido), 2 manos pintura latex satinado un (1) color", cantidad: 30, precioUnitario: 13500, total: 400000 },
      { id: "i3", descripcion: "Bocas de electricidad", cantidad: 6, precioUnitario: 13300, total: 80000 },
      { id: "i4", descripcion: "Colocación zócalo mdf pre pintado", cantidad: 14, precioUnitario: 5700, total: 80000 },
      { id: "i5", descripcion: "Pintura aberturas sintético satinado", cantidad: 3, precioUnitario: 33500, total: 100000 }
    ],
    subtotal: 730000, desgloseEfectivo: 150000, desgloseCanje: 580000,
    observaciones: "Presupuesto de acuerdo con render recibido, valido por 15 dias habiles. No incluye materiales.",
    obraCreada: true, obraId: "o1"
  },
  {
    id: "pres2", numero: "00017", clienteId: "c2", clienteNombre: "Familia Gómez", tipoTrabajo: "Electricidad", fecha: "2026-05-20", validez: "15 días hábiles", estado: "Enviado",
    items: [
      { id: "i6", descripcion: "Instalación eléctrica completa de tablero y bocas", cantidad: 1, precioUnitario: 320000, total: 320000 }
    ],
    subtotal: 320000, desgloseEfectivo: 320000, desgloseCanje: 0,
    observaciones: "No incluye materiales.",
    obraCreada: false, obraId: ""
  }
];

const initialObras = [
  {
    id: "o1", numero: "0008", clienteId: "c1", clienteNombre: "Martín Colucci / Pía Leiva", tipoTrabajo: "Remodelación",
    descripcion: "Remodelación e instalaciones eléctricas + pintura y durlock.",
    direccion: "Tandil 462, Dorrego", telefono: "2616554321",
    tecnicoAsignadoId: "t1", tecnicoAsignadoNombre: "Carlos Pereyra",
    fechaInicio: "2026-04-22", hora: "08:30",
    estado: "En curso", progreso: 65,
    presupuestoAsociadoId: "pres1",
    importeTotal: 730000, importePagado: 150000, importePendiente: 580000,
    formaPago: "Efectivo + Canje",
    observaciones: "El canje corresponde a una notebook entregada como parte de pago.",
    materialesUsados: [
      { id: "m1", productoId: "prod1", nombre: "Cable Eléctrico 2.5mm", cantidad: 2, costoUnitario: 18000 },
      { id: "m2", productoId: "prod2", nombre: "Placa Durlock Standard 12.5mm", cantidad: 10, costoUnitario: 9500 }
    ],
    pagosRegistrados: [
      { id: "pay1", fecha: "2026-04-22", concepto: "Anticipo de obra en efectivo", importe: 150000, formaPago: "Efectivo" }
    ],
    bitacora: [
      { id: "ob1", fecha: "2026-04-22T08:30:00-03:00", tipo: "Visita Técnica", descripcion: "Inicio de obra. Replanteo de bocas de luz con Carlos Pereyra.", usuario: "Alexis Jofré" },
      { id: "ob2", fecha: "2026-04-25T17:00:00-03:00", tipo: "Materiales Agregados", descripcion: "Se consumieron 2 rollos de Cable 2.5mm y 10 placas de Durlock.", usuario: "Alexis Jofré" },
      { id: "ob3", fecha: "2026-05-02T11:00:00-03:00", tipo: "Pago", descripcion: "Se registró el pago de anticipo de $150.000 en efectivo.", usuario: "Alexis Jofré" }
    ]
  }
];

const initialCobros = [
  { id: "cob1", tipo: "Ingreso", fecha: "2026-04-22", clienteId: "c1", clienteNombre: "Martín Colucci / Pía Leiva", concepto: "Anticipo Presupuesto #00016", obraId: "o1", importe: 150000, formaPago: "Efectivo", observaciones: "" },
  { id: "cob2", tipo: "Ingreso", fecha: "2026-05-05", clienteId: "c3", clienteNombre: "Estudio Integral SRL", concepto: "Abono mantenimiento mensual", obraId: "", importe: 80000, formaPago: "Transferencia", observaciones: "" },
  { id: "cob3", tipo: "Egreso", fecha: "2026-04-23", proveedorId: "p1", proveedorNombre: "Electricidad Mendoza", categoria: "Materiales", concepto: "Compra de cables y térmicas para Obra #0008", importe: 54000, formaPago: "Transferencia", comprobante: "factura_elec_mza.pdf", observaciones: "Factura A" },
  { id: "cob4", tipo: "Egreso", fecha: "2026-05-02", proveedorId: "", proveedorNombre: "YPF Mendoza", categoria: "Combustible", concepto: "Combustible camioneta", importe: 25000, formaPago: "Tarjeta", comprobante: "", observaciones: "Carga gasoil" }
];

const initialAgenda = [
  { id: "e1", title: "Instalación eléctrica - Colucci", start: "2026-08-26T08:30:00", end: "2026-08-26T12:30:00", clienteId: "c1", clienteNombre: "Martín Colucci / Pía Leiva", obraId: "o1", tecnicoId: "t1", tecnicoNombre: "Carlos Pereyra", notes: "Finalizar colocación de tomas y cableado." },
  { id: "e2", title: "Visita relevamiento - Gómez", start: "2026-08-25T14:30:00", end: "2026-08-25T16:00:00", clienteId: "c2", clienteNombre: "Familia Gómez", obraId: "", tecnicoId: "t2", tecnicoNombre: "María López", notes: "Relevamiento de pintura y zócalos." }
];

// ─── Provider ───────────────────────────────────────────────────────────────

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const remote = shouldUseRemoteData();

  const [config, setConfigState] = useState(() => safeGetItem('aj_config', initialConfig));
  const [clientes, setClientes] = useState(() => (remote ? [] : safeGetItem('aj_clientes', initialClientes)));
  const [proveedores, setProveedores] = useState(() => (remote ? [] : safeGetItem('aj_proveedores', initialProveedores)));
  const [tecnicos, setTecnicos] = useState(() => (remote ? [] : safeGetItem('aj_tecnicos', initialTecnicos)));
  const [productos, setProductos] = useState(() => (remote ? [] : safeGetItem('aj_productos', initialProductos)));
  const [servicios, setServicios] = useState(() => (remote ? [] : safeGetItem('aj_servicios', initialServicios)));
  const [presupuestos, setPresupuestos] = useState(() => (remote ? [] : safeGetItem('aj_presupuestos', initialPresupuestos)));
  const [obras, setObras] = useState(() => (remote ? [] : safeGetItem('aj_obras', initialObras)));
  const [cobros, setCobros] = useState(() => (remote ? [] : safeGetItem('aj_cobros', initialCobros)));
  const [agenda, setAgenda] = useState(() => (remote ? [] : safeGetItem('aj_agenda', initialAgenda)));
  const [dataLoading, setDataLoading] = useState(Boolean(remote && user));
  const [dataError, setDataError] = useState(null);

  const persistLocal = !remote;
  useEffect(() => { if (persistLocal) localStorage.setItem('aj_config', JSON.stringify(config)); }, [config, persistLocal]);
  useEffect(() => { if (persistLocal) localStorage.setItem('aj_clientes', JSON.stringify(clientes)); }, [clientes, persistLocal]);
  useEffect(() => { if (persistLocal) localStorage.setItem('aj_proveedores', JSON.stringify(proveedores)); }, [proveedores, persistLocal]);
  useEffect(() => { if (persistLocal) localStorage.setItem('aj_tecnicos', JSON.stringify(tecnicos)); }, [tecnicos, persistLocal]);
  useEffect(() => { if (persistLocal) localStorage.setItem('aj_productos', JSON.stringify(productos)); }, [productos, persistLocal]);
  useEffect(() => { if (persistLocal) localStorage.setItem('aj_servicios', JSON.stringify(servicios)); }, [servicios, persistLocal]);
  useEffect(() => { if (persistLocal) localStorage.setItem('aj_presupuestos', JSON.stringify(presupuestos)); }, [presupuestos, persistLocal]);
  useEffect(() => { if (persistLocal) localStorage.setItem('aj_obras', JSON.stringify(obras)); }, [obras, persistLocal]);
  useEffect(() => { if (persistLocal) localStorage.setItem('aj_cobros', JSON.stringify(cobros)); }, [cobros, persistLocal]);
  useEffect(() => { if (persistLocal) localStorage.setItem('aj_agenda', JSON.stringify(agenda)); }, [agenda, persistLocal]);

  const loadRemote = useCallback(async () => {
    if (!remote || !user) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const safe = async (fn, fallback) => {
        try {
          return await fn();
        } catch (err) {
          if (err instanceof ServiceError && err.code === 'FORBIDDEN') return fallback;
          throw err;
        }
      };

      const [
        cfg, cli, prov, tec, prod, serv, pres, obr, cob, ag,
      ] = await Promise.all([
        safe(() => configApi.fetchConfiguracion(), null),
        safe(() => clientesApi.fetchClientes(), []),
        safe(() => proveedoresApi.fetchProveedores(), []),
        safe(() => tecnicosApi.fetchTecnicos(), []),
        safe(() => productosApi.fetchProductos(), []),
        safe(() => serviciosApi.fetchServicios(), []),
        safe(() => presupuestosApi.fetchPresupuestos(), []),
        safe(() => obrasApi.fetchObras(), []),
        safe(() => cobrosApi.fetchCobros(), []),
        safe(() => agendaApi.fetchAgenda(), []),
      ]);
      if (cfg) setConfigState(cfg);
      setClientes(cli);
      setProveedores(prov);
      setTecnicos(tec);
      setProductos(prod);
      setServicios(serv);
      setPresupuestos(pres);
      setObras(obr);
      setCobros(cob);
      setAgenda(ag);
    } catch (err) {
      const message = err instanceof ServiceError ? err.message : (err.message || 'Error al cargar datos');
      setDataError(message);
    } finally {
      setDataLoading(false);
    }
  }, [remote, user]);

  useEffect(() => {
    if (remote && user) loadRemote();
  }, [remote, user, loadRemote]);

  const setConfig = async (updater) => {
    const next = typeof updater === 'function' ? updater(config) : updater;
    if (remote) {
      const saved = await configApi.updateConfiguracion(next);
      setConfigState(saved);
      return saved;
    }
    setConfigState(next);
    return next;
  };

  // ─── Helper Functions ─────────────────────────────────────────────────────

  const addClienteBitacora = async (clienteId, entry) => {
    if (remote) {
      await clientesApi.addClienteBitacora(clienteId, entry, user?.nombre);
      await loadRemote();
      return;
    }
    setClientes(prev => prev.map(c => {
      if (c.id === clienteId) {
        return {
          ...c,
          bitacora: [
            {
              id: generateId(),
              fecha: new Date().toISOString(),
              usuario: config.titular,
              ...entry
            },
            ...(c.bitacora || [])
          ]
        };
      }
      return c;
    }));
  };

  const createCliente = async (payload) => {
    if (remote) {
      const created = await clientesApi.createCliente(payload);
      await loadRemote();
      return created;
    }
    const created = {
      id: generateId(),
      ...payload,
      fechaAlta: new Date().toISOString().split('T')[0],
      bitacora: [{
        id: generateId(),
        fecha: new Date().toISOString(),
        tipo: 'Nota Manual',
        descripcion: 'Alta de cliente en el sistema.',
        usuario: config.titular,
      }],
    };
    setClientes(prev => [...prev, created]);
    return created;
  };

  const removeCliente = async (id) => {
    if (remote) {
      await clientesApi.deleteCliente(id);
      await loadRemote();
      return;
    }
    setClientes(prev => prev.filter(c => c.id !== id));
  };

  const saveCliente = async (id, payload) => {
    const current = clientes.find(c => c.id === id) || {};
    const merged = { ...current, ...payload, id };
    if (remote) {
      await clientesApi.updateCliente(id, merged);
      await loadRemote();
      return merged;
    }
    setClientes(prev => prev.map(c => c.id === id ? merged : c));
    return merged;
  };

  const createProveedor = async (payload) => {
    if (remote) {
      const created = await proveedoresApi.createProveedor(payload);
      await loadRemote();
      return created;
    }
    const created = { id: generateId(), ...payload, bitacora: [] };
    setProveedores(prev => [...prev, created]);
    return created;
  };

  const saveProveedor = async (id, payload) => {
    const current = proveedores.find(p => p.id === id) || {};
    const merged = { ...current, ...payload, id };
    if (remote) {
      await proveedoresApi.updateProveedor(id, merged);
      await loadRemote();
      return merged;
    }
    setProveedores(prev => prev.map(p => p.id === id ? merged : p));
    return merged;
  };

  const createTecnico = async (payload) => {
    if (remote) {
      const created = await tecnicosApi.createTecnico(payload);
      await loadRemote();
      return created;
    }
    const created = { id: generateId(), ...payload };
    setTecnicos(prev => [...prev, created]);
    return created;
  };

  const saveProducto = async (payload, editingId) => {
    if (remote) {
      if (editingId) await productosApi.updateProducto(editingId, { ...payload, id: editingId });
      else await productosApi.createProducto(payload);
      await loadRemote();
      return;
    }
    if (editingId) {
      setProductos(prev => prev.map(p => p.id === editingId ? { ...p, ...payload } : p));
    } else {
      setProductos(prev => [...prev, { id: generateId(), ...payload }]);
    }
  };

  const removeProducto = async (id) => {
    if (remote) {
      await productosApi.deleteProducto(id);
      await loadRemote();
      return;
    }
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  const saveServicio = async (payload, editingId) => {
    if (remote) {
      if (editingId) await serviciosApi.updateServicio(editingId, payload);
      else await serviciosApi.createServicio(payload);
      await loadRemote();
      return;
    }
    if (editingId) {
      setServicios(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } : s));
    } else {
      setServicios(prev => [...prev, { id: generateId(), ...payload }]);
    }
  };

  const removeServicio = async (id) => {
    if (remote) {
      await serviciosApi.deleteServicio(id);
      await loadRemote();
      return;
    }
    setServicios(prev => prev.filter(s => s.id !== id));
  };

  const savePresupuesto = async (payload, editingId) => {
    if (remote) {
      const saved = editingId
        ? await presupuestosApi.updatePresupuesto(editingId, payload)
        : await presupuestosApi.createPresupuesto(payload);
      await loadRemote();
      return saved;
    }
    if (editingId) {
      const updated = { ...presupuestos.find(p => p.id === editingId), ...payload, id: editingId };
      setPresupuestos(prev => prev.map(p => p.id === editingId ? updated : p));
      return updated;
    }
    const created = {
      id: generateId(),
      numero: payload.numero || (presupuestos.length + 17).toString().padStart(5, '0'),
      ...payload,
    };
    setPresupuestos(prev => [created, ...prev]);
    return created;
  };

  const removePresupuesto = async (id) => {
    if (remote) {
      await presupuestosApi.deletePresupuesto(id);
      await loadRemote();
      return;
    }
    setPresupuestos(prev => prev.filter(p => p.id !== id));
  };

  /** Convierte un presupuesto en obra */
  const convertPresupuestoToObra = async (presupuestoId) => {
    if (remote) {
      const data = await presupuestosApi.convertPresupuestoToObra(presupuestoId);
      await loadRemote();
      return { id: data.obra_id, numero: data.numero };
    }

    const pres = presupuestos.find(p => p.id === presupuestoId);
    if (!pres) return null;

    const cliente = clientes.find(c => c.id === pres.clienteId);
    const newObraNum = (obras.length + 1).toString().padStart(4, '0');

    const newObra = {
      id: generateId(),
      numero: newObraNum,
      clienteId: pres.clienteId,
      clienteNombre: pres.clienteNombre,
      tipoTrabajo: pres.tipoTrabajo,
      descripcion: `Obra iniciada desde Presupuesto #${pres.numero}`,
      direccion: cliente?.direccion || "",
      telefono: cliente?.telefono || "",
      tecnicoAsignadoId: "",
      tecnicoAsignadoNombre: "Sin asignar",
      fechaInicio: new Date().toISOString().split('T')[0],
      hora: "09:00",
      estado: "Pendiente",
      progreso: 0,
      presupuestoAsociadoId: pres.id,
      importeTotal: pres.subtotal || 0,
      importePagado: 0,
      importePendiente: pres.subtotal || 0,
      formaPago: (pres.desgloseCanje || 0) > 0 ? "Efectivo + Canje" : "Efectivo",
      observaciones: pres.observaciones || "",
      materialesUsados: [],
      pagosRegistrados: [],
      bitacora: [{
        id: generateId(),
        fecha: new Date().toISOString(),
        tipo: "Creación",
        descripcion: `Obra creada automáticamente desde el Presupuesto #${pres.numero}.`,
        usuario: config.titular
      }]
    };

    setObras(prev => [...prev, newObra]);

    setPresupuestos(prev => prev.map(p => {
      if (p.id === presupuestoId) {
        return { ...p, estado: "Aceptado", obraCreada: true, obraId: newObra.id };
      }
      return p;
    }));

    await addClienteBitacora(pres.clienteId, {
      tipo: "Cambio de estado de obra",
      descripcion: `Presupuesto #${pres.numero} aceptado. Se creó la Obra #${newObraNum}.`
    });

    return newObra;
  };

  const createObra = async (payload) => {
    if (remote) {
      const created = await obrasApi.createObra(payload);
      await loadRemote();
      return created;
    }
    const created = {
      id: generateId(),
      ...payload,
      materialesUsados: payload.materialesUsados || [],
      pagosRegistrados: payload.pagosRegistrados || [],
      bitacora: payload.bitacora || [],
    };
    setObras(prev => [...prev, created]);
    return created;
  };

  const saveObra = async (id, payload) => {
    const current = obras.find(o => o.id === id) || {};
    const merged = { ...current, ...payload, id };
    if (remote) {
      await obrasApi.updateObra(id, merged);
      await loadRemote();
      return merged;
    }
    setObras(prev => prev.map(o => o.id === id ? merged : o));
    return merged;
  };

  const addObraBitacora = async (obraId, entry) => {
    if (remote) {
      await obrasApi.addObraBitacora(obraId, entry, user?.nombre || config.titular);
      await loadRemote();
      return;
    }
    setObras(prev => prev.map(o => {
      if (o.id !== obraId) return o;
      return {
        ...o,
        bitacora: [
          {
            id: generateId(),
            fecha: new Date().toISOString(),
            usuario: config.titular,
            ...entry,
          },
          ...(o.bitacora || []),
        ],
      };
    }));
  };

  /** Registra un cobro (ingreso o egreso) */
  const addCobro = async (cobroData) => {
    if (remote) {
      await cobrosApi.registrarCobro(cobroData);
      await loadRemote();
      return;
    }

    const newCobro = {
      id: generateId(),
      ...cobroData
    };

    setCobros(prev => [newCobro, ...prev]);

    if (newCobro.tipo === "Ingreso" && newCobro.obraId) {
      setObras(prev => prev.map(o => {
        if (o.id === newCobro.obraId) {
          const totalPagado = Number(o.importePagado || 0) + Number(newCobro.importe);
          const totalPendiente = Math.max(0, Number(o.importeTotal || 0) - totalPagado);

          const newPayments = [
            ...(o.pagosRegistrados || []),
            {
              id: newCobro.id,
              fecha: newCobro.fecha,
              concepto: newCobro.concepto,
              importe: Number(newCobro.importe),
              formaPago: newCobro.formaPago
            }
          ];

          const newBitacora = [
            {
              id: generateId(),
              fecha: new Date().toISOString(),
              tipo: "Pago",
              descripcion: `Registrado cobro de $${Number(newCobro.importe).toLocaleString('es-AR')} mediante ${newCobro.formaPago}.`,
              usuario: config.titular
            },
            ...(o.bitacora || [])
          ];

          addClienteBitacora(o.clienteId, {
            tipo: "Pago",
            descripcion: `Cobro de $${Number(newCobro.importe).toLocaleString('es-AR')} por la Obra #${o.numero}.`
          });

          return {
            ...o,
            importePagado: totalPagado,
            importePendiente: totalPendiente,
            pagosRegistrados: newPayments,
            bitacora: newBitacora
          };
        }
        return o;
      }));
    }
  };

  /**
   * Consume stock en una obra.
   * RETORNA: { success: true } o { error: "mensaje" }
   */
  const addMaterialToObra = async (obraId, materialData) => {
    const { productoId, cantidad } = materialData;
    const prod = productos.find(p => p.id === productoId);
    const validation = validateMaterialConsumption({ producto: prod, cantidad });
    if (validation.error) return { error: validation.error };

    if (remote) {
      const result = await obrasApi.consumirMaterialObra(obraId, productoId, validation.cantidad);
      if (result?.error) return result;
      await loadRemote();
      return { success: true };
    }

    const cantNum = validation.cantidad;
    const stockDisponible = Number(prod.stockActual || 0);

    setProductos(prev => prev.map(p => {
      if (p.id === productoId) {
        return { ...p, stockActual: stockDisponible - cantNum };
      }
      return p;
    }));

    const newMaterial = {
      id: generateId(),
      productoId,
      nombre: prod.nombre,
      cantidad: cantNum,
      costoUnitario: prod.costo || 0
    };

    setObras(prev => prev.map(o => {
      if (o.id === obraId) {
        return {
          ...o,
          materialesUsados: [...(o.materialesUsados || []), newMaterial],
          bitacora: [
            {
              id: generateId(),
              fecha: new Date().toISOString(),
              tipo: "Materiales Agregados",
              descripcion: `Se agregaron ${cantNum} ${prod.unidadMedida || 'unidades'} de "${prod.nombre}" a la obra. Stock restante: ${stockDisponible - cantNum}.`,
              usuario: config.titular
            },
            ...(o.bitacora || [])
          ]
        };
      }
      return o;
    }));

    return { success: true };
  };

  const createAgendaEvent = async (payload) => {
    if (remote) {
      const created = await agendaApi.createAgendaEvent(payload);
      await loadRemote();
      return created;
    }
    const created = { id: generateId(), ...payload };
    setAgenda(prev => [...prev, created]);
    return created;
  };

  const removeAgendaEvent = async (id) => {
    if (remote) {
      await agendaApi.deleteAgendaEvent(id);
      await loadRemote();
      return;
    }
    setAgenda(prev => prev.filter(ev => ev.id !== id));
  };

  const getLocalSnapshot = () => ({
    aj_config: config,
    aj_clientes: clientes,
    aj_proveedores: proveedores,
    aj_tecnicos: tecnicos,
    aj_productos: productos,
    aj_servicios: servicios,
    aj_presupuestos: presupuestos,
    aj_obras: obras,
    aj_cobros: cobros,
    aj_agenda: agenda,
  });

  // ─── Context Value ────────────────────────────────────────────────────────

  return (
    <AppContext.Provider value={{
      isRemote: remote,
      dataLoading,
      dataError,
      setDataError,
      reloadData: loadRemote,
      getLocalSnapshot,
      config, setConfig,
      clientes,
      proveedores,
      tecnicos,
      productos,
      servicios,
      presupuestos,
      obras,
      cobros,
      agenda,
      createCliente,
      saveCliente,
      removeCliente,
      addClienteBitacora,
      createProveedor,
      saveProveedor,
      createTecnico,
      saveProducto,
      removeProducto,
      saveServicio,
      removeServicio,
      savePresupuesto,
      removePresupuesto,
      convertPresupuestoToObra,
      createObra,
      saveObra,
      addObraBitacora,
      addCobro,
      addMaterialToObra,
      createAgendaEvent,
      removeAgendaEvent,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
