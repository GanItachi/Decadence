/* ============================================================
   DECADENCE — assets/site.js
   Registre de candidatures : structure de données simulée,
   avec un adaptateur clairement isolé pour brancher un vrai
   backend (Java/Spring, Node, PHP...) plus tard.
   ============================================================ */

(function () {
  "use strict";

  /* ------------------------------------------------------------
   * 1. STRUCTURE DE DONNÉES
   *    Chaque candidature suit ce schéma. C'est le contrat que
   *    devra respecter l'API réelle, quel que soit le backend :
   *
   *    Candidature {
   *      id            : string   // identifiant généré côté client (remplacé par le backend en prod)
   *      pseudo        : string
   *      whatsapp      : string
   *      personnage    : string
   *      nature        : "profonde" | "libre" | "mixte"
   *      configuration : string
   *      message       : string
   *      soumisLe      : string   // ISO 8601
   *      statut        : "en_attente" | "validee" | "refusee"
   *    }
   * ---------------------------------------------------------- */

  /* ------------------------------------------------------------
   * 2. "BACKEND" — deux implémentations interchangeables.
   *    DecadenceAPI expose la même interface asynchrone dans les
   *    deux cas, pour que le reste du code n'ait jamais à savoir
   *    laquelle est active.
   * ---------------------------------------------------------- */

  // Implémentation simulée : stockage en mémoire (perdu au rechargement).
  // Sert de démonstration tant qu'aucun serveur n'est branché.
  const MockBackend = (function () {
    let registre = [];

    function generateId() {
      return "cand-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
    }

    return {
      async submit(candidature) {
        await simulateLatency();
        const enregistrement = Object.assign({}, candidature, {
          id: generateId(),
          soumisLe: new Date().toISOString(),
          statut: "en_attente",
        });
        registre.push(enregistrement);
        return enregistrement;
      },
      async list() {
        await simulateLatency(120);
        return registre.slice().reverse();
      },
    };
  })();

  // Implémentation réelle : à activer quand un backend existe.
  // Exemple pensé pour un contrôleur Java/Spring exposant
  // POST /api/candidatures et GET /api/candidatures.
  const RealBackend = {
    baseUrl: "/api/candidatures",
    async submit(candidature) {
      const res = await fetch(this.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidature),
      });
      if (!res.ok) throw new Error("Échec de l'envoi (" + res.status + ")");
      return res.json();
    },
    async list() {
      const res = await fetch(this.baseUrl);
      if (!res.ok) throw new Error("Échec du chargement (" + res.status + ")");
      return res.json();
    },
  };

  function simulateLatency(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms || 450));
  }

  // Bascule unique : mettre à `RealBackend` une fois l'API en place.
  const DecadenceAPI = MockBackend;
  window.DecadenceAPI = DecadenceAPI; // exposé pour debug / extension

  /* ------------------------------------------------------------
   * 3. NAVIGATION — marque le lien de la page courante
   * ---------------------------------------------------------- */
  document.querySelectorAll("nav.sitenav a").forEach((a) => {
    if (a.getAttribute("href") === location.pathname.split("/").pop() ||
        (a.dataset.page && a.dataset.page === document.body.dataset.page)) {
      a.setAttribute("aria-current", "page");
    }
  });

  /* ------------------------------------------------------------
   * 4. CHAMP DE BRAISES — particules décoratives du hero (accueil)
   * ---------------------------------------------------------- */
  const emberField = document.querySelector(".ember-field");
  if (emberField && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const count = 22;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement("span");
      dot.style.left = Math.random() * 100 + "%";
      dot.style.setProperty("--drift", (Math.random() * 60 - 30) + "px");
      dot.style.animationDelay = (Math.random() * 9) + "s";
      dot.style.animationDuration = (7 + Math.random() * 5) + "s";
      emberField.appendChild(dot);
    }
  }

  /* ------------------------------------------------------------
   * 5. FORMULAIRE DE CANDIDATURE (rejoindre.html)
   * ---------------------------------------------------------- */
  const form = document.getElementById("candidature-form");
  if (form) {
    const statusEl = document.getElementById("form-status");
    const confirmCard = document.getElementById("confirm-card");
    const confirmId = document.getElementById("confirm-id");
    const submitBtn = form.querySelector("button.seal-btn");
    const registryList = document.getElementById("registry-list");

    function setStatus(message, isError) {
      statusEl.textContent = message || "";
      statusEl.classList.toggle("err", !!isError);
    }

    function readForm() {
      const data = new FormData(form);
      return {
        pseudo: (data.get("pseudo") || "").toString().trim(),
        whatsapp: (data.get("whatsapp") || "").toString().trim(),
        personnage: (data.get("personnage") || "").toString().trim(),
        nature: (data.get("nature") || "").toString(),
        configuration: (data.get("configuration") || "").toString(),
        message: (data.get("message") || "").toString().trim(),
      };
    }

    function validate(c) {
      if (!c.pseudo) return "Un pseudo est requis.";
      if (!c.whatsapp) return "Un numéro ou pseudo WhatsApp est requis.";
      if (!c.personnage) return "Décris au moins brièvement ton personnage.";
      if (!c.nature) return "Choisis une nature d'Anima.";
      return null;
    }

    async function renderRegistry() {
      const items = await DecadenceAPI.list();
      if (!items.length) {
        registryList.innerHTML = '<p class="registry-empty">Aucune candidature scellée pour l\'instant — sois le premier.</p>';
        return;
      }
      registryList.innerHTML = items
        .map((c) => {
          const natureLabel = { profonde: "Anima Profonde", libre: "Anima Libre", mixte: "Anima mixte" }[c.nature] || c.nature;
          const date = new Date(c.soumisLe);
          const dateLabel = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
          return (
            '<div class="registry-item">' +
              '<span class="r-name">' + escapeHtml(c.pseudo) + ' — ' + escapeHtml(c.personnage) + '</span>' +
              '<span class="r-meta">' + escapeHtml(natureLabel) + ' · ' + dateLabel + '</span>' +
            "</div>"
          );
        })
        .join("");
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const candidature = readForm();
      const error = validate(candidature);
      if (error) {
        setStatus(error, true);
        return;
      }
      setStatus("Scellement en cours…", false);
      submitBtn.disabled = true;
      try {
        const saved = await DecadenceAPI.submit(candidature);
        setStatus("", false);
        confirmId.textContent = "Réf. " + saved.id;
        confirmCard.classList.add("show");
        form.reset();
        await renderRegistry();
        confirmCard.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (err) {
        setStatus("La candidature n'a pas pu être scellée : " + err.message, true);
      } finally {
        submitBtn.disabled = false;
      }
    });

    renderRegistry();
  }
})();
