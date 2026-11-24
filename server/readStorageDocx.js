import { fetchStorageFile } from './fetchStorageFile.js';

// Les fonctions Vercel refusent les réponses de plus de 4,5 Mo.
export const MAX_DOCX_BYTES = 4 * 1024 * 1024;

export async function readStorageDocx(input) {
  const file = await fetchStorageFile(
    input,
    MAX_DOCX_BYTES,
    'Ce document est trop volumineux pour l’aperçu (4 Mo maximum).'
  );
  if (file.error) return file.error;

  // Un .docx est une archive ZIP : elle commence par « PK ».
  if (file.bytes.length < 4 || file.bytes[0] !== 0x50 || file.bytes[1] !== 0x4b) {
    return { status: 415, body: { error: 'Ce document Word ne peut pas être lu.' } };
  }

  return {
    status: 200,
    binary: file.bytes,
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
}
