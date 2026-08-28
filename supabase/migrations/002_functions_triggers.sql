-- Migration 002: Helper functions, triggers, RPC

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'usuarios', 'clientes', 'proveedores', 'tecnicos', 'productos', 'servicios',
        'presupuestos', 'obras', 'agenda'
    ]
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
            CREATE TRIGGER trg_%I_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
        ', t, t, t, t);
    END LOOP;
END $$;

-- ─── AUTH HELPERS (SECURITY DEFINER) ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_usuario_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.usuarios WHERE auth_id = auth.uid() AND activo = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT rol FROM public.usuarios WHERE auth_id = auth.uid() AND activo = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.get_my_rol() = 'Administrador', false);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_administrativo()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.get_my_rol() IN ('Administrador', 'Administrativo'), false);
$$;

CREATE OR REPLACE FUNCTION public.get_my_tecnico_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.tecnicos WHERE usuario_id = public.get_my_usuario_id() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.tecnico_puede_ver_obra(p_obra_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.obras o
        WHERE o.id = p_obra_id
          AND o.tecnico_id = public.get_my_tecnico_id()
    );
$$;

-- ─── AUDIT HELPER ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_auditoria(
    p_accion TEXT,
    p_entidad TEXT,
    p_entidad_id UUID,
    p_datos_previos JSONB DEFAULT NULL,
    p_datos_nuevos JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_log (accion, entidad, entidad_id, datos_previos, datos_nuevos, usuario_id)
    VALUES (p_accion, p_entidad, p_entidad_id, p_datos_previos, p_datos_nuevos, public.get_my_usuario_id());
END;
$$;

-- ─── BITÁCORA HELPER ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_bitacora(
    p_entidad_tipo TEXT,
    p_entidad_id UUID,
    p_tipo TEXT,
    p_descripcion TEXT,
    p_foto_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
    v_nombre TEXT;
BEGIN
    SELECT nombre INTO v_nombre FROM public.usuarios WHERE id = public.get_my_usuario_id();
    INSERT INTO public.bitacora (entidad_tipo, entidad_id, tipo, descripcion, foto_url, usuario_id, usuario_nombre)
    VALUES (p_entidad_tipo, p_entidad_id, p_tipo, p_descripcion, p_foto_url, public.get_my_usuario_id(), v_nombre)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- ─── PROFILE ON SIGNUP (default Técnico, admin must be promoted manually) ────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.usuarios (auth_id, email, nombre, rol)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        'Técnico'
    )
    ON CONFLICT (email) DO UPDATE
        SET auth_id = EXCLUDED.auth_id,
            updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ─── RPC: CONSUMIR MATERIAL EN OBRA (ATÓMICO) ────────────────────────────────
CREATE OR REPLACE FUNCTION public.consumir_material_obra(
    p_obra_id UUID,
    p_producto_id UUID,
    p_cantidad NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stock NUMERIC;
    v_producto RECORD;
    v_material_id UUID;
    v_obra RECORD;
    v_unidad TEXT;
BEGIN
    IF auth.uid() IS NULL OR public.get_my_usuario_id() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sesión inválida o usuario inactivo.');
    END IF;

    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'La cantidad debe ser mayor a cero.');
    END IF;

    IF public.get_my_rol() = 'Técnico' AND NOT public.tecnico_puede_ver_obra(p_obra_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'No tenés permiso para modificar esta obra.');
    END IF;

    IF NOT public.is_admin_or_administrativo() AND public.get_my_rol() <> 'Técnico' THEN
        RETURN jsonb_build_object('success', false, 'error', 'No autorizado.');
    END IF;

    SELECT * INTO v_obra FROM public.obras WHERE id = p_obra_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Obra no encontrada.');
    END IF;

    SELECT * INTO v_producto FROM public.productos WHERE id = p_producto_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Producto no encontrado.');
    END IF;

    v_stock := COALESCE(v_producto.stock_actual, 0);
    v_unidad := COALESCE(v_producto.unidad_medida, 'unidades');

    IF p_cantidad > v_stock THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Stock insuficiente de "%s". Disponible: %s %s.', v_producto.nombre, v_stock, v_unidad)
        );
    END IF;

    UPDATE public.productos
    SET stock_actual = v_stock - p_cantidad
    WHERE id = p_producto_id;

    INSERT INTO public.obra_materiales (obra_id, producto_id, nombre, cantidad, costo_unitario, created_by)
    VALUES (p_obra_id, p_producto_id, v_producto.nombre, p_cantidad, COALESCE(v_producto.costo, 0), public.get_my_usuario_id())
    RETURNING id INTO v_material_id;

    PERFORM public.registrar_bitacora(
        'Obra', p_obra_id, 'Materiales Agregados',
        format('Se agregaron %s %s de "%s". Stock restante: %s.', p_cantidad, v_unidad, v_producto.nombre, v_stock - p_cantidad)
    );

    PERFORM public.registrar_auditoria(
        'CREATE', 'obra_materiales', v_material_id, NULL,
        jsonb_build_object('obra_id', p_obra_id, 'producto_id', p_producto_id, 'cantidad', p_cantidad)
    );

    RETURN jsonb_build_object(
        'success', true,
        'material_id', v_material_id,
        'stock_restante', v_stock - p_cantidad
    );
END;
$$;

-- ─── RPC: REGISTRAR COBRO CON ACTUALIZACIÓN DE OBRA ──────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_cobro(
    p_tipo TEXT,
    p_fecha DATE,
    p_cliente_id UUID,
    p_cliente_nombre TEXT,
    p_proveedor_id UUID,
    p_proveedor_nombre TEXT,
    p_categoria TEXT,
    p_concepto TEXT,
    p_obra_id UUID,
    p_importe NUMERIC,
    p_forma_pago TEXT,
    p_comprobante_url TEXT DEFAULT NULL,
    p_comprobante_nombre TEXT DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cobro_id UUID;
    v_obra RECORD;
    v_total_pagado NUMERIC;
    v_total_pendiente NUMERIC;
BEGIN
    IF auth.uid() IS NULL OR public.get_my_usuario_id() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sesión inválida o usuario inactivo.');
    END IF;

    IF NOT public.is_admin_or_administrativo() THEN
        RETURN jsonb_build_object('success', false, 'error', 'No autorizado para registrar cobros.');
    END IF;

    IF p_importe IS NULL OR p_importe <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'El importe debe ser mayor a cero.');
    END IF;

    IF p_concepto IS NULL OR trim(p_concepto) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'El concepto es obligatorio.');
    END IF;

    INSERT INTO public.cobros (
        tipo, fecha, cliente_id, cliente_nombre, proveedor_id, proveedor_nombre,
        categoria, concepto, obra_id, importe, forma_pago, comprobante_url,
        comprobante_nombre, observaciones, created_by
    ) VALUES (
        p_tipo, p_fecha, p_cliente_id, p_cliente_nombre, p_proveedor_id, p_proveedor_nombre,
        p_categoria, p_concepto, p_obra_id, p_importe, p_forma_pago, p_comprobante_url,
        p_comprobante_nombre, p_observaciones, public.get_my_usuario_id()
    ) RETURNING id INTO v_cobro_id;

    IF p_tipo = 'Ingreso' AND p_obra_id IS NOT NULL THEN
        SELECT * INTO v_obra FROM public.obras WHERE id = p_obra_id FOR UPDATE;
        IF FOUND THEN
            v_total_pagado := COALESCE(v_obra.importe_pagado, 0) + p_importe;
            v_total_pendiente := GREATEST(0, COALESCE(v_obra.importe_total, 0) - v_total_pagado);

            UPDATE public.obras
            SET importe_pagado = v_total_pagado,
                importe_pendiente = v_total_pendiente
            WHERE id = p_obra_id;

            PERFORM public.registrar_bitacora(
                'Obra', p_obra_id, 'Pago',
                format('Registrado cobro de $%s mediante %s.', p_importe, p_forma_pago)
            );

            IF v_obra.cliente_id IS NOT NULL THEN
                PERFORM public.registrar_bitacora(
                    'Cliente', v_obra.cliente_id, 'Pago',
                    format('Cobro de $%s por la Obra #%s.', p_importe, v_obra.numero)
                );
            END IF;
        END IF;
    END IF;

    PERFORM public.registrar_auditoria(
        'CREATE', 'cobros', v_cobro_id, NULL,
        jsonb_build_object('tipo', p_tipo, 'importe', p_importe, 'obra_id', p_obra_id)
    );

    RETURN jsonb_build_object('success', true, 'cobro_id', v_cobro_id);
END;
$$;

-- ─── RPC: CONVERTIR PRESUPUESTO A OBRA ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.convertir_presupuesto_a_obra(p_presupuesto_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pres RECORD;
    v_cliente RECORD;
    v_obra_id UUID;
    v_numero TEXT;
    v_count INT;
BEGIN
    IF auth.uid() IS NULL OR public.get_my_usuario_id() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sesión inválida o usuario inactivo.');
    END IF;

    IF NOT public.is_admin_or_administrativo() THEN
        RETURN jsonb_build_object('success', false, 'error', 'No autorizado.');
    END IF;

    SELECT * INTO v_pres FROM public.presupuestos WHERE id = p_presupuesto_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Presupuesto no encontrado.');
    END IF;

    IF v_pres.obra_creada THEN
        RETURN jsonb_build_object('success', false, 'error', 'Este presupuesto ya tiene una obra asociada.');
    END IF;

    SELECT * INTO v_cliente FROM public.clientes WHERE id = v_pres.cliente_id;

    SELECT COUNT(*) + 1 INTO v_count FROM public.obras;
    v_numero := lpad(v_count::text, 4, '0');

    INSERT INTO public.obras (
        numero, cliente_id, cliente_nombre, tipo_trabajo, descripcion, direccion, telefono,
        estado, progreso, presupuesto_id, importe_total, importe_pagado, importe_pendiente,
        forma_pago, observaciones, created_by
    ) VALUES (
        v_numero, v_pres.cliente_id, v_pres.cliente_nombre, v_pres.tipo_trabajo,
        format('Obra iniciada desde Presupuesto #%s', v_pres.numero),
        v_cliente.direccion, v_cliente.telefono,
        'Pendiente', 0, p_presupuesto_id, COALESCE(v_pres.subtotal, 0), 0, COALESCE(v_pres.subtotal, 0),
        CASE WHEN COALESCE(v_pres.desglose_canje, 0) > 0 THEN 'Efectivo + Canje' ELSE 'Efectivo' END,
        v_pres.observaciones, public.get_my_usuario_id()
    ) RETURNING id INTO v_obra_id;

    UPDATE public.presupuestos
    SET estado = 'Aceptado', obra_creada = true, obra_id = v_obra_id
    WHERE id = p_presupuesto_id;

    PERFORM public.registrar_bitacora(
        'Obra', v_obra_id, 'Creación',
        format('Obra creada desde Presupuesto #%s.', v_pres.numero)
    );

    IF v_pres.cliente_id IS NOT NULL THEN
        PERFORM public.registrar_bitacora(
            'Cliente', v_pres.cliente_id, 'Cambio de estado de obra',
            format('Presupuesto #%s aceptado. Se creó la Obra #%s.', v_pres.numero, v_numero)
        );
    END IF;

    PERFORM public.registrar_auditoria(
        'CREATE', 'obras', v_obra_id, NULL,
        jsonb_build_object('presupuesto_id', p_presupuesto_id, 'numero', v_numero)
    );

    RETURN jsonb_build_object('success', true, 'obra_id', v_obra_id, 'numero', v_numero);
END;
$$;

GRANT EXECUTE ON FUNCTION public.consumir_material_obra TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_cobro TO authenticated;
GRANT EXECUTE ON FUNCTION public.convertir_presupuesto_a_obra TO authenticated;
