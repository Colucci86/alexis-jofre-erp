import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Lock, Mail, User, ShieldCheck, ArrowRight, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
  const {
    login,
    resetPassword,
    updatePassword,
    loading,
    authError,
    demoAuthEnabled,
    recoveryMode,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resetModal, setResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await login(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Credenciales inválidas');
    }
  };

  const handleQuickLogin = async (userObj) => {
    setEmail(userObj.email);
    setPassword('demo1234');
    await login(userObj.email, 'demo1234');
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    const res = await resetPassword(resetEmail);
    if (!res.success) {
      setResetStatus(res.error || 'No se pudo enviar el correo.');
      return;
    }
    setResetStatus(res.message);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setRecoveryStatus('');
    const res = await updatePassword(newPassword);
    if (!res.success) {
      setRecoveryStatus(res.error || 'No se pudo actualizar la contraseña.');
      return;
    }
    setRecoveryStatus('Contraseña actualizada. Ya podés ingresar.');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Glow Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#1E293B] border border-[#334155] rounded-2xl p-8 shadow-2xl space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header / Brand Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img src="/logo.png" alt="Alexis Jofré Mantenimiento" className="h-20 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Sistema de Gestión</h1>
            <p className="text-xs text-gray-400 mt-1">Ingresá tus credenciales para acceder</p>
          </div>
        </div>

        {/* Error Alert */}
        {(errorMsg || authError) && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg || authError}</span>
          </div>
        )}

        {recoveryMode && (
          <form onSubmit={handleUpdatePassword} className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-3 text-xs">
            <p className="font-semibold text-blue-200">Restablecé tu contraseña</p>
            <input
              type="password"
              required
              minLength={8}
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#0F1729] border border-[#334155] rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            {recoveryStatus && <p className="text-green-400">{recoveryStatus}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl">
              Guardar contraseña
            </button>
          </form>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-300 mb-1.5">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="ejemplo@alexisjofre.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F1729] border border-[#334155] rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-semibold text-gray-300">Contraseña</label>
              <button
                type="button"
                onClick={() => setResetModal(true)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0F1729] border border-[#334155] rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {demoAuthEnabled && (
        <div className="border-t border-[#334155] pt-5 space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
            Acceso Rápido por Rol (Demo)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => handleQuickLogin(u)}
                className="p-2.5 bg-[#111827]/60 hover:bg-[#16223F] border border-[#334155] hover:border-blue-500/50 rounded-xl flex flex-col items-center gap-1 transition-all text-center group"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {u.avatar}
                </div>
                <span className="text-[11px] font-bold text-white truncate w-full">{u.rol}</span>
                <span className="text-[9px] text-gray-400 truncate w-full">{u.nombre}</span>
              </button>
            ))}
          </div>
        </div>
        )}

      </div>

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-400" />
                Recuperar Contraseña
              </h3>
              <button onClick={() => { setResetModal(false); setResetStatus(''); }} className="text-gray-400 hover:text-white text-xs">
                ✕
              </button>
            </div>
            
            {resetStatus ? (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enviado</span>
                </div>
                <p>{resetStatus}</p>
                <button
                  onClick={() => { setResetModal(false); setResetStatus(''); }}
                  className="w-full bg-green-600 text-white font-bold py-2 rounded-lg mt-2"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
                <p className="text-gray-300">
                  Ingresá tu correo registrado para recibir las instrucciones de recuperación.
                </p>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="tu.email@ejemplo.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResetModal(false)}
                    className="flex-1 border border-[#334155] py-2 rounded-xl text-gray-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl"
                  >
                    Enviar Correo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
