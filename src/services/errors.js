export class ServiceError extends Error {
  constructor(message, code = 'UNKNOWN') {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

export function handleSupabaseError(error, fallback = 'Error de base de datos') {
  if (!error) return null;
  const message = error.message || fallback;
  if (error.code === 'PGRST301' || message.includes('JWT')) {
    return new ServiceError('Sesión expirada. Volvé a iniciar sesión.', 'SESSION_EXPIRED');
  }
  if (error.code === '42501' || message.includes('permission')) {
    return new ServiceError('No tenés permiso para realizar esta acción.', 'FORBIDDEN');
  }
  return new ServiceError(message, error.code || 'DB_ERROR');
}
