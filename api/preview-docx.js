import { readStorageDocx } from '../server/readStorageDocx.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode refusée' });
    return;
  }

  const result = await readStorageDocx(req.body || {});
  if (result.binary) {
    res.status(result.status);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.send(result.binary);
    return;
  }
  res.status(result.status).json(result.body);
}
