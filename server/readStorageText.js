import { fetchStorageFile } from './fetchStorageFile.js';

const MAX_TEXT_BYTES = 2 * 1024 * 1024;

export async function readStorageText(input) {
  const file = await fetchStorageFile(
    input,
    MAX_TEXT_BYTES,
    'Ce fichier est trop volumineux pour être affiché ici.'
  );
  if (file.error) return file.error;

  if (file.type && !isTextContentType(file.type)) {
    return { status: 415, body: { error: 'Ce fichier ne peut pas être affiché comme du texte.' } };
  }

  return { status: 200, body: { text: file.bytes.toString('utf8') } };
}

function isTextContentType(type) {
  return type.startsWith('text/')
    || type === 'application/json'
    || type === 'application/xml'
    || type === 'application/javascript'
    || type === 'application/octet-stream';
}
