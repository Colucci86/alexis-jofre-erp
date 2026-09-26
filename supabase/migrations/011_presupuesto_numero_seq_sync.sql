-- Migration 011: Sincroniza la secuencia de numeros de presupuesto con el maximo existente.
-- Sin esto, un INSERT sin 'numero' (p.ej. desde SQL o un cliente que no lo envie)
-- puede chocar con la restriccion UNIQUE porque la secuencia quedo atrasada.

DO $$
DECLARE
    v_max INTEGER;
BEGIN
    SELECT COALESCE(MAX(NULLIF(REGEXP_REPLACE(numero, '\D', '', 'g'), '')::INTEGER), 0)
      INTO v_max
      FROM public.presupuestos;

    PERFORM setval('public.presupuestos_numero_seq', GREATEST(v_max, 1), true);
END $$;
