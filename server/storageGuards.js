export function isSafePath(path) {
  return typeof path === 'string'
    && path.startsWith('users/')
    && !path.includes('..')
    && !path.includes('\\')
    && !path.endsWith('/');
}

export function isOwnDownloadUrl(value, bucket, objectPath) {
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
