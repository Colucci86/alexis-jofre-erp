import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generatePresupuestoPDF } from '../utils/pdfGenerator';
import { generateId } from '../utils/id';
import { 
  Plus, 
  Search, 
  FileText, 
  Check, 
  Trash2, 
  FileDown, 
  Printer, 
  Send, 
  ArrowRight, 
  ArrowLeft,
  Briefcase,
  Layers,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Edit2,
  X,
  Copy
} from 'lucide-react';

const ESTADOS_PRESUPUESTO = ['Borrador', 'Pendiente', 'Enviado', 'Aceptado', 'Rechazado', 'Vencido', 'Convertido en obra'];
const TIPOS_TRABAJO = ['Electricidad', 'Durlock', 'Gas', 'Pintura', 'Remodelación', 'Plomería', 'Albañilería', 'Otro'];

const catalogTemplate = {
  Electricidad: [
    { descripcion: "Bocas de electricidad", price: 13300 },
    { descripcion: "Tomas corrientes adicionales", price: 6500 },
    { descripcion: "Teclas / Interruptores de luz", price: 4500 },
    { descripcion: "Llaves térmicas", price: 15500 },
    { descripcion: "Disyuntores diferenciales", price: 38000 },
    { descripcion: "Metros de caño corrugado colocado", price: 1200 },
    { descripcion: "Metros de cable 2.5mm pasado", price: 650 },
    { descripcion: "Instalación de Tablero nuevo completo", price: 40000 },
    { descripcion: "Colocación Luces LED", price: 3000 }
  ],
  Durlock: [
    { descripcion: "Zócalo placas de yeso antihumedad, perfil de ajuste, 60 cm alto", price: 15500 },
    { descripcion: "Colocación de tabique durlock placa std", price: 18500 },
    { descripcion: "Cielo raso suspendido durlock completo", price: 22000 },
    { descripcion: "Masillado y emplacado por metro cuadrado", price: 5500 }
  ],
  Pintura: [
    { descripcion: "Reparación y masillado completo paredes, sellador fijador y 2 manos látex satinado", price: 13500 },
    { descripcion: "Pintura aberturas sintético satinado", price: 33500 },
    { descripcion: "Pintura látex exterior impermeabilizante", price: 16000 }
  ],
  Remodelación: [
    { descripcion: "Colocación zócalo mdf pre pintado (metro lineal)", price: 5700 },
    { descripcion: "Revestimiento cerámico completo", price: 28000 }
  ],
  Gas: [
    { descripcion: "Instalación artefacto a gas", price: 18000 },
    { descripcion: "Cañería de gas nueva (metro lineal)", price: 3500 },
    { descripcion: "Certificación instalación gas", price: 12000 }
  ],
  Plomería: [
    { descripcion: "Destape cloacal", price: 8000 },
    { descripcion: "Cambio canilla / mezcladora", price: 6500 },
    { descripcion: "Instalación caño nuevo (metro lineal)", price: 4200 }
  ],
  Albañilería: [
    { descripcion: "Reparación grietas y humedad (metro cuadrado)", price: 9500 },
    { descripcion: "Demolición tabique (metro cuadrado)", price: 7800 },
    { descripcion: "Revoque grueso + fino (metro cuadrado)", price: 11500 }
  ]
};

export default function Presupuestos() {
  const { 
    presupuestos, 
    clientes, 
    servicios, 
    config, 
    convertPresupuestoToObra,
    savePresupuesto,
    removePresupuesto,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedPresupuesto, setSelectedPresupuesto] = useState(null);
  
  // Creation/editing flow states
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // true when editing existing
  const [editingId, setEditingId] = useState(null);   // id of presupuesto being edited
  const [step, setStep] = useState(1);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [tipoTrabajo, setTipoTrabajo] = useState('Electricidad');
  
  // Items in creation/editing
  const [items, setItems] = useState([]);
  const [manualItem, setManualItem] = useState({ descripcion: '', cantidad: 1, precioUnitario: 0 });
  const [observaciones, setObservaciones] = useState(config.condicionesDefecto);
  const [desgloseEfectivo, setDesgloseEfectivo] = useState(0);
  const [desgloseCanje, setDesgloseCanje] = useState(0);
  const [estadoEdit, setEstadoEdit] = useState('Pendiente');

  // Inline item editing state
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemData, setEditingItemData] = useState({ descripcion: '', cantidad: 1, precioUnitario: 0 });

  // ─── Handlers ────────────────────────────────────────────────────────────

  const resetForm = () => {
    setStep(1);
    setSelectedClienteId(clientes[0]?.id || '');
    setTipoTrabajo('Electricidad');
    setItems([]);
    setManualItem({ descripcion: '', cantidad: 1, precioUnitario: 0 });
    setObservaciones(config.condicionesDefecto);
    setDesgloseEfectivo(0);
    setDesgloseCanje(0);
    setEstadoEdit('Pendiente');
    setEditingId(null);
    setIsEditing(false);
  };

  const handleStartNew = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (pres) => {
    setEditingId(pres.id);
    setIsEditing(true);
    setSelectedClienteId(pres.clienteId);
    setTipoTrabajo(pres.tipoTrabajo);
    setItems(pres.items.map(i => ({ ...i })));
    setObservaciones(pres.observaciones);
    setDesgloseEfectivo(pres.desgloseEfectivo || 0);
    setDesgloseCanje(pres.desgloseCanje || 0);
    setEstadoEdit(pres.estado);
    setStep(1);
    setIsCreating(true);
  };

  const handleDuplicate = async (pres) => {
    try {
      const saved = await savePresupuesto({
        ...pres,
        id: undefined,
        numero: (presupuestos.length + 17).toString().padStart(5, '0'),
        fecha: new Date().toISOString().split('T')[0],
        estado: 'Borrador',
        obraCreada: false,
        obraId: '',
        items: (pres.items || []).map(i => ({ ...i, id: undefined })),
      });
      setSelectedPresupuesto(saved);
    } catch (err) {
      alert(err.message || 'No se pudo duplicar el presupuesto.');
    }
  };

  const handleAddTemplateItem = (desc, price, cant = 1) => {
    const newItem = {
      id: generateId(),
      descripcion: desc,
      cantidad: cant,
      precioUnitario: price,
      total: price * cant
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleAddManualItem = (e) => {
    e.preventDefault();
    if (!manualItem.descripcion || manualItem.precioUnitario <= 0) return;
    const newItem = {
      id: generateId(),
      descripcion: manualItem.descripcion,
      cantidad: Number(manualItem.cantidad),
      precioUnitario: Number(manualItem.precioUnitario),
      total: Number(manualItem.cantidad) * Number(manualItem.precioUnitario)
    };
    setItems(prev => [...prev, newItem]);
    setManualItem({ descripcion: '', cantidad: 1, precioUnitario: 0 });
  };

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleStartEditItem = (item) => {
    setEditingItemId(item.id);
    setEditingItemData({ descripcion: item.descripcion, cantidad: item.cantidad, precioUnitario: item.precioUnitario });
  };

  const handleSaveEditItem = (itemId) => {
    setItems(prev => prev.map(i => {
      if (i.id === itemId) {
        const newTotal = Number(editingItemData.cantidad) * Number(editingItemData.precioUnitario);
        return { ...i, ...editingItemData, cantidad: Number(editingItemData.cantidad), precioUnitario: Number(editingItemData.precioUnitario), total: newTotal };
      }
      return i;
    }));
    setEditingItemId(null);
  };

  const calculateSubtotal = () => items.reduce((acc, curr) => acc + curr.total, 0);

  const handleFinishPresupuesto = async () => {
    const cli = clientes.find(c => c.id === selectedClienteId);
    const sub = calculateSubtotal();
    const payload = {
      clienteId: selectedClienteId,
      clienteNombre: cli ? cli.nombre : 'Particular',
      tipoTrabajo,
      items,
      subtotal: sub,
      desgloseEfectivo: Number(desgloseEfectivo) || sub,
      desgloseCanje: Number(desgloseCanje) || 0,
      observaciones,
      estado: isEditing ? estadoEdit : 'Pendiente',
      fecha: new Date().toISOString().split('T')[0],
      validez: `${config.validezPresupuesto} días hábiles`,
      obraCreada: false,
      obraId: '',
    };

    try {
      const saved = await savePresupuesto(
        isEditing && editingId ? { ...payload, id: editingId } : payload,
        isEditing ? editingId : null
      );
      setSelectedPresupuesto(saved);
      setIsCreating(false);
      resetForm();
    } catch (err) {
      alert(err.message || 'No se pudo guardar el presupuesto.');
    }
  };

  const handlePrint = () => window.print();

  const handleSendWhatsApp = (pres) => {
    const cli = clientes.find(c => c.id === pres.clienteId);
    if (!cli || !cli.whatsapp) return;
    const message = `Hola ${cli.nombre}, te adjunto la cotización correspondiente al servicio de ${pres.tipoTrabajo} por un total de $${pres.subtotal.toLocaleString('es-AR')}. Saludos, Alexis Jofré Mantenimiento Integral.`;
    window.open(`https://wa.me/${cli.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleConvert = async (pres) => {
    try {
      const newObra = await convertPresupuestoToObra(pres.id);
      if (newObra) {
        alert(`¡Presupuesto aceptado! Se ha creado con éxito la Obra #${newObra.numero}`);
        setSelectedPresupuesto(null);
      }
    } catch (err) {
      alert(err.message || 'No se pudo convertir el presupuesto.');
    }
  };

  const handleDeletePresupuesto = async (pres) => {
    if (!window.confirm(`¿Eliminar el Presupuesto #${pres.numero}? Esta acción no se puede deshacer.`)) return;
    try {
      await removePresupuesto(pres.id);
      setSelectedPresupuesto(null);
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el presupuesto.');
    }
  };

  const handleChangeEstado = async (presId, nuevoEstado) => {
    const current = presupuestos.find(p => p.id === presId);
    if (!current) return;
    try {
      const saved = await savePresupuesto({ ...current, estado: nuevoEstado }, presId);
      setSelectedPresupuesto(saved);
    } catch (err) {
      alert(err.message || 'No se pudo actualizar el estado.');
    }
  };

  const filteredPresupuestos = presupuestos.filter(p => {
    const matchesSearch = p.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.numero.includes(searchTerm) || 
                          p.tipoTrabajo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || p.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─── Color helpers ────────────────────────────────────────────────────────
  const estadoColor = (estado) => {
    switch(estado) {
      case 'Aceptado': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Rechazado': case 'Vencido': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Enviado': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Convertido en obra': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Borrador': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION (HIDDEN ON PRINT) */}
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-2xl font-bold text-white">Presupuestos</h2>
          <p className="text-gray-400 text-sm">Gestiona cotizaciones y conviértelas en obras activas.</p>
        </div>
        {!isCreating && (
          <button
            onClick={handleStartNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
          >
            <Plus className="w-5 h-5" />
            Nuevo Presupuesto
          </button>
        )}
      </div>

      {/* ─── CREATION / EDITING FLOW ─────────────────────────────────────── */}
      {isCreating && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-xl no-print animate-in slide-in-from-top-4 duration-200">
          
          {/* Header bar */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              {isEditing ? <Edit2 className="w-5 h-5 text-yellow-400" /> : <Sparkles className="w-5 h-5 text-blue-400" />}
              {isEditing ? `Editando Presupuesto #${presupuestos.find(p=>p.id===editingId)?.numero}` : 'Nuevo Presupuesto'}
            </h3>
            <button onClick={() => { setIsCreating(false); resetForm(); }} className="text-gray-400 hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Steps tracker */}
          <div className="flex items-center justify-center gap-6 mb-8 max-w-lg mx-auto">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step === s 
                    ? 'bg-blue-600 text-white border-2 border-blue-400' 
                    : step > s 
                      ? 'bg-green-600 text-white' 
                      : 'bg-[#111827] text-gray-500 border border-[#334155]'
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className={`text-xs font-semibold ${step === s ? 'text-blue-400' : 'text-gray-400'}`}>
                  {s === 1 ? 'Cliente y Tipo' : s === 2 ? 'Detalles e Ítems' : 'Resumen'}
                </span>
                {s < 3 && <div className="w-12 h-0.5 bg-[#334155]" />}
              </div>
            ))}
          </div>

          {/* ── STEP 1: CLIENT & WORK TYPE ── */}
          {step === 1 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Seleccionar Cliente</label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="" disabled>Seleccione un cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.empresa || 'Particular'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Tipo de Trabajo</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TIPOS_TRABAJO.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoTrabajo(tipo)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 justify-center transition-all ${
                        tipoTrabajo === tipo 
                          ? 'bg-[#16223F] border-blue-500 text-white shadow-md' 
                          : 'bg-[#111827]/60 border-[#334155] text-gray-400 hover:bg-[#16223F]/30'
                      }`}
                    >
                      <Layers className="w-5 h-5 text-blue-400" />
                      <span className="text-xs font-bold">{tipo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estado (only when editing) */}
              {isEditing && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Estado del Presupuesto</label>
                  <select
                    value={estadoEdit}
                    onChange={e => setEstadoEdit(e.target.value)}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {ESTADOS_PRESUPUESTO.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button 
                  onClick={() => { setIsCreating(false); resetForm(); }} 
                  className="px-4 py-2 border border-[#334155] rounded-lg text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => setStep(2)} 
                  disabled={!selectedClienteId}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: ITEMS ── */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Catalog left */}
              <div className="lg:col-span-5 bg-[#111827]/50 rounded-xl border border-[#334155] p-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-1">
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                  Catálogo: {tipoTrabajo}
                </h4>
                <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                  {(catalogTemplate[tipoTrabajo] || []).map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddTemplateItem(t.descripcion, t.price)}
                      className="w-full flex items-center justify-between text-left p-2.5 bg-[#1e293b]/50 hover:bg-[#1e293b] text-xs rounded-lg border border-[#334155] text-gray-300 transition-colors"
                    >
                      <span className="font-medium shrink">{t.descripcion}</span>
                      <span className="font-bold text-blue-400 ml-2 shrink-0">${t.price.toLocaleString('es-AR')}</span>
                    </button>
                  ))}
                  {(!catalogTemplate[tipoTrabajo] || catalogTemplate[tipoTrabajo].length === 0) && (
                    <p className="text-gray-500 text-xs py-4 text-center">No hay plantillas. Usa carga manual.</p>
                  )}
                </div>
              </div>

              {/* Items right */}
              <div className="lg:col-span-7 space-y-4">
                {/* Manual form */}
                <form onSubmit={handleAddManualItem} className="bg-[#111827]/30 border border-[#334155] p-4 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-semibold text-gray-400 mb-1">Descripción de Ítem</label>
                    <input
                      type="text"
                      placeholder="Descripción personalizada..."
                      value={manualItem.descripcion}
                      onChange={(e) => setManualItem(prev => ({ ...prev, descripcion: e.target.value }))}
                      className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-semibold text-gray-400 mb-1">Cant.</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={manualItem.cantidad}
                      onChange={(e) => setManualItem(prev => ({ ...prev, cantidad: e.target.value }))}
                      className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-semibold text-gray-400 mb-1">Precio Unit. ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={manualItem.precioUnitario}
                      onChange={(e) => setManualItem(prev => ({ ...prev, precioUnitario: e.target.value }))}
                      className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-2 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Items list with inline editing */}
                <div className="bg-[#111827]/60 border border-[#334155] rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-white text-xs">Ítems ({items.length})</h4>
                  <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
                    {items.length === 0 ? (
                      <p className="text-gray-500 text-xs py-6 text-center">Agrega ítems desde la plantilla o el formulario manual.</p>
                    ) : (
                      items.map((item) => (
                        <div key={item.id}>
                          {editingItemId === item.id ? (
                            // Inline edit row
                            <div className="p-2 bg-[#16223F] rounded-lg border border-blue-500 space-y-2">
                              <input
                                type="text"
                                value={editingItemData.descripcion}
                                onChange={e => setEditingItemData(p => ({ ...p, descripcion: e.target.value }))}
                                className="w-full bg-[#0F1729] border border-[#334155] rounded px-2 py-1 text-xs text-white focus:outline-none"
                              />
                              <div className="flex gap-2 items-center">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  value={editingItemData.cantidad}
                                  onChange={e => setEditingItemData(p => ({ ...p, cantidad: e.target.value }))}
                                  className="w-20 bg-[#0F1729] border border-[#334155] rounded px-2 py-1 text-xs text-white focus:outline-none"
                                  placeholder="Cant."
                                />
                                <span className="text-gray-500 text-xs">×</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingItemData.precioUnitario}
                                  onChange={e => setEditingItemData(p => ({ ...p, precioUnitario: e.target.value }))}
                                  className="flex-1 bg-[#0F1729] border border-[#334155] rounded px-2 py-1 text-xs text-white focus:outline-none"
                                  placeholder="Precio unit."
                                />
                                <span className="text-white text-xs font-bold shrink-0">
                                  = ${(Number(editingItemData.cantidad) * Number(editingItemData.precioUnitario)).toLocaleString('es-AR')}
                                </span>
                                <button onClick={() => handleSaveEditItem(item.id)} className="bg-green-600 hover:bg-green-500 text-white p-1 rounded">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingItemId(null)} className="bg-[#334155] hover:bg-[#475569] text-gray-300 p-1 rounded">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Normal row
                            <div className="flex justify-between items-center text-xs p-2 bg-[#1E293B] rounded-lg border border-[#334155] group">
                              <div className="flex-1 min-w-0 pr-3">
                                <p className="font-semibold text-white truncate">{item.descripcion}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {item.cantidad} x ${item.precioUnitario.toLocaleString('es-AR')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold text-white">${item.total.toLocaleString('es-AR')}</span>
                                <button
                                  onClick={() => handleStartEditItem(item)}
                                  className="text-blue-400 hover:text-blue-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Editar ítem"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-red-400 hover:text-red-300 p-1"
                                  title="Eliminar ítem"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="border-t border-[#334155] pt-3 flex justify-between items-center text-sm font-bold text-white">
                    <span>Subtotal Estimado:</span>
                    <span>${calculateSubtotal().toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button 
                    onClick={() => setStep(1)} 
                    className="flex items-center gap-2 px-4 py-2 border border-[#334155] rounded-lg text-xs font-bold text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  <button 
                    onClick={() => {
                      setStep(3);
                      if (!isEditing) {
                        setDesgloseEfectivo(calculateSubtotal());
                        setDesgloseCanje(0);
                      }
                    }} 
                    disabled={items.length === 0}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ── STEP 3: SUMMARY & PAYMENT BREAKDOWN ── */}
          {step === 3 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="bg-[#111827]/40 p-4 rounded-xl border border-[#334155] space-y-4">
                <h4 className="font-bold text-white text-xs">Condiciones de Pago — Desglose Final</h4>
                
                {/* Items summary */}
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-300">
                      <span className="truncate pr-2">{item.cantidad} × {item.descripcion}</span>
                      <span className="font-semibold shrink-0">${item.total.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#334155] pt-2 flex justify-between text-sm font-bold text-white">
                  <span>TOTAL</span>
                  <span>${calculateSubtotal().toLocaleString('es-AR')}</span>
                </div>

                {/* Payment split */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">Efectivo ($)</label>
                    <input
                      type="number"
                      value={desgloseEfectivo}
                      onChange={(e) => setDesgloseEfectivo(Number(e.target.value))}
                      className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">Canje ($)</label>
                    <input
                      type="number"
                      value={desgloseCanje}
                      onChange={(e) => setDesgloseCanje(Number(e.target.value))}
                      className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-300 font-semibold">
                  <span>Suma desglose:</span>
                  <span className={desgloseEfectivo + desgloseCanje === calculateSubtotal() ? "text-green-400" : "text-yellow-500"}>
                    ${(desgloseEfectivo + desgloseCanje).toLocaleString('es-AR')}
                    {desgloseEfectivo + desgloseCanje !== calculateSubtotal() && ' ⚠ No coincide con total'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Condiciones y Notas</label>
                <textarea
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button 
                  onClick={() => setStep(2)} 
                  className="flex items-center gap-2 px-4 py-2 border border-[#334155] rounded-lg text-xs font-bold text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button 
                  onClick={handleFinishPresupuesto}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded-lg text-xs transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {isEditing ? 'Guardar Cambios' : 'Generar Presupuesto'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ─── LIST + DETAIL PANEL ─────────────────────────────────────────── */}
      {!isCreating && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
          
          {/* List left */}
          <div className="lg:col-span-5 bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Historial</h3>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0F1729] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="Todos">Todos</option>
                {ESTADOS_PRESUPUESTO.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por cliente, número o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0F1729] border border-[#334155] rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredPresupuestos.length === 0 && (
                <p className="text-center text-gray-500 text-xs py-8">No hay presupuestos que coincidan.</p>
              )}
              {filteredPresupuestos.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPresupuesto(p)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    selectedPresupuesto?.id === p.id 
                      ? 'bg-[#16223F] border-blue-500 shadow-md' 
                      : 'bg-[#111827]/60 border-[#334155] hover:bg-[#16223F]/40'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">Presupuesto #{p.numero}</h4>
                    <p className="text-xs text-gray-400 mt-1">{p.clienteNombre}</p>
                    <span className="inline-block mt-2 text-[9px] bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-semibold">
                      {p.tipoTrabajo}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">${p.subtotal.toLocaleString('es-AR')}</p>
                    <span className={`inline-block mt-2 text-[9px] px-2 py-0.5 rounded border font-bold ${estadoColor(p.estado)}`}>
                      {p.estado}
                    </span>
                    <p className="text-[9px] text-gray-500 mt-1">{new Date(p.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail right */}
          <div className="lg:col-span-7">
            {!selectedPresupuesto ? (
              <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 h-full flex flex-col items-center justify-center text-center shadow-lg text-gray-500">
                <FileText className="w-12 h-12 mb-3 text-gray-600" />
                <p className="text-sm">Selecciona una cotización del listado para ver su detalle, editarla o imprimirla.</p>
              </div>
            ) : (
              <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 shadow-lg space-y-6">
                
                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#334155] pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">#{selectedPresupuesto.numero}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${estadoColor(selectedPresupuesto.estado)}`}>
                      {selectedPresupuesto.estado}
                    </span>
                    {/* Quick estado change */}
                    <select
                      value={selectedPresupuesto.estado}
                      onChange={e => handleChangeEstado(selectedPresupuesto.id, e.target.value)}
                      className="bg-[#111827] border border-[#334155] rounded-md px-2 py-0.5 text-[10px] text-gray-300 focus:outline-none"
                    >
                      {ESTADOS_PRESUPUESTO.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEdit(selectedPresupuesto)}
                      className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors border border-yellow-500/20"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicate(selectedPresupuesto)}
                      className="flex items-center gap-1.5 bg-[#111827] hover:bg-[#16223F] border border-[#334155] text-gray-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicar
                    </button>
                    {/* Convert to obra */}
                    {selectedPresupuesto.estado !== 'Aceptado' && selectedPresupuesto.estado !== 'Convertido en obra' && (
                      <button
                        onClick={() => handleConvert(selectedPresupuesto)}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        Aceptar/Convertir
                      </button>
                    )}
                    {/* WhatsApp */}
                    <button
                      onClick={() => handleSendWhatsApp(selectedPresupuesto)}
                      className="flex items-center gap-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-green-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors border border-[#25D366]/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                    {/* Export PDF */}
                    <button
                      onClick={() => generatePresupuestoPDF(selectedPresupuesto, 'printable-presupuesto')}
                      className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      PDF
                    </button>
                    {/* Print */}
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 bg-[#111827] hover:bg-[#16223F] border border-[#334155] text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDeletePresupuesto(selectedPresupuesto)}
                      className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors border border-red-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Printable document */}
                <div id="printable-presupuesto" className="bg-white text-black p-8 rounded-lg shadow-inner max-w-2xl mx-auto overflow-hidden text-xs print-card">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-gray-300 pb-6 mb-6">
                    <div>
                      <img src="/logo.png" alt="Logo" className="h-24 w-auto object-contain mb-1" />
                      <p className="text-gray-500 font-medium text-[11px]">{config.ciudad}</p>
                    </div>
                    <div className="text-right text-gray-600 space-y-1">
                      <p className="font-bold text-sm text-black">PRESUPUESTO</p>
                      <p>N° {selectedPresupuesto.numero}</p>
                      <p>Fecha: {new Date(selectedPresupuesto.fecha).toLocaleDateString('es-AR')}</p>
                      <p>Tel: {config.telefono}</p>
                      <p>{config.email}</p>
                    </div>
                  </div>

                  {/* Client info */}
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
                    <p className="font-bold text-gray-500 uppercase text-[9px] mb-2 tracking-wider">Cliente</p>
                    <h4 className="font-bold text-black text-sm">{selectedPresupuesto.clienteNombre}</h4>
                    <p className="text-gray-600 mt-1">
                      {clientes.find(c => c.id === selectedPresupuesto.clienteId)?.direccion || 'Mendoza, Argentina'}
                    </p>
                  </div>

                  {/* Items table */}
                  <table className="w-full mb-8 text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-300 text-gray-500 font-bold bg-gray-50 text-[9px] uppercase tracking-wider">
                        <th className="py-2.5 px-2 w-16">Cant.</th>
                        <th className="py-2.5 px-2">Descripción</th>
                        <th className="py-2.5 px-2 text-right w-28">P. Unitario</th>
                        <th className="py-2.5 px-2 text-right w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedPresupuesto.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-2 font-medium text-gray-700">{item.cantidad}</td>
                          <td className="py-2.5 px-2 text-gray-800 leading-normal">{item.descripcion}</td>
                          <td className="py-2.5 px-2 text-right font-medium text-gray-600">${item.precioUnitario.toLocaleString('es-AR')}</td>
                          <td className="py-2.5 px-2 text-right font-bold text-black">${item.total.toLocaleString('es-AR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals breakdown */}
                  <div className="flex flex-col items-end gap-2 border-t border-gray-300 pt-4 mb-6">
                    <div className="w-64 flex justify-between text-xs font-semibold text-gray-600">
                      <span>SUBTOTAL</span>
                      <span className="font-bold text-black">${selectedPresupuesto.subtotal.toLocaleString('es-AR')}</span>
                    </div>
                    {selectedPresupuesto.desgloseEfectivo > 0 && (
                      <div className="w-64 flex justify-between text-xs font-semibold text-gray-600">
                        <span>EFECTIVO</span>
                        <span className="font-bold text-black">${selectedPresupuesto.desgloseEfectivo.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    {selectedPresupuesto.desgloseCanje > 0 && (
                      <div className="w-64 flex justify-between text-xs font-semibold text-gray-700">
                        <span>CANJE</span>
                        <span className="font-extrabold text-blue-700">${selectedPresupuesto.desgloseCanje.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="border-t border-gray-200 pt-6 text-[10px] text-gray-500 leading-relaxed italic">
                    <p className="font-semibold text-gray-700 not-italic mb-1">Notas importantes:</p>
                    <p>{selectedPresupuesto.observaciones}</p>
                    <p className="mt-2 text-gray-400">Cotización válida por {selectedPresupuesto.validez}. Firma: Alexis Jofré.</p>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* PRINT-ONLY VERSION */}
      {selectedPresupuesto && (
        <div className="hidden print-only text-black p-8 text-xs leading-normal">
          <div className="flex justify-between items-start border-b pb-6 mb-6">
            <div>
              <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
              <p className="text-gray-500 mt-1">{config.ciudad}</p>
            </div>
            <div className="text-right text-gray-600">
              <h3 className="font-bold text-base text-black">PRESUPUESTO</h3>
              <p>N° {selectedPresupuesto.numero}</p>
              <p>Fecha: {new Date(selectedPresupuesto.fecha).toLocaleDateString('es-AR')}</p>
              <p>Tel: {config.telefono}</p>
              <p>{config.email}</p>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 border rounded mb-6">
            <h4 className="font-bold">CLIENTE: {selectedPresupuesto.clienteNombre}</h4>
            <p className="text-gray-600">{clientes.find(c => c.id === selectedPresupuesto.clienteId)?.direccion || ''}</p>
          </div>

          <table className="w-full mb-8 text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-2 px-1">Cant.</th>
                <th className="py-2 px-1">Descripción</th>
                <th className="py-2 px-1 text-right">P. Unitario</th>
                <th className="py-2 px-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedPresupuesto.items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 px-1">{item.cantidad}</td>
                  <td className="py-2 px-1">{item.descripcion}</td>
                  <td className="py-2 px-1 text-right">${item.precioUnitario.toLocaleString('es-AR')}</td>
                  <td className="py-2 px-1 text-right">${item.total.toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col items-end gap-2 border-t pt-4">
            <div className="w-64 flex justify-between font-bold">
              <span>SUBTOTAL:</span>
              <span>${selectedPresupuesto.subtotal.toLocaleString('es-AR')}</span>
            </div>
            {selectedPresupuesto.desgloseEfectivo > 0 && (
              <div className="w-64 flex justify-between">
                <span>EFECTIVO:</span>
                <span>${selectedPresupuesto.desgloseEfectivo.toLocaleString('es-AR')}</span>
              </div>
            )}
            {selectedPresupuesto.desgloseCanje > 0 && (
              <div className="w-64 flex justify-between font-bold text-blue-600">
                <span>CANJE:</span>
                <span>${selectedPresupuesto.desgloseCanje.toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>

          <div className="mt-8 italic text-gray-500 border-t pt-4 text-[10px]">
            <p className="font-bold text-gray-700">Condiciones de pago:</p>
            <p>{selectedPresupuesto.observaciones}</p>
          </div>
        </div>
      )}

    </div>
  );
}
