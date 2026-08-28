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
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DollarSign, 
  Percent, 
  Briefcase, 
  FileText,
  Calendar,
  ChevronDown
} from 'lucide-react';

export default function Estadisticas() {
  const { cobros, obras, presupuestos } = useApp();
  const [periodo, setPeriodo] = useState('Este año');

  // Calculations
  const ingresos = cobros.filter(c => c.tipo === 'Ingreso').reduce((acc, curr) => acc + curr.importe, 0);
  const egresos = cobros.filter(c => c.tipo === 'Egreso').reduce((acc, curr) => acc + curr.importe, 0);
  const balance = ingresos - egresos;

  // Monthly balance data (simulated/aggregated)
  const monthlyData = [
    { name: 'Ene', Ingresos: 320000, Egresos: 120000 },
    { name: 'Feb', Ingresos: 450000, Egresos: 150000 },
    { name: 'Mar', Ingresos: 680000, Egresos: 210000 },
    { name: 'Abr', Ingresos: 730000, Egresos: 180000 },
    { name: 'May', Ingresos: 800000, Egresos: 250000 },
    { name: 'Jun', Ingresos: 850000, Egresos: 320000 }
  ];

  // Budget status breakdown
  const budgetStatuses = [
    { name: 'Aceptados', value: presupuestos.filter(p => p.estado === 'Aceptado').length, color: '#10B981' },
    { name: 'Enviados/Pendientes', value: presupuestos.filter(p => p.estado === 'Enviado' || p.estado === 'Pendiente').length, color: '#F59E0B' },
    { name: 'Rechazados/Vencidos', value: presupuestos.filter(p => p.estado === 'Rechazado' || p.estado === 'Vencido').length || 1, color: '#EF4444' }
  ];

  // Work Categories distribution
  const obraCategories = [
    { name: 'Electricidad', value: obras.filter(o => o.tipoTrabajo === 'Electricidad').length || 2, color: '#3B82F6' },
    { name: 'Durlock', value: obras.filter(o => o.tipoTrabajo === 'Durlock').length || 1, color: '#10B981' },
    { name: 'Pintura', value: obras.filter(o => o.tipoTrabajo === 'Pintura').length || 1, color: '#EC4899' },
    { name: 'Remodelaciones', value: obras.filter(o => o.tipoTrabajo === 'Remodelación').length || 1, color: '#F59E0B' }
  ];

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Estadísticas y Reportes</h2>
          <p className="text-gray-400 text-sm">Visualiza el rendimiento financiero y operativo de Alexis Jofré Mantenimiento.</p>
        </div>

        {/* Period picker */}
        <div className="flex bg-[#1E293B] p-1 rounded-lg border border-[#334155]">
          {['Este mes', 'Este año', 'Histórico'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                periodo === p 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI blocks */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] p-5 rounded-xl border border-[#334155] shadow-lg text-center">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Facturación Total</p>
          <h3 className="text-xl font-black text-white mt-1">${ingresos.toLocaleString('es-AR')}</h3>
        </div>

        <div className="bg-[#1E293B] p-5 rounded-xl border border-[#334155] shadow-lg text-center">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Gastos Acumulados</p>
          <h3 className="text-xl font-black text-white mt-1">${egresos.toLocaleString('es-AR')}</h3>
        </div>

        <div className="bg-[#1E293B] p-5 rounded-xl border border-[#334155] shadow-lg text-center">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Margen Operativo</p>
          <h3 className={`text-xl font-black mt-1 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${balance.toLocaleString('es-AR')}
          </h3>
        </div>

        <div className="bg-[#1E293B] p-5 rounded-xl border border-[#334155] shadow-lg text-center">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Tasa de Cierre</p>
          <h3 className="text-xl font-black text-blue-400 mt-1">
            {((presupuestos.filter(p=>p.estado==='Aceptado').length / (presupuestos.length || 1)) * 100).toFixed(0)}%
          </h3>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Financial Bar chart */}
        <div className="bg-[#1E293B] p-6 border border-[#334155] rounded-xl shadow-lg">
          <h4 className="font-bold text-white text-sm mb-4">Ingresos vs Egresos Mensuales</h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#475569', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Service category pie chart */}
        <div className="bg-[#1E293B] p-6 border border-[#334155] rounded-xl shadow-lg flex flex-col justify-between">
          <h4 className="font-bold text-white text-sm mb-4">Distribución de Obras por Rubro</h4>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={obraCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {obraCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {obraCategories.map(cat => (
              <span key={cat.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name} ({cat.value})
              </span>
            ))}
          </div>
        </div>

        {/* Chart 3: Budget approval rate */}
        <div className="bg-[#1E293B] p-6 border border-[#334155] rounded-xl shadow-lg flex flex-col justify-between lg:col-span-2">
          <h4 className="font-bold text-white text-sm mb-4">Tasa de Aprobación de Presupuestos</h4>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetStatuses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {budgetStatuses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center flex-wrap gap-6 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {budgetStatuses.map(status => (
              <span key={status.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                {status.name} ({status.value})
              </span>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
