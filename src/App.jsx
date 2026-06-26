import { useState, useEffect, useRef, useCallback } from "react";

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
  { id:"bls", icon:"🫀", title:"Basic Life Support (BLS)", steps:["Ensure scene safety — check for fire, electricity, traffic, water.","Tap shoulders firmly and ask loudly: 'Are you okay?'","Ask someone to call 108. If alone, call yourself.","Head Tilt–Chin Lift. Look, listen, feel for breathing 10 sec.","Breathing → Recovery Position. Not breathing → Start CPR."] },
  { id:"recovery", icon:"🛌", title:"Recovery Position", steps:["Kneel beside the victim.","Place nearest arm at right angle.","Bring far arm across chest.","Bend far knee upward.","Roll person onto their side.","Tilt head back to keep airway open.","Monitor breathing until help arrives."] },
  { id:"cpr", icon:"❤️", title:"CPR (Cardiopulmonary Resuscitation)", steps:["Place heel of hand on center of chest.","Second hand on top, interlock fingers.","Arms straight, shoulders above hands.","30 compressions — hard and fast, 5 cm deep, 100–120/min.","2 rescue breaths — pinch nose, cover mouth, watch chest rise.","Repeat 30:2 until help arrives or breathing returns."] },
  { id:"choking", icon:"😮", title:"Choking", steps:["Encourage forceful coughing if possible.","Stand behind the victim.","Place fist above navel, cover with other hand.","Give quick upward thrusts.","Continue until object is expelled or help arrives."] },
  { id:"fracture", icon:"🦴", title:"Fractures", steps:["Keep injured area completely still.","Do NOT attempt to straighten the bone.","Apply ice pack wrapped in cloth.","Support with sling or splint.","Seek medical attention immediately."] },
  { id:"bleeding", icon:"🩸", title:"Severe Bleeding", steps:["Wear gloves if available.","Apply direct pressure to the wound.","Elevate injured part above heart level.","Cover with clean bandage.","Continue pressure until bleeding stops.","Call 108 if bleeding is severe."] },
  { id:"drowning", icon:"🌊", title:"Drowning", steps:["Remove victim from water safely.","Call 108 immediately.","Check breathing.","Breathing → Recovery Position.","Not breathing → Start CPR.","Continue until medical help arrives."] },
  { id:"burns", icon:"🔥", title:"Burns", steps:["Remove from heat source.","Cool burn with running water for 20 minutes.","Remove tight jewelry carefully.","Cover with sterile dressing.","STOP–DROP–ROLL if clothing is on fire.","Do NOT apply toothpaste, butter, or oil. Do NOT break blisters."] },
  { id:"seizure", icon:"⚡", title:"Seizures (Fits)", steps:["Stay calm. Move dangerous objects away.","Cushion the head.","Loosen tight clothing.","Do NOT restrain or put anything in mouth.","Time the seizure.","After it stops → Recovery Position.","Call 108 if seizure lasts more than 5 minutes."] },
  { id:"heartattack", icon:"💔", title:"Heart Attack", steps:["Call 108 immediately.","Make person sit comfortably.","Loosen tight clothing.","Keep calm — no food or drinks.","If unconscious and not breathing → Start CPR."] },
  { id:"snakebite", icon:"🐍", title:"Snake Bite", steps:["Keep victim calm and still.","Wash bite area gently.","Keep bitten limb BELOW heart level.","Remove rings and tight items.","Call 108 and go to hospital immediately.","Do NOT cut, suck venom, or apply ice."] },
  { id:"dogbite", icon:"🐕", title:"Dog Bite", steps:["Wash wound with running water for several minutes.","Clean with soap.","Cover with sterile dressing.","Visit hospital immediately.","Assess rabies vaccination status."] },
  { id:"fire", icon:"🚒", title:"Fire Emergency", steps:["Activate fire alarm.","Leave immediately — use stairs NOT elevator.","Crawl below smoke level.","Cover nose and mouth with wet cloth.","Close doors behind you.","Move to safe assembly point.","Do NOT use lifts or open hot doors."] },
];

// ─── FIRST AID TAMIL (editable) ───
const DEFAULT_GUIDE_TA = [
  { id:"bls", icon:"🫀", title:"அடிப்படை உயிர் ஆதரவு (BLS)", steps:["காட்சி பாதுகாப்பை உறுதிசெய்யவும்.","தோள்களை தட்டி கூவுங்கள்: 'நீங்கள் சரியாக இருக்கிறீர்களா?'","108 அழைக்கவும்.","Head Tilt–Chin Lift. சுவாசத்தை 10 விநாடி சரிபார்க்கவும்.","சுவாசிக்கிறார் → Recovery Position. இல்லை → CPR தொடங்கவும்."] },
  { id:"recovery", icon:"🛌", title:"Recovery Position", steps:["பாதிக்கப்பட்டவரின் அருகில் மண்டியிடவும்.","அருகிலுள்ள கையை செங்கோணத்தில் வையுங்கள்.","தூரத்திலுள்ள கையை மார்பின் குறுக்கே கொண்டு வாருங்கள்.","தூரத்திலுள்ள முழங்காலை மேல்நோக்கி வளைக்கவும்.","பக்கவாட்டில் திருப்பவும்.","சுவாசப் பாதை திறக்க தலையை பின்னோக்கி சாய்க்கவும்.","உதவி வரும் வரை சுவாசத்தை கண்காணிக்கவும்."] },
  { id:"cpr", icon:"❤️", title:"CPR", steps:["மார்பின் மையத்தில் கை வையுங்கள்.","இரண்டாவது கை மேலே, விரல்கள் பிணைந்து.","கைகள் நேராக, தோள்கள் மேலே.","30 அழுத்தங்கள் — வேகமாக, 5 செ.மீ ஆழம், 100–120/நிமிடம்.","2 மூச்சுகள் — மூக்கை பிடித்து, வாயை மூடி, மார்பு உயர்கிறதா பாருங்கள்.","உதவி வரும் வரை 30:2 தொடரவும்."] },
  { id:"choking", icon:"😮", title:"தொண்டை அடைப்பு", steps:["இயன்றால் வலுவான இருமலை ஊக்குவிக்கவும்.","பாதிக்கப்பட்டவருக்கு பின்னால் நிற்கவும்.","தொப்புளுக்கு மேலே முஷ்டி வையுங்கள்.","விரைவாக மேல்நோக்கி அழுத்தவும்.","பொருள் வெளியேறும் வரை தொடரவும்."] },
  { id:"fracture", icon:"🦴", title:"எலும்பு முறிவு", steps:["காயமடைந்த பகுதியை முற்றிலும் அசைக்காதீர்கள்.","எலும்பை நேராக்க முயற்சிக்காதீர்கள்.","துணியில் சுற்றிய ice pack வையுங்கள்.","சling அல்லது splint மூலம் ஆதரிக்கவும்.","உடனே மருத்துவ உதவி நாடவும்."] },
  { id:"bleeding", icon:"🩸", title:"கடுமையான இரத்தப்போக்கு", steps:["கையுறை இருந்தால் அணியுங்கள்.","காயத்தில் நேரடி அழுத்தம் கொடுங்கள்.","காயமடைந்த பகுதியை இதயத்திற்கு மேலே உயர்த்தவும்.","சுத்தமான கட்டுடன் மூடவும்.","இரத்தப்போக்கு நிற்கும் வரை அழுத்தத்தை தொடரவும்.","கடுமையாக இருந்தால் 108 அழைக்கவும்."] },
  { id:"drowning", icon:"🌊", title:"நீரில் மூழ்குதல்", steps:["பாதுகாப்பாக நீரிலிருந்து வெளியேற்றவும்.","உடனே 108 அழைக்கவும்.","சுவாசத்தை சரிபார்க்கவும்.","சுவாசிக்கிறார் → Recovery Position.","இல்லை → CPR தொடங்கவும்.","மருத்துவ உதவி வரும் வரை தொடரவும்."] },
  { id:"burns", icon:"🔥", title:"தீக்காயங்கள்", steps:["வெப்ப மூலத்திலிருந்து அகற்றவும்.","20 நிமிடங்கள் ஓடும் தண்ணீரில் குளிர்விக்கவும்.","இறுக்கமான நகைகளை கவனமாக அகற்றவும்.","மலட்டு கட்டுடன் மூடவும்.","உடை தீப்பிடித்தால் — நிறுத்தவும், விழவும், உருளவும்.","பேஸ்ட், வெண்ணெய், எண்ணெய் தடவாதீர்கள். குமிழிகளை உடைக்காதீர்கள்."] },
  { id:"seizure", icon:"⚡", title:"வலிப்பு", steps:["அமைதியாக இருக்கவும். ஆபத்தான பொருட்களை அகற்றவும்.","தலையை தலையணையால் ஆதரிக்கவும்.","இறுக்கமான ஆடைகளை தளர்த்தவும்.","கட்டாயப்படுத்தாதீர்கள் அல்லது வாயில் எதுவும் வைக்காதீர்கள்.","வலிப்பு நேரத்தை கவனியுங்கள்.","நிற்கும் போது → Recovery Position.","5 நிமிடங்களுக்கு மேல் இருந்தால் 108 அழைக்கவும்."] },
  { id:"heartattack", icon:"💔", title:"மாரடைப்பு", steps:["உடனே 108 அழைக்கவும்.","நபரை வசதியாக அமரவையுங்கள்.","இறுக்கமான ஆடைகளை தளர்த்தவும்.","அமைதியாக இருங்கள் — உணவு அல்லது பானம் கொடுக்காதீர்கள்.","நினைவிழந்து சுவாசிக்கவில்லை என்றால் → CPR தொடங்கவும்."] },
  { id:"snakebite", icon:"🐍", title:"பாம்பு கடி", steps:["பாதிக்கப்பட்டவரை அமைதியாகவும் சலனமின்றியும் வையுங்கள்.","கடிக்கப்பட்ட இடத்தை மெதுவாக கழுவுங்கள்.","கடிக்கப்பட்ட உறுப்பை இதயத்திற்கு கீழே வையுங்கள்.","மோதிரங்கள் மற்றும் இறுக்கமான பொருட்களை அகற்றவும்.","108 அழைத்து உடனே மருத்துவமனை செல்லவும்.","வெட்டாதீர்கள், நஞ்சை உறிஞ்சாதீர்கள், ice வையாதீர்கள்."] },
  { id:"dogbite", icon:"🐕", title:"நாய் கடி", steps:["சில நிமிடங்கள் ஓடும் தண்ணீரில் காயத்தை கழுவுங்கள்.","சோப்பால் சுத்தம் செய்யுங்கள்.","மலட்டு கட்டுடன் மூடவும்.","உடனே மருத்துவமனை செல்லவும்.","தொற்று நோய் தடுப்பூசி நிலையை சரிபார்க்கவும்."] },
  { id:"fire", icon:"🚒", title:"தீ அவசரநிலை", steps:["தீ எச்சரிக்கை அலாரத்தை இயக்கவும்.","உடனே வெளியேறவும் — லிஃப்ட் பயன்படுத்தாதீர்கள்.","புகைக்கு கீழே ஊர்ந்து செல்லவும்.","ஈரத்துணியால் மூக்கு வாயை மூடவும்.","பின்னால் கதவுகளை மூடவும்.","பாதுகாப்பான சேர்க்கை இடத்திற்கு செல்லவும்.","சூடான கதவுகளை திறக்காதீர்கள்."] },
];

const DEFAULT_CONTACTS = [
  { key:"ambulance", icon:"🚑", label:"Ambulance", number:"108", desc:"National Emergency" },
  { key:"hospital", icon:"🏥", label:"Hospital", number:"+914222572180", desc:"Nearest Govt. Hospital" },
  { key:"security", icon:"🔐", label:"College Security", number:"+914222572177", desc:"PSG CAS Security" },
  { key:"fire", icon:"🚒", label:"Fire Service", number:"101", desc:"Fire Emergency" },
  { key:"helpdesk", icon:"🛎️", label:"College Help Desk", number:"+914222572178", desc:"General Assistance" },
  { key:"medical", icon:"⚕️", label:"Medical Room", number:"+914222572179", desc:"Campus Medical Center" },
];

const CAMPUS_LANDMARKS = [
  { name:"Main Gate", lat:11.0348, lng:77.0350, icon:"🏛️" },
  { name:"Library", lat:11.0342, lng:77.0358, icon:"📚" },
  { name:"Canteen", lat:11.0350, lng:77.0362, icon:"🍽️" },
  { name:"Parking Area", lat:11.0338, lng:77.0348, icon:"🅿️" },
  { name:"Assembly Point", lat:11.0352, lng:77.0370, icon:"📢" },
  { name:"Medical Room", lat:11.0355, lng:77.0375, icon:"⚕️" },
];

// ─── VOLUNTEER NOTIFICATIONS ───
function getVolNotifs(email) { try { return JSON.parse(localStorage.getItem(`aga_notifs_${email}`) || "[]"); } catch { return []; } }
function saveVolNotifs(email, n) { try { localStorage.setItem(`aga_notifs_${email}`, JSON.stringify(n.slice(0,50))); } catch {} }
function pushVolNotif(email, notif) {
  if (!email) return;
  const existing = getVolNotifs(email);
  saveVolNotifs(email, [{ ...notif, id: Date.now()+Math.random(), time: new Date().toLocaleTimeString(), read: false }, ...existing]);
}

// ─── GLOBAL ALERTS (admin) ───
let gAlerts = [], aListeners = [];
function subAlerts(fn) { aListeners.push(fn); return () => { aListeners = aListeners.filter(l => l !== fn); }; }
function pushAlert(a) { gAlerts = [a, ...gAlerts].slice(0,80); aListeners.forEach(fn => fn([...gAlerts])); }
function sendAlert(vol, type, extra = {}) {
  const msgs = { call:"📞 Someone is calling you for emergency help!", map:"🗺 Someone is viewing your location!", sos:"🚨 SOS ALERT — emergency help needed nearby!", approved:"✅ Your application has been approved!", rejected:"❌ Your application was not approved.", broadcast:extra.message||"📢 Broadcast from Admin.", registered:"📝 Registration submitted! Waiting for admin approval." };
  const notif = { id:Date.now()+Math.random(), volId:vol?.id, volName:vol?.name||"All", type, message:msgs[type]||"Alert", time:new Date().toLocaleTimeString(), read:false, userLoc:extra.userLoc||null };
  pushAlert(notif);
  if (vol?.email) pushVolNotif(vol.email, notif);
}

// ─── HELPERS ───
function haversine(a,b,c,d){const R=6371000,r=x=>x*Math.PI/180,dL=r(c-a),dG=r(d-b),s=Math.sin(dL/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dG/2)**2;return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));}
function fmtDist(m){return m<1000?`${Math.round(m)}m`:`${(m/1000).toFixed(1)}km`;}
function fmtCoord(n){return n!=null?parseFloat(n).toFixed(5):"—";}
function bearingDeg(a,b,c,d){const r=x=>x*Math.PI/180,dG=r(d-b);return(Math.atan2(Math.sin(dG)*Math.cos(r(c)),Math.cos(r(a))*Math.sin(r(c))-Math.sin(r(a))*Math.cos(r(c))*Math.cos(dG))*180/Math.PI+360)%360;}
function loadContacts(){try{const r=localStorage.getItem("aga_contacts");return r?JSON.parse(r):DEFAULT_CONTACTS;}catch{return DEFAULT_CONTACTS;}}
function saveContacts(c){try{localStorage.setItem("aga_contacts",JSON.stringify(c));}catch{}}
function loadSession(){try{const r=localStorage.getItem("aga_session");return r?JSON.parse(r):null;}catch{return null;}}
function saveSession(s){try{localStorage.setItem("aga_session",s?JSON.stringify(s):null);}catch{}}
function loadGuideTa(){try{const r=localStorage.getItem("aga_guide_ta");return r?JSON.parse(r):DEFAULT_GUIDE_TA;}catch{return DEFAULT_GUIDE_TA;}}
function saveGuideTa(g){try{localStorage.setItem("aga_guide_ta",JSON.stringify(g));}catch{}}

function playSound(type){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const now=ctx.currentTime;
    const b=(f,s,d,w="square",v=0.3)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type=w;o.frequency.setValueAtTime(f,now+s);g.gain.setValueAtTime(0,now+s);g.gain.linearRampToValueAtTime(v,now+s+0.03);g.gain.linearRampToValueAtTime(0,now+s+d);o.start(now+s);o.stop(now+s+d+0.05);};
    if(type==="sos")[0,.2,.4,.6,.8,1].forEach((t,i)=>b(i%2===0?700:1300,t,.18,"sawtooth",.4));
    else if(type==="call")[0,.28,.56,.84].forEach((t,i)=>b(i%2===0?880:1100,t,.24));
    else[0,.18,.36].forEach(t=>b(1400,t,.15,"sine",.25));
  }catch{}
}

// ─── COLORS & STYLES ───
const C={navy:"#0A1628",navyMid:"#122040",navyLight:"#1A3058",gold:"#D4A017",red:"#C0392B",white:"#FFFFFF",gray:"#94A3B8",green:"#16A34A",blue:"#3B82F6"};
const S={
  app:{fontFamily:"'Inter',system-ui,sans-serif",background:C.navy,minHeight:"100vh",color:C.white,maxWidth:430,margin:"0 auto",position:"relative",overflowX:"hidden"},
  header:{background:C.navyMid,borderBottom:`2px solid ${C.gold}`,padding:"10px 12px 8px"},
  screen:{padding:"16px 14px",paddingBottom:95},
  btn:(bg,fg)=>({display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"12px 18px",borderRadius:10,border:"none",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10,background:bg,color:fg}),
  btnSm:(bg,fg)=>({padding:"8px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:bg,color:fg}),
  card:(border)=>({background:C.navyMid,border:`1px solid ${border||C.navyLight}`,borderRadius:12,padding:"14px 15px",marginBottom:10}),
  label:{fontSize:11,color:C.gold,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4,marginTop:8,display:"block"},
  input:{width:"100%",background:C.navyLight,border:`1px solid ${C.navyLight}`,borderRadius:8,padding:"10px 12px",color:C.white,fontSize:14,marginBottom:10,boxSizing:"border-box",outline:"none"},
  badge:ok=>({fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:ok?"#14532d":"#7f1d1d",color:ok?"#86efac":"#fca5a5"}),
  navBar:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.navyMid,borderTop:`2px solid ${C.gold}`,display:"flex",zIndex:200},
  navBtn:a=>({flex:1,padding:"9px 2px 7px",background:"none",border:"none",color:a?C.gold:C.gray,fontSize:8,fontWeight:700,cursor:"pointer",textTransform:"uppercase",display:"flex",flexDirection:"column",alignItems:"center",gap:2}),
  sHead:{fontSize:12,fontWeight:800,color:C.gold,textTransform:"uppercase",letterSpacing:1,marginBottom:12},
  chip:(s,v)=>({padding:"6px 12px",borderRadius:20,border:`1px solid ${s===v?C.gold:C.navyLight}`,background:s===v?C.gold:C.navyLight,color:s===v?C.navy:C.gray,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:6,marginBottom:6}),
  statBox:{background:C.navyMid,border:`1px solid ${C.navyLight}`,borderRadius:12,padding:"12px 8px",textAlign:"center"},
  row:{display:"flex",gap:8,alignItems:"center"},
  err:{color:"#fca5a5",fontSize:11,marginTop:-6,marginBottom:8},
};

// ─── HEADER ───
function Header({lang,onToggle}){
  return(
    <div style={S.header}>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:3}}>
        <button onClick={onToggle} style={{background:C.navyLight,border:`1px solid ${C.gold}`,borderRadius:20,padding:"3px 10px",color:C.gold,fontSize:10,fontWeight:700,cursor:"pointer"}}>
          {lang==="ta"?"தமிழ் / EN":"EN / தமிழ்"}
        </button>
      </div>
      <div style={{textAlign:"center"}}>
        <p style={{fontSize:16,fontWeight:800,color:C.white,margin:0}}>AGA {lang==="ta"?"அவசர சேவை":"EMERGENCY RESPONSE"}</p>
        <p style={{fontSize:9,color:C.gold,fontWeight:700,margin:"2px 0 0",letterSpacing:0.5}}>Alert Golden Army · PSGCAS Chapter</p>
        <p style={{fontSize:8,color:C.gray,margin:"1px 0 0"}}>PSG {lang==="ta"?"கலை மற்றும் அறிவியல் கல்லூரி, கோயம்புத்தூர்":"College of Arts & Science, Coimbatore"}</p>
      </div>
    </div>
  );
}

// ─── LOCATION BANNER ───
function LocationBanner({userLoc,lang}){
  if(!userLoc)return null;
  return(
    <div style={{background:"#0d1f35",borderBottom:`1px solid ${C.navyLight}`,padding:"5px 14px",display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:12}}>📍</span>
      <span style={{fontSize:10,color:C.gold,fontWeight:800}}>{lang==="ta"?"இருப்பிடம்":"LOCATION"}: </span>
      <span style={{fontSize:11,color:C.white,fontFamily:"monospace",flex:1}}>{fmtCoord(userLoc.lat)}, {fmtCoord(userLoc.lng)}</span>
      <div style={{width:7,height:7,borderRadius:"50%",background:C.green,boxShadow:`0 0 5px ${C.green}`}}/>
    </div>
  );
}

// ─── LOCATION GATE ───
function LocationGate({onEnable,lang,onToggle}){
  const [err,setErr]=useState(false);
  function tryEnable(){
    setErr(false);
    if(!navigator.geolocation){onEnable(CAMPUS_CENTER);return;}
    navigator.geolocation.getCurrentPosition(
      pos=>onEnable({lat:pos.coords.latitude,lng:pos.coords.longitude}),
      ()=>{setErr(true);onEnable(CAMPUS_CENTER);},
      {enableHighAccuracy:true,timeout:12000}
    );
  }
  return(
    <div style={{...S.app,display:"flex",flexDirection:"column"}}>
      <Header lang={lang} onToggle={onToggle}/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:20}}>🚨</div>
          <div style={{background:"#7f1d1d",border:`1px solid ${C.red}`,borderRadius:14,padding:20,marginBottom:16}}>
            <div style={{fontSize:36,marginBottom:10}}>📍</div>
            <p style={{color:"#fecaca",fontWeight:700,fontSize:15,margin:"0 0 6px"}}>{lang==="ta"?"இருப்பிட அனுமதி தேவை":"Location Access Required"}</p>
            <p style={{color:"#fca5a5",fontSize:13,margin:0,lineHeight:1.5}}>{lang==="ta"?"AGA அவசர சேவைக்கு உங்கள் இருப்பிடம் தேவை.":"AGA Emergency Response needs your location."}</p>
          </div>
          {err&&<p style={{color:"#fbbf24",fontSize:12,marginBottom:12}}>Location denied — using campus center as fallback.</p>}
          <button style={S.btn(C.gold,C.navy)} onClick={tryEnable}>📍 {lang==="ta"?"இருப்பிடத்தை இயக்கு":"Enable Location"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── HOME ───
function HomeScreen({userLoc,setScreen,lang,onSOS,volunteers,sosToday}){
  const approved=volunteers.filter(v=>v.approved);
  const active=approved.filter(v=>v.online&&v.availability).length;
  const tiles=[
    {icon:"🆘",label:lang==="ta"?"அருகிலுள்ள தன்னார்வலர்கள்":"Find Nearby Volunteers",to:"volunteers"},
    {icon:"📞",label:lang==="ta"?"அவசர தொடர்புகள்":"Emergency Contacts",to:"contacts"},
    {icon:"🗺️",label:lang==="ta"?"வளாக வரைபடம்":"Campus Map",to:"campusMap"},
    {icon:"🩺",label:lang==="ta"?"முதலுதவி வழிகாட்டி":"First Aid Guide",to:"guide"},
    {icon:"👤",label:lang==="ta"?"என் சுயவிவரம்":"My Profile",to:"profile"},
    {icon:"📝",label:lang==="ta"?"தன்னார்வலராக பதிவு":"Register as Volunteer",to:"login"},
  ];
  return(
    <div style={S.screen}>
      <button onClick={onSOS} style={{...S.btn(C.red,C.white),fontSize:20,fontWeight:900,padding:"22px 18px",borderRadius:16,boxShadow:"0 0 28px rgba(192,57,43,0.55)",letterSpacing:1,marginBottom:14}}>
        🚨 {lang==="ta"?"SOS — அவசரம்":"SOS — EMERGENCY"}
      </button>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {tiles.map(b=>(
          <button key={b.to} style={{...S.btn(C.navyLight,C.white),marginBottom:0,flexDirection:"column",padding:"14px 8px",gap:4,border:`1px solid ${C.navyLight}`}} onClick={()=>setScreen(b.to)}>
            <span style={{fontSize:22}}>{b.icon}</span>
            <span style={{fontSize:11}}>{b.label}</span>
          </button>
        ))}
      </div>
      <div style={S.sHead}>📊 {lang==="ta"?"டாஷ்போர்டு":"Dashboard"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.gold,margin:0}}>{approved.length}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>{lang==="ta"?"மொத்த தன்னார்வலர்கள்":"Total Volunteers"}</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.green,margin:0}}>{active}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>{lang==="ta"?"செயலில் உள்ளவர்கள்":"Active Now"}</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.red,margin:0}}>{sosToday}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>{lang==="ta"?"இன்றைய SOS":"SOS Today"}</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.blue,margin:0}}>{volunteers.length}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>{lang==="ta"?"மொத்த பதிவுகள்":"Total Registered"}</p></div>
      </div>
    </div>
  );
}

// ─── VOLUNTEERS ───
function VolunteersScreen({userLoc,setScreen,setSelectedVol,volunteers}){
  const [filter,setFilter]=useState("all");
  const withDist=volunteers.filter(v=>v.approved).map(v=>({
    ...v,distance:userLoc&&v.lat&&v.lng?haversine(userLoc.lat,userLoc.lng,parseFloat(v.lat),parseFloat(v.lng)):9999
  })).sort((a,b)=>a.distance-b.distance);
  const nearby=withDist.filter(v=>v.distance<=CAMPUS_RADIUS_KM*1000);
  const outside=withDist.filter(v=>v.distance>CAMPUS_RADIUS_KM*1000);
  const filtered=filter==="available"?withDist.filter(v=>v.availability&&v.online):filter==="certified"?withDist.filter(v=>v.first_aid_certified):withDist;
  function callVol(vol){window.location.href=`tel:${vol.phone}`;sendAlert(vol,"call",{userLoc});playSound("call");}
  function viewMap(vol){sendAlert(vol,"map",{userLoc});playSound("ping");setSelectedVol(vol);setScreen("map");}
  return(
    <div style={S.screen}>
      <div style={S.sHead}>🆘 {nearby.length>0?`${nearby.length} Volunteers Within 2km`:"Nearby Volunteers"}</div>
      <p style={{color:C.gray,fontSize:11,marginTop:-8,marginBottom:12}}>Within {CAMPUS_RADIUS_KM}km first · sorted by distance · updates every 30s</p>
      <div style={{marginBottom:14}}>
        {["all","available","certified"].map(f=><button key={f} style={S.chip(filter,f)} onClick={()=>setFilter(f)}>{f==="all"?"All":f==="available"?"Available":"Certified"}</button>)}
      </div>
      {filtered.length===0&&<div style={{...S.card(),textAlign:"center",padding:32}}><p style={{color:C.gray,fontSize:13}}>No volunteers found.</p></div>}
      {filtered.map(vol=>(
        <div key={vol.id} style={S.card(vol.distance<=CAMPUS_RADIUS_KM*1000?C.gold:C.navyLight)}>
          {vol.distance<=CAMPUS_RADIUS_KM*1000&&<div style={{fontSize:10,color:C.gold,fontWeight:800,marginBottom:6}}>📍 WITHIN 2KM</div>}
          <div style={{...S.row,marginBottom:8}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:C.navy,flexShrink:0}}>{vol.name?.charAt(0)||"?"}</div>
            <div style={{flex:1}}>
              <p style={{fontSize:15,fontWeight:700,color:C.white,margin:0}}>{vol.name}</p>
              <p style={{fontSize:11,color:C.gray,margin:"2px 0 0"}}>{vol.department||vol.occupation||"—"}{vol.year?` · ${vol.year}`:""}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontSize:20,fontWeight:800,color:vol.distance<=300?C.green:C.gold,margin:0}}>{fmtDist(vol.distance)}</p>
              <p style={{fontSize:10,color:C.gray}}>away</p>
            </div>
          </div>
          <div style={{background:C.navyLight,borderRadius:8,padding:"5px 10px",marginBottom:8,fontSize:11,color:C.gray,fontFamily:"monospace"}}>
            📍 {fmtCoord(vol.lat)}, {fmtCoord(vol.lng)}
            {vol.loc_updated_at&&<span style={{color:C.gold,marginLeft:8,fontSize:10}}>· {new Date(vol.loc_updated_at).toLocaleTimeString()}</span>}
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
            <span style={S.badge(vol.online)}>{vol.online?"Online":"Offline"}</span>
            <span style={S.badge(vol.availability)}>{vol.availability?"Available":"Unavailable"}</span>
            <span style={S.badge(vol.first_aid_certified)}>{vol.first_aid_certified?"✓ Certified":"Not Certified"}</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.btn(C.red,C.white),marginBottom:0,flex:1,padding:"10px 8px",fontSize:13}} onClick={()=>callVol(vol)}>📞 Call Now</button>
            <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1,padding:"10px 8px",fontSize:13,border:`1px solid ${C.gray}`}} onClick={()=>viewMap(vol)}>🗺 View Map</button>
          </div>
        </div>
      ))}
      {outside.length>0&&filter==="all"&&<div style={{...S.card(),opacity:0.5,textAlign:"center",padding:10}}><p style={{color:C.gray,fontSize:11,margin:0}}>+{outside.length} volunteer(s) beyond 2km</p></div>}
    </div>
  );
}

// ─── MAP ───
function MapScreen({userLoc,selectedVol,setScreen}){
  const [trackLoc,setTrackLoc]=useState(userLoc);
  useEffect(()=>{
    if(!navigator.geolocation)return;
    const id=navigator.geolocation.watchPosition(p=>setTrackLoc({lat:p.coords.latitude,lng:p.coords.longitude}),null,{enableHighAccuracy:true});
    return()=>navigator.geolocation.clearWatch(id);
  },[]);
  const vol=selectedVol;
  if(!vol){setScreen("volunteers");return null;}
  const uLat=trackLoc?.lat||CAMPUS_CENTER.lat,uLng=trackLoc?.lng||CAMPUS_CENTER.lng;
  const vLat=parseFloat(vol.lat)||CAMPUS_CENTER.lat,vLng=parseFloat(vol.lng)||CAMPUS_CENTER.lng;
  const dist=haversine(uLat,uLng,vLat,vLng);
  const deg=bearingDeg(uLat,uLng,vLat,vLng);
  const osmUrl=`https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${uLat}%2C${uLng}%3B${vLat}%2C${vLng}`;
  return(
    <div style={S.screen}>
      <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:14}} onClick={()=>setScreen("volunteers")}>← Back</button>
      <div style={S.sHead}>🗺 Volunteer Location</div>
      <div style={{...S.card(C.gold),marginBottom:12}}>
        <div style={S.row}>
          <div style={{width:40,height:40,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:C.navy}}>{vol.name?.charAt(0)}</div>
          <div><p style={{fontSize:15,fontWeight:700,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:0}}>{vol.department||vol.occupation}</p></div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <div style={{...S.statBox,flex:1}}><p style={{color:C.gold,fontWeight:800,fontSize:20,margin:0}}>{fmtDist(dist)}</p><p style={{color:C.gray,fontSize:10,margin:0}}>Distance</p></div>
        <div style={{...S.statBox,flex:1}}><p style={{color:C.gold,fontWeight:800,fontSize:20,margin:0}}>~{Math.max(1,Math.round(dist/80))}m</p><p style={{color:C.gray,fontSize:10,margin:0}}>Walk</p></div>
      </div>
      <div style={{...S.card(),marginBottom:10,fontSize:11,color:C.gray,fontFamily:"monospace"}}>
        <div>📍 You: {fmtCoord(uLat)}, {fmtCoord(uLng)}</div>
        <div style={{marginTop:4}}>🎯 Vol: {fmtCoord(vLat)}, {fmtCoord(vLng)}</div>
      </div>
      <div style={{background:C.navyLight,borderRadius:12,height:185,marginBottom:12,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle, rgba(212,160,23,0.12) 1px, transparent 1px)",backgroundSize:"16px 16px"}}/>
        {[1,2,3].map(r=><div key={r} style={{position:"absolute",top:"50%",left:"50%",width:r*54,height:r*54,marginLeft:-(r*27),marginTop:-(r*27),border:`1px solid rgba(148,163,184,${0.28-r*0.07})`,borderRadius:"50%"}}/>)}
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:C.blue,border:`2px solid ${C.white}`,margin:"0 auto"}}/>
          <p style={{fontSize:9,color:C.gray,margin:"3px 0 0"}}>You</p>
        </div>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:`rotate(${deg}deg) translateY(-74px) rotate(${-deg}deg) translate(-50%,-50%)`,textAlign:"center"}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:C.gold,border:`2px solid ${C.navy}`,margin:"0 auto",boxShadow:`0 0 8px ${C.gold}`}}/>
          <p style={{fontSize:9,color:C.gold,fontWeight:700,margin:"3px 0 0",whiteSpace:"nowrap"}}>{vol.name?.split(" ")[0]}</p>
        </div>
      </div>
      <button style={S.btn(C.gold,C.navy)} onClick={()=>window.open(osmUrl,"_blank")}>🧭 Navigate (OpenStreetMap)</button>
      <button style={S.btn(C.red,C.white)} onClick={()=>window.open(`tel:${vol.phone}`,"_self")}>📞 Call {vol.name?.split(" ")[0]}</button>
    </div>
  );
}

// ─── CAMPUS MAP ───
function CampusMapScreen({setScreen}){
  const bbox=`${CAMPUS_CENTER.lng-0.006},${CAMPUS_CENTER.lat-0.004},${CAMPUS_CENTER.lng+0.006},${CAMPUS_CENTER.lat+0.004}`;
  return(
    <div style={S.screen}>
      <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:14}} onClick={()=>setScreen("home")}>← Back</button>
      <div style={S.sHead}>🗺️ Campus Map — PSG CAS</div>
      <p style={{color:C.gray,fontSize:11,marginTop:-8,marginBottom:12}}>Near SITRA Junction, Avinashi Road, Coimbatore 641014</p>
      <div style={{borderRadius:12,overflow:"hidden",marginBottom:12,border:`1px solid ${C.gold}`}}>
        <iframe title="map" width="100%" height="240" style={{border:0,display:"block"}} src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${CAMPUS_CENTER.lat},${CAMPUS_CENTER.lng}`}/>
      </div>
      <button style={S.btn(C.gold,C.navy)} onClick={()=>window.open(`https://www.openstreetmap.org/?mlat=${CAMPUS_CENTER.lat}&mlon=${CAMPUS_CENTER.lng}#map=17/${CAMPUS_CENTER.lat}/${CAMPUS_CENTER.lng}`,"_blank")}>🌍 Open Full Map</button>
      <div style={S.sHead}>📍 Key Locations</div>
      {CAMPUS_LANDMARKS.map(loc=>(
        <div key={loc.name} style={{...S.card(),display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>{loc.icon}</span>
          <div style={{flex:1}}><p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{loc.name}</p><p style={{fontSize:11,color:C.gray,margin:0,fontFamily:"monospace"}}>{fmtCoord(loc.lat)}, {fmtCoord(loc.lng)}</p></div>
        </div>
      ))}
    </div>
  );
}

// ─── FIRST AID GUIDE ───
function GuideScreen({setScreen,lang,canEdit=false}){
  const [selected,setSelected]=useState(null);
  const [guideTa,setGuideTa]=useState(loadGuideTa);
  const [editing,setEditing]=useState(null);
  const [editForm,setEditForm]=useState({title:"",steps:""});

  const items=lang==="ta"?guideTa:FIRST_AID;

  function saveEdit(){
    const stepsArr=editForm.steps.split("\n").map(s=>s.trim()).filter(Boolean);
    const updated=guideTa.map(x=>x.id===editing.id?{...x,title:editForm.title,steps:stepsArr}:x);
    setGuideTa(updated);saveGuideTa(updated);setEditing(null);
  }

  if(selected!==null){
    const item=items[selected];
    return(
      <div style={S.screen}>
        <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:14}} onClick={()=>setSelected(null)}>← Back</button>
        <div style={{...S.card(C.gold),marginBottom:14}}>
          <p style={{fontSize:30,margin:"0 0 8px"}}>{item.icon}</p>
          <p style={{fontSize:16,fontWeight:800,color:C.gold,margin:"0 0 14px"}}>{item.title}</p>
          {item.steps.map((step,i)=>(
            <div key={i} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:C.navy,flexShrink:0}}>{i+1}</div>
              <p style={{color:C.white,fontSize:13,margin:0,lineHeight:1.6}}>{step}</p>
            </div>
          ))}
        </div>
        {canEdit&&lang==="ta"&&<button style={S.btn(C.navyLight,C.white)} onClick={()=>{setEditing(item);setEditForm({title:item.title,steps:item.steps.join("\n")});setSelected(null);}}>✏️ Edit Tamil Content</button>}
        <button style={S.btn(C.red,C.white)} onClick={()=>window.open("tel:108","_self")}>🚑 Call Ambulance 108</button>
      </div>
    );
  }
  return(
    <div style={S.screen}>
      <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:14}} onClick={()=>setScreen("home")}>← Back</button>
      <div style={S.sHead}>🩺 {lang==="ta"?"முதலுதவி வழிகாட்டி":"First Aid Guide"}</div>
      <div style={{...S.card(),marginBottom:12,background:"#1a2d1a",border:`1px solid ${C.green}`}}>
        <p style={{color:"#86efac",fontSize:12,margin:0,lineHeight:1.6}}>⚠️ {lang==="ta"?"இது குறிப்பு மட்டுமே. உண்மையான அவசரநிலையில் எப்போதும் 108 அழைக்கவும்.":"This guide is for reference only. Always call 108 in a real emergency."}</p>
      </div>
      {items.map((item,i)=>(
        <button key={item.id} style={{...S.card(),width:"100%",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:14,border:`1px solid ${C.navyLight}`}} onClick={()=>setSelected(i)}>
          <span style={{fontSize:26,flexShrink:0}}>{item.icon}</span>
          <div style={{flex:1}}>
            <p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{item.title}</p>
            <p style={{fontSize:11,color:C.gray,margin:"2px 0 0"}}>{item.steps.length} {lang==="ta"?"படிகள்":"steps"}</p>
          </div>
          <span style={{color:C.gold,fontSize:16}}>›</span>
        </button>
      ))}
      {editing&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:500,padding:16,overflowY:"auto"}}>
          <div style={{background:C.navyMid,borderRadius:14,padding:20,width:"100%",maxWidth:380,marginTop:20}}>
            <p style={{color:C.white,fontWeight:700,fontSize:15,marginBottom:4}}>✏️ Edit Tamil — {editing.title}</p>
            <p style={{color:C.gray,fontSize:11,marginBottom:12}}>Only Tamil version is edited here. English stays unchanged.</p>
            <span style={S.label}>Title (Tamil)</span>
            <input style={S.input} value={editForm.title} onChange={e=>setEditForm(p=>({...p,title:e.target.value}))}/>
            <span style={S.label}>Steps (one per line)</span>
            <textarea style={{...S.input,minHeight:180,resize:"vertical",fontFamily:"inherit",fontSize:12}} value={editForm.steps} onChange={e=>setEditForm(p=>({...p,steps:e.target.value}))}/>
            <div style={{display:"flex",gap:8}}>
              <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1}} onClick={()=>setEditing(null)}>Cancel</button>
              <button style={{...S.btn(C.gold,C.navy),marginBottom:0,flex:1}} onClick={saveEdit}>Save Tamil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONTACTS ───
function ContactsScreen({canEdit=false,setScreen}){
  const [contacts,setContacts]=useState(loadContacts);
  const [editKey,setEditKey]=useState(null);
  const [ef,setEf]=useState({icon:"",label:"",number:"",desc:""});
  const [adding,setAdding]=useState(false);
  function persist(next){setContacts(next);saveContacts(next);}
  function startEdit(c){setEditKey(c.key);setEf({icon:c.icon,label:c.label,number:c.number,desc:c.desc});setAdding(false);}
  function startAdd(){setEditKey("__new__");setEf({icon:"📞",label:"",number:"",desc:""});setAdding(true);}
  function save(){if(!ef.label||!ef.number)return;adding?persist([...contacts,{key:`c-${Date.now()}`,icon:ef.icon||"📞",label:ef.label,number:ef.number,desc:ef.desc}]):persist(contacts.map(c=>c.key===editKey?{...c,...ef}:c));setEditKey(null);}
  return(
    <div style={S.screen}>
      {!canEdit&&<button style={{...S.btnSm(C.navyLight,C.white),marginBottom:14}} onClick={()=>setScreen("home")}>← Back</button>}
      <div style={S.sHead}>📞 Emergency Contacts</div>
      {contacts.map(c=>(
        <div key={c.key} style={{background:C.red,borderRadius:12,padding:"14px 15px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:24,cursor:"pointer"}} onClick={()=>window.open(`tel:${c.number}`,"_self")}>{c.icon}</span>
          <div style={{flex:1,cursor:"pointer"}} onClick={()=>window.open(`tel:${c.number}`,"_self")}>
            <p style={{fontSize:15,fontWeight:700,color:C.white,margin:0}}>{c.label}</p>
            <p style={{fontSize:11,color:"#fecaca",margin:0}}>{c.desc}</p>
          </div>
          <div style={{textAlign:"right",cursor:"pointer"}} onClick={()=>window.open(`tel:${c.number}`,"_self")}>
            <p style={{fontSize:13,color:"#fecaca",fontWeight:800,margin:0}}>{c.number}</p>
            <p style={{fontSize:9,color:"#fca5a5",margin:0}}>Tap to call</p>
          </div>
          {canEdit&&(
            <div style={{display:"flex",gap:4}}>
              <button style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.white,fontSize:12}} onClick={()=>startEdit(c)}>✏️</button>
              <button style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.white,fontSize:12}} onClick={()=>{if(window.confirm("Remove?"))persist(contacts.filter(x=>x.key!==c.key));}}>🗑️</button>
            </div>
          )}
        </div>
      ))}
      {canEdit&&<button style={S.btn(C.navyLight,C.white)} onClick={startAdd}>➕ Add Contact</button>}
      {canEdit&&editKey&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
          <div style={{background:C.navyMid,borderRadius:14,padding:20,width:"100%",maxWidth:340}}>
            <p style={{color:C.white,fontWeight:700,fontSize:15,marginBottom:14}}>{adding?"Add":"Edit"} Contact</p>
            {[["Icon","icon","📞"],["Label","label","e.g. Hostel Warden"],["Phone","number","+91..."],["Description","desc",""]].map(([l,k,p])=>(
              <div key={k}><span style={S.label}>{l}</span><input style={S.input} value={ef[k]} onChange={e=>setEf(x=>({...x,[k]:e.target.value}))} placeholder={p}/></div>
            ))}
            <div style={{display:"flex",gap:8}}>
              <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1}} onClick={()=>setEditKey(null)}>Cancel</button>
              <button style={{...S.btn(C.gold,C.navy),marginBottom:0,flex:1}} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN ───
function LoginScreen({onLoggedIn,setScreen}){
  const [email,setEmail]=useState("");const [err,setErr]=useState("");const [mode,setMode]=useState("main");
  function handleEmail(){
    const t=email.trim().toLowerCase();
    if(!t.includes("@")||!t.includes(".")){setErr("Enter a valid email.");return;}
    const existing=loadSession();
    const profile=(existing&&existing.email===t)?existing:{email:t,registered:false,name:"",approved:false};
    saveSession(profile);onLoggedIn(profile);
  }
  return(
    <div style={S.screen}>
      <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:14}} onClick={()=>setScreen("home")}>← Back</button>
      <div style={S.sHead}>🔑 Volunteer Login</div>
      <div style={{...S.card(),marginBottom:14}}><p style={{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}}>Your profile is saved permanently. Log in with the same email anytime to restore everything.</p></div>
      <button style={{...S.btn("#fff",C.navy),border:`1px solid ${C.gray}`,marginBottom:14}} onClick={()=>alert("Google Sign-In requires Firebase setup. Please use email login for now.")}>
        <span style={{fontSize:18}}>🔵</span> Continue with Google
      </button>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{flex:1,height:1,background:C.navyLight}}/><span style={{color:C.gray,fontSize:12}}>OR</span><div style={{flex:1,height:1,background:C.navyLight}}/>
      </div>
      <span style={S.label}>Email ID</span>
      <input style={S.input} type="email" placeholder="yourname@example.com" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}/>
      {err&&<p style={S.err}>{err}</p>}
      <button style={S.btn(C.gold,C.navy)} onClick={handleEmail}>Continue with Email →</button>
    </div>
  );
}

// ─── PROFILE ───
function ProfileScreen({session,setScreen,volunteers,setVolunteers,onSessionUpdate,lang}){
  const vol=session?volunteers.find(v=>v.email===session.email):null;
  const [editing,setEditing]=useState(false);const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({name:vol?.name||"",phone:vol?.phone||"",department:vol?.department||"",year:vol?.year||"",occupation:vol?.occupation||"",remarks:vol?.remarks||""});
  if(!session)return(
    <div style={S.screen}>
      <div style={{...S.card(),textAlign:"center",padding:32}}>
        <p style={{fontSize:32,margin:"0 0 12px"}}>👤</p>
        <p style={{color:C.gray,fontSize:13,marginBottom:16}}>{lang==="ta"?"சுயவிவரம் காண உள்நுழையவும்.":"Please login to view your profile."}</p>
        <button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("login")}>Login / Register</button>
      </div>
    </div>
  );
  if(!vol)return(
    <div style={S.screen}>
      <div style={{...S.card(),textAlign:"center",padding:32}}>
        <p style={{fontSize:32,margin:"0 0 12px"}}>📝</p>
        <p style={{color:C.gray,fontSize:13,marginBottom:16}}>{lang==="ta"?"தன்னார்வலராக பதிவு செய்யவில்லை.":"You have not registered as a volunteer yet."}</p>
        <button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("register")}>Register Now</button>
      </div>
    </div>
  );
  const isOnline=vol.online&&vol.availability;
  async function toggleAvail(){
    setSaving(true);
    try{const u={online:!vol.online,availability:!vol.availability};await db.updateVolunteer(vol.id,u);setVolunteers(p=>p.map(v=>v.id===vol.id?{...v,...u}:v));}
    catch(e){alert("Error: "+e.message);}
    setSaving(false);
  }
  async function saveEdit(){
    setSaving(true);
    try{await db.updateVolunteer(vol.id,form);setVolunteers(p=>p.map(v=>v.id===vol.id?{...v,...form}:v));const s={...session,name:form.name};saveSession(s);onSessionUpdate(s);setEditing(false);}
    catch(e){alert("Error: "+e.message);}
    setSaving(false);
  }
  return(
    <div style={S.screen}>
      <div style={S.sHead}>👤 {lang==="ta"?"என் சுயவிவரம்":"My Profile"}</div>
      <div style={{...S.card(C.gold),marginBottom:12}}>
        <div style={{...S.row,marginBottom:10}}>
          <div style={{width:50,height:50,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:C.navy,flexShrink:0}}>{vol.name?.charAt(0)}</div>
          <div style={{flex:1}}><p style={{fontSize:16,fontWeight:800,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:"2px 0 0"}}>{vol.email}</p></div>
          <span style={S.badge(vol.approved)}>{vol.approved?"Approved":"Pending"}</span>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <span style={S.badge(isOnline)}>{isOnline?"Online":"Offline"}</span>
          <span style={S.badge(vol.first_aid_certified)}>{vol.first_aid_certified?"Certified":"Not Certified"}</span>
        </div>
        <button style={{...S.btn(isOnline?"#14532d":"#1a3a1a",isOnline?"#86efac":"#86efac"),marginBottom:0,border:`1px solid ${isOnline?C.green:"#166534"}`}} onClick={toggleAvail} disabled={saving}>
          {saving?"Saving...":isOnline?"🟢 Mark as Unavailable":"🔴 Mark as Available"}
        </button>
      </div>
      {/* Volunteer notification center shortcut */}
      <button style={{...S.btn(C.navyLight,C.white),border:`1px solid ${C.navyLight}`}} onClick={()=>setScreen("myAlerts")}>
        🔔 {lang==="ta"?"என் விழிப்பூட்டல்களை காண்க":"View My Notifications"}
      </button>
      {!editing?(
        <div style={S.card()}>
          {[["📞 Phone",vol.phone],["🏢 Dept",vol.department],["📅 Year",vol.year],["💼 Occupation",vol.occupation],["🏅 Trained",vol.first_aid_trained?"Yes":"No"],["📋 Training",vol.remarks]].map(([l,v])=>v?(
            <div key={l} style={{marginBottom:8}}><span style={{...S.label,marginTop:0}}>{l}</span><p style={{color:C.white,fontSize:13,margin:0}}>{v}</p></div>
          ):null)}
          <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,marginTop:8}} onClick={()=>setEditing(true)}>✏️ Edit My Details</button>
        </div>
      ):(
        <div style={S.card()}>
          {[["Name","name","text"],["Phone","phone","tel"],["Department","department","text"],["Year","year","text"],["Occupation","occupation","text"],["Training Details","remarks","text"]].map(([l,k,t])=>(
            <div key={k}><span style={S.label}>{l}</span><input style={S.input} type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1}} onClick={()=>setEditing(false)}>Cancel</button>
            <button style={{...S.btn(C.gold,C.navy),marginBottom:0,flex:1}} onClick={saveEdit} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
          </div>
        </div>
      )}
      <button style={{...S.btn(C.navyLight,C.white),marginTop:4}} onClick={()=>{saveSession(null);localStorage.removeItem("aga_session");onSessionUpdate(null);setScreen("home");}}>🚪 Logout</button>
    </div>
  );
}

// ─── REGISTER ───
function RegisterScreen({setScreen,session,onRegistered,userLoc,lang}){
  const [form,setForm]=useState({name:session?.name||"",email:session?.email||"",roll:"",phone:"",department:"",year:"",occupation:"",first_aid_trained:null,first_aid_certified:null,remarks:""});
  const [submitted,setSubmitted]=useState(false);const [loading,setLoading]=useState(false);const [errs,setErrs]=useState({});
  function upd(k,v){setForm(p=>({...p,[k]:v}));setErrs(p=>({...p,[k]:null}));}
  function validate(){const e={};if(!form.name.trim())e.name="Required";if(!form.email.includes("@"))e.email="Valid email required";if(!form.phone.trim())e.phone="Required";if(!form.remarks.trim())e.remarks="Required";if(form.first_aid_certified===null)e.cert="Required";setErrs(e);return Object.keys(e).length===0;}
  async function submit(){
    if(!validate())return;
    setLoading(true);
    try{
      await db.addVolunteer({name:form.name,roll:form.roll,email:form.email,phone:form.phone,department:form.department,year:form.year,occupation:form.occupation,first_aid_trained:form.first_aid_trained||false,first_aid_certified:form.first_aid_certified||false,remarks:form.remarks,approved:false,online:false,availability:true,lat:userLoc?.lat||CAMPUS_CENTER.lat,lng:userLoc?.lng||CAMPUS_CENTER.lng});
      const p={...session,registered:true,approved:false,name:form.name};
      saveSession(p);
      // Push notification to volunteer
      pushVolNotif(form.email,{type:"registered",message:"📝 Your registration was submitted! You will get a notification once admin approves.",volName:form.name});
      playSound("call");
      onRegistered(p);
      setSubmitted(true);
    }catch(e){alert("Error: "+e.message);}
    setLoading(false);
  }
  function YN({value,onChange,error}){return<div style={{marginBottom:10}}>{[true,false].map(v=><button key={String(v)} style={S.chip(value,v)} onClick={()=>onChange(v)}>{v?(lang==="ta"?"ஆம்":"Yes"):(lang==="ta"?"இல்லை":"No")}</button>)}{error&&<p style={S.err}>{error}</p>}</div>;}
  if(submitted)return(
    <div style={{...S.screen,textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>✅</div>
      <p style={{color:C.gold,fontSize:20,fontWeight:800,marginBottom:8}}>{lang==="ta"?"விண்ணப்பம் சமர்ப்பிக்கப்பட்டது!":"Application Submitted!"}</p>
      <div style={{...S.card(),background:"#1a2d1a",border:`1px solid ${C.green}`,textAlign:"left",marginBottom:16}}>
        <p style={{color:"#86efac",fontWeight:700,margin:"0 0 6px"}}>✅ Saved to Supabase</p>
        <p style={{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}}>Admin will review and approve. Check <strong>My Notifications</strong> for updates.</p>
      </div>
      <button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("myAlerts")}>🔔 View My Notifications</button>
      <button style={{...S.btn(C.navyLight,C.white),border:`1px solid ${C.gray}`}} onClick={()=>setScreen("home")}>Back to Home</button>
    </div>
  );
  return(
    <div style={S.screen}>
      <div style={S.sHead}>📝 {lang==="ta"?"தன்னார்வலர் பதிவு":"Volunteer Registration"}</div>
      <div style={{...S.card(),background:"#1a2d1a",border:`1px solid ${C.green}`,marginBottom:12}}>
        <p style={{color:"#86efac",fontSize:12,margin:0}}>✅ Data saved permanently to Supabase. Admin approval required.</p>
      </div>
      {[["Full Name *","name","text","e.g. Karthik R"],["Roll Number","roll","text","e.g. 23CS101"],["Email *","email","email","you@example.com"],["Phone *","phone","tel","+91 9XXXXXXXXX"],["Department","department","text","e.g. Computer Science"],["Year","year","text","e.g. 2nd Year"],["Occupation","occupation","text","Student / Doctor / Faculty"]].map(([l,k,t,p])=>(
        <div key={k}><span style={S.label}>{l}</span><input style={S.input} type={t} value={form[k]} onChange={e=>upd(k,e.target.value)} placeholder={p}/>{errs[k]&&<p style={S.err}>{errs[k]}</p>}</div>
      ))}
      <span style={S.label}>First Aid Training?</span>
      <YN value={form.first_aid_trained} onChange={v=>upd("first_aid_trained",v)}/>
      <span style={S.label}>First Aid Certificate? *</span>
      <YN value={form.first_aid_certified} onChange={v=>upd("first_aid_certified",v)} error={errs.cert}/>
      <span style={S.label}>Training Details *</span>
      <input style={S.input} value={form.remarks} onChange={e=>upd("remarks",e.target.value)} placeholder="e.g. Red Cross Basic First Aid, 2024"/>
      {errs.remarks&&<p style={S.err}>{errs.remarks}</p>}
      <button style={S.btn(C.gold,C.navy)} onClick={submit} disabled={loading}>{loading?"Saving to Supabase...":"Submit Application"}</button>
      <button style={S.btn(C.navyLight,C.white)} onClick={()=>setScreen("home")}>Cancel</button>
    </div>
  );
}

// ─── VOLUNTEER NOTIFICATION CENTER ───
function MyAlertsScreen({session,lang}){
  const email=session?.email;
  const [notifs,setNotifs]=useState(()=>email?getVolNotifs(email):[]);
  useEffect(()=>{
    if(!email)return;
    const t=setInterval(()=>setNotifs([...getVolNotifs(email)]),3000);
    return()=>clearInterval(t);
  },[email]);
  function markRead(id){const u=notifs.map(n=>n.id===id?{...n,read:true}:n);setNotifs(u);if(email)saveVolNotifs(email,u);}
  function clearAll(){setNotifs([]);if(email)saveVolNotifs(email,[]);}
  const iconFor=t=>({call:"📞",map:"🗺",sos:"🚨",approved:"✅",rejected:"❌",broadcast:"📢",registered:"📝"}[t]||"🔔");
  const unread=notifs.filter(n=>!n.read).length;
  if(!email)return(
    <div style={S.screen}>
      <div style={S.sHead}>🔔 {lang==="ta"?"என் விழிப்பூட்டல்கள்":"My Notifications"}</div>
      <div style={{...S.card(),textAlign:"center",padding:32}}>
        <p style={{fontSize:32,margin:"0 0 10px"}}>🔒</p>
        <p style={{color:C.gray,fontSize:13,margin:0}}>Please login and register as a volunteer to see your notifications.</p>
        </div>
    </div>
  );
  return(
    <div style={S.screen}>
      <div style={{...S.row,marginBottom:12,justifyContent:"space-between"}}>
        <div style={S.sHead}>🔔 {lang==="ta"?"என் விழிப்பூட்டல்கள்":"My Notifications"}</div>
        {notifs.length>0&&<button style={S.btnSm(C.navyLight,C.gray)} onClick={clearAll}>Clear All</button>}
      </div>
      {unread>0&&<div style={{...S.card(C.gold),marginBottom:10,textAlign:"center"}}><p style={{color:C.gold,fontWeight:800,fontSize:13,margin:0}}>🔔 {unread} unread notification{unread>1?"s":""}</p></div>}
      <div style={{...S.card(),marginBottom:12,fontSize:11}}><span style={{color:C.gold,fontWeight:700}}>📧 {email}</span><span style={{color:C.gray}}> · auto-refreshes every 3s</span></div>
      {notifs.length===0&&<div style={{...S.card(),textAlign:"center",padding:32}}><p style={{fontSize:36,margin:"0 0 10px"}}>🔔</p><p style={{color:C.gray,fontSize:13,margin:0}}>No notifications yet. You will receive alerts when approved, called, or SOS triggered nearby.</p></div>}
      {notifs.map(n=>(
        <div key={n.id} onClick={()=>markRead(n.id)} style={{...S.card(n.type==="sos"||n.type==="call"?C.red:n.type==="approved"?C.green:C.gold),background:n.read?C.navyMid:n.type==="sos"?"#2d0a0a":n.type==="approved"?"#052e16":"#1a1400",cursor:"pointer",marginBottom:8}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:22,flexShrink:0}}>{iconFor(n.type)}</span>
            <div style={{flex:1}}>
              {!n.read&&<span style={{fontSize:9,background:C.red,color:C.white,padding:"1px 6px",borderRadius:10,fontWeight:800,display:"inline-block",marginBottom:3}}>NEW</span>}
              <p style={{color:C.white,fontSize:13,margin:"3px 0 2px",fontWeight:n.read?400:600}}>{n.message}</p>
              {n.userLoc&&<p style={{color:"#fbbf24",fontSize:10,margin:"0 0 2px",fontFamily:"monospace"}}>📍 {fmtCoord(n.userLoc.lat)}, {fmtCoord(n.userLoc.lng)}</p>}
              <p style={{color:C.gray,fontSize:10,margin:0}}>{n.time}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN ───
function AdminScreen({volunteers,setVolunteers,sosToday,lang}){
  const [tab,setTab]=useState("alerts");const [pin,setPin]=useState("");const [unlocked,setUnlocked]=useState(false);
  const [badge,setBadge]=useState(0);const [bcast,setBcast]=useState("");const [busy,setBusy]=useState(false);
  useEffect(()=>subAlerts(a=>setBadge(a.filter(x=>!x.read).length)),[]);
  if(!unlocked)return(
    <div style={S.screen}>
      <div style={S.sHead}>🔐 Admin Access</div>
      <div style={{...S.card(),textAlign:"center",padding:32}}>
        <p style={{color:C.gray,fontSize:13,marginBottom:16}}>Enter admin code</p>
        <input style={{...S.input,textAlign:"center",fontSize:16,letterSpacing:2}} type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Admin code"/>
        <button style={S.btn(C.gold,C.navy)} onClick={()=>{if(pin===ADMIN_PIN)setUnlocked(true);else alert("Invalid admin code.");}}>Unlock Dashboard</button>
      </div>
    </div>
  );
  const pending=volunteers.filter(v=>!v.approved),approved=volunteers.filter(v=>v.approved);
  async function approve(vol){
    setBusy(true);
    try{
      await db.updateVolunteer(vol.id,{approved:true,online:true,availability:true});
      setVolunteers(p=>p.map(v=>v.id===vol.id?{...v,approved:true,online:true,availability:true}:v));
      sendAlert(vol,"approved");
      if(vol.email)pushVolNotif(vol.email,{type:"approved",message:"✅ Your volunteer application has been approved! You are now live in the emergency pool.",volName:vol.name});
      playSound("call");
    }catch(e){alert(e.message);}
    setBusy(false);
  }
  async function reject(vol){
    if(!window.confirm(`Reject ${vol.name}?`))return;
    setBusy(true);
    try{
      await db.deleteVolunteer(vol.id);setVolunteers(p=>p.filter(v=>v.id!==vol.id));
      if(vol.email)pushVolNotif(vol.email,{type:"rejected",message:"❌ Your application was not approved.",volName:vol.name});
      sendAlert(vol,"rejected");
    }catch(e){alert(e.message);}
    setBusy(false);
  }
  async function remove(vol){
    if(!window.confirm(`Remove ${vol.name}?`))return;
    setBusy(true);
    try{await db.deleteVolunteer(vol.id);setVolunteers(p=>p.filter(v=>v.id!==vol.id));}catch(e){alert(e.message);}
    setBusy(false);
  }
  function broadcast(){
    if(!bcast.trim())return;
    approved.forEach(v=>{sendAlert(v,"broadcast",{message:bcast});if(v.email)pushVolNotif(v.email,{type:"broadcast",message:`📢 Admin: ${bcast}`,volName:v.name});});
    playSound("sos");setBcast("");alert(`Broadcast sent to ${approved.length} volunteer(s).`);
  }
  function AlertPanel(){
    const [alerts,setAlerts]=useState([...gAlerts]);
    useEffect(()=>subAlerts(a=>setAlerts([...a])),[]);
    const icon=t=>({call:"📞",map:"🗺",sos:"🚨",approved:"✅",rejected:"❌",broadcast:"📢",registered:"📝"}[t]||"🔔");
    if(!alerts.length)return<div style={{...S.card(),textAlign:"center",padding:28}}><p style={{fontSize:28,margin:"0 0 8px"}}>🔔</p><p style={{color:C.gray,fontSize:13,margin:0}}>No alerts yet.</p></div>;
    return<div>{alerts.map(a=>(
      <div key={a.id} style={{...S.card(a.type==="sos"||a.type==="call"?C.red:C.gold),background:a.read?C.navyMid:a.type==="sos"?"#2d0a0a":"#1a1400",cursor:"pointer"}} onClick={()=>setAlerts(p=>p.map(x=>x.id===a.id?{...x,read:true}:x))}>
        <div style={S.row}>
          <span style={{fontSize:22}}>{icon(a.type)}</span>
          <div style={{flex:1}}>
            {!a.read&&<span style={{fontSize:9,background:C.red,color:C.white,padding:"1px 6px",borderRadius:10,fontWeight:800}}>NEW</span>}
            <p style={{color:C.white,fontSize:12,margin:"4px 0"}}>{a.message}</p>
            {a.userLoc&&<p style={{color:"#fbbf24",fontSize:11,margin:"0 0 2px",fontFamily:"monospace"}}>📍 {fmtCoord(a.userLoc.lat)}, {fmtCoord(a.userLoc.lng)}</p>}
            <p style={{color:C.gray,fontSize:10,margin:0}}>{a.volName} · {a.time}</p>
          </div>
        </div>
      </div>
    ))}</div>;
  }
  const tabs=[{k:"alerts",l:`🔔${badge>0?` (${badge})`:""}`},{k:"pending",l:`⏳ (${pending.length})`},{k:"approved",l:`✅ (${approved.length})`},{k:"contacts",l:"📞"},{k:"guide",l:"🩺"},{k:"broadcast",l:"📢"}];
  return(
    <div style={S.screen}>
      <div style={S.sHead}>🛡 Admin Dashboard</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {tabs.map(({k,l})=><button key={k} style={{...S.btnSm(tab===k?C.gold:C.navyLight,tab===k?C.navy:C.white),border:`1px solid ${tab===k?C.gold:C.navyLight}`}} onClick={()=>setTab(k)}>{l}</button>)}
      </div>
      {tab==="alerts"&&<AlertPanel/>}
      {tab==="contacts"&&<ContactsScreen canEdit setScreen={()=>{}}/>}
      {tab==="guide"&&<GuideScreen setScreen={()=>{}} lang={lang} canEdit/>}
      {tab==="broadcast"&&<div style={S.card()}><span style={S.label}>Broadcast Message</span><textarea style={{...S.input,minHeight:90,resize:"vertical",fontFamily:"inherit"}} value={bcast} onChange={e=>setBcast(e.target.value)} placeholder="e.g. Campus drill at 3 PM today."/><button style={S.btn(C.gold,C.navy)} onClick={broadcast}>📢 Send to All Approved Volunteers</button></div>}
      {(tab==="pending"||tab==="approved")&&(
        <>
          {(tab==="pending"?pending:approved).length===0&&<div style={{...S.card(),textAlign:"center",padding:28}}><p style={{color:C.gray,fontSize:13}}>No {tab} volunteers.</p></div>}
          {(tab==="pending"?pending:approved).map(vol=>(
            <div key={vol.id} style={S.card()}>
              <div style={{...S.row,marginBottom:8}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:vol.approved?C.gold:C.gray,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:C.navy,flexShrink:0}}>{vol.name?.charAt(0)}</div>
                <div style={{flex:1}}><p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:0}}>{vol.department||vol.occupation||"—"}{vol.year?` · ${vol.year}`:""}</p></div>
                {vol.approved&&<span style={S.badge(vol.online)}>{vol.online?"Online":"Offline"}</span>}
              </div>
              <div style={{fontSize:11,color:C.gray,marginBottom:10,lineHeight:1.8}}>
                {vol.roll&&<p style={{margin:0}}>🎓 {vol.roll}</p>}
                <p style={{margin:0}}>📧 {vol.email}</p><p style={{margin:0}}>📞 {vol.phone}</p>
                {vol.occupation&&<p style={{margin:0}}>💼 {vol.occupation}</p>}
                <p style={{margin:0}}>🏅 Certified: {vol.first_aid_certified?"Yes ✅":"No ❌"}</p>
                {vol.remarks&&<p style={{margin:0}}>📋 {vol.remarks}</p>}
                {vol.lat&&<p style={{margin:0,fontFamily:"monospace",fontSize:10}}>📍 {fmtCoord(vol.lat)}, {fmtCoord(vol.lng)}</p>}
              </div>
              <div style={{display:"flex",gap:8}}>
                {!vol.approved&&<button style={{...S.btnSm(C.green,C.white),flex:1}} onClick={()=>approve(vol)} disabled={busy}>✓ Approve</button>}
                <button style={{...S.btnSm(C.red,C.white),flex:1}} onClick={()=>vol.approved?remove(vol):reject(vol)} disabled={busy}>{vol.approved?"Remove":"✗ Reject"}</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── ROOT ───
export default function App(){
  const [lang,setLang]=useState(()=>{try{return localStorage.getItem("aga_lang")||"ta";}catch{return"ta";}});
  function toggleLang(){const n=lang==="ta"?"en":"ta";setLang(n);try{localStorage.setItem("aga_lang",n);}catch{}}
  const [screen,setScreen]=useState("home");
  const [userLoc,setUserLoc]=useState(null);
  const [selectedVol,setSelectedVol]=useState(null);
  const [toast,setToast]=useState(null);
  const [badge,setBadge]=useState(0);
  const [session,setSession]=useState(loadSession);
  const [volunteers,setVolunteers]=useState([]);
  const [sosToday,setSosToday]=useState(0);
  const volIdRef=useRef(null);

  const refreshVolunteers=useCallback(()=>{
    db.getVolunteers().then(d=>setVolunteers(d)).catch(()=>{});
  },[]);

  // Load volunteers on start
  useEffect(()=>{if(userLoc)refreshVolunteers();},[userLoc]);

  // Refresh every 30s
  useEffect(()=>{
    if(!userLoc)return;
    const t=setInterval(refreshVolunteers,30000);
    return()=>clearInterval(t);
  },[userLoc]);

  // User GPS live tracking
  useEffect(()=>{
    if(!userLoc||!navigator.geolocation)return;
    const id=navigator.geolocation.watchPosition(
      p=>setUserLoc({lat:p.coords.latitude,lng:p.coords.longitude}),
      null,{enableHighAccuracy:true,maximumAge:30000}
    );
    return()=>navigator.geolocation.clearWatch(id);
  },[!!userLoc]);

  // Volunteer GPS → push to Supabase every 30s
  useEffect(()=>{
    if(!session?.email||!userLoc||!navigator.geolocation)return;
    const vol=volunteers.find(v=>v.email===session.email&&v.approved);
    if(!vol)return;
    volIdRef.current=vol.id;
    const watchId=navigator.geolocation.watchPosition(
      pos=>{
        const lat=pos.coords.latitude,lng=pos.coords.longitude;
        db.updateVolunteer(volIdRef.current,{lat,lng,online:true,loc_updated_at:new Date().toISOString()}).catch(()=>{});
        setVolunteers(p=>p.map(x=>x.id===volIdRef.current?{...x,lat,lng,loc_updated_at:new Date().toISOString()}:x));
      },
      null,{enableHighAccuracy:true,maximumAge:30000}
    );
    return()=>navigator.geolocation.clearWatch(watchId);
  },[session?.email,volunteers.length,!!userLoc]);

  useEffect(()=>subAlerts(alerts=>{
    setBadge(alerts.filter(a=>!a.read).length);
    const l=alerts[0];
    if(l){setToast(l);setTimeout(()=>setToast(null),4500);}
  }),[]);

  function triggerSOS(){
    const nearby=volunteers.filter(v=>v.approved&&v.online&&v.availability).map(v=>({...v,distance:userLoc&&v.lat?haversine(userLoc.lat,userLoc.lng,parseFloat(v.lat),parseFloat(v.lng)):9999})).filter(v=>v.distance<=CAMPUS_RADIUS_KM*1000).sort((a,b)=>a.distance-b.distance);
    if(!nearby.length){alert("No available volunteers nearby. Calling Emergency Contacts.");setScreen("contacts");return;}
    nearby.forEach(v=>{
      sendAlert(v,"sos",{userLoc});
      if(v.email)pushVolNotif(v.email,{type:"sos",message:`🚨 SOS nearby! Location: ${fmtCoord(userLoc.lat)}, ${fmtCoord(userLoc.lng)}`,volName:v.name,userLoc});
    });
    playSound("sos");setSosToday(c=>c+1);
    alert(`🚨 SOS sent to ${nearby.length} nearby volunteer(s). Help is on the way!`);
  }

  function handleLoggedIn(profile){setSession(profile);setScreen(profile.registered?"profile":"register");}
  function handleRegistered(profile){setSession(profile);refreshVolunteers();}

  if(!userLoc)return<LocationGate onEnable={setUserLoc} lang={lang} onToggle={toggleLang}/>;

  const myNotifCount=session?.email?getVolNotifs(session.email).filter(n=>!n.read).length:0;

  const navItems=[
    {id:"home",icon:"🏠",label:lang==="ta"?"முகப்பு":"Home"},
    {id:"volunteers",icon:"🆘",label:lang==="ta"?"தன்னார்வலர்":"Volunteers"},
    {id:"guide",icon:"🩺",label:lang==="ta"?"முதலுதவி":"First Aid"},
    {id:"myAlerts",icon:"🔔",label:lang==="ta"?"விழிப்பூட்டல்":"Alerts",badge:myNotifCount},
    {id:"admin",icon:"🛡",label:lang==="ta"?"நிர்வாகி":"Admin",badge},
  ];

  const screens={
    home:<HomeScreen userLoc={userLoc} setScreen={setScreen} lang={lang} onSOS={triggerSOS} volunteers={volunteers} sosToday={sosToday}/>,
    volunteers:<VolunteersScreen userLoc={userLoc} setScreen={setScreen} setSelectedVol={setSelectedVol} volunteers={volunteers}/>,
    map:<MapScreen userLoc={userLoc} selectedVol={selectedVol} setScreen={setScreen}/>,
    campusMap:<CampusMapScreen setScreen={setScreen}/>,
    contacts:<ContactsScreen setScreen={setScreen}/>,
    guide:<GuideScreen setScreen={setScreen} lang={lang}/>,
    myAlerts:<MyAlertsScreen session={session} lang={lang}/>,
    login:<LoginScreen onLoggedIn={handleLoggedIn} setScreen={setScreen}/>,
    profile:<ProfileScreen session={session} setScreen={setScreen} volunteers={volunteers} setVolunteers={setVolunteers} onSessionUpdate={setSession} lang={lang}/>,
    register:session?<RegisterScreen setScreen={setScreen} session={session} onRegistered={handleRegistered} userLoc={userLoc} lang={lang}/>:<LoginScreen onLoggedIn={handleLoggedIn} setScreen={setScreen}/>,
    admin:<AdminScreen volunteers={volunteers} setVolunteers={setVolunteers} sosToday={sosToday} lang={lang}/>,
  };

  return(
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');@keyframes sd{from{opacity:0;transform:translateX(-50%) translateY(-16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}input::placeholder,textarea::placeholder{color:#475569;}input:focus,textarea:focus{border-color:#D4A017!important;}button:active{transform:scale(0.97);}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0A1628}::-webkit-scrollbar-thumb{background:#1A3058;border-radius:4px}`}</style>
      {toast&&(
        <div style={{position:"fixed",top:88,left:"50%",transform:"translateX(-50%)",zIndex:999,width:"90%",maxWidth:390,background:(toast.type==="call"||toast.type==="sos")?"#7f1d1d":"#1a1400",border:`2px solid ${(toast.type==="call"||toast.type==="sos")?C.red:C.gold}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,animation:"sd 0.3s ease"}}>
          <span style={{fontSize:22}}>{toast.type==="sos"?"🆘":toast.type==="call"?"🚨":toast.type==="approved"?"✅":toast.type==="registered"?"📝":"📢"}</span>
          <div style={{flex:1}}><p style={{fontWeight:800,fontSize:11,color:C.gold,margin:"0 0 2px",textTransform:"uppercase"}}>Alert</p><p style={{color:C.white,fontSize:12,margin:0}}><strong>{toast.volName}</strong>: {toast.message}</p></div>
          <button onClick={()=>setToast(null)} style={{background:"none",border:"none",color:C.gray,fontSize:18,cursor:"pointer"}}>✕</button>
        </div>
      )}
      <Header lang={lang} onToggle={toggleLang}/>
      <LocationBanner userLoc={userLoc} lang={lang}/>
      <div>{screens[screen]||screens.home}</div>
      <nav style={S.navBar}>
        {navItems.map(n=>(
          <button key={n.id} style={S.navBtn(screen===n.id||(screen==="map"&&n.id==="volunteers"))} onClick={()=>setScreen(n.id)}>
            <span style={{fontSize:20,position:"relative",display:"inline-block"}}>
              {n.icon}
              {n.badge>0&&<span style={{position:"absolute",top:-4,right:-6,background:C.red,color:C.white,borderRadius:"50%",fontSize:8,fontWeight:800,width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{n.badge}</span>}
            </span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}