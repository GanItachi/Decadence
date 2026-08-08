// api/candidatures.js
// Fonction serverless Vercel (Node runtime, auto-détectée).
//
// GET  /api/candidatures   -> renvoie la liste des candidatures (plus récentes d'abord)
// POST /api/candidatures   -> reçoit UNE candidature brute { pseudo, whatsapp, personnage,
//                             nature, configuration, message }, lui attribue un id, une
//                             date et un statut, l'ajoute au registre, et renvoie
//                             l'enregistrement complet (même contrat que MockBackend côté
//                             client, voir assets/site.js).
//
// Nécessite la même base Vercel KV que /api/personnages.js — pas de configuration
// supplémentaire si elle est déjà liée au projet (voir LISEZ-MOI.txt).

const { kv } = require("@vercel/kv");

const STORAGE_KEY = "decadence-candidatures";

function generateId() {
  return "cand-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const list = (await kv.get(STORAGE_KEY)) || [];
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(list.slice().reverse());
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body || typeof body !== "object") {
        return res.status(400).json({ error: "Corps de requête invalide." });
      }
      if (!body.pseudo || !body.whatsapp || !body.personnage || !body.nature) {
        return res.status(400).json({ error: "Champs requis manquants (pseudo, whatsapp, personnage, nature)." });
      }

      const list = (await kv.get(STORAGE_KEY)) || [];
      const enregistrement = {
        pseudo: String(body.pseudo).trim(),
        whatsapp: String(body.whatsapp).trim(),
        personnage: String(body.personnage).trim(),
        nature: String(body.nature).trim(),
        configuration: body.configuration ? String(body.configuration).trim() : "",
        message: body.message ? String(body.message).trim() : "",
        id: generateId(),
        soumisLe: new Date().toISOString(),
        statut: "en_attente",
      };
      list.push(enregistrement);
      await kv.set(STORAGE_KEY, list);

      return res.status(200).json(enregistrement);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  } catch (err) {
    console.error("Erreur /api/candidatures :", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};
