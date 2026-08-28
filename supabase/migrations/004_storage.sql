-- Migration 004: Storage buckets and policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('obra-fotos', 'obra-fotos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('comprobantes', 'comprobantes', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    ('documentos', 'documentos', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Obra fotos: authenticated users with obra access
CREATE POLICY storage_obra_fotos_select ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'obra-fotos'
        AND (
            public.is_admin_or_administrativo()
            OR public.tecnico_puede_ver_obra((storage.foldername(name))[1]::uuid)
        )
    );

CREATE POLICY storage_obra_fotos_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'obra-fotos'
        AND (
            public.is_admin_or_administrativo()
            OR public.tecnico_puede_ver_obra((storage.foldername(name))[1]::uuid)
        )
    );

CREATE POLICY storage_obra_fotos_delete ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'obra-fotos'
        AND public.is_admin_or_administrativo()
    );

-- Comprobantes: admin and administrativo only
CREATE POLICY storage_comprobantes_select ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'comprobantes' AND public.is_admin_or_administrativo());

CREATE POLICY storage_comprobantes_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'comprobantes' AND public.is_admin_or_administrativo());

CREATE POLICY storage_comprobantes_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'comprobantes' AND public.is_admin());

-- Documentos generales
CREATE POLICY storage_documentos_select ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'documentos' AND public.is_admin_or_administrativo());

CREATE POLICY storage_documentos_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documentos' AND public.is_admin_or_administrativo());

CREATE POLICY storage_documentos_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'documentos' AND public.is_admin());
