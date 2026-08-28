import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ pageName, children, onNavigateBack }) {
  const { canAccess, user } = useAuth();

  if (!canAccess(pageName)) {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center space-y-4 max-w-md mx-auto my-12 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Acceso Restringido</h3>
          <p className="text-xs text-gray-400 mt-1">
            Tu rol actual (<strong className="text-blue-400">{user?.rol || 'Sin Rol'}</strong>) no tiene permisos para acceder a la sección <strong className="text-white">{pageName}</strong>.
          </p>
        </div>
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la vista principal
          </button>
        )}
      </div>
    );
  }

  return children;
}
