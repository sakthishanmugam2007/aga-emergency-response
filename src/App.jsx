import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────
// SUPABASE CONFIG
// ─────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://qyoektirhvroaarnzazy.supabase.co";
const SUPABASE_KEY = "sb_publishable_3LBPKOMdfUMeEkguQO98ug_7jcYg9ct";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const db = {
  getVolunteers: () => sbFetch("/volunteers?order=created_at.asc"),
  addVolunteer: (data) => sbFetch("/volunteers", { method: "POST", body: JSON.stringify(data) }),
  updateVolunteer: (id, data) => sbFetch(`/volunteers?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteVolunteer: (id) => sbFetch(`/volunteers?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" }),
};

// ─────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────
const ADMIN_PIN = "6202csacgspaga";
const CAMPUS_RADIUS_KM = 2.0;
const CAMPUS_CENTER = { lat: 11.0170, lng: 76.9630 };

const STRINGS = {
  ta: {
    appTitle: "AGA அவசர சேவை", appSubtitle: "Alert Golden Army PSGCAS Chapter",
    partnerText: "PSG கலை மற்றும் அறிவியல் கல்லூரி, கோயம்புத்தூர்",
    locationRequired: "இருப்பிட அனுமதி தேவை", locationRequiredDesc: "AGA அவசர சேவைக்கு உங்கள் இருப்பிடம் தேவை.",
    enableLocation: "இருப்பிடத்தை இயக்கு", sosButton: "SOS — அவசரம்",
    findMembers: "அருகிலுள்ள தன்னார்வலர்களைக் காண்க", emergencyContacts: "அவசர தொடர்புகள்",
    campusMap: "வளாக வரைபடம்", registerVolunteer: "தன்னார்வலராக பதிவு செய்க",
    home: "முகப்பு", volunteers: "தன்னார்வலர்கள்", register: "பதிவு", admin: "நிர்வாகி",
    totalVolunteers: "மொத்த தன்னார்வலர்கள்", activeVolunteers: "செயலில் உள்ளவர்கள்",
    sosToday: "இன்றைய SOS கோரிக்கைகள்", casesHandled: "கையாளப்பட்ட வழக்குகள்",
    available: "கிடைக்கிறது", unavailable: "கிடைக்கவில்லை",
  },
  en: {
    appTitle: "AGA EMERGENCY RESPONSE", appSubtitle: "Alert Golden Army PSGCAS Chapter",
    partnerText: "PSG College of Arts & Science, Coimbatore",
    locationRequired: "Location Access Required", locationRequiredDesc: "AGA Emergency Response needs your location.",
    enableLocation: "Enable Location", sosButton: "SOS — EMERGENCY",
    findMembers: "Find Nearby Volunteers", emergencyContacts: "Emergency Contacts",
    campusMap: "Campus Map", registerVolunteer: "Register as a Volunteer",
    home: "Home", volunteers: "Volunteers", register: "Register", admin: "Admin",
    totalVolunteers: "Total Volunteers", activeVolunteers: "Active Volunteers",
    sosToday: "SOS Requests Today", casesHandled: "Cases Handled",
    available: "Available", unavailable: "Unavailable",
  },
};

function useLang() {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem("aga_lang") || "ta"; } catch { return "ta"; } });
  function toggle() { const n = lang === "ta" ? "en" : "ta"; setLang(n); try { localStorage.setItem("aga_lang", n); } catch {} }
  return { lang, t: STRINGS[lang], toggle };
}

const DEFAULT_CONTACTS = [
  { key: "ambulance", icon: "🚑", label: "Ambulance", number: "108", desc: "National Emergency" },
  { key: "hospital", icon: "🏥", label: "Hospital", number: "+914222572180", desc: "Nearest Govt. Hospital" },
  { key: "security", icon: "🔐", label: "College Security", number: "+914222572177", desc: "PSG CAS Security" },
  { key: "fire", icon: "🚒", label: "Fire Service", number: "101", desc: "Fire Emergency" },
  { key: "helpdesk", icon: "🛎️", label: "College Help Desk", number: "+914222572178", desc: "General Assistance" },
  { key: "medical", icon: "⚕️", label: "Medical Room", number: "+914222572179", desc: "Campus Medical Center" },
];

const CAMPUS_LANDMARKS = [
  { name: "Main Block", lat: 11.0172, lng: 76.9628, icon: "🏛️" },
  { name: "Library", lat: 11.0168, lng: 76.9635, icon: "📚" },
  { name: "Canteen", lat: 11.0178, lng: 76.9633, icon: "🍽️" },
  { name: "Parking Area", lat: 11.0163, lng: 76.9625, icon: "🅿️" },
  { name: "Assembly Point", lat: 11.0175, lng: 76.9645, icon: "📢" },
  { name: "Medical Room", lat: 11.0180, lng: 76.9650, icon: "⚕️" },
];

let globalAlerts = [];
let alertListeners = [];
function subscribeAlerts(fn) { alertListeners.push(fn); return () => { alertListeners = alertListeners.filter(l => l !== fn); }; }
function pushAlert(alert) { globalAlerts = [alert, ...globalAlerts].slice(0, 80); alertListeners.forEach(fn => fn([...globalAlerts])); }
function sendVolunteerAlert(vol, type, extra = {}) {
  const messages = { call: "Someone is calling you for emergency help!", map: "Someone is viewing your location!", sos: "🚨 SOS ALERT — emergency help needed nearby!", approved: "Your volunteer application has been approved!", rejected: "Your application was not approved.", broadcast: extra.message || "Emergency broadcast from Admin." };
  pushAlert({ id: Date.now() + Math.random(), volId: vol?.id, volName: vol?.name || "All Volunteers", type, message: messages[type] || "New alert", time: new Date().toLocaleTimeString(), read: false, userLoc: extra.userLoc || null });
}

function playEmergencySound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const beep = (freq, start, dur, wave = "square", vol = 0.35) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = wave; osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0, now + start); gain.gain.linearRampToValueAtTime(vol, now + start + 0.03); gain.gain.linearRampToValueAtTime(0, now + start + dur);
      osc.start(now + start); osc.stop(now + start + dur + 0.02);
    };
    if (type === "call") { [0, 0.28, 0.56, 0.84].forEach((t, i) => beep(i % 2 === 0 ? 880 : 1100, t, 0.24)); }
    else if (type === "sos") { [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach((t, i) => beep(i % 2 === 0 ? 700 : 1300, t, 0.18, "sawtooth", 0.4)); }
    else { [0, 0.18, 0.36].forEach(t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = "sine"; o.frequency.setValueAtTime(1400, now + t); o.frequency.linearRampToValueAtTime(1800, now + t + 0.12); g.gain.setValueAtTime(0.3, now + t); g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.15); o.start(now + t); o.stop(now + t + 0.18); }); }
  } catch {}
}

function saveSession(p) { try { localStorage.setItem("aga_session", JSON.stringify(p)); } catch {} }
function getSession() { try { const r = localStorage.getItem("aga_session"); return r ? JSON.parse(r) : null; } catch { return null; } }

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = d => d * Math.PI / 180, dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function bearing(lat1, lng1, lat2, lng2) {
  const toRad = d => d * Math.PI / 180, dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2)), x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

const C = { navy: "#0A1628", navyMid: "#122040", navyLight: "#1A3058", gold: "#D4A017", red: "#C0392B", white: "#FFFFFF", gray: "#94A3B8", green: "#16A34A", blue: "#3B82F6" };
const S = {
  app: { fontFamily: "'Inter',system-ui,sans-serif", background: C.navy, minHeight: "100vh", color: C.white, maxWidth: 420, margin: "0 auto", position: "relative", overflowX: "hidden" },
  header: { background: C.navyMid, borderBottom: `2px solid ${C.gold}`, padding: "12px 12px 10px" },
  screen: { padding: "20px 16px", paddingBottom: 90 },
  btn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px 20px", borderRadius: 10, border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 12, transition: "all 0.15s" },
  btnRed: { background: C.red, color: C.white }, btnGold: { background: C.gold, color: C.navy },
  btnNavy: { background: C.navyLight, color: C.white, border: `1px solid ${C.gray}` },
  btnSm: { padding: "8px 14px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  card: { background: C.navyMid, border: `1px solid ${C.navyLight}`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 },
  cardGold: { background: C.navyMid, border: `1px solid ${C.gold}`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 },
  label: { fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  input: { width: "100%", background: C.navyLight, border: `1px solid ${C.navyLight}`, borderRadius: 8, padding: "10px 12px", color: C.white, fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none" },
  row: { display: "flex", gap: 10, alignItems: "center" },
  badge: ok => ({ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: ok ? "#14532d" : "#7f1d1d", color: ok ? "#86efac" : "#fca5a5" }),
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: C.navyMid, borderTop: `2px solid ${C.gold}`, display: "flex", zIndex: 100 },
  navBtn: a => ({ flex: 1, padding: "10px 4px 8px", background: "none", border: "none", color: a ? C.gold : C.gray, fontSize: 9, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }),
  sHead: { fontSize: 13, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 },
  chip: (sel, val) => ({ padding: "6px 12px", borderRadius: 20, border: `1px solid ${sel === val ? C.gold : C.navyLight}`, background: sel === val ? C.gold : C.navyLight, color: sel === val ? C.navy : C.gray, fontSize: 12, fontWeight: 600, cursor: "pointer", marginRight: 6, marginBottom: 6 }),
  statBox: { background: C.navyMid, border: `1px solid ${C.navyLight}`, borderRadius: 12, padding: "14px 10px", textAlign: "center" },
};

// ─── HEADER ───
function Header({ t, lang, onToggleLang }) {
  return (
    <div style={S.header}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <button onClick={onToggleLang} style={{ background: C.navyLight, border: `1px solid ${C.gold}`, borderRadius: 20, padding: "3px 10px", color: C.gold, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
          {lang === "ta" ? "தமிழ் / EN" : "EN / தமிழ்"}
        </button>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: C.white, letterSpacing: 0.3, margin: 0, lineHeight: 1.2 }}>{t.appTitle}</p>
        <p style={{ fontSize: 9.5, color: C.gold, fontWeight: 600, letterSpacing: 0.5, margin: "2px 0 0" }}>{t.appSubtitle}</p>
        <p style={{ fontSize: 8.5, color: C.gray, margin: "1px 0 0" }}>{t.partnerText}</p>
      </div>
    </div>
  );
}

// ─── LOCATION GATE ───
function LocationGate({ onEnable, t, lang, onToggleLang }) {
  return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column" }}>
      <Header t={t} lang={lang} onToggleLang={onToggleLang} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🚨</div>
          <div style={{ background: "#7f1d1d", border: `1px solid ${C.red}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
            <p style={{ color: "#fecaca", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>{t.locationRequired}</p>
            <p style={{ color: "#fca5a5", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{t.locationRequiredDesc}</p>
          </div>
          <button style={{ ...S.btn, ...S.btnGold, marginTop: 24 }} onClick={onEnable}>{t.enableLocation}</button>
        </div>
      </div>
    </div>
  );
}

// ─── LOADING ───
function LoadingScreen({ msg = "Loading..." }) {
  return (
    <div style={{ ...S.screen, textAlign: "center", paddingTop: 60 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
      <p style={{ color: C.gold, fontSize: 15, fontWeight: 700 }}>{msg}</p>
    </div>
  );
}

// ─── HOME ───
function HomeScreen({ userLoc, setScreen, t, onSOS, volunteers, sosCountToday }) {
  const activeCount = volunteers.filter(v => v.approved && v.online && v.availability).length;
  const totalCount = volunteers.filter(v => v.approved).length;
  return (
    <div style={S.screen}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ color: C.gray, fontSize: 12, margin: 0 }}>📍 Location active — ready to assist</p>
      </div>
      <button onClick={onSOS} style={{ ...S.btn, background: C.red, color: C.white, fontSize: 20, fontWeight: 800, padding: "22px 20px", borderRadius: 16, boxShadow: "0 0 24px rgba(192,57,43,0.5)", letterSpacing: 1, marginBottom: 16 }}>
        🚨 {t.sosButton}
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { icon: "🆘", label: t.findMembers, screen: "volunteers" },
          { icon: "📞", label: t.emergencyContacts, screen: "contacts" },
          { icon: "🗺️", label: t.campusMap, screen: "campusMap" },
          { icon: "📝", label: t.registerVolunteer, screen: "login" },
        ].map(b => (
          <button key={b.screen} style={{ ...S.btn, ...S.btnNavy, marginBottom: 0, flexDirection: "column", padding: "16px 8px", gap: 4 }} onClick={() => setScreen(b.screen)}>
            <span style={{ fontSize: 22 }}>{b.icon}</span>
            <span style={{ fontSize: 12 }}>{b.label}</span>
          </button>
        ))}
      </div>
      <div style={S.sHead}>📊 Dashboard</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={S.statBox}><p style={{ fontSize: 22, fontWeight: 800, color: C.gold, margin: 0 }}>{totalCount}</p><p style={{ fontSize: 11, color: C.gray, margin: "4px 0 0" }}>{t.totalVolunteers}</p></div>
        <div style={S.statBox}><p style={{ fontSize: 22, fontWeight: 800, color: C.green, margin: 0 }}>{activeCount}</p><p style={{ fontSize: 11, color: C.gray, margin: "4px 0 0" }}>{t.activeVolunteers}</p></div>
        <div style={S.statBox}><p style={{ fontSize: 22, fontWeight: 800, color: C.red, margin: 0 }}>{sosCountToday}</p><p style={{ fontSize: 11, color: C.gray, margin: "4px 0 0" }}>{t.sosToday}</p></div>
        <div style={S.statBox}><p style={{ fontSize: 22, fontWeight: 800, color: C.blue, margin: 0 }}>Live</p><p style={{ fontSize: 11, color: C.gray, margin: "4px 0 0" }}>Supabase DB</p></div>
      </div>
    </div>
  );
}

// ─── VOLUNTEERS ───
function VolunteersScreen({ userLoc, setScreen, setSelectedVol, volunteers }) {
  const [filter, setFilter] = useState("all");
  const withDist = volunteers.filter(v => v.approved).map(v => ({ ...v, distance: userLoc && v.lat && v.lng ? haversineMeters(userLoc.lat, userLoc.lng, parseFloat(v.lat), parseFloat(v.lng)) : 9999 })).filter(v => v.distance <= CAMPUS_RADIUS_KM * 1000);
  const displayed = withDist.filter(v => filter === "available" ? (v.availability && v.online) : filter === "certified" ? v.first_aid_certified : true).sort((a, b) => a.distance - b.distance);
  function callVol(vol) { window.location.href = `tel:${vol.phone}`; sendVolunteerAlert(vol, "call", { userLoc }); playEmergencySound("call"); }
  function viewMap(vol) { sendVolunteerAlert(vol, "map", { userLoc }); playEmergencySound("map"); setSelectedVol(vol); setScreen("map"); }
  const fmt = m => m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
  return (
    <div style={S.screen}>
      <div style={S.sHead}>🆘 Nearby Volunteers</div>
      <p style={{ color: C.gray, fontSize: 11, marginTop: -8, marginBottom: 14 }}>Within {CAMPUS_RADIUS_KM}km · live from Supabase</p>
      <div style={{ marginBottom: 16 }}>
        {["all", "available", "certified"].map(f => <button key={f} style={S.chip(filter, f)} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "available" ? "Available" : "Certified"}</button>)}
      </div>
      {displayed.length === 0 && <div style={{ ...S.card, textAlign: "center", padding: 32 }}><p style={{ color: C.gray, fontSize: 13 }}>No volunteers found within {CAMPUS_RADIUS_KM}km.</p></div>}
      {displayed.map(vol => (
        <div key={vol.id} style={S.cardGold}>
          <div style={{ ...S.row, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: C.navy, flexShrink: 0 }}>{vol.name.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.white, margin: 0 }}>{vol.name}</p>
              <p style={{ fontSize: 12, color: C.gray, margin: "2px 0 0" }}>{vol.department || vol.occupation} {vol.year ? `· ${vol.year}` : ""}</p>
            </div>
            <div style={{ textAlign: "right" }}><p style={{ fontSize: 22, fontWeight: 800, color: C.gold, margin: 0 }}>{fmt(vol.distance)}</p><p style={{ fontSize: 12, color: C.gray }}>away</p></div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={S.badge(vol.online)}>{vol.online ? "Online" : "Offline"}</span>
            <span style={S.badge(vol.availability)}>{vol.availability ? "Available" : "Unavailable"}</span>
            <span style={S.badge(vol.first_aid_certified)}>{vol.first_aid_certified ? "Certified" : "Not Certified"}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btn, ...S.btnRed, marginBottom: 0, flex: 1, padding: "10px 12px", fontSize: 13 }} onClick={() => callVol(vol)}>📞 Call Now</button>
            <button style={{ ...S.btn, ...S.btnNavy, marginBottom: 0, flex: 1, padding: "10px 12px", fontSize: 13 }} onClick={() => viewMap(vol)}>🗺 View Map</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAP ───
function MapScreen({ userLoc, selectedVol, setScreen }) {
  const vol = selectedVol;
  if (!vol) { setScreen("volunteers"); return null; }
  const uLat = userLoc?.lat || CAMPUS_CENTER.lat, uLng = userLoc?.lng || CAMPUS_CENTER.lng;
  const exactDist = vol.lat && vol.lng ? haversineMeters(uLat, uLng, vol.lat, vol.lng) : 500;
  const walkMin = Math.max(1, Math.round(exactDist / 80));
  const deg = vol.lat && vol.lng ? bearing(uLat, uLng, vol.lat, vol.lng) : 0;
  const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${uLat}%2C${uLng}%3B${vol.lat}%2C${vol.lng}`;
  return (
    <div style={S.screen}>
      <button style={{ ...S.btnSm, ...S.btnNavy, marginBottom: 16, width: "auto" }} onClick={() => setScreen("volunteers")}>← Back</button>
      <div style={S.sHead}>🗺 Volunteer Location</div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={S.row}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: C.navy }}>{vol.name.charAt(0)}</div>
          <div><p style={{ fontSize: 15, fontWeight: 700, color: C.white, margin: 0 }}>{vol.name}</p><p style={{ fontSize: 12, color: C.gray, margin: "2px 0 0" }}>{vol.department || vol.occupation}</p></div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ ...S.card, flex: 1, textAlign: "center", marginBottom: 0 }}><p style={{ fontSize: 20, margin: "0 0 4px" }}>📍</p><p style={{ color: C.gold, fontWeight: 800, fontSize: 18, margin: 0 }}>{Math.round(exactDist)}m</p><p style={{ color: C.gray, fontSize: 11, margin: 0 }}>Distance</p></div>
        <div style={{ ...S.card, flex: 1, textAlign: "center", marginBottom: 0 }}><p style={{ fontSize: 20, margin: "0 0 4px" }}>🚶</p><p style={{ color: C.gold, fontWeight: 800, fontSize: 18, margin: 0 }}>~{walkMin} min</p><p style={{ color: C.gray, fontSize: 11, margin: 0 }}>Walk Time</p></div>
      </div>
      <div style={{ background: C.navyLight, borderRadius: 12, height: 200, marginBottom: 12, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(212,160,23,0.15) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        {[1, 2, 3].map(r => <div key={r} style={{ position: "absolute", top: "50%", left: "50%", width: r * 56, height: r * 56, marginLeft: -(r * 28), marginTop: -(r * 28), border: `1px solid rgba(148,163,184,${0.35 - r * 0.08})`, borderRadius: "50%" }} />)}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.blue, border: `2px solid ${C.white}`, margin: "0 auto" }} /><p style={{ fontSize: 10, color: C.gray, margin: "4px 0 0" }}>You</p>
        </div>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: `rotate(${deg}deg) translateY(-78px) rotate(${-deg}deg) translate(-50%,-50%)`, textAlign: "center" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: C.gold, border: `2px solid ${C.navy}`, margin: "0 auto", boxShadow: "0 0 8px rgba(212,160,23,0.8)" }} />
          <p style={{ fontSize: 10, color: C.gold, fontWeight: 700, margin: "4px 0 0", whiteSpace: "nowrap" }}>{vol.name.split(" ")[0]}</p>
        </div>
      </div>
      <button style={{ ...S.btn, ...S.btnGold }} onClick={() => window.open(osmUrl, "_blank")}>🧭 Navigate to Volunteer</button>
      <button style={{ ...S.btn, ...S.btnRed }} onClick={() => window.open(`tel:${vol.phone}`, "_self")}>📞 Call {vol.name.split(" ")[0]}</button>
    </div>
  );
}

// ─── CAMPUS MAP ───
function CampusMapScreen({ setScreen }) {
  const bbox = `${CAMPUS_CENTER.lng - 0.006},${CAMPUS_CENTER.lat - 0.004},${CAMPUS_CENTER.lng + 0.006},${CAMPUS_CENTER.lat + 0.004}`;
  return (
    <div style={S.screen}>
      <button style={{ ...S.btnSm, ...S.btnNavy, marginBottom: 16, width: "auto" }} onClick={() => setScreen("home")}>← Back</button>
      <div style={S.sHead}>🗺️ Campus Map</div>
      <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16, border: `1px solid ${C.navyLight}` }}>
        <iframe title="campus-map" width="100%" height="240" style={{ border: 0 }} src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${CAMPUS_CENTER.lat},${CAMPUS_CENTER.lng}`} />
      </div>
      <div style={S.sHead}>📍 Key Locations</div>
      {CAMPUS_LANDMARKS.map(loc => (
        <div key={loc.name} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>{loc.icon}</span>
          <div><p style={{ fontSize: 14, fontWeight: 700, color: C.white, margin: 0 }}>{loc.name}</p><p style={{ fontSize: 11, color: C.gray, margin: "2px 0 0" }}>{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</p></div>
        </div>
      ))}
    </div>
  );
}

// ─── CONTACTS ───
function ContactsScreen({ canEdit = false }) {
  const [contacts, setContacts] = useState(() => { try { const r = localStorage.getItem("emergency_contacts"); return r ? JSON.parse(r) : DEFAULT_CONTACTS; } catch { return DEFAULT_CONTACTS; } });
  const [editingKey, setEditingKey] = useState(null);
  const [editIcon, setEditIcon] = useState(""); const [editLabel, setEditLabel] = useState(""); const [editNumber, setEditNumber] = useState(""); const [editDesc, setEditDesc] = useState(""); const [adding, setAdding] = useState(false);
  function persist(next) { setContacts(next); try { localStorage.setItem("emergency_contacts", JSON.stringify(next)); } catch {} }
  function startEdit(c) { setEditingKey(c.key); setEditIcon(c.icon); setEditLabel(c.label); setEditNumber(c.number); setEditDesc(c.desc); setAdding(false); }
  function startAdd() { setEditingKey("__new__"); setEditIcon("📞"); setEditLabel(""); setEditNumber(""); setEditDesc(""); setAdding(true); }
  function saveEdit() {
    if (!editLabel.trim() || !editNumber.trim()) return;
    if (adding) persist([...contacts, { key: `custom-${Date.now()}`, icon: editIcon || "📞", label: editLabel, number: editNumber, desc: editDesc }]);
    else persist(contacts.map(c => c.key === editingKey ? { ...c, icon: editIcon, label: editLabel, number: editNumber, desc: editDesc } : c));
    setEditingKey(null);
  }
  function deleteContact(key) { if (window.confirm("Remove this contact?")) persist(contacts.filter(c => c.key !== key)); }
  return (
    <div style={S.screen}>
      <div style={S.sHead}>📞 Emergency Contacts</div>
      {contacts.map(c => (
        <div key={c.key} style={{ background: C.red, borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 26, cursor: "pointer" }} onClick={() => window.open(`tel:${c.number}`, "_self")}>{c.icon}</span>
          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => window.open(`tel:${c.number}`, "_self")}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.white, margin: 0 }}>{c.label}</p>
            <p style={{ fontSize: 12, color: "#fecaca", margin: 0 }}>{c.desc}</p>
          </div>
          <div style={{ textAlign: "right", cursor: "pointer" }} onClick={() => window.open(`tel:${c.number}`, "_self")}>
            <p style={{ fontSize: 14, color: "#fecaca", fontWeight: 800, margin: 0 }}>{c.number}</p>
            <p style={{ fontSize: 10, color: "#fca5a5", margin: 0 }}>Tap to call</p>
          </div>
          {canEdit && (
            <div style={{ display: "flex", gap: 4 }}>
              <button style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: C.white, fontSize: 13 }} onClick={() => startEdit(c)}>✏️</button>
              <button style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: C.white, fontSize: 13 }} onClick={() => deleteContact(c.key)}>🗑️</button>
            </div>
          )}
        </div>
      ))}
      {canEdit && <button style={{ ...S.btn, ...S.btnNavy }} onClick={startAdd}>➕ Add Emergency Contact</button>}
      {canEdit && editingKey && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
          <div style={{ background: C.navyMid, borderRadius: 14, padding: 20, width: "100%", maxWidth: 340 }}>
            <p style={{ color: C.white, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>{adding ? "Add Contact" : "Edit Contact"}</p>
            <p style={S.label}>Icon</p><input style={S.input} value={editIcon} onChange={e => setEditIcon(e.target.value)} />
            <p style={S.label}>Label</p><input style={S.input} value={editLabel} onChange={e => setEditLabel(e.target.value)} />
            <p style={S.label}>Phone</p><input style={S.input} value={editNumber} onChange={e => setEditNumber(e.target.value)} />
            <p style={S.label}>Description</p><input style={S.input} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn, ...S.btnNavy, marginBottom: 0, flex: 1 }} onClick={() => setEditingKey(null)}>Cancel</button>
              <button style={{ ...S.btn, ...S.btnGold, marginBottom: 0, flex: 1 }} onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN ───
function LoginScreen({ onLoggedIn, setScreen, t }) {
  const [email, setEmail] = useState(""); const [error, setError] = useState("");
  function handleLogin() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@") || !trimmed.includes(".")) { setError("Please enter a valid college email ID."); return; }
    const existing = getSession();
    const profile = (existing && existing.email === trimmed) ? existing : { email: trimmed, registered: false, name: "", approved: false };
    saveSession(profile); onLoggedIn(profile);
  }
  return (
    <div style={S.screen}>
      <div style={S.sHead}>🔑 Volunteer Login</div>
      <div style={{ ...S.card, marginBottom: 16 }}><p style={{ color: C.gray, fontSize: 12, margin: 0, lineHeight: 1.6 }}>Sign in with your college email. Your profile is saved permanently in Supabase — logging in again restores everything.</p></div>
      <p style={S.label}>College Email ID *</p>
      <input style={S.input} type="email" placeholder="yourname@psgcas.edu.in" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} />
      {error && <p style={{ color: "#fca5a5", fontSize: 12, marginTop: -6, marginBottom: 12 }}>{error}</p>}
      <button style={{ ...S.btn, ...S.btnGold }} onClick={handleLogin}>Continue</button>
      <button style={{ ...S.btn, ...S.btnNavy }} onClick={() => setScreen("home")}>Cancel</button>
    </div>
  );
}

// ─── REGISTER ───
function RegisterScreen({ setScreen, session, onRegistered }) {
  const [form, setForm] = useState({ name: session?.name || "", email: session?.email || "", roll: "", phone: "", department: "", year: "", occupation: "", first_aid_trained: null, first_aid_certified: null, remarks: "" });
  const [submitted, setSubmitted] = useState(false); const [loading, setLoading] = useState(false); const [errors, setErrors] = useState({});
  function update(k, v) { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: null })); }
  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid college email required.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    if (!form.remarks.trim()) e.remarks = "First aid training details required.";
    if (form.first_aid_certified === null) e.first_aid_certified = "Please select Yes or No.";
    setErrors(e); return Object.keys(e).length === 0;
  }
  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await db.addVolunteer({ name: form.name, roll: form.roll, email: form.email, phone: form.phone, department: form.department, year: form.year, occupation: form.occupation, first_aid_trained: form.first_aid_trained || false, first_aid_certified: form.first_aid_certified || false, remarks: form.remarks, approved: false, online: false, availability: true, lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng });
      const profile = { ...session, registered: true, approved: false, name: form.name };
      saveSession(profile); onRegistered(profile); setSubmitted(true);
    } catch (err) { alert("Error saving to database: " + err.message); }
    setLoading(false);
  }
  function YesNo({ value, onChange, error }) {
    return <div>{[true, false].map(v => <button key={String(v)} style={S.chip(value, v)} onClick={() => onChange(v)}>{v ? "Yes" : "No"}</button>)}{error && <p style={{ color: "#fca5a5", fontSize: 11, marginBottom: 12 }}>{error}</p>}</div>;
  }
  if (submitted) return (
    <div style={{ ...S.screen, textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
      <p style={{ color: C.gold, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Application Submitted!</p>
      <p style={{ color: C.gray, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Saved to Supabase database. Admin will review and approve your application.</p>
      <button style={{ ...S.btn, ...S.btnGold }} onClick={() => setScreen("home")}>Back to Home</button>
    </div>
  );
  return (
    <div style={S.screen}>
      <div style={S.sHead}>📝 Volunteer Registration</div>
      <div style={{ ...S.card, marginBottom: 16 }}><p style={{ color: C.gold, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>SAVED TO SUPABASE</p><p style={{ color: C.gray, fontSize: 12, margin: 0 }}>Your data is permanently stored. Admin approval required to appear in emergency search.</p></div>
      {[["Full Name *", "name", "text", "e.g. Karthik R"], ["Roll Number (optional)", "roll", "text", "e.g. 23CS101"], ["College Email *", "email", "email", "you@psgcas.edu.in"], ["Phone Number *", "phone", "tel", "+91 9XXXXXXXXX"], ["Department (optional)", "department", "text", "e.g. Computer Science"], ["Year of Study (optional)", "year", "text", "e.g. 2nd Year"], ["Occupation (optional)", "occupation", "text", "Student / Doctor / Faculty"]].map(([label, key, type, placeholder]) => (
        <div key={key}>
          <p style={S.label}>{label}</p>
          <input style={S.input} type={type} value={form[key]} onChange={e => update(key, e.target.value)} placeholder={placeholder} />
          {errors[key] && <p style={{ color: "#fca5a5", fontSize: 11, marginTop: -8, marginBottom: 12 }}>{errors[key]}</p>}
        </div>
      ))}
      <p style={S.label}>First Aid Training Completed?</p>
      <YesNo value={form.first_aid_trained} onChange={v => update("first_aid_trained", v)} />
      <p style={S.label}>First Aid Certificate? *</p>
      <YesNo value={form.first_aid_certified} onChange={v => update("first_aid_certified", v)} error={errors.first_aid_certified} />
      <p style={S.label}>Training Details *</p>
      <input style={S.input} value={form.remarks} onChange={e => update("remarks", e.target.value)} placeholder="e.g. Red Cross Basic First Aid, 2024" />
      {errors.remarks && <p style={{ color: "#fca5a5", fontSize: 11, marginTop: -8, marginBottom: 12 }}>{errors.remarks}</p>}
      <button style={{ ...S.btn, ...S.btnGold }} onClick={handleSubmit} disabled={loading}>{loading ? "Saving to Supabase..." : "Submit Application"}</button>
      <button style={{ ...S.btn, ...S.btnNavy }} onClick={() => setScreen("home")}>Cancel</button>
    </div>
  );
}

// ─── ALERT PANEL ───
function AlertPanel() {
  const [alerts, setAlerts] = useState([...globalAlerts]);
  useEffect(() => subscribeAlerts(a => setAlerts([...a])), []);
  function markRead(id) { setAlerts(p => p.map(a => a.id === id ? { ...a, read: true } : a)); }
  const iconFor = t => ({ call: "📞", map: "🗺", sos: "🚨", approved: "✅", rejected: "❌", broadcast: "📢" }[t] || "🔔");
  if (alerts.length === 0) return <div style={{ ...S.card, textAlign: "center", padding: 28 }}><p style={{ fontSize: 28, margin: "0 0 8px" }}>🔔</p><p style={{ color: C.gray, fontSize: 13, margin: 0 }}>No alerts yet.</p></div>;
  return (
    <div>
      {alerts.map(a => (
        <div key={a.id} onClick={() => markRead(a.id)} style={{ ...S.card, border: `1px solid ${(a.type === "call" || a.type === "sos") ? C.red : C.gold}`, background: a.read ? C.navyMid : ((a.type === "call" || a.type === "sos") ? "#2d0a0a" : "#1a1400"), cursor: "pointer" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{iconFor(a.type)}</span>
            <div style={{ flex: 1 }}>
              {!a.read && <span style={{ fontSize: 9, background: C.red, color: C.white, padding: "1px 6px", borderRadius: 10, fontWeight: 800 }}>NEW</span>}
              <p style={{ color: C.white, fontSize: 12, margin: "4px 0" }}>{a.message}</p>
              {a.userLoc && <p style={{ color: "#fbbf24", fontSize: 11, margin: "0 0 4px" }}>📍 {a.userLoc.lat.toFixed(4)}, {a.userLoc.lng.toFixed(4)}</p>}
              <p style={{ color: C.gray, fontSize: 10, margin: 0 }}>{a.volName} · {a.time}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN ───
function AdminScreen({ volunteers, setVolunteers, sosCountToday }) {
  const [tab, setTab] = useState("alerts"); const [pin, setPin] = useState(""); const [unlocked, setUnlocked] = useState(false);
  const [alertCount, setAlertCount] = useState(0); const [broadcastMsg, setBroadcastMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  useEffect(() => subscribeAlerts(a => setAlertCount(a.filter(x => !x.read).length)), []);
  if (!unlocked) return (
    <div style={S.screen}>
      <div style={S.sHead}>🔐 Admin Access</div>
      <div style={{ ...S.card, textAlign: "center", padding: 32 }}>
        <p style={{ color: C.gray, fontSize: 13, marginBottom: 16 }}>Enter admin code</p>
        <input style={{ ...S.input, textAlign: "center", fontSize: 16, letterSpacing: 2 }} type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Admin code" />
        <button style={{ ...S.btn, ...S.btnGold }} onClick={() => { if (pin === ADMIN_PIN) setUnlocked(true); else alert("Invalid admin code."); }}>Unlock Dashboard</button>
      </div>
    </div>
  );
  const pending = volunteers.filter(v => !v.approved);
  const approved = volunteers.filter(v => v.approved);

  async function approve(vol) {
    setActionLoading(true);
    try {
      await db.updateVolunteer(vol.id, { approved: true, online: true, availability: true });
      setVolunteers(p => p.map(x => x.id === vol.id ? { ...x, approved: true, online: true, availability: true } : x));
      sendVolunteerAlert(vol, "approved"); playEmergencySound("map");
    } catch (err) { alert("Error: " + err.message); }
    setActionLoading(false);
  }

  async function reject(vol) {
    if (!window.confirm(`Reject ${vol.name}?`)) return;
    setActionLoading(true);
    try {
      await db.deleteVolunteer(vol.id);
      setVolunteers(p => p.filter(x => x.id !== vol.id));
      sendVolunteerAlert(vol, "rejected");
    } catch (err) { alert("Error: " + err.message); }
    setActionLoading(false);
  }

  async function removeVolunteer(vol) {
    if (!window.confirm(`Remove ${vol.name}?`)) return;
    setActionLoading(true);
    try {
      await db.deleteVolunteer(vol.id);
      setVolunteers(p => p.filter(x => x.id !== vol.id));
    } catch (err) { alert("Error: " + err.message); }
    setActionLoading(false);
  }

  function sendBroadcast() {
    if (!broadcastMsg.trim()) return;
    approved.forEach(v => sendVolunteerAlert(v, "broadcast", { message: broadcastMsg }));
    playEmergencySound("sos"); setBroadcastMsg("");
    alert(`Broadcast sent to ${approved.length} volunteer(s).`);
  }

  const tabs = [
    { k: "alerts", label: `🔔 Alerts${alertCount > 0 ? ` (${alertCount})` : ""}` },
    { k: "pending", label: `⏳ Pending (${pending.length})` },
    { k: "approved", label: `✅ Approved (${approved.length})` },
    { k: "contacts", label: `📞 Contacts` },
    { k: "broadcast", label: `📢 Broadcast` },
  ];

  return (
    <div style={S.screen}>
      <div style={S.sHead}>🛡 Admin Dashboard</div>
      {actionLoading && <div style={{ ...S.card, textAlign: "center", marginBottom: 12 }}><p style={{ color: C.gold, fontSize: 12, margin: 0 }}>⏳ Saving to Supabase...</p></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        {tabs.map(({ k, label }) => <button key={k} style={{ ...S.btn, ...(tab === k ? S.btnGold : S.btnNavy), marginBottom: 0, padding: "9px 6px", fontSize: 11 }} onClick={() => setTab(k)}>{label}</button>)}
      </div>
      {tab === "alerts" && <AlertPanel />}
      {tab === "contacts" && <ContactsScreen canEdit />}
      {tab === "broadcast" && (
        <div style={S.card}>
          <p style={S.label}>Broadcast Message</p>
          <textarea style={{ ...S.input, minHeight: 90, resize: "vertical", fontFamily: "inherit" }} value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="e.g. Campus drill at 3 PM today." />
          <button style={{ ...S.btn, ...S.btnGold, marginBottom: 0 }} onClick={sendBroadcast}>📢 Send to All Approved Volunteers</button>
        </div>
      )}
      {(tab === "pending" || tab === "approved") && (
        <>
          {(tab === "pending" ? pending : approved).length === 0 && <div style={{ ...S.card, textAlign: "center", padding: 32 }}><p style={{ color: C.gray, fontSize: 13 }}>No {tab} volunteers.</p></div>}
          {(tab === "pending" ? pending : approved).map(vol => (
            <div key={vol.id} style={S.card}>
              <div style={{ ...S.row, marginBottom: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: vol.approved ? C.gold : C.gray, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: C.navy, flexShrink: 0 }}>{vol.name.charAt(0)}</div>
                <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 700, color: C.white, margin: 0 }}>{vol.name}</p><p style={{ fontSize: 11, color: C.gray, margin: "2px 0 0" }}>{vol.department || vol.occupation || "—"} {vol.year ? `· ${vol.year}` : ""}</p></div>
                {vol.approved && <span style={S.badge(vol.online)}>{vol.online ? "Online" : "Offline"}</span>}
              </div>
              <div style={{ fontSize: 12, color: C.gray, marginBottom: 10, lineHeight: 1.7 }}>
                {vol.roll && <p style={{ margin: 0 }}>🎓 {vol.roll}</p>}
                <p style={{ margin: 0 }}>📧 {vol.email}</p>
                <p style={{ margin: 0 }}>📞 {vol.phone}</p>
                {vol.occupation && <p style={{ margin: 0 }}>💼 {vol.occupation}</p>}
                <p style={{ margin: 0 }}>🏅 Certified: {vol.first_aid_certified ? "Yes ✅" : "No ❌"}</p>
                {vol.remarks && <p style={{ margin: 0 }}>📋 {vol.remarks}</p>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!vol.approved && <button style={{ ...S.btnSm, background: C.green, color: C.white, flex: 1 }} onClick={() => approve(vol)} disabled={actionLoading}>✓ Approve</button>}
                <button style={{ ...S.btnSm, background: C.red, color: C.white, flex: 1 }} onClick={() => vol.approved ? removeVolunteer(vol) : reject(vol)} disabled={actionLoading}>{vol.approved ? "Remove" : "✗ Reject"}</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── ROOT APP ───
export default function EmergencyApp() {
  const { lang, t, toggle: toggleLang } = useLang();
  const [screen, setScreen] = useState("home");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [selectedVol, setSelectedVol] = useState(null);
  const [toast, setToast] = useState(null);
  const [alertBadge, setAlertBadge] = useState(0);
  const [session, setSession] = useState(() => getSession());
  const [volunteers, setVolunteers] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [sosCountToday, setSosCountToday] = useState(0);

  // Load volunteers from Supabase on startup
  useEffect(() => {
    if (locationEnabled) {
      setDbLoading(true);
      db.getVolunteers().then(data => { setVolunteers(data); setDbLoading(false); }).catch(err => { console.error(err); setDbLoading(false); });
    }
  }, [locationEnabled]);

  useEffect(() => subscribeAlerts(alerts => {
    setAlertBadge(alerts.filter(a => !a.read).length);
    const latest = alerts[0];
    if (latest) { setToast(latest); setTimeout(() => setToast(null), 4500); }
  }), []);

  function enableLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationEnabled(true); },
        () => { setUserLoc({ lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng }); setLocationEnabled(true); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setUserLoc({ lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng });
      setLocationEnabled(true);
    }
  }

  function triggerSOS() {
    const nearby = volunteers.filter(v => v.approved && v.online && v.availability).map(v => ({ ...v, distance: userLoc && v.lat ? haversineMeters(userLoc.lat, userLoc.lng, v.lat, v.lng) : 500 })).filter(v => v.distance <= CAMPUS_RADIUS_KM * 1000).sort((a, b) => a.distance - b.distance);
    if (nearby.length === 0) { alert("No available volunteers nearby. Please call Emergency Contacts directly."); setScreen("contacts"); return; }
    nearby.forEach(v => sendVolunteerAlert(v, "sos", { userLoc }));
    playEmergencySound("sos"); setSosCountToday(c => c + 1);
    alert(`🚨 SOS sent to ${nearby.length} nearby volunteer(s). Help is on the way.`);
  }

  function handleLoggedIn(profile) { setSession(profile); setScreen(profile.registered ? "home" : "register"); }
  function handleRegistered(profile) {
    setSession(profile);
    // Refresh volunteers from Supabase
    db.getVolunteers().then(data => setVolunteers(data)).catch(() => {});
  }

  if (!locationEnabled) return <LocationGate onEnable={enableLocation} t={t} lang={lang} onToggleLang={toggleLang} />;

  const navItems = [
    { id: "home", icon: "🏠", label: t.home },
    { id: "volunteers", icon: "🆘", label: t.volunteers },
    { id: "register", icon: "📝", label: t.register },
    { id: "admin", icon: "🛡", label: t.admin },
  ];

  const screens = {
    home: <HomeScreen userLoc={userLoc} setScreen={setScreen} t={t} onSOS={triggerSOS} volunteers={volunteers} sosCountToday={sosCountToday} />,
    volunteers: dbLoading ? <LoadingScreen msg="Loading volunteers from Supabase..." /> : <VolunteersScreen userLoc={userLoc} setScreen={setScreen} setSelectedVol={setSelectedVol} volunteers={volunteers} />,
    map: <MapScreen userLoc={userLoc} selectedVol={selectedVol} setScreen={setScreen} />,
    campusMap: <CampusMapScreen setScreen={setScreen} />,
    contacts: <ContactsScreen />,
    login: <LoginScreen onLoggedIn={handleLoggedIn} setScreen={setScreen} t={t} />,
    register: session ? <RegisterScreen setScreen={setScreen} session={session} onRegistered={handleRegistered} /> : <LoginScreen onLoggedIn={handleLoggedIn} setScreen={setScreen} t={t} />,
    admin: <AdminScreen volunteers={volunteers} setVolunteers={setVolunteers} sosCountToday={sosCountToday} />,
  };

  return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}*{-webkit-tap-highlight-color:transparent;}input::placeholder,textarea::placeholder{color:#475569;}input:focus,textarea:focus{border-color:#D4A017!important;}button:active{transform:scale(0.97);}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0A1628}::-webkit-scrollbar-thumb{background:#1A3058;border-radius:4px}`}</style>
      {toast && (
        <div style={{ position: "fixed", top: 96, left: "50%", transform: "translateX(-50%)", zIndex: 999, width: "90%", maxWidth: 380, background: (toast.type === "call" || toast.type === "sos") ? "#7f1d1d" : "#1a1400", border: `2px solid ${(toast.type === "call" || toast.type === "sos") ? C.red : C.gold}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, animation: "slideDown 0.3s ease" }}>
          <span style={{ fontSize: 24 }}>{toast.type === "sos" ? "🆘" : toast.type === "call" ? "🚨" : toast.type === "approved" ? "✅" : "📢"}</span>
          <div style={{ flex: 1 }}><p style={{ fontWeight: 800, fontSize: 11, color: C.gold, margin: "0 0 2px" }}>ALERT</p><p style={{ color: C.white, fontSize: 12, margin: 0 }}>To <strong>{toast.volName}</strong>: {toast.message}</p></div>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: C.gray, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
      )}
      <Header t={t} lang={lang} onToggleLang={toggleLang} />
      {dbLoading && screen === "home" && <div style={{ background: "#1a1400", padding: "8px 16px", textAlign: "center" }}><p style={{ color: C.gold, fontSize: 11, margin: 0 }}>⏳ Loading data from Supabase...</p></div>}
      <div>{screens[screen] || screens.home}</div>
      <nav style={S.navBar}>
        {navItems.map(n => (
          <button key={n.id} style={S.navBtn(screen === n.id)} onClick={() => setScreen(n.id)}>
            <span style={{ fontSize: 20, position: "relative", display: "inline-block" }}>
              {n.icon}
              {n.id === "admin" && alertBadge > 0 && <span style={{ position: "absolute", top: -4, right: -6, background: C.red, color: C.white, borderRadius: "50%", fontSize: 8, fontWeight: 800, width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{alertBadge}</span>}
            </span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
