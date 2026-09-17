import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  MapPin, 
  Phone, 
  Mail, 
  Trash2, 
  FileText, 
  Briefcase, 
  DollarSign, 
  Edit2, 
  X,
  ChevronRight,
  BookOpen,
  Send,
  Pencil,
  Calendar,
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

export default function Clientes() {
  const emptyCliente = {
    nombre: '', empresa: '', dni: '', cuit: '',
    telefono: '', whatsapp: '', email: '',
    direccion: '', localidad: 'Ciudad de Mendoza', provincia: 'Mendoza',
    notas: '', estado: 'Activo'
  };

  const { 
    clientes, 
    presupuestos, 
    obras, 
    cobros, 
    createCliente,
    saveCliente,
    removeCliente,
    addClienteBitacora,
    updateBitacoraEntrada
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [activeTab, setActiveTab] = useState('Resumen');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState(null);
  const [newCliente, setNewCliente] = useState(emptyCliente);

  // Bitacora Entry Form state
  const [newBitacoraEntry, setNewBitacoraEntry] = useState({
    tipo: 'Nota Manual',
    descripcion: '',
    fotoUrl: ''
  });
  const [bitacoraFecha, setBitacoraFecha] = useState(toLocalDateString());
  const [bitacoraHora, setBitacoraHora] = useState(
    () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );

  // Edit existing bitacora entry state
  const [editingBitacoraId, setEditingBitacoraId] = useState(null);
  const [editBitacoraData, setEditBitacoraData] = useState({ fecha: '', hora: '' });
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoError, setFotoError] = useState('');

  const handleFotoBitacora = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFotoError('');
    setSubiendoFoto(true);
    try {
      const url = await subirFotoBitacora(file, {
        entidadTipo: 'cliente',
        entidadId: selectedCliente?.id,
      });
      setNewBitacoraEntry(prev => ({ ...prev, fotoUrl: url }));
    } catch (err) {
      setFotoError(err.message || 'No se pudo subir la foto.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  useEffect(() => {
    if (!selectedCliente) return;
    const updated = clientes.find(c => c.id === selectedCliente.id);
    if (updated) setSelectedCliente(updated);
    else setSelectedCliente(null);
  }, [clientes]);

  const openCreateCliente = () => {
    setEditingClienteId(null);
    setNewCliente(emptyCliente);
    setIsModalOpen(true);
  };

  const openEditCliente = (cliente) => {
    setEditingClienteId(cliente.id);
    setNewCliente({
      nombre: cliente.nombre || '',
      empresa: cliente.empresa || '',
      dni: cliente.dni || '',
      cuit: cliente.cuit || '',
      telefono: cliente.telefono || '',
      whatsapp: cliente.whatsapp || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      localidad: cliente.localidad || 'Ciudad de Mendoza',
      provincia: cliente.provincia || 'Mendoza',
      notas: cliente.notas || '',
      estado: cliente.estado || 'Activo',
    });
    setIsModalOpen(true);
  };

  const handleCreateCliente = async (e) => {
    e.preventDefault();
    if (!newCliente.nombre) return;

    try {
      if (editingClienteId) {
        await saveCliente(editingClienteId, newCliente);
      } else {
        await createCliente(newCliente);
      }
      setNewCliente(emptyCliente);
      setEditingClienteId(null);
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'No se pudo guardar el cliente.');
    }
  };

  const handleDeleteCliente = async (id) => {
    const hasObras = obras.some(o => o.clienteId === id);
    const hasPresupuestos = presupuestos.some(p => p.clienteId === id);
    if (hasObras || hasPresupuestos) {
      return alert('No se puede eliminar el cliente porque tiene presupuestos u obras asociadas.');
    }
    if (!window.confirm('¿Está seguro de que desea eliminar este cliente por completo? Esta acción no se puede deshacer.')) return;
    try {
      await removeCliente(id);
      setSelectedCliente(null);
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el cliente.');
    }
  };

  const handleAddBitacora = async (e) => {
    e.preventDefault();
    if (!newBitacoraEntry.descripcion) return;

    const fechaISO = new Date(`${bitacoraFecha}T${bitacoraHora || '00:00'}:00`).toISOString();

    try {
      await addClienteBitacora(selectedCliente.id, {
        tipo: newBitacoraEntry.tipo,
        descripcion: newBitacoraEntry.descripcion,
        fotoUrl: newBitacoraEntry.fotoUrl,
        fecha: fechaISO
      });
      setNewBitacoraEntry({
        tipo: 'Nota Manual',
        descripcion: '',
        fotoUrl: ''
      });
    } catch (err) {
      alert(err.message || 'No se pudo agregar la nota.');
    }
  };

  const startEditEntry = (b) => {
    setEditingBitacoraId(b.id);
    const d = new Date(b.fecha);
    if (Number.isNaN(d.getTime())) {
      setEditBitacoraData({ fecha: toLocalDateString(), hora: '00:00' });
      return;
    }
    setEditBitacoraData({
      fecha: toLocalDateString(d),
      hora: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    });
  };

  const handleSaveEntryEdit = async (b) => {
    const fechaISO = new Date(`${editBitacoraData.fecha}T${editBitacoraData.hora || '00:00'}:00`).toISOString();
    try {
      await updateBitacoraEntrada('cliente', selectedCliente.id, b.id, { fecha: fechaISO });
      setEditingBitacoraId(null);
    } catch (err) {
      alert(err.message || 'No se pudo actualizar la entrada.');
    }
  };

  // Filter clients
  const filteredClientes = clientes.filter(c => 
    (c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.empresa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.direccion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Economic calculations for current selected customer
  const clientPresupuestos = selectedCliente ? presupuestos.filter(p => p.clienteId === selectedCliente.id) : [];
  const clientObras = selectedCliente ? obras.filter(o => o.clienteId === selectedCliente.id) : [];
  const clientCobros = selectedCliente ? cobros.filter(c => c.clienteId === selectedCliente.id) : [];

  const totalFacturado = clientObras.reduce((acc, curr) => acc + Number(curr.importeTotal), 0);
  const totalPagado = clientObras.reduce((acc, curr) => acc + Number(curr.importePagado), 0);
  const totalPendiente = clientObras.reduce((acc, curr) => acc + Number(curr.importePendiente), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-h-[calc(100vh-10rem)]">
      
      {/* LEFT COLUMN: LIST OF CLIENTS */}
      <div className={`lg:col-span-5 bg-[#1E293B] rounded-xl border border-[#334155] p-4 sm:p-6 flex flex-col shadow-lg ${
        mobileView === 'detail' ? 'hidden lg:flex' : 'flex'
      }`}>
        <div>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-white">Clientes</h3>
            <button
              onClick={openCreateCliente}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3 sm:mb-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0F1729] border border-[#334155] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Client List */}
          <div className="space-y-2 overflow-y-auto max-h-[420px] sm:max-h-[500px] pr-1">
            {filteredClientes.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No se encontraron clientes.</p>
            ) : (
              filteredClientes.map((c) => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedCliente(c); setActiveTab('Resumen'); setMobileView('detail'); }}
                  className={`p-3 sm:p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    selectedCliente?.id === c.id 
                      ? 'bg-[#16223F] border-blue-500 shadow-md' 
                      : 'bg-[#111827]/60 border-[#334155] hover:bg-[#16223F]/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs sm:text-sm shrink-0">
                      {c.nombre.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white text-sm truncate">{c.nombre}</h4>
                      {c.empresa && c.empresa !== 'Particular' && (
                        <p className="text-xs text-blue-400 font-medium truncate">{c.empresa}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                        <span className="truncate">{c.direccion}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {c.whatsapp && (
                      <a 
                        href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-md transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                    {c.direccion && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion + ', ' + c.localidad + ', ' + c.provincia)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors hidden sm:flex"
                        title="Ver en Google Maps"
                      >
                        <MapPin className="w-4 h-4" />
                      </a>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: CLIENT FILE & BITACORA */}
      <div className={`lg:col-span-7 ${
        mobileView === 'list' && !selectedCliente ? 'hidden lg:block' : 
        mobileView === 'list' ? 'hidden lg:block' : 'block'
      }`}>
        {!selectedCliente ? (
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 h-full flex flex-col items-center justify-center text-center shadow-lg text-gray-500">
            <BookOpen className="w-12 h-12 mb-3 text-gray-600" />
            <p className="text-sm">Selecciona un cliente de la lista para ver su ficha de detalle, bitácora y estado financiero.</p>
          </div>
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden shadow-lg flex flex-col h-full">
            {/* Back button on mobile */}
            <div className="lg:hidden p-3 border-b border-[#334155] bg-[#111827]/40">
              <button
                onClick={() => { setMobileView('list'); }}
                className="flex items-center gap-2 text-blue-400 text-xs font-semibold"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> Volver a la lista
              </button>
            </div>
            {/* Header info */}
            <div className="p-4 sm:p-6 border-b border-[#334155] bg-[#111827]/40 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-white truncate">{selectedCliente.nombre}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      selectedCliente.estado === 'Activo' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {selectedCliente.estado}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{selectedCliente.empresa || 'Particular'}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3 text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span>{selectedCliente.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="truncate">{selectedCliente.email || 'Sin correo'}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="truncate">{selectedCliente.direccion}, {selectedCliente.localidad}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditCliente(selectedCliente)}
                    className="flex items-center gap-1 text-blue-300 hover:text-white hover:bg-blue-600/30 border border-blue-500/30 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteCliente(selectedCliente.id)}
                    className="flex items-center gap-1 text-red-400 hover:text-white hover:bg-red-600/30 border border-red-500/30 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#334155] bg-[#111827]/20 overflow-x-auto">
              {['Resumen', 'Presupuestos', 'Obras', 'Bitácora'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-6 py-3 sm:py-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab 
                      ? 'border-blue-500 text-white bg-[#1E293B]' 
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-[#16223F]/30'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto max-h-[380px] sm:max-h-[450px]">
              
              {/* SUBTAB: RESUMEN */}
              {activeTab === 'Resumen' && (
                <div className="space-y-6">
                  {/* Financial Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#111827] rounded-xl border border-[#334155]">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-semibold">Total Facturado</span>
                        <DollarSign className="w-4 h-4 text-blue-400" />
                      </div>
                      <h4 className="text-lg font-bold text-white mt-1">
                        ${totalFacturado.toLocaleString('es-AR')}
                      </h4>
                    </div>

                    <div className="p-4 bg-[#111827] rounded-xl border border-[#334155]">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-semibold">Total Cobrado</span>
                        <DollarSign className="w-4 h-4 text-green-400" />
                      </div>
                      <h4 className="text-lg font-bold text-green-400 mt-1">
                        ${totalPagado.toLocaleString('es-AR')}
                      </h4>
                    </div>

                    <div className="p-4 bg-[#111827] rounded-xl border border-[#334155]">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-semibold">Saldo Pendiente</span>
                        <DollarSign className="w-4 h-4 text-red-400" />
                      </div>
                      <h4 className="text-lg font-bold text-red-400 mt-1">
                        ${totalPendiente.toLocaleString('es-AR')}
                      </h4>
                    </div>
                  </div>

                  {/* Summary lists counts */}
                  <div className="bg-[#111827]/40 rounded-xl p-4 border border-[#334155] space-y-3">
                    <h4 className="font-semibold text-white text-sm">Resumen de Actividades</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
                      <div>Presupuestos generados: <span className="font-bold text-white">{clientPresupuestos.length}</span></div>
                      <div>Presupuestos aceptados: <span className="font-bold text-white">{clientPresupuestos.filter(p=>p.estado==='Aceptado').length}</span></div>
                      <div>Obras realizadas: <span className="font-bold text-white">{clientObras.length}</span></div>
                      <div>Obras activas: <span className="font-bold text-white">{clientObras.filter(o=>o.estado==='En curso'||o.estado==='En proceso').length}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB: PRESUPUESTOS */}
              {activeTab === 'Presupuestos' && (
                <div className="space-y-3">
                  {clientPresupuestos.length === 0 ? (
                    <p className="text-gray-500 text-xs text-center py-6">No hay presupuestos generados para este cliente.</p>
                  ) : (
                    clientPresupuestos.map(p => (
                      <div key={p.id} className="p-3 bg-[#111827] rounded-lg border border-[#334155] flex justify-between items-center">
                        <div>
                          <h5 className="text-sm font-semibold text-white">Presupuesto #{p.numero}</h5>
                          <p className="text-xs text-gray-400 mt-0.5">Tipo: {p.tipoTrabajo} | Fecha: {p.fecha}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">${p.subtotal.toLocaleString('es-AR')}</p>
                          <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-bold mt-1 ${
                            p.estado === 'Aceptado' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {p.estado}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SUBTAB: OBRAS */}
              {activeTab === 'Obras' && (
                <div className="space-y-3">
                  {clientObras.length === 0 ? (
                    <p className="text-gray-500 text-xs text-center py-6">No hay obras registradas para este cliente.</p>
                  ) : (
                    clientObras.map(o => (
                      <div key={o.id} className="p-3 bg-[#111827] rounded-lg border border-[#334155] flex justify-between items-center">
                        <div>
                          <h5 className="text-sm font-semibold text-white">Obra #{o.numero}</h5>
                          <p className="text-xs text-gray-400 mt-0.5">Dirección: {o.direccion} | Téc: {o.tecnicoAsignadoNombre}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">${o.importeTotal.toLocaleString('es-AR')}</p>
                          <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-bold mt-1 ${
                            o.estado === 'En curso' ? 'bg-blue-500/10 text-blue-400' : o.estado === 'Finalizado' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {o.estado}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SUBTAB: BITÁCORA */}
              {activeTab === 'Bitácora' && (
                <div className="space-y-6">
                  {/* Bitacora load form (Layout like Abelito) */}
                  <form onSubmit={handleAddBitacora} className="bg-[#111827] p-4 rounded-xl border border-[#334155] space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Registrar Entrada en Bitácora</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-400 mb-1">Tipo de Entrada</label>
                        <select
                          value={newBitacoraEntry.tipo}
                          onChange={(e) => setNewBitacoraEntry(prev => ({ ...prev, tipo: e.target.value }))}
                          className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="Visita Técnica">Visita Técnica</option>
                          <option value="Llamada">Llamada</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Pago">Pago</option>
                          <option value="Presupuesto Enviado">Presupuesto Enviado</option>
                          <option value="Cambio de estado de obra">Cambio de estado de obra</option>
                          <option value="Nota Manual">Nota Manual</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-400 mb-1">Fecha del evento</label>
                        <input
                          type="date"
                          value={bitacoraFecha}
                          onChange={(e) => setBitacoraFecha(e.target.value)}
                          className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-400 mb-1">Hora</label>
                        <input
                          type="time"
                          value={bitacoraHora}
                          onChange={(e) => setBitacoraHora(e.target.value)}
                          className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-400 mb-1">Foto / Adjunto (opcional)</label>
                        <div className="flex items-center gap-2">
                          <label className={`flex items-center justify-center gap-2 flex-1 bg-[#0F1729] hover:bg-[#16223F] border border-[#334155] text-white font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer ${subiendoFoto ? 'opacity-60 pointer-events-none' : ''}`}>
                            <Upload className="w-3.5 h-3.5 text-blue-400" />
                            {subiendoFoto ? 'Subiendo...' : (newBitacoraEntry.fotoUrl ? 'Cambiar foto' : 'Subir foto')}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFotoBitacora}
                            />
                          </label>
                          {newBitacoraEntry.fotoUrl && (
                            <button
                              type="button"
                              onClick={() => { setNewBitacoraEntry(prev => ({ ...prev, fotoUrl: '' })); setFotoError(''); }}
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
                          value={newBitacoraEntry.fotoUrl}
                          onChange={(e) => setNewBitacoraEntry(prev => ({ ...prev, fotoUrl: e.target.value }))}
                          className="mt-2 w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                        {fotoError && <p className="mt-1 text-[11px] text-red-400">{fotoError}</p>}
                        {newBitacoraEntry.fotoUrl && !fotoError && (
                          <img
                            src={newBitacoraEntry.fotoUrl}
                            alt="Vista previa"
                            className="mt-2 max-h-32 rounded-lg border border-[#334155] object-cover"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">Descripción</label>
                      <textarea
                        rows={2}
                        placeholder="Escribe lo acontecido en la visita o llamada..."
                        value={newBitacoraEntry.descripcion}
                        onChange={(e) => setNewBitacoraEntry(prev => ({ ...prev, descripcion: e.target.value }))}
                        className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Guardar en Bitácora
                    </button>
                  </form>

                  {/* Chronological List of Bitacora */}
                  <div className="space-y-4 relative border-l border-gray-700 pl-4 ml-2 mt-4">
                    {(!selectedCliente.bitacora || selectedCliente.bitacora.length === 0) ? (
                      <p className="text-gray-500 text-xs py-4 pl-2">Aún no hay registros de actividad.</p>
                    ) : (
                      selectedCliente.bitacora.map((b) => (
                        <div key={b.id} className="relative mb-6">
                          <span className="absolute -left-[21px] top-1.5 w-3.5 h-3.5 bg-blue-600 border border-darkBg rounded-full flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                          </span>
                          <div className="bg-[#111827]/60 p-3 rounded-lg border border-[#334155]">
                            <div className="flex items-center justify-between text-[10px] text-gray-400">
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
                              {editingBitacoraId === b.id ? (
                                <span className="flex items-center gap-2">
                                  <input
                                    type="date"
                                    value={editBitacoraData.fecha}
                                    onChange={(e) => setEditBitacoraData(prev => ({ ...prev, fecha: e.target.value }))}
                                    className="bg-[#0F1729] border border-[#334155] rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                                  />
                                  <input
                                    type="time"
                                    value={editBitacoraData.hora}
                                    onChange={(e) => setEditBitacoraData(prev => ({ ...prev, hora: e.target.value }))}
                                    className="bg-[#0F1729] border border-[#334155] rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleSaveEntryEdit(b)}
                                    className="text-blue-400 hover:text-blue-300 font-bold"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => setEditingBitacoraId(null)}
                                    className="text-gray-400 hover:text-red-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ) : (
                                <span>{new Date(b.fecha).toLocaleString('es-AR')}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-200 mt-2">{b.descripcion}</p>
                            {b.fotoUrl && (
                              <div className="mt-3 rounded border border-gray-700 overflow-hidden max-w-[200px]">
                                <img src={b.fotoUrl} alt="Adjunto" className="w-full h-auto object-cover" />
                              </div>
                            )}
                            <div className="text-[9px] text-gray-500 text-right mt-1.5">Reg: {b.usuario || 'Alexis Jofré'}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QUICK CLIENT CREATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]/40">
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">{editingClienteId ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {editingClienteId ? 'Actualizá los datos de la ficha' : 'Rellena los datos para el alta de cliente'}
                </p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingClienteId(null); }} className="text-gray-400 hover:text-white p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCliente} className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto max-h-[75vh] sm:max-h-[80vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={newCliente.nombre}
                    onChange={(e) => setNewCliente(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Empresa</label>
                  <input
                    type="text"
                    placeholder="Ej: Particular / Constructora"
                    value={newCliente.empresa}
                    onChange={(e) => setNewCliente(prev => ({ ...prev, empresa: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">DNI</label>
                  <input
                    type="text"
                    placeholder="Ej: 30.456.789"
                    value={newCliente.dni}
                    onChange={(e) => setNewCliente(prev => ({ ...prev, dni: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">CUIT</label>
                  <input
                    type="text"
                    placeholder="Ej: 20-30456789-2"
                    value={newCliente.cuit}
                    onChange={(e) => setNewCliente(prev => ({ ...prev, cuit: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 2616123456"
                    value={newCliente.telefono}
                    onChange={(e) => setNewCliente(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ej: 2616123456"
                    value={newCliente.whatsapp}
                    onChange={(e) => setNewCliente(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Ej: contacto@ejemplo.com"
                    value={newCliente.email}
                    onChange={(e) => setNewCliente(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Dirección (con calle y número)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ej: Tandil 462, Dorrego"
                      value={newCliente.direccion}
                      onChange={(e) => setNewCliente(prev => ({ ...prev, direccion: e.target.value }))}
                      className="w-full bg-[#0F1729] border border-[#334155] rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <MapPin className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Localidad</label>
                  <input
                    type="text"
                    value={newCliente.localidad}
                    onChange={(e) => setNewCliente(prev => ({ ...prev, localidad: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Provincia</label>
                  <input
                    type="text"
                    value={newCliente.provincia}
                    onChange={(e) => setNewCliente(prev => ({ ...prev, provincia: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Notas Internas</label>
                <textarea
                  rows={2}
                  placeholder="Detalles particulares del cliente..."
                  value={newCliente.notas}
                  onChange={(e) => setNewCliente(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors mt-6"
              >
                {editingClienteId ? 'Guardar cambios' : 'Guardar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
