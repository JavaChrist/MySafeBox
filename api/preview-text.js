import { readStorageText } from '../server/readStorageText.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode refusée' });
    return;
  }

  const result = await readStorageText(req.body || {});
  res.status(result.status).json(result.body);
}
