-- Migration 005: empresa config, grants, and técnico update restrictions

-- ─── CONFIGURACIÓN DE EMPRESA (una sola fila) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.configuracion (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    empresa TEXT,
    titular TEXT,
    telefono TEXT,
    email TEXT,
    ciudad TEXT,
    cuit TEXT,
    validez_presupuesto INT DEFAULT 15,
    condiciones_defecto TEXT,
    categorias_gastos JSONB DEFAULT '[]'::jsonb,
    categorias_ingresos JSONB DEFAULT '[]'::jsonb,
    formas_pago JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.configuracion (
    id, empresa, titular, telefono, email, ciudad, cuit,
    validez_presupuesto, condiciones_defecto, categorias_gastos, categorias_ingresos, formas_pago
) VALUES (
    1,
    'Alexis Jofré - Mantenimiento Integral',
    'Alexis Jofré',
    '0261152414101',
    'alexisjofre1995@gmail.com',
    'Ciudad de Mendoza, Mendoza',
    '20-38491029-9',
    15,
    'Presupuesto de acuerdo con render recibido, valido por 15 dias habiles. No incluye materiales.',
    '["Materiales","Herramientas","Combustible","Sueldos / Técnicos","Gastos Administrativos","Otros"]'::jsonb,
    '["Obras Mantenimiento","Presupuestos Aprobados","Anticipos de Obra","Venta de Productos","Otros"]'::jsonb,
    '["Efectivo","Canje","Transferencia","Tarjeta","Mercado Pago","Cuenta Corriente"]'::jsonb
) ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS trg_configuracion_updated_at ON public.configuracion;
CREATE TRIGGER trg_configuracion_updated_at
    BEFORE UPDATE ON public.configuracion
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS configuracion_select ON public.configuracion;
CREATE POLICY configuracion_select ON public.configuracion FOR SELECT TO authenticated
    USING (public.get_my_usuario_id() IS NOT NULL);

DROP POLICY IF EXISTS configuracion_update ON public.configuracion;
CREATE POLICY configuracion_update ON public.configuracion FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ─── RESTRINGIR UPDATES FINANCIEROS DEL TÉCNICO EN OBRAS ─────────────────────
CREATE OR REPLACE FUNCTION public.restrict_obra_tecnico_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF public.get_my_rol() = 'Técnico' THEN
        IF NEW.importe_total IS DISTINCT FROM OLD.importe_total
           OR NEW.importe_pagado IS DISTINCT FROM OLD.importe_pagado
           OR NEW.importe_pendiente IS DISTINCT FROM OLD.importe_pendiente
           OR NEW.tecnico_id IS DISTINCT FROM OLD.tecnico_id
           OR NEW.cliente_id IS DISTINCT FROM OLD.cliente_id
           OR NEW.presupuesto_id IS DISTINCT FROM OLD.presupuesto_id
           OR NEW.numero IS DISTINCT FROM OLD.numero
        THEN
            RAISE EXCEPTION 'El técnico no puede modificar datos financieros, numeración o asignación de la obra.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_obra_tecnico_update ON public.obras;
CREATE TRIGGER trg_restrict_obra_tecnico_update
    BEFORE UPDATE ON public.obras
    FOR EACH ROW EXECUTE FUNCTION public.restrict_obra_tecnico_update();

-- ─── AUTH MUST EXIST FOR DEFINER RPCs ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.require_authenticated()
RETURNS VOID
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sesión requerida.';
    END IF;
    IF public.get_my_usuario_id() IS NULL THEN
        RAISE EXCEPTION 'Usuario inactivo o sin perfil.';
    END IF;
END;
$$;

-- ─── GRANTS ──────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_usuario_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_rol() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_administrativo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tecnico_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.tecnico_puede_ver_obra(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_auditoria(TEXT, TEXT, UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_bitacora(TEXT, UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_material_obra(UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_cobro(TEXT, DATE, UUID, TEXT, UUID, TEXT, TEXT, TEXT, UUID, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convertir_presupuesto_a_obra(UUID) TO authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
