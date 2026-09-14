-- Migration 006: tipo de técnico (Técnico / Administrativo)
-- Permite registrar personal administrativo además del equipo de campo.

ALTER TABLE public.tecnicos ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'Técnico';

UPDATE public.tecnicos
SET tipo = COALESCE(NULLIF(tipo, ''), 'Técnico')
WHERE tipo IS NULL OR tipo = '';