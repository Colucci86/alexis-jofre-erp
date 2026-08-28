import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { importLocalSnapshot } from '../services/migrationService';
import { fetchAllUsuarios, updateUsuarioRol, updateUsuarioActivo } from '../services/profileService';
import { 
  Building, 
  Scale, 
  Download, 
  Upload, 
  Check, 
  Plus, 
  Trash2,
  UploadCloud,
  Users
} from 'lucide-react';

export default function Configuracion() {
  const {
    config,
    setConfig,
    isRemote,
    getLocalSnapshot,
    reloadData,
  } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Administrador';
  
  // Local state inputs
  const [empresa, setEmpresa] = useState(config.empresa);
  const [titular, setTitular] = useState(config.titular);
  const [telefono, setTelefono] = useState(config.telefono);
  const [email, setEmail] = useState(config.email);
  const [ciudad, setCiudad] = useState(config.ciudad);
  const [validez, setValidez] = useState(config.validezPresupuesto);
  const [condiciones, setCondiciones] = useState(config.condicionesDefecto);

  useEffect(() => {
    setEmpresa(config.empresa);
    setTitular(config.titular);
    setTelefono(config.telefono);
    setEmail(config.email);
    setCiudad(config.ciudad);
    setValidez(config.validezPresupuesto);
    setCondiciones(config.condicionesDefecto);
  }, [config]);

  // Categories addition state
  const [newGastoCat, setNewGastoCat] = useState('');
  const [newPaymentMode, setNewPaymentMode] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);

  const [migrationStatus, setMigrationStatus] = useState('');
  const [allowRemoteImport, setAllowRemoteImport] = useState(false);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await setConfig(prev => ({
        ...prev,
        empresa,
        titular,
        telefono,
        email,
        ciudad,
        validezPresupuesto: Number(validez),
        condicionesDefecto: condiciones
      }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'No se pudo guardar la configuración.');
    }
  };

  const handleExportBackup = () => {
    const data = getLocalSnapshot();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_alexis_jofre_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (isRemote) {
          await importLocalSnapshot(parsed, { allowIfRemoteHasData: allowRemoteImport });
          await reloadData();
          alert('Datos importados a Supabase.');
          return;
        }
        Object.keys(parsed).forEach(key => {
          if (key.startsWith('aj_')) {
            localStorage.setItem(key, JSON.stringify(parsed[key]));
          }
        });
        alert('¡Copia de seguridad restaurada correctamente! Recargue la página para ver los cambios.');
        window.location.reload();
      } catch (err) {
        alert(err.message || 'Error al leer el archivo de copia de seguridad. Verifique el formato.');
      }
    };
    fileReader.readAsText(file);
    e.target.value = '';
  };

  const handleMigrateLocalToSupabase = async () => {
    setMigrationStatus('');
    try {
      await importLocalSnapshot(getLocalSnapshot(), { allowIfRemoteHasData: allowRemoteImport });
      await reloadData();
      setMigrationStatus('Importación a Supabase completada.');
    } catch (err) {
      setMigrationStatus(err.message || 'No se pudo importar a Supabase.');
    }
  };

  const handleAddGastoCat = async (e) => {
    e.preventDefault();
    if (!newGastoCat) return;
    await setConfig(prev => ({
      ...prev,
      categoriasGastos: [...prev.categoriasGastos, newGastoCat]
    }));
    setNewGastoCat('');
  };

  const handleRemoveGastoCat = async (cat) => {
    await setConfig(prev => ({
      ...prev,
      categoriasGastos: prev.categoriasGastos.filter(c => c !== cat)
    }));
  };

  const handleAddPaymentMode = async (e) => {
    e.preventDefault();
    if (!newPaymentMode) return;
    await setConfig(prev => ({
      ...prev,
      formasPago: [...prev.formasPago, newPaymentMode]
    }));
    setNewPaymentMode('');
  };

  const handleRemovePaymentMode = async (mode) => {
    await setConfig(prev => ({
      ...prev,
      formasPago: prev.formasPago.filter(f => f !== mode)
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-2xl font-bold text-white">Configuración</h2>
        <p className="text-gray-400 text-sm font-medium">Establece los parámetros base de Alexis Jofré Mantenimiento Integral.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: GENERAL SETTINGS */}
        <div className="lg:col-span-7 bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-lg space-y-6">
          <h3 className="font-bold text-white text-base border-b border-[#334155] pb-3 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-400" />
            Datos de la Empresa y Facturación
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Nombre Comercial de Empresa</label>
                <input
                  type="text"
                  required
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Nombre de Titular</label>
                <input
                  type="text"
                  required
                  value={titular}
                  onChange={(e) => setTitular(e.target.value)}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Teléfono Móvil (WhatsApp)</label>
                <input
                  type="text"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Email de la Empresa</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-400 font-semibold mb-1">Dirección y Ciudad Emisor</label>
                <input
                  type="text"
                  required
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Validez Presupuestos (Días Hábiles)</label>
                <input
                  type="number"
                  required
                  value={validez}
                  onChange={(e) => setValidez(e.target.value)}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 font-semibold mb-1">Cláusulas / Condiciones del Presupuesto por Defecto</label>
              <textarea
                rows={3}
                required
                value={condiciones}
                onChange={(e) => setCondiciones(e.target.value)}
                className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2.5 text-white focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg transition-colors"
              >
                Guardar Configuración
              </button>
              {saveSuccess && (
                <span className="text-green-400 flex items-center gap-1 font-semibold text-xs animate-pulse">
                  <Check className="w-4 h-4" />
                  Cambios guardados.
                </span>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: TAXONOMIES & BACKUP */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Taxonomy: Payment Methods */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-lg space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-blue-400" />
              Métodos de Pago Soportados
            </h4>
            
            <form onSubmit={handleAddPaymentMode} className="flex gap-2">
              <input
                type="text"
                placeholder="Añadir método (Ej: Canje)"
                value={newPaymentMode}
                onChange={(e) => setNewPaymentMode(e.target.value)}
                className="flex-1 bg-[#0F1729] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
              <button type="submit" className="bg-[#111827] hover:bg-[#16223F] border border-[#334155] text-white p-2 rounded-lg">
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              {config.formasPago.map((form) => (
                <span 
                  key={form} 
                  className="bg-[#111827] border border-[#334155] text-gray-300 pl-2.5 pr-1 py-1 rounded-md flex items-center gap-2"
                >
                  {form}
                  <button onClick={() => handleRemovePaymentMode(form)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Backup recovery module */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-lg space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Copia de Seguridad y Backup</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {isRemote
                ? 'Exportá un JSON con los datos actuales o importá un respaldo hacia Supabase (una sola vez, para no duplicar).'
                : 'Exportá o restaurá un archivo JSON con clientes, stock, presupuestos e historial.'}
            </p>

            {isRemote && (
              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-2 text-[11px] text-gray-300">
                  <input
                    type="checkbox"
                    checked={allowRemoteImport}
                    onChange={(e) => setAllowRemoteImport(e.target.checked)}
                    className="mt-0.5"
                  />
                  Permitir importar aunque Supabase ya tenga datos (puede duplicar si no es un entorno vacío).
                </label>
                <button
                  type="button"
                  onClick={handleMigrateLocalToSupabase}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 font-semibold py-2.5 rounded-lg text-xs transition-colors"
                >
                  <UploadCloud className="w-4 h-4" />
                  Subir datos locales actuales a Supabase
                </button>
                {migrationStatus && (
                  <p className="text-[11px] text-gray-300">{migrationStatus}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#16223F] border border-[#334155] text-white font-semibold py-2.5 rounded-lg text-xs transition-colors"
              >
                <Download className="w-4 h-4 text-blue-400" />
                Exportar Backup
              </button>

              <label className="flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#16223F] border border-[#334155] text-white font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-green-400" />
                Importar Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
