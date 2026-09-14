import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Wrench, Phone, Mail, Edit2, Trash2, RotateCcw, X } from 'lucide-react';

export default function Tecnicos() {
  const { tecnicos, createTecnico, saveTecnico, removeTecnico } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Activos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [newTech, setNewTech] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', email: '',
    especialidad: 'Electricidad', estado: 'Activo', tipo: 'Técnico', notas: ''
  });

  const handleSaveTech = async (e) => {
    e.preventDefault();
    if (!newTech.nombre || !newTech.apellido) return;

    try {
      if (editingItem) {
        await saveTecnico(editingItem.id, newTech);
      } else {
        await createTecnico(newTech);
      }
      setNewTech({
        nombre: '', apellido: '', dni: '', telefono: '', email: '',
        especialidad: 'Electricidad', estado: 'Activo', tipo: 'Técnico', notas: ''
      });
      setEditingItem(null);
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'No se pudo guardar el técnico.');
    }
  };

  const handleDeleteTech = async (t) => {
    if (!window.confirm(`¿Dar de baja a ${t.nombre} ${t.apellido}? Quedará inactivo para nuevas asignaciones, conservando su historial.`)) return;
    try {
      await removeTecnico(t.id);
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el técnico.');
    }
  };

  const handleReactivarTech = async (t) => {
    try {
      await saveTecnico(t.id, { ...t, estado: 'Activo' });
    } catch (err) {
      alert(err.message || 'No se pudo reactivar el técnico.');
    }
  };

  const startEditTech = (t) => {
    setEditingItem(t);
    setNewTech({ ...t });
    setIsModalOpen(true);
  };

  const filteredTech = tecnicos.filter(t => {
    const matchesSearch = `${t.nombre || ''} ${t.apellido || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.especialidad || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado =
      estadoFilter === 'Todos' ? true :
      estadoFilter === 'Inactivos' ? (t.estado === 'Inactivo' || t.estado === 'Inactiva') :
      (t.estado === 'Activo' || t.estado === 'Activa');
    return matchesSearch && matchesEstado;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Técnicos de Mantenimiento</h2>
          <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">Equipo de trabajo de campo, especialidades y datos de contacto.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20 text-xs sm:text-sm shrink-0"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Nuevo Técnico
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar técnico o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1E293B] border border-[#334155] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex bg-[#1E293B] p-1 rounded-xl border border-[#334155] self-start">
          {['Todos', 'Activos', 'Inactivos'].map((opcion) => (
            <button
              key={opcion}
              onClick={() => setEstadoFilter(opcion)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                estadoFilter === opcion
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opcion}
            </button>
          ))}
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
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="inline-block text-[10px] bg-[#111827] text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded font-bold">
                    {t.especialidad}
                  </span>
                  <span className="inline-block text-[10px] bg-[#111827] text-gray-400 border border-[#334155] px-2.5 py-0.5 rounded font-bold">
                    {t.tipo || 'Técnico'}
                  </span>
                  {t.estado === 'Inactivo' && (
                    <span className="inline-block text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/25 px-2.5 py-0.5 rounded font-bold">
                      Inactivo
                    </span>
                  )}
                </div>
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

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => startEditTech(t)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold py-2 rounded-lg text-xs transition-colors border border-blue-500/20"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar
              </button>
              {t.estado === 'Inactivo' ? (
                <button
                  onClick={() => handleReactivarTech(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold py-2 rounded-lg text-xs transition-colors border border-green-500/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reactivar
                </button>
              ) : (
                <button
                  onClick={() => handleDeleteTech(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 rounded-lg text-xs transition-colors border border-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* CREATE TECHNICIAN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]/40">
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">{editingItem ? 'Editar Técnico' : 'Nuevo Técnico'}</h3>
                <p className="text-xs text-gray-400 hidden sm:block">{editingItem ? 'Modifica los datos del integrante del equipo' : 'Registra un integrante del equipo operativo'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTech} className="p-4 sm:p-6 space-y-3 sm:space-y-4 text-xs overflow-y-auto max-h-[75vh] sm:max-h-[80vh]">
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

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Tipo</label>
                  <select
                    value={newTech.tipo || 'Técnico'}
                    onChange={(e) => setNewTech(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Técnico">Técnico</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Notas / Certificaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre su matrícula..."
                  value={newTech.notas}
                  onChange={(e) => setNewTech(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors mt-6"
              >
                {editingItem ? 'Guardar Cambios' : 'Guardar Técnico'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
