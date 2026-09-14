import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  Trash2, 
  Edit2, 
  X
} from 'lucide-react';

export default function Stock() {
  const { 
    productos, 
    proveedores,
    saveProducto,
    removeProducto,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states - Products
  const [productForm, setProductForm] = useState({
    codigo: '', codigoBarras: '', nombre: '', categoria: 'Electricidad',
    marca: '', descripcion: '', proveedor: '', costo: 0, precioVenta: 0,
    stockActual: 0, stockMinimo: 0, unidadMedida: 'unidades', ubicacion: '', estado: 'Activo'
  });

  const productCategories = ['Todos', 'Electricidad', 'Durlock', 'Pintura', 'Herramientas', 'Otros'];

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

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto?')) return;
    try {
      await removeProducto(id);
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el producto.');
    }
  };

  const startEditProduct = (prod) => {
    setEditingItem(prod);
    setProductForm({ ...prod });
    setIsProductModalOpen(true);
  };

  // Filtering list
  const filteredProducts = productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || p.categoria.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Gestión de Stock</h2>
          <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">Control de inventario de materiales e insumos de mantenimiento.</p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsProductModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20 text-xs sm:text-sm shrink-0"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-lg">
        
        {/* Search & Category Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#334155] bg-[#111827]/40 px-6 py-2 gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Package className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Productos</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-56">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar productos..."
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
              {productCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* PRODUCTS CATALOG TABLE */}
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
      </div>

      {/* NEW/EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]/40">
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <p className="text-xs text-gray-400 hidden sm:block">Introduce los campos del insumo de depósito</p>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh] sm:max-h-[80vh]">
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

    </div>
  );
}