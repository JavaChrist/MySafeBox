import { isOwnDownloadUrl, isSafePath } from './storageGuards.js';

const MAX_TEXT_BYTES = 2 * 1024 * 1024;

export async function readStorageText({ bucket, path, downloadUrl }) {
  if (!bucket || !path || !downloadUrl) {
    return { status: 400, body: { error: 'Demande incomplète' } };
  }
  if (!isSafePath(path) || !isOwnDownloadUrl(downloadUrl, bucket, path)) {
    return { status: 400, body: { error: 'Adresse de fichier invalide' } };
  }

  let media;
  try {
    media = await fetch(downloadUrl, { redirect: 'error' });
  } catch {
    return { status: 502, body: { error: 'Impossible d\'afficher ce fichier' } };
  }
  if (!media.ok) {
    return { status: 502, body: { error: 'Impossible d\'afficher ce fichier' } };
  }

  const declared = Number(media.headers.get('content-length') || 0);
  if (declared > MAX_TEXT_BYTES) {
    return { status: 413, body: { error: 'Ce fichier est trop volumineux pour être affiché ici.' } };
  }

  const bytes = Buffer.from(await media.arrayBuffer());
  if (bytes.length > MAX_TEXT_BYTES) {
    return { status: 413, body: { error: 'Ce fichier est trop volumineux pour être affiché ici.' } };
  }

  const type = (media.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type && !isTextContentType(type)) {
    return { status: 415, body: { error: 'Ce fichier ne peut pas être affiché comme du texte.' } };
  }

  return { status: 200, body: { text: bytes.toString('utf8') } };
}

function isTextContentType(type) {
  return type.startsWith('text/')
    || type === 'application/json'
    || type === 'application/xml'
    || type === 'application/javascript'
    || type === 'application/octet-stream';
}
