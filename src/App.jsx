import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { defaultPageForRole, canRoleAccess } from './utils/permissions';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

import Sidebar from './components/Sidebar';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Clientes = lazy(() => import('./components/Clientes'));
const Presupuestos = lazy(() => import('./components/Presupuestos'));
const Obras = lazy(() => import('./components/Obras'));
const Cobros = lazy(() => import('./components/Cobros'));
const Stock = lazy(() => import('./components/Stock'));
const Servicios = lazy(() => import('./components/Servicios'));
const Proveedores = lazy(() => import('./components/Proveedores'));
const Agenda = lazy(() => import('./components/Agenda'));
const Tecnicos = lazy(() => import('./components/Tecnicos'));
const Estadisticas = lazy(() => import('./components/Estadisticas'));
const Configuracion = lazy(() => import('./components/Configuracion'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-xs font-semibold">
      Cargando...
    </div>
  );
}

import { Search, Bell, Menu, X } from 'lucide-react';

const PAGE_NAMES = {
  dashboard: 'Dashboard',
  agenda: 'Agenda',
  clientes: 'Clientes',
  presupuestos: 'Presupuestos',
  obras: 'Obras',
  cobros: 'Cobros',
  stock: 'Stock',
  servicios: 'Servicios',
  proveedores: 'Proveedores',
  tecnicos: 'Técnicos',
  estadisticas: 'Estadísticas',
  configuracion: 'Configuración'
};

function DashboardLayout() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sessionUserId, setSessionUserId] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setSessionUserId(null);
      return;
    }
    if (user.id !== sessionUserId) {
      setSessionUserId(user.id);
      setCurrentPage(defaultPageForRole(user.rol));
    }
  }, [user, sessionUserId]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { 
    clientes, 
    proveedores, 
    presupuestos, 
    obras, 
    productos,
    dataLoading,
    dataError,
    setDataError,
  } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-300 flex items-center justify-center">
        <p className="text-sm font-semibold">Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Universal Search Logic
  const getSearchResults = () => {
    if (!globalSearch) return [];
    const query = globalSearch.toLowerCase();
    const results = [];
    const rol = user?.rol;

    // Search Customers
    if (canRoleAccess(rol, PAGE_NAMES['clientes'])) {
      clientes.forEach(c => {
        if (c.nombre?.toLowerCase().includes(query)) {
          results.push({ type: 'Cliente', title: c.nombre, item: c, page: 'clientes' });
        }
      });
    }

    if (canRoleAccess(rol, PAGE_NAMES['presupuestos'])) {
      presupuestos.forEach(p => {
        if (p.numero?.includes(query) || p.clienteNombre?.toLowerCase().includes(query)) {
          results.push({ type: 'Presupuesto', title: `Presupuesto #${p.numero} (${p.clienteNombre})`, item: p, page: 'presupuestos' });
        }
      });
    }

    if (canRoleAccess(rol, PAGE_NAMES['obras'])) {
      obras.forEach(o => {
        if (o.numero?.includes(query) || o.clienteNombre?.toLowerCase().includes(query)) {
          results.push({ type: 'Obra', title: `Obra #${o.numero} - ${o.clienteNombre}`, item: o, page: 'obras' });
        }
      });
    }

    if (canRoleAccess(rol, PAGE_NAMES['stock'])) {
      productos.forEach(p => {
        if (p.nombre?.toLowerCase().includes(query) || p.codigo?.toLowerCase().includes(query)) {
          results.push({ type: 'Stock Insumo', title: `${p.nombre} [${p.codigo}]`, item: p, page: 'stock' });
        }
      });
    }

    // Search Providers
    if (canRoleAccess(rol, PAGE_NAMES['proveedores'])) {
      proveedores.forEach(p => {
        if (p.nombre?.toLowerCase().includes(query) || p.rubro?.toLowerCase().includes(query)) {
          results.push({ type: 'Proveedor', title: p.nombre, item: p, page: 'proveedores' });
        }
      });
    }

    return results.slice(0, 8);
  };

  const handleResultClick = (res) => {
    setCurrentPage(res.page);
    setGlobalSearch('');
    setShowSearchResults(false);
  };

  // Render current tab component
  const renderPage = () => {
    const activePageName = PAGE_NAMES[currentPage] || 'Dashboard';
    let Component;

    switch (currentPage) {
      case 'dashboard':
        Component = <Dashboard setCurrentPage={setCurrentPage} />;
        break;
      case 'agenda':
        Component = <Agenda />;
        break;
      case 'clientes':
        Component = <Clientes />;
        break;
      case 'presupuestos':
        Component = <Presupuestos />;
        break;
      case 'obras':
        Component = <Obras />;
        break;
      case 'cobros':
        Component = <Cobros />;
        break;
      case 'stock':
        Component = <Stock />;
        break;
      case 'servicios':
        Component = <Servicios />;
        break;
      case 'proveedores':
        Component = <Proveedores />;
        break;
      case 'tecnicos':
        Component = <Tecnicos />;
        break;
      case 'estadisticas':
        Component = <Estadisticas />;
        break;
      case 'configuracion':
        Component = <Configuracion />;
        break;
      default:
        Component = <Dashboard setCurrentPage={setCurrentPage} />;
    }

    return (
      <ProtectedRoute pageName={activePageName} onNavigateBack={() => setCurrentPage(defaultPageForRole(user?.rol))}>
        <Suspense fallback={<PageLoader />}>
          {Component}
        </Suspense>
      </ProtectedRoute>
    );
  };

  const searchResults = getSearchResults();

  return (
    <div className="flex bg-[#0F1729] text-gray-100 min-h-screen">
      
      {/* Sidebar for wide screens */}
      <div className="hidden lg:block shrink-0">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>

      {/* Sidebar drawer for mobile */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 bg-[#0B0F19] h-full border-r border-[#1E293B] animate-in slide-in-from-left duration-200">
            <div className="absolute top-4 right-4">
              <button onClick={() => setIsMobileSidebarOpen(false)} className="text-gray-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar currentPage={currentPage} setCurrentPage={(p) => { setCurrentPage(p); setIsMobileSidebarOpen(false); }} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Global Header (Hidden on print) */}
        <header className="h-14 sm:h-16 border-b border-[#1E293B] bg-[#0F1729]/90 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-[#1E293B] rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-extrabold text-white text-sm sm:text-base tracking-wide uppercase block">
              {currentPage === 'dashboard' ? 'Panel' : PAGE_NAMES[currentPage] || currentPage}
            </h1>
          </div>

          {/* Search bar & notification buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Universal Search input container */}
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={globalSearch}
                  onChange={(e) => { setGlobalSearch(e.target.value); setShowSearchResults(true); }}
                  onFocus={() => setShowSearchResults(true)}
                  className="bg-[#1E293B] border border-[#334155] rounded-xl pl-9 pr-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none w-28 sm:w-48 md:w-64 focus:border-blue-500 sm:focus:w-72 transition-all duration-300"
                />
              </div>

              {/* Float Search Dropdown */}
              {showSearchResults && globalSearch && (
                <div className="absolute right-0 mt-2 bg-[#1E293B] border border-[#334155] rounded-xl shadow-2xl w-72 sm:w-80 overflow-hidden z-50" style={{maxWidth: 'calc(100vw - 1rem)'}}>
                  <div className="p-3 border-b border-[#334155] bg-[#111827]/60 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>Resultados de búsqueda</span>
                    <button onClick={() => setShowSearchResults(false)} className="text-gray-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#334155]">
                    {searchResults.length === 0 ? (
                      <p className="p-4 text-center text-xs text-gray-500">No se encontraron resultados.</p>
                    ) : (
                      searchResults.map((res, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleResultClick(res)}
                          className="p-3 hover:bg-[#16223F] cursor-pointer text-xs transition-colors"
                        >
                          <div className="flex justify-between items-center text-[9px] font-bold text-blue-400 mb-1 uppercase tracking-wider">
                            <span>{res.type}</span>
                          </div>
                          <p className="font-semibold text-white truncate">{res.title}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="p-1.5 hover:bg-[#1E293B] text-gray-400 hover:text-white rounded-lg transition-colors relative" title="Notificaciones">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full" />
            </button>

          </div>
        </header>

        {/* Dynamic Component Wrapper */}
        <main className="p-3 sm:p-4 lg:p-6 flex-1 bg-[#0F1729] relative">
          {dataError && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <span>{dataError}</span>
              <button onClick={() => setDataError(null)} className="text-red-200 hover:text-white font-bold">
                Cerrar
              </button>
            </div>
          )}
          {dataLoading && (
            <div className="mb-4 text-xs text-blue-300 font-semibold">Sincronizando datos con Supabase...</div>
          )}
          {renderPage()}
        </main>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <DashboardLayout />
      </AppProvider>
    </AuthProvider>
  );
}
