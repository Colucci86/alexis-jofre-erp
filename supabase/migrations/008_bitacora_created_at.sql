-- Migration 008: bitácora — separar created_at de la fecha del evento
-- Hasta ahora bitacora.fecha era el único registro temporal. Ahora se
-- conserva el momento de creación real para no perderlo al corregir
-- la fecha/hora del evento en la UI.

ALTER TABLE public.bitacora ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Relleno retroactivo: las filas existentes conservan su fecha original.
UPDATE public.bitacora
SET created_at = COALESCE(created_at, fecha)
WHERE created_at IS NULL;