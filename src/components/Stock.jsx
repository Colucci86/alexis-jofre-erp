import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  Package, 
  Wrench, 
  AlertTriangle, 
  Trash2, 
  Edit2, 
  X,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

export default function Stock() {
  const { 
    productos, 
    servicios, 
    proveedores,
    saveProducto,
    removeProducto,
    saveServicio,
    removeServicio,
  } = useApp();

  const [activeCatalog, setActiveCatalog] = useState('Productos'); // 'Productos' or 'Servicios'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states - Products
  const [productForm, setProductForm] = useState({
    codigo: '', codigoBarras: '', nombre: '', categoria: 'Electricidad',
    marca: '', descripcion: '', proveedor: '', costo: 0, precioVenta: 0,
    stockActual: 0, stockMinimo: 0, unidadMedida: 'unidades', ubicacion: '', estado: 'Activo'
  });

  // Form states - Services
  const [serviceForm, setServiceForm] = useState({
    nombre: '', categoria: 'Electricidad', descripcion: '', precioBase: 0,
    unidad: 'mts2', duracionEstimada: '2 hs', costoManoObra: 0, estado: 'Activo'
  });

  // Category listing based on catalog type
  const productCategories = ['Todos', 'Electricidad', 'Durlock', 'Pintura', 'Herramientas', 'Otros'];
  const serviceCategories = ['Todos', 'Electricidad', 'Plomería', 'Durlock', 'Pintura', 'Albañilería', 'Mantenimiento General', 'Instalaciones'];

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.nombre || !productForm.codigo) return;

    try {
      await saveProducto(productForm, editingItem?.id);
      setEditingItem(null);
      setProductForm({
        codigo: '', codigoBarras: '', nombre: '', categoria: 'Electricidad',
        marca: '', descripcion: '', proveedor: '', costo: 0, precioVenta: 0,
        stockActual: 0, stockMinimo: 0, unidadMedida: 'unidades', ubicacion: '', estado: 'Activo'
      });
      setIsProductModalOpen(false);
    } catch (err) {
      alert(err.message || 'No se pudo guardar el producto.');
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.nombre) return;

    try {
      await saveServicio(serviceForm, editingItem?.id);
      setEditingItem(null);
      setServiceForm({
        nombre: '', categoria: 'Electricidad', descripcion: '', precioBase: 0,
        unidad: 'mts2', duracionEstimada: '2 hs', costoManoObra: 0, estado: 'Activo'
      });
      setIsServiceModalOpen(false);
    } catch (err) {
      alert(err.message || 'No se pudo guardar el servicio.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto?')) return;
    try {
      await removeProducto(id);
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el producto.');
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

  const startEditProduct = (prod) => {
    setEditingItem(prod);
    setProductForm({ ...prod });
    setIsProductModalOpen(true);
  };

  const startEditService = (srv) => {
    setEditingItem(srv);
    setServiceForm({ ...srv });
    setIsServiceModalOpen(true);
  };

  // Filtering lists
  const filteredProducts = productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || p.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredServicios = servicios.filter(s => {
    const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || s.categoria.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Stock y Catálogo</h2>
          <p className="text-gray-400 text-sm">Gestiona tus materiales físicos en depósito y tu tarifario de servicios.</p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            if (activeCatalog === 'Productos') {
              setIsProductModalOpen(true);
            } else {
              setIsServiceModalOpen(true);
            }
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-5 h-5" />
          {activeCatalog === 'Productos' ? 'Nuevo Producto' : 'Nuevo Servicio'}
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-lg">
        
        {/* Navigation Selector & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#334155] bg-[#111827]/40 px-6 py-2 gap-4">
          <div className="flex bg-[#0F1729] p-1 rounded-lg border border-[#334155]">
            {['Productos', 'Servicios'].map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCatalog(cat); setSearchTerm(''); setCategoryFilter('Todos'); }}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeCatalog === cat 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-56">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Buscar en ${activeCatalog.toLowerCase()}...`}
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
              {activeCatalog === 'Productos' 
                ? productCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                : serviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
              }
            </select>
          </div>
        </div>

        {/* PRODUCTS CATALOG TABLE */}
        {activeCatalog === 'Productos' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#334155] bg-[#111827]/20 text-gray-400 uppercase text-[9px] tracking-wider font-bold">
                  <th className="p-4 w-28">Código</th>
                  <th className="p-4">Nombre / Insumo</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Marca</th>
                  <th className="p-4">Depósito / Ubicac.</th>
                  <th className="p-4 text-center">Stock Actual</th>
                  <th className="p-4 text-right">Costo</th>
                  <th className="p-4 text-right">Precio Venta</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155] text-gray-300">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">No hay productos en depósito.</td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLowStock = Number(p.stockActual) <= Number(p.stockMinimo);
                    return (
                      <tr key={p.id} className="hover:bg-[#16223F]/20 transition-colors">
                        <td className="p-4 whitespace-nowrap font-mono">{p.codigo}</td>
                        <td className="p-4 font-semibold text-white">
                          <div>
                            {p.nombre}
                            {p.descripcion && <p className="text-[10px] font-normal text-gray-500 mt-0.5">{p.descripcion}</p>}
                          </div>
                        </td>
                        <td className="p-4">{p.categoria}</td>
                        <td className="p-4">{p.marca || 'S/M'}</td>
                        <td className="p-4">{p.ubicacion || 'General'}</td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-bold ${
                            isLowStock 
                              ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/25' 
                              : 'bg-green-500/10 text-green-400'
                          }`}>
                            {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                            {p.stockActual} {p.unidadMedida}
                          </span>
                        </td>
                        <td className="p-4 text-right font-medium">${p.costo.toLocaleString('es-AR')}</td>
                        <td className="p-4 text-right font-bold text-white">${p.precioVenta.toLocaleString('es-AR')}</td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => startEditProduct(p)} className="p-1 text-blue-400 hover:text-blue-300">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-1 text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* SERVICES CATALOG TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#334155] bg-[#111827]/20 text-gray-400 uppercase text-[9px] tracking-wider font-bold">
                  <th className="p-4">Servicio</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Unidad</th>
                  <th className="p-4">Duración Est.</th>
                  <th className="p-4 text-right">Costo M.O.</th>
                  <th className="p-4 text-right">Precio Base</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155] text-gray-300">
                {filteredServicios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">No hay servicios en catálogo.</td>
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
                      <td className="p-4">{s.duracionEstimada || 'N/A'}</td>
                      <td className="p-4 text-right font-medium">${s.costoManoObra?.toLocaleString('es-AR') || '0'}</td>
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
        )}
      </div>

      {/* NEW/EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]/40">
              <div>
                <h3 className="font-bold text-white text-base">{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <p className="text-xs text-gray-400">Introduce los campos del insumo de depósito</p>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Código de Producto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: ELE-100"
                    value={productForm.codigo}
                    onChange={(e) => setProductForm(prev => ({ ...prev, codigo: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Cód. Barras (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: 779..."
                    value={productForm.codigoBarras}
                    onChange={(e) => setProductForm(prev => ({ ...prev, codigoBarras: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Nombre Insumo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Llave térmica 20A"
                    value={productForm.nombre}
                    onChange={(e) => setProductForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Categoría</label>
                  <select
                    value={productForm.categoria}
                    onChange={(e) => setProductForm(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Electricidad">Electricidad</option>
                    <option value="Durlock">Durlock</option>
                    <option value="Pintura">Pintura</option>
                    <option value="Herramientas">Herramientas</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="Ej: Sica"
                    value={productForm.marca}
                    onChange={(e) => setProductForm(prev => ({ ...prev, marca: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Unidad Medida</label>
                  <input
                    type="text"
                    placeholder="Ej: rollos / unidades"
                    value={productForm.unidadMedida}
                    onChange={(e) => setProductForm(prev => ({ ...prev, unidadMedida: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    value={productForm.costo || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, costo: Number(e.target.value) }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    value={productForm.precioVenta || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, precioVenta: Number(e.target.value) }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none font-bold text-green-400"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Ubicación Depósito</label>
                  <input
                    type="text"
                    placeholder="Ej: Estante B1"
                    value={productForm.ubicacion}
                    onChange={(e) => setProductForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Stock Actual</label>
                  <input
                    type="number"
                    value={productForm.stockActual || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stockActual: Number(e.target.value) }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={productForm.stockMinimo || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stockMinimo: Number(e.target.value) }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Proveedor Habitual</label>
                  <select
                    value={productForm.proveedor}
                    onChange={(e) => setProductForm(prev => ({ ...prev, proveedor: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Descripción del Insumo</label>
                <textarea
                  rows={2}
                  placeholder="Detalles técnicos..."
                  value={productForm.descripcion}
                  onChange={(e) => setProductForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs transition-colors mt-6"
              >
                {editingItem ? 'Guardar Cambios' : 'Registrar Producto'}
              </button>
            </form>
          </div>
        </div>
      )}

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
                    <option value="electricidad">Electricidad</option>
                    <option value="plomería">Plomería</option>
                    <option value="durlock">Durlock</option>
                    <option value="pintura">Pintura</option>
                    <option value="albañilería">Albañilería</option>
                    <option value="mantenimiento general">Mantenimiento General</option>
                    <option value="instalaciones">Instalaciones</option>
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
                  <label className="block text-gray-400 font-semibold mb-1">Duración Estimada</label>
                  <input
                    type="text"
                    placeholder="Ej: 2 hs"
                    value={serviceForm.duracionEstimada}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, duracionEstimada: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Costo Estimado Mano Obra ($)</label>
                  <input
                    type="number"
                    value={serviceForm.costoManoObra || ''}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, costoManoObra: Number(e.target.value) }))}
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
