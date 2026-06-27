import { useState, useEffect, useRef, useCallback } = "react";

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
  { id:"recovery", icon:"🛌", title:"Recovery Position", steps:["Kneel beside victim.","Place nearest arm at right angle.","Bring far arm across chest.","Bend far knee upward.","Roll onto side carefully.","Tilt head back to keep airway open.","Monitor until help arrives."] },
  { id:"cpr", icon:"❤️", title:"CPR (Cardiopulmonary Resuscitation)", steps:["Heel of hand on center of chest.","Second hand on top, interlock fingers.","Arms straight — 30 compressions, 5cm deep, 100–120/min.","2 rescue breaths — pinch nose, cover mouth, watch chest rise.","Repeat 30:2 until help arrives or breathing returns."] },
  { id:"choking", icon:"😮", title:"Choking", steps:["Encourage forceful coughing.","5 sharp back blows between shoulder blades.","Stand behind — fist above navel, pull sharply inward and upward 5 times.","Continue alternating back blows and abdominal thrusts.","If unconscious → begin CPR immediately."] },
  { id:"fracture", icon:"🦴", title:"Fractures / Broken Bone", steps:["Keep injured area completely still.","Do NOT attempt to straighten the bone.","Apply ice wrapped in cloth — 20 min on, 20 min off.","Support with splint beyond joints above and below fracture.","Seek medical help immediately."] },
  { id:"bleeding", icon:"🩸", title:"Severe Bleeding", steps:["Wear gloves if available.","Apply direct pressure with clean cloth — do not lift.","Elevate injured part above heart level.","Tourniquet for life-threatening limb bleeding: 5–7 cm above wound — note time.","Call 108 if bleeding is severe."] },
  { id:"drowning", icon:"🌊", title:"Drowning", steps:["Remove victim from water safely.","Call 108 immediately.","Check breathing.","Breathing → Recovery Position.","Not breathing → Start CPR.","Continue until medical help arrives."] },
  { id:"burns", icon:"🔥", title:"Burns", steps:["Remove from heat source immediately.","Cool with running water for 20 minutes — NOT ice.","Remove tight jewelry carefully.","Cover loosely with sterile non-stick dressing.","If clothing on fire: STOP – DROP – ROLL.","Do NOT apply butter, oil, or toothpaste. Do NOT break blisters."] },
  { id:"seizure", icon:"⚡", title:"Seizures (Fits)", steps:["Stay calm. Move dangerous objects away.","Cushion the head.","Loosen tight clothing around neck.","Do NOT restrain the person.","Do NOT put anything in the mouth.","Time the seizure from start.","After it stops → Recovery Position.","Call 108 if seizure lasts more than 5 minutes."] },
  { id:"heartattack", icon:"💔", title:"Heart Attack", steps:["Call 108 immediately.","Help person sit comfortably.","Loosen tight clothing around neck and chest.","Keep calm — no food or drinks.","If unconscious and not breathing → Start CPR."] },
  { id:"shock", icon:"😰", title:"Shock", steps:["Lay person flat on back.","Elevate legs 30 cm — unless head/spine injury suspected.","Keep warm with blanket — do not overheat.","No food or drink.","Check breathing every 2 minutes. Be ready for CPR."] },
  { id:"snakebite", icon:"🐍", title:"Snake Bite", steps:["Keep victim calm and still.","Wash bite gently with clean water.","Keep bitten limb BELOW heart level.","Remove rings and tight items near bite.","Call 108 and go to hospital immediately.","Do NOT cut, suck venom, apply tourniquet or ice."] },
  { id:"dogbite", icon:"🐕", title:"Dog Bite", steps:["Wash wound with running water for several minutes.","Clean with soap.","Cover with sterile dressing.","Visit hospital immediately — rabies risk.","Assess rabies vaccination status."] },
  { id:"fire", icon:"🚒", title:"Fire Emergency", steps:["Activate fire alarm immediately.","Use stairs NOT elevator.","Crawl below smoke level.","Cover nose and mouth with wet cloth.","Close doors behind you to slow fire spread.","Move to designated safe assembly point.","Do NOT use lifts. Do NOT open hot doors."] },
];

const FIRST_AID_TA = [
  { id:"bls", icon:"🫀", title:"அடிப்படை உயிர் ஆதரவு (BLS)", steps:["காட்சி பாதுகாப்பை உறுதி செய்யவும் — தீ, மின்சாரம், வாகனம்.","தோள்களை தட்டி கேளுங்கள்: 'உங்களுக்கு சரியாக உள்ளதா?'","108 உடனே அழைக்கவும்.","Head Tilt–Chin Lift. சுவாசத்தை 10 விநாடி சரிபார்க்கவும்.","சுவாசம் → Recovery Position. இல்லை → CPR தொடங்கவும்."] },
  { id:"recovery", icon:"🛌", title:"Recovery Position", steps:["பக்கவாட்டில் கவனமாக திருப்பவும்.","அருகில் உள்ள கையை தலை உயரத்தில் நேராக வையுங்கள்.","தூரமுள்ள கையை மார்பில் வையுங்கள்.","தூரமுள்ள முழங்காலை மேல்நோக்கி வளைக்கவும்.","சுவாசப்பாதை திறந்திருக்க தலையை பின்னோக்கி சாய்க்கவும்.","உதவி வரும் வரை சுவாசத்தை கண்காணிக்கவும்."] },
  { id:"cpr", icon:"❤️", title:"CPR (இதய நுரையீரல் புத்துயிர்ப்பு)", steps:["மார்பின் மையத்தில் கைகளை வையுங்கள்.","30 அழுத்தங்கள் — 5 செ.மீ ஆழம், 100–120/நிமிடம்.","2 மூச்சுகள் — மூக்கை பிடிக்கவும், வாயை மூடவும்.","30:2 விகிதம் தொடரவும் — உதவி வரும் வரை."] },
  { id:"choking", icon:"😮", title:"தொண்டை அடைப்பு", steps:["வலுவான இருமலை ஊக்குவிக்கவும்.","தோள் இடையில் 5 உறுதியான அடிகள்.","பின்னால் நிற்கவும் — வயிற்றுக்கு மேலே முஷ்டி, 5 முறை இழுக்கவும்.","மயக்கமடைந்தால் → CPR உடனே தொடங்கவும்."] },
  { id:"fracture", icon:"🦴", title:"எலும்பு முறிவு", steps:["காயமடைந்த இடத்தை முழுவதும் அசைக்காதீர்கள்.","எலும்பை நேராக்க முயற்சிக்காதீர்கள்.","துணியில் சுற்றிய ice pack — 20 நிமிடம் வைத்து 20 நிமிடம் எடுங்கள்.","Splint கொடுங்கள் — முறிவுக்கு மேலும் கீழும் மூட்டுகளைத் தாண்டி.","உடனே மருத்துவ உதவி நாடவும்."] },
  { id:"bleeding", icon:"🩸", title:"கடுமையான இரத்தப்போக்கு", steps:["கையுறை இருந்தால் அணியவும்.","சுத்தமான துணியால் நேரடி அழுத்தம் — எடுக்காதீர்கள்.","காயமடைந்த உறுப்பை இதயத்திற்கு மேலே உயர்த்தவும்.","உயிருக்கு ஆபத்தான இரத்தப்போக்கு: காயத்திற்கு 5–7 செ.மீ மேலே கட்டுங்கள்.","கடுமையான இரத்தப்போக்கு என்றால் 108 அழைக்கவும்."] },
  { id:"drowning", icon:"🌊", title:"நீரில் மூழ்குதல்", steps:["நபரை நீரிலிருந்து பாதுகாப்பாக வெளியேற்றவும்.","108 உடனே அழைக்கவும்.","சுவாசம் → Recovery Position.","சுவாசம் இல்லை → CPR உடனே தொடங்கவும்.","மருத்துவ உதவி வரும் வரை தொடரவும்."] },
  { id:"burns", icon:"🔥", title:"தீக்காயங்கள்", steps:["வெப்ப மூலத்திலிருந்து உடனே விலகவும்.","குளிர்ந்த ஓடும் தண்ணீரில் 20 நிமிடம் — ice வேண்டாம்.","இறுக்கமான நகைகளை கவனமாக அகற்றவும்.","மலட்டு non-stick கட்டு தளர்வாக போடவும்.","ஆடையில் தீ: நில் – விழு – உருளு (STOP–DROP–ROLL).","வெண்ணெய், எண்ணெய் தடவாதீர்கள். குமிழிகளை உடைக்காதீர்கள்."] },
  { id:"seizure", icon:"⚡", title:"வலிப்பு (Seizures)", steps:["அமைதியாக இருங்கள். ஆபத்தான பொருட்களை விலக்கவும்.","தலைக்கு மென்மையான ஏதாவது கொடுங்கள்.","கழுத்தைச் சுற்றிய ஆடையை தளர்த்தவும்.","நபரை கட்டுப்படுத்தாதீர்கள். வாயில் எதுவும் போடாதீர்கள்.","வலிப்பு நின்றபின் → Recovery Position.","5 நிமிடம் தாண்டினால் 108 அழைக்கவும்."] },
  { id:"heartattack", icon:"💔", title:"மாரடைப்பு", steps:["108 உடனே அழைக்கவும்.","நபரை வசதியாக உட்கார வையுங்கள்.","கழுத்து மற்றும் மார்பைச் சுற்றிய ஆடையை தளர்த்தவும்.","உணவு அல்லது தண்ணீர் கொடுக்காதீர்கள்.","மயக்கமடைந்து சுவாசம் நின்றால் → CPR தொடங்கவும்."] },
  { id:"shock", icon:"😰", title:"அதிர்ச்சி நிலை (Shock)", steps:["நபரை மல்லாந்து படுக்க வையுங்கள்.","கால்களை 30 செ.மீ உயர்த்தவும் — தலை/முதுகெலும்பு காயம் இல்லை என்றால்.","கம்பளியால் மூடவும் — அதிக வெப்பம் வேண்டாம்.","உணவு அல்லது தண்ணீர் கொடுக்காதீர்கள்.","ஒவ்வொரு 2 நிமிடமும் சுவாசம் சரிபார்க்கவும்."] },
  { id:"snakebite", icon:"🐍", title:"பாம்பு கடி", steps:["நபரை அமைதியாகவும் அசைவற்றும் வையுங்கள்.","கடிக்கப்பட்ட இடத்தை சுத்தமான தண்ணீரில் கழுவுங்கள்.","கடிக்கப்பட்ட உறுப்பை இதயத்திற்கு கீழே வையுங்கள்.","மோதிரங்கள், இறுக்கமான பொருட்களை அகற்றவும்.","108 அழைத்து உடனே மருத்துவமனை செல்லவும்.","வெட்டாதீர்கள், உறிஞ்சாதீர்கள், tourniquet கட்டாதீர்கள்."] },
  { id:"dogbite", icon:"🐕", title:"நாய் கடி", steps:["ஓடும் தண்ணீரில் காயத்தை பல நிமிடங்கள் கழுவுங்கள்.","சோப்பால் சுத்தம் செய்யுங்கள்.","மலட்டு கட்டுடன் மூடவும்.","உடனே மருத்துவமனை செல்லவும் — வெறிநாய் கடி ஆபத்து.","தடுப்பூசி நிலையை சரிபார்க்கவும்."] },
  { id:"fire", icon:"🚒", title:"தீ அவசரநிலை", steps:["தீ அலாரத்தை உடனே இயக்கவும்.","படிக்கட்டு பயன்படுத்தவும் — லிஃப்ட் வேண்டாம்.","புகை இருந்தால் தரையில் கம்பி நடந்து செல்லவும்.","ஈரமான துணியால் மூக்கும் வாயும் மூடவும்.","வெளியேறும்போது கதவுகளை மூடவும்.","பாதுகாப்பு சந்திப்பு இடத்திற்கு நகரவும்.","லிஃப்ட் பயன்படுத்தாதீர்கள். சூடான கதவுகளை திறக்காதீர்கள்."] },
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
function getVolNotifs(email){try{return JSON.parse(localStorage.getItem(`aga_n_${email}`)||"[]");}catch{return[];}}
function saveVolNotifs(email,n){try{localStorage.setItem(`aga_n_${email}`,JSON.stringify(n.slice(0,50)));}catch{}}
function pushVolNotif(email,notif){if(!email)return;saveVolNotifs(email,[{...notif,id:Date.now()+Math.random(),time:new Date().toLocaleTimeString(),read:false},...getVolNotifs(email)]);}

// ─── GLOBAL ALERTS ───
let gAlerts=[],aListeners=[];
function subAlerts(fn){aListeners.push(fn);return()=>{aListeners=aListeners.filter(l=>l!==fn);};}
function pushGAlert(a){gAlerts=[a,...gAlerts].slice(0,80);aListeners.forEach(fn=>fn([...gAlerts]));}
function sendAlert(vol,type,extra={}){
  const msgs={call:"📞 Someone is calling you!",map:"🗺 Someone is viewing your location!",sos:"🚨 SOS ALERT nearby!",approved:"✅ Application approved!",rejected:"❌ Application not approved.",broadcast:extra.message||"📢 Admin broadcast.",registered:"📝 Registration submitted!"};
  const notif={id:Date.now()+Math.random(),volId:vol?.id,volName:vol?.name||"All",type,message:msgs[type]||"Alert",time:new Date().toLocaleTimeString(),read:false,userLoc:extra.userLoc||null,userPhone:extra.userPhone||null};
  pushGAlert(notif);
  if(vol?.email)pushVolNotif(vol.email,notif);
}

// ─── UTILS ───
function haversine(a,b,c,d){const R=6371000,r=x=>x*Math.PI/180,dL=r(c-a),dG=r(d-b),s=Math.sin(dL/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dG/2)**2;return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));}
function bearingDeg(a,b,c,d){const r=x=>x*Math.PI/180,dG=r(d-b);return(Math.atan2(Math.sin(dG)*Math.cos(r(c)),Math.cos(r(a))*Math.sin(r(c))-Math.sin(r(a))*Math.cos(r(c))*Math.cos(dG))*180/Math.PI+360)%360;}
function fmtDist(m){return m<1000?`${Math.round(m)}m`:`${(m/1000).toFixed(1)}km`;}
function fmtCoord(n){return n!=null?parseFloat(n).toFixed(5):"—";}

function loadContacts(){try{const r=localStorage.getItem("aga_contacts");return r?JSON.parse(r):DEFAULT_CONTACTS;}catch{return DEFAULT_CONTACTS;}}
function saveContacts(c){try{localStorage.setItem("aga_contacts",JSON.stringify(c));}catch{}}
function loadSession(){try{const r=localStorage.getItem("aga_session");return r?JSON.parse(r):null;}catch{return null;}}
function saveSession(s){try{if(s)localStorage.setItem("aga_session",JSON.stringify(s));else localStorage.removeItem("aga_session");}catch{}}
function loadGuideEn(){try{const r=localStorage.getItem("aga_guide_en");return r?JSON.parse(r):FIRST_AID_EN;}catch{return FIRST_AID_EN;}}
function saveGuideEn(g){try{localStorage.setItem("aga_guide_en",JSON.stringify(g));}catch{}}
function loadGuideTa(){try{const r=localStorage.getItem("aga_guide_ta");return r?JSON.parse(r):FIRST_AID_TA;}catch{return FIRST_AID_TA;}}
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

// ─── DESIGN ───
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
        <p style={{fontSize:8,color:C.gray,margin:"1px 0 0"}}>PSG {lang==="ta"?"கலை மற்றும் அறிவியல் கல்லூரி":"College of Arts & Science"}, Coimbatore</p>
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
      <span style={{fontSize:10,color:C.white,fontFamily:"monospace",flex:1}}>{fmtCoord(userLoc.lat)}, {fmtCoord(userLoc.lng)}</span>
      <div style={{width:7,height:7,borderRadius:"50%",background:C.green,boxShadow:`0 0 5px ${C.green}`}}/>
    </div>
  );
}

// ─── PHONE GATE ───
function PhoneGate({onSave,lang}){
  const[phone,setPhone]=useState("");
  const[err,setErr]=useState("");
  function save(){
    const t=phone.trim();
    if(t.length<7){setErr("Please enter a valid phone number.");return;}
    saveUserPhone(t);onSave(t);
  }
  return(
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>📱</div>
        <p style={{fontSize:18,fontWeight:800,color:C.gold,marginBottom:8}}>{lang==="ta"?"உங்கள் தொலைபேசி எண்":"Your Phone Number"}</p>
        <div style={{...S.card(C.gold),textAlign:"left",marginBottom:16}}>
          <p style={{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}}>
            {lang==="ta"
              ?"உங்கள் தொலைபேசி எண் தன்னார்வலர்களுக்கு அனுப்பப்படும், அவர்கள் நேரடியாக உங்களை அழைக்கலாம்."
              :"Your phone number will be shared with nearby volunteers so they can call you in an emergency."}
          </p>
        </div>
        <span style={S.label}>{lang==="ta"?"தொலைபேசி எண் *":"Phone Number *"}</span>
        <input style={S.input} type="tel" placeholder="+91 9XXXXXXXXX" value={phone} onChange={e=>{setPhone(e.target.value);setErr("");}}/>
        {err&&<p style={S.err}>{err}</p>}
        <button style={S.btn(C.gold,C.navy)} onClick={save}>{lang==="ta"?"சேமித்து தொடரவும்":"Save & Continue →"}</button>
      </div>
    </div>
  );
}

// ─── LOCATION GATE ───
function LocationGate({onEnable,lang,onTo