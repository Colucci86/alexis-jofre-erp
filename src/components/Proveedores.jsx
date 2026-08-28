import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  Truck, 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Edit3, 
  Check, 
  X,
  FileText
} from 'lucide-react';

export default function Proveedores() {
  const { proveedores, createProveedor, saveProveedor } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const [newProv, setNewProv] = useState({
    nombre: '', rubro: 'Electricidad', telefono: '', whatsapp: '',
    email: '', direccion: '', cuit: '', contacto: '', notas: ''
  });

  const handleCreateProv = async (e) => {
    e.preventDefault();
    if (!newProv.nombre) return;

    try {
      await createProveedor(newProv);
      setNewProv({
        nombre: '', rubro: 'Electricidad', telefono: '', whatsapp: '',
        email: '', direccion: '', cuit: '', contacto: '', notas: ''
      });
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'No se pudo crear el proveedor.');
    }
  };

  const handleSaveNotes = async () => {
    try {
      await saveProveedor(selectedProveedor.id, { ...selectedProveedor, notas: editingNotes });
      setSelectedProveedor(prev => ({ ...prev, notas: editingNotes }));
      setIsEditingNotes(false);
    } catch (err) {
      alert(err.message || 'No se pudieron guardar las notas.');
    }
  };

  const filteredProv = proveedores.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.rubro.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-10rem)]">
      
      {/* LEFT COLUMN: LIST OF SUPPLIERS */}
      <div className="lg:col-span-5 bg-[#1E293B] rounded-xl border border-[#334155] p-6 flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Proveedores</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proveedor
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por proveedor o rubro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0F1729] border border-[#334155] rounded-lg pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Providers List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredProv.length === 0 ? (
              <p className="text-gray-500 text-xs py-8 text-center">No se encontraron proveedores.</p>
            ) : (
              filteredProv.map((p) => (
                <div
                  key={p.id}
                  onClick={() => { 
                    setSelectedProveedor(p); 
                    setEditingNotes(p.notes || p.notas || '');
                    setIsEditingNotes(false);
                  }}
                  className={`p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    selectedProveedor?.id === p.id 
                      ? 'bg-[#16223F] border-blue-500 shadow-md' 
                      : 'bg-[#111827]/60 border-[#334155] hover:bg-[#16223F]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-950/40 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{p.nombre}</h4>
                      <span className="inline-block text-[9px] bg-[#1e293b] text-gray-400 px-2 py-0.5 rounded border border-[#334155] mt-1 font-bold">
                        {p.rubro}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: SUPPLIER PROFILE & EDITABLE NOTES */}
      <div className="lg:col-span-7">
        {!selectedProveedor ? (
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 h-full flex flex-col items-center justify-center text-center shadow-lg text-gray-500">
            <Truck className="w-12 h-12 mb-3 text-gray-600" />
            <p className="text-sm">Selecciona un proveedor para ver sus datos de contacto y gestionar sus notas de cotización.</p>
          </div>
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden shadow-lg p-6 space-y-6 h-full flex flex-col justify-between">
            
            {/* General Info block */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-[#334155] pb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedProveedor.nombre}</h3>
                  <p className="text-xs text-blue-400 font-semibold">{selectedProveedor.rubro}</p>
                </div>
              </div>

              {/* Contact Data */}
              <div className="bg-[#111827]/40 rounded-xl p-4 border border-[#334155] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>Tel: {selectedProveedor.telefono || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>Email: {selectedProveedor.email || 'No registrado'}</span>
                </div>
                {selectedProveedor.direccion && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>Dir: {selectedProveedor.direccion}</span>
                  </div>
                )}
                {selectedProveedor.cuit && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-500">CUIT:</span>
                    <span>{selectedProveedor.cuit}</span>
                  </div>
                )}
                {selectedProveedor.contacto && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-500">Contacto:</span>
                    <span>{selectedProveedor.contacto}</span>
                  </div>
                )}
              </div>
            </div>

            {/* EDITABLE INTERNAL NOTES FOR QUOTATIONS (LARGE EDITOR) */}
            <div className="flex-1 flex flex-col justify-between mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Notas de Tarifas y Logística
                </h4>
                {!isEditingNotes ? (
                  <button 
                    onClick={() => { setIsEditingNotes(true); setEditingNotes(selectedProveedor.notas || ''); }}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar Notas
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleSaveNotes} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      Guardar
                    </button>
                    <button onClick={() => setIsEditingNotes(false)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold">
                      <X className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {isEditingNotes ? (
                <textarea
                  rows={8}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-xl p-4 text-xs text-white focus:outline-none focus:border-blue-500 resize-none flex-1"
                  placeholder="Detalla qué conviene comprarle a este proveedor, condiciones de pago, listas de precios, descuentos especiales por volumen..."
                />
              ) : (
                <div className="w-full bg-[#111827]/30 border border-[#334155] rounded-xl p-4 text-xs text-gray-300 min-h-[160px] whitespace-pre-line leading-relaxed flex-1">
                  {selectedProveedor.notas || 'No hay notas internas cargadas para este proveedor.'}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* QUICK SUPPLIER CREATION MODAL (Layout structure matching Image 5 re-skinned) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]/40">
              <div>
                <h3 className="font-bold text-white text-base">Nuevo Proveedor</h3>
                <p className="text-xs text-gray-400">Introduce los campos del proveedor del sistema</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProv} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Distribuidora Oeste"
                    value={newProv.nombre}
                    onChange={(e) => setNewProv(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Rubro Principal</label>
                  <select
                    value={newProv.rubro}
                    onChange={(e) => setNewProv(prev => ({ ...prev, rubro: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Electricidad">Electricidad</option>
                    <option value="Durlock y Yeso">Durlock y Yeso</option>
                    <option value="Pinturas">Pinturas</option>
                    <option value="Albañilería y Cemento">Albañilería y Cemento</option>
                    <option value="Plomería y Sanitarios">Plomería y Sanitarios</option>
                    <option value="Herramientas">Herramientas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 2614556677"
                    value={newProv.telefono}
                    onChange={(e) => setNewProv(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ej: 2614556677"
                    value={newProv.whatsapp}
                    onChange={(e) => setNewProv(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Ej: ventas@proveedor.com"
                    value={newProv.email}
                    onChange={(e) => setNewProv(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">CUIT</label>
                  <input
                    type="text"
                    placeholder="Ej: 30-12345678-9"
                    value={newProv.cuit}
                    onChange={(e) => setNewProv(prev => ({ ...prev, cuit: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-400 font-semibold mb-1">Persona de Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Gómez (Encargado de Cuentas)"
                    value={newProv.contacto}
                    onChange={(e) => setNewProv(prev => ({ ...prev, contacto: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-400 font-semibold mb-1">Dirección Física</label>
                  <input
                    type="text"
                    placeholder="Ej: Carril Rodriguez Peña 2300, Godoy Cruz"
                    value={newProv.direccion}
                    onChange={(e) => setNewProv(prev => ({ ...prev, direccion: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Notas Internas Iniciales</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre envíos, plazos..."
                  value={newProv.notas}
                  onChange={(e) => setNewProv(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors mt-6"
              >
                Guardar Proveedor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHEVRONRIGHT ICON HELPER */}
    </div>
  );
}

function ChevronRight({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
