import { renameStorageObject } from '../server/renameStorage.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode refusée' });
    return;
  }

  const result = await renameStorageObject(req.body || {});
  res.status(result.status).json(result.body);
}
