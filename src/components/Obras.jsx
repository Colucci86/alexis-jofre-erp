import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TIPOS_TRABAJO } from '../utils/categorias';
import { generateId } from '../utils/id';
import { 
  Plus, 
  Search, 
  Briefcase, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  User, 
  MapPin, 
  FileText, 
  Wrench, 
  Send,
  Camera,
  BookOpen,
  X,
  AlertCircle,
  Trash2,
  Pencil,
  Upload
} from 'lucide-react';
import { subirFotoBitacora } from '../services/fotoService';

/** Devuelve la cadena YYYY-MM-DD de una fecha local (sin conversión UTC) */
function toLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Obras() {
  const { 
    obras, 
    clientes, 
    tecnicos, 
    tecnicosActivos, 
    productos, 
    addMaterialToObra, 
    createObra,
    saveObra,
    removeObra,
    addObraBitacora,
    updateBitacoraEntrada,
    config 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedObra, setSelectedObra] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('Resumen');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newObra, setNewObra] = useState({
    clienteId: '',
    tipoTrabajo: 'Electricidad',
    descripcion: '',
    direccion: '',
    telefono: '',
    tecnicoAsignadoId: '',
    fechaInicio: toLocalDateString(),
    hora: '08:30',
    importeTotal: 0,
    formaPago: 'Efectivo',
    observaciones: ''
  });

  // Adding materials state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQty, setProductQty] = useState(1);
  const [stockError, setStockError] = useState('');

  // Manual bitacora state
  const [manualNote, setManualNote] = useState('');
  const [manualFecha, setManualFecha] = useState(toLocalDateString());
  const [manualHora, setManualHora] = useState(
    () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
  const [manualFoto, setManualFoto] = useState('');

  // Edit existing bitacora entry state
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editEntryData, setEditEntryData] = useState({ fecha: '', hora: '' });
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoError, setFotoError] = useState('');

  const handleFotoManual = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFotoError('');
    setSubiendoFoto(true);
    try {
      const url = await subirFotoBitacora(file, {
        entidadTipo: 'obra',
        entidadId: selectedObra?.id,
      });
      setManualFoto(url);
    } catch (err) {
      setFotoError(err.message || 'No se pudo subir la foto.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  // Keep selectedObra synced with obras state
  useEffect(() => {
    if (selectedObra) {
      const updated = obras.find(o => o.id === selectedObra.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedObra)) {
        setSelectedObra(updated);
      }
    }
  }, [obras]);

  const handleCreateObra = async (e) => {
    e.preventDefault();
    if (!newObra.clienteId) return;

    const client = clientes.find(c => c.id === newObra.clienteId);
    const tech = tecnicos.find(t => t.id === newObra.tecnicoAsignadoId);
    
    const maxNum = obras.reduce((max, o) => Math.max(max, parseInt(o.numero, 10) || 0), 0);
    const newObraNum = (maxNum + 1).toString().padStart(4, '0');
    const payload = {
      numero: newObraNum,
      clienteId: newObra.clienteId,
      clienteNombre: client ? client.nombre : 'Particular',
      tipoTrabajo: newObra.tipoTrabajo,
      descripcion: newObra.descripcion,
      direccion: newObra.direccion || (client?.direccion || ''),
      telefono: newObra.telefono || (client?.telefono || ''),
      tecnicoAsignadoId: newObra.tecnicoAsignadoId,
      tecnicoAsignadoNombre: tech ? `${tech.nombre} ${tech.apellido}` : 'Sin asignar',
      fechaInicio: newObra.fechaInicio,
      hora: newObra.hora,
      estado: 'Pendiente',
      progreso: 0,
      presupuestoAsociadoId: '',
      importeTotal: Number(newObra.importeTotal) || 0,
      importePagado: 0,
      importePendiente: Number(newObra.importeTotal) || 0,
      formaPago: newObra.formaPago,
      observaciones: newObra.observaciones || '',
      materialesUsados: [],
      pagosRegistrados: [],
      bitacora: [
        {
          id: generateId(),
          fecha: new Date().toISOString(),
          tipo: 'Creación',
          descripcion: 'Registro inicial de la obra.',
          usuario: config.titular
        }
      ]
    };

    try {
      await createObra(payload);
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'No se pudo crear la obra.');
    }
  };

  const handleUpdateStatus = async (obraId, newStatus) => {
    let prog = 0;
    if (newStatus === 'En curso' || newStatus === 'En proceso') prog = 30;
    if (newStatus === 'Finalizado') prog = 100;
    if (newStatus === 'Pausado') prog = 50;

    try {
      await saveObra(obraId, { estado: newStatus, progreso: prog });
      await addObraBitacora(obraId, {
        tipo: 'Cambio de estado de obra',
        descripcion: `El estado cambió a: "${newStatus}". Progreso estimado: ${prog}%.`,
      });
    } catch (err) {
      alert(err.message || 'No se pudo actualizar el estado.');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setStockError('');

    if (!selectedProductId) {
      setStockError('Seleccioná un producto del inventario.');
      return;
    }
    if (!productQty || Number(productQty) <= 0) {
      setStockError('La cantidad debe ser mayor a cero.');
      return;
    }

    try {
      const result = await addMaterialToObra(selectedObra.id, {
        productoId: selectedProductId,
        cantidad: Number(productQty)
      });

      if (result?.error) {
        setStockError(result.error);
        return;
      }

      setSelectedProductId('');
      setProductQty(1);
    } catch (err) {
      setStockError(err.message || 'No se pudo registrar el material.');
    }
  };

  const handleAddManualNote = async (e) => {
    e.preventDefault();
    if (!manualNote) return;

    const fechaISO = new Date(`${manualFecha}T${manualHora || '00:00'}:00`).toISOString();

    try {
      await addObraBitacora(selectedObra.id, {
        tipo: 'Nota Manual',
        descripcion: manualNote,
        fecha: fechaISO,
        fotoUrl: manualFoto,
      });
      setManualNote('');
      setManualFoto('');
      setManualFecha(toLocalDateString());
      setManualHora(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      alert(err.message || 'No se pudo guardar la nota.');
    }
  };

  const handleDeleteObra = async (obra) => {
    if (!window.confirm(`¿Eliminar la obra #${obra.numero} de ${obra.clienteNombre}? Quedará oculta de la gestión activa conservando cobros, materiales y bitácora.`)) return;
    try {
      await removeObra(obra.id);
      setSelectedObra(null);
      setMobileView('list');
    } catch (err) {
      alert(err.message || 'No se pudo eliminar la obra.');
    }
  };

  const startEditEntry = (b) => {
    setEditingEntryId(b.id);
    const d = new Date(b.fecha);
    if (Number.isNaN(d.getTime())) {
      setEditEntryData({ fecha: toLocalDateString(), hora: '00:00' });
      return;
    }
    setEditEntryData({
      fecha: toLocalDateString(d),
      hora: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    });
  };

  const handleSaveEntryEdit = async (b) => {
    const fechaISO = new Date(`${editEntryData.fecha}T${editEntryData.hora || '00:00'}:00`).toISOString();
    try {
      await updateBitacoraEntrada('obra', selectedObra.id, b.id, { fecha: fechaISO });
      setEditingEntryId(null);
    } catch (err) {
      alert(err.message || 'No se pudo actualizar la entrada.');
    }
  };

  // Filter list
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'

  const filteredObras = obras.filter(o => {
    const matchesSearch = o.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.numero.includes(searchTerm) || 
                          o.tipoTrabajo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || o.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-h-[calc(100vh-10rem)]">
      
      {/* LEFT COLUMN: LIST */}
      <div className={`lg:col-span-5 bg-[#1E293B] rounded-xl border border-[#334155] p-4 sm:p-6 flex flex-col justify-between shadow-lg ${
        mobileView === 'detail' ? 'hidden lg:flex' : 'flex'
      }`}>
        <div>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-white">Obras</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Obra
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0F1729] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F1729] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="Todos">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Programado">Programado</option>
              <option value="En curso">En curso</option>
              <option value="En proceso">En proceso</option>
              <option value="Pausado">Pausado</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>

            {/* List scroll container */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredObras.map(o => (
              <div
                key={o.id}
                onClick={() => { setSelectedObra(o); setActiveSubTab('Resumen'); setMobileView('detail'); }}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  selectedObra?.id === o.id 
                    ? 'bg-[#16223F] border-blue-500 shadow-md' 
                    : 'bg-[#111827]/60 border-[#334155] hover:bg-[#16223F]/40'
                }`}
              >
                <div>
                  <h4 className="font-bold text-white text-sm">Obra #{o.numero}</h4>
                  <p className="text-xs text-gray-400 mt-1">{o.clienteNombre}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[9px] bg-blue-900/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-semibold">
                      {o.tipoTrabajo}
                    </span>
                    {o.tecnicoAsignadoNombre !== 'Sin asignar' && (
                      <span className="text-[9px] bg-[#1E293B] text-gray-300 px-2 py-0.5 rounded border border-[#475569]">
                        Téc: {o.tecnicoAsignadoNombre}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white">${o.importeTotal.toLocaleString('es-AR')}</p>
                  <span className={`inline-block mt-2 text-[9px] px-2 py-0.5 rounded font-bold ${
                    o.estado === 'Finalizado' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : o.estado === 'En curso' || o.estado === 'En proceso'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {o.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: WORK DETAILS & PROGRESS */}
      <div className={`lg:col-span-7 ${
        mobileView === 'list' && !selectedObra ? 'hidden lg:block' : 
        mobileView === 'list' ? 'hidden lg:block' : 'block'
      }`}>
        {!selectedObra ? (
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 h-full flex flex-col items-center justify-center text-center shadow-lg text-gray-500">
            <Briefcase className="w-12 h-12 mb-3 text-gray-600" />
            <p className="text-sm">Selecciona una obra del panel izquierdo para monitorear su estado, agregar insumos o registrar notas del técnico.</p>
          </div>
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] flex flex-col justify-between overflow-hidden shadow-lg h-full">
            {/* Back button on mobile */}
            <div className="lg:hidden p-3 border-b border-[#334155] bg-[#111827]/40">
              <button
                onClick={() => setMobileView('list')}
                className="flex items-center gap-2 text-blue-400 text-xs font-semibold"
              >
                ← Volver a la lista de obras
              </button>
            </div>
            
            {/* Header / Title bar */}
            <div className="p-6 border-b border-[#334155] bg-[#111827]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">Obra #{selectedObra.numero}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedObra.estado === 'Finalizado' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {selectedObra.estado}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Cliente: {selectedObra.clienteNombre}</p>
                
                {/* Progress bar */}
                <div className="mt-4 w-64">
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-1">
                    <span>Avance General</span>
                    <span>{selectedObra.progreso}%</span>
                  </div>
                  <div className="w-full bg-[#0F1729] h-2 rounded-full overflow-hidden border border-[#334155]">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-500" 
                      style={{ width: `${selectedObra.progreso}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status updater */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Cambiar Estado</label>
                <select
                  value={selectedObra.estado}
                  onChange={(e) => handleUpdateStatus(selectedObra.id, e.target.value)}
                  className="bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Programado">Programado</option>
                  <option value="En curso">En curso</option>
                  <option value="Pausado">Pausado</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
                <button
                  onClick={() => handleDeleteObra(selectedObra)}
                  className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 rounded-lg text-[10px] transition-colors border border-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar Obra
                </button>
              </div>
            </div>

            {/* Inner Subtabs */}
            <div className="flex border-b border-[#334155] bg-[#111827]/20 overflow-x-auto">
              {['Resumen', 'Materiales', 'Pagos', 'Bitácora de Progreso'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={`px-4 sm:px-5 py-3 sm:py-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    activeSubTab === tab 
                      ? 'border-blue-500 text-white bg-[#1E293B]' 
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-[#16223F]/30'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content panel */}
            <div className="p-6 flex-1 overflow-y-auto max-h-[380px]">
              
              {/* SUBTAB: RESUMEN */}
              {activeSubTab === 'Resumen' && (
                <div className="space-y-6">
                  <div className="bg-[#111827]/40 rounded-xl p-4 border border-[#334155] space-y-4">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Ficha Técnica</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                      <div><span className="text-gray-500">Técnico Asignado:</span> {selectedObra.tecnicoAsignadoNombre}</div>
                      <div><span className="text-gray-500">Fecha de Inicio:</span> {selectedObra.fechaInicio} | {selectedObra.hora} hs</div>
                      <div><span className="text-gray-500">Dirección:</span> {selectedObra.direccion}</div>
                      <div><span className="text-gray-500">Forma de Pago:</span> {selectedObra.formaPago}</div>
                      <div className="md:col-span-2"><span className="text-gray-500">Descripción:</span> {selectedObra.descripcion}</div>
                      {selectedObra.observaciones && (
                        <div className="md:col-span-2 border-t border-gray-800 pt-2 text-yellow-500/80">
                          <span className="text-gray-500">Observaciones:</span> {selectedObra.observaciones}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial snapshot */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#111827] rounded-lg border border-[#334155] text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Total Obra</p>
                      <p className="text-sm font-extrabold text-white mt-1">${selectedObra.importeTotal.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="p-3 bg-[#111827] rounded-lg border border-[#334155] text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Pagado</p>
                      <p className="text-sm font-extrabold text-green-400 mt-1">${selectedObra.importePagado.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="p-3 bg-[#111827] rounded-lg border border-[#334155] text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Pendiente</p>
                      <p className="text-sm font-extrabold text-red-400 mt-1">${selectedObra.importePendiente.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB: MATERIALES (Consuming Stock) */}
              {activeSubTab === 'Materiales' && (
                <div className="space-y-6">
                  {/* Add materials form */}
                  <form onSubmit={handleAddMaterial} className="bg-[#111827]/40 p-4 rounded-xl border border-[#334155] grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">Seleccionar Producto en Stock</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="">Seleccione insumo...</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stockActual <= 0}>
                            {p.nombre} (Disponibles: {p.stockActual} {p.unidadMedida})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">Cantidad</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          value={productQty}
                          onChange={(e) => setProductQty(e.target.value)}
                          className="w-16 bg-[#0F1729] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs py-1.5 flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Error de stock */}
                  {stockError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2 mt-3">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400 font-semibold">{stockError}</p>
                      <button onClick={() => setStockError('')} className="ml-auto text-red-400 hover:text-red-300">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Materials list */}
                  <div className="bg-[#111827]/20 border border-[#334155] rounded-xl p-4">
                    <h5 className="font-bold text-white text-xs mb-3">Materiales Consumidos en esta Obra</h5>
                    <div className="space-y-2">
                      {(!selectedObra.materialesUsados || selectedObra.materialesUsados.length === 0) ? (
                        <p className="text-gray-500 text-xs py-4 text-center">No hay insumos cargados todavía.</p>
                      ) : (
                        selectedObra.materialesUsados.map((m, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-[#111827]/40 rounded-lg border border-[#334155]">
                            <div>
                              <p className="font-semibold text-white">{m.nombre}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">Cantidad utilizada: {m.cantidad}</p>
                            </div>
                            <span className="font-bold text-gray-400">
                              Costo: ${(m.cantidad * m.costoUnitario).toLocaleString('es-AR')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB: PAGOS */}
              {activeSubTab === 'Pagos' && (
                <div className="space-y-3">
                  <h5 className="font-bold text-white text-xs mb-2">Historial de Anticipos y Pagos Registrados</h5>
                  {(!selectedObra.pagosRegistrados || selectedObra.pagosRegistrados.length === 0) ? (
                    <p className="text-gray-500 text-xs py-6 text-center">Aún no se han registrado cobros asociados. Registra cobros en la pestaña Finanzas.</p>
                  ) : (
                    selectedObra.pagosRegistrados.map((p, idx) => (
                      <div key={idx} className="p-3 bg-[#111827] rounded-lg border border-[#334155] flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-white">{p.concepto}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Fecha: {p.fecha} | Forma de pago: {p.formaPago}</p>
                        </div>
                        <span className="font-bold text-green-400">
                          +${p.importe.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SUBTAB: BITÁCORA DE PROGRESO */}
              {activeSubTab === 'Bitácora de Progreso' && (
                <div className="space-y-6">
                  {/* Manual entry note */}
                  <form onSubmit={handleAddManualNote} className="bg-[#111827]/40 rounded-xl border border-[#334155] p-3 space-y-3">
                    <input
                      type="text"
                      placeholder="Registra una nueva actualización de la visita..."
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">Fecha del evento</label>
                        <input
                          type="date"
                          value={manualFecha}
                          onChange={(e) => setManualFecha(e.target.value)}
                          className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">Hora</label>
                        <input
                          type="time"
                          value={manualHora}
                          onChange={(e) => setManualHora(e.target.value)}
                          className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="sm:flex sm:items-end">
                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Registrar nota
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">Foto / Adjunto (opcional)</label>
                      <div className="flex items-center gap-2">
                        <label className={`flex items-center justify-center gap-2 flex-1 bg-[#0F1729] hover:bg-[#16223F] border border-[#334155] text-white font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer ${subiendoFoto ? 'opacity-60 pointer-events-none' : ''}`}>
                          <Upload className="w-3.5 h-3.5 text-blue-400" />
                          {subiendoFoto ? 'Subiendo...' : (manualFoto ? 'Cambiar foto' : 'Subir foto')}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFotoManual}
                          />
                        </label>
                        {manualFoto && (
                          <button
                            type="button"
                            onClick={() => { setManualFoto(''); setFotoError(''); }}
                            title="Quitar foto"
                            className="p-2 text-gray-400 hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="…o pegá un link (https://...)"
                        value={manualFoto}
                        onChange={(e) => setManualFoto(e.target.value)}
                        className="mt-2 w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      {fotoError && <p className="mt-1 text-[10px] text-red-400">{fotoError}</p>}
                      {manualFoto && !fotoError && (
                        <img
                          src={manualFoto}
                          alt="Vista previa"
                          className="mt-2 max-h-32 rounded-lg border border-[#334155] object-cover"
                        />
                      )}
                    </div>
                  </form>

                  {/* Timeline */}
                  <div className="space-y-4 relative border-l border-gray-700 pl-4 ml-2">
                    {selectedObra.bitacora.map((b) => (
                      <div key={b.id} className="relative">
                        <span className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full border border-darkBg" />
                        <div className="bg-[#111827]/40 p-3 rounded-lg border border-[#334155] text-xs">
                          <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                            <span className="flex items-center gap-2">
                              <span className="font-bold uppercase tracking-wider text-blue-400">{b.tipo}</span>
                              <button
                                onClick={() => startEditEntry(b)}
                                title="Corregir fecha/hora"
                                className="text-gray-500 hover:text-blue-400"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </span>
                            {editingEntryId === b.id ? (
                              <span className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={editEntryData.fecha}
                                  onChange={(e) => setEditEntryData(prev => ({ ...prev, fecha: e.target.value }))}
                                  className="bg-[#0F1729] border border-[#334155] rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                                />
                                <input
                                  type="time"
                                  value={editEntryData.hora}
                                  onChange={(e) => setEditEntryData(prev => ({ ...prev, hora: e.target.value }))}
                                  className="bg-[#0F1729] border border-[#334155] rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                                />
                                <button
                                  onClick={() => handleSaveEntryEdit(b)}
                                  className="text-blue-400 hover:text-blue-300 font-bold"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditingEntryId(null)}
                                  className="text-gray-400 hover:text-red-400"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ) : (
                              <span>{new Date(b.fecha).toLocaleString('es-AR')}</span>
                            )}
                          </div>
                          <p className="text-gray-300 leading-normal">{b.descripcion}</p>
                          {b.fotoUrl && (
                            <a
                              href={b.fotoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 block"
                            >
                              <img
                                src={b.fotoUrl}
                                alt="Adjunto de la visita"
                                className="max-h-40 rounded-lg border border-[#334155] object-cover"
                              />
                            </a>
                          )}
                          <p className="text-[9px] text-gray-500 text-right mt-1">Registró: {b.usuario}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* NUEVA OBRA MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]/40">
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">Crear Nueva Obra</h3>
                <p className="text-xs text-gray-400 hidden sm:block">Registra una nueva obra a partir de un cliente activo</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateObra} className="p-4 sm:p-6 space-y-3 sm:space-y-4 text-xs overflow-y-auto max-h-[75vh] sm:max-h-[80vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Seleccionar Cliente *</label>
                  <select
                    required
                    value={newObra.clienteId}
                    onChange={(e) => setNewObra(prev => ({ ...prev, clienteId: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="" disabled>Seleccione...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Tipo de Trabajo</label>
                  <select
                    value={newObra.tipoTrabajo}
                    onChange={(e) => setNewObra(prev => ({ ...prev, tipoTrabajo: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {TIPOS_TRABAJO.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Dirección de la Obra</label>
                  <input
                    type="text"
                    placeholder="Dejar vacío para usar dir. del cliente"
                    value={newObra.direccion}
                    onChange={(e) => setNewObra(prev => ({ ...prev, direccion: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Asignar Técnico</label>
                  <select
                    value={newObra.tecnicoAsignadoId}
                    onChange={(e) => setNewObra(prev => ({ ...prev, tecnicoAsignadoId: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="">Sin asignar</option>
                    {tecnicosActivos.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre} {t.apellido} ({t.especialidad})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Fecha de Inicio *</label>
                  <input
                    type="date"
                    required
                    value={newObra.fechaInicio}
                    onChange={(e) => setNewObra(prev => ({ ...prev, fechaInicio: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Hora Inicio *</label>
                  <input
                    type="time"
                    required
                    value={newObra.hora}
                    onChange={(e) => setNewObra(prev => ({ ...prev, hora: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Importe Total ($) *</label>
                  <input
                    type="number"
                    required
                    value={newObra.importeTotal}
                    onChange={(e) => setNewObra(prev => ({ ...prev, importeTotal: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Forma de Pago Acordada</label>
                  <select
                    value={newObra.formaPago}
                    onChange={(e) => setNewObra(prev => ({ ...prev, formaPago: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Efectivo + Canje">Efectivo + Canje</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Descripción del Trabajo</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ej: Cableado completo de planta alta..."
                  value={newObra.descripcion}
                  onChange={(e) => setNewObra(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors mt-6"
              >
                Crear Obra
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
