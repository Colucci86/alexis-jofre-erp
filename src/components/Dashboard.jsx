import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  FileText, 
  Briefcase, 
  DollarSign, 
  CheckCircle,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';

export default function Dashboard({ setCurrentPage, setSelectedItem }) {
  const { 
    clientes, 
    presupuestos, 
    obras, 
    cobros, 
    agenda, 
    productos 
  } = useApp();

  const [periodo, setPeriodo] = useState('Este mes');

  // Format currency filter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Calculations for dashboard
  const activeObras = obras.filter(o => o.estado === 'En curso' || o.estado === 'En proceso');
  const finishedObras = obras.filter(o => o.estado === 'Finalizado');
  
  // Pending collections
  const pendingCobrosTotal = obras.reduce((acc, curr) => acc + Number(curr.importePendiente), 0);

  // Income vs Expenses
  const totalIngresos = cobros
    .filter(c => c.tipo === 'Ingreso')
    .reduce((acc, curr) => acc + Number(curr.importe), 0);

  const totalEgresos = cobros
    .filter(c => c.tipo === 'Egreso')
    .reduce((acc, curr) => acc + Number(curr.importe), 0);

  const netGain = totalIngresos - totalEgresos;

  // Alerts
  const lowStockProducts = productos.filter(p => Number(p.stockActual) <= Number(p.stockMinimo));
  const pendingPresupuestos = presupuestos.filter(p => p.estado === 'Pendiente' || p.estado === 'Enviado');

  // Chart Data preparation (Last 6 months)
  const chartData = [
    { name: 'Ene', Facturacion: 450000, Cobrado: 320000 },
    { name: 'Feb', Facturacion: 580000, Cobrado: 450000 },
    { name: 'Mar', Facturacion: 720000, Cobrado: 680000 },
    { name: 'Abr', Facturacion: 900000, Cobrado: 730000 },
    { name: 'May', Facturacion: 850000, Cobrado: 800000 },
    { name: 'Jun', Facturacion: 980000, Cobrado: 850000 }
  ];

  // Modify April using real budget from Martín Colucci
  chartData[3].Facturacion = 730000;
  chartData[3].Cobrado = 150000; // Martín paid 150.000 so far

  return (
    <div className="space-y-6">
      {/* Header and selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Hola, Alexis 👋</h2>
          <p className="text-gray-400 text-sm">Aquí tienes un resumen de la actividad de tu negocio.</p>
        </div>

        {/* Period selection */}
        <div className="flex bg-[#1E293B] p-1 rounded-lg border border-[#334155] self-start">
          {['Hoy', 'Esta semana', 'Este mes', 'Este año'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                periodo === p 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Presupuestos del mes */}
        <div className="bg-[#1E293B] p-6 rounded-xl border border-[#334155] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Presupuestos del mes</p>
            <h3 className="text-2xl font-bold text-white mt-1">{presupuestos.length}</h3>
            <p className="text-xs text-gray-500 mt-2">
              <span className="text-yellow-500 font-semibold">{pendingPresupuestos.length}</span> pendientes de firma
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Obras en curso */}
        <div className="bg-[#1E293B] p-6 rounded-xl border border-[#334155] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Obras en curso</p>
            <h3 className="text-2xl font-bold text-white mt-1">{activeObras.length}</h3>
            <p className="text-xs text-gray-500 mt-2">
              Asignadas a técnicos especializados
            </p>
          </div>
          <div className="w-12 h-12 bg-yellow-500/10 text-yellow-400 rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Cobros pendientes */}
        <div className="bg-[#1E293B] p-6 rounded-xl border border-[#334155] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cobros pendientes</p>
            <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(pendingCobrosTotal)}</h3>
            <p className="text-xs text-gray-500 mt-2">
              Saldos activos de clientes
            </p>
          </div>
          <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Obras finalizadas */}
        <div className="bg-[#1E293B] p-6 rounded-xl border border-[#334155] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Obras finalizadas</p>
            <h3 className="text-2xl font-bold text-white mt-1">{finishedObras.length}</h3>
            <p className="text-xs text-gray-500 mt-2">
              Completadas satisfactoriamente
            </p>
          </div>
          <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#1E293B]/60 p-5 rounded-xl border border-[#334155] flex items-center gap-4">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Ingresos Totales</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totalIngresos)}</p>
          </div>
        </div>

        <div className="bg-[#1E293B]/60 p-5 rounded-xl border border-[#334155] flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Egresos Totales</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totalEgresos)}</p>
          </div>
        </div>

        <div className="bg-[#1E293B]/60 p-5 rounded-xl border border-[#334155] flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Ganancia Neta (Caja)</p>
            <p className={`text-lg font-bold ${netGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(netGain)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area: Chart and Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing vs Collected Chart */}
        <div className="bg-[#1E293B] p-6 rounded-xl border border-[#334155] lg:col-span-2 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-base">Evolución Facturación vs Cobrado</h3>
            <p className="text-xs text-gray-400">Últimos 6 meses</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#475569', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                <Bar dataKey="Facturacion" name="Presupuestado" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cobrado" name="Cobrado / Anticipos" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming events of Agenda */}
        <div className="bg-[#1E293B] p-6 rounded-xl border border-[#334155] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-base">Próximos Eventos</h3>
              <button 
                onClick={() => setCurrentPage('agenda')} 
                className="text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                Ver agenda
              </button>
            </div>
            
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {agenda.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No hay visitas programadas hoy.
                </div>
              ) : (
                agenda.map((ev) => {
                  const evDate = new Date(ev.start);
                  return (
                    <div 
                      key={ev.id} 
                      onClick={() => {
                        setCurrentPage('agenda');
                      }}
                      className="p-3 bg-[#111827] hover:bg-[#16223F] rounded-lg border border-[#334155] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                          {evDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} a las {evDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                        </span>
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1">{ev.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{ev.clienteNombre}</p>
                      {ev.tecnicoNombre && (
                        <span className="inline-block mt-2 text-[10px] bg-[#1E293B] text-gray-300 px-2 py-0.5 rounded-full border border-[#475569]">
                          Téc: {ev.tecnicoNombre}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts Block */}
      {(lowStockProducts.length > 0) && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-yellow-500">Alertas de Stock Bajo</h4>
            <p className="text-xs text-gray-400 mt-1">
              Los siguientes insumos están por debajo de su cantidad mínima establecida:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockProducts.map(p => (
                <span 
                  key={p.id} 
                  onClick={() => { setCurrentPage('stock'); }}
                  className="text-[11px] bg-yellow-950/80 border border-yellow-800 text-yellow-400 px-2.5 py-0.5 rounded-md cursor-pointer hover:bg-yellow-900/60"
                >
                  {p.nombre} ({p.stockActual} {p.unidadMedida} left)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
