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

/** Parsea una fecha 'YYYY-MM-DD...' como fecha local (evita desfase UTC) */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/** Devuelve true si la fecha cae dentro del periodo seleccionado */
function inPeriod(dateStr, periodo) {
  if (!dateStr) return false;
  const d = parseLocalDate(dateStr);
  if (!d) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (periodo === 'Hoy') {
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  }
  if (periodo === 'Esta semana') {
    const day = today.getDay(); // 0 = domingo
    const offset = day === 0 ? 6 : day - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - offset);
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    return d.getTime() >= monday.getTime() && d.getTime() < nextMonday.getTime();
  }
  if (periodo === 'Este mes') {
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  }
  if (periodo === 'Este año') {
    return d.getFullYear() === today.getFullYear();
  }
  return true;
}

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

  // Calculations for dashboard (filtered by selected period)
  const presupuestosPeriodo = presupuestos.filter(p => inPeriod(p.fecha, periodo));
  const activeObras = obras.filter(o => (o.estado === 'En curso' || o.estado === 'En proceso') && inPeriod(o.fechaInicio, periodo));
  const finishedObras = obras.filter(o => o.estado === 'Finalizado' && inPeriod(o.fechaFin || o.fechaInicio, periodo));

  // Pending collections (obras que arrancaron en el periodo)
  const pendingCobrosTotal = obras
    .filter(o => Number(o.importePendiente || 0) > 0 && inPeriod(o.fechaInicio, periodo))
    .reduce((acc, curr) => acc + Number(curr.importePendiente || 0), 0);

  // Income vs Expenses (movimientos del periodo)
  const cobrosPeriodo = cobros.filter(c => inPeriod(c.fecha, periodo));
  const totalIngresos = cobrosPeriodo
    .filter(c => c.tipo === 'Ingreso')
    .reduce((acc, curr) => acc + Number(curr.importe || 0), 0);

  const totalEgresos = cobrosPeriodo
    .filter(c => c.tipo === 'Egreso')
    .reduce((acc, curr) => acc + Number(curr.importe || 0), 0);

  const netGain = totalIngresos - totalEgresos;

  // Alerts
  const lowStockProducts = productos.filter(p => Number(p.stockActual) <= Number(p.stockMinimo));
  const pendingPresupuestos = presupuestosPeriodo.filter(p => p.estado === 'Pendiente' || p.estado === 'Enviado');

  // Próximos eventos de la agenda (hoy en adelante), ordenados por fecha
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const upcomingEvents = agenda
    .filter(ev => ev.start && new Date(ev.start).getTime() >= todayStart.getTime())
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 6);

  // Chart Data preparation (Last 6 months)
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const now = new Date();
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthCobros = cobros.filter(c => {
      if (!c.fecha) return false;
      const [y, m] = c.fecha.split('-').map(Number);
      return y === year && m === month + 1;
    });
    return {
      name: monthNames[month],
      Facturacion: monthCobros.filter(c => c.tipo === 'Ingreso').reduce((acc, c) => acc + Number(c.importe || 0), 0),
      Cobrado: monthCobros.filter(c => c.tipo === 'Ingreso').reduce((acc, c) => acc + Number(c.importe || 0), 0),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header and selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Hola, Alexis 👋</h2>
          <p className="text-gray-400 text-xs sm:text-sm">Aquí tienes un resumen de la actividad de tu negocio.</p>
        </div>

        {/* Period selection - scrollable on mobile */}
        <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
          <div className="flex bg-[#1E293B] p-1 rounded-lg border border-[#334155] self-start w-max">
            {['Hoy', 'Esta semana', 'Este mes', 'Este año'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
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
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Presupuestos del mes */}
        <div className="bg-[#1E293B] p-4 sm:p-6 rounded-xl border border-[#334155] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">Presupuestos</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{presupuestosPeriodo.length}</h3>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">
              <span className="text-yellow-500 font-semibold">{pendingPresupuestos.length}</span> pendientes en el periodo
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Obras en curso */}
        <div className="bg-[#1E293B] p-4 sm:p-6 rounded-xl border border-[#334155] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">Obras activas</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{activeObras.length}</h3>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 hidden sm:block">
              Asignadas a técnicos
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 text-yellow-400 rounded-xl flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Cobros pendientes */}
        <div className="bg-[#1E293B] p-4 sm:p-6 rounded-xl border border-[#334155] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">Cobros pend.</p>
            <h3 className="text-base sm:text-2xl font-bold text-white mt-1">{formatCurrency(pendingCobrosTotal)}</h3>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 hidden sm:block">
              Saldos activos
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Obras finalizadas */}
        <div className="bg-[#1E293B] p-4 sm:p-6 rounded-xl border border-[#334155] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">Finalizadas</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{finishedObras.length}</h3>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 hidden sm:block">
              Completadas
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
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
          <div className="h-48 sm:h-64 lg:h-72 w-full">
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
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No hay visitas agendadas para hoy o próximos días.
                </div>
              ) : (
                upcomingEvents.map((ev) => {
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
                  {p.nombre} ({p.stockActual} {p.unidadMedida} disponibles)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
