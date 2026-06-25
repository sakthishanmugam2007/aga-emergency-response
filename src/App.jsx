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
          <div style={{ width: 40, height: 40, borderRadius: "50%", back
