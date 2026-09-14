import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  Wrench, 
  Trash2, 
  Edit2, 
  X
} from 'lucide-react';

export default function Servicios() {
  const { 
    servicios, 
    saveServicio,
    removeServicio,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [serviceForm, setServiceForm] = useState({
    nombre: '', categoria: 'Electricidad', descripcion: '', precioBase: 0,
    unidad: 'mts2', estado: 'Activo'
  });

  const serviceCategories = ['Todos', 'Electricidad', 'Plomería', 'Durlock', 'Pintura', 'Albañilería', 'Mantenimiento General', 'Instalaciones'];

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.nombre) return;

    try {
      await saveServicio(serviceForm, editingItem?.id);
      setEditingItem(null);
      setServiceForm({
        nombre: '', categoria: 'Electricidad', descripcion: '', precioBase: 0,
        unidad: 'mts2', estado: 'Activo'
      });
      setIsServiceModalOpen(false);
    } catch (err) {
      alert(err.message || 'No se pudo guardar el servicio.');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este servicio?')) return;
    try {
      await removeServicio(id);
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el servicio.');
    }
  };

  const startEditService = (srv) => {
    setEditingItem(srv);
    setServiceForm({ ...srv });
    setIsServiceModalOpen(true);
  };

  const filteredServicios = servicios.filter(s => {
    const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || s.categoria.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Tarifario de Servicios</h2>
          <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">Mano de obra y servicios de mantenimiento en tarifario.</p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsServiceModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20 text-xs sm:text-sm shrink-0"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Nuevo Servicio
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-lg">

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#334155] bg-[#111827]/40 px-6 py-2 gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Wrench className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Servicios</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-56">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0F1729] border border-[#334155] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0F1729] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              {serviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* SERVICES CATALOG TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#334155] bg-[#111827]/20 text-gray-400 uppercase text-[9px] tracking-wider font-bold">
                <th className="p-4">Servicio</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Unidad</th>
                <th className="p-4 text-right">Precio Base</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155] text-gray-300">
              {filteredServicios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No hay servicios en catálogo.</td>
                </tr>
              ) : (
                filteredServicios.map((s) => (
                  <tr key={s.id} className="hover:bg-[#16223F]/20 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      <div>
                        {s.nombre}
                        {s.descripcion && <p className="text-[10px] font-normal text-gray-500 mt-0.5">{s.descripcion}</p>}
                      </div>
                    </td>
                    <td className="p-4 capitalize">{s.categoria}</td>
                    <td className="p-4">{s.unidad}</td>
                    <td className="p-4 text-right font-bold text-white">${s.precioBase.toLocaleString('es-AR')}</td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => startEditService(s)} className="p-1 text-blue-400 hover:text-blue-300">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteService(s.id)} className="p-1 text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW/EDIT SERVICE MODAL */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]/40">
              <div>
                <h3 className="font-bold text-white text-base">{editingItem ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
                <p className="text-xs text-gray-400">Configura un servicio o mano de obra en tarifario</p>
              </div>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Nombre Servicio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Colocación de boca de luz"
                    value={serviceForm.nombre}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Categoría</label>
                  <select
                    value={serviceForm.categoria}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Electricidad">Electricidad</option>
                    <option value="Plomería">Plomería</option>
                    <option value="Durlock">Durlock</option>
                    <option value="Pintura">Pintura</option>
                    <option value="Albañilería">Albañilería</option>
                    <option value="Mantenimiento General">Mantenimiento General</option>
                    <option value="Instalaciones">Instalaciones</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Unidad Cobro</label>
                  <input
                    type="text"
                    placeholder="Ej: mts2 / boca / hora"
                    value={serviceForm.unidad}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, unidad: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Precio Base Venta ($) *</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.precioBase || ''}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, precioBase: Number(e.target.value) }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none font-bold text-blue-400"
                  />
                </div>

              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Descripción del Servicio</label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre lo que incluye la tarifa base..."
                  value={serviceForm.descripcion}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs transition-colors mt-6"
              >
                {editingItem ? 'Guardar Cambios' : 'Registrar Servicio'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}