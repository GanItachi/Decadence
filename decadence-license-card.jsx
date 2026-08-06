const JSONBIN_BIN_ID = 6a74bd9c3919920ec4856305 ;
const JSONBIN_API_KEY = $2a$10$KjFS3JdZ7ww7HpToREFLs.wpfTYIDYa0q2y0fqWWN5kSZ78VN2jF6;
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${$2a$10$OSGn45JnpFu/JPh9XOVmEeRkgqvnjxG1UGjrVEhdJ5XqFZIeMS4T2}`;

import { useState, useEffect } from "react";

const ADMINS = ["KIRITO", "NOVA", "GREY", "ITACHI"];

// ─── PALETTE (même famille que le codex Decadence : void / ember / gold) ─────
const C = {
  void: "#08070a",
  panel: "#0d0b10",
  panel2: "#131017",
  line: "#241f28",
  gold: "#c9a24a",
  goldDim: "#6b5d33",
  bone: "#e7ded2",
  dim: "#8f8394",
  ember: "#b8452f",
  emberBright: "#e0693f",
  glow: "#f3d9c4",
  violet: "#6b5b8a",
  violetBright: "#9c85c9",
  red: "#c23b3b",
};

const FOYER_COLORS = {
  "Latent":  { color: "#888888", glow: "#8a8a8a", initial: "L" },
  "Noir":    { color: "#1a1a2e", glow: "#8877cc", initial: "N" },
  "Sombre":  { color: "#2d1b4e", glow: "#9c6fe0", initial: "S" },
  "Brûlant": { color: "#7a2d00", glow: "#ff6600", initial: "B" },
  "Ardent":  { color: "#8b4500", glow: "#ffaa00", initial: "Ar" },
  "Solaire": { color: "#7a6600", glow: "#ffd700", initial: "So" },
  "Argent":  { color: "#4a5a6a", glow: "#c0d8f0", initial: "Ag" },
  "Gris":    { color: "#3a3a4a", glow: "#c8c8dc", initial: "G" },
  "Blanc":   { color: "#2a2a3a", glow: "#ffffff", initial: "Bl" },
  "Origine": { color: "#1a0a2a", glow: "#e05fff", initial: "O" },
};

const ORGS = ["CLM", "CO", "Militaire", "Civil", "Sans affiliation"];
const RANGS = ["Admis", "Bronze", "Argent", "Or", "Or Noir", "Légende"];
const RANG_INITIALS = { "Admis": "AD", "Bronze": "BR", "Argent": "AR", "Or": "OR", "Or Noir": "ON", "Légende": "LG" };
const CONFIGS = ["Pur Profond", "Profond dominant", "Équilibré", "Libre dominant", "Pur Libre"];
const FOYERS = Object.keys(FOYER_COLORS);

const EMPTY_SKILL = { nom: "", recharge: "", cooldown: "" };

const DEFAULT_FORM = {
  nom: "",
  pseudo: "",
  sexe: "M",
  niveau: 1,
  classe: "",
  titre: "Novice",
  foyer: "Noir",
  configuration: "Équilibré",
  organisation: "CLM",
  rang: "Admis",
  // APT — cinq affinités du Codex, plafonnées à 100 au total
  force: 10,
  vitesseApt: 10,
  agilite: 10,
  endurance: 10,
  controle: 10,
  // Stats dérivées affichées en jauges
  vie: 120,
  ra: 25,
  vit: 6, // vitesse de pointe réalisée, en m/s (Flow Speed)
  // Portefeuille
  jetons: 500,
  fragments: 0,
  xp: 0,
  xpSeuil: 100,
  // Compétences (jusqu'à 4 affichées sur la carte)
  techniques: [],
  // Équipement
  arme: "",
  accessoire: "",
  imageUrl: "",
  couleurAnima: "#8800ff",
};

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function normalizeSkills(techniques) {
  if (Array.isArray(techniques)) return techniques.filter(t => t && t.nom);
  if (typeof techniques === "string") {
    return techniques.split("\n").map(t => t.trim()).filter(Boolean)
      .map(nom => ({ nom, recharge: "—", cooldown: "—" }));
  }
  return [];
}

function chipCode(p) {
  const foyerInit = (FOYER_COLORS[p.foyer] || FOYER_COLORS["Noir"]).initial;
  const rangInit = RANG_INITIALS[p.rang] || "XX";
  const tail = (p.id || "000000").toString().slice(-6);
  return `DC-${foyerInit}-${rangInit}-${tail}-PR-AN`;
}

function inscriptionDate(p) {
  const t = parseInt(p.id, 10);
  const d = isNaN(t) ? new Date() : new Date(t);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "long", year: "numeric" });
}

function Barcode({ seed }) {
  const s = String(seed || "0");
  const bars = [];
  for (let i = 0; i < 34; i++) {
    const code = s.charCodeAt(i % s.length) + i;
    bars.push((code % 3) + 1);
  }
  let x = 0;
  return (
    <svg width="130" height="26" viewBox="0 0 130 26" style={{ display: "block" }}>
      {bars.map((w, i) => {
        const bar = <rect key={i} x={x} y={0} width={w} height={22} fill={i % 2 === 0 ? C.dim : "transparent"} />;
        x += w + 1.4;
        return bar;
      })}
    </svg>
  );
}

// ─── Barre de stat (jauge horizontale) ────────────────────────────────────────
function StatBar({ label, value, max, color, suffix }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ color: C.dim, fontSize: 9, letterSpacing: 2 }}>{label}</span>
        <span style={{ color, fontSize: 11, fontWeight: "bold" }}>{value}{suffix || ""}</span>
      </div>
      <div style={{ height: 5, background: "#000", border: `1px solid ${C.line}` }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}88` }} />
      </div>
    </div>
  );
}

// ─── Sceau Decadence (logo circulaire, réemployé du codex) ───────────────────
function Seal({ size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `radial-gradient(circle at 35% 30%, ${C.emberBright}dd, transparent 55%), radial-gradient(circle at 65% 70%, ${C.violetBright}66, transparent 60%), ${C.ember}`,
      display: "grid", placeItems: "center",
      boxShadow: `0 0 0 1px ${C.gold}55, 0 4px 10px #00000088`,
    }}>
      <span style={{ fontFamily: "Georgia, serif", fontWeight: 800, fontSize: size * 0.46, color: C.glow }}>D</span>
    </div>
  );
}

// ─── CARD COMPONENT (tuile compacte de la grille) ─────────────────────────────
function PersonnageCard({ p, onClick }) {
  const foyer = FOYER_COLORS[p.foyer] || FOYER_COLORS["Noir"];
  return (
    <div
      onClick={() => onClick(p)}
      style={{
        cursor: "pointer",
        width: 200,
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderTop: `2px solid ${foyer.glow}`,
        overflow: "hidden",
        boxShadow: `0 0 18px ${foyer.glow}22, inset 0 0 30px #00000088`,
        transition: "transform 0.2s, box-shadow 0.2s",
        fontFamily: "'Courier New', monospace",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 0 30px ${foyer.glow}55, inset 0 0 30px #00000088`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 0 18px ${foyer.glow}22, inset 0 0 30px #00000088`;
      }}
    >
      <div style={{ position: "relative", height: 160, background: "#111" }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.nom} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: 44 }}>⚔</div>
        )}
        <div style={{ position: "absolute", top: 8, right: 8, background: "#000000cc", border: `1px solid ${foyer.glow}`, color: foyer.glow, fontSize: 9, padding: "2px 6px", letterSpacing: 1 }}>
          {RANG_INITIALS[p.rang] || p.rang?.toUpperCase()}
        </div>
        <div style={{ position: "absolute", top: 8, left: 8, background: "#000000cc", border: `1px solid ${C.goldDim}`, color: C.gold, fontSize: 9, padding: "2px 6px", letterSpacing: 1 }}>
          {p.organisation}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: `linear-gradient(transparent, ${C.panel})` }} />
      </div>

      <div style={{ padding: "10px 12px 6px" }}>
        <div style={{ color: C.bone, fontSize: 13, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", textShadow: `0 0 10px ${foyer.glow}` }}>
          {p.nom || "—"}
        </div>
        <div style={{ color: foyer.glow, fontSize: 10, marginTop: 2, letterSpacing: 2, opacity: 0.9 }}>
          ✦ FOYER {p.foyer?.toUpperCase()}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "6px 12px 10px", borderTop: `1px solid ${C.line}` }}>
        {[
          { label: "PV", val: p.vie, color: C.red },
          { label: "RA", val: p.ra, color: p.couleurAnima || C.violetBright },
          { label: "NIV", val: p.niveau ?? 1, color: C.gold },
          { label: "VIT", val: (p.vit ?? 0) + "m/s", color: "#4fa8d8" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#555", fontSize: 8, letterSpacing: 1 }}>{s.label}</span>
            <span style={{ color: s.color, fontSize: 12, fontWeight: "bold" }}>{s.val}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 3, background: `linear-gradient(90deg, ${p.couleurAnima || "#8800ff"}88, ${p.couleurAnima || "#8800ff"}, ${p.couleurAnima || "#8800ff"}88)` }} />
    </div>
  );
}

// ─── SKILL ICON (icône circulaire runique) ────────────────────────────────────
function SkillIcon({ skill, color, locked }) {
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "center",
      padding: "8px 10px", background: "#000000aa",
      border: `1px solid ${locked ? C.line : color + "55"}`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        display: "grid", placeItems: "center",
        background: locked ? "#111" : `radial-gradient(circle, ${color}33, #000 72%)`,
        border: `1px solid ${locked ? C.goldDim : color}`,
        color: locked ? "#444" : color,
        fontSize: 15,
      }}>
        {locked ? "🔒" : "◈"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: locked ? "#444" : C.bone, fontSize: 11.5, fontStyle: locked ? "italic" : "normal", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {locked ? "Verrouillé" : skill.nom}
        </div>
        <div style={{ color: "#555", fontSize: 9, letterSpacing: 1, marginTop: 2 }}>
          RÉC. {locked ? "—" : (skill.recharge || "—")}s · CD {locked ? "—" : (skill.cooldown || "—")}s
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL MODAL — la carte de licence complète ──────────────────────────────
function DetailModal({ p, onClose, foyer }) {
  const skills = normalizeSkills(p.techniques).slice(0, 4);
  while (skills.length < 4) skills.push(null);
  const aptTotal = (p.force || 0) + (p.vitesseApt || 0) + (p.agilite || 0) + (p.endurance || 0) + (p.controle || 0);
  const anima = p.couleurAnima || "#8800ff";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000d8",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      zIndex: 100, padding: "30px 16px", overflowY: "auto",
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.void,
          border: `1px solid ${C.goldDim}`,
          boxShadow: `0 0 0 1px #000, 0 0 70px ${foyer.glow}22, 0 30px 60px #000000cc`,
          width: "100%", maxWidth: 440,
          fontFamily: "'Courier New', monospace",
          position: "relative",
        }}
      >
        {/* Coins dorés décoratifs */}
        {[
          { top: 6, left: 6, borderWidth: "2px 0 0 2px" },
          { top: 6, right: 6, borderWidth: "2px 2px 0 0" },
          { bottom: 6, left: 6, borderWidth: "0 0 2px 2px" },
          { bottom: 6, right: 6, borderWidth: "0 2px 2px 0" },
        ].map((c, i) => (
          <div key={i} style={{ position: "absolute", width: 16, height: 16, borderColor: C.gold, borderStyle: "solid", zIndex: 5, ...c }} />
        ))}

        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14, zIndex: 6,
          background: "#000000aa", border: `1px solid ${C.line}`,
          color: C.dim, cursor: "pointer", padding: "4px 10px",
          fontSize: 14, fontFamily: "monospace",
        }}>✕</button>

        {/* ── En-tête ── */}
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${C.goldDim}`, display: "flex", alignItems: "center", gap: 12 }}>
          <Seal size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ color: C.gold, fontSize: 9, letterSpacing: 3 }}>DECADENCE · CODEX</div>
            <div style={{ color: C.bone, fontSize: 13, fontWeight: "bold", letterSpacing: 2 }}>LICENCE DE GUERRIER</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: `2px solid ${foyer.glow}`, display: "grid", placeItems: "center",
            color: foyer.glow, fontSize: 12, fontWeight: "bold", letterSpacing: 1,
            boxShadow: `0 0 10px ${foyer.glow}55`,
          }}>{RANG_INITIALS[p.rang] || "—"}</div>
        </div>

        {/* ── Illustration + magic circle ── */}
        <div style={{ position: "relative", height: 230, background: "#0a0a0a", overflow: "hidden" }}>
          <svg style={{ position: "absolute", inset: 0, opacity: 0.35 }} viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke={foyer.glow} strokeWidth="0.5" />
            <circle cx="100" cy="100" r="70" fill="none" stroke={foyer.glow} strokeWidth="0.5" strokeDasharray="2 4" />
            <circle cx="100" cy="100" r="50" fill="none" stroke={anima} strokeWidth="0.5" />
          </svg>
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.nom} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.82, position: "relative" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 70, color: "#222", position: "relative" }}>⚔</div>
          )}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(transparent 45%, ${C.void})` }} />
          <div style={{ position: "absolute", bottom: 10, left: 18, right: 18 }}>
            <div style={{ color: C.bone, fontSize: 21, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, textShadow: `0 0 20px ${foyer.glow}` }}>
              {p.nom || "—"}
            </div>
            <div style={{ color: foyer.glow, fontSize: 10.5, letterSpacing: 2, marginTop: 3 }}>
              [{p.pseudo || "SANS PSEUDO"}] · FOYER {p.foyer?.toUpperCase()} · {p.configuration}
            </div>
          </div>
        </div>

        {/* ── PLAYER PROFILE ── */}
        <div style={{ padding: "16px 20px 4px" }}>
          <SectionTitle>Profil</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 11.5 }}>
            <ProfileRow label="Sexe" val={p.sexe} /><ProfileRow label="Niveau" val={"Lv " + (p.niveau ?? 1)} />
            <ProfileRow label="Classe" val={p.classe || "—"} /><ProfileRow label="Titre" val={p.titre || "—"} />
            <ProfileRow label="Organisation" val={p.organisation} /><ProfileRow label="Rang" val={p.rang} />
          </div>
        </div>

        {/* ── APT ── */}
        <div style={{ padding: "16px 20px 4px" }}>
          <SectionTitle>Affinités (APT)</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <StatBar label="FORCE" value={p.force || 0} max={40} color={C.emberBright} />
            <StatBar label="VITESSE" value={p.vitesseApt || 0} max={40} color="#4fa8d8" />
            <StatBar label="AGILITÉ" value={p.agilite || 0} max={40} color={C.gold} />
            <StatBar label="ENDURANCE" value={p.endurance || 0} max={40} color={C.red} />
            <StatBar label="CONTRÔLE" value={p.controle || 0} max={40} color={anima} />
          </div>
          <div style={{ color: "#555", fontSize: 9.5, marginTop: 2 }}>Total investi : <span style={{ color: C.dim }}>{aptTotal} pts</span></div>
        </div>

        {/* ── STATS & RANKING ── */}
        <div style={{ padding: "16px 20px 4px" }}>
          <SectionTitle>Stats & Rang</SectionTitle>
          <StatBar label="VIE (PV)" value={p.vie || 0} max={200} color={C.red} />
          <StatBar label="ANIMA (RA)" value={p.ra || 0} max={100} color={anima} />
          <StatBar label="VITESSE DE POINTE" value={p.vit || 0} max={20} color={C.gold} suffix=" m/s" />
        </div>

        {/* ── WALLET ── */}
        <div style={{ padding: "16px 20px 4px" }}>
          <SectionTitle>Bourse</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: C.line }}>
            <WalletCell icon="●" label="Jetons" val={p.jetons ?? 0} color={C.gold} />
            <WalletCell icon="◆" label="Fragments" val={p.fragments ?? 0} color="#7fd3e8" />
            <WalletCell icon="—" label="Progression" val={`${p.xp ?? 0}/${p.xpSeuil ?? 100}`} color={C.dim} />
          </div>
        </div>

        {/* ── SKILLS ── */}
        <div style={{ padding: "16px 20px 4px" }}>
          <SectionTitle>Compétences</SectionTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {skills.map((s, i) => (
              <SkillIcon key={i} skill={s || EMPTY_SKILL} color={anima} locked={!s} />
            ))}
          </div>
        </div>

        {/* ── ITEMS & EQUIPMENT ── */}
        <div style={{ padding: "16px 20px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <SectionTitle>Arme</SectionTitle>
            <div style={{ color: p.arme ? C.bone : "#444", fontSize: 12, fontStyle: p.arme ? "normal" : "italic" }}>{p.arme || "Aucune arme déclarée"}</div>
          </div>
          <div>
            <SectionTitle>Accessoire</SectionTitle>
            <div style={{ color: p.accessoire ? C.bone : "#444", fontSize: 12, fontStyle: p.accessoire ? "normal" : "italic" }}>{p.accessoire || "Aucun"}</div>
          </div>
        </div>

        {/* ── FOOTER / METADATA ── */}
        <div style={{
          marginTop: 12, padding: "14px 20px 20px",
          borderTop: `1px solid ${C.goldDim}`,
          display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10,
        }}>
          <div>
            <Barcode seed={p.id} />
            <div style={{ color: "#444", fontSize: 8.5, letterSpacing: 1, marginTop: 4 }}>{chipCode(p)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#555", fontSize: 9 }}>{inscriptionDate(p)}</div>
            <div style={{ color: C.dim, fontSize: 9.5, fontStyle: "italic", marginTop: 2 }}>Decadence — Codex des Guerriers</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ color: C.gold, fontSize: 9.5, letterSpacing: 3, marginBottom: 8, borderBottom: `1px solid ${C.line}`, paddingBottom: 5 }}>
      {children.toString().toUpperCase()}
    </div>
  );
}
function ProfileRow({ label, val }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ color: "#555" }}>{label}</span>
      <span style={{ color: C.bone }}>{val || "—"}</span>
    </div>
  );
}
function WalletCell({ icon, label, val, color }) {
  return (
    <div style={{ background: "#0a0a0a", padding: "10px 4px", textAlign: "center" }}>
      <div style={{ color, fontSize: 14 }}>{icon}</div>
      <div style={{ color: C.bone, fontSize: 13, fontWeight: "bold", marginTop: 2 }}>{val}</div>
      <div style={{ color: "#444", fontSize: 8, letterSpacing: 1, marginTop: 1 }}>{label.toUpperCase()}</div>
    </div>
  );
}

// ─── FORM ─────────────────────────────────────────────────────────────────────
function AdminForm({ initial, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(() => {
    const base = initial || DEFAULT_FORM;
    return { ...DEFAULT_FORM, ...base, techniques: normalizeSkills(base.techniques) };
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setSkill = (i, k, v) => setForm(f => {
    const list = [...f.techniques];
    list[i] = { ...(list[i] || EMPTY_SKILL), [k]: v };
    return { ...f, techniques: list };
  });
  const addSkill = () => setForm(f => f.techniques.length >= 6 ? f : { ...f, techniques: [...f.techniques, { ...EMPTY_SKILL }] });
  const removeSkill = (i) => setForm(f => ({ ...f, techniques: f.techniques.filter((_, idx) => idx !== i) }));

  const inputStyle = {
    background: "#0d0d0d", border: `1px solid ${C.line}`,
    color: "#c0b8a8", padding: "8px 10px", width: "100%",
    fontFamily: "monospace", fontSize: 12, borderRadius: 1,
    boxSizing: "border-box",
  };
  const labelStyle = { color: "#555", fontSize: 10, letterSpacing: 2, marginBottom: 4, display: "block" };
  const groupTitle = { color: C.gold, fontSize: 10, letterSpacing: 3, margin: "18px 0 10px", borderBottom: `1px solid ${C.line}`, paddingBottom: 6 };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000cc",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: 20,
    }}>
      <div style={{
        background: "#0a0a0a", border: `1px solid ${C.goldDim}`,
        width: "100%", maxWidth: 480,
        maxHeight: "90vh", overflowY: "auto",
        fontFamily: "monospace", padding: 24,
      }}>
        <div style={{ color: C.emberBright, fontSize: 11, letterSpacing: 3, marginBottom: 6 }}>
          {initial ? "✦ MODIFIER LA LICENCE" : "✦ NOUVELLE LICENCE"}
        </div>

        <div style={groupTitle}>Identité</div>
        {[
          { label: "NOM DU PERSONNAGE", key: "nom" },
          { label: "PSEUDO", key: "pseudo" },
          { label: "CLASSE / RÔLE", key: "classe" },
          { label: "TITRE", key: "titre" },
          { label: "URL DE L'IMAGE", key: "imageUrl" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <label style={labelStyle}>{f.label}</label>
            <input style={inputStyle} value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>SEXE</label>
            <select style={inputStyle} value={form.sexe} onChange={e => set("sexe", e.target.value)}>
              <option value="M">M</option><option value="F">F</option><option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>NIVEAU</label>
            <input style={inputStyle} type="number" value={form.niveau} onChange={e => set("niveau", Number(e.target.value))} />
          </div>
        </div>

        <div style={groupTitle}>Foyer & Configuration</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>FOYER</label>
            <select style={inputStyle} value={form.foyer} onChange={e => set("foyer", e.target.value)}>
              {FOYERS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>CONFIGURATION</label>
            <select style={inputStyle} value={form.configuration} onChange={e => set("configuration", e.target.value)}>
              {CONFIGS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>ORGANISATION</label>
            <select style={inputStyle} value={form.organisation} onChange={e => set("organisation", e.target.value)}>
              {ORGS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>RANG</label>
            <select style={inputStyle} value={form.rang} onChange={e => set("rang", e.target.value)}>
              {RANGS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div style={groupTitle}>Affinités (APT)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[
            { label: "FORCE", key: "force" },
            { label: "VITESSE", key: "vitesseApt" },
            { label: "AGILITÉ", key: "agilite" },
            { label: "ENDURANCE", key: "endurance" },
            { label: "CONTRÔLE", key: "controle" },
          ].map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input style={inputStyle} type="number" value={form[f.key]} onChange={e => set(f.key, Number(e.target.value))} />
            </div>
          ))}
        </div>

        <div style={groupTitle}>Stats & Anima</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[
            { label: "VIE", key: "vie" },
            { label: "RA", key: "ra" },
            { label: "VIT. POINTE (m/s)", key: "vit" },
          ].map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input style={inputStyle} type="number" value={form[f.key]} onChange={e => set(f.key, Number(e.target.value))} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>COULEUR D'ANIMA</label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input type="color" value={form.couleurAnima} onChange={e => set("couleurAnima", e.target.value)}
              style={{ width: 40, height: 32, border: "none", background: "none", cursor: "pointer" }} />
            <input style={{ ...inputStyle, flex: 1 }} value={form.couleurAnima} onChange={e => set("couleurAnima", e.target.value)} />
          </div>
        </div>

        <div style={groupTitle}>Bourse</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[
            { label: "JETONS", key: "jetons" },
            { label: "FRAGMENTS", key: "fragments" },
            { label: "XP", key: "xp" },
            { label: "SEUIL XP", key: "xpSeuil" },
          ].map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input style={inputStyle} type="number" value={form[f.key]} onChange={e => set(f.key, Number(e.target.value))} />
            </div>
          ))}
        </div>

        <div style={groupTitle}>Compétences ({form.techniques.length}/6)</div>
        <div style={{ display: "grid", gap: 10, marginBottom: 6 }}>
          {form.techniques.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 6, alignItems: "center" }}>
              <input style={inputStyle} placeholder="Nom de la compétence" value={s.nom} onChange={e => setSkill(i, "nom", e.target.value)} />
              <input style={inputStyle} placeholder="Récup. (s)" value={s.recharge} onChange={e => setSkill(i, "recharge", e.target.value)} />
              <input style={inputStyle} placeholder="Cooldown (s)" value={s.cooldown} onChange={e => setSkill(i, "cooldown", e.target.value)} />
              <button onClick={() => removeSkill(i)} style={{ background: "none", border: `1px solid ${C.line}`, color: "#666", cursor: "pointer", padding: "8px 10px" }}>✕</button>
            </div>
          ))}
        </div>
        {form.techniques.length < 6 && (
          <button onClick={addSkill} style={{
            background: "none", border: `1px dashed ${C.goldDim}`, color: C.gold,
            padding: "8px 12px", cursor: "pointer", fontFamily: "monospace", fontSize: 11, marginBottom: 12, width: "100%",
          }}>+ AJOUTER UNE COMPÉTENCE</button>
        )}

        <div style={groupTitle}>Équipement</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>ARME</label>
            <input style={inputStyle} value={form.arme} onChange={e => set("arme", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>ACCESSOIRE</label>
            <input style={inputStyle} value={form.accessoire} onChange={e => set("accessoire", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onSave(form)} style={{
            flex: 1, background: "#1a1a1a", border: `1px solid ${C.emberBright}`,
            color: C.emberBright, padding: "10px", cursor: "pointer",
            fontFamily: "monospace", fontSize: 11, letterSpacing: 2,
          }}>SAUVEGARDER</button>
          <button onClick={onCancel} style={{
            flex: 1, background: "#0d0d0d", border: `1px solid ${C.line}`,
            color: "#555", padding: "10px", cursor: "pointer",
            fontFamily: "monospace", fontSize: 11, letterSpacing: 2,
          }}>ANNULER</button>
          {initial && (
            <button onClick={() => onDelete(initial.id)} style={{
              background: "#0d0d0d", border: "1px solid #550000",
              color: "#550000", padding: "10px 14px", cursor: "pointer",
              fontFamily: "monospace", fontSize: 14,
            }}>🗑</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [personnages, setPersonnages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailPerso, setDetailPerso] = useState(null);
  const [search, setSearch] = useState("");

  const isAdmin = ADMINS.includes(adminName.toUpperCase());

  useEffect(() => {
  const load = async () => {
    try {
      const res = await fetch(`${JSONBIN_URL}/latest`, {
        headers: { "X-Master-Key": JSONBIN_API_KEY }
      });
      const data = await res.json();
      setPersonnages(data.record || []);
    } catch (e) {
      console.error("Erreur de chargement :", e);
    }
    setLoading(false);
  };
  load();
}, []);

const save = async (list) => {
  setPersonnages(list); // mise à jour immédiate de l'affichage
  try {
    const res = await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY,
        "X-Bin-Versioning": "false"
      },
      body: JSON.stringify(list)
    });
    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    console.error("Erreur de sauvegarde :", e);
    alert("Sauvegarde échouée : " + e.message);
  }
};

  const handleLogin = () => {
    if (ADMINS.includes(adminInput.toUpperCase())) {
      setAdminName(adminInput.toUpperCase());
      setAdminError("");
    } else {
      setAdminError("Accès refusé. Nom non reconnu.");
    }
  };

  const handleSave = (form) => {
    let updated;
    if (editTarget) {
      updated = personnages.map(p => p.id === editTarget.id ? { ...form, id: editTarget.id } : p);
    } else {
      updated = [...personnages, { ...form, id: Date.now().toString() }];
    }
    save(updated);
    setShowForm(false);
    setEditTarget(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Supprimer cette licence ?")) return;
    save(personnages.filter(p => p.id !== id));
    setShowForm(false);
    setEditTarget(null);
  };

  const q = search.toLowerCase();
  const filtered = personnages.filter(p =>
    p.nom?.toLowerCase().includes(q) ||
    p.pseudo?.toLowerCase().includes(q) ||
    p.classe?.toLowerCase().includes(q) ||
    p.organisation?.toLowerCase().includes(q) ||
    p.foyer?.toLowerCase().includes(q)
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.void, display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontFamily: "monospace", fontSize: 13, letterSpacing: 3 }}>
      CHARGEMENT...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.void, color: "#c0b8a8" }}>

      <div style={{ borderBottom: `1px solid ${C.line}`, padding: "20px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Seal size={30} />
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 17, fontWeight: "bold", color: C.emberBright, letterSpacing: 4, textShadow: `0 0 20px ${C.emberBright}55` }}>DECADENCE</div>
            <div style={{ color: "#444", fontSize: 9, letterSpacing: 3, marginTop: 2 }}>
              CODEX DES LICENCES · {personnages.length} GUERRIER{personnages.length > 1 ? "S" : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isAdmin ? (
            <>
              <div style={{ color: C.emberBright, fontSize: 10, letterSpacing: 2 }}>✦ ADMIN : {adminName}</div>
              <button onClick={() => { setShowForm(true); setEditTarget(null); }} style={{
                background: "#1a0000", border: `1px solid ${C.emberBright}`, color: C.emberBright,
                padding: "6px 14px", cursor: "pointer", fontFamily: "monospace", fontSize: 10, letterSpacing: 2,
              }}>+ NOUVELLE LICENCE</button>
              <button onClick={() => setAdminName("")} style={{
                background: "#0d0d0d", border: `1px solid ${C.line}`, color: "#444",
                padding: "6px 10px", cursor: "pointer", fontFamily: "monospace", fontSize: 10,
              }}>✕</button>
            </>
          ) : (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                placeholder="Nom admin..."
                value={adminInput}
                onChange={e => setAdminInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{ background: "#0d0d0d", border: `1px solid ${C.line}`, color: "#888", padding: "6px 10px", fontFamily: "monospace", fontSize: 11, width: 130 }}
              />
              <button onClick={handleLogin} style={{ background: "#0d0d0d", border: `1px solid ${C.line}`, color: "#666", padding: "6px 12px", cursor: "pointer", fontFamily: "monospace", fontSize: 10 }}>ENTRER</button>
              {adminError && <span style={{ color: "#a04040", fontSize: 10 }}>{adminError}</span>}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 30px", borderBottom: `1px solid ${C.line}` }}>
        <input
          placeholder="Rechercher un guerrier..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: "#0d0d0d", border: `1px solid ${C.line}`, color: "#888", padding: "8px 14px", fontFamily: "monospace", fontSize: 12, width: 260 }}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, padding: 30 }}>
        {filtered.length === 0 ? (
          <div style={{ color: "#222", fontSize: 13, fontFamily: "monospace", letterSpacing: 2, padding: "60px 0", width: "100%", textAlign: "center" }}>
            {personnages.length === 0 ? "Aucune licence enregistrée. Connectez-vous en tant qu'admin pour en créer une." : "Aucun résultat pour cette recherche."}
          </div>
        ) : filtered.map(p => (
          <PersonnageCard
            key={p.id}
            p={p}
            onClick={isAdmin ? (perso) => { setEditTarget(perso); setShowForm(true); } : (perso) => setDetailPerso(perso)}
          />
        ))}
      </div>

      {isAdmin && (
        <div style={{ margin: "0 30px 30px", padding: "10px 14px", background: "#0d0000", border: "1px solid #330000", color: "#663333", fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>
          ✦ MODE ADMIN ACTIF — Cliquez sur une carte pour la modifier. Les licences sont partagées et visibles par tous les joueurs.
        </div>
      )}

      {detailPerso && !isAdmin && (
        <DetailModal p={detailPerso} foyer={FOYER_COLORS[detailPerso.foyer] || FOYER_COLORS["Noir"]} onClose={() => setDetailPerso(null)} />
      )}

      {showForm && isAdmin && (
        <AdminForm initial={editTarget} onSave={handleSave} onCancel={() => { setShowForm(false); setEditTarget(null); }} onDelete={handleDelete} />
      )}
    </div>
  );
}
