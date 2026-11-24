import { isOwnDownloadUrl, isSafePath } from './storageGuards.js';

export async function fetchStorageFile({ bucket, path, downloadUrl }, maxBytes, tooLargeMessage) {
  if (!bucket || !path || !downloadUrl) {
    return { error: { status: 400, body: { error: 'Demande incomplète' } } };
  }
  if (!isSafePath(path) || !isOwnDownloadUrl(downloadUrl, bucket, path)) {
    return { error: { status: 400, body: { error: 'Adresse de fichier invalide' } } };
  }

  let media;
  try {
    media = await fetch(downloadUrl, { redirect: 'error' });
  } catch {
    return { error: { status: 502, body: { error: 'Impossible d\'afficher ce fichier' } } };
  }
  if (!media.ok) {
    return { error: { status: 502, body: { error: 'Impossible d\'afficher ce fichier' } } };
  }

  const declared = Number(media.headers.get('content-length') || 0);
  if (declared > maxBytes) {
    return { error: { status: 413, body: { error: tooLargeMessage } } };
  }

  const bytes = Buffer.from(await media.arrayBuffer());
  if (bytes.length > maxBytes) {
    return { error: { status: 413, body: { error: tooLargeMessage } } };
  }

  const type = (media.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  return { bytes, type };
}
