-- 012: Plano eléctrico de la obra (PDF del arquitecto + puntos/tomas para seguimiento)
-- En el SQL Editor de Supabase ejecutar DESPUÉS de 011.

-- =====================================================================
-- Tablas
-- =====================================================================

-- Un plano por obra (se reemplaza subiendo otro PDF).
CREATE TABLE IF NOT EXISTS public.obra_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL UNIQUE REFERENCES public.obras(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  archivo_path TEXT NOT NULL,
  archivo_url TEXT,
  tamano_bytes BIGINT,
  paginas INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Puntos del plano (tomas, luminarias, interruptores, tableros...).
-- x/y van normalizados 0..1 respecto de la página del PDF, así el punto
-- queda en el mismo lugar aunque se vea en otro tamaño de pantalla.
CREATE TABLE IF NOT EXISTS public.obra_plano_puntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL REFERENCES public.obra_planos(id) ON DELETE CASCADE,
  pagina SMALLINT NOT NULL DEFAULT 1 CHECK (pagina >= 1),
  etiqueta TEXT NOT NULL DEFAULT 'Punto',
  tipo VARCHAR(30) NOT NULL DEFAULT 'Toma',
  x NUMERIC(7,5) NOT NULL CHECK (x >= 0 AND x <= 1),
  y NUMERIC(7,5) NOT NULL CHECK (y >= 0 AND y <= 1),
  color VARCHAR(9) NOT NULL DEFAULT '#9CA3AF',
  hecho BOOLEAN NOT NULL DEFAULT false,
  nota TEXT,
  marcado_por TEXT,
  marcado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_plano_puntos_plano ON public.obra_plano_puntos(plano_id);
CREATE INDEX IF NOT EXISTS idx_obra_plano_puntos_hecho ON public.obra_plano_puntos(plano_id, hecho);

-- Historial de cambios del plano (quién marcó qué y cuándo).
CREATE TABLE IF NOT EXISTS public.obra_plano_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL REFERENCES public.obra_planos(id) ON DELETE CASCADE,
  punto_id UUID REFERENCES public.obra_plano_puntos(id) ON DELETE SET NULL,
  accion VARCHAR(30) NOT NULL,
  detalle TEXT,
  usuario_nombre TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obra_plano_eventos_plano ON public.obra_plano_eventos(plano_id, created_at DESC);

-- =====================================================================
-- Triggers de updated_at (mismo helper que 002)
-- =====================================================================

DROP TRIGGER IF EXISTS trg_obra_planos_updated_at ON public.obra_planos;
CREATE TRIGGER trg_obra_planos_updated_at
  BEFORE UPDATE ON public.obra_planos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_obra_plano_puntos_updated_at ON public.obra_plano_puntos;
CREATE TRIGGER trg_obra_plano_puntos_updated_at
  BEFORE UPDATE ON public.obra_plano_puntos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- Storage: bucket público para los PDF del plano
-- =====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'obra-planos',
    'obra-planos',
    true,
    26214400,
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
    SET public = true,
        file_size_limit = 26214400,
        allowed_mime_types = ARRAY['application/pdf'];

-- Lectura pública (bucket público)
DROP POLICY IF EXISTS storage_obra_planos_select ON storage.objects;
CREATE POLICY storage_obra_planos_select ON storage.objects FOR SELECT
    USING (bucket_id = 'obra-planos');

DROP POLICY IF EXISTS storage_obra_planos_insert ON storage.objects;
CREATE POLICY storage_obra_planos_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'obra-planos');

DROP POLICY IF EXISTS storage_obra_planos_update ON storage.objects;
CREATE POLICY storage_obra_planos_update ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'obra-planos')
    WITH CHECK (bucket_id = 'obra-planos');

-- Solo administradores pueden borrar el archivo
DROP POLICY IF EXISTS storage_obra_planos_delete ON storage.objects;
CREATE POLICY storage_obra_planos_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'obra-planos' AND public.is_admin());


-- =====================================================================
-- RLS
-- =====================================================================

ALTER TABLE public.obra_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_plano_puntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_plano_eventos ENABLE ROW LEVEL SECURITY;

-- ─── OBRAS PLANOS ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS obra_planos_select ON public.obra_planos;
CREATE POLICY obra_planos_select ON public.obra_planos FOR SELECT TO authenticated
    USING (
        public.is_admin_or_administrativo()
        OR public.tecnico_puede_ver_obra(obra_id)
    );

DROP POLICY IF EXISTS obra_planos_insert ON public.obra_planos;
CREATE POLICY obra_planos_insert ON public.obra_planos FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin_or_administrativo()
        OR public.tecnico_puede_ver_obra(obra_id)
    );

DROP POLICY IF EXISTS obra_planos_update ON public.obra_planos;
CREATE POLICY obra_planos_update ON public.obra_planos FOR UPDATE TO authenticated
    USING (
        public.is_admin_or_administrativo()
        OR public.tecnico_puede_ver_obra(obra_id)
    )
    WITH CHECK (
        public.is_admin_or_administrativo()
        OR public.tecnico_puede_ver_obra(obra_id)
    );

DROP POLICY IF EXISTS obra_planos_delete ON public.obra_planos;
CREATE POLICY obra_planos_delete ON public.obra_planos FOR DELETE TO authenticated
    USING (public.is_admin_or_administrativo());

-- ─── OBRAS PLANO PUNTOS ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS obra_plano_puntos_select ON public.obra_plano_puntos;
CREATE POLICY obra_plano_puntos_select ON public.obra_plano_puntos FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.obra_planos p
            WHERE p.id = obra_plano_puntos.plano_id
              AND (
                  public.is_admin_or_administrativo()
                  OR public.tecnico_puede_ver_obra(p.obra_id)
              )
        )
    );

DROP POLICY IF EXISTS obra_plano_puntos_insert ON public.obra_plano_puntos;
CREATE POLICY obra_plano_puntos_insert ON public.obra_plano_puntos FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.obra_planos p
            WHERE p.id = obra_plano_puntos.plano_id
              AND (
                  public.is_admin_or_administrativo()
                  OR public.tecnico_puede_ver_obra(p.obra_id)
              )
        )
    );

DROP POLICY IF EXISTS obra_plano_puntos_update ON public.obra_plano_puntos;
CREATE POLICY obra_plano_puntos_update ON public.obra_plano_puntos FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.obra_planos p
            WHERE p.id = obra_plano_puntos.plano_id
              AND (
                  public.is_admin_or_administrativo()
                  OR public.tecnico_puede_ver_obra(p.obra_id)
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.obra_planos p
            WHERE p.id = obra_plano_puntos.plano_id
              AND (
                  public.is_admin_or_administrativo()
                  OR public.tecnico_puede_ver_obra(p.obra_id)
              )
        )
    );

DROP POLICY IF EXISTS obra_plano_puntos_delete ON public.obra_plano_puntos;
CREATE POLICY obra_plano_puntos_delete ON public.obra_plano_puntos FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.obra_planos p
            WHERE p.id = obra_plano_puntos.plano_id
              AND (
                  public.is_admin_or_administrativo()
                  OR public.tecnico_puede_ver_obra(p.obra_id)
              )
        )
    );

-- ─── OBRAS PLANO EVENTOS ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS obra_plano_eventos_select ON public.obra_plano_eventos;
CREATE POLICY obra_plano_eventos_select ON public.obra_plano_eventos FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.obra_planos p
            WHERE p.id = obra_plano_eventos.plano_id
              AND (
                  public.is_admin_or_administrativo()
                  OR public.tecnico_puede_ver_obra(p.obra_id)
              )
        )
    );

DROP POLICY IF EXISTS obra_plano_eventos_insert ON public.obra_plano_eventos;
CREATE POLICY obra_plano_eventos_insert ON public.obra_plano_eventos FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.obra_planos p
            WHERE p.id = obra_plano_eventos.plano_id
              AND (
                  public.is_admin_or_administrativo()
                  OR public.tecnico_puede_ver_obra(p.obra_id)
              )
        )
    );

