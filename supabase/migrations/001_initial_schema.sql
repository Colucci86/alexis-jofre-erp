-- Migration 001: Initial schema
-- Alexis Jofré ERP - Supabase PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USUARIOS / PERFILES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'Técnico'
        CHECK (rol IN ('Administrador', 'Administrativo', 'Técnico')),
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLIENTES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    empresa VARCHAR(150) DEFAULT 'Particular',
    dni VARCHAR(50),
    cuit VARCHAR(50),
    telefono VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(150),
    direccion TEXT,
    localidad VARCHAR(100) DEFAULT 'Mendoza',
    provincia VARCHAR(100) DEFAULT 'Mendoza',
    notas TEXT,
    estado VARCHAR(50) DEFAULT 'Activo',
    fecha_alta DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROVEEDORES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    rubro VARCHAR(100),
    telefono VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(150),
    direccion TEXT,
    cuit VARCHAR(50),
    contacto VARCHAR(150),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TÉCNICOS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tecnicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(50),
    telefono VARCHAR(50),
    email VARCHAR(150),
    especialidad VARCHAR(150),
    estado VARCHAR(50) DEFAULT 'Activo',
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCTOS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    codigo_barras VARCHAR(100),
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(100),
    marca VARCHAR(100),
    descripcion TEXT,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    proveedor_nombre VARCHAR(200),
    costo NUMERIC(12,2) DEFAULT 0,
    precio_venta NUMERIC(12,2) DEFAULT 0,
    stock_actual NUMERIC(10,2) DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo NUMERIC(10,2) DEFAULT 0,
    unidad_medida VARCHAR(50) DEFAULT 'unidades',
    ubicacion VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SERVICIOS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.servicios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(100),
    descripcion TEXT,
    precio_base NUMERIC(12,2) DEFAULT 0,
    unidad VARCHAR(50) DEFAULT 'unidad',
    duracion_estimada VARCHAR(50),
    costo_mano_obra NUMERIC(12,2) DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRESUPUESTOS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.presupuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(50) UNIQUE NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE RESTRICT,
    cliente_nombre VARCHAR(200),
    tipo_trabajo VARCHAR(100) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    validez VARCHAR(100) DEFAULT '15 días hábiles',
    estado VARCHAR(50) DEFAULT 'Pendiente',
    subtotal NUMERIC(12,2) DEFAULT 0,
    desglose_efectivo NUMERIC(12,2) DEFAULT 0,
    desglose_canje NUMERIC(12,2) DEFAULT 0,
    observaciones TEXT,
    obra_creada BOOLEAN DEFAULT false,
    obra_id UUID,
    created_by UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ÍTEMS DE PRESUPUESTO ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.presupuesto_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presupuesto_id UUID NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── OBRAS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.obras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(50) UNIQUE NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE RESTRICT,
    cliente_nombre VARCHAR(200),
    tipo_trabajo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    direccion TEXT,
    telefono VARCHAR(50),
    tecnico_id UUID REFERENCES public.tecnicos(id) ON DELETE SET NULL,
    tecnico_nombre VARCHAR(200),
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    hora VARCHAR(20) DEFAULT '08:30',
    estado VARCHAR(50) DEFAULT 'Pendiente',
    progreso INT DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
    presupuesto_id UUID REFERENCES public.presupuestos(id) ON DELETE SET NULL,
    importe_total NUMERIC(12,2) DEFAULT 0,
    importe_pagado NUMERIC(12,2) DEFAULT 0,
    importe_pendiente NUMERIC(12,2) DEFAULT 0,
    forma_pago VARCHAR(100) DEFAULT 'Efectivo',
    observaciones TEXT,
    created_by UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.presupuestos
    ADD CONSTRAINT presupuestos_obra_id_fkey
    FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE SET NULL;

-- ─── MATERIALES EN OBRAS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.obra_materiales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    nombre VARCHAR(200) NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL CHECK (cantidad > 0),
    costo_unitario NUMERIC(12,2) DEFAULT 0,
    created_by UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COBROS / GASTOS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cobros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Ingreso', 'Egreso')),
    fecha DATE DEFAULT CURRENT_DATE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_nombre VARCHAR(200),
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    proveedor_nombre VARCHAR(200),
    categoria VARCHAR(100),
    concepto VARCHAR(255) NOT NULL,
    obra_id UUID REFERENCES public.obras(id) ON DELETE SET NULL,
    importe NUMERIC(12,2) NOT NULL CHECK (importe > 0),
    forma_pago VARCHAR(100) NOT NULL,
    comprobante_url TEXT,
    comprobante_nombre VARCHAR(255),
    observaciones TEXT,
    created_by UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AGENDA ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agenda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    start TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_nombre VARCHAR(200),
    obra_id UUID REFERENCES public.obras(id) ON DELETE SET NULL,
    tecnico_id UUID REFERENCES public.tecnicos(id) ON DELETE SET NULL,
    tecnico_nombre VARCHAR(200),
    direccion TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BITÁCORA ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bitacora (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entidad_tipo VARCHAR(50) NOT NULL,
    entidad_id UUID NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    foto_url TEXT,
    usuario_id UUID REFERENCES public.usuarios(id),
    usuario_nombre VARCHAR(150),
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUDITORÍA ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id UUID,
    datos_previos JSONB,
    datos_nuevos JSONB,
    usuario_id UUID REFERENCES public.usuarios(id),
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MIGRACIÓN LOCAL (control de importación única) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.migracion_local (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ejecutada_por UUID REFERENCES public.usuarios(id),
    origen VARCHAR(50) DEFAULT 'localStorage',
    resumen JSONB,
    ejecutada_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ÍNDICES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id ON public.usuarios(auth_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente ON public.presupuestos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_presupuesto_items_presupuesto ON public.presupuesto_items(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_obras_cliente ON public.obras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_obras_tecnico ON public.obras(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_obra_materiales_obra ON public.obra_materiales(obra_id);
CREATE INDEX IF NOT EXISTS idx_cobros_fecha ON public.cobros(fecha);
CREATE INDEX IF NOT EXISTS idx_cobros_obra ON public.cobros(obra_id);
CREATE INDEX IF NOT EXISTS idx_agenda_start ON public.agenda(start);
CREATE INDEX IF NOT EXISTS idx_agenda_tecnico ON public.agenda(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_entidad ON public.bitacora(entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidad ON public.audit_log(entidad, entidad_id);
