import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { shouldUseDemoAuth } from '../lib/config';
import { fetchProfileByAuthId } from '../services/profileService';
import { canRoleAccess } from '../utils/permissions';
import { ServiceError } from '../services/errors';

const AuthContext = createContext();

export const DEMO_USERS = [
  {
    id: 'usr_admin',
    email: 'admin@alexisjofre.com',
    nombre: 'Alexis Jofré',
    rol: 'Administrador',
    avatar: 'AJ',
  },
  {
    id: 'usr_admin2',
    email: 'admin@gmail.com',
    nombre: 'Administración',
    rol: 'Administrativo',
    avatar: 'AD',
  },
  {
    id: 'usr_tech',
    email: 'carlos@alexisjofre.com',
    nombre: 'Carlos Pereyra',
    rol: 'Técnico',
    tecnicoId: 't1',
    avatar: 'CP',
  },
];

const DEMO_PASSWORD = 'demo1234';
const DEMO_SESSION_KEY = 'aj_demo_session';

function avatarFromName(nombre, email) {
  const source = nombre || email || '?';
  return source.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const applyProfile = useCallback((profile) => {
    if (!profile) {
      setUser(null);
      return;
    }
    setUser({
      ...profile,
      avatar: profile.avatar || avatarFromName(profile.nombre, profile.email),
    });
  }, []);

  const loadRemoteProfile = useCallback(async (authUser) => {
    if (!authUser) {
      applyProfile(null);
      return;
    }
    try {
      const profile = await fetchProfileByAuthId(authUser.id);
      if (!profile || profile.activo === false) {
        await supabase.auth.signOut();
        applyProfile(null);
        setAuthError('Tu usuario está inactivo o no tiene perfil. Contactá a un administrador.');
        return;
      }
      applyProfile(profile);
    } catch (err) {
      if (err instanceof ServiceError && err.code === 'SESSION_EXPIRED') {
        applyProfile(null);
        setAuthError('Sesión expirada. Volvé a iniciar sesión.');
        return;
      }
      applyProfile(null);
      setAuthError(err.message || 'No se pudo cargar el perfil.');
    }
  }, [applyProfile]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setAuthError(null);

      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          await loadRemoteProfile(session.user);
        } else {
          applyProfile(null);
        }
        setLoading(false);
        return;
      }

      if (shouldUseDemoAuth()) {
        try {
          const saved = localStorage.getItem(DEMO_SESSION_KEY);
          if (saved) applyProfile(JSON.parse(saved));
          else applyProfile(null);
        } catch {
          applyProfile(null);
        }
        setLoading(false);
        return;
      }

      applyProfile(null);
      setLoading(false);
    }

    boot();

    if (!isSupabaseConfigured || !supabase) {
      return () => { cancelled = true; };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
      if (event === 'SIGNED_OUT') {
        applyProfile(null);
        setRecoveryMode(false);
        return;
      }
      if (session?.user && event !== 'TOKEN_REFRESHED') {
        await loadRemoteProfile(session.user);
      }
      if (event === 'TOKEN_REFRESHED' && !session) {
        applyProfile(null);
        setAuthError('Sesión expirada. Volvé a iniciar sesión.');
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applyProfile, loadRemoteProfile]);

  useEffect(() => {
    if (!shouldUseDemoAuth()) return;
    if (user) localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(DEMO_SESSION_KEY);
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);

    try {
      if (!email || !password) {
        throw new Error('Ingresá correo y contraseña.');
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        await loadRemoteProfile(data.user);
        return { success: true };
      }

      if (shouldUseDemoAuth()) {
        const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (found) {
          applyProfile(found);
          return { success: true };
        }
        // En modo demo local, permite ingresar con cualquier correo como Administrador
        const customUser = {
          id: 'usr_' + Date.now(),
          email: email.trim(),
          nombre: email.trim().split('@')[0] || 'Usuario',
          rol: 'Administrador'
        };
        applyProfile(customUser);
        return { success: true };
      }
    } catch (err) {
      const message = err.message || 'Error de inicio de sesión';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    applyProfile(null);
    localStorage.removeItem(DEMO_SESSION_KEY);
    localStorage.removeItem('aj_user');
    setRecoveryMode(false);
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'La recuperación de contraseña requiere Supabase configurado.' };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, message: 'Se envió un correo para restablecer la contraseña.' };
  };

  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase no está configurado.' };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    setRecoveryMode(false);
    return { success: true };
  };

  const canAccess = (pageName) => canRoleAccess(user?.rol, pageName);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      resetPassword,
      updatePassword,
      canAccess,
      loading,
      authError,
      isSupabaseConfigured,
      demoAuthEnabled: shouldUseDemoAuth(),
      recoveryMode,
      setRecoveryMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
