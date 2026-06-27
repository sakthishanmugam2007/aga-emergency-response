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
function LocationGate({onEnable,lang,onToggle}){
  const[err,setErr]=useState(false);
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
  const[filter,setFilter]=useState("all");
  const withDist=volunteers.filter(v=>v.approved).map(v=>({
    ...v,distance:userLoc&&v.lat&&v.lng?haversine(userLoc.lat,userLoc.lng,parseFloat(v.lat),parseFloat(v.lng)):9999
  })).sort((a,b)=>a.distance-b.distance);
  const nearby=withDist.filter(v=>v.distance<=CAMPUS_RADIUS_KM*1000);
  const filtered=filter==="available"?withDist.filter(v=>v.availability&&v.online):filter==="certified"?withDist.filter(v=>v.first_aid_certified):withDist;
  function callVol(vol){window.location.href=`tel:${vol.phone}`;sendAlert(vol,"call",{userLoc});playSound("call");}
  function viewMap(vol){sendAlert(vol,"map",{userLoc});setSelectedVol(vol);setScreen("map");}
  return(
    <div style={S.screen}>
      <div style={S.sHead}>🆘 {nearby.length>0?`${nearby.length} Volunteers Within 2km`:"All Volunteers"}</div>
      <p style={{color:C.gray,fontSize:11,marginTop:-8,marginBottom:12}}>Sorted by distance · live GPS · Supabase</p>
      <div style={{marginBottom:12}}>
        {["all","available","certified"].map(f=><button key={f} style={S.chip(filter,f)} onClick={()=>setFilter(f)}>{f==="all"?"All":f==="available"?"Available":"Certified"}</button>)}
      </div>
      {filtered.length===0&&<div style={{...S.card(),textAlign:"center",padding:28}}><p style={{color:C.gray,fontSize:13}}>No volunteers found.</p></div>}
      {filtered.map(vol=>(
        <div key={vol.id} style={S.card(vol.distance<=CAMPUS_RADIUS_KM*1000?C.gold:C.navyLight)}>
          {vol.distance<=CAMPUS_RADIUS_KM*1000&&<div style={{fontSize:10,color:C.gold,fontWeight:800,marginBottom:4}}>📍 WITHIN 2KM</div>}
          <div style={{...S.row,marginBottom:8}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:C.navy,flexShrink:0}}>{vol.name?.charAt(0)||"?"}</div>
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
            {vol.loc_updated_at&&<span style={{color:C.gold,marginLeft:6,fontSize:10}}>· {new Date(vol.loc_updated_at).toLocaleTimeString()}</span>}
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
            <span style={S.badge(vol.online)}>{vol.online?"Online":"Offline"}</span>
            <span style={S.badge(vol.availability)}>{vol.availability?"Available":"Unavailable"}</span>
            <span style={S.badge(vol.first_aid_certified)}>{vol.first_aid_certified?"✓ Certified":"Not Certified"}</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.btn(C.red,C.white),marginBottom:0,flex:1,padding:"10px 8px",fontSize:13}} onClick={()=>callVol(vol)}>📞 Call Now</button>
            <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1,padding:"10px 8px",fontSize:13,border:`1px solid ${C.gray}`}} onClick={()=>viewMap(vol)}>🗺 Map</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAP (live polling) ───
function MapScreen({userLoc,selectedVol,setScreen}){
  const[myLoc,setMyLoc]=useState(userLoc);
  const[volLoc,setVolLoc]=useState(selectedVol?{lat:parseFloat(selectedVol.lat||CAMPUS_CENTER.lat),lng:parseFloat(selectedVol.lng||CAMPUS_CENTER.lng)}:null);
  useEffect(()=>{
    if(!navigator.geolocation)return;
    const id=navigator.geolocation.watchPosition(p=>setMyLoc({lat:p.coords.latitude,lng:p.coords.longitude}),null,{enableHighAccuracy:true});
    return()=>navigator.geolocation.clearWatch(id);
  },[]);
  useEffect(()=>{
    if(!selectedVol?.id)return;
    const fetch=()=>db.getVolunteers().then(vols=>{const v=vols.find(x=>x.id===selectedVol.id);if(v&&v.lat&&v.lng)setVolLoc({lat:parseFloat(v.lat),lng:parseFloat(v.lng)});}).catch(()=>{});
    fetch();
    const t=setInterval(fetch,10000);
    return()=>clearInterval(t);
  },[selectedVol?.id]);
  const vol=selectedVol;
  if(!vol){setScreen("volunteers");return null;}
  const uLat=myLoc?.lat||CAMPUS_CENTER.lat,uLng=myLoc?.lng||CAMPUS_CENTER.lng;
  const vLat=volLoc?.lat||CAMPUS_CENTER.lat,vLng=volLoc?.lng||CAMPUS_CENTER.lng;
  const dist=haversine(uLat,uLng,vLat,vLng);
  const deg=bearingDeg(uLat,uLng,vLat,vLng);
  const osmUrl=`https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${uLat}%2C${uLng}%3B${vLat}%2C${vLng}`;
  return(
    <div style={S.screen}>
      <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("volunteers")}>← Back</button>
      <div style={S.sHead}>🗺 Volunteer Live Location</div>
      <div style={{...S.card(C.gold),marginBottom:10}}>
        <div style={S.row}>
          <div style={{width:38,height:38,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:C.navy}}>{vol.name?.charAt(0)}</div>
          <div style={{flex:1}}><p style={{fontSize:15,fontWeight:700,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:0}}>{vol.department||vol.occupation}</p></div>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.green,boxShadow:`0 0 6px ${C.green}`}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <div style={{...S.statBox,flex:1}}><p style={{color:C.gold,fontWeight:800,fontSize:20,margin:0}}>{fmtDist(dist)}</p><p style={{color:C.gray,fontSize:10,margin:0}}>Distance</p></div>
        <div style={{...S.statBox,flex:1}}><p style={{color:C.gold,fontWeight:800,fontSize:20,margin:0}}>~{Math.max(1,Math.round(dist/80))} min</p><p style={{color:C.gray,fontSize:10,margin:0}}>Walk</p></div>
      </div>
      <div style={{...S.card(),marginBottom:8,fontSize:11,fontFamily:"monospace",lineHeight:1.8}}>
        <div style={{color:C.blue}}>📍 You: {fmtCoord(uLat)}, {fmtCoord(uLng)}</div>
        <div style={{color:C.gold}}>🎯 {vol.name?.split(" ")[0]}: {fmtCoord(vLat)}, {fmtCoord(vLng)}</div>
        <div style={{color:C.gray,fontSize:10}}>↻ Updates every 10s</div>
      </div>
      <div style={{background:C.navyLight,borderRadius:12,height:170,marginBottom:10,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle, rgba(212,160,23,0.1) 1px, transparent 1px)",backgroundSize:"16px 16px"}}/>
        {[1,2,3].map(r=><div key={r} style={{position:"absolute",top:"50%",left:"50%",width:r*52,height:r*52,marginLeft:-(r*26),marginTop:-(r*26),border:`1px solid rgba(148,163,184,${0.25-r*0.06})`,borderRadius:"50%"}}/>)}
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:C.blue,border:`2px solid ${C.white}`,margin:"0 auto"}}/>
          <p style={{fontSize:9,color:C.blue,margin:"2px 0 0",fontWeight:700}}>You</p>
        </div>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:`rotate(${deg}deg) translateY(-68px) rotate(${-deg}deg) translate(-50%,-50%)`,textAlign:"center"}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:C.gold,border:`2px solid ${C.navy}`,margin:"0 auto",boxShadow:`0 0 8px ${C.gold}`}}/>
          <p style={{fontSize:9,color:C.gold,fontWeight:700,margin:"2px 0 0",whiteSpace:"nowrap"}}>{vol.name?.split(" ")[0]}</p>
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
      <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("home")}>← Back</button>
      <div style={S.sHead}>🗺️ Campus Map — PSG CAS</div>
      <p style={{color:C.gray,fontSize:11,marginTop:-8,marginBottom:10}}>Near SITRA Junction, Avinashi Road, Coimbatore 641014</p>
      <div style={{borderRadius:12,overflow:"hidden",marginBottom:10,border:`1px solid ${C.gold}`}}>
        <iframe title="map" width="100%" height="230" style={{border:0,display:"block"}} src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${CAMPUS_CENTER.lat},${CAMPUS_CENTER.lng}`}/>
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
  const[guideEn,setGuideEn]=useState(loadGuideEn);
  const[guideTa,setGuideTa]=useState(loadGuideTa);
  const[selected,setSelected]=useState(null);
  const[editing,setEditing]=useState(null);
  const[editForm,setEditForm]=useState({title:"",steps:""});
  const items=lang==="ta"?guideTa:guideEn;
  function startEdit(item,eLang){
    const src=eLang==="en"?guideEn:guideTa;
    const found=src.find(x=>x.id===item.id)||item;
    setEditing({...found,eLang});
    setEditForm({title:found.title,steps:found.steps.join("\n")});
    setSelected(null);
  }
  function saveEdit(){
    const stepsArr=editForm.steps.split("\n").map(s=>s.trim()).filter(Boolean);
    if(editing.eLang==="en"){const u=guideEn.map(x=>x.id===editing.id?{...x,title:editForm.title,steps:stepsArr}:x);setGuideEn(u);saveGuideEn(u);}
    else{const u=guideTa.map(x=>x.id===editing.id?{...x,title:editForm.title,steps:stepsArr}:x);setGuideTa(u);saveGuideTa(u);}
    setEditing(null);
  }
  if(selected!==null){
    const item=items[selected];
    return(
      <div style={S.screen}>
        <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setSelected(null)}>← Back</button>
        <div style={{...S.card(C.gold),marginBottom:12}}>
          <p style={{fontSize:28,margin:"0 0 6px"}}>{item.icon}</p>
          <p style={{fontSize:16,fontWeight:800,color:C.gold,margin:"0 0 12px"}}>{item.title}</p>
          {item.steps.map((step,i)=>(
            <div key={i} style={{display:"flex",gap:12,marginBottom:10,alignItems:"flex-start"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color:C.navy,flexShrink:0}}>{i+1}</div>
              <p style={{color:C.white,fontSize:13,margin:0,lineHeight:1.6}}>{step}</p>
            </div>
          ))}
        </div>
        {canEdit&&(
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1,fontSize:12}} onClick={()=>startEdit(item,"en")}>✏️ Edit English</button>
            <button style={{...S.btn(C.navyLight,C.gold),marginBottom:0,flex:1,fontSize:12,border:`1px solid ${C.gold}`}} onClick={()=>startEdit(item,"ta")}>✏️ தமிழ் திருத்து</button>
          </div>
        )}
        <button style={S.btn(C.red,C.white)} onClick={()=>window.open("tel:108","_self")}>🚑 Call Ambulance 108</button>
      </div>
    );
  }
  return(
    <div style={S.screen}>
      {!canEdit&&<button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("home")}>← Back</button>}
      <div style={S.sHead}>🩺 {lang==="ta"?"முதலுதவி வழிகாட்டி":"First Aid Guide"}</div>
      <div style={{...S.card(),marginBottom:10,background:"#1a2d1a",border:`1px solid ${C.green}`}}>
        <p style={{color:"#86efac",fontSize:12,margin:0}}>⚠️ {lang==="ta"?"உண்மையான அவசரநிலையில் 108 அழைக்கவும்.":"Always call 108 in a real emergency."}</p>
      </div>
      {items.map((item,i)=>(
        <button key={item.id} style={{...S.card(),width:"100%",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:12}} onClick={()=>setSelected(i)}>
          <span style={{fontSize:24,flexShrink:0}}>{item.icon}</span>
          <div style={{flex:1}}>
            <p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{item.title}</p>
            <p style={{fontSize:11,color:C.gray,margin:"2px 0 0"}}>{item.steps.length} {lang==="ta"?"படிகள்":"steps"}</p>
          </div>
          <span style={{color:C.gold,fontSize:16}}>›</span>
        </button>
      ))}
      {editing&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:500,padding:16,overflowY:"auto"}}>
          <div style={{background:C.navyMid,borderRadius:14,padding:20,width:"100%",maxWidth:380,marginTop:16}}>
            <p style={{color:C.white,fontWeight:700,fontSize:15,marginBottom:4}}>✏️ Edit {editing.eLang==="en"?"English 🇬🇧":"Tamil 🇮🇳"}</p>
            <p style={{color:C.gray,fontSize:11,marginBottom:12}}>Only {editing.eLang==="en"?"English":"Tamil"} content is changed.</p>
            <span style={S.label}>Title</span>
            <input style={S.input} value={editForm.title} onChange={e=>setEditForm(p=>({...p,title:e.target.value}))}/>
            <span style={S.label}>Steps — one per line</span>
            <textarea style={{...S.input,minHeight:160,resize:"vertical",fontFamily:"inherit",fontSize:12}} value={editForm.steps} onChange={e=>setEditForm(p=>({...p,steps:e.target.value}))}/>
            <div style={{display:"flex",gap:8}}>
              <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1}} onClick={()=>setEditing(null)}>Cancel</button>
              <button style={{...S.btn(C.gold,C.navy),marginBottom:0,flex:1}} onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONTACTS ───
function ContactsScreen({canEdit=false,setScreen}){
  const[contacts,setContacts]=useState(loadContacts);
  const[editKey,setEditKey]=useState(null);
  const[ef,setEf]=useState({icon:"",label:"",number:"",desc:""});
  const[adding,setAdding]=useState(false);
  function persist(next){setContacts(next);saveContacts(next);}
  function save(){if(!ef.label||!ef.number)return;adding?persist([...contacts,{key:`c-${Date.now()}`,icon:ef.icon||"📞",label:ef.label,number:ef.number,desc:ef.desc}]):persist(contacts.map(c=>c.key===editKey?{...c,...ef}:c));setEditKey(null);}
  return(
    <div style={S.screen}>
      {!canEdit&&<button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("home")}>← Back</button>}
      <div style={S.sHead}>📞 Emergency Contacts</div>
      {contacts.map(c=>(
        <div key={c.key} style={{background:C.red,borderRadius:12,padding:"13px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22,cursor:"pointer"}} onClick={()=>window.open(`tel:${c.number}`,"_self")}>{c.icon}</span>
          <div style={{flex:1,cursor:"pointer"}} onClick={()=>window.open(`tel:${c.number}`,"_self")}>
            <p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{c.label}</p>
            <p style={{fontSize:11,color:"#fecaca",margin:0}}>{c.desc}</p>
          </div>
          <div style={{cursor:"pointer",textAlign:"right"}} onClick={()=>window.open(`tel:${c.number}`,"_self")}>
            <p style={{fontSize:13,color:"#fecaca",fontWeight:800,margin:0}}>{c.number}</p>
            <p style={{fontSize:9,color:"#fca5a5",margin:0}}>Tap to call</p>
          </div>
          {canEdit&&(
            <div style={{display:"flex",gap:4}}>
              <button style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.white,fontSize:12}} onClick={()=>{setEditKey(c.key);setEf({icon:c.icon,label:c.label,number:c.number,desc:c.desc});setAdding(false);}}>✏️</button>
              <button style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.white,fontSize:12}} onClick={()=>{if(window.confirm("Remove?"))persist(contacts.filter(x=>x.key!==c.key));}}>🗑️</button>
            </div>
          )}
        </div>
      ))}
      {canEdit&&<button style={S.btn(C.navyLight,C.white)} onClick={()=>{setEditKey("__new__");setEf({icon:"📞",label:"",number:"",desc:""});setAdding(true);}}>➕ Add Contact</button>}
      {canEdit&&editKey&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
          <div style={{background:C.navyMid,borderRadius:14,padding:20,width:"100%",maxWidth:340}}>
            <p style={{color:C.white,fontWeight:700,fontSize:15,marginBottom:12}}>{adding?"Add":"Edit"} Contact</p>
            {[["Icon","icon"],["Label","label"],["Phone","number"],["Description","desc"]].map(([l,k])=>(
              <div key={k}><span style={S.label}>{l}</span><input style={S.input} value={ef[k]} onChange={e=>setEf(x=>({...x,[k]:e.target.value}))}/></div>
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
  const[email,setEmail]=useState("");const[err,setErr]=useState("");
  function handle(){
    const t=email.trim().toLowerCase();
    if(!t.includes("@")||!t.includes(".")){setErr("Enter a valid email.");return;}
    const existing=loadSession();
    const profile=(existing&&existing.email===t)?existing:{email:t,registered:false,name:"",approved:false};
    saveSession(profile);onLoggedIn(profile);
  }
  return(
    <div style={S.screen}>
      <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("home")}>← Back</button>
      <div style={S.sHead}>🔑 Volunteer Login</div>
      <div style={{...S.card(),marginBottom:12}}><p style={{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}}>Your profile is saved permanently in Supabase. Log in anytime to restore everything.</p></div>
      <button style={{...S.btn("#ffffff","#111"),border:`1px solid ${C.gray}`,marginBottom:12}} onClick={()=>alert("Google Sign-In requires Firebase setup. Please use email login for now.")}>
        <span style={{fontSize:16}}>🔵</span> Continue with Google
      </button>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{flex:1,height:1,background:C.navyLight}}/><span style={{color:C.gray,fontSize:12}}>OR</span><div style={{flex:1,height:1,background:C.navyLight}}/>
      </div>
      <span style={S.label}>Email ID</span>
      <input style={S.input} type="email" placeholder="yourname@psgcas.edu.in" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}/>
      {err&&<p style={S.err}>{err}</p>}
      <button style={S.btn(C.gold,C.navy)} onClick={handle}>Continue with Email →</button>
    </div>
  );
}

// ─── PROFILE ───
function ProfileScreen({session,setScreen,volunteers,setVolunteers,onSessionUpdate,lang}){
  const vol=session?volunteers.find(v=>v.email===session.email):null;
  const[editing,setEditing]=useState(false);
  const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({name:vol?.name||"",phone:vol?.phone||"",department:vol?.department||"",year:vol?.year||"",occupation:vol?.occupation||"",remarks:vol?.remarks||""});
  if(!session)return(
    <div style={S.screen}>
      <div style={{...S.card(),textAlign:"center",padding:32}}>
        <p style={{fontSize:32,margin:"0 0 12px"}}>👤</p>
        <p style={{color:C.gray,fontSize:13,marginBottom:14}}>{lang==="ta"?"உள்நுழையவும்.":"Please login to view your profile."}</p>
        <button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("login")}>Login / Register</button>
      </div>
    </div>
  );
  if(!vol)return(
    <div style={S.screen}>
      <div style={{...S.card(),textAlign:"center",padding:32}}>
        <p style={{fontSize:32,margin:"0 0 12px"}}>📝</p>
        <p style={{color:C.gray,fontSize:13,marginBottom:6}}>{lang==="ta"?"தன்னார்வலராக பதிவு செய்யவில்லை.":"Not registered as volunteer yet."}</p>
        <p style={{color:C.gold,fontSize:12,marginBottom:14}}>{session.email}</p>
        <button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("register")}>Register Now</button>
        <button style={{...S.btn(C.navyLight,C.white),marginTop:4}} onClick={()=>{saveSession(null);onSessionUpdate(null);setScreen("home");}}>🚪 Logout</button>
      </div>
    </div>
  );
  const isOnline=vol.online&&vol.availability;
  async function toggleAvail(){
    setSaving(true);
    try{const u={online:!vol.online,availability:!vol.availability};await db.updateVolunteer(vol.id,u);setVolunteers(p=>p.map(v=>v.id===vol.id?{...v,...u}:v));}
    catch(e){alert(e.message);}
    setSaving(false);
  }
  async function saveEdit(){
    setSaving(true);
    try{await db.updateVolunteer(vol.id,form);setVolunteers(p=>p.map(v=>v.id===vol.id?{...v,...form}:v));const s={...session,name:form.name};saveSession(s);onSessionUpdate(s);setEditing(false);}
    catch(e){alert(e.message);}
    setSaving(false);
  }
  return(
    <div style={S.screen}>
      <div style={S.sHead}>👤 My Profile</div>
      <div style={{...S.card(C.gold),marginBottom:10}}>
        <div style={{...S.row,marginBottom:10}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:C.navy,flexShrink:0}}>{vol.name?.charAt(0)||"?"}</div>
          <div style={{flex:1}}><p style={{fontSize:16,fontWeight:800,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:"2px 0 0"}}>{vol.email}</p></div>
          <span style={S.badge(vol.approved)}>{vol.approved?"✅ Approved":"⏳ Pending"}</span>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <span style={S.badge(isOnline)}>{isOnline?"🟢 Online":"🔴 Offline"}</span>
          <span style={S.badge(vol.first_aid_certified)}>{vol.first_aid_certified?"🏅 Certified":"Not Certified"}</span>
        </div>
        <button style={{...S.btn(isOnline?"#14532d":"#1a3a1a","#86efac"),marginBottom:0,border:`1px solid ${isOnline?C.green:"#166534"}`}} onClick={toggleAvail} disabled={saving}>
          {saving?"Saving...":(isOnline?"🟢 Mark as Unavailable":"🔴 Mark as Available")}
        </button>
      </div>
      <button style={{...S.btn(C.navyLight,C.white),border:`1px solid ${C.navyLight}`}} onClick={()=>setScreen("myAlerts")}>🔔 View My Notifications</button>
      {!editing?(
        <div style={S.card()}>
          {[["📞 Phone",vol.phone],["🏢 Department",vol.department],["📅 Year",vol.year],["💼 Occupation",vol.occupation],["🏅 First Aid Trained",vol.first_aid_trained?"Yes":"No"],["📋 Training Details",vol.remarks]].map(([l,v])=>v?(
            <div key={l} style={{marginBottom:8}}><span style={{...S.label,marginTop:0}}>{l}</span><p style={{color:C.white,fontSize:13,margin:0}}>{v}</p></div>
          ):null)}
          <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,marginTop:10}} onClick={()=>setEditing(true)}>✏️ Edit My Details</button>
        </div>
      ):(
        <div style={S.card()}>
          <p style={{color:C.gold,fontWeight:700,fontSize:13,marginBottom:12}}>Edit Your Details</p>
          {[["Name","name","text"],["Phone","phone","tel"],["Department","department","text"],["Year","year","text"],["Occupation","occupation","text"],["Training Details","remarks","text"]].map(([l,k,t])=>(
            <div key={k}><span style={S.label}>{l}</span><input style={S.input} type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1}} onClick={()=>setEditing(false)}>Cancel</button>
            <button style={{...S.btn(C.gold,C.navy),marginBottom:0,flex:1}} onClick={saveEdit} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
          </div>
        </div>
      )}
      <button style={{...S.btn(C.navyLight,C.white),marginTop:4,border:`1px solid ${C.red}`,color:"#fca5a5"}} onClick={()=>{saveSession(null);onSessionUpdate(null);setScreen("home");}}>🚪 Logout</button>
    </div>
  );
}

// ─── REGISTER ───
function RegisterScreen({setScreen,session,onRegistered,userLoc,lang}){
  const[form,setForm]=useState({name:session?.name||"",email:session?.email||"",roll:"",phone:"",department:"",year:"",occupation:"",first_aid_trained:null,first_aid_certified:null,remarks:""});
  const[done,setDone]=useState(false);const[loading,setLoading]=useState(false);const[errs,setErrs]=useState({});
  function upd(k,v){setForm(p=>({...p,[k]:v}));setErrs(p=>({...p,[k]:null}));}
  function validate(){const e={};if(!form.name.trim())e.name="Required";if(!form.email.includes("@"))e.email="Valid email required";if(!form.phone.trim())e.phone="Required";if(!form.remarks.trim())e.remarks="Required";if(form.first_aid_certified===null)e.cert="Required";setErrs(e);return Object.keys(e).length===0;}
  async function submit(){
    if(!validate())return;setLoading(true);
    try{
      await db.addVolunteer({name:form.name,roll:form.roll,email:form.email,phone:form.phone,department:form.department,year:form.year,occupation:form.occupation,first_aid_trained:form.first_aid_trained||false,first_aid_certified:form.first_aid_certified||false,remarks:form.remarks,approved:false,online:false,availability:true,lat:userLoc?.lat||CAMPUS_CENTER.lat,lng:userLoc?.lng||CAMPUS_CENTER.lng});
      const p={...session,registered:true,approved:false,name:form.name};
      saveSession(p);
      pushVolNotif(form.email,{type:"registered",message:"📝 Registration submitted! Admin will review soon.",volName:form.name});
      playSound("call");
      onRegistered(p);setDone(true);
    }catch(e){alert("Error: "+e.message);}
    setLoading(false);
  }
  function YN({value,onChange,error}){return<div style={{marginBottom:10}}>{[true,false].map(v=><button key={String(v)} style={S.chip(value,v)} onClick={()=>onChange(v)}>{v?(lang==="ta"?"ஆம்":"Yes"):(lang==="ta"?"இல்லை":"No")}</button>)}{error&&<p style={S.err}>{error}</p>}</div>;}
  if(done)return(
    <div style={{...S.screen,textAlign:"center"}}>
      <div style={{fontSize:60,marginBottom:14}}>✅</div>
      <p style={{color:C.gold,fontSize:20,fontWeight:800,marginBottom:8}}>Application Submitted!</p>
      <div style={{...S.card(),background:"#1a2d1a",border:`1px solid ${C.green}`,textAlign:"left",marginBottom:14}}>
        <p style={{color:"#86efac",fontWeight:700,margin:"0 0 4px"}}>✅ Saved to Supabase</p>
        <p style={{color:C.gray,fontSize:12,margin:0}}>Admin will approve your application. Check My Notifications for updates.</p>
      </div>
      <button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("myAlerts")}>🔔 View My Notifications</button>
      <button style={{...S.btn(C.navyLight,C.white)}} onClick={()=>setScreen("home")}>Back to Home</button>
    </div>
  );
  return(
    <div style={S.screen}>
      <div style={S.sHead}>📝 {lang==="ta"?"தன்னார்வலர் பதிவு":"Volunteer Registration"}</div>
      <div style={{...S.card(),background:"#1a2d1a",border:`1px solid ${C.green}`,marginBottom:12}}>
        <p style={{color:"#86efac",fontSize:12,margin:0}}>✅ Data saved permanently to Supabase. Admin approval required.</p>
      </div>
      {[["Full Name *","name","text","e.g. Karthik R"],["Roll Number (optional)","roll","text","e.g. 23CS101"],["Email *","email","email","yourname@psgcas.edu.in"],["Phone *","phone","tel","+91 9XXXXXXXXX"],["Department (optional)","department","text","e.g. Computer Science"],["Year of Study (optional)","year","text","e.g. 2nd Year"],["Occupation (optional)","occupation","text","Student / Doctor / Faculty / Staff"]].map(([l,k,t,p])=>(
        <div key={k}><span style={S.label}>{l}</span><input style={S.input} type={t} value={form[k]} onChange={e=>upd(k,e.target.value)} placeholder={p}/>{errs[k]&&<p style={S.err}>{errs[k]}</p>}</div>
      ))}
      <span style={S.label}>First Aid Training Completed?</span>
      <YN value={form.first_aid_trained} onChange={v=>upd("first_aid_trained",v)}/>
      <span style={S.label}>First Aid Certificate? *</span>
      <YN value={form.first_aid_certified} onChange={v=>upd("first_aid_certified",v)} error={errs.cert}/>
      <span style={S.label}>Training Details * (course, year, institute)</span>
      <input style={S.input} value={form.remarks} onChange={e=>upd("remarks",e.target.value)} placeholder="e.g. Red Cross Basic First Aid, 2024"/>
      {errs.remarks&&<p style={S.err}>{errs.remarks}</p>}
      <button style={S.btn(C.gold,C.navy)} onClick={submit} disabled={loading}>{loading?"Saving to Supabase...":"Submit Application"}</button>
      <button style={S.btn(C.navyLight,C.white)} onClick={()=>setScreen("home")}>Cancel</button>
    </div>
  );
}

// ─── MY ALERTS ───
function MyAlertsScreen({session,lang}){
  const email=session?.email;
  const[notifs,setNotifs]=useState(()=>email?getVolNotifs(email):[]);
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
      <div style={{...S.card(),textAlign:"center",padding:32}}><p style={{fontSize:32,margin:"0 0 10px"}}>🔒</p><p style={{color:C.gray,fontSize:13}}>Login to see notifications.</p></div>
    </div>
  );
  return(
    <div style={S.screen}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={S.sHead}>🔔 {lang==="ta"?"என் விழிப்பூட்டல்கள்":"My Notifications"}</div>
        {notifs.length>0&&<button style={S.btnSm(C.navyLight,C.gray)} onClick={clearAll}>Clear All</button>}
      </div>
      {unread>0&&<div style={{...S.card(C.gold),marginBottom:8,textAlign:"center"}}><p style={{color:C.gold,fontWeight:800,fontSize:13,margin:0}}>🔔 {unread} unread notification{unread>1?"s":""}</p></div>}
      <div style={{...S.card(),marginBottom:10,fontSize:11,display:"flex",gap:8,alignItems:"center"}}>
        <span style={{color:C.gold,fontWeight:700}}>📧 {email}</span>
        <span style={{color:C.gray}}>· refreshes every 3s</span>
      </div>
      {notifs.length===0&&<div style={{...S.card(),textAlign:"center",padding:28}}><p style={{fontSize:32,margin:"0 0 8px"}}>🔔</p><p style={{color:C.gray,fontSize:13}}>No notifications yet.</p></div>}
      {notifs.map(n=>(
        <div key={n.id} onClick={()=>markRead(n.id)} style={{...S.card(n.type==="sos"||n.type==="call"?C.red:n.type==="approved"?C.green:C.gold),background:n.read?C.navyMid:n.type==="sos"?"#2d0a0a":n.type==="approved"?"#052e16":"#1a1400",cursor:"pointer",marginBottom:8}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:20,flexShrink:0}}>{iconFor(n.type)}</span>
            <div style={{flex:1}}>
              {!n.read&&<span style={{fontSize:9,background:C.red,color:C.white,padding:"1px 6px",borderRadius:10,fontWeight:800,display:"inline-block",marginBottom:2}}>NEW</span>}
              <p style={{color:C.white,fontSize:13,margin:"2px 0",fontWeight:n.read?400:600}}>{n.message}</p>
              {n.userLoc&&<p style={{color:"#fbbf24",fontSize:10,margin:"0 0 2px",fontFamily:"monospace"}}>📍 {fmtCoord(n.userLoc.lat)}, {fmtCoord(n.userLoc.lng)}</p>}
              {n.userPhone&&<p style={{color:"#86efac",fontSize:11,margin:"0 0 2px",fontWeight:700}}>📞 Caller: {n.userPhone}</p>}
              <p style={{color:C.gray,fontSize:10,margin:0}}>{n.time}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN ALERTS ───
function AdminAlerts(){
  const[alerts,setAlerts]=useState([...gAlerts]);
  useEffect(()=>subAlerts(a=>setAlerts([...a])),[]);
  const icon=t=>({call:"📞",map:"🗺",sos:"🚨",approved:"✅",rejected:"❌",broadcast:"📢",registered:"📝"}[t]||"🔔");
  if(!alerts.length)return<div style={{...S.card(),textAlign:"center",padding:28}}><p style={{fontSize:28,margin:"0 0 8px"}}>🔔</p><p style={{color:C.gray,fontSize:13}}>No alerts yet.</p></div>;
  return(
    <div>
      {alerts.map(a=>(
        <div key={a.id} style={{...S.card(a.type==="sos"||a.type==="call"?C.red:C.gold),background:a.read?C.navyMid:a.type==="sos"?"#2d0a0a":"#1a1400",cursor:"pointer",marginBottom:8}} onClick={()=>setAlerts(p=>p.map(x=>x.id===a.id?{...x,read:true}:x))}>
          <div style={S.row}>
            <span style={{fontSize:20}}>{icon(a.type)}</span>
            <div style={{flex:1}}>
              {!a.read&&<span style={{fontSize:9,background:C.red,color:C.white,padding:"1px 6px",borderRadius:10,fontWeight:800}}>NEW</span>}
              <p style={{color:C.white,fontSize:12,margin:"3px 0"}}>{a.message}</p>
              {a.userPhone&&<p style={{color:"#86efac",fontSize:11,margin:"0 0 2px",fontWeight:700}}>📞 User: {a.userPhone}</p>}
              {a.userLoc&&<p style={{color:"#fbbf24",fontSize:10,margin:"0 0 2px",fontFamily:"monospace"}}>📍 {fmtCoord(a.userLoc.lat)}, {fmtCoord(a.userLoc.lng)}</p>}
              <p style={{color:C.gray,fontSize:10,margin:0}}>{a.volName} · {a.time}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN ───
function AdminScreen({volunteers,setVolunteers,sosToday,lang}){
  const[tab,setTab]=useState("alerts");const[pin,setPin]=useState("");const[unlocked,setUnlocked]=useState(false);
  const[badge,setBadge]=useState(0);const[bcast,setBcast]=useState("");const[busy,setBusy]=useState(false);
  useEffect(()=>subAlerts(a=>setBadge(a.filter(x=>!x.read).length)),[]);
  if(!unlocked)return(
    <div style={S.screen}>
      <div style={S.sHead}>🔐 Admin Access</div>
      <div style={{...S.card(),textAlign:"center",padding:28}}>
        <p style={{color:C.gray,fontSize:13,marginBottom:14}}>Enter admin code to unlock</p>
        <input style={{...S.input,textAlign:"center",letterSpacing:2}} type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Admin code" onKeyDown={e=>e.key==="Enter"&&(pin===ADMIN_PIN?setUnlocked(true):alert("Invalid code."))}/>
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
      if(vol.email)pushVolNotif(vol.email,{type:"approved",message:"✅ Your application has been approved! You are now live as a volunteer.",volName:vol.name});
      playSound("call");
    }catch(e){alert(e.message);}
    setBusy(false);
  }
  async function reject(vol){
    if(!window.confirm(`Reject ${vol.name}?`))return;setBusy(true);
    try{
      await db.deleteVolunteer(vol.id);
      setVolunteers(p=>p.filter(v=>v.id!==vol.id));
      if(vol.email)pushVolNotif(vol.email,{type:"rejected",message:"❌ Your application was not approved this time.",volName:vol.name});
      sendAlert(vol,"rejected");
    }catch(e){alert(e.message);}
    setBusy(false);
  }
  async function remove(vol){
    if(!window.confirm(`Remove ${vol.name} permanently?`))return;setBusy(true);
    try{await db.deleteVolunteer(vol.id);setVolunteers(p=>p.filter(v=>v.id!==vol.id));}
    catch(e){alert(e.message);}
    setBusy(false);
  }
  function broadcast(){
    if(!bcast.trim())return;
    approved.forEach(v=>{sendAlert(v,"broadcast",{message:bcast});if(v.email)pushVolNotif(v.email,{type:"broadcast",message:`📢 Admin: ${bcast}`,volName:v.name});});
    playSound("sos");setBcast("");alert(`Broadcast sent to ${approved.length} volunteer(s).`);
  }
  const tabs=[
    {k:"alerts",l:`🔔 Alerts${badge>0?` (${badge})`:""}`},
    {k:"pending",l:`⏳ Pending (${pending.length})`},
    {k:"approved",l:`✅ Approved (${approved.length})`},
    {k:"contacts",l:"📞 Contacts"},
    {k:"guide",l:"🩺 Guide"},
    {k:"broadcast",l:"📢 Broadcast"},
  ];
  return(
    <div style={S.screen}>
      <div style={S.sHead}>🛡 Admin Dashboard</div>
      {busy&&<div style={{...S.card(),background:"#1a1400",border:`1px solid ${C.gold}`,marginBottom:10,textAlign:"center"}}><p style={{color:C.gold,fontSize:12,margin:0}}>⏳ Saving to Supabase...</p></div>}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {tabs.map(({k,l})=><button key={k} style={{...S.btnSm(tab===k?C.gold:C.navyLight,tab===k?C.navy:C.white),border:`1px solid ${tab===k?C.gold:C.navyLight}`,marginBottom:4}} onClick={()=>setTab(k)}>{l}</button>)}
      </div>
      {tab==="alerts"&&<AdminAlerts/>}
      {tab==="contacts"&&<ContactsScreen canEdit setScreen={()=>{}}/>}
      {tab==="guide"&&<GuideScreen setScreen={()=>{}} lang={lang} canEdit/>}
      {tab==="broadcast"&&(
        <div style={S.card()}>
          <span style={S.label}>Broadcast Message</span>
          <textarea style={{...S.input,minHeight:80,resize:"vertical",fontFamily:"inherit"}} value={bcast} onChange={e=>setBcast(e.target.value)} placeholder="e.g. Campus emergency drill at 3 PM today."/>
          <button style={S.btn(C.gold,C.navy)} onClick={broadcast}>📢 Send to All Approved Volunteers</button>
        </div>
      )}
      {(tab==="pending"||tab==="approved")&&(
        <>
          {(tab==="pending"?pending:approved).length===0&&<div style={{...S.card(),textAlign:"center",padding:28}}><p style={{color:C.gray,fontSize:13}}>No {tab} volunteers.</p></div>}
          {(tab==="pending"?pending:approved).map(vol=>(
            <div key={vol.id} style={S.card()}>
              <div style={{...S.row,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:vol.approved?C.gold:C.gray,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:C.navy,flexShrink:0}}>{vol.name?.charAt(0)}</div>
                <div style={{flex:1}}><p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:0}}>{vol.department||vol.occupation||"—"}{vol.year?` · ${vol.year}`:""}</p></div>
                {vol.approved&&<span style={S.badge(vol.online)}>{vol.online?"Online":"Offline"}</span>}
              </div>
              <div style={{fontSize:11,color:C.gray,marginBottom:8,lineHeight:1.8}}>
                {vol.roll&&<p style={{margin:0}}>🎓 {vol.roll}</p>}
                <p style={{margin:0}}>📧 {vol.email}</p>
                <p style={{margin:0}}>📞 {vol.phone}</p>
                <p style={{margin:0}}>🏅 Certified: {vol.first_aid_certified?"Yes ✅":"No ❌"}</p>
                {vol.remarks&&<p style={{margin:0}}>📋 {vol.remarks}</p>}
                {vol.lat&&<p style={{margin:0,fontFamily:"monospace",fontSize:10}}>📍 {fmtCoord(vol.lat)}, {fmtCoord(vol.lng)}</p>}
              </div>
              <div style={{display:"flex",gap:8}}>
                {!vol.approved&&<button style={{...S.btnSm(C.green,C.white),flex:1,padding:"10px"}} onClick={()=>approve(vol)} disabled={busy}>✓ Approve</button>}
                <button style={{...S.btnSm(C.red,C.white),flex:1,padding:"10px"}} onClick={()=>vol.approved?remove(vol):reject(vol)} disabled={busy}>{vol.approved?"🗑 Remove":"✗ Reject"}</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── ROOT APP ───
export default function App(){
  const[lang,setLang]=useState(()=>{try{return localStorage.getItem("aga_lang")||"ta";}catch{return"ta";}});
  const toggleLang=()=>{const n=lang==="ta"?"en":"ta";setLang(n);try{localStorage.setItem("aga_lang",n);}catch{}};
  const[step,setStep]=useState("location");
  const[screen,setScreen]=useState("home");
  const[userLoc,setUserLoc]=useState(null);
  const[userPhone,setUserPhone]=useState(()=>loadUserPhone());
  const[selectedVol,setSelectedVol]=useState(null);
  const[toast,setToast]=useState(null);
  const[badge,setBadge]=useState(0);
  const[session,setSession]=useState(loadSession);
  const[volunteers,setVolunteers]=useState([]);
  const[sosToday,setSosToday]=useState(0);
  const volIdRef=useRef(null);

  const refreshVols=useCallback(()=>{db.getVolunteers().then(d=>setVolunteers(d)).catch(()=>{});},[]);

  useEffect(()=>{if(step==="app"){refreshVols();const t=setInterval(refreshVols,30000);return()=>clearInterval(t);}},[step,refreshVols]);

  // Live user GPS
  useEffect(()=>{
    if(step!=="app"||!navigator.geolocation)return;
    const id=navigator.geolocation.watchPosition(p=>setUserLoc({lat:p.coords.latitude,lng:p.coords.longitude}),null,{enableHighAccuracy:true,maximumAge:30000});
    return()=>navigator.geolocation.clearWatch(id);
  },[step]);

  // Approved volunteer GPS → Supabase every 30s
  useEffect(()=>{
    if(!session?.email||step!=="app"||!navigator.geolocation)return;
    const vol=volunteers.find(v=>v.email===session.email&&v.approved);
    if(!vol)return;
    volIdRef.current=vol.id;
    const wid=navigator.geolocation.watchPosition(
      pos=>{
        const lat=pos.coords.latitude,lng=pos.coords.longitude;
        db.updateVolunteer(volIdRef.current,{lat,lng,online:true,loc_updated_at:new Date().toISOString()}).catch(()=>{});
        setVolunteers(p=>p.map(x=>x.id===volIdRef.current?{...x,lat,lng,loc_updated_at:new Date().toISOString()}:x));
      },
      null,{enableHighAccuracy:true,maximumAge:30000}
    );
    return()=>navigator.geolocation.clearWatch(wid);
  },[session?.email,volunteers.length,step]);

  useEffect(()=>subAlerts(alerts=>{
    setBadge(alerts.filter(a=>!a.read).length);
    const l=alerts[0];
    if(l){setToast(l);setTimeout(()=>setToast(null),4500);}
  }),[]);

  function onLocation(loc){setUserLoc(loc);if(userPhone){setStep("app");}else{setStep("phone");}}
  function onPhone(phone){setUserPhone(phone);saveUserPhone(phone);setStep("app");}

  function triggerSOS(){
    const nearby=volunteers.filter(v=>v.approved&&v.online&&v.availability).map(v=>({...v,distance:userLoc&&v.lat?haversine(userLoc.lat,userLoc.lng,parseFloat(v.lat),parseFloat(v.lng)):9999})).filter(v=>v.distance<=CAMPUS_RADIUS_KM*1000).sort((a,b)=>a.distance-b.distance);
    if(!nearby.length){alert("No volunteers nearby. Please call Emergency Contacts directly.");setScreen("contacts");return;}
    nearby.forEach(v=>{
      sendAlert(v,"sos",{userLoc,userPhone});
      if(v.email)pushVolNotif(v.email,{type:"sos",message:`🚨 SOS nearby! Caller: ${userPhone} · Location: ${fmtCoord(userLoc?.lat)}, ${fmtCoord(userLoc?.lng)}`,volName:v.name,userLoc,userPhone});
    });
    playSound("sos");setSosToday(c=>c+1);
    alert(`🚨 SOS sent to ${nearby.length} volunteer(s)!\nYour phone number (${userPhone}) has been shared with them.`);
  }

  // ─── GATES ───
  if(step==="location")return<LocationGate onEnable={onLocation} lang={lang} onToggle={toggleLang}/>;
  if(step==="phone")return(
    <div style={{...S.app,display:"flex",flexDirection:"column"}}>
      <Header lang={lang} onToggle={toggleLang}/>
      <PhoneGate onSave={onPhone} lang={lang}/>
    </div>
  );

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
    login:<LoginScreen onLoggedIn={p=>{setSession(p);setScreen(p.registered?"profile":"register");}} setScreen={setScreen}/>,
    profile:<ProfileScreen session={session} setScreen={setScreen} volunteers={volunteers} setVolunteers={setVolunteers} onSessionUpdate={setSession} lang={lang}/>,
    register:session?<RegisterScreen setScreen={setScreen} session={session} onRegistered={p=>{setSession(p);refreshVols();}} userLoc={userLoc} lang={lang}/>:<LoginScreen onLoggedIn={p=>{setSession(p);setScreen("register");}} setScreen={setScreen}/>,
    admin:<AdminScreen volunteers={volunteers} setVolunteers={setVolunteers} sosToday={sosToday} lang={lang}/>,
  };

  return(
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');@keyframes sd{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}input::placeholder,textarea::placeholder{color:#475569;}input:focus,textarea:focus{border-color:#D4A017!important;box-shadow:0 0 0 2px rgba(212,160,23,0.15);}button:active{transform:scale(0.97);}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1A3058;border-radius:4px}`}</style>
      {toast&&(
        <div style={{position:"fixed",top:85,left:"50%",transform:"translateX(-50%)",zIndex:999,width:"90%",maxWidth:390,background:(toast.type==="call"||toast.type==="sos")?"#7f1d1d":"#1a1400",border:`2px solid ${(toast.type==="call"||toast.type==="sos")?C.red:C.gold}`,borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,animation:"sd 0.3s ease",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
          <span style={{fontSize:20}}>{toast.type==="sos"?"🆘":toast.type==="call"?"🚨":toast.type==="approved"?"✅":toast.type==="registered"?"📝":"📢"}</span>
          <div style={{flex:1}}><p style={{fontWeight:800,fontSize:10,color:C.gold,margin:"0 0 2px",textTransform:"uppercase"}}>Alert</p><p style={{color:C.white,fontSize:12,margin:0}}>{toast.message}</p></div>
          <button onClick={()=>setToast(null)} style={{background:"none",border:"none",color:C.gray,fontSize:16,cursor:"pointer",padding:0}}>✕</button>
        </div>
      )}
      <Header lang={lang} onToggle={toggleLang}/>
      <LocationBanner userLoc={userLoc} lang={lang}/>
      <div>{screens[screen]||screens.home}</div>
      <nav style={S.navBar}>
        {navItems.map(n=>(
          <button key={n.id} style={S.navBtn(screen===n.id||(screen==="map"&&n.id==="volunteers"))} onClick={()=>setScreen(n.id)}>
            <span style={{fontSize:19,position:"relative",display:"inline-block"}}>
              {n.icon}
              {n.badge>0&&<span style={{position:"absolute",top:-3,right:-5,background:C.red,color:C.white,borderRadius:"50%",fontSize:8,fontWeight:800,width:12,height:12,display:"flex",alignItems:"center",justifyContent:"center"}}>{n.badge}</span>}
            </span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}