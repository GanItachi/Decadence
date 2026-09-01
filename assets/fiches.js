/* ============================================================
   DECADENCE — assets/fiches.js
   Portage vanilla JS du créateur de fiches (ex-composant React).
   Aucune dépendance : DOM direct + fetch vers /api/personnages
   (Vercel Serverless Function adossée à Vercel KV).

   Règle d'architecture : ce fichier ne pose jamais de couleur,
   d'ombre ou de dégradé en ligne. Il pose des data-attributes
   (data-foyer, data-stat, data-wallet, data-locked) que
   fiches.css seul interprète. La seule exception est --anima,
   une variable CSS portant la couleur libre choisie par
   l'utilisateur pour son personnage — une donnée, pas un style.
   ============================================================ */

(function () {
  "use strict";

  // ── Constantes ──────────────────────────────────────────────
  const ADMINS = ["KIRITO", "ITACHI"];

  const FOYER_INITIALS = {
    Latent: "L",
    Noir: "N",
    Sombre: "S",
    Brûlant: "B",
    Ardent: "Ar",
    Solaire: "So",
    Argent: "Ag",
    Gris: "G",
    Blanc: "Bl",
    Origine: "O",
  };
  const FOYERS = Object.keys(FOYER_INITIALS);

  const ORGS = ["CLM", "CO", "Militaire", "Civil", "Sans affiliation"];
  const RANGS = ["Admis", "Bronze", "Argent", "Or", "Or Noir", "Légende"];
  const RANG_INITIALS = {
    Admis: "AD",
    Bronze: "BR",
    Argent: "AR",
    Or: "OR",
    "Or Noir": "ON",
    Légende: "LG",
  };
  const CONFIGS = [
    "Pur Profond",
    "Profond dominant",
    "Équilibré",
    "Libre dominant",
    "Pur Libre",
  ];

  const DEFAULT_FORM = {
    nom: "",
    pseudo: "",
    sexe: "M",
    niveau: 1,
    titre: "Novice",
    foyer: "Noir",
    configuration: "Équilibré",
    organisation: "Sans affiliation",
    rang: "Admis",
    force: 10,
    vitesseApt: 10,
    agilite: 10,
    endurance: 10,
    controle: 10,
    vie: 120,
    ra: 25,
    vit: 6,
    jetons: 500,
    fragments: 0,
    xp: 0,
    xpSeuil: 100,
    techniques: [],
    arme: "",
    accessoire: "",
    imageUrl: "",
    couleurAnima: "#8800ff",
  };

  // ── Icônes SVG (aucun emoji / caractère Unicode décoratif) ───
  const ICONS = {
    seal: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.2 2.2 3.1-.4.6 3.1 2.8 1.5-1.5 2.8 1.5 2.8-2.8 1.5-.6 3.1-3.1-.4L12 21l-2.2-2.2-3.1.4-.6-3.1-2.8-1.5 1.5-2.8-1.5-2.8 2.8-1.5.6-3.1 3.1.4L12 3z" stroke-width="1.3"/><path d="M9 12.5l2 2 4-4.5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    sparkle: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    close: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    lock: `<svg class="icon" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke-width="1.6"/><path d="M8 11V8a4 4 0 018 0v3" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    orb: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M12 3l6 9-6 9-6-9 6-9z" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    coin: `<svg class="icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke-width="1.6"/><path d="M12 7.5v9M9.3 15a2.9 2.9 0 002.9 1.8c1.7 0 2.9-.8 2.9-2s-1.2-1.7-2.9-2-2.9-.8-2.9-2 1.2-2 2.9-2a2.9 2.9 0 012.7 1.6" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    fragment: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 6-3 12H8L5 9l7-6z" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    progress: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M4 18V11M10 18V6M16 18v-4M21 18V3" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    trash: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 13a1 1 0 001 1h6a1 1 0 001-1l1-13" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    portrait: `<svg class="icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="3.5" stroke-width="1.5"/><path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  };

  // ── État ─────────────────────────────────────────────────────
  let personnages = [];
  let loading = true;
  let adminName = "";
  let search = "";
  let editTarget = null; // fiche en cours d'édition (null = création)
  let editSkills = []; // brouillon de compétences pendant l'édition

  const grid = document.getElementById("fiches-grid");
  const adminZone = document.getElementById("admin-zone");
  const searchInput = document.getElementById("search-input");
  const modalRoot = document.getElementById("modal-root");
  const countEl = document.getElementById("fiches-count");
  const subtitleEl = document.getElementById("fiches-subtitle");
  const adminNoteSlot = document.getElementById("admin-note-slot");

  const isAdmin = () => ADMINS.includes(adminName.toUpperCase());

  // ── Utilitaires ──────────────────────────────────────────────
  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str == null ? "" : String(str);
    return d.innerHTML;
  }

  function normalizeSkills(techniques) {
    if (Array.isArray(techniques)) return techniques.filter((t) => t && t.nom);
    if (typeof techniques === "string") {
      return techniques
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((nom) => ({ nom, recharge: "—", cooldown: "—" }));
    }
    return [];
  }

  // Convertit un fichier image choisi en data URL, redimensionnée pour
  // rester légère (le stockage KV n'aime pas les gros blobs en base64).
  function readImageAsDataURL(file, maxDim = 640, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round(height * (maxDim / width));
              width = maxDim;
            } else {
              width = Math.round(width * (maxDim / height));
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function chipCode(p) {
    const foyerInit = FOYER_INITIALS[p.foyer] || FOYER_INITIALS["Noir"];
    const rangInit = RANG_INITIALS[p.rang] || "XX";
    const tail = (p.id || "000000").toString().slice(-6);
    return `DC-${foyerInit}-${rangInit}-${tail}-PR-AN`;
  }

  function inscriptionDate(p) {
    const t = parseInt(p.id, 10);
    const d = isNaN(t) ? new Date() : new Date(t);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  // Code-barres purement décoratif : géométrie seule, la couleur
  // vient de currentColor (fixée par la classe CSS parente).
  function barcodeSVG(seed) {
    const s = String(seed || "0");
    let x = 0;
    let rects = "";
    for (let i = 0; i < 34; i++) {
      const code = s.charCodeAt(i % s.length) + i;
      const w = (code % 3) + 1;
      rects += `<rect x="${x}" y="0" width="${w}" height="22" fill="${i % 2 === 0 ? "currentColor" : "transparent"}" />`;
      x += w + 1.4;
    }
    return `<svg class="barcode" width="130" height="26" viewBox="0 0 130 26">${rects}</svg>`;
  }

  // statKey référence une entrée définie dans fiches.css
  // ([data-stat="..."] { --stat-color: ... }) — "anima" hérite de
  // --anima, posée une seule fois sur la racine de la carte/licence.
  function statBarHTML(label, value, max, statKey, suffix) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return `
      <div class="statbar" data-stat="${statKey}">
        <div class="statbar-row">
          <span class="lbl">${esc(label)}</span>
          <span class="val">${esc(value)}${suffix || ""}</span>
        </div>
        <div class="statbar-track">
          <div class="statbar-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }

  function walletCellHTML(iconSvg, label, val, walletKey) {
    return `
      <div class="wallet-cell" data-wallet="${walletKey}">
        <div class="ic">${iconSvg}</div>
        <div class="val">${esc(val)}</div>
        <div class="lbl">${esc(label.toUpperCase())}</div>
      </div>`;
  }

  function skillRowHTML(skill, locked) {
    return `
      <div class="skill-row" data-locked="${locked}">
        <div class="skill-icon">${locked ? ICONS.lock : ICONS.orb}</div>
        <div class="skill-body">
          <div class="skill-name">${locked ? "Verrouillé" : esc(skill.nom)}</div>
          <div class="skill-meta">RÉC. ${locked ? "—" : esc(skill.recharge || "—")}s · CD ${locked ? "—" : esc(skill.cooldown || "—")}s</div>
        </div>
      </div>`;
  }

  // ── API (Vercel KV via /api/personnages) ───────────────────────
  async function loadPersonnages() {
    try {
      const res = await fetch("/api/personnages");
      if (res.ok) personnages = await res.json();
    } catch (_) {
      /* hors ligne / API indisponible : registre vide */
    }
    loading = false;
    render();
  }

  async function savePersonnages(list) {
    personnages = list;
    render();
    try {
      await fetch("/api/personnages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list),
      });
    } catch (_) {
      /* la mise à jour locale reste visible même si l'écriture échoue */
    }
  }

  // ── Rendu : barre admin ─────────────────────────────────────
  function renderAdminZone() {
    if (isAdmin()) {
      adminZone.innerHTML = `
        <div class="fiches-admin-active">${ICONS.sparkle} ADMIN : ${esc(adminName)}</div>
        <button class="f-btn f-btn-primary" id="btn-new">+ NOUVELLE LICENCE</button>
        <button class="f-btn" id="btn-logout" aria-label="Se déconnecter">${ICONS.close}</button>`;
      document.getElementById("btn-new").onclick = () => openAdminForm(null);
      document.getElementById("btn-logout").onclick = () => {
        adminName = "";
        render();
      };
    } else {
      adminZone.innerHTML = `
        <input type="text" id="admin-input" class="f-input" placeholder="Nom admin..." style="width:130px">
        <button class="f-btn" id="btn-login">ENTRER</button>
        <span class="f-error" id="admin-error"></span>`;
      const input = document.getElementById("admin-input");
      const doLogin = () => {
        if (ADMINS.includes(input.value.trim().toUpperCase())) {
          adminName = input.value.trim().toUpperCase();
          render();
        } else {
          document.getElementById("admin-error").textContent =
            "Accès refusé. Nom non reconnu.";
        }
      };
      document.getElementById("btn-login").onclick = doLogin;
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doLogin();
      });
    }
  }

  // ── Rendu : grille de tuiles ─────────────────────────────────
  function cardHTML(p) {
    const anima = p.couleurAnima || "#8800ff";
    return `
      <div class="p-card" data-id="${esc(p.id)}" data-foyer="${esc(p.foyer)}" style="--anima:${esc(anima)}" tabindex="0">
        <div class="p-card-img">
          ${
            p.imageUrl
              ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.nom)}" loading="lazy">`
              : `<div class="ph">${ICONS.portrait}</div>`
          }
          <div class="p-card-badge right">${esc(RANG_INITIALS[p.rang] || (p.rang || "").toUpperCase())}</div>
          <div class="p-card-badge left">${esc(p.organisation || "")}</div>
          <div class="p-card-fade"></div>
        </div>
        <div class="p-card-name">
          <div class="n">${esc(p.nom || "—")}</div>
          <div class="foyer">${ICONS.sparkle} FOYER ${esc((p.foyer || "").toUpperCase())}</div>
        </div>
        <div class="p-card-stats">
          <div data-stat="vie"><span class="lbl">PV</span><span class="val">${esc(p.vie ?? 0)}</span></div>
          <div data-stat="anima"><span class="lbl">RA</span><span class="val">${esc(p.ra ?? 0)}</span></div>
          <div data-stat="niveau"><span class="lbl">NIV</span><span class="val">${esc(p.niveau ?? 1)}</span></div>
          <div data-stat="vitesse"><span class="lbl">VIT</span><span class="val">${esc(p.vit ?? 0)}m/s</span></div>
        </div>
        <div class="p-card-strip"></div>
      </div>`;
  }

  function renderGrid() {
    const q = search.toLowerCase();
    const filtered = personnages.filter(
      (p) =>
        (p.nom || "").toLowerCase().includes(q) ||
        (p.pseudo || "").toLowerCase().includes(q) ||
        (p.classe || "").toLowerCase().includes(q) ||
        (p.organisation || "").toLowerCase().includes(q) ||
        (p.foyer || "").toLowerCase().includes(q),
    );

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="fiches-empty">${
        personnages.length === 0
          ? "Aucune licence enregistrée. Connectez-vous en tant qu'admin pour en créer une."
          : "Aucun résultat pour cette recherche."
      }</div>`;
    } else {
      grid.innerHTML = filtered.map(cardHTML).join("");
      grid.querySelectorAll(".p-card").forEach((el) => {
        const open = () => {
          const p = personnages.find((x) => x.id === el.dataset.id);
          if (!p) return;
          if (isAdmin()) openAdminForm(p);
          else openDetailModal(p);
        };
        el.addEventListener("click", open);
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        });
      });
    }

    countEl.textContent = `${personnages.length} GUERRIER${personnages.length > 1 ? "S" : ""}`;
    subtitleEl.textContent = `${personnages.length} licence${personnages.length > 1 ? "s" : ""} enregistrée${personnages.length > 1 ? "s" : ""}`;

    adminNoteSlot.innerHTML = isAdmin()
      ? `<div class="fiches-admin-note">${ICONS.sparkle} MODE ADMIN ACTIF — Cliquez sur une carte pour la modifier. Les licences sont partagées et visibles par tous les joueurs.</div>`
      : "";
  }

  // ── Rendu : modale détail (la carte de licence) ─────────────
  function openDetailModal(p) {
    const anima = p.couleurAnima || "#8800ff";
    const skills = normalizeSkills(p.techniques).slice(0, 4);
    while (skills.length < 4) skills.push(null);
    const aptTotal =
      (p.force || 0) +
      (p.vitesseApt || 0) +
      (p.agilite || 0) +
      (p.endurance || 0) +
      (p.controle || 0);

    modalRoot.innerHTML = `
      <div class="f-overlay" id="detail-overlay">
        <div class="license" data-foyer="${esc(p.foyer)}" style="--anima:${esc(anima)}" onclick="event.stopPropagation()">
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>
          <button class="close-btn" id="detail-close" aria-label="Fermer">${ICONS.close}</button>

          <div class="license-head">
            <div class="f-seal lg">${ICONS.seal}</div>
            <div style="flex:1">
              <div class="eyebrow">DECADENCE · CODEX</div>
              <div class="title">LICENCE DE GUERRIER</div>
            </div>
            <div class="license-rank-badge">${esc(RANG_INITIALS[p.rang] || "—")}</div>
          </div>

          <div class="license-portrait">
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke-width="0.5" />
              <circle cx="100" cy="100" r="70" fill="none" stroke-width="0.5" stroke-dasharray="2 4" />
              <circle cx="100" cy="100" r="50" fill="none" stroke-width="0.5" />
            </svg>
            ${p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.nom)}">` : `<div class="ph">${ICONS.portrait}</div>`}
            <div class="fade"></div>
            <div class="cap">
              <div class="n">${esc(p.nom || "—")}</div>
              <div class="s">[${esc(p.pseudo || "SANS PSEUDO")}] · FOYER ${esc((p.foyer || "").toUpperCase())} · ${esc(p.configuration || "")}</div>
            </div>
          </div>

          <div class="license-sec">
            <div class="license-sec-title">Profil</div>
            <div class="profile-grid">
              <div class="profile-row"><span class="k">Sexe</span><span class="v">${esc(p.sexe || "—")}</span></div>
              <div class="profile-row"><span class="k">Niveau</span><span class="v">Lv ${esc(p.niveau ?? 1)}</span></div>
              <div class="profile-row"><span class="k">Classe</span><span class="v">${esc(p.classe || "—")}</span></div>
              <div class="profile-row"><span class="k">Titre</span><span class="v">${esc(p.titre || "—")}</span></div>
              <div class="profile-row"><span class="k">Organisation</span><span class="v">${esc(p.organisation || "—")}</span></div>
              <div class="profile-row"><span class="k">Rang</span><span class="v">${esc(p.rang || "—")}</span></div>
            </div>
          </div>

          <div class="license-sec">
            <div class="license-sec-title">Affinités (APT)</div>
            <div class="apt-grid">
              ${statBarHTML("FORCE", p.force || 0, 40, "force")}
              ${statBarHTML("VITESSE", p.vitesseApt || 0, 40, "vitesse")}
              ${statBarHTML("AGILITÉ", p.agilite || 0, 40, "agilite")}
              ${statBarHTML("ENDURANCE", p.endurance || 0, 40, "endurance")}
              ${statBarHTML("CONTRÔLE", p.controle || 0, 40, "anima")}
            </div>
            <div class="apt-total">Total investi : <span>${esc(aptTotal)} pts</span></div>
          </div>

          <div class="license-sec">
            <div class="license-sec-title">Stats & Rang</div>
            ${statBarHTML("VIE (PV)", p.vie || 0, 200, "vie")}
            ${statBarHTML("ANIMA (RA)", p.ra || 0, 100, "anima")}
            ${statBarHTML("VITESSE DE POINTE", p.vit || 0, 20, "vitesse-pointe", " m/s")}
          </div>

          <div class="license-sec">
            <div class="license-sec-title">Bourse</div>
            <div class="wallet-grid">
              ${walletCellHTML(ICONS.coin, "Jetons", p.jetons ?? 0, "jetons")}
              ${walletCellHTML(ICONS.fragment, "Fragments", p.fragments ?? 0, "fragments")}
              ${walletCellHTML(ICONS.progress, "Progression", `${p.xp ?? 0}/${p.xpSeuil ?? 100}`, "progression")}
            </div>
          </div>

          <div class="license-sec">
            <div class="license-sec-title">Compétences</div>
            <div class="skills-list">
              ${skills.map((s) => skillRowHTML(s || { nom: "", recharge: "", cooldown: "" }, !s)).join("")}
            </div>
          </div>

          <div class="equip-grid">
            <div>
              <div class="license-sec-title">Arme</div>
              <div class="equip-val ${p.arme ? "" : "equip-empty"}">${p.arme ? esc(p.arme) : "Aucune arme déclarée"}</div>
            </div>
            <div>
              <div class="license-sec-title">Accessoire</div>
              <div class="equip-val ${p.accessoire ? "" : "equip-empty"}">${p.accessoire ? esc(p.accessoire) : "Aucun"}</div>
            </div>
          </div>

          <div class="license-footer">
            <div>
              ${barcodeSVG(p.id)}
              <div class="chip">${esc(chipCode(p))}</div>
            </div>
            <div>
              <div class="date">${esc(inscriptionDate(p))}</div>
              <div class="sig">Decadence — Codex des Guerriers</div>
            </div>
          </div>
        </div>
      </div>`;

    const overlay = document.getElementById("detail-overlay");
    overlay.addEventListener("click", closeModal);
    document
      .getElementById("detail-close")
      .addEventListener("click", closeModal);
  }

  function closeModal() {
    modalRoot.innerHTML = "";
  }

  // ── Rendu : formulaire admin ─────────────────────────────────
  function openAdminForm(initial) {
    editTarget = initial;
    const form = Object.assign({}, DEFAULT_FORM, initial || {});
    editSkills = normalizeSkills(form.techniques).map((s) =>
      Object.assign({ nom: "", recharge: "", cooldown: "" }, s),
    );

    modalRoot.innerHTML = `
      <div class="f-overlay form-overlay" id="form-overlay">
        <div class="f-form" onclick="event.stopPropagation()">
          <div class="f-form-title">${ICONS.sparkle} ${initial ? "MODIFIER LA LICENCE" : "NOUVELLE LICENCE"}</div>

          <div class="f-group-title">Identité</div>
          <div class="f-field"><label>Nom du personnage</label><input id="f-nom" value="${esc(form.nom)}"></div>
          <div class="f-field"><label>Pseudo</label><input id="f-pseudo" value="${esc(form.pseudo)}"></div>
          <div class="f-field"><label>Classe / rôle</label><input id="f-classe" value="${esc(form.classe)}"></div>
          <div class="f-field"><label>Titre</label><input id="f-titre" value="${esc(form.titre)}"></div>
          
          <div class="f-field">
            <label>Portrait</label>
            <div class="f-image-picker">
              <div class="f-image-preview" id="f-image-preview">${form.imageUrl ? `<img src="${form.imageUrl}" alt="">` : `<span>${ICONS.portrait}</span>`}</div>
              <div class="f-image-actions">
                <button type="button" class="f-btn" id="f-image-pick-btn">Choisir une photo</button>
                <button type="button" class="f-btn" id="f-image-clear-btn" style="${form.imageUrl ? "" : "display:none"}">Retirer</button>
              </div>
              <input type="file" id="f-imageFile" accept="image/*" style="display:none">
              <input type="hidden" id="f-imageUrl" value="${esc(form.imageUrl)}">
            </div>
          </div>



          <div class="f-row2">
            <div class="f-field"><label>Sexe</label>
              <select id="f-sexe">
                ${["M", "F", "Autre"].map((v) => `<option value="${v}" ${form.sexe === v ? "selected" : ""}>${v}</option>`).join("")}
              </select>
            </div>
            <div class="f-field"><label>Niveau</label><input type="number" id="f-niveau" value="${esc(form.niveau)}"></div>
          </div>

          <div class="f-group-title">Foyer & Configuration</div>
          <div class="f-row2">
            <div class="f-field"><label>Foyer</label>
              <select id="f-foyer">${FOYERS.map((f) => `<option ${form.foyer === f ? "selected" : ""}>${f}</option>`).join("")}</select>
            </div>
            <div class="f-field"><label>Configuration</label>
              <select id="f-configuration">${CONFIGS.map((c) => `<option ${form.configuration === c ? "selected" : ""}>${c}</option>`).join("")}</select>
            </div>
          </div>
          <div class="f-row2">
            <div class="f-field"><label>Organisation</label>
              <select id="f-organisation">${ORGS.map((o) => `<option ${form.organisation === o ? "selected" : ""}>${o}</option>`).join("")}</select>
            </div>
            <div class="f-field"><label>Rang</label>
              <select id="f-rang">${RANGS.map((r) => `<option ${form.rang === r ? "selected" : ""}>${r}</option>`).join("")}</select>
            </div>
          </div>

          <div class="f-group-title">Affinités (APT)</div>
          <div class="f-row2">
            <div class="f-field"><label>Force</label><input type="number" id="f-force" value="${esc(form.force)}"></div>
            <div class="f-field"><label>Vitesse</label><input type="number" id="f-vitesseApt" value="${esc(form.vitesseApt)}"></div>
            <div class="f-field"><label>Agilité</label><input type="number" id="f-agilite" value="${esc(form.agilite)}"></div>
            <div class="f-field"><label>Endurance</label><input type="number" id="f-endurance" value="${esc(form.endurance)}"></div>
            <div class="f-field"><label>Contrôle</label><input type="number" id="f-controle" value="${esc(form.controle)}"></div>
          </div>

          <div class="f-group-title">Stats & Anima</div>
          <div class="f-row3">
            <div class="f-field"><label>Vie</label><input type="number" id="f-vie" value="${esc(form.vie)}"></div>
            <div class="f-field"><label>RA</label><input type="number" id="f-ra" value="${esc(form.ra)}"></div>
            <div class="f-field"><label>Vit. pointe (m/s)</label><input type="number" id="f-vit" value="${esc(form.vit)}"></div>
          </div>
          <div class="f-field">
            <label>Couleur d'Anima</label>
            <div class="f-color-row">
              <input type="color" id="f-couleurAnima-picker" value="${esc(form.couleurAnima)}">
              <input id="f-couleurAnima" style="flex:1" value="${esc(form.couleurAnima)}">
            </div>
          </div>

          <div class="f-group-title">Bourse</div>
          <div class="f-row4">
            <div class="f-field"><label>Jetons</label><input type="number" id="f-jetons" value="${esc(form.jetons)}"></div>
            <div class="f-field"><label>Fragments</label><input type="number" id="f-fragments" value="${esc(form.fragments)}"></div>
            <div class="f-field"><label>XP</label><input type="number" id="f-xp" value="${esc(form.xp)}"></div>
            <div class="f-field"><label>Seuil XP</label><input type="number" id="f-xpSeuil" value="${esc(form.xpSeuil)}"></div>
          </div>

          <div class="f-group-title" id="skills-title">Compétences (${editSkills.length}/6)</div>
          <div id="skills-editor"></div>
          <button class="f-add-skill" id="btn-add-skill">+ AJOUTER UNE COMPÉTENCE</button>

          <div class="f-group-title">Équipement</div>
          <div class="f-row2">
            <div class="f-field"><label>Arme</label><input id="f-arme" value="${esc(form.arme)}"></div>
            <div class="f-field"><label>Accessoire</label><input id="f-accessoire" value="${esc(form.accessoire)}"></div>
          </div>

          <div class="f-form-actions">
            <button class="f-btn-save" id="btn-save">SAUVEGARDER</button>
            <button class="f-btn-cancel" id="btn-cancel">ANNULER</button>
            ${initial ? `<button class="f-btn-delete" id="btn-delete" aria-label="Supprimer">${ICONS.trash}</button>` : ""}
          </div>
        </div>
      </div>`;

    renderSkillsEditor();

    const fileInput = document.getElementById("f-imageFile");
    const hiddenUrl = document.getElementById("f-imageUrl");
    const preview = document.getElementById("f-image-preview");
    const pickBtn = document.getElementById("f-image-pick-btn");
    const clearBtn = document.getElementById("f-image-clear-btn");

    pickBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;
      pickBtn.disabled = true;
      pickBtn.textContent = "Traitement...";
      try {
        const dataUrl = await readImageAsDataURL(file);
        hiddenUrl.value = dataUrl;
        preview.innerHTML = `<img src="${dataUrl}" alt="">`;
        clearBtn.style.display = "";
      } catch (_) {
        alert("Impossible de lire cette image.");
      } finally {
        pickBtn.disabled = false;
        pickBtn.textContent = "Choisir une photo";
      }
    });

    clearBtn.addEventListener("click", () => {
      hiddenUrl.value = "";
      preview.innerHTML = `<span>${ICONS.portrait}</span>`;
      fileInput.value = "";
      clearBtn.style.display = "none";
    });

    document
      .getElementById("form-overlay")
      .addEventListener("click", closeModal);
    document.getElementById("btn-cancel").addEventListener("click", closeModal);
    document.getElementById("btn-add-skill").addEventListener("click", () => {
      if (editSkills.length >= 6) return;
      editSkills.push({ nom: "", recharge: "", cooldown: "" });
      renderSkillsEditor();
    });
    const colorPicker = document.getElementById("f-couleurAnima-picker");
    const colorText = document.getElementById("f-couleurAnima");
    colorPicker.addEventListener("input", () => {
      colorText.value = colorPicker.value;
    });
    colorText.addEventListener("input", () => {
      if (/^#[0-9a-fA-F]{6}$/.test(colorText.value))
        colorPicker.value = colorText.value;
    });

    document
      .getElementById("btn-save")
      .addEventListener("click", handleFormSave);
    if (initial)
      document
        .getElementById("btn-delete")
        .addEventListener("click", () => handleDelete(initial.id));
  }

  function renderSkillsEditor() {
    const wrap = document.getElementById("skills-editor");
    document.getElementById("skills-title").textContent =
      `Compétences (${editSkills.length}/6)`;
    wrap.innerHTML = editSkills
      .map(
        (s, i) => `
      <div class="skill-edit-row" data-i="${i}">
        <input placeholder="Nom de la compétence" class="sk-nom" value="${esc(s.nom)}">
        <input placeholder="Récup. (s)" class="sk-recharge" value="${esc(s.recharge)}">
        <input placeholder="Cooldown (s)" class="sk-cooldown" value="${esc(s.cooldown)}">
        <button class="sk-remove" aria-label="Retirer la compétence">${ICONS.close}</button>
      </div>`,
      )
      .join("");

    wrap.querySelectorAll(".skill-edit-row").forEach((row) => {
      const i = Number(row.dataset.i);
      row
        .querySelector(".sk-nom")
        .addEventListener("input", (e) => (editSkills[i].nom = e.target.value));
      row
        .querySelector(".sk-recharge")
        .addEventListener(
          "input",
          (e) => (editSkills[i].recharge = e.target.value),
        );
      row
        .querySelector(".sk-cooldown")
        .addEventListener(
          "input",
          (e) => (editSkills[i].cooldown = e.target.value),
        );
      row.querySelector(".sk-remove").addEventListener("click", () => {
        editSkills.splice(i, 1);
        renderSkillsEditor();
      });
    });

    document.getElementById("btn-add-skill").disabled = editSkills.length >= 6;
  }

  function val(id) {
    return document.getElementById(id).value;
  }
  function num(id) {
    return Number(document.getElementById(id).value) || 0;
  }

  function handleFormSave() {
    const form = {
      nom: val("f-nom").trim(),
      pseudo: val("f-pseudo").trim(),
      classe: val("f-classe").trim(),
      titre: val("f-titre").trim(),
      imageUrl: val("f-imageUrl").trim(),
      sexe: val("f-sexe"),
      niveau: num("f-niveau"),
      foyer: val("f-foyer"),
      configuration: val("f-configuration"),
      organisation: val("f-organisation"),
      rang: val("f-rang"),
      force: num("f-force"),
      vitesseApt: num("f-vitesseApt"),
      agilite: num("f-agilite"),
      endurance: num("f-endurance"),
      controle: num("f-controle"),
      vie: num("f-vie"),
      ra: num("f-ra"),
      vit: num("f-vit"),
      couleurAnima: val("f-couleurAnima").trim() || "#8800ff",
      jetons: num("f-jetons"),
      fragments: num("f-fragments"),
      xp: num("f-xp"),
      xpSeuil: num("f-xpSeuil"),
      techniques: editSkills.filter((s) => s.nom && s.nom.trim()),
      arme: val("f-arme").trim(),
      accessoire: val("f-accessoire").trim(),
    };

    let updated;
    if (editTarget) {
      updated = personnages.map((p) =>
        p.id === editTarget.id
          ? Object.assign({}, form, { id: editTarget.id })
          : p,
      );
    } else {
      updated = personnages.concat([
        Object.assign({}, form, { id: Date.now().toString() }),
      ]);
    }
    savePersonnages(updated);
    editTarget = null;
    closeModal();
  }

  function handleDelete(id) {
    if (!window.confirm("Supprimer cette licence ?")) return;
    savePersonnages(personnages.filter((p) => p.id !== id));
    editTarget = null;
    closeModal();
  }

  // ── Boucle de rendu principale ───────────────────────────────
  function render() {
    if (loading) {
      grid.innerHTML = `<div class="fiches-loading" style="width:100%">CHARGEMENT...</div>`;
      adminZone.innerHTML = "";
      return;
    }
    renderAdminZone();
    renderGrid();
  }

  searchInput.addEventListener("input", (e) => {
    search = e.target.value;
    renderGrid();
  });

  loadPersonnages();
})();
