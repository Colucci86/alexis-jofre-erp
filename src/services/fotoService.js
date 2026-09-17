import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET = 'bitacora-fotos';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function extensionFor(file) {
  const fromName = file.name && file.name.includes('.')
    ? file.name.split('.').pop().toLowerCase()
    : '';
  return fromName || EXT_BY_TYPE[file.type] || 'jpg';
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Sube una imagen de bitácora y devuelve la URL pública para guardar en foto_url.
 * Si Supabase no está configurado (modo local/demo), devuelve un data URL.
 */
export async function subirFotoBitacora(file, { entidadTipo, entidadId } = {}) {
  if (!file) throw new Error('No se seleccionó ninguna imagen.');
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Formato no permitido. Usá JPG, PNG, WEBP o GIF.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('La imagen supera el límite de 5 MB.');
  }

  if (!isSupabaseConfigured || !supabase) {
    return readAsDataUrl(file);
  }

  const carpeta = (entidadTipo || 'general').toLowerCase();
  const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(file)}`;
  const path = `${carpeta}/${entidadId || 'sin-id'}/${nombre}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message || 'No se pudo subir la imagen.');

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
