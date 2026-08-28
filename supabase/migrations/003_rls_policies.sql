-- Migration 003: Row Level Security policies

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuesto_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migracion_local ENABLE ROW LEVEL SECURITY;

-- ─── USUARIOS ────────────────────────────────────────────────────────────────
CREATE POLICY usuarios_select ON public.usuarios FOR SELECT TO authenticated
    USING (public.is_admin() OR auth_id = auth.uid());

CREATE POLICY usuarios_insert ON public.usuarios FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY usuarios_update ON public.usuarios FOR UPDATE TO authenticated
    USING (public.is_admin() OR auth_id = auth.uid())
    WITH CHECK (public.is_admin() OR (auth_id = auth.uid() AND rol = (SELECT rol FROM public.usuarios u WHERE u.auth_id = auth.uid())));

CREATE POLICY usuarios_delete ON public.usuarios FOR DELETE TO authenticated
    USING (public.is_admin());

-- ─── CLIENTES ────────────────────────────────────────────────────────────────
CREATE POLICY clientes_select ON public.clientes FOR SELECT TO authenticated
    USING (
        public.is_admin_or_administrativo()
        OR EXISTS (
            SELECT 1 FROM public.obras o
            WHERE o.cliente_id = clientes.id
              AND o.tecnico_id = public.get_my_tecnico_id()
        )
    );

CREATE POLICY clientes_insert ON public.clientes FOR INSERT TO authenticated
    WITH CHECK (public.is_admin_or_administrativo());

CREATE POLICY clientes_update ON public.clientes FOR UPDATE TO authenticated
    USING (public.is_admin_or_administrativo())
    WITH CHECK (public.is_admin_or_administrativo());

CREATE POLICY clientes_delete ON public.clientes FOR DELETE TO authenticated
    USING (public.is_admin());

-- ─── PROVEEDORES ─────────────────────────────────────────────────────────────
CREATE POLICY proveedores_select ON public.proveedores FOR SELECT TO authenticated
    USING (public.is_admin_or_administrativo());

CREATE POLICY proveedores_insert ON public.proveedores FOR INSERT TO authenticated
    WITH CHECK (public.is_admin_or_administrativo());

CREATE POLICY proveedores_update ON public.proveedores FOR UPDATE TO authenticated
    USING (public.is_admin_or_administrativo())
    WITH CHECK (public.is_admin_or_administrativo());

CREATE POLICY proveedores_delete ON public.proveedores FOR DELETE TO authenticated
    USING (public.is_admin());

-- ─── TÉCNICOS ─────────────────────────────────────────────────────────────────
CREATE POLICY tecnicos_select ON public.tecnicos FOR SELECT TO authenticated
    USING (
        public.is_admin_or_administrativo()
        OR usuario_id = public.get_my_usuario_id()
    );

CREATE POLICY tecnicos_insert ON public.tecnicos FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY tecnicos_update ON public.tecnicos FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY tecnicos_delete ON public.tecnicos FOR DELETE TO authenticated
    USING (public.is_admin());

-- ─── PRODUCTOS ───────────────────────────────────────────────────────────────
CREATE POLICY productos_select ON public.productos FOR SELECT TO authenticated
    USING (public.get_my_usuario_id() IS NOT NULL);

CREATE POLICY productos_insert ON public.productos FOR INSERT TO authenticated
    WITH CHECK (public.is_admin_or_administrativo());

CREATE POLICY productos_update ON public.productos FOR UPDATE TO authenticated
    USING (public.is_admin_or_administrativo())
    WITH CHECK (public.is_admin_or_administrativo());

CREATE POLICY productos_delete ON public.productos FOR DELETE TO authenticated
    USING (public.is_admin_or_administrativo());

-- ─── SERVICIOS ─────────────────────────────────────────────────────────────────
CREATE POLICY servicios_select ON public.servicios FOR SELECT TO authenticated
    USING (public.is_admin_or_administrativo());

CREATE POLICY servicios_insert ON public.servicios FOR INSERT TO authenticated
    WITH CHECK (public.is_admin_or_administrativo());

CREATE POLICY servicios_update ON public.servicios FOR UPDATE TO authenticated
    USING (public.is_admin_or_administrativo())
    WITH CHECK (public.is_admin_or_administrativo());

CREATE POLICY servicios_delete ON public.servicios FOR DELETE TO authenticated
    USING (public.is_admin_or_administrativo());

-- ─── PRESUPUESTOS ──────────────────────────────────────────────────────────────
CREATE POLICY presupuestos_select ON public.presupuestos FOR SELECT TO authenticated
    USING (public.is_admin_or_administrativo());

CREATE POLICY presupuestos_write ON public.presupuestos FOR ALL TO authenticated
    USING (public.is_admin_or_administrativo())
    WITH CHECK (public.is_admin_or_administrativo());

-- ─── PRESUPUESTO ITEMS ─────────────────────────────────────────────────────────
CREATE POLICY presupuesto_items_select ON public.presupuesto_items FOR SELECT TO authenticated
    USING (public.is_admin_or_administrativo());

CREATE POLICY presupuesto_items_write ON public.presupuesto_items FOR ALL TO authenticated
    USING (public.is_admin_or_administrativo())
    WITH CHECK (public.is_admin_or_administrativo());

-- ─── OBRAS ─────────────────────────────────────────────────────────────────────
CREATE POLICY obras_select ON public.obras FOR SELECT TO authenticated
    USING (
        public.is_admin_or_administrativo()
        OR tecnico_id = public.get_my_tecnico_id()
    );

CREATE POLICY obras_insert ON public.obras FOR INSERT TO authenticated
    WITH CHECK (public.is_admin_or_administrativo());

CREATE POLICY obras_update ON public.obras FOR UPDATE TO authenticated
    USING (
        public.is_admin_or_administrativo()
        OR tecnico_id = public.get_my_tecnico_id()
    )
    WITH CHECK (
        public.is_admin_or_administrativo()
        OR tecnico_id = public.get_my_tecnico_id()
    );

CREATE POLICY obras_delete ON public.obras FOR DELETE TO authenticated
    USING (public.is_admin());

-- ─── OBRA MATERIALES ───────────────────────────────────────────────────────────
CREATE POLICY obra_materiales_select ON public.obra_materiales FOR SELECT TO authenticated
    USING (
        public.is_admin_or_administrativo()
        OR public.tecnico_puede_ver_obra(obra_id)
    );

CREATE POLICY obra_materiales_insert ON public.obra_materiales FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin_or_administrativo()
        OR public.tecnico_puede_ver_obra(obra_id)
    );

CREATE POLICY obra_materiales_delete ON public.obra_materiales FOR DELETE TO authenticated
    USING (public.is_admin());

-- ─── COBROS ────────────────────────────────────────────────────────────────────
CREATE POLICY cobros_select ON public.cobros FOR SELECT TO authenticated
    USING (public.is_admin_or_administrativo());

CREATE POLICY cobros_write ON public.cobros FOR ALL TO authenticated
    USING (public.is_admin_or_administrativo())
    WITH CHECK (public.is_admin_or_administrativo());

-- ─── AGENDA ────────────────────────────────────────────────────────────────────
CREATE POLICY agenda_select ON public.agenda FOR SELECT TO authenticated
    USING (
        public.is_admin_or_administrativo()
        OR tecnico_id = public.get_my_tecnico_id()
    );

CREATE POLICY agenda_insert ON public.agenda FOR INSERT TO authenticated
    WITH CHECK (public.is_admin_or_administrativo());

CREATE POLICY agenda_update ON public.agenda FOR UPDATE TO authenticated
    USING (
        public.is_admin_or_administrativo()
        OR tecnico_id = public.get_my_tecnico_id()
    )
    WITH CHECK (
        public.is_admin_or_administrativo()
        OR tecnico_id = public.get_my_tecnico_id()
    );

CREATE POLICY agenda_delete ON public.agenda FOR DELETE TO authenticated
    USING (public.is_admin_or_administrativo());

-- ─── BITÁCORA ──────────────────────────────────────────────────────────────────
CREATE POLICY bitacora_select ON public.bitacora FOR SELECT TO authenticated
    USING (
        public.is_admin_or_administrativo()
        OR (
            entidad_tipo = 'Obra'
            AND public.tecnico_puede_ver_obra(entidad_id)
        )
    );

CREATE POLICY bitacora_insert ON public.bitacora FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin_or_administrativo()
        OR (
            entidad_tipo = 'Obra'
            AND public.tecnico_puede_ver_obra(entidad_id)
        )
        OR (
            entidad_tipo = 'Cliente'
            AND EXISTS (
                SELECT 1 FROM public.obras o
                WHERE o.cliente_id = entidad_id
                  AND o.tecnico_id = public.get_my_tecnico_id()
            )
        )
    );

-- ─── AUDIT LOG ─────────────────────────────────────────────────────────────────
CREATE POLICY audit_log_select ON public.audit_log FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY audit_log_insert ON public.audit_log FOR INSERT TO authenticated
    WITH CHECK (public.get_my_usuario_id() IS NOT NULL);

-- ─── MIGRACIÓN LOCAL ───────────────────────────────────────────────────────────
CREATE POLICY migracion_local_select ON public.migracion_local FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY migracion_local_insert ON public.migracion_local FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
