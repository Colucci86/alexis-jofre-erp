-- Migration 007: eliminación lógica de obras
-- La obra eliminada queda fuera de la gestión activa, pero se conservan
-- cobros, materiales y bitácora para el historial.

ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS eliminada BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_obras_eliminada ON public.obras(eliminada);