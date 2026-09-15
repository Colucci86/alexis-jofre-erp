-- Migration 009: auto-assign numero to presupuestos on INSERT when missing

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        WHERE c.relname = 'presupuestos_numero_seq'
          AND c.relnamespace = 'public'::regnamespace
    ) THEN
        CREATE SEQUENCE public.presupuestos_numero_seq START 1;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.auto_presupuesto_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.numero IS NULL OR trim(NEW.numero) = '' THEN
        NEW.numero := lpad(nextval('public.presupuestos_numero_seq')::text, 5, '0');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_presupuesto_auto_numero ON public.presupuestos;
CREATE TRIGGER trg_presupuesto_auto_numero
    BEFORE INSERT ON public.presupuestos
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_presupuesto_numero();

DO $$
BEGIN
    PERFORM setval('public.presupuestos_numero_seq',
        COALESCE((SELECT MAX(numero::int) FROM public.presupuestos), 0) + 1,
        false);
END $$;

GRANT USAGE ON SEQUENCE public.presupuestos_numero_seq TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.auto_presupuesto_numero() TO authenticated, anon;