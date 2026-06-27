import { useState, useEffect, useRef, useCallback } from "react";

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

const ADMIN_PIN = "6202csacgspaga";
const CAMPUS_RADIUS_KM = 2.0;
const CAMPUS_CENTER = { lat: 11.0345, lng: 77.0355 };

const FIRST_AID_EN = [
  { id:"bls", icon:"🫀", title:"Basic Life Support (BLS)", steps:["Ensure scene safety — fire, electricity, traffic.","Tap shoulders firmly: 'Are you okay?'","Call 108 immediately.","Head Tilt–Chin Lift. Check breathing 10 sec.","Breathing → Recovery Position. Not breathing → CPR."] },
  { id:"recovery", icon:"🛌", title:"Recovery Position", steps:["Kneel beside victim.","Place nearest arm at right angle.","Bring far arm across chest.","Bend far knee upward.","Roll onto side.","Tilt head back to keep airway open.","Monitor until help arrives."] },
  { id:"cpr", icon:"❤️", title:"CPR", steps:["Heel of hand on center of chest.","Second hand on top, interlock fingers.","Arms straight, 30 compressions, 5cm deep, 100–120/min.","2 rescue breaths — pinch nose, cover mouth.","Repeat 30:2 until help arrives."] },
  { id:"choking", icon:"😮", title:"Choking", steps:["Encourage coughing.","Stand behind victim.","Fist above navel, cover with other hand.","Quick upward thrusts.","Continue until expelled."] },
  { id:"fracture", icon:"🦴", title:"Fractures", steps:["Keep area still.","Do NOT straighten bone.","Apply ice wrapped in cloth.","Support with splint.","Seek help immediately."] },
  { id:"bleeding", icon:"🩸", title:"Severe Bleeding", steps:["Apply direct pressure.","Elevate above heart.","Cover with bandage.","Continue pressure.","Call 108 if severe."] },
  { id:"drowning", icon:"🌊", title:"Drowning", steps:["Remove from water safely.","Call 108.","Check breathing.","Breathing → Recovery Position.","Not breathing → CPR."] },
  { id:"burns", icon:"🔥", title:"Burns", steps:["Remove from heat.","Cool with running water 20 min.","Cover with sterile dressing.","Do NOT apply butter or oil.","Do NOT break blisters."] },
  { id:"seizure", icon:"⚡", title:"Seizures", steps:["Move dangerous objects away.","Cushion head.","Loosen tight clothing.","Do NOT restrain.","After: Recovery Position.","Call 108 if over 5 minutes."] },
  { id:"heartattack", icon:"💔", title:"Heart Attack", steps:["Call 108 immediately.","Sit person comfortably.","Loosen tight clothing.","No food or drink.","If unconscious → CPR."] },
  { id:"snakebite", icon:"🐍", title:"Snake Bite", steps:["Keep still.","Wash bite gently.","Keep limb BELOW heart.","Remove rings/tight items.","Go to hospital immediately.","Do NOT cut or suck venom."] },
  { id:"dogbite", icon:"🐕", title:"Dog Bite", steps:["Wash with running water.","Clean with soap.","Cover with dressing.","Visit hospital immediately.","Check rabies vaccination."] },
  { id:"fire", icon:"🚒", title:"Fire Emergency", steps:["Activate fire alarm.","Use stairs NOT lift.","Crawl below smoke.","Cover nose with wet cloth.","Close doors behind you.","Go to assembly point."] },
];

const DEFAULT_GUIDE_TA = [
  { id:"bls", icon:"🫀", title:"அடிப்படை உயிர் ஆதரவு", steps:["காட்சி பாதுகாப்பை உறுதி செய்யவும்.","தோள்களை தட்டி கூவுங்கள்.","108 அழைக்கவும்.","Head Tilt–Chin Lift. சுவாசம் சரிபார்க்கவும்.","சுவாசம் இல்லை → CPR தொடங்கவும்."] },
  { id:"recovery", icon:"🛌", title:"Recovery Position", steps:["பக்கவாட்டில் திருப்பவும்.","தலையை பின்னோக்கி சாய்க்கவும்.","சுவாசம் கண்காணிக்கவும்."] },
  { id:"cpr", icon:"❤️", title:"CPR", steps:["மார்பின் மையத்தில் கை வையுங்கள்.","30 அழுத்தங்கள், 5 செ.மீ ஆழம்.","2 மூச்சுகள் கொடுங்கள்.","30:2 தொடரவும்."] },
  { id:"choking", icon:"😮", title:"தொண்டை அடைப்பு", steps:["வலுவான இருமலை ஊக்குவிக்கவும்.","முதுகில் 5 அடிகள்.","வயிற்று அழுத்தங்கள் கொடுங்கள்."] },
  { id:"fracture", icon:"🦴", title:"எலும்பு முறிவு", steps:["அசைக்காதீர்கள்.","நேராக்க முயற்சிக்காதீர்கள்.","Ice pack வையுங்கள்.","உடனே மருத்துவ உதவி நாடவும்."] },
  { id:"bleeding", icon:"🩸", title:"இரத்தப்போக்கு", steps:["நேரடி அழுத்தம் கொடுங்கள்.","உயர்த்தவும்.","கட்டுடன் மூடவும்.","108 அழைக்கவும்."] },
  { id:"drowning", icon:"🌊", title:"நீரில் மூழ்குதல்", steps:["நீரிலிருந்து வெளியேற்றவும்.","108 அழைக்கவும்.","சுவாசம் இல்லை → CPR."] },
  { id:"burns", icon:"🔥", title:"தீக்காயங்கள்", steps:["வெப்ப மூலத்திலிருந்து அகற்றவும்.","20 நிமிடம் ஓடும் தண்ணீர்.","மலட்டு கட்டு போடவும்.","வெண்ணெய் தடவாதீர்கள்."] },
  { id:"seizure", icon:"⚡", title:"வலிப்பு", steps:["ஆபத்தான பொருட்களை அகற்றவும்.","தலையை ஆதரிக்கவும்.","கட்டாயப்படுத்தாதீர்கள்.","5 நிமிடம் தாண்டினால் 108."] },
  { id:"heartattack", icon:"💔", title:"மாரடைப்பு", steps:["108 அழைக்கவும்.","வசதியாக அமரவையுங்கள்.","நினைவிழந்தால் CPR."] },
  { id:"snakebite", icon:"🐍", title:"பாம்பு கடி", steps:["அமைதியாக வையுங்கள்.","மருத்துவமனை விரைவாக செல்லவும்.","வெட்டாதீர்கள்."] },
  { id:"dogbite", icon:"🐕", title:"நாய் கடி", steps:["ஓடும் தண்ணீரில் கழுவுங்கள்.","மருத்துவமனை செல்லவும்."] },
  { id:"fire", icon:"🚒", title:"தீ அவசரநிலை", steps:["அலாரம் இயக்கவும்.","படிக்கட்டு பயன்படுத்தவும்.","புகைக்கு கீழே ஊர்ந்து செல்லவும்.","சேர்க்கை இடம் செல்லவும்."] },
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
  { name:"Parking", lat:11.0338, lng:77.0348, icon:"🅿️" },
  { name:"Assembly Point", lat:11.0352, lng:77.0370, icon:"📢" },
  { name:"Medical Room", lat:11.0355, lng:77.0375, icon:"⚕️" },
];

// ─── VOLUNTEER NOTIFICATIONS ───
function getVolNotifs(email) { try { return JSON.parse(localStorage.getItem(`aga_n_${email}`) || "[]"); } catch { return []; } }
function saveVolNotifs(email, n) { try { localStorage.setItem(`aga_n_${email}`, JSON.stringify(n.slice(0,50))); } catch {} }
function pushVolNotif(email, notif) {
  if (!email) return;
  saveVolNotifs(email, [{ ...notif, id: Date.now()+Math.random(), time: new Date().toLocaleTimeString(), read: false }, ...getVolNotifs(email)]);
}

// ─── GLOBAL ALERTS ───
let gAlerts = [], aListeners = [];
function subAlerts(fn) { aListeners.push(fn); return () => { aListeners = aListeners.filter(l => l !== fn); }; }
function pushGAlert(a) { gAlerts = [a, ...gAlerts].slice(0,80); aListeners.forEach(fn => fn([...gAlerts])); }
function sendAlert(vol, type, extra = {}) {
  const msgs = { call:"📞 Someone is calling you!", map:"🗺 Someone is viewing your location!", sos:"🚨 SOS ALERT nearby!", approved:"✅ Application approved!", rejected:"❌ Application not approved.", broadcast: extra.message||"📢 Admin broadcast.", registered:"📝 Registration submitted!" };
  const notif = { id:Date.now()+Math.random(), volId:vol?.id, volName:vol?.name||"All", type, message:msgs[type]||"Alert", time:new Date().toLocaleTimeString(), read:false, userLoc:extra.userLoc||null, userPhone:extra.userPhone||null };
  pushGAlert(notif);
  if (vol?.email) pushVolNotif(vol.email, notif);
}

function haversine(a,b,c,d){const R=6371000,r=x=>x*Math.PI/180,dL=r(c-a),dG=r(d-b),s=Math.sin(dL/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dG/2)**2;return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));}
function bearingDeg(a,b,c,d){const r=x=>x*Math.PI/180,dG=r(d-b);return(Math.atan2(Math.sin(dG)*Math.cos(r(c)),Math.cos(r(a))*Math.sin(r(c))-Math.sin(r(a))*Math.cos(r(c))*Math.cos(dG))*180/Math.PI+360)%360;}
function fmtDist(m){return m<1000?`${Math.round(m)}m`:`${(m/1000).toFixed(1)}km`;}
function fmtCoord(n){return n!=null?parseFloat(n).toFixed(5):"—";}

function loadContacts(){try{const r=localStorage.getItem("aga_contacts");return r?JSON.parse(r):DEFAULT_CONTACTS;}catch{return DEFAULT_CONTACTS;}}
function saveContacts(c){try{localStorage.setItem("aga_contacts",JSON.stringify(c));}catch{}}
function loadSession(){try{const r=localStorage.getItem("aga_session");return r?JSON.parse(r):null;}catch{return null;}}
function saveSession(s){try{localStorage.setItem("aga_session",s?JSON.stringify(s):null);}catch{}}
function loadGuideEn(){try{const r=localStorage.getItem("aga_guide_en");return r?JSON.parse(r):FIRST_AID_EN;}catch{return FIRST_AID_EN;}}
function saveGuideEn(g){try{localStorage.setItem("aga_guide_en",JSON.stringify(g));}catch{}}
function loadGuideTa(){try{const r=localStorage.getItem("aga_guide_ta");return r?JSON.parse(r):DEFAULT_GUIDE_TA;}catch{return DEFAULT_GUIDE_TA;}}
function saveGuideTa(g){try{localStorage.setItem("aga_guide_ta",JSON.stringify(g));}catch{}}
function loadUserPhone(){try{return localStorage.getItem("aga_user_phone")||"";}catch{return "";}}
function saveUserPhone(p){try{localStorage.setItem("aga_user_phone",p);}catch{}}

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
        <p style={{fontSize:8,color:C.gray,margin:"1px 0 0"}}>PSG {lang==="ta"?"கலை மற்றும் அறிவியல் கல்லூரி":"College of Arts & Science"}, Coimbatore</p>
      </div>
    </div>
  );
}

function LocationBanner({userLoc,lang}){
  if(!userLoc)return null;
  return(
    <div style={{background:"#0d1f35",borderBottom:`1px solid ${C.navyLight}`,padding:"5px 14px",display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:12}}>📍</span>
      <span style={{fontSize:10,color:C.gold,fontWeight:800}}>{lang==="ta"?"இருப்பிடம்":"YOU"}: </span>
      <span style={{fontSize:11,color:C.white,fontFamily:"monospace",flex:1}}>{fmtCoord(userLoc.lat)}, {fmtCoord(userLoc.lng)}</span>
      <div style={{width:7,height:7,borderRadius:"50%",background:C.green,boxShadow:`0 0 5px ${C.green}`}}/>
    </div>
  );
}

// ─── PHONE GATE ───
function PhoneGate({onSave,lang}){
  const [phone,setPhone]=useState("");
  const [err,setErr]=useState("");
  function save(){
    const t=phone.trim();
    if(t.length<7){setErr("Please enter a valid phone number.");return;}
    saveUserPhone(t);
    onSave(t);
  }
  return(
    <div style={{...S.app,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>📱</div>
        <p style={{fontSize:18,fontWeight:800,color:C.gold,marginBottom:8}}>{lang==="ta"?"உங்கள் தொலைபேசி எண்":"Your Phone Number"}</p>
        <div style={{...S.card(C.gold),textAlign:"left",marginBottom:16}}>
          <p style={{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}}>
            {lang==="ta"
              ?"உங்கள் தொலைபேசி எண் தன்னார்வலர்களுக்கு அனுப்பப்படும், அவர்கள் நேரடியாக உங்களை அழைக்கலாம்."
              :"Your phone number will be shared with nearby volunteers so they can call you directly in an emergency."}
          </p>
        </div>
        <span style={S.label}>{lang==="ta"?"தொலைபேசி எண் *":"Phone Number *"}</span>
        <input style={S.input} type="tel" placeholder="+91 9XXXXXXXXX" value={phone} onChange={e=>{setPhone(e.target.value);setErr("");}}/>
        {err&&<p style={S.err}>{err}</p>}
        <button style={S.btn(C.gold,C.navy)} onClick={save}>
          {lang==="ta"?"சேமித்து தொடரவும்":"Save & Continue →"}
        </button>
      </div>
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
            <p style={{color:"#fca5a5",fontSize:13,margin:0,lineHeight:1.5}}>{lang==="ta"?"AGA அவசர சேவைக்கு உங்கள் இருப்பிடம் தேவை.":"Your location is needed for emergency services."}</p>
          </div>
          {err&&<p style={{color:"#fbbf24",fontSize:12,marginBottom:12}}>Location denied — using campus as fallback.</p>}
          <button style={S.btn(C.gold,C.navy)} onClick={tryEnable}>📍 {lang==="ta"?"இருப்பிடத்தை இயக்கு":"Enable Location"}</button>
        </div>
      </div>
    </div>
  );
}

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
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.green,margin:0}}>{active}</p><p styl