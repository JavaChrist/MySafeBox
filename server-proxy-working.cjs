/**
 * Serveur proxy pour contourner les problèmes CORS avec le NAS Synology
 * Ce serveur fait les requêtes WebDAV côté serveur (pas de CORS)
 * et expose une API REST simple pour MySafeBox
 */

const express = require("express");
const cors = require("cors");
const { createClient } = require("webdav");
const https = require("https");

const app = express();
const PORT = 3030;

// Configuration CORS permissive pour le développement
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Configuration pour supporter des fichiers plus gros (jusqu'à 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Configuration WebDAV - URL publique pour production
const WEBDAV_URL = process.env.NAS_URL || "https://app.mysafebox.fr";

// Store des clients WebDAV (en mémoire pour la démo)
const clients = new Map();

/**
 * Création/récupération d'un client WebDAV
 */
function getWebDAVClient(username, password) {
  const key = `${username}:${password}`;

  if (!clients.has(key)) {
    // Agent HTTPS pour ignorer les certificats auto-signés
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const client = createClient(WEBDAV_URL, {
      username,
      password,
      httpsAgent: httpsAgent,
    });
    clients.set(key, client);
  }

  return clients.get(key);
}

/**
 * Test de connexion WebDAV
 */
app.post("/api/webdav/test", async (req, res) => {
  const { username, password } = req.body;

  console.log(`🔗 Test connexion WebDAV pour: ${username}`);

  try {
    const client = getWebDAVClient(username, password);

    // Test d'accès à la racine
    await client.getDirectoryContents("/");

    console.log("✅ Connexion WebDAV réussie");
    res.json({ success: true, message: "Connexion réussie" });
  } catch (error) {
    console.error("❌ Erreur WebDAV:", error.message);

    let errorDetails = {
      success: false,
      message: "Erreur de connexion",
      details: error.message,
      status: error.status || null,
    };

    if (error.status === 401) {
      errorDetails.message = "Identifiants incorrects";
    } else if (error.status === 404) {
      errorDetails.message = "Service WebDAV non trouvé";
    }

    res.status(error.status || 500).json(errorDetails);
  }
});

/**
 * Listing des fichiers/dossiers
 */
app.post("/api/webdav/list", async (req, res) => {
  const { username, password, path = "" } = req.body;

  try {
    const client = getWebDAVClient(username, password);
    const userPath = `/VaultsBackup/${username.replace(/[^a-z0-9]/gi, ".")}`;
    const fullPath = `${userPath}/${path}`.replace(/\/+/g, "/");

    console.log(`📁 Listing: ${fullPath}`);

    // S'assurer que le dossier utilisateur existe
    try {
      await client.getDirectoryContents(userPath);
    } catch (error) {
      console.log(`📁 Création dossier utilisateur: ${userPath}`);
      await client.createDirectory("/VaultsBackup", { recursive: true });
      await client.createDirectory(userPath, { recursive: true });
    }

    const contents = await client.getDirectoryContents(fullPath);

    const files = Array.isArray(contents)
      ? contents.map((item) => ({
          name: item.basename,
          type: item.type,
          size: item.size,
          lastModified: item.lastmod,
          path: item.filename.replace(userPath, "").replace(/^\//, ""),
        }))
      : [];

    res.json({ success: true, files });
  } catch (error) {
    console.error("❌ Erreur listing:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Création de dossier
 */
app.post("/api/webdav/mkdir", async (req, res) => {
  const { username, password, path, name } = req.body;

  try {
    const client = getWebDAVClient(username, password);
    const userPath = `/VaultsBackup/${username.replace(/[^a-z0-9]/gi, ".")}`;
    const fullPath = `${userPath}/${path}/${name}`.replace(/\/+/g, "/");

    console.log(`📁 Création dossier: ${fullPath}`);
    await client.createDirectory(fullPath);

    res.json({ success: true, message: "Dossier créé" });
  } catch (error) {
    console.error("❌ Erreur création dossier:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Upload de fichier
 */
app.post("/api/webdav/upload", async (req, res) => {
  const { username, password, path, fileName, fileData } = req.body;

  try {
    const client = getWebDAVClient(username, password);
    const userPath = `/VaultsBackup/${username.replace(/[^a-z0-9]/gi, ".")}`;
    const fullPath = `${userPath}/${path}/${fileName}`.replace(/\/+/g, "/");

    console.log(`⬆️ Upload: ${fullPath}`);

    // Convertir base64 en buffer si nécessaire
    const buffer = Buffer.from(fileData, "base64");
    await client.putFileContents(fullPath, buffer);

    res.json({ success: true, message: "Fichier uploadé" });
  } catch (error) {
    console.error("❌ Erreur upload:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Téléchargement de fichier
 */
app.post("/api/webdav/download", async (req, res) => {
  const { username, password, path } = req.body;

  try {
    const client = getWebDAVClient(username, password);
    const userPath = `/VaultsBackup/${username.replace(/[^a-z0-9]/gi, ".")}`;
    const fullPath = `${userPath}/${path}`.replace(/\/+/g, "/");

    console.log(`⬇️ Download: ${fullPath}`);

    const content = await client.getFileContents(fullPath, {
      format: "binary",
    });
    const base64 = Buffer.from(content).toString("base64");

    res.json({ success: true, data: base64 });
  } catch (error) {
    console.error("❌ Erreur download:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Suppression de fichier/dossier
 */
app.post("/api/webdav/delete", async (req, res) => {
  const { username, password, path } = req.body;

  try {
    const client = getWebDAVClient(username, password);
    const userPath = `/VaultsBackup/${username.replace(/[^a-z0-9]/gi, ".")}`;
    const fullPath = `${userPath}/${path}`.replace(/\/+/g, "/");

    console.log(`🗑️ Suppression: ${fullPath}`);
    await client.deleteFile(fullPath);

    res.json({ success: true, message: "Supprimé" });
  } catch (error) {
    console.error("❌ Erreur suppression:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint de santé
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Proxy WebDAV MySafeBox opérationnel",
    webdavUrl: WEBDAV_URL,
    timestamp: new Date().toISOString(),
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log("\n🚀 Proxy WebDAV MySafeBox démarré !");
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔗 WebDAV: ${WEBDAV_URL}`);
  console.log(`🌐 CORS: Activé pour localhost:3000-3001`);
  console.log("\n✅ Prêt à contourner les problèmes CORS ! 🎯\n");
});

module.exports = app;
