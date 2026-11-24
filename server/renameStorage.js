const MAX_BYTES = 100 * 1024 * 1024;

export async function renameStorageObject({ token, bucket, from, to, downloadUrl, contentType, customMetadata }) {
  if (!token || !bucket || !from || !to || !downloadUrl) {
    return { status: 400, body: { error: 'Demande incomplète' } };
  }
  if (!isSafePath(from) || !isSafePath(to)) {
    return { status: 400, body: { error: 'Chemin invalide' } };
  }
  if (!isOwnDownloadUrl(downloadUrl, bucket, from)) {
    return { status: 400, body: { error: 'Adresse de fichier invalide' } };
  }

  let media;
  try {
    media = await fetch(downloadUrl, { redirect: 'error' });
  } catch {
    return { status: 502, body: { error: 'Impossible de lire le fichier à renommer' } };
  }
  if (!media.ok) {
    return { status: 502, body: { error: 'Impossible de lire le fichier à renommer' } };
  }

  const declared = Number(media.headers.get('content-length') || 0);
  if (declared > MAX_BYTES) {
    return { status: 413, body: { error: 'Ce fichier est trop volumineux pour être renommé' } };
  }

  const bytes = Buffer.from(await media.arrayBuffer());
  if (bytes.length > MAX_BYTES) {
    return { status: 413, body: { error: 'Ce fichier est trop volumineux pour être renommé' } };
  }

  const safeType = sanitizeContentType(contentType || media.headers.get('content-type'));
  const metadata = { name: to, contentType: safeType };
  const custom = sanitizeCustomMetadata(customMetadata);
  if (custom) {
    metadata.metadata = custom;
  }

  const boundary = `mysafebox${Date.now()}`;
  const head = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${safeType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([head, bytes, tail]);
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?name=${encodeURIComponent(to)}`;

  const upload = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Firebase ${token}`,
      'X-Goog-Upload-Protocol': 'multipart',
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  });

  if (!upload.ok) {
    const detail = await readPublicDetail(upload);
    return { status: upload.status, body: { error: 'Impossible de renommer cet élément', detail } };
  }

  return { status: 200, body: { done: true } };
}

function isSafePath(path) {
  return typeof path === 'string'
    && path.startsWith('users/')
    && !path.includes('..')
    && !path.includes('\\')
    && !path.endsWith('/');
}

function isOwnDownloadUrl(value, bucket, objectPath) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'firebasestorage.googleapis.com') {
    return false;
  }
  if (url.searchParams.get('alt') !== 'media' || !url.searchParams.get('token')) {
    return false;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return false;
  }
  return pathname === `/v0/b/${bucket}/o/${objectPath}`;
}

function sanitizeContentType(value) {
  if (typeof value !== 'string') return 'application/octet-stream';
  const clean = value.split(';')[0].trim().toLowerCase();
  if (!/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(clean)) {
    return 'application/octet-stream';
  }
  return clean;
}

function sanitizeCustomMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (!/^[\w-]{1,64}$/.test(key) || typeof item !== 'string' || item.length > 500) continue;
    result[key] = item;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

async function readPublicDetail(response) {
  try {
    const parsed = await response.json();
    const message = parsed?.error?.message;
    if (typeof message !== 'string') return '';
    return message.replace(/[A-Za-z0-9_-]{24,}/g, '').slice(0, 180);
  } catch {
    return '';
  }
}
