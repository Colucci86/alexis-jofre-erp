import React from 'react';
import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  Briefcase, 
  DollarSign, 
  Package, 
  Wrench, 
  Truck, 
  BarChart3, 
  Settings,
  HardHat,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentPage, setCurrentPage }) {
  const { user, logout, canAccess } = useAuth();

  const menuItems = [
    { id: 'dashboard', name: 'Inicio', pageName: 'Dashboard', icon: Home },
    { id: 'agenda', name: 'Agenda', pageName: 'Agenda', icon: Calendar },
    { id: 'clientes', name: 'Clientes', pageName: 'Clientes', icon: Users },
    { id: 'presupuestos', name: 'Presupuestos', pageName: 'Presupuestos', icon: FileText },
    { id: 'obras', name: 'Obras', pageName: 'Obras', icon: Briefcase },
    { id: 'cobros', name: 'Cobros', pageName: 'Cobros', icon: DollarSign },
    { id: 'stock', name: 'Stock', pageName: 'Stock', icon: Package },
    { id: 'servicios', name: 'Servicios', pageName: 'Servicios', icon: HardHat },
    { id: 'proveedores', name: 'Proveedores', pageName: 'Proveedores', icon: Truck },
    { id: 'tecnicos', name: 'Técnicos', pageName: 'Técnicos', icon: Wrench },
    { id: 'estadisticas', name: 'Estadísticas', pageName: 'Estadísticas', icon: BarChart3 },
    { id: 'configuracion', name: 'Configuración', pageName: 'Configuración', icon: Settings },
  ];

  const visibleMenuItems = menuItems.filter(item => canAccess(item.pageName));

  return (
    <div className="w-64 bg-[#0B0F19] text-gray-300 flex flex-col justify-between border-r border-[#1E293B] min-h-screen no-print shrink-0">
      <div>
        {/* Brand / Logo */}
        <div className="pt-5 pb-3 px-3 border-b border-[#1E293B] flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Alexis Jofré Mantenimiento"
            className="w-full max-w-[210px] h-auto object-contain"
          />
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30' 
                    : 'hover:bg-[#16223F] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer info */}
      <div className="p-4 border-t border-[#1E293B] bg-[#0E1524] flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
            {user?.avatar || (user?.nombre ? user.nombre.slice(0, 2).toUpperCase() : 'AJ')}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white leading-tight truncate">{user?.nombre || 'Usuario'}</h4>
            <span className="inline-block text-[9px] text-blue-400 font-bold bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-500/20 truncate">
              {user?.rol || 'Administrador'}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 shrink-0"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
