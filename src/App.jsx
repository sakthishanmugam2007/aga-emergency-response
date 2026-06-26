import { useState, useEffect, useRef } from "react";

// ─── SUPABASE ───
const SUPABASE_URL = "https://qyoektirhvroaarnzazy.supabase.co";
const SUPABASE_KEY = "sb_publishable_3LBPKOMdfUMeEkguQO98ug_7jcYg9ct";
async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": opts.prefer || "return=representation", ...(opts.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
}
const db = {
  getVolunteers: () => sbFetch("/volunteers?order=created_at.asc"),
  addVolunteer: (d) => sbFetch("/volunteers", { method: "POST", body: JSON.stringify(d) }),
  updateVolunteer: (id, d) => sbFetch(`/volunteers?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  deleteVolunteer: (id) => sbFetch(`/volunteers?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" }),
};

// ─── CONFIG ───
const ADMIN_PIN = "6202csacgspaga";
const CAMPUS_RADIUS_KM = 2.0;
const CAMPUS_CENTER = { lat: 11.0345, lng: 77.0355 };

// ─── FIRST AID GUIDE DEFAULT ───
const DEFAULT_GUIDE = {
  en: [
    { id: "cpr", icon: "❤️", title: "CPR (Cardiac Arrest)", content: "## Check Responsiveness\nTap shoulders firmly and shout. If no response, call 108 immediately.\n## Start Chest Compressions\nPlace heel of hand on center of chest. Push down 5–6 cm hard and fast. Rate: 100–120 per minute.\n## Give Rescue Breaths\nTilt head back, lift chin. Pinch nose and give 2 breaths (1 second each). Continue 30:2 ratio.\n## AED\nUse AED as soon as available. Follow voice instructions." },
    { id: "bleeding", icon: "🩸", title: "Severe Bleeding", content: "## Apply Direct Pressure\nUse clean cloth or bandage. Press firmly without lifting.\n## Elevate\nRaise the injured limb above heart level if possible.\n## Tourniquet\nFor life-threatening limb bleeding: apply 5–7 cm above wound. Note the time applied.\n## Do Not Remove\nDo not remove embedded objects. Build padding around them." },
    { id: "fracture", icon: "🦴", title: "Fracture / Broken Bone", content: "## Immobilize\nDo not attempt to straighten. Splint in position found.\n## Splinting\nExtend splint beyond joints above and below fracture. Pad well.\n## Ice\nApply ice pack wrapped in cloth — 20 min on, 20 min off.\n## Open Fracture\nCover with sterile dressing. Do not push bone back in." },
    { id: "burns", icon: "🔥", title: "Burns", content: "## Cool the Burn\nRun cool (not cold) water for 10–20 minutes. Do not use ice.\n## Cover\nUse sterile non-stick dressing or cling film loosely.\n## Do Not\nDo not burst blisters. Do not apply butter, oil, or toothpaste.\n## Seek Help\nAll burns larger than palm of hand need hospital care." },
    { id: "choking", icon: "😮", title: "Choking", content: "## Encourage Coughing\nIf person can cough, encourage forceful coughing.\n## Back Blows\n5 sharp blows between shoulder blades with heel of hand.\n## Abdominal Thrusts\nStand behind person. Fist above navel. Pull sharply inward and upward 5 times.\n## Unconscious\nIf they lose consciousness, begin CPR immediately." },
    { id: "shock", icon: "⚡", title: "Shock", content: "## Lay Person Down\nFlat on back. Elevate legs 30 cm unless head/spine injury suspected.\n## Keep Warm\nCover with blanket. Do not overheat.\n## Do Not Give Food/Water\nPerson in shock must not eat or drink.\n## Monitor\nCheck breathing every 2 minutes. Be ready to start CPR." },
    { id: "fainting", icon: "😵", title: "Fainting / Unconsciousness", content: "## Recovery Position\nIf breathing: roll to side, top knee bent forward, head tilted back.\n## Check Airway\nEnsure mouth is clear. Tilt head back gently.\n## Do Not\nDo not give water to unconscious person.\n## Monitor\nStay until person is fully conscious and alert." },
    { id: "snakebite", icon: "🐍", title: "Snake Bite", content: "## Keep Still\nImmobilize bitten limb. Keep below heart level.\n## Remove\nRemove tight clothing and jewelry near bite.\n## Do Not\nDo not cut, suck, or apply tourniquet. Do not apply ice.\n## Rush to Hospital\nGet to hospital immediately. Note snake appearance if safe." },
  ],
  ta: [
    { id: "cpr", icon: "❤️", title: "CPR (இதய செயலிழப்பு)", content: "## பதிலை சரிபார்க்கவும்\nதோள்களை தட்டி உரக்க கூவுங்கள். பதில் இல்லை என்றால் உடனே 108 அழைக்கவும்.\n## மார்பு அழுத்தங்களை தொடங்கவும்\nமார்பின் மையத்தில் கைகளை வையுங்கள். 5–6 செ.மீ ஆழமாக அழுத்துங்கள். வீதம்: நிமிடத்திற்கு 100–120.\n## மூச்சு கொடுங்கள்\nதலையை பின்னோக்கி சாய்க்கவும். மூக்கை பிடித்து 2 மூச்சுகள் கொடுங்கள். 30:2 விகிதம்.\n## AED\nகிடைத்தவுடன் AED பயன்படுத்தவும்." },
    { id: "bleeding", icon: "🩸", title: "கடுமையான இரத்தப்போக்கு", content: "## நேரடி அழுத்தம் கொடுங்கள்\nச்சுத்தமான துணி அல்லது கட்டை பயன்படுத்தி உறுதியாக அழுத்தவும்.\n## உயர்த்தவும்\nகாயமடைந்த உறுப்பை இதயத்திற்கு மேலே உயர்த்தவும்.\n## Tourniquet\nகாயத்திற்கு 5–7 செ.மீ மேலே கட்டவும். நேரத்தை குறிக்கவும்.\n## அகற்றாதீர்கள்\nகுத்திய பொருட்களை அகற்றாதீர்கள்." },
    { id: "fracture", icon: "🦴", title: "எலும்பு முறிவு", content: "## அசைக்காதீர்கள்\nநேராக்க முயற்சிக்காதீர்கள். கண்ட இடத்திலேயே சப்போர்ட் கொடுங்கள்.\n## Splint கட்டவும்\nமுறிவின் மேலும் கீழும் உள்ள மூட்டுகளை தாண்டி நீட்டவும்.\n## Ice\nதுணியில் சுற்றிய ice pack வையுங்கள் — 20 நிமிடம் வையுங்கள், 20 நிமிடம் எடுங்கள்.\n## திறந்த முறிவு\nமலட்டு கட்டுடன் மூடவும். எலும்பை உள்ளே தள்ளாதீர்கள்." },
    { id: "burns", icon: "🔥", title: "தீக்காயங்கள்", content: "## தீக்காயத்தை குளிர்விக்கவும்\nகுளிர்ந்த (குளிர் இல்லாத) தண்ணீரில் 10–20 நிமிடங்கள் வையுங்கள். Ice வேண்டாம்.\n## மூடவும்\nமலட்டு non-stick கட்டு அல்லது cling film தளர்வாக போடவும்.\n## செய்யாதவை\nகுமிழிகளை உடைக்காதீர்கள். வெண்ணெய், எண்ணெய் தடவாதீர்கள்.\n## உதவி நாடவும்\nஉள்ளங்கையை விட பெரிய தீக்காயங்களுக்கு மருத்துவமனை தேவை." },
    { id: "choking", icon: "😮", title: "தொண்டை அடைப்பு", content: "## இருமல் ஊக்குவிக்கவும்\nதனியாக இருமல் வந்தால் தொடர ஊக்குவிக்கவும்.\n## முதுகில் அடிக்கவும்\nதோள் இடையில் 5 உறுதியான அடிகள் கொடுங்கள்.\n## வயிற்று அழுத்தங்கள்\nபின்னால் நிற்கவும். முஷ்டியை வயிற்றுக்கு மேலே வையுங்கள். 5 முறை உள்ளே மேலே இழுக்கவும்.\n## மயக்கம் வந்தால்\nமயக்கமடைந்தால் உடனே CPR தொடங்கவும்." },
    { id: "shock", icon: "⚡", title: "அதிர்ச்சி நிலை", content: "## படுக்க வையுங்கள்\nமல்லாந்து படுக்க வையுங்கள். தலை/முதுகெலும்பு காயம் இல்லை என்றால் கால்களை 30 செ.மீ உயர்த்தவும்.\n## வெப்பமாக வையுங்கள்\nகம்பளியால் மூடவும். அதிக வெப்பம் வேண்டாம்.\n## உணவு/தண்ணீர் வேண்டாம்\nஅதிர்ச்சியில் உள்ளவருக்கு சாப்பிட கொடுக்காதீர்கள்.\n## கண்காணிக்கவும்\nஒவ்வொரு 2 நிமிடமும் சுவாசத்தை சரிபார்க்கவும்." },
    { id: "fainting", icon: "😵", title: "மயக்கம்", content: "## Recovery Position\nசுவாசிக்கிறார் என்றால்: பக்கவாட்டில் திருப்பவும், மேல் முழங்கால் முன்னோக்கி வளைக்கவும்.\n## சுவாசப் பாதையை சரிபார்க்கவும்\nவாய் தெளிவாக இருக்கிறதா என்று பார்க்கவும்.\n## செய்யாதவை\nமயக்கத்தில் உள்ளவருக்கு தண்ணீர் கொடுக்காதீர்கள்.\n## கண்காணிக்கவும்\nமுழுமையாக சுயநினைவு வரும் வரை இருக்கவும்." },
    { id: "snakebite", icon: "🐍", title: "பாம்பு கடி", content: "## அசைக்காதீர்கள்\nகடிக்கப்பட்ட உறுப்பை அசைக்காதீர்கள். இதயத்திற்கு கீழே வையுங்கள்.\n## அகற்றவும்\nகடிக்கப்பட்ட இடத்தில் உள்ள இறுக்கமான ஆடை நகைகளை அகற்றவும்.\n## செய்யாதவை\nவெட்டாதீர்கள், உறிஞ்சாதீர்கள், Tourniquet கட்டாதீர்கள்.\n## உடனே மருத்துவமனை\nவிரைவாக மருத்துவமனை செல்லவும்." },
  ]
};

// ─── CONTACTS ───
const DEFAULT_CONTACTS = [
  { key: "ambulance", icon: "🚑", label: "Ambulance", number: "108", desc: "National Emergency" },
  { key: "hospital", icon: "🏥", label: "Hospital", number: "+914222572180", desc: "Nearest Govt. Hospital" },
  { key: "security", icon: "🔐", label: "College Security", number: "+914222572177", desc: "PSG CAS Security" },
  { key: "fire", icon: "🚒", label: "Fire Service", number: "101", desc: "Fire Emergency" },
  { key: "helpdesk", icon: "🛎️", label: "College Help Desk", number: "+914222572178", desc: "General Assistance" },
  { key: "medical", icon: "⚕️", label: "Medical Room", number: "+914222572179", desc: "Campus Medical Center" },
];

const CAMPUS_LANDMARKS = [
  { name: "Main Gate", lat: 11.0348, lng: 77.0350, icon: "🏛️" },
  { name: "Library", lat: 11.0342, lng: 77.0358, icon: "📚" },
  { name: "Canteen", lat: 11.0350, lng: 77.0362, icon: "🍽️" },
  { name: "Parking Area", lat: 11.0338, lng: 77.0348, icon: "🅿️" },
  { name: "Assembly Point", lat: 11.0352, lng: 77.0370, icon: "📢" },
  { name: "Medical Room", lat: 11.0355, lng: 77.0375, icon: "⚕️" },
];

// ─── ALERTS ───
let globalAlerts = [];
let alertListeners = [];
function subscribeAlerts(fn) { alertListeners.push(fn); return () => { alertListeners = alertListeners.filter(l => l !== fn); }; }
function pushAlert(a) { globalAlerts = [a, ...globalAlerts].slice(0, 80); alertListeners.forEach(fn => fn([...globalAlerts])); }
function sendVolunteerAlert(vol, type, extra = {}) {
  const messages = { call: "Someone is calling you for emergency help!", map: "Someone is viewing your location!", sos: "🚨 SOS ALERT — emergency help needed nearby!", approved: "✅ Your volunteer application has been approved!", rejected: "❌ Your application was not approved.", broadcast: extra.message || "Emergency broadcast from Admin.", registered: "📝 New volunteer registration submitted!" };
  pushAlert({ id: Date.now() + Math.random(), volId: vol?.id, volName: vol?.name || "All Volunteers", type, message: messages[type] || "New alert", time: new Date().toLocaleTimeString(), read: false, userLoc: extra.userLoc || null });
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const beep = (freq, start, dur, wave = "square", vol = 0.3) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.type = wave;
      o.frequency.setValueAtTime(freq, now + start);
      g.gain.setValueAtTime(0, now + start); g.gain.linearRampToValueAtTime(vol, now + start + 0.03); g.gain.linearRampToValueAtTime(0, now + start + dur);
      o.start(now + start); o.stop(now + start + dur + 0.05);
    };
    if (type === "sos") [0, .2, .4, .6, .8, 1].forEach((t, i) => beep(i % 2 === 0 ? 700 : 1300, t, .18, "sawtooth", .4));
    else if (type === "call") [0, .28, .56, .84].forEach((t, i) => beep(i % 2 === 0 ? 880 : 1100, t, .24));
    else [0, .18, .36].forEach(t => beep(1400, t, .15, "sine", .25));
  } catch {}
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, r = d => d * Math.PI / 180, dLat = r(lat2 - lat1), dLng = r(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function bearingDeg(lat1, lng1, lat2, lng2) {
  const r = d => d * Math.PI / 180, dLng = r(lng2 - lng1);
  return (Math.atan2(Math.sin(dLng) * Math.cos(r(lat2)), Math.cos(r(lat1)) * Math.sin(r(lat2)) - Math.sin(r(lat1)) * Math.cos(r(lat2)) * Math.cos(dLng)) * 180 / Math.PI + 360) % 360;
}
function fmtDist(m) { return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`; }
function fmtCoord(n) { return n ? parseFloat(n).toFixed(5) : "—"; }

function loadGuide() { try { const r = localStorage.getItem("aga_guide"); return r ? JSON.parse(r) : DEFAULT_GUIDE; } catch { return DEFAULT_GUIDE; } }
function saveGuide(g) { try { localStorage.setItem("aga_guide", JSON.stringify(g)); } catch {} }
function loadContacts() { try { const r = localStorage.getItem("aga_contacts"); return r ? JSON.parse(r) : DEFAULT_CONTACTS; } catch { return DEFAULT_CONTACTS; } }
function saveContacts(c) { try { localStorage.setItem("aga_contacts", JSON.stringify(c)); } catch {} }
function loadSession() { try { const r = localStorage.getItem("aga_session"); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveSession(s) { try { localStorage.setItem("aga_session", JSON.stringify(s)); } catch {} }

const C = { navy: "#0A1628", navyMid: "#122040", navyLight: "#1A3058", gold: "#D4A017", red: "#C0392B", white: "#FFFFFF", gray: "#94A3B8", green: "#16A34A", blue: "#3B82F6", orange: "#EA580C" };
const S = {
  app: { fontFamily: "'Inter',system-ui,sans-serif", background: C.navy, minHeight: "100vh", color: C.white, maxWidth: 430, margin: "0 auto", position: "relative", overflowX: "hidden" },
  header: { background: C.navyMid, borderBottom: `2px solid ${C.gold}`, padding: "10px 12px 8px" },
  screen: { padding: "16px 14px", paddingBottom: 90 },
  btn: (bg, fg) => ({ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px 18px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 10, background: bg, color: fg }),
  btnSm: (bg, fg) => ({ padding: "8px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", background: bg, color: fg }),
  card: (border) => ({ background: C.navyMid, border: `1px solid ${border || C.navyLight}`, borderRadius: 12, padding: "14px 15px", marginBottom: 10 }),
  label: { fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, marginTop: 8 },
  input: { width: "100%", background: C.navyLight, border: `1px solid ${C.navyLight}`, borderRadius: 8, padding: "10px 12px", color: C.white, fontSize: 14, marginBottom: 10, boxSizing: "border-box", outline: "none" },
  badge: ok => ({ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: ok ? "#14532d" : "#7f1d1d", color: ok ? "#86efac" : "#fca5a5" }),
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.navyMid, borderTop: `2px solid ${C.gold}`, display: "flex", zIndex: 200 },
  navBtn: a => ({ flex: 1, padding: "9px 2px 7px", background: "none", border: "none", color: a ? C.gold : C.gray, fontSize: 8, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.3, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }),
  sHead: { fontSize: 12, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  chip: (sel, val) => ({ padding: "6px 12px", borderRadius: 20, border: `1px solid ${sel === val ? C.gold : C.navyLight}`, background: sel === val ? C.gold : C.navyLight, color: sel === val ? C.navy : C.gray, fontSize: 12, fontWeight: 700, cursor: "pointer", marginRight: 6, marginBottom: 6 }),
  statBox: { background: C.navyMid, border: `1px solid ${C.navyLight}`, borderRadius: 12, padding: "12px 8px", textAlign: "center" },
  row: { display: "flex", gap: 8, alignItems: "center" },
  err: { color: "#fca5a5", fontSize: 11, marginTop: -6, marginBottom: 8 },
};

// ─── HEADER ───
function Header({ lang, onToggle }) {
  return (
    <div style={S.header}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 3 }}>
        <button onClick={onToggle} style={{ background: C.navyLight, border: `1px solid ${C.gold}`, borderRadius: 20, padding: "3px 10px", color: C.gold, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
          {lang === "ta" ? "தமிழ் / EN" : "EN / தமிழ்"}
        </button>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: C.white, margin: 0 }}>AGA {lang === "ta" ? "அவசர சேவை" : "EMERGENCY RESPONSE"}</p>
        <p style={{ fontSize: 9, color: C.gold, fontWeight: 700, margin: "2px 0 0", letterSpacing: 0.5 }}>Alert Golden Army PSGCAS Chapter</p>
        <p style={{ fontSize: 8, color: C.gray, margin: "1px 0 0" }}>PSG {lang === "ta" ? "கலை மற்றும் அறிவியல் கல்லூரி, கோயம்புத்தூர்" : "College of Arts & Science, Coimbatore"}</p>
      </div>
    </div>
  );
}

// ─── LOCATION BANNER ───
function LocationBanner({ userLoc, lang }) {
  if (!userLoc) return null;
  return (
    <div style={{ background: "#0d2137", borderBottom: `1px solid ${C.navyLight}`, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 14 }}>📍</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 10, color: C.gold, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>{lang === "ta" ? "உங்கள் இருப்பிடம்" : "YOUR LOCATION"} </span>
        <span style={{ fontSize: 11, color: C.white, fontFamily: "monospace" }}>{fmtCoord(userLoc.lat)}, {fmtCoord(userLoc.lng)}</span>
      </div>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
    </div>
  );
}

// ─── LOCATION GATE ───
function LocationGate({ onEnable, lang, onToggle }) {
  const [err, setErr] = useState(false);
  function tryEnable() {
    setErr(false);
    navigator.geolocation.getCurrentPosition(
      pos => onEnable({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { setErr(true); onEnable({ lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng }); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }
  return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column" }}>
      <Header lang={lang} onToggle={onToggle} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🚨</div>
          <div style={{ background: "#7f1d1d", border: `1px solid ${C.red}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
            <p style={{ color: "#fecaca", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>{lang === "ta" ? "இருப்பிட அனுமதி தேவை" : "Location Access Required"}</p>
            <p style={{ color: "#fca5a5", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{lang === "ta" ? "AGA அவசர சேவைக்கு உங்கள் இருப்பிடம் தேவை." : "AGA Emergency Response needs your location."}</p>
          </div>
          {err && <p style={{ color: "#fbbf24", fontSize: 12, marginBottom: 12 }}>Location denied — using campus center as fallback.</p>}
          <button style={S.btn(C.gold, C.navy)} onClick={tryEnable}>📍 {lang === "ta" ? "இருப்பிடத்தை இயக்கு" : "Enable Location"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── HOME ───
function HomeScreen({ userLoc, setScreen, lang, onSOS, volunteers, sosToday }) {
  const approved = volunteers.filter(v => v.approved);
  const active = approved.filter(v => v.online && v.availability).length;
  const tiles = [
    { icon: "🆘", label: lang === "ta" ? "அருகிலுள்ள தன்னார்வலர்கள்" : "Find Nearby Volunteers", to: "volunteers" },
    { icon: "📞", label: lang === "ta" ? "அவசர தொடர்புகள்" : "Emergency Contacts", to: "contacts" },
    { icon: "🗺️", label: lang === "ta" ? "வளாக வரைபடம்" : "Campus Map", to: "campusMap" },
    { icon: "🩺", label: lang === "ta" ? "முதலுதவி வழிகாட்டி" : "First Aid Guide", to: "guide" },
    { icon: "📝", label: lang === "ta" ? "தன்னார்வலராக பதிவு" : "Register as Volunteer", to: "login" },
  ];
  return (
    <div style={S.screen}>
      <button onClick={onSOS} style={{ ...S.btn(C.red, C.white), fontSize: 20, fontWeight: 900, padding: "22px 18px", borderRadius: 16, boxShadow: "0 0 28px rgba(192,57,43,0.55)", letterSpacing: 1, marginBottom: 14 }}>
        🚨 {lang === "ta" ? "SOS — அவசரம்" : "SOS — EMERGENCY"}
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {tiles.map(b => (
          <button key={b.to} style={{ ...S.btn(C.navyLight, C.white), marginBottom: 0, flexDirection: "column", padding: "14px 8px", gap: 4, border: `1px solid ${C.navyLight}` }} onClick={() => setScreen(b.to)}>
            <span style={{ fontSize: 22 }}>{b.icon}</span>
            <span style={{ fontSize: 11 }}>{b.label}</span>
          </button>
        ))}
      </div>
      <div style={S.sHead}>📊 {lang === "ta" ? "டாஷ்போர்டு" : "Dashboard"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={S.statBox}><p style={{ fontSize: 24, fontWeight: 900, color: C.gold, margin: 0 }}>{approved.length}</p><p style={{ fontSize: 10, color: C.gray, margin: "3px 0 0" }}>{lang === "ta" ? "மொத்த தன்னார்வலர்கள்" : "Total Volunteers"}</p></div>
        <div style={S.statBox}><p style={{ fontSize: 24, fontWeight: 900, color: C.green, margin: 0 }}>{active}</p><p style={{ fontSize: 10, color: C.gray, margin: "3px 0 0" }}>{lang === "ta" ? "செயலில் உள்ளவர்கள்" : "Active Now"}</p></div>
        <div style={S.statBox}><p style={{ fontSize: 24, fontWeight: 900, color: C.red, margin: 0 }}>{sosToday}</p><p style={{ fontSize: 10, color: C.gray, margin: "3px 0 0" }}>{lang === "ta" ? "இன்றைய SOS" : "SOS Today"}</p></div>
        <div style={S.statBox}><p style={{ fontSize: 24, fontWeight: 900, color: C.blue, margin: 0 }}>{volunteers.length}</p><p style={{ fontSize: 10, color: C.gray, margin: "3px 0 0" }}>{lang === "ta" ? "மொத்த பதிவுகள்" : "Total Registered"}</p></div>
      </div>
    </div>
  );
}

// ─── VOLUNTEERS ───
function VolunteersScreen({ userLoc, setScreen, setSelectedVol, volunteers }) {
  const [filter, setFilter] = useState("all");
  const withDist = volunteers.filter(v => v.approved).map(v => ({
    ...v,
    distance: userLoc && v.lat && v.lng ? haversine(userLoc.lat, userLoc.lng, parseFloat(v.lat), parseFloat(v.lng)) : 9999
  })).sort((a, b) => a.distance - b.distance);
  const nearby = withDist.filter(v => v.distance <= CAMPUS_RADIUS_KM * 1000);
  const outside = withDist.filter(v => v.distance > CAMPUS_RADIUS_KM * 1000);
  const filtered = (filter === "available" ? withDist.filter(v => v.availability && v.online) : filter === "certified" ? withDist.filter(v => v.first_aid_certified) : withDist);

  function callVol(vol) { window.location.href = `tel:${vol.phone}`; sendVolunteerAlert(vol, "call", { userLoc }); playSound("call"); }
  function viewMap(vol) { sendVolunteerAlert(vol, "map", { userLoc }); setSelectedVol(vol); setScreen("map"); }

  return (
    <div style={S.screen}>
      <div style={S.sHead}>🆘 {nearby.length > 0 ? `${nearby.length} Volunteers Within 2km` : "Nearby Volunteers"}</div>
      <p style={{ color: C.gray, fontSize: 11, marginTop: -8, marginBottom: 12 }}>Within {CAMPUS_RADIUS_KM}km prioritized · sorted by distance</p>
      <div style={{ marginBottom: 14 }}>
        {["all", "available", "certified"].map(f => <button key={f} style={S.chip(filter, f)} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "available" ? "Available" : "Certified"}</button>)}
      </div>
      {filtered.length === 0 && <div style={{ ...S.card(), textAlign: "center", padding: 28 }}><p style={{ color: C.gray, fontSize: 13 }}>No volunteers found.</p></div>}
      {filtered.map(vol => (
        <div key={vol.id} style={S.card(vol.distance <= CAMPUS_RADIUS_KM * 1000 ? C.gold : C.navyLight)}>
          {vol.distance <= CAMPUS_RADIUS_KM * 1000 && <div style={{ fontSize: 10, color: C.gold, fontWeight: 800, marginBottom: 6 }}>📍 WITHIN 2KM</div>}
          <div style={{ ...S.row, marginBottom: 8 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: C.navy, flexShrink: 0 }}>{vol.name?.charAt(0) || "?"}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.white, margin: 0 }}>{vol.name}</p>
              <p style={{ fontSize: 11, color: C.gray, margin: "2px 0 0" }}>{vol.department || vol.occupation || "—"} {vol.year ? `· ${vol.year}` : ""}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: vol.distance <= 500 ? C.green : C.gold, margin: 0 }}>{fmtDist(vol.distance)}</p>
              <p style={{ fontSize: 10, color: C.gray }}>away</p>
            </div>
          </div>
          <div style={{ background: C.navyLight, borderRadius: 8, padding: "6px 10px", marginBottom: 8, fontSize: 11, color: C.gray, fontFamily: "monospace" }}>
            📍 {fmtCoord(vol.lat)}, {fmtCoord(vol.lng)}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={S.badge(vol.online)}>{vol.online ? "Online" : "Offline"}</span>
            <span style={S.badge(vol.availability)}>{vol.availability ? "Available" : "Unavailable"}</span>
            <span style={S.badge(vol.first_aid_certified)}>{vol.first_aid_certified ? "✓ Certified" : "Not Certified"}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btn(C.red, C.white), marginBottom: 0, flex: 1, padding: "10px 10px", fontSize: 13 }} onClick={() => callVol(vol)}>📞 Call Now</button>
            <button style={{ ...S.btn(C.navyLight, C.white), marginBottom: 0, flex: 1, padding: "10px 10px", fontSize: 13, border: `1px solid ${C.gray}` }} onClick={() => viewMap(vol)}>🗺 Map</button>
          </div>
        </div>
      ))}
      {outside.length > 0 && filter === "all" && (
        <div style={{ ...S.card(), marginTop: 4, opacity: 0.6, textAlign: "center", padding: 12 }}>
          <p style={{ color: C.gray, fontSize: 11, margin: 0 }}>+{outside.length} volunteer(s) beyond 2km radius</p>
        </div>
      )}
    </div>
  );
}

// ─── MAP ───
function MapScreen({ userLoc, selectedVol, setScreen }) {
  const vol = selectedVol;
  const [trackLoc, setTrackLoc] = useState(userLoc);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(p => setTrackLoc({ lat: p.coords.latitude, lng: p.coords.longitude }), null, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  if (!vol) { setScreen("volunteers"); return null; }
  const uLat = trackLoc?.lat || CAMPUS_CENTER.lat, uLng = trackLoc?.lng || CAMPUS_CENTER.lng;
  const vLat = parseFloat(vol.lat) || CAMPUS_CENTER.lat, vLng = parseFloat(vol.lng) || CAMPUS_CENTER.lng;
  const dist = haversine(uLat, uLng, vLat, vLng);
  const walkMin = Math.max(1, Math.round(dist / 80));
  const deg = bearingDeg(uLat, uLng, vLat, vLng);
  const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${uLat}%2C${uLng}%3B${vLat}%2C${vLng}`;
  return (
    <div style={S.screen}>
      <button style={{ ...S.btnSm(C.navyLight, C.white), marginBottom: 14, border: `1px solid ${C.gray}` }} onClick={() => setScreen("volunteers")}>← Back</button>
      <div style={S.sHead}>🗺 Volunteer Location</div>
      <div style={{ ...S.card(C.gold), marginBottom: 12 }}>
        <div style={S.row}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.navy }}>{vol.name?.charAt(0)}</div>
          <div><p style={{ fontSize: 15, fontWeight: 700, color: C.white, margin: 0 }}>{vol.name}</p><p style={{ fontSize: 11, color: C.gray, margin: 0 }}>{vol.department || vol.occupation}</p></div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ ...S.card(), flex: 1, textAlign: "center", marginBottom: 0 }}><p style={{ color: C.gold, fontWeight: 900, fontSize: 20, margin: 0 }}>{fmtDist(dist)}</p><p style={{ color: C.gray, fontSize: 10, margin: 0 }}>Distance</p></div>
        <div style={{ ...S.card(), flex: 1, textAlign: "center", marginBottom: 0 }}><p style={{ color: C.gold, fontWeight: 900, fontSize: 20, margin: 0 }}>~{walkMin}m</p><p style={{ color: C.gray, fontSize: 10, margin: 0 }}>Walk</p></div>
      </div>
      <div style={{ ...S.card(), marginBottom: 10, fontSize: 11, color: C.gray, fontFamily: "monospace" }}>
        <div>📍 You: {fmtCoord(uLat)}, {fmtCoord(uLng)}</div>
        <div style={{ marginTop: 4 }}>🎯 Volunteer: {fmtCoord(vLat)}, {fmtCoord(vLng)}</div>
      </div>
      <div style={{ background: C.navyLight, borderRadius: 12, height: 180, marginBottom: 10, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(212,160,23,0.12) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        {[1, 2, 3].map(r => <div key={r} style={{ position: "absolute", top: "50%", left: "50%", width: r * 52, height: r * 52, marginLeft: -(r * 26), marginTop: -(r * 26), border: `1px solid rgba(148,163,184,${0.3 - r * 0.07})`, borderRadius: "50%" }} />)}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.blue, border: `2px solid ${C.white}`, margin: "0 auto" }} />
          <p style={{ fontSize: 9, color: C.gray, margin: "2px 0 0" }}>You</p>
        </div>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: `rotate(${deg}deg) translateY(-72px) rotate(${-deg}deg) translate(-50%,-50%)`, textAlign: "center" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.gold, border: `2px solid ${C.navy}`, margin: "0 auto", boxShadow: `0 0 8px ${C.gold}` }} />
          <p style={{ fontSize: 9, color: C.gold, fontWeight: 700, margin: "2px 0 0", whiteSpace: "nowrap" }}>{vol.name?.split(" ")[0]}</p>
        </div>
      </div>
      <button style={S.btn(C.gold, C.navy)} onClick={() => window.open(osmUrl, "_blank")}>🧭 Navigate to Volunteer</button>
      <button style={S.btn(C.red, C.white)} onClick={() => window.open(`tel:${vol.phone}`, "_self")}>📞 Call {vol.name?.split(" ")[0]}</button>
    </div>
  );
}

// ─── CAMPUS MAP ───
function CampusMapScreen({ setScreen, lang }) {
  const bbox = `${CAMPUS_CENTER.lng - 0.005},${CAMPUS_CENTER.lat - 0.003},${CAMPUS_CENTER.lng + 0.005},${CAMPUS_CENTER.lat + 0.003}`;
  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${CAMPUS_CENTER.lat},${CAMPUS_CENTER.lng}`;
  const osmFull = `https://www.openstreetmap.org/?mlat=${CAMPUS_CENTER.lat}&mlon=${CAMPUS_CENTER.lng}#map=17/${CAMPUS_CENTER.lat}/${CAMPUS_CENTER.lng}`;
  return (
    <div style={S.screen}>
      <button style={{ ...S.btnSm(C.navyLight, C.white), marginBottom: 14, border: `1px solid ${C.gray}` }} onClick={() => setScreen("home")}>← Back</button>
      <div style={S.sHead}>🗺️ {lang === "ta" ? "வளாக வரைபடம்" : "Campus Map"}</div>
      <p style={{ color: C.gray, fontSize: 11, marginTop: -8, marginBottom: 12 }}>PSG College of Arts & Science, Coimbatore — Near SITRA Junction, Avinashi Road</p>
      <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 10, border: `1px solid ${C.gold}` }}>
        <iframe title="campus-map" width="100%" height="250" style={{ border: 0, display: "block" }} src={osmEmbed} />
      </div>
      <button style={S.btn(C.gold, C.navy)} onClick={() => window.open(osmFull, "_blank")}>🌍 Open Full Map (OpenStreetMap)</button>
      <div style={S.sHead}>📍 Key Locations</div>
      {CAMPUS_LANDMARKS.map(loc => (
        <div key={loc.name} style={{ ...S.card(), display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>{loc.icon}</span>
          <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 700, color: C.white, margin: 0 }}>{loc.name}</p><p style={{ fontSize: 10, color: C.gray, margin: "2px 0 0", fontFamily: "monospace" }}>{fmtCoord(loc.lat)}, {fmtCoord(loc.lng)}</p></div>
        </div>
      ))}
    </div>
  );
}

// ─── CONTACTS ───
function ContactsScreen({ canEdit = false, lang }) {
  const [contacts, setContacts] = useState(loadContacts);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  function persist(next) { setContacts(next); saveContacts(next); }
  function startEdit(c) { setForm({ ...c }); setEditing(c.key); }
  function startAdd() { setForm({ key: `c${Date.now()}`, icon: "📞", label: "", number: "", desc: "" }); setEditing("__new__"); }
  function save() {
    if (!form.label || !form.number) return;
    if (editing === "__new__") persist([...contacts, form]);
    else persist(contacts.map(c => c.key === editing ? form : c));
    setEditing(null);
  }
  function del(key) { if (window.confirm("Remove?")) persist(contacts.filter(c => c.key !== key)); }
  return (
    <div style={S.screen}>
      <div style={S.sHead}>📞 {lang === "ta" ? "அவசர தொடர்புகள்" : "Emergency Contacts"}</div>
      {contacts.map(c => (
        <div key={c.key} style={{ background: C.red, borderRadius: 12, padding: "13px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24, cursor: "pointer" }} onClick={() => window.open(`tel:${c.number}`, "_self")}>{c.icon}</span>
          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => window.open(`tel:${c.number}`, "_self")}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.white, margin: 0 }}>{c.label}</p>
            <p style={{ fontSize: 11, color: "#fecaca", margin: 0 }}>{c.desc}</p>
          </div>
          <div style={{ cursor: "pointer" }} onClick={() => window.open(`tel:${c.number}`, "_self")}>
            <p style={{ fontSize: 13, color: "#fecaca", fontWeight: 800, margin: 0 }}>{c.number}</p>
            <p style={{ fontSize: 9, color: "#fca5a5", margin: 0 }}>Tap to call</p>
          </div>
          {canEdit && <>
            <button style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: 6, padding: 5, cursor: "pointer", color: C.white, fontSize: 13 }} onClick={() => startEdit(c)}>✏️</button>
            <button style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: 6, padding: 5, cursor: "pointer", color: C.white, fontSize: 13 }} onClick={() => del(c.key)}>🗑️</button>
          </>}
        </div>
      ))}
      {canEdit && <button style={S.btn(C.navyLight, C.white)} onClick={startAdd}>➕ Add Contact</button>}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 20 }}>
          <div style={{ background: C.navyMid, borderRadius: 14, padding: 20, width: "100%", maxWidth: 340 }}>
            <p style={{ color: C.white, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>{editing === "__new__" ? "Add Contact" : "Edit Contact"}</p>
            {[["Icon", "icon"], ["Label", "label"], ["Phone", "number"], ["Description", "desc"]].map(([lbl, key]) => (
              <div key={key}><p style={S.label}>{lbl}</p><input style={S.input} value={form[key] || ""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} /></div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn(C.navyLight, C.white), marginBottom: 0, flex: 1, border: `1px solid ${C.gray}` }} onClick={() => setEditing(null)}>Cancel</button>
              <button style={{ ...S.btn(C.gold, C.navy), marginBottom: 0, flex: 1 }} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FIRST AID GUIDE ───
function GuideScreen({ lang, canEdit = false }) {
  const [guide, setGuide] = useState(loadGuide);
  const [selected, setSelected] = useState(null);
  const [editLang, setEditLang] = useState(lang);
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const sections = (guide[lang] || guide.en);

  function startEdit(sec) { setEditing(sec.id); setEditTitle(sec.title); setEditContent(sec.content); setEditLang(lang); }
  function saveEdit() {
    const updated = { ...guide, [editLang]: (guide[editLang] || []).map(s => s.id === editing ? { ...s, title: editTitle, content: editContent } : s) };
    setGuide(updated); saveGuide(updated); setEditing(null);
  }

  if (selected !== null) {
    const sec = sections[selected];
    const parts = sec.content.split(/\n(?=## )/);
    return (
      <div style={S.screen}>
        <button style={{ ...S.btnSm(C.navyLight, C.white), marginBottom: 14, border: `1px solid ${C.gray}` }} onClick={() => setSelected(null)}>← Back</button>
        <div style={{ ...S.row, marginBottom: 14 }}>
          <span style={{ fontSize: 28 }}>{sec.icon}</span>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: C.white, margin: 0 }}>{sec.title}</p>
            <p style={{ fontSize: 10, color: C.gold, margin: 0 }}>AGA First Aid Guide</p>
          </div>
        </div>
        {parts.map((part, i) => {
          const lines = part.replace(/^## /, "").split("\n");
          const head = lines[0], steps = lines.slice(1).filter(Boolean);
          return (
            <div key={i} style={{ ...S.card(C.gold), marginBottom: 10 }}>
              <p style={{ color: C.gold, fontWeight: 800, fontSize: 13, margin: "0 0 8px" }}>{head}</p>
              {steps.map((s, j) => <p key={j} style={{ color: C.white, fontSize: 13, margin: "4px 0", lineHeight: 1.6 }}>• {s}</p>)}
            </div>
          );
        })}
        {canEdit && <button style={S.btn(C.navyLight, C.white)} onClick={() => { startEdit(sec); setSelected(null); }}>✏️ Edit This Section</button>}
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <div style={S.sHead}>🩺 {lang === "ta" ? "அவசரகால முதலுதவி வழிகாட்டி" : "Emergency First Aid Guide"}</div>
      <p style={{ color: C.gray, fontSize: 11, marginTop: -8, marginBottom: 14 }}>PSG CAS Alert Golden Army · {lang === "ta" ? "அடிப்படை முதலுதவி நுட்பங்கள்" : "Basic First Aid Techniques"}</p>
      {canEdit && (
        <div style={{ ...S.card(), marginBottom: 14 }}>
          <p style={S.label}>Edit Language</p>
          <div>{["en", "ta"].map(l => <button key={l} style={S.chip(editLang, l)} onClick={() => setEditLang(l)}>{l === "en" ? "English" : "Tamil"}</button>)}</div>
          <p style={{ color: C.gray, fontSize: 11, margin: 0 }}>Tap a section to view, then use Edit button to edit {editLang === "en" ? "English" : "Tamil"} content independently.</p>
        </div>
      )}
      {sections.map((sec, i) => (
        <button key={sec.id} style={{ ...S.card(C.navyLight), display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer", background: C.navyMid, border: `1px solid ${C.navyLight}` }} onClick={() => setSelected(i)}>
          <span style={{ fontSize: 26 }}>{sec.icon}</span>
          <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 700, color: C.white, margin: 0 }}>{sec.title}</p><p style={{ fontSize: 11, color: C.gray, margin: "2px 0 0" }}>{sec.content.split("\n")[1]?.replace("## ", "") || ""}</p></div>
          <span style={{ color: C.gold, fontSize: 18 }}>›</span>
        </button>
      ))}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 500, padding: 16, overflowY: "auto" }}>
          <div style={{ background: C.navyMid, borderRadius: 14, padding: 20, width: "100%", maxWidth: 380, marginTop: 20 }}>
            <p style={{ color: C.white, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Edit Section — {editLang === "en" ? "English" : "Tamil"}</p>
            <p style={{ color: C.gray, fontSize: 11, marginBottom: 14 }}>Editing only affects {editLang === "en" ? "English" : "Tamil"} version.</p>
            <p style={S.label}>Section Title</p>
            <input style={S.input} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            <p style={S.label}>Content (use ## for subheadings)</p>
            <textarea style={{ ...S.input, minHeight: 180, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} value={editContent} onChange={e => setEditContent(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn(C.navyLight, C.white), marginBottom: 0, flex: 1, border: `1px solid ${C.gray}` }} onClick={() => setEditing(null)}>Cancel</button>
              <button style={{ ...S.btn(C.gold, C.navy), marginBottom: 0, flex: 1 }} onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN ───
function LoginScreen({ onLoggedIn, setScreen, lang }) {
  const [mode, setMode] = useState(null);
  const [email, setEmail] = useState(""); const [err, setErr] = useState("");
  function handleEmail() {
    const t = email.trim().toLowerCase();
    if (!t.includes("@")) { setErr("Please enter a valid email."); return; }
    const s = loadSession();
    const profile = (s && s.email === t) ? s : { email: t, registered: false, name: "", approved: false };
    saveSession(profile); onLoggedIn(profile);
  }
  if (!mode) return (
    <div style={S.screen}>
      <div style={S.sHead}>🔑 {lang === "ta" ? "தன்னார்வலர் உள்நுழைவு" : "Volunteer Login"}</div>
      <div style={{ ...S.card(), marginBottom: 16 }}><p style={{ color: C.gray, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{lang === "ta" ? "உங்கள் கணக்கு மூலம் உள்நுழையவும். மீண்டும் நிறுவினாலும் சுயவிவரம் திரும்பும்." : "Sign in to register as a volunteer. Your profile is restored anytime you log in again."}</p></div>
      <button style={S.btn("#4285F4", C.white)} onClick={() => setMode("google")}>
        <span style={{ fontSize: 16 }}>G</span> {lang === "ta" ? "Google மூலம் தொடரவும்" : "Continue with Google"}
      </button>
      <button style={S.btn(C.navyLight, C.white)} onClick={() => setMode("email")}>
        ✉️ {lang === "ta" ? "மின்னஞ்சல் மூலம் தொடரவும்" : "Continue with Email"}
      </button>
      <button style={{ ...S.btn(C.navyLight, C.gray), border: `1px solid ${C.navyLight}` }} onClick={() => setScreen("home")}>Cancel</button>
      {mode === "google" && <p style={{ color: "#fbbf24", fontSize: 12, textAlign: "center" }}>Google Sign-In requires backend setup. Use Email for now.</p>}
    </div>
  );
  return (
    <div style={S.screen}>
      <div style={S.sHead}>✉️ {lang === "ta" ? "மின்னஞ்சல் மூலம் தொடர்" : "Continue with Email"}</div>
      <p style={S.label}>{lang === "ta" ? "மின்னஞ்சல் முகவரி *" : "Email ID *"}</p>
      <input style={S.input} type="email" placeholder="yourname@example.com" value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} />
      {err && <p style={S.err}>{err}</p>}
      <button style={S.btn(C.gold, C.navy)} onClick={handleEmail}>{lang === "ta" ? "தொடரவும்" : "Continue"}</button>
      <button style={{ ...S.btn(C.navyLight, C.white), border: `1px solid ${C.gray}` }} onClick={() => setMode(null)}>← Back</button>
    </div>
  );
}

// ─── REGISTER ───
function RegisterScreen({ setScreen, session, onRegistered, lang }) {
  const [form, setForm] = useState({ name: session?.name || "", email: session?.email || "", phone: "", department: "", year: "", occupation: "", first_aid_trained: null, first_aid_certified: null, remarks: "" });
  const [errors, setErrors] = useState({}); const [loading, setLoading] = useState(false); const [done, setDone] = useState(false);
  function upd(k, v) { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: null })); }
  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Full name required.";
    if (!form.phone.trim()) e.phone = "Phone required.";
    if (!form.remarks.trim()) e.remarks = "Training details required.";
    if (form.first_aid_certified === null) e.cert = "Please select Yes or No.";
    setErrors(e); return Object.keys(e).length === 0;
  }
  async function submit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await db.addVolunteer({ name: form.name, email: form.email, phone: form.phone, department: form.department, year: form.year, occupation: form.occupation, first_aid_trained: form.first_aid_trained || false, first_aid_certified: form.first_aid_certified || false, remarks: form.remarks, approved: false, online: false, availability: true, lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng });
      const profile = { ...session, registered: true, approved: false, name: form.name };
      saveSession(profile);
      sendVolunteerAlert({ name: form.name }, "registered");
      playSound("approve");
      onRegistered(profile);
      setDone(true);
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  }
  if (done) return (
    <div style={{ ...S.screen, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <p style={{ color: C.gold, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{lang === "ta" ? "விண்ணப்பம் சமர்ப்பிக்கப்பட்டது!" : "Application Submitted!"}</p>
      <div style={{ ...S.card(C.green), textAlign: "left", marginBottom: 16 }}>
        <p style={{ color: "#86efac", fontWeight: 700, margin: "0 0 6px" }}>✅ {lang === "ta" ? "வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது" : "Successfully Submitted"}</p>
        <p style={{ color: C.gray, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{lang === "ta" ? "நிர்வாகி ஒப்புதல் அளித்தவுடன் நீங்கள் தன்னார்வலர் பட்டியலில் தோன்றுவீர்கள்." : "You will appear in the volunteer list once admin approves your application. A notification will be sent."}</p>
      </div>
      <button style={S.btn(C.gold, C.navy)} onClick={() => setScreen("home")}>{lang === "ta" ? "முகப்பு திரும்பு" : "Back to Home"}</button>
    </div>
  );
  const YN = ({ val, k, errK }) => (
    <div style={{ marginBottom: 10 }}>
      {["yes", "no"].map(v => <button key={v} style={S.chip(val, v === "yes" ? true : false)} onClick={() => upd(k, v === "yes")}>{v === "yes" ? (lang === "ta" ? "ஆம்" : "Yes") : (lang === "ta" ? "இல்லை" : "No")}</button>)}
      {errors[errK] && <p style={S.err}>{errors[errK]}</p>}
    </div>
  );
  return (
    <div style={S.screen}>
      <div style={S.sHead}>📝 {lang === "ta" ? "தன்னார்வலர் பதிவு" : "Volunteer Registration"}</div>
      <div style={{ ...S.card(), marginBottom: 14 }}><p style={{ color: C.gold, fontWeight: 700, fontSize: 11, margin: "0 0 4px" }}>SAVED TO SUPABASE</p><p style={{ color: C.gray, fontSize: 12, margin: 0 }}>Admin approval required to appear in emergency search.</p></div>
      {[["Full Name *", "name", "text", "e.g. Karthik R", "name"], ["Phone Number *", "phone", "tel", "+91 9XXXXXXXXX", "phone"], ["Department", "department", "text", "e.g. Computer Science", null], ["Year of Study", "year", "text", "e.g. 2nd Year", null], ["Occupation", "occupation", "text", "e.g. Student / Doctor / Faculty", null]].map(([lbl, key, type, ph, errK]) => (
        <div key={key}>
          <p style={S.label}>{lbl}</p>
          <input style={S.input} type={type} placeholder={ph} value={form[key]} onChange={e => upd(key, e.target.value)} />
          {errK && errors[errK] && <p style={S.err}>{errors[errK]}</p>}
        </div>
      ))}
      <p style={S.label}>{lang === "ta" ? "முதலுதவி பயிற்சி?" : "First Aid Training?"}</p>
      <YN val={form.first_aid_trained} k="first_aid_trained" errK="trained" />
      <p style={S.label}>{lang === "ta" ? "முதலுதவி சான்றிதழ்? *" : "First Aid Certificate? *"}</p>
      <YN val={form.first_aid_certified} k="first_aid_certified" errK="cert" />
      <p style={S.label}>{lang === "ta" ? "பயிற்சி விவரங்கள் *" : "Training Details *"}</p>
      <input style={S.input} value={form.remarks} onChange={e => upd("remarks", e.target.value)} placeholder="e.g. Red Cross Basic First Aid, 2024" />
      {errors.remarks && <p style={S.err}>{errors.remarks}</p>}
      <button style={S.btn(C.gold, C.navy)} onClick={submit} disabled={loading}>{loading ? "Saving..." : (lang === "ta" ? "விண்ணப்பம் சமர்ப்பிக்கவும்" : "Submit Application")}</button>
      <button style={{ ...S.btn(C.navyLight, C.white), border: `1px solid ${C.gray}` }} onClick={() => setScreen("home")}>Cancel</button>
    </div>
  );
}

// ─── ALERTS PANEL ───
function AlertsPanel({ lang }) {
  const [alerts, setAlerts] = useState([...globalAlerts]);
  useEffect(() => subscribeAlerts(a => setAlerts([...a])), []);
  function mark(id) { setAlerts(p => p.map(a => a.id === id ? { ...a, read: true } : a)); }
  const iconFor = t => ({ call: "📞", map: "🗺", sos: "🚨", approved: "✅", rejected: "❌", broadcast: "📢", registered: "📝" }[t] || "🔔");
  if (alerts.length === 0) return <div style={{ ...S.card(), textAlign: "center", padding: 28 }}><div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div><p style={{ color: C.gray, fontSize: 13, margin: 0 }}>No alerts yet.</p></div>;
  return (
    <div>
      {alerts.map(a => (
        <div key={a.id} onClick={() => mark(a.id)} style={{ ...S.card(a.type === "sos" || a.type === "call" ? C.red : C.gold), background: a.read ? C.navyMid : (a.type === "sos" ? "#2d0a0a" : "#1a1400"), cursor: "pointer" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{iconFor(a.type)}</span>
            <div style={{ flex: 1 }}>
              {!a.read && <span style={{ fontSize: 9, background: C.red, color: C.white, padding: "1px 6px", borderRadius: 10, fontWeight: 800 }}>NEW</span>}
              <p style={{ color: C.white, fontSize: 12, margin: "4px 0 2px" }}><strong>{a.volName}</strong>: {a.message}</p>
              {a.userLoc && <p style={{ color: "#fbbf24", fontSize: 10, margin: "0 0 2px", fontFamily: "monospace" }}>📍 {fmtCoord(a.userLoc.lat)}, {fmtCoord(a.userLoc.lng)}</p>}
              <p style={{ color: C.gray, fontSize: 10, margin: 0 }}>{a.time}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN ───
function AdminScreen({ volunteers, setVolunteers, sosToday, lang }) {
  const [tab, setTab] = useState("alerts"); const [pin, setPin] = useState(""); const [unlocked, setUnlocked] = useState(false);
  const [alertBadge, setAlertBadge] = useState(0); const [broadcast, setBroadcast] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => subscribeAlerts(a => setAlertBadge(a.filter(x => !x.read).length)), []);
  if (!unlocked) return (
    <div style={S.screen}>
      <div style={S.sHead}>🔐 Admin Access</div>
      <div style={{ ...S.card(), textAlign: "center", padding: 28 }}>
        <p style={{ color: C.gray, fontSize: 13, marginBottom: 14 }}>Enter admin code to continue</p>
        <input style={{ ...S.input, textAlign: "center", letterSpacing: 2 }} type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Admin code" />
        <button style={S.btn(C.gold, C.navy)} onClick={() => { if (pin === ADMIN_PIN) setUnlocked(true); else alert("Invalid admin code."); }}>Unlock Dashboard</button>
      </div>
    </div>
  );
  const pending = volunteers.filter(v => !v.approved);
  const approved = volunteers.filter(v => v.approved);
  async function approve(vol) {
    setLoading(true);
    try {
      await db.updateVolunteer(vol.id, { approved: true, online: true, availability: true });
      setVolunteers(p => p.map(x => x.id === vol.id ? { ...x, approved: true, online: true, availability: true } : x));
      sendVolunteerAlert(vol, "approved"); playSound("approve");
    } catch (e) { alert(e.message); }
    setLoading(false);
  }
  async function reject(vol) {
    if (!window.confirm(`Reject ${vol.name}?`)) return;
    setLoading(true);
    try {
      await db.deleteVolunteer(vol.id);
      setVolunteers(p => p.filter(x => x.id !== vol.id));
      sendVolunteerAlert(vol, "rejected");
    } catch (e) { alert(e.message); }
    setLoading(false);
  }
  async function remove(vol) {
    if (!window.confirm(`Remove ${vol.name}?`)) return;
    setLoading(true);
    try { await db.deleteVolunteer(vol.id); setVolunteers(p => p.filter(x => x.id !== vol.id)); } catch (e) { alert(e.message); }
    setLoading(false);
  }
  function sendBroadcast() {
    if (!broadcast.trim()) return;
    approved.forEach(v => sendVolunteerAlert(v, "broadcast", { message: broadcast }));
    playSound("sos"); setBroadcast("");
    alert(`Broadcast sent to ${approved.length} volunteer(s).`);
  }
  const tabs = [
    { k: "alerts", label: `🔔${alertBadge > 0 ? ` (${alertBadge})` : ""}` },
    { k: "pending", label: `⏳ (${pending.length})` },
    { k: "approved", label: `✅ (${approved.length})` },
    { k: "contacts", label: "📞" },
    { k: "guide", label: "🩺" },
    { k: "broadcast", label: "📢" },
  ];
  const VolCard = ({ vol, isApproved }) => (
    <div style={S.card()}>
      <div style={{ ...S.row, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.navy, flexShrink: 0 }}>{vol.name?.charAt(0)}</div>
        <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 700, color: C.white, margin: 0 }}>{vol.name}</p><p style={{ fontSize: 11, color: C.gray, margin: 0 }}>{vol.department || vol.occupation || "—"}</p></div>
        {isApproved && <span style={S.badge(vol.online)}>{vol.online ? "Online" : "Offline"}</span>}
      </div>
      <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.7, marginBottom: 8 }}>
        <p style={{ margin: 0 }}>📧 {vol.email}</p>
        <p style={{ margin: 0 }}>📞 {vol.phone}</p>
        <p style={{ margin: 0 }}>🏅 Certified: {vol.first_aid_certified ? "Yes ✅" : "No ❌"}</p>
        {vol.remarks && <p style={{ margin: 0 }}>📋 {vol.remarks}</p>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {!isApproved && <button style={{ ...S.btnSm(C.green, C.white), flex: 1 }} onClick={() => approve(vol)} disabled={loading}>✓ Approve</button>}
        <button style={{ ...S.btnSm(C.red, C.white), flex: 1 }} onClick={() => isApproved ? remove(vol) : reject(vol)} disabled={loading}>{isApproved ? "Remove" : "✗ Reject"}</button>
      </div>
    </div>
  );
  return (
    <div style={S.screen}>
      <div style={S.sHead}>🛡 Admin Dashboard</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {tabs.map(({ k, label }) => <button key={k} style={{ ...S.btnSm(tab === k ? C.gold : C.navyLight, tab === k ? C.navy : C.gray), border: `1px solid ${tab === k ? C.gold : C.navyLight}` }} onClick={() => setTab(k)}>{label}</button>)}
      </div>
      {tab === "alerts" && <AlertsPanel lang={lang} />}
      {tab === "contacts" && <ContactsScreen canEdit lang={lang} />}
      {tab === "guide" && <GuideScreen lang={lang} canEdit />}
      {tab === "broadcast" && (
        <div style={S.card()}>
          <p style={S.label}>Broadcast Message</p>
          <textarea style={{ ...S.input, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} value={broadcast} onChange={e => setBroadcast(e.target.value)} placeholder="e.g. Campus drill at 3 PM today." />
          <button style={S.btn(C.gold, C.navy)} onClick={sendBroadcast}>📢 Send to All Approved</button>
        </div>
      )}
      {tab === "pending" && (
        <>{pending.length === 0 ? <div style={{ ...S.card(), textAlign: "center", padding: 28 }}><p style={{ color: C.gray, fontSize: 13 }}>No pending applications.</p></div> : pending.map(v => <VolCard key={v.id} vol={v} isApproved={false} />)}</>
      )}
      {tab === "approved" && (
        <>{approved.length === 0 ? <div style={{ ...S.card(), textAlign: "center", padding: 28 }}><p style={{ color: C.gray, fontSize: 13 }}>No approved volunteers.</p></div> : approved.map(v => <VolCard key={v.id} vol={v} isApproved={true} />)}</>
      )}
    </div>
  );
}

// ─── ROOT ───
export default function App() {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem("aga_lang") || "ta"; } catch { return "ta"; } });
  const toggleLang = () => { const n = lang === "ta" ? "en" : "ta"; setLang(n); try { localStorage.setItem("aga_lang", n); } catch {} };
  const [screen, setScreen] = useState("home");
  const [userLoc, setUserLoc] = useState(null);
  const [selectedVol, setSelectedVol] = useState(null);
  const [toast, setToast] = useState(null);
  const [alertBadge, setAlertBadge] = useState(0);
  const [session, setSession] = useState(() => loadSession());
  const [volunteers, setVolunteers] = useState([]);
  const [sosToday, setSosToday] = useState(0);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Load volunteers
  useEffect(() => {
    if (!userLoc) return;
    db.getVolunteers().then(d => { setVolunteers(d); setDbLoaded(true); }).catch(() => setDbLoaded(true));
  }, [userLoc]);

  // GPS live tracking — update location every 30s
  useEffect(() => {
    if (!userLoc || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      p => setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      null, { enableHighAccuracy: true, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [!!userLoc]);

  // Refresh volunteer locations every 30s
  useEffect(() => {
    if (!userLoc) return;
    const t = setInterval(() => {
      db.getVolunteers().then(d => setVolunteers(d)).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [!!userLoc]);

  useEffect(() => subscribeAlerts(alerts => {
    setAlertBadge(alerts.filter(a => !a.read).length);
    const latest = alerts[0];
    if (latest) { setToast(latest); setTimeout(() => setToast(null), 5000); }
  }), []);

  function onEnable(loc) { setUserLoc(loc); }

  function triggerSOS() {
    const nearby = volunteers.filter(v => v.approved && v.online && v.availability).map(v => ({ ...v, distance: haversine(userLoc.lat, userLoc.lng, parseFloat(v.lat), parseFloat(v.lng)) })).filter(v => v.distance <= CAMPUS_RADIUS_KM * 1000).sort((a, b) => a.distance - b.distance);
    if (nearby.length === 0) { alert("No available volunteers nearby. Calling Emergency Contacts."); setScreen("contacts"); return; }
    nearby.forEach(v => sendVolunteerAlert(v, "sos", { userLoc }));
    playSound("sos"); setSosToday(c => c + 1);
    alert(`🚨 SOS sent to ${nearby.length} nearby volunteer(s)!`);
  }

  if (!userLoc) return <LocationGate onEnable={onEnable} lang={lang} onToggle={toggleLang} />;

  const navItems = [
    { id: "home", icon: "🏠", label: lang === "ta" ? "முகப்பு" : "Home" },
    { id: "volunteers", icon: "🆘", label: lang === "ta" ? "தன்னார்வலர்" : "Volunteers" },
    { id: "guide", icon: "🩺", label: lang === "ta" ? "முதலுதவி" : "First Aid" },
    { id: "register", icon: "📝", label: lang === "ta" ? "பதிவு" : "Register" },
    { id: "admin", icon: "🛡", label: lang === "ta" ? "நிர்வாகி" : "Admin" },
  ];

  const screens = {
    home: <HomeScreen userLoc={userLoc} setScreen={setScreen} lang={lang} onSOS={triggerSOS} volunteers={volunteers} sosToday={sosToday} />,
    volunteers: <VolunteersScreen userLoc={userLoc} setScreen={setScreen} setSelectedVol={setSelectedVol} volunteers={volunteers} />,
    map: <MapScreen userLoc={userLoc} selectedVol={selectedVol} setScreen={setScreen} />,
    campusMap: <CampusMapScreen setScreen={setScreen} lang={lang} />,
    contacts: <ContactsScreen lang={lang} />,
    guide: <GuideScreen lang={lang} />,
    login: <LoginScreen onLoggedIn={p => { setSession(p); setScreen(p.registered ? "home" : "register"); }} setScreen={setScreen} lang={lang} />,
    register: session ? <RegisterScreen setScreen={setScreen} session={session} onRegistered={p => { setSession(p); db.getVolunteers().then(d => setVolunteers(d)).catch(() => {}); }} lang={lang} /> : <LoginScreen onLoggedIn={p => { setSession(p); setScreen("register"); }} setScreen={setScreen} lang={lang} />,
    admin: <AdminScreen volunteers={volunteers} setVolunteers={setVolunteers} sosToday={sosToday} lang={lang} />,
  };

  return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}input::placeholder,textarea::placeholder{color:#475569;}input:focus,textarea:focus{border-color:#D4A017!important;outline:none;}button:active{transform:scale(0.97);}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0A1628}::-webkit-scrollbar-thumb{background:#1A3058;border-radius:4px}@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      {toast && (
        <div style={{ position: "fixed", top: 90, left: "50%", transform: "translateX(-50%)", zIndex: 999, width: "92%", maxWidth: 390, background: toast.type === "sos" ? "#7f1d1d" : "#1a1400", border: `2px solid ${toast.type === "sos" ? C.red : C.gold}`, borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, animation: "slideDown 0.3s ease" }}>
          <span style={{ fontSize: 22 }}>{toast.type === "sos" ? "🆘" : toast.type === "approved" ? "✅" : toast.type === "registered" ? "📝" : "📢"}</span>
          <div style={{ flex: 1 }}><p style={{ fontWeight: 800, fontSize: 10, color: C.gold, margin: "0 0 2px" }}>ALERT</p><p style={{ color: C.white, fontSize: 12, margin: 0 }}>{toast.message}</p></div>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: C.gray, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
      )}
      <Header lang={lang} onToggle={toggleLang} />
      <LocationBanner userLoc={userLoc} lang={lang} />
      <div>{screens[screen] || screens.home}</div>
      <nav style={S.navBar}>
        {navItems.map(n => (
          <button key={n.id} style={S.navBtn(screen === n.id || (screen === "register" && n.id === "register") || (screen === "login" && n.id === "register"))} onClick={() => setScreen(n.id)}>
            <span style={{ fontSize: 19, position: "relative", display: "inline-block" }}>
              {n.icon}
              {n.id === "admin" && alertBadge > 0 && <span style={{ position: "absolute", top: -4, right: -6, background: C.red, color: C.white, borderRadius: "50%", fontSize: 8, fontWeight: 800, width: 13, height: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>{alertBadge}</span>}
            </span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
