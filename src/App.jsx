import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE ───
const SUPABASE_URL = "https://qyoektirhvroaarnzazy.supabase.co";
const SUPABASE_KEY = "sb_publishable_3LBPKOMdfUMeEkguQO98ug_7jcYg9ct";
async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: opts.prefer || "return=representation", ...(opts.headers || {}) },
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

// ─── FIRST AID GUIDE (hardcoded, always available offline) ───
const FIRST_AID = [
  { id: "bls", icon: "🫀", title: "Basic Life Support (BLS)", steps: ["Ensure scene safety — check for fire, electricity, traffic, water.", "Tap shoulders firmly and ask loudly: 'Are you okay?'", "Ask someone to call 108. If alone, call yourself.", "Head Tilt–Chin Lift. Look, listen, feel for breathing 10 sec.", "Breathing → Recovery Position. Not breathing → Start CPR."] },
  { id: "recovery", icon: "🛌", title: "Recovery Position", steps: ["Kneel beside the victim.", "Place nearest arm at right angle.", "Bring far arm across chest.", "Bend far knee upward.", "Roll person onto their side.", "Tilt head back to keep airway open.", "Monitor breathing until help arrives."] },
  { id: "cpr", icon: "❤️", title: "CPR (Cardiopulmonary Resuscitation)", steps: ["Place heel of hand on center of chest.", "Second hand on top, interlock fingers.", "Arms straight, shoulders above hands.", "30 compressions — hard and fast, 5 cm deep, 100–120/min.", "2 rescue breaths — pinch nose, cover mouth, watch chest rise.", "Repeat 30:2 until help arrives or breathing returns."] },
  { id: "choking", icon: "😮", title: "Choking", steps: ["Encourage forceful coughing if possible.", "Stand behind the victim.", "Place fist above navel, cover with other hand.", "Give quick upward thrusts.", "Continue until object is expelled or help arrives."] },
  { id: "fracture", icon: "🦴", title: "Fractures", steps: ["Keep injured area completely still.", "Do NOT attempt to straighten the bone.", "Apply ice pack wrapped in cloth.", "Support with sling or splint.", "Seek medical attention immediately."] },
  { id: "bleeding", icon: "🩸", title: "Severe Bleeding", steps: ["Wear gloves if available.", "Apply direct pressure to the wound.", "Elevate injured part above heart level.", "Cover with clean bandage.", "Continue pressure until bleeding stops.", "Call 108 if bleeding is severe."] },
  { id: "drowning", icon: "🌊", title: "Drowning", steps: ["Remove victim from water safely.", "Call 108 immediately.", "Check breathing.", "Breathing → Recovery Position.", "Not breathing → Start CPR.", "Continue until medical help arrives."] },
  { id: "burns", icon: "🔥", title: "Burns", steps: ["Remove from heat source.", "Cool burn with running water for 20 minutes.", "Remove tight jewelry carefully.", "Cover with sterile dressing.", "STOP–DROP–ROLL if clothing is on fire.", "Do NOT apply toothpaste, butter, or oil. Do NOT break blisters."] },
  { id: "seizure", icon: "⚡", title: "Seizures (Fits)", steps: ["Stay calm. Move dangerous objects away.", "Cushion the head.", "Loosen tight clothing.", "Do NOT restrain or put anything in mouth.", "Time the seizure.", "After it stops → Recovery Position.", "Call 108 if seizure lasts more than 5 minutes."] },
  { id: "heartattack", icon: "💔", title: "Heart Attack", steps: ["Call 108 immediately.", "Make person sit comfortably.", "Loosen tight clothing.", "Keep calm — no food or drinks.", "If unconscious and not breathing → Start CPR."] },
  { id: "snakebite", icon: "🐍", title: "Snake Bite", steps: ["Keep victim calm and still.", "Wash bite area gently.", "Keep bitten limb BELOW heart level.", "Remove rings and tight items.", "Call 108 and go to hospital immediately.", "Do NOT cut, suck venom, or apply ice."] },
  { id: "dogbite", icon: "🐕", title: "Dog Bite", steps: ["Wash wound with running water for several minutes.", "Clean with soap.", "Cover with sterile dressing.", "Visit hospital immediately.", "Assess rabies vaccination status."] },
  { id: "fire", icon: "🚒", title: "Fire Emergency", steps: ["Activate fire alarm.", "Leave immediately — use stairs NOT elevator.", "Crawl below smoke level.", "Cover nose and mouth with wet cloth.", "Close doors behind you.", "Move to safe assembly point.", "Do NOT use lifts or open hot doors."] },
];

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

// ─── HELPERS ───
function haversine(a, b, c, d) { const R=6371000,r=x=>x*Math.PI/180,dL=r(c-a),dG=r(d-b),s=Math.sin(dL/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dG/2)**2; return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s)); }
function fmtDist(m) { return m < 1000 ? `${Math.round(m)}m` : `${(m/1000).toFixed(1)}km`; }
function bearingDeg(a,b,c,d){const r=x=>x*Math.PI/180,dG=r(d-b);return(Math.atan2(Math.sin(dG)*Math.cos(r(c)),Math.cos(r(a))*Math.sin(r(c))-Math.sin(r(a))*Math.cos(r(c))*Math.cos(dG))*180/Math.PI+360)%360;}

function loadContacts(){try{const r=localStorage.getItem("aga_contacts");return r?JSON.parse(r):DEFAULT_CONTACTS;}catch{return DEFAULT_CONTACTS;}}
function saveContacts(c){try{localStorage.setItem("aga_contacts",JSON.stringify(c));}catch{}}
function loadSession(){try{const r=localStorage.getItem("aga_session");return r?JSON.parse(r):null;}catch{return null;}}
function saveSession(s){try{localStorage.setItem("aga_session",JSON.stringify(s));}catch{}}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const b = (f,s,d,w="square",v=0.3) => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination);o.type=w;o.frequency.setValueAtTime(f,now+s);g.gain.setValueAtTime(0,now+s);g.gain.linearRampToValueAtTime(v,now+s+0.03);g.gain.linearRampToValueAtTime(0,now+s+d);o.start(now+s);o.stop(now+s+d+0.05); };
    if(type==="sos")[0,.2,.4,.6,.8,1].forEach((t,i)=>b(i%2===0?700:1300,t,.18,"sawtooth",.4));
    else if(type==="call")[0,.28,.56,.84].forEach((t,i)=>b(i%2===0?880:1100,t,.24));
    else [0,.18,.36].forEach(t=>b(1400,t,.15,"sine",.25));
  } catch {}
}

// ─── GLOBAL ALERTS (admin) ───
let gAlerts = [], aListeners = [];
function subAlerts(fn){aListeners.push(fn);return()=>{aListeners=aListeners.filter(l=>l!==fn);};}
function pushAlert(a){gAlerts=[a,...gAlerts].slice(0,80);aListeners.forEach(fn=>fn([...gAlerts]));}
function sendAlert(vol, type, extra={}) {
  const msgs = { call:"📞 Someone is calling you for emergency help!", map:"🗺 Someone is viewing your location!", sos:"🚨 SOS ALERT — emergency help needed nearby!", approved:"✅ Your application has been approved!", rejected:"❌ Your application was not approved.", broadcast: extra.message||"📢 Broadcast from Admin." };
  pushAlert({ id:Date.now()+Math.random(), volId:vol?.id, volName:vol?.name||"All", type, message:msgs[type]||"Alert", time:new Date().toLocaleTimeString(), read:false, userLoc:extra.userLoc||null });
}

// ─── COLORS & STYLES ───
const C = { navy:"#0A1628", navyMid:"#122040", navyLight:"#1A3058", gold:"#D4A017", red:"#C0392B", white:"#FFFFFF", gray:"#94A3B8", green:"#16A34A", blue:"#3B82F6" };
const S = {
  app:{ fontFamily:"'Inter',system-ui,sans-serif", background:C.navy, minHeight:"100vh", color:C.white, maxWidth:430, margin:"0 auto", position:"relative", overflowX:"hidden" },
  header:{ background:C.navyMid, borderBottom:`2px solid ${C.gold}`, padding:"10px 12px 8px" },
  screen:{ padding:"16px 14px", paddingBottom:95 },
  btn:(bg,fg)=>({ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"12px 18px", borderRadius:10, border:"none", fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:10, background:bg, color:fg }),
  btnSm:(bg,fg)=>({ padding:"8px 14px", borderRadius:8, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", background:bg, color:fg }),
  card:(border)=>({ background:C.navyMid, border:`1px solid ${border||C.navyLight}`, borderRadius:12, padding:"14px 15px", marginBottom:10 }),
  label:{ fontSize:11, color:C.gold, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:4, marginTop:8, display:"block" },
  input:{ width:"100%", background:C.navyLight, border:`1px solid ${C.navyLight}`, borderRadius:8, padding:"10px 12px", color:C.white, fontSize:14, marginBottom:10, boxSizing:"border-box", outline:"none" },
  badge:ok=>({ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:ok?"#14532d":"#7f1d1d", color:ok?"#86efac":"#fca5a5" }),
  navBar:{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:C.navyMid, borderTop:`2px solid ${C.gold}`, display:"flex", zIndex:200 },
  navBtn:a=>({ flex:1, padding:"9px 2px 7px", background:"none", border:"none", color:a?C.gold:C.gray, fontSize:8, fontWeight:700, cursor:"pointer", textTransform:"uppercase", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }),
  sHead:{ fontSize:12, fontWeight:800, color:C.gold, textTransform:"uppercase", letterSpacing:1, marginBottom:12 },
  chip:(s,v)=>({ padding:"6px 12px", borderRadius:20, border:`1px solid ${s===v?C.gold:C.navyLight}`, background:s===v?C.gold:C.navyLight, color:s===v?C.navy:C.gray, fontSize:12, fontWeight:700, cursor:"pointer", marginRight:6, marginBottom:6 }),
  statBox:{ background:C.navyMid, border:`1px solid ${C.navyLight}`, borderRadius:12, padding:"12px 8px", textAlign:"center" },
  row:{ display:"flex", gap:8, alignItems:"center" },
  err:{ color:"#fca5a5", fontSize:11, marginTop:-6, marginBottom:8 },
};

// ─── HEADER ───
function Header({ lang, onToggle }) {
  return (
    <div style={S.header}>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:3 }}>
        <button onClick={onToggle} style={{ background:C.navyLight, border:`1px solid ${C.gold}`, borderRadius:20, padding:"3px 10px", color:C.gold, fontSize:10, fontWeight:700, cursor:"pointer" }}>
          {lang==="ta" ? "தமிழ் / EN" : "EN / தமிழ்"}
        </button>
      </div>
      <div style={{ textAlign:"center" }}>
        <p style={{ fontSize:16, fontWeight:800, color:C.white, margin:0 }}>AGA {lang==="ta" ? "அவசர சேவை" : "EMERGENCY RESPONSE"}</p>
        <p style={{ fontSize:9, color:C.gold, fontWeight:700, margin:"2px 0 0", letterSpacing:0.5 }}>Alert Golden Army · PSGCAS Chapter</p>
        <p style={{ fontSize:8, color:C.gray, margin:"1px 0 0" }}>PSG {lang==="ta" ? "கலை மற்றும் அறிவியல் கல்லூரி, கோயம்புத்தூர்" : "College of Arts & Science, Coimbatore"}</p>
      </div>
    </div>
  );
}

// ─── LOCATION GATE ───
function LocationGate({ onEnable, lang, onToggle }) {
  const [err, setErr] = useState(false);
  function tryEnable() {
    setErr(false);
    if (!navigator.geolocation) { onEnable(CAMPUS_CENTER); return; }
    navigator.geolocation.getCurrentPosition(
      pos => onEnable({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { setErr(true); onEnable(CAMPUS_CENTER); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }
  return (
    <div style={{ ...S.app, display:"flex", flexDirection:"column" }}>
      <Header lang={lang} onToggle={onToggle} />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:20 }}>🚨</div>
          <div style={{ background:"#7f1d1d", border:`1px solid ${C.red}`, borderRadius:14, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📍</div>
            <p style={{ color:"#fecaca", fontWeight:700, fontSize:15, margin:"0 0 6px" }}>{lang==="ta" ? "இருப்பிட அனுமதி தேவை" : "Location Access Required"}</p>
            <p style={{ color:"#fca5a5", fontSize:13, margin:0, lineHeight:1.5 }}>{lang==="ta" ? "AGA அவசர சேவைக்கு உங்கள் இருப்பிடம் தேவை." : "AGA Emergency Response needs your location to work."}</p>
          </div>
          {err && <p style={{ color:"#fbbf24", fontSize:12, marginBottom:12 }}>Location denied — using campus center as fallback.</p>}
          <button style={S.btn(C.gold, C.navy)} onClick={tryEnable}>📍 {lang==="ta" ? "இருப்பிடத்தை இயக்கு" : "Enable Location"}</button>
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
    { icon:"🆘", label:lang==="ta"?"அருகிலுள்ள தன்னார்வலர்கள்":"Find Nearby Volunteers", to:"volunteers" },
    { icon:"📞", label:lang==="ta"?"அவசர தொடர்புகள்":"Emergency Contacts", to:"contacts" },
    { icon:"🗺️", label:lang==="ta"?"வளாக வரைபடம்":"Campus Map", to:"campusMap" },
    { icon:"🩺", label:lang==="ta"?"முதலுதவி வழிகாட்டி":"First Aid Guide", to:"guide" },
    { icon:"👤", label:lang==="ta"?"என் சுயவிவரம்":"My Profile", to:"profile" },
    { icon:"📝", label:lang==="ta"?"தன்னார்வலராக பதிவு":"Register as Volunteer", to:"login" },
  ];
  return (
    <div style={S.screen}>
      <div style={{ background:"#0d1f35", borderRadius:12, padding:"8px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:12 }}>📍</span>
        <span style={{ fontSize:11, color:C.gold, fontWeight:700 }}>LOCATION: </span>
        <span style={{ fontSize:11, color:C.white, fontFamily:"monospace" }}>{userLoc ? `${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)}` : "—"}</span>
        <div style={{ width:8, height:8, borderRadius:"50%", background:C.green, marginLeft:"auto", boxShadow:`0 0 6px ${C.green}` }} />
      </div>
      <button onClick={onSOS} style={{ ...S.btn(C.red, C.white), fontSize:20, fontWeight:900, padding:"22px 18px", borderRadius:16, boxShadow:"0 0 28px rgba(192,57,43,0.55)", letterSpacing:1, marginBottom:14 }}>
        🚨 {lang==="ta" ? "SOS — அவசரம்" : "SOS — EMERGENCY"}
      </button>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
        {tiles.map(b => (
          <button key={b.to} style={{ ...S.btn(C.navyLight, C.white), marginBottom:0, flexDirection:"column", padding:"14px 8px", gap:4, border:`1px solid ${C.navyLight}` }} onClick={() => setScreen(b.to)}>
            <span style={{ fontSize:22 }}>{b.icon}</span>
            <span style={{ fontSize:11 }}>{b.label}</span>
          </button>
        ))}
      </div>
      <div style={S.sHead}>📊 {lang==="ta" ? "டாஷ்போர்டு" : "Dashboard"}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div style={S.statBox}><p style={{ fontSize:24, fontWeight:900, color:C.gold, margin:0 }}>{approved.length}</p><p style={{ fontSize:10, color:C.gray, margin:"3px 0 0" }}>{lang==="ta" ? "மொத்த தன்னார்வலர்கள்" : "Total Volunteers"}</p></div>
        <div style={S.statBox}><p style={{ fontSize:24, fontWeight:900, color:C.green, margin:0 }}>{active}</p><p style={{ fontSize:10, color:C.gray, margin:"3px 0 0" }}>{lang==="ta" ? "செயலில் உள்ளவர்கள்" : "Active Now"}</p></div>
        <div style={S.statBox}><p style={{ fontSize:24, fontWeight:900, color:C.red, margin:0 }}>{sosToday}</p><p style={{ fontSize:10, color:C.gray, margin:"3px 0 0" }}>{lang==="ta" ? "இன்றைய SOS" : "SOS Today"}</p></div>
        <div style={S.statBox}><p style={{ fontSize:24, fontWeight:900, color:C.blue, margin:0 }}>🟢</p><p style={{ fontSize:10, color:C.gray, margin:"3px 0 0" }}>Supabase Live</p></div>
      </div>
    </div>
  );
}

// ─── VOLUNTEERS ───
function VolunteersScreen({ userLoc, setScreen, setSelectedVol, volunteers }) {
  const [filter, setFilter] = useState("all");
  const withDist = volunteers.filter(v => v.approved).map(v => ({ ...v, distance: userLoc && v.lat && v.lng ? haversine(userLoc.lat, userLoc.lng, v.lat, v.lng) : 999 })).filter(v => v.distance <= CAMPUS_RADIUS_KM * 1000);
  const shown = withDist.filter(v => filter==="available" ? (v.availability && v.online) : filter==="certified" ? v.first_aid_certified : true).sort((a,b) => a.distance - b.distance);
  function callVol(vol) { window.location.href = `tel:${vol.phone}`; sendAlert(vol,"call",{userLoc}); playSound("call"); }
  function viewMap(vol) { sendAlert(vol,"map",{userLoc}); playSound("ping"); setSelectedVol(vol); setScreen("map"); }
  return (
    <div style={S.screen}>
      <div style={S.sHead}>🆘 Nearby Volunteers</div>
      <p style={{ color:C.gray, fontSize:11, marginTop:-8, marginBottom:12 }}>Within {CAMPUS_RADIUS_KM}km · live from Supabase</p>
      <div style={{ marginBottom:14 }}>
        {["all","available","certified"].map(f => <button key={f} style={S.chip(filter,f)} onClick={() => setFilter(f)}>{f==="all"?"All":f==="available"?"Available":"Certified"}</button>)}
      </div>
      {shown.length===0 && <div style={{ ...S.card(), textAlign:"center", padding:32 }}><p style={{ color:C.gray, fontSize:13 }}>No volunteers found within {CAMPUS_RADIUS_KM}km.</p></div>}
      {shown.map(vol => (
        <div key={vol.id} style={S.card(C.gold)}>
          <div style={{ ...S.row, marginBottom:10 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:C.gold, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:C.navy, flexShrink:0 }}>{vol.name?.charAt(0)}</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:15, fontWeight:700, color:C.white, margin:0 }}>{vol.name}</p>
              <p style={{ fontSize:11, color:C.gray, margin:"2px 0 0" }}>{vol.department || vol.occupation} {vol.year ? `· ${vol.year}` : ""}</p>
            </div>
            <div style={{ textAlign:"right" }}><p style={{ fontSize:20, fontWeight:800, color:C.gold, margin:0 }}>{fmtDist(vol.distance)}</p><p style={{ fontSize:10, color:C.gray }}>away</p></div>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            <span style={S.badge(vol.online)}>{vol.online?"Online":"Offline"}</span>
            <span style={S.badge(vol.availability)}>{vol.availability?"Available":"Unavailable"}</span>
            <span style={S.badge(vol.first_aid_certified)}>{vol.first