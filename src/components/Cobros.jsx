import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  X,
  FileText,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export default function Cobros() {
  const { 
    cobros, 
    addCobro, 
    clientes, 
    proveedores, 
    obras, 
    config 
  } = useApp();

  const [activeTab, setActiveTab] = useState('Ingresos'); // 'Ingresos' or 'Egresos'
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [newTransaction, setNewTransaction] = useState({
    fecha: new Date().toISOString().split('T')[0],
    clienteId: '',
    proveedorId: '',
    categoria: 'Materiales',
    concepto: '',
    obraId: '',
    importe: 0,
    formaPago: 'Efectivo',
    comprobante: '',
    observaciones: ''
  });

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (newTransaction.importe <= 0 || !newTransaction.concepto) return;

    let targetClientName = '';
    let targetProvName = '';

    if (activeTab === 'Ingresos') {
      const cli = clientes.find(c => c.id === newTransaction.clienteId);
      targetClientName = cli ? cli.nombre : 'Particular';
    } else {
      const prov = proveedores.find(p => p.id === newTransaction.proveedorId);
      targetProvName = prov ? prov.nombre : 'Gasto General';
    }

    try {
      await addCobro({
        tipo: activeTab === 'Ingresos' ? 'Ingreso' : 'Egreso',
        fecha: newTransaction.fecha,
        clienteId: newTransaction.clienteId,
        clienteNombre: targetClientName,
        proveedorId: newTransaction.proveedorId,
        proveedorNombre: targetProvName,
        categoria: newTransaction.categoria,
        concepto: newTransaction.concepto,
        obraId: newTransaction.obraId,
        importe: Number(newTransaction.importe),
        formaPago: newTransaction.formaPago,
        comprobante: newTransaction.comprobante,
        observaciones: newTransaction.observaciones
      });
    } catch (err) {
      alert(err.message || 'No se pudo registrar el movimiento.');
      return;
    }

    // Reset form
    setNewTransaction({
      fecha: new Date().toISOString().split('T')[0],
      clienteId: '',
      proveedorId: '',
      categoria: 'Materiales',
      concepto: '',
      obraId: '',
      importe: 0,
      formaPago: 'Efectivo',
      comprobante: '',
      observaciones: ''
    });
    setIsModalOpen(false);
  };

  // Filter list
  const filteredList = cobros.filter(c => {
    const isCorrectType = activeTab === 'Ingresos' ? c.tipo === 'Ingreso' : c.tipo === 'Egreso';
    if (!isCorrectType) return false;

    const query = searchTerm.toLowerCase();
    const matchesConcept = c.concepto.toLowerCase().includes(query);
    const matchesName = activeTab === 'Ingresos' 
      ? c.clienteNombre.toLowerCase().includes(query)
      : c.proveedorNombre.toLowerCase().includes(query);

    return matchesConcept || matchesName;
  });

  // Calculate totals
  const totalIngresos = cobros.filter(c => c.tipo === 'Ingreso').reduce((acc, curr) => acc + curr.importe, 0);
  const totalEgresos = cobros.filter(c => c.tipo === 'Egreso').reduce((acc, curr) => acc + curr.importe, 0);

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Cobros y Finanzas</h2>
          <p className="text-gray-400 text-sm">Gestiona el flujo de caja, egresos de materiales e ingresos de obras.</p>
        </div>
        <button
          onClick={() => {
            setNewTransaction(prev => ({
              ...prev,
              clienteId: clientes[0]?.id || '',
              proveedorId: proveedores[0]?.id || '',
              obraId: obras[0]?.id || ''
            }));
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-5 h-5" />
          {activeTab === 'Ingresos' ? 'Nuevo Ingreso' : 'Nuevo Egreso'}
        </button>
      </div>

      {/* Financial indicator block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E293B] p-5 rounded-xl border border-[#334155] flex items-center gap-4">
          <div className="p-3.5 bg-green-500/10 text-green-400 rounded-xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Total Ingresos Registrados</p>
            <h4 className="text-xl font-bold text-white mt-1">${totalIngresos.toLocaleString('es-AR')}</h4>
          </div>
        </div>

        <div className="bg-[#1E293B] p-5 rounded-xl border border-[#334155] flex items-center gap-4">
          <div className="p-3.5 bg-red-500/10 text-red-400 rounded-xl">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Total Egresos Registrados</p>
            <h4 className="text-xl font-bold text-white mt-1">${totalEgresos.toLocaleString('es-AR')}</h4>
          </div>
        </div>

        <div className="bg-[#1E293B] p-5 rounded-xl border border-[#334155] flex items-center gap-4">
          <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Saldo Disponible en Caja</p>
            <h4 className={`text-xl font-bold mt-1 ${totalIngresos - totalEgresos >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${(totalIngresos - totalEgresos).toLocaleString('es-AR')}
            </h4>
          </div>
        </div>
      </div>

      {/* Main content box */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-lg">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#334155] bg-[#111827]/40 justify-between items-center px-6">
          <div className="flex">
            {['Ingresos', 'Egresos'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
                className={`px-6 py-4 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === tab 
                    ? 'border-blue-500 text-white bg-[#1E293B]' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search tool */}
          <div className="relative w-64 my-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0F1729] border border-[#334155] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#334155] bg-[#111827]/20 text-gray-400 uppercase text-[9px] tracking-wider font-bold">
                <th className="p-4">Fecha</th>
                <th className="p-4">{activeTab === 'Ingresos' ? 'Cliente' : 'Proveedor'}</th>
                <th className="p-4">Concepto</th>
                <th className="p-4">{activeTab === 'Ingresos' ? 'Obra Asociada' : 'Categoría'}</th>
                <th className="p-4">Forma de Pago</th>
                {activeTab === 'Egresos' && <th className="p-4">Comprobante</th>}
                <th className="p-4 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155] text-gray-300">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'Ingresos' ? 6 : 7} className="p-8 text-center text-gray-500">
                    No hay transacciones registradas.
                  </td>
                </tr>
              ) : (
                filteredList.map((c) => (
                  <tr key={c.id} className="hover:bg-[#16223F]/20 transition-colors">
                    <td className="p-4 whitespace-nowrap">{c.fecha}</td>
                    <td className="p-4 font-semibold text-white">
                      {activeTab === 'Ingresos' ? c.clienteNombre : c.proveedorNombre}
                    </td>
                    <td className="p-4 font-medium">{c.concepto}</td>
                    <td className="p-4">
                      {activeTab === 'Ingresos' ? (
                        c.obraId ? (
                          <span className="bg-blue-900/10 text-blue-400 border border-blue-500/25 px-2.5 py-0.5 rounded font-bold">
                            Obra #{obras.find(o=>o.id===c.obraId)?.numero || 'Activa'}
                          </span>
                        ) : 'Venta suelta / Anticipo'
                      ) : (
                        <span className="bg-[#1E293B] border border-[#475569] text-gray-300 px-2.5 py-0.5 rounded">
                          {c.categoria}
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        c.formaPago === 'Canje' 
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                          : 'bg-[#111827] text-gray-400'
                      }`}>
                        {c.formaPago}
                      </span>
                    </td>
                    {activeTab === 'Egresos' && (
                      <td className="p-4">
                        {c.comprobante ? (
                          <span className="text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {c.comprobante}
                          </span>
                        ) : (
                          <span className="text-gray-500">No adjunto</span>
                        )}
                      </td>
                    )}
                    <td className={`p-4 text-right font-bold text-sm ${activeTab === 'Ingresos' ? 'text-green-400' : 'text-red-400'}`}>
                      {activeTab === 'Ingresos' ? '+' : '-'}${c.importe.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* NEW TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]/40">
              <div>
                <h3 className="font-bold text-white text-base">Registrar {activeTab === 'Ingresos' ? 'Ingreso' : 'Egreso'}</h3>
                <p className="text-xs text-gray-400">Introduce los campos correspondientes del registro contable</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newTransaction.fecha}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Importe ($) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTransaction.importe || ''}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, importe: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none font-bold text-green-400"
                  />
                </div>

                {activeTab === 'Ingresos' ? (
                  <>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Cliente *</label>
                      <select
                        required
                        value={newTransaction.clienteId}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, clienteId: e.target.value }))}
                        className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                      >
                        <option value="" disabled>Seleccione...</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Obra Vinculada (Opcional)</label>
                      <select
                        value={newTransaction.obraId}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, obraId: e.target.value }))}
                        className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                      >
                        <option value="">Ninguna / Venta suelta</option>
                        {obras.map(o => (
                          <option key={o.id} value={o.id}>Obra #{o.numero} - {o.clienteNombre}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Proveedor (Opcional)</label>
                      <select
                        value={newTransaction.proveedorId}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, proveedorId: e.target.value }))}
                        className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                      >
                        <option value="">Gasto General / Sin Proveedor</option>
                        {proveedores.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Categoría del Gasto</label>
                      <select
                        value={newTransaction.categoria}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, categoria: e.target.value }))}
                        className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                      >
                        {config.categoriasGastos.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Forma de Pago</label>
                  <select
                    value={newTransaction.formaPago}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, formaPago: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    {config.formasPago.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {activeTab === 'Egresos' && (
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Adjuntar Factura/Remito (Nombre)</label>
                    <input
                      type="text"
                      placeholder="Ej: factura_remito_123.pdf"
                      value={newTransaction.comprobante}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, comprobante: e.target.value }))}
                      className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                )}

              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Concepto / Glosa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de materiales eléctricos obra Colucci"
                  value={newTransaction.concepto}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, concepto: e.target.value }))}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Notas internas..."
                  value={newTransaction.observaciones}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs transition-colors mt-6"
              >
                Guardar Registro
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
