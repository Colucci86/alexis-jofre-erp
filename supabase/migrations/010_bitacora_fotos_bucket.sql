-- Migration 010: Bucket para fotos de bitácora (cliente y obra)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'bitacora-fotos',
    'bitacora-fotos',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
    SET public = true,
        file_size_limit = 5242880,
        allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Lectura pública (bucket público)
CREATE POLICY storage_bitacora_fotos_select ON storage.objects FOR SELECT
    USING (bucket_id = 'bitacora-fotos');

-- Cualquier usuario autenticado puede subir fotos de bitácora
CREATE POLICY storage_bitacora_fotos_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'bitacora-fotos');

CREATE POLICY storage_bitacora_fotos_update ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'bitacora-fotos')
    WITH CHECK (bucket_id = 'bitacora-fotos');

-- Solo administradores pueden borrar
CREATE POLICY storage_bitacora_fotos_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'bitacora-fotos' AND public.is_admin());
