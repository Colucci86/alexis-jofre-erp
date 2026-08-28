import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Wrench, Phone, Mail, FileText, X } from 'lucide-react';

export default function Tecnicos() {
  const { tecnicos, createTecnico } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newTech, setNewTech] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', email: '',
    especialidad: 'Electricidad', estado: 'Activo', notas: ''
  });

  const handleCreateTech = async (e) => {
    e.preventDefault();
    if (!newTech.nombre || !newTech.apellido) return;

    try {
      await createTecnico(newTech);
      setNewTech({
        nombre: '', apellido: '', dni: '', telefono: '', email: '',
        especialidad: 'Electricidad', estado: 'Activo', notas: ''
      });
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'No se pudo crear el técnico.');
    }
  };

  const filteredTech = tecnicos.filter(t => 
    `${t.nombre} ${t.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Equipo Técnico</h2>
          <p className="text-gray-400 text-sm">Gestiona la nómina de especialistas asignables a obras y visitas.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-5 h-5" />
          Nuevo Técnico
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1E293B] border border-[#334155] p-4 rounded-xl flex items-center justify-between shadow-lg">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar técnico por nombre o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0F1729] border border-[#334155] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTech.map((t) => (
          <div key={t.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">{t.nombre} {t.apellido}</h4>
                <span className="inline-block text-[10px] bg-[#111827] text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded font-bold mt-1">
                  {t.especialidad}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-300 border-t border-[#334155] pt-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{t.telefono}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{t.email || 'Sin correo registrado'}</span>
              </div>
              <div>
                <span className="font-bold text-gray-500">DNI:</span> {t.dni || 'No registrado'}
              </div>
              {t.notas && (
                <div className="text-gray-400 mt-2 bg-[#111827]/40 p-2.5 rounded border border-[#334155] leading-relaxed">
                  {t.notas}
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* NEW TECH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]/40">
              <div>
                <h3 className="font-bold text-white text-base">Nuevo Técnico</h3>
                <p className="text-xs text-gray-400">Registra un nuevo miembro del equipo técnico</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTech} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carlos"
                    value={newTech.nombre}
                    onChange={(e) => setNewTech(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pereyra"
                    value={newTech.apellido}
                    onChange={(e) => setNewTech(prev => ({ ...prev, apellido: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">DNI</label>
                  <input
                    type="text"
                    placeholder="Ej: 30.123.456"
                    value={newTech.dni}
                    onChange={(e) => setNewTech(prev => ({ ...prev, dni: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 2616112233"
                    value={newTech.telefono}
                    onChange={(e) => setNewTech(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Especialidad</label>
                  <select
                    value={newTech.especialidad}
                    onChange={(e) => setNewTech(prev => ({ ...prev, especialidad: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Electricidad">Electricidad</option>
                    <option value="Plomería">Plomería</option>
                    <option value="Durlock">Durlock</option>
                    <option value="Pintura">Pintura</option>
                    <option value="Albañilería">Albañilería</option>
                    <option value="Mantenimiento general">Mantenimiento general</option>
                    <option value="Gas">Gas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Ej: carlos.p@gmail.com"
                    value={newTech.email}
                    onChange={(e) => setNewTech(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Notas / Certificaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre su matrícula..."
                  value={newTech.notes}
                  onChange={(e) => setNewTech(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors mt-6"
              >
                Guardar Técnico
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
