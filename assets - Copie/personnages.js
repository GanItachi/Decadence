// api/personnages.js
// Fonction serverless Vercel (Node runtime, détectée automatiquement
// par la présence du dossier /api — aucune config supplémentaire requise).
//
// GET  /api/personnages   -> renvoie le tableau JSON des fiches
// POST /api/personnages   -> remplace le tableau entier (même logique
//                            que l'ancien window.storage.set côté client)
//
// Nécessite une base Vercel KV liée au projet (voir LISEZ-MOI.txt).
// Les variables d'environnement KV_REST_API_URL / KV_REST_API_TOKEN
// sont injectées automatiquement par Vercel une fois la base créée
// et liée au projet — rien à configurer à la main en local ou en prod.

const { kv } = require("@vercel/kv");

const STORAGE_KEY = "decadence-personnages";

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const list = (await kv.get(STORAGE_KEY)) || [];
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(list);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!Array.isArray(body)) {
        return res.status(400).json({ error: "Le corps de la requête doit être un tableau de fiches." });
      }
      await kv.set(STORAGE_KEY, body);
      return res.status(200).json(body);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  } catch (err) {
    console.error("Erreur /api/personnages :", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};
