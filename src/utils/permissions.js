export const ROLE_PERMISSIONS = {
  Administrador: [
    'Dashboard', 'Agenda', 'Clientes', 'Presupuestos', 'Obras', 'Cobros',
    'Stock', 'Servicios', 'Proveedores', 'Técnicos', 'Estadísticas', 'Configuración',
  ],
  Administrativo: [
    'Dashboard', 'Agenda', 'Clientes', 'Presupuestos', 'Obras', 'Cobros',
    'Stock', 'Servicios', 'Proveedores', 'Estadísticas',
  ],
  Técnico: ['Agenda', 'Obras', 'Stock'],
};

export const DEFAULT_PAGE_BY_ROLE = {
  Administrador: 'dashboard',
  Administrativo: 'dashboard',
  Técnico: 'agenda',
};

export function canRoleAccess(rol, pageName) {
  const allowed = ROLE_PERMISSIONS[rol];
  if (!allowed) return false;
  return allowed.includes(pageName);
}

export function defaultPageForRole(rol) {
  return DEFAULT_PAGE_BY_ROLE[rol] || 'agenda';
}
