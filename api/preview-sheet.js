import { readStorageSheet } from '../server/readStorageSheet.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode refusée' });
    return;
  }

  const result = await readStorageSheet(req.body || {});
  res.setHeader('Cache-Control', 'no-store');
  res.status(result.status).json(result.body);
}
