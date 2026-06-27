import { useState, useEffect, useRef, useCallback } from "react";
import React, { useState, useEffect, useRef, useCallback } from "react";

const SUPABASE_URL = "https://qyoektirhvroaarnzazy.supabase.co";
const SUPABASE_KEY = "sb_publishable_3LBPKOMdfUMeEkguQO98ug_7jcYg9ct";
@@ -25,40 +25,19 @@ const db = {
deleteVolunteer: (id) => sbFetch(`/volunteers?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" }),
};

const FIRST_AID_EN = [
  { id:"bls", icon:"🫀", title:"Basic Life Support (BLS)", steps:["Ensure scene safety — fire, electricity, traffic.","Tap shoulders firmly: 'Are you okay?'","Call 108 immediately.","Head Tilt–Chin Lift. Check breathing 10 sec.","Breathing → Recovery Position. Not breathing → CPR."] },
  { id:"recovery", icon:"🛌", title:"Recovery Position", steps:["Kneel beside victim.","Place nearest arm at right angle.","Bring far arm across chest.","Bend far knee upward.","Roll onto side carefully.","Tilt head back to keep airway open.","Monitor until help arrives."] },
const FIRST_AID = [
  { id:"bls", icon:"🫀", title:"Basic Life Support", steps:["Ensure scene safety.","Tap shoulders: 'Are you okay?'","Call 108 immediately.","Head Tilt–Chin Lift. Check breathing 10 sec.","Breathing → Recovery Position. Not breathing → CPR."] },
{ id:"cpr", icon:"❤️", title:"CPR", steps:["Heel of hand on center of chest.","Second hand on top, interlock fingers.","30 compressions, 5cm deep, 100–120/min.","2 rescue breaths — pinch nose, cover mouth.","Repeat 30:2 until help arrives."] },
{ id:"choking", icon:"😮", title:"Choking", steps:["Encourage forceful coughing.","5 sharp back blows between shoulder blades.","5 abdominal thrusts inward and upward.","Continue alternating.","If unconscious → CPR immediately."] },
  { id:"fracture", icon:"🦴", title:"Fractures", steps:["Keep injured area completely still.","Do NOT straighten the bone.","Apply ice wrapped in cloth — 20 min on/off.","Support with splint beyond joints.","Seek medical help immediately."] },
  { id:"fracture", icon:"🦴", title:"Fractures", steps:["Keep injured area still.","Do NOT straighten the bone.","Apply ice wrapped in cloth — 20 min on/off.","Support with splint beyond joints.","Seek medical help immediately."] },
{ id:"bleeding", icon:"🩸", title:"Severe Bleeding", steps:["Wear gloves if available.","Apply direct pressure with clean cloth.","Elevate injured part above heart.","Tourniquet 5–7 cm above wound if life-threatening.","Call 108 if severe."] },
  { id:"drowning", icon:"🌊", title:"Drowning", steps:["Remove victim from water safely.","Call 108 immediately.","Breathing → Recovery Position.","Not breathing → CPR.","Continue until help arrives."] },
{ id:"burns", icon:"🔥", title:"Burns", steps:["Remove from heat source immediately.","Cool with running water 20 min — NOT ice.","Remove tight jewelry carefully.","Cover loosely with sterile dressing.","Do NOT apply butter or oil."] },
{ id:"seizure", icon:"⚡", title:"Seizures", steps:["Stay calm. Move dangerous objects away.","Cushion the head.","Loosen tight clothing around neck.","Do NOT restrain or put anything in mouth.","Call 108 if seizure lasts more than 5 minutes."] },
  { id:"heartattack", icon:"💔", title:"Heart Attack", steps:["Call 108 immediately.","Help person sit comfortably.","Loosen tight clothing around neck and chest.","No food or drinks.","If unconscious and not breathing → CPR."] },
  { id:"shock", icon:"😰", title:"Shock", steps:["Lay person flat on back.","Elevate legs 30 cm.","Keep warm — do not overheat.","No food or drink.","Check breathing every 2 minutes."] },
  { id:"heartattack", icon:"💔", title:"Heart Attack", steps:["Call 108 immediately.","Help person sit comfortably.","Loosen tight clothing.","No food or drinks.","If unconscious and not breathing → CPR."] },
{ id:"snakebite", icon:"🐍", title:"Snake Bite", steps:["Keep victim calm and still.","Wash bite gently with clean water.","Keep bitten limb BELOW heart level.","Remove rings near bite.","Call 108 — do NOT cut, suck or tourniquet."] },
  { id:"dogbite", icon:"🐕", title:"Dog Bite", steps:["Wash wound with running water several minutes.","Clean with soap.","Cover with sterile dressing.","Visit hospital immediately — rabies risk.","Check vaccination status."] },
{ id:"fire", icon:"🚒", title:"Fire Emergency", steps:["Activate fire alarm immediately.","Use stairs NOT elevator.","Crawl below smoke level.","Cover nose and mouth with wet cloth.","Move to assembly point. STOP–DROP–ROLL if on fire."] },
];

const FIRST_AID_TA = [
  { id:"bls", icon:"🫀", title:"அடிப்படை உயிர் ஆதரவு (BLS)", steps:["காட்சி பாதுகாப்பை உறுதி செய்யவும்.","தோள்களை தட்டி கேளுங்கள்: 'உங்களுக்கு சரியாக உள்ளதா?'","108 உடனே அழைக்கவும்.","Head Tilt–Chin Lift. சுவாசத்தை 10 விநாடி சரிபார்க்கவும்.","சுவாசம் → Recovery Position. இல்லை → CPR."] },
  { id:"recovery", icon:"🛌", title:"Recovery Position", steps:["பக்கவாட்டில் கவனமாக திருப்பவும்.","அருகில் உள்ள கையை நேராக வையுங்கள்.","தூரமுள்ள கையை மார்பில் வையுங்கள்.","தூரமுள்ள முழங்காலை மேல்நோக்கி வளைக்கவும்.","உதவி வரும் வரை சுவாசத்தை கண்காணிக்கவும்."] },
  { id:"cpr", icon:"❤️", title:"CPR (இதய புத்துயிர்ப்பு)", steps:["மார்பின் மையத்தில் கைகளை வையுங்கள்.","30 அழுத்தங்கள் — 5 செ.மீ ஆழம், 100–120/நிமிடம்.","2 மூச்சுகள் — மூக்கை பிடிக்கவும், வாயை மூடவும்.","30:2 விகிதம் — உதவி வரும் வரை தொடரவும்."] },
  { id:"choking", icon:"😮", title:"தொண்டை அடைப்பு", steps:["வலுவான இருமலை ஊக்குவிக்கவும்.","தோள் இடையில் 5 உறுதியான அடிகள்.","வயிற்றுக்கு மேலே முஷ்டி, 5 முறை இழுக்கவும்.","மயக்கமடைந்தால் → CPR உடனே."] },
  { id:"fracture", icon:"🦴", title:"எலும்பு முறிவு", steps:["காயமடைந்த இடத்தை அசைக்காதீர்கள்.","எலும்பை நேராக்க முயற்சிக்காதீர்கள்.","துணியில் சுற்றிய ice pack — 20 நிமிடம்.","Splint கொடுங்கள்.","உடனே மருத்துவ உதவி நாடவும்."] },
  { id:"bleeding", icon:"🩸", title:"கடுமையான இரத்தப்போக்கு", steps:["கையுறை இருந்தால் அணியவும்.","சுத்தமான துணியால் நேரடி அழுத்தம்.","காயமடைந்த உறுப்பை இதயத்திற்கு மேலே உயர்த்தவும்.","108 அழைக்கவும்."] },
  { id:"drowning", icon:"🌊", title:"நீரில் மூழ்குதல்", steps:["நபரை நீரிலிருந்து வெளியேற்றவும்.","108 உடனே அழைக்கவும்.","சுவாசம் → Recovery Position.","சுவாசம் இல்லை → CPR உடனே."] },
  { id:"burns", icon:"🔥", title:"தீக்காயங்கள்", steps:["வெப்ப மூலத்திலிருந்து உடனே விலகவும்.","குளிர்ந்த ஓடும் தண்ணீரில் 20 நிமிடம் — ice வேண்டாம்.","மலட்டு கட்டு தளர்வாக போடவும்.","வெண்ணெய், எண்ணெய் தடவாதீர்கள்."] },
  { id:"seizure", icon:"⚡", title:"வலிப்பு (Seizures)", steps:["அமைதியாக இருங்கள். பொருட்களை விலக்கவும்.","தலைக்கு மென்மையான ஏதாவது கொடுங்கள்.","கழுத்தைச் சுற்றிய ஆடையை தளர்த்தவும்.","5 நிமிடம் தாண்டினால் 108 அழைக்கவும்."] },
  { id:"heartattack", icon:"💔", title:"மாரடைப்பு", steps:["108 உடனே அழைக்கவும்.","நபரை வசதியாக உட்கார வையுங்கள்.","ஆடையை தளர்த்தவும்.","மயக்கமடைந்தால் → CPR."] },
  { id:"shock", icon:"😰", title:"அதிர்ச்சி நிலை", steps:["நபரை மல்லாந்து படுக்க வையுங்கள்.","கால்களை 30 செ.மீ உயர்த்தவும்.","கம்பளியால் மூடவும்.","உணவு கொடுக்காதீர்கள்."] },
  { id:"snakebite", icon:"🐍", title:"பாம்பு கடி", steps:["நபரை அமைதியாக வையுங்கள்.","கடிக்கப்பட்ட இடத்தை கழுவுங்கள்.","உறுப்பை இதயத்திற்கு கீழே வையுங்கள்.","108 அழைத்து உடனே மருத்துவமனை செல்லவும்."] },
  { id:"dogbite", icon:"🐕", title:"நாய் கடி", steps:["ஓடும் தண்ணீரில் காயத்தை கழுவுங்கள்.","சோப்பால் சுத்தம் செய்யுங்கள்.","உடனே மருத்துவமனை செல்லவும்."] },
  { id:"fire", icon:"🚒", title:"தீ அவசரநிலை", steps:["தீ அலாரத்தை உடனே இயக்கவும்.","படிக்கட்டு பயன்படுத்தவும் — லிஃப்ட் வேண்டாம்.","புகை இருந்தால் தரையில் நடந்து செல்லவும்.","பாதுகாப்பு சந்திப்பு இடத்திற்கு நகரவும்."] },
];

const DEFAULT_CONTACTS = [
{ key:"ambulance", icon:"🚑", label:"Ambulance", number:"108", desc:"National Emergency" },
{ key:"hospital", icon:"🏥", label:"Hospital", number:"+914222572180", desc:"Nearest Govt. Hospital" },
@@ -72,7 +51,6 @@ const CAMPUS_LANDMARKS = [
{ name:"Main Gate", lat:11.0348, lng:77.0350, icon:"🏛️" },
{ name:"Library", lat:11.0342, lng:77.0358, icon:"📚" },
{ name:"Canteen", lat:11.0350, lng:77.0362, icon:"🍽️" },
  { name:"Parking", lat:11.0338, lng:77.0348, icon:"🅿️" },
{ name:"Assembly Point", lat:11.0352, lng:77.0370, icon:"📢" },
{ name:"Medical Room", lat:11.0355, lng:77.0375, icon:"⚕️" },
];
@@ -96,20 +74,35 @@ function playSound(type){
let gAlerts=[], aListeners=[];
function subAlerts(fn){aListeners.push(fn);return()=>{aListeners=aListeners.filter(l=>l!==fn);};}
function pushGAlert(a){gAlerts=[a,...gAlerts].slice(0,80);aListeners.forEach(fn=>fn([...gAlerts]));}

const volNotifStore={};
function getVolNotifs(email){return volNotifStore[email]||[];}
function saveVolNotifs(email,n){volNotifStore[email]=n.slice(0,50);}
function pushVolNotif(email,notif){if(!email)return;saveVolNotifs(email,[{...notif,id:Date.now()+Math.random(),time:new Date().toLocaleTimeString(),read:false},...getVolNotifs(email)]);}

function sendAlert(vol,type,extra={}){
const msgs={call:"📞 Someone is calling you!",map:"🗺 Someone is viewing your location!",sos:"🚨 SOS ALERT nearby!",approved:"✅ Application approved!",rejected:"❌ Application not approved.",broadcast:extra.message||"📢 Admin broadcast.",registered:"📝 Registration submitted!"};
const notif={id:Date.now()+Math.random(),volId:vol?.id,volName:vol?.name||"All",type,message:msgs[type]||"Alert",time:new Date().toLocaleTimeString(),read:false,userLoc:extra.userLoc||null,userPhone:extra.userPhone||null};
pushGAlert(notif);
if(vol?.email)pushVolNotif(vol.email,notif);
}

const guideStore={data:[...FIRST_AID]};
const contactsStore={data:[...DEFAULT_CONTACTS]};

const C={navy:"#0A1628",navyMid:"#122040",navyLight:"#1A3058",gold:"#D4A017",red:"#C0392B",white:"#FFFFFF",gray:"#94A3B8",green:"#16A34A",blue:"#3B82F6"};

const css=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
body{background:#0A1628;}
input::placeholder,textarea::placeholder{color:#475569;}
input:focus,textarea:focus{outline:none;border-color:#D4A017!important;}
button:active{transform:scale(0.97);}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:#1A3058;border-radius:4px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}
`;

const S={
app:{fontFamily:"'Inter',system-ui,sans-serif",background:C.navy,minHeight:"100vh",color:C.white,maxWidth:430,margin:"0 auto",position:"relative",overflowX:"hidden"},
screen:{padding:"16px 14px",paddingBottom:95},
@@ -118,29 +111,16 @@ const S={
card:(border)=>({background:C.navyMid,border:`1px solid ${border||C.navyLight}`,borderRadius:12,padding:"14px 15px",marginBottom:10}),
label:{fontSize:11,color:C.gold,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4,marginTop:8,display:"block"},
input:{width:"100%",background:C.navyLight,border:`1px solid ${C.navyLight}`,borderRadius:8,padding:"10px 12px",color:C.white,fontSize:14,marginBottom:10,boxSizing:"border-box",outline:"none",fontFamily:"inherit"},
  badge:ok=>({fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:ok?"#14532d":"#7f1d1d",color:ok?"#86efac":"#fca5a5"}),
  badge:(ok)=>({fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:ok?"#14532d":"#7f1d1d",color:ok?"#86efac":"#fca5a5"}),
navBar:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.navyMid,borderTop:`2px solid ${C.gold}`,display:"flex",zIndex:200},
  navBtn:a=>({flex:1,padding:"9px 2px 7px",background:"none",border:"none",color:a?C.gold:C.gray,fontSize:8,fontWeight:700,cursor:"pointer",textTransform:"uppercase",display:"flex",flexDirection:"column",alignItems:"center",gap:2}),
  navBtn:(a)=>({flex:1,padding:"9px 2px 7px",background:"none",border:"none",color:a?C.gold:C.gray,fontSize:8,fontWeight:700,cursor:"pointer",textTransform:"uppercase",display:"flex",flexDirection:"column",alignItems:"center",gap:2}),
sHead:{fontSize:12,fontWeight:800,color:C.gold,textTransform:"uppercase",letterSpacing:1,marginBottom:12},
chip:(s,v)=>({padding:"6px 12px",borderRadius:20,border:`1px solid ${s===v?C.gold:C.navyLight}`,background:s===v?C.gold:C.navyLight,color:s===v?C.navy:C.gray,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:6,marginBottom:6}),
statBox:{background:C.navyMid,border:`1px solid ${C.navyLight}`,borderRadius:12,padding:"12px 8px",textAlign:"center"},
row:{display:"flex",gap:8,alignItems:"center"},
err:{color:"#fca5a5",fontSize:11,marginTop:-6,marginBottom:8},
};

const globalCSS=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
body{background:#0A1628;}
input::placeholder,textarea::placeholder{color:#475569;}
input:focus,textarea:focus{outline:none;border-color:#D4A017!important;box-shadow:0 0 0 2px rgba(212,160,23,0.18);}
button:active{transform:scale(0.97)!important;}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:#1A3058;border-radius:4px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}
`;

function Header({lang,onToggle}){
return(
<div style={{background:C.navyMid,borderBottom:`2px solid ${C.gold}`,padding:"8px 12px"}}>
@@ -154,52 +134,52 @@ function Header({lang,onToggle}){
<div style={{flex:1,textAlign:"center"}}>
<p style={{fontSize:14,fontWeight:900,color:C.white,margin:0,lineHeight:1.3}}>AGA {lang==="ta"?"அவசர சேவை":"EMERGENCY RESPONSE"}</p>
<p style={{fontSize:9,color:C.gold,fontWeight:700,margin:"2px 0 1px",letterSpacing:0.5,textTransform:"uppercase"}}>Alert Golden Army · PSGCAS Chapter</p>
          <p style={{fontSize:8,color:C.gray,margin:0}}>PSG {lang==="ta"?"கலை மற்றும் அறிவியல் கல்லூரி":"College of Arts & Science"}, Coimbatore</p>
          <p style={{fontSize:8,color:C.gray,margin:0}}>PSG College of Arts & Science, Coimbatore</p>
</div>
<img src={PSG_LOGO} alt="PSG CAS" style={{width:46,height:52,objectFit:"contain",flexShrink:0}} onError={e=>{e.target.style.display="none";}}/>
</div>
</div>
);
}

function LocationBanner({userLoc,lang}){
  if(!userLoc) return null;
function LocationBanner({userLoc}){
  if(!userLoc)return null;
return(
<div style={{background:"#0d1f35",borderBottom:`1px solid ${C.navyLight}`,padding:"5px 14px",display:"flex",alignItems:"center",gap:8}}>
<span style={{fontSize:12}}>📍</span>
      <span style={{fontSize:10,color:C.gold,fontWeight:800}}>{lang==="ta"?"இருப்பிடம்":"LOCATION"}: </span>
      <span style={{fontSize:10,color:C.gold,fontWeight:800}}>LOCATION: </span>
<span style={{fontSize:10,color:C.white,fontFamily:"monospace",flex:1}}>{fmtCoord(userLoc.lat)}, {fmtCoord(userLoc.lng)}</span>
<div style={{width:7,height:7,borderRadius:"50%",background:C.green,animation:"blink 2s infinite"}}/>
</div>
);
}

function PhoneGate({onSave,lang,savedName,savedPhone}){
  const[name,setName]=useState(savedName||"");
  const[phone,setPhone]=useState(savedPhone||"");
function PhoneGate({onSave,lang}){
  const[name,setName]=useState("");
  const[phone,setPhone]=useState("");
const[errs,setErrs]=useState({});
function save(){
const e={};
    if(!name.trim()) e.name=lang==="ta"?"பெயர் தேவை":"Name is required";
    if(phone.trim().length<7) e.phone=lang==="ta"?"சரியான எண் தேவை":"Please enter a valid phone number";
    if(!name.trim())e.name="Name is required";
    if(phone.trim().length<7)e.phone="Please enter a valid phone number";
if(Object.keys(e).length){setErrs(e);return;}
onSave(name.trim(),phone.trim());
}
return(
<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
<div style={{width:"100%",maxWidth:380,textAlign:"center"}}>
<div style={{fontSize:48,marginBottom:16}}>📱</div>
        <p style={{fontSize:18,fontWeight:800,color:C.gold,marginBottom:8}}>{lang==="ta"?"உங்கள் விவரங்கள்":"Your Details"}</p>
        <p style={{fontSize:18,fontWeight:800,color:C.gold,marginBottom:8}}>Your Details</p>
<div style={{...S.card(C.gold),textAlign:"left",marginBottom:16}}>
          <p style={{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}}>{lang==="ta"?"உங்கள் பெயர் மற்றும் தொலைபேசி எண் தன்னார்வலர்களுக்கு அனுப்பப்படும்.":"Your name and phone number will be shared with nearby volunteers in an emergency."}</p>
          <p style={{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}}>Your name and phone number will be shared with nearby volunteers in an emergency.</p>
</div>
        <span style={S.label}>{lang==="ta"?"முழு பெயர் *":"Full Name *"}</span>
        <input style={S.input} type="text" placeholder={lang==="ta"?"உங்கள் பெயர்":"Your full name"} value={name} onChange={e=>{setName(e.target.value);setErrs(p=>({...p,name:null}));}}/>
        <span style={S.label}>Full Name *</span>
        <input style={S.input} type="text" placeholder="Your full name" value={name} onChange={e=>{setName(e.target.value);setErrs(p=>({...p,name:null}));}}/>
{errs.name&&<p style={S.err}>{errs.name}</p>}
        <span style={S.label}>{lang==="ta"?"தொலைபேசி எண் *":"Phone Number *"}</span>
        <span style={S.label}>Phone Number *</span>
<input style={S.input} type="tel" placeholder="+91 9XXXXXXXXX" value={phone} onChange={e=>{setPhone(e.target.value);setErrs(p=>({...p,phone:null}));}}/>
{errs.phone&&<p style={S.err}>{errs.phone}</p>}
        <button style={S.btn(C.gold,C.navy)} onClick={save}>{lang==="ta"?"சேமித்து தொடரவும்":"Save & Continue →"}</button>
        <button style={S.btn(C.gold,C.navy)} onClick={save}>Save & Continue →</button>
</div>
</div>
);
@@ -224,11 +204,11 @@ function LocationGate({onEnable,lang,onToggle}){
<div style={{fontSize:52,marginBottom:20}}>🚨</div>
<div style={{background:"#7f1d1d",border:`1px solid ${C.red}`,borderRadius:14,padding:20,marginBottom:16}}>
<div style={{fontSize:36,marginBottom:10}}>📍</div>
            <p style={{color:"#fecaca",fontWeight:700,fontSize:15,margin:"0 0 6px"}}>{lang==="ta"?"இருப்பிட அனுமதி தேவை":"Location Access Required"}</p>
            <p style={{color:"#fca5a5",fontSize:13,margin:0,lineHeight:1.5}}>{lang==="ta"?"AGA அவசர சேவைக்கு உங்கள் இருப்பிடம் தேவை.":"Your location is needed for emergency services."}</p>
            <p style={{color:"#fecaca",fontWeight:700,fontSize:15,margin:"0 0 6px"}}>Location Access Required</p>
            <p style={{color:"#fca5a5",fontSize:13,margin:0,lineHeight:1.5}}>Your location is needed for emergency services.</p>
</div>
{err&&<p style={{color:"#fbbf24",fontSize:12,marginBottom:12}}>Location denied — using campus center as fallback.</p>}
          <button style={S.btn(C.gold,C.navy)} onClick={tryEnable}>📍 {lang==="ta"?"இருப்பிடத்தை இயக்கு":"Enable Location"}</button>
          <button style={S.btn(C.gold,C.navy)} onClick={tryEnable}>📍 Enable Location</button>
</div>
</div>
</div>
@@ -239,17 +219,17 @@ function HomeScreen({userLoc,setScreen,lang,onSOS,volunteers,sosToday}){
const approved=volunteers.filter(v=>v.approved);
const active=approved.filter(v=>v.online&&v.availability).length;
const tiles=[
    {icon:"🆘",label:lang==="ta"?"அருகிலுள்ள தன்னார்வலர்கள்":"Find Nearby Volunteers",to:"volunteers"},
    {icon:"📞",label:lang==="ta"?"அவசர தொடர்புகள்":"Emergency Contacts",to:"contacts"},
    {icon:"🗺️",label:lang==="ta"?"வளாக வரைபடம்":"Campus Map",to:"campusMap"},
    {icon:"🩺",label:lang==="ta"?"முதலுதவி வழிகாட்டி":"First Aid Guide",to:"guide"},
    {icon:"👤",label:lang==="ta"?"என் சுயவிவரம்":"My Profile",to:"profile"},
    {icon:"📝",label:lang==="ta"?"தன்னார்வலராக பதிவு":"Register as Volunteer",to:"login"},
    {icon:"🆘",label:"Find Nearby Volunteers",to:"volunteers"},
    {icon:"📞",label:"Emergency Contacts",to:"contacts"},
    {icon:"🗺️",label:"Campus Map",to:"campusMap"},
    {icon:"🩺",label:"First Aid Guide",to:"guide"},
    {icon:"👤",label:"My Profile",to:"profile"},
    {icon:"📝",label:"Register as Volunteer",to:"login"},
];
return(
<div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
<button onClick={onSOS} style={{...S.btn(C.red,C.white),fontSize:20,fontWeight:900,padding:"22px 18px",borderRadius:16,boxShadow:"0 0 28px rgba(192,57,43,0.55)",letterSpacing:1,marginBottom:14}}>
        🚨 {lang==="ta"?"SOS — அவசரம்":"SOS — EMERGENCY"}
        🚨 SOS — EMERGENCY
</button>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
{tiles.map(b=>(
@@ -259,12 +239,12 @@ function HomeScreen({userLoc,setScreen,lang,onSOS,volunteers,sosToday}){
</button>
))}
</div>
      <div style={S.sHead}>📊 {lang==="ta"?"டாஷ்போர்டு":"Dashboard"}</div>
      <div style={S.sHead}>📊 Dashboard</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.gold,margin:0}}>{approved.length}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>{lang==="ta"?"மொத்த தன்னார்வலர்கள்":"Total Volunteers"}</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.green,margin:0}}>{active}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>{lang==="ta"?"செயலில் உள்ளவர்கள்":"Active Now"}</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.red,margin:0}}>{sosToday}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>{lang==="ta"?"இன்றைய SOS":"SOS Today"}</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.blue,margin:0}}>{volunteers.length}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>{lang==="ta"?"மொத்த பதிவுகள்":"Total Registered"}</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.gold,margin:0}}>{approved.length}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>Total Volunteers</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.green,margin:0}}>{active}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>Active Now</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.red,margin:0}}>{sosToday}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>SOS Today</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.blue,margin:0}}>{volunteers.length}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>Total Registered</p></div>
</div>
</div>
);
@@ -281,8 +261,8 @@ function VolunteersScreen({userLoc,setScreen,setSelectedVol,volunteers}){
function viewMap(vol){sendAlert(vol,"map",{userLoc});setSelectedVol(vol);setScreen("map");}
return(
<div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      <div style={S.sHead}>🆘 {nearby.length>0?`${nearby.length} Volunteers Within 2km`:"All Volunteers"}</div>
      <p style={{color:C.gray,fontSize:11,marginTop:-8,marginBottom:12}}>Sorted by distance · live GPS · Supabase</p>
      <div style={S.sHead}>{nearby.length>0?`🆘 ${nearby.length} Volunteers Within 2km`:"🆘 All Volunteers"}</div>
      <p style={{color:C.gray,fontSize:11,marginTop:-8,marginBottom:12}}>Sorted by distance · live GPS</p>
<div style={{marginBottom:12}}>
{["all","available","certified"].map(f=><button key={f} style={S.chip(filter,f)} onClick={()=>setFilter(f)}>{f==="all"?"All":f==="available"?"Available":"Certified"}</button>)}
</div>
@@ -303,7 +283,6 @@ function VolunteersScreen({userLoc,setScreen,setSelectedVol,volunteers}){
</div>
<div style={{background:C.navyLight,borderRadius:8,padding:"5px 10px",marginBottom:8,fontSize:11,color:C.gray,fontFamily:"monospace"}}>
📍 {fmtCoord(vol.lat)}, {fmtCoord(vol.lng)}
            {vol.loc_updated_at&&<span style={{color:C.gold,marginLeft:6,fontSize:10}}>· {new Date(vol.loc_updated_at).toLocaleTimeString()}</span>}
</div>
<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
<span style={S.badge(vol.online)}>{vol.online?"Online":"Offline"}</span>
@@ -324,19 +303,17 @@ function MapScreen({userLoc,selectedVol,setScreen}){
const[myLoc,setMyLoc]=useState(userLoc);
const[volLoc,setVolLoc]=useState(selectedVol?{lat:parseFloat(selectedVol.lat||CAMPUS_CENTER.lat),lng:parseFloat(selectedVol.lng||CAMPUS_CENTER.lng)}:null);
useEffect(()=>{
    if(!navigator.geolocation) return;
    if(!navigator.geolocation)return;
const id=navigator.geolocation.watchPosition(p=>setMyLoc({lat:p.coords.latitude,lng:p.coords.longitude}),null,{enableHighAccuracy:true,maximumAge:5000});
return()=>navigator.geolocation.clearWatch(id);
},[]);
useEffect(()=>{
    if(!selectedVol?.id) return;
    if(!selectedVol?.id)return;
const poll=()=>db.getVolunteers().then(vols=>{const v=vols.find(x=>x.id===selectedVol.id);if(v&&v.lat&&v.lng)setVolLoc({lat:parseFloat(v.lat),lng:parseFloat(v.lng)});}).catch(()=>{});
    poll();
    const t=setInterval(poll,10000);
    return()=>clearInterval(t);
    poll();const t=setInterval(poll,10000);return()=>clearInterval(t);
},[selectedVol?.id]);
  if(!selectedVol){return null;}
const vol=selectedVol;
  if(!vol){setScreen("volunteers");return null;}
const uLat=myLoc?.lat||CAMPUS_CENTER.lat,uLng=myLoc?.lng||CAMPUS_CENTER.lng;
const vLat=volLoc?.lat||CAMPUS_CENTER.lat,vLng=volLoc?.lng||CAMPUS_CENTER.lng;
const dist=haversine(uLat,uLng,vLat,vLng);
@@ -350,7 +327,7 @@ function MapScreen({userLoc,selectedVol,setScreen}){
<div style={S.row}>
<div style={{width:38,height:38,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:C.navy}}>{vol.name?.charAt(0)}</div>
<div style={{flex:1}}><p style={{fontSize:15,fontWeight:700,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:0}}>{vol.department||vol.occupation}</p></div>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.green,boxShadow:`0 0 6px ${C.green}`}}/>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.green}}/>
</div>
</div>
<div style={{display:"flex",gap:8,marginBottom:8}}>
@@ -360,16 +337,15 @@ function MapScreen({userLoc,selectedVol,setScreen}){
<div style={{...S.card(),marginBottom:8,fontSize:11,fontFamily:"monospace",lineHeight:1.8}}>
<div style={{color:C.blue}}>📍 You: {fmtCoord(uLat)}, {fmtCoord(uLng)}</div>
<div style={{color:C.gold}}>🎯 {vol.name?.split(" ")[0]}: {fmtCoord(vLat)}, {fmtCoord(vLng)}</div>
        <div style={{color:C.gray,fontSize:10}}>↻ Volunteer location updates every 10s</div>
</div>
      <div style={{background:C.navyLight,borderRadius:12,height:170,marginBottom:10,position:"relative",overflow:"hidden",backgroundImage:"radial-gradient(circle,rgba(212,160,23,0.08) 1px,transparent 1px)",backgroundSize:"16px 16px"}}>
        {[1,2,3].map(r=><div key={r} style={{position:"absolute",top:"50%",left:"50%",width:r*52,height:r*52,marginLeft:-(r*26),marginTop:-(r*26),border:`1px solid rgba(148,163,184,${0.22-r*0.05})`,borderRadius:"50%"}}/>)}
      <div style={{background:C.navyLight,borderRadius:12,height:170,marginBottom:10,position:"relative",overflow:"hidden"}}>
        {[1,2,3].map(r=><div key={r} style={{position:"absolute",top:"50%",left:"50%",width:r*52,height:r*52,marginLeft:-(r*26),marginTop:-(r*26),border:`1px solid rgba(148,163,184,0.2)`,borderRadius:"50%"}}/>)}
<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
<div style={{width:12,height:12,borderRadius:"50%",background:C.blue,border:`2px solid ${C.white}`,margin:"0 auto"}}/>
<p style={{fontSize:9,color:C.blue,margin:"2px 0 0",fontWeight:700}}>You</p>
</div>
<div style={{position:"absolute",top:"50%",left:"50%",transform:`rotate(${deg}deg) translateY(-68px) rotate(${-deg}deg) translate(-50%,-50%)`,textAlign:"center"}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:C.gold,border:`2px solid ${C.navy}`,margin:"0 auto",boxShadow:`0 0 8px ${C.gold}`}}/>
          <div style={{width:14,height:14,borderRadius:"50%",background:C.gold,border:`2px solid ${C.navy}`,margin:"0 auto"}}/>
<p style={{fontSize:9,color:C.gold,fontWeight:700,margin:"2px 0 0",whiteSpace:"nowrap"}}>{vol.name?.split(" ")[0]}</p>
</div>
</div>
@@ -385,7 +361,6 @@ function CampusMapScreen({setScreen}){
<div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
<button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("home")}>← Back</button>
<div style={S.sHead}>🗺️ Campus Map — PSG CAS</div>
      <p style={{color:C.gray,fontSize:11,marginTop:-8,marginBottom:10}}>Near SITRA Junction, Avinashi Road, Coimbatore 641014</p>
<div style={{borderRadius:12,overflow:"hidden",marginBottom:10,border:`1px solid ${C.gold}`}}>
<iframe title="map" width="100%" height="230" style={{border:0,display:"block"}} src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${CAMPUS_CENTER.lat},${CAMPUS_CENTER.lng}`}/>
</div>
@@ -401,28 +376,13 @@ function CampusMapScreen({setScreen}){
);
}

function GuideScreen({setScreen,lang,canEdit=false}){
  const[guideEn,setGuideEn]=useState(FIRST_AID_EN);
  const[guideTa,setGuideTa]=useState(FIRST_AID_TA);
function GuideScreen({setScreen,canEdit}){
  const[guide,setGuide]=useState([...guideStore.data]);
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
    if(editing.eLang==="en"){setGuideEn(g=>g.map(x=>x.id===editing.id?{...x,title:editForm.title,steps:stepsArr}:x));}
    else{setGuideTa(g=>g.map(x=>x.id===editing.id?{...x,title:editForm.title,steps:stepsArr}:x));}
    setEditing(null);
  }
if(selected!==null){
    const item=items[selected];
    const item=guide[selected];
return(
<div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
<button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setSelected(null)}>← Back</button>
@@ -437,10 +397,7 @@ function GuideScreen({setScreen,lang,canEdit=false}){
))}
</div>
{canEdit&&(
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1,fontSize:12}} onClick={()=>startEdit(item,"en")}>✏️ Edit English</button>
            <button style={{...S.btn(C.navyLight,C.gold),marginBottom:0,flex:1,fontSize:12,border:`1px solid ${C.gold}`}} onClick={()=>startEdit(item,"ta")}>✏️ தமிழ் திருத்து</button>
          </div>
          <button style={{...S.btn(C.navyLight,C.white),marginBottom:8}} onClick={()=>{setEditing(item);setEditForm({title:item.title,steps:item.steps.join("\n")});setSelected(null);}}>✏️ Edit This Card</button>
)}
<button style={S.btn(C.red,C.white)} onClick={()=>window.open("tel:108","_self")}>🚑 Call Ambulance 108</button>
</div>
@@ -449,28 +406,32 @@ function GuideScreen({setScreen,lang,canEdit=false}){
return(
<div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
{!canEdit&&<button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("home")}>← Back</button>}
      <div style={S.sHead}>🩺 {lang==="ta"?"முதலுதவி வழிகாட்டி":"First Aid Guide"}</div>
      <div style={S.sHead}>🩺 First Aid Guide</div>
<div style={{...S.card(),marginBottom:10,background:"#1a2d1a",border:`1px solid ${C.green}`}}>
        <p style={{color:"#86efac",fontSize:12,margin:0}}>⚠️ {lang==="ta"?"உண்மையான அவசரநிலையில் 108 அழைக்கவும்.":"Always call 108 in a real emergency."}</p>
        <p style={{color:"#86efac",fontSize:12,margin:0}}>⚠️ Always call 108 in a real emergency.</p>
</div>
      {items.map((item,i)=>(
      {guide.map((item,i)=>(
<button key={item.id} style={{...S.card(),width:"100%",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:12}} onClick={()=>setSelected(i)}>
<span style={{fontSize:24,flexShrink:0}}>{item.icon}</span>
          <div style={{flex:1}}><p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{item.title}</p><p style={{fontSize:11,color:C.gray,margin:"2px 0 0"}}>{item.steps.length} {lang==="ta"?"படிகள்":"steps"}</p></div>
          <div style={{flex:1}}><p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{item.title}</p><p style={{fontSize:11,color:C.gray,margin:"2px 0 0"}}>{item.steps.length} steps</p></div>
<span style={{color:C.gold,fontSize:16}}>›</span>
</button>
))}
{editing&&(
<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:500,padding:16,overflowY:"auto"}}>
<div style={{background:C.navyMid,borderRadius:14,padding:20,width:"100%",maxWidth:380,marginTop:16}}>
            <p style={{color:C.white,fontWeight:700,fontSize:15,marginBottom:4}}>✏️ Edit {editing.eLang==="en"?"English 🇬🇧":"Tamil 🇮🇳"}</p>
            <p style={{color:C.white,fontWeight:700,fontSize:15,marginBottom:4}}>✏️ Edit Card</p>
<span style={S.label}>Title</span>
<input style={S.input} value={editForm.title} onChange={e=>setEditForm(p=>({...p,title:e.target.value}))}/>
<span style={S.label}>Steps — one per line</span>
<textarea style={{...S.input,minHeight:160,resize:"vertical"}} value={editForm.steps} onChange={e=>setEditForm(p=>({...p,steps:e.target.value}))}/>
<div style={{display:"flex",gap:8}}>
<button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1}} onClick={()=>setEditing(null)}>Cancel</button>
              <button style={{...S.btn(C.gold,C.navy),marginBottom:0,flex:1}} onClick={saveEdit}>Save</button>
              <button style={{...S.btn(C.gold,C.navy),marginBottom:0,flex:1}} onClick={()=>{
                const stepsArr=editForm.steps.split("\n").map(s=>s.trim()).filter(Boolean);
                const u=guide.map(x=>x.id===editing.id?{...x,title:editForm.title,steps:stepsArr}:x);
                guideStore.data=u;setGuide(u);setEditing(null);
              }}>Save</button>
</div>
</div>
</div>
@@ -479,16 +440,13 @@ function GuideScreen({setScreen,lang,canEdit=false}){
);
}

function ContactsScreen({canEdit=false,setScreen}){
  const[contacts,setContacts]=useState(DEFAULT_CONTACTS);
function ContactsScreen({canEdit,setScreen}){
  const[contacts,setContacts]=useState([...contactsStore.data]);
const[editKey,setEditKey]=useState(null);
const[ef,setEf]=useState({icon:"",label:"",number:"",desc:""});
const[adding,setAdding]=useState(false);
  function save(){
    if(!ef.label||!ef.number) return;
    adding?setContacts(p=>[...p,{key:`c-${Date.now()}`,icon:ef.icon||"📞",label:ef.label,number:ef.number,desc:ef.desc}]):setContacts(p=>p.map(c=>c.key===editKey?{...c,...ef}:c));
    setEditKey(null);
  }
  function persist(next){contactsStore.data=next;setContacts([...next]);}
  function save(){if(!ef.label||!ef.number)return;adding?persist([...contacts,{key:`c-${Date.now()}`,icon:ef.icon||"📞",label:ef.label,number:ef.number,desc:ef.desc}]):persist(contacts.map(c=>c.key===editKey?{...c,...ef}:c));setEditKey(null);}
return(
<div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
{!canEdit&&<button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("home")}>← Back</button>}
@@ -507,7 +465,7 @@ function ContactsScreen({canEdit=false,setScreen}){
{canEdit&&(
<div style={{display:"flex",gap:4}}>
<button style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.white,fontSize:12}} onClick={()=>{setEditKey(c.key);setEf({icon:c.icon,label:c.label,number:c.number,desc:c.desc});setAdding(false);}}>✏️</button>
              <button style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.white,fontSize:12}} onClick={()=>{if(window.confirm("Remove?"))setContacts(p=>p.filter(x=>x.key!==c.key));}}>🗑️</button>
              <button style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.white,fontSize:12}} onClick={()=>{if(window.confirm("Remove?"))persist(contacts.filter(x=>x.key!==c.key));}}>🗑️</button>
</div>
)}
</div>
@@ -539,14 +497,13 @@ function LoginScreen({onLoggedIn,setScreen,sessionStore}){
if(!t.includes("@")||!t.includes(".")){setErr("Enter a valid email.");return;}
const existing=sessionStore.get();
const profile=(existing&&existing.email===t)?existing:{email:t,registered:false,name:"",approved:false};
    sessionStore.set(profile);
    onLoggedIn(profile);
    sessionStore.set(profile);onLoggedIn(profile);
}
return(
<div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
<button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("home")}>← Back</button>
<div style={S.sHead}>🔑 Volunteer Login</div>
      <div style={{...S.card(),marginBottom:12}}><p style={{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}}>Your profile is saved permanently in Supabase. Log in anytime to restore everything.</p></div>
      <div style={{...S.card(),marginBottom:12}}><p style={{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}}>Your profile is saved permanently in Supabase.</p></div>
<span style={S.label}>Email ID</span>
<input style={S.input} type="email" placeholder="yourname@psgcas.edu.in" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}/>
{err&&<p style={S.err}>{err}</p>}
@@ -555,25 +512,25 @@ function LoginScreen({onLoggedIn,setScreen,sessionStore}){
);
}

function ProfileScreen({session,setScreen,volunteers,setVolunteers,onSessionUpdate,lang,sessionStore}){
function ProfileScreen({session,setScreen,volunteers,setVolunteers,onSessionUpdate,sessionStore}){
const vol=session?volunteers.find(v=>v.email===session.email):null;
const[editing,setEditing]=useState(false);
const[saving,setSaving]=useState(false);
const[form,setForm]=useState({name:vol?.name||"",phone:vol?.phone||"",department:vol?.department||"",year:vol?.year||"",occupation:vol?.occupation||"",remarks:vol?.remarks||""});
  if(!session) return(
  if(!session)return(
<div style={S.screen}>
<div style={{...S.card(),textAlign:"center",padding:32}}>
<p style={{fontSize:32,margin:"0 0 12px"}}>👤</p>
        <p style={{color:C.gray,fontSize:13,marginBottom:14}}>{lang==="ta"?"உள்நுழையவும்.":"Please login to view your profile."}</p>
        <p style={{color:C.gray,fontSize:13,marginBottom:14}}>Please login to view your profile.</p>
<button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("login")}>Login / Register</button>
</div>
</div>
);
  if(!vol) return(
  if(!vol)return(
<div style={S.screen}>
<div style={{...S.card(),textAlign:"center",padding:32}}>
<p style={{fontSize:32,margin:"0 0 12px"}}>📝</p>
        <p style={{color:C.gray,fontSize:13,marginBottom:6}}>{lang==="ta"?"தன்னார்வலராக பதிவு செய்யவில்லை.":"Not registered as volunteer yet."}</p>
        <p style={{color:C.gray,fontSize:13,marginBottom:6}}>Not registered as volunteer yet.</p>
<p style={{color:C.gold,fontSize:12,marginBottom:14}}>{session.email}</p>
<button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("register")}>Register Now</button>
<button style={{...S.btn(C.navyLight,C.white),marginTop:4}} onClick={()=>{sessionStore.set(null);onSessionUpdate(null);setScreen("home");}}>🚪 Logout</button>
@@ -602,31 +559,26 @@ function ProfileScreen({session,setScreen,volunteers,setVolunteers,onSessionUpda
<div style={{flex:1}}><p style={{fontSize:16,fontWeight:800,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:"2px 0 0"}}>{vol.email}</p></div>
<span style={S.badge(vol.approved)}>{vol.approved?"✅ Approved":"⏳ Pending"}</span>
</div>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <span style={S.badge(isOnline)}>{isOnline?"🟢 Online":"🔴 Offline"}</span>
          <span style={S.badge(vol.first_aid_certified)}>{vol.first_aid_certified?"🏅 Certified":"Not Certified"}</span>
        </div>
<button style={{...S.btn(isOnline?"#14532d":"#1a3a1a","#86efac"),marginBottom:0,border:`1px solid ${isOnline?C.green:"#166534"}`}} onClick={toggleAvail} disabled={saving}>
          {saving?"Saving...":(isOnline?"🟢 Mark as Unavailable":"🔴 Mark as Available")}
          {saving?"Saving...":(isOnline?"🟢 Mark Unavailable":"🔴 Mark Available")}
</button>
</div>
      <button style={{...S.btn(C.navyLight,C.white),border:`1px solid ${C.navyLight}`}} onClick={()=>setScreen("myAlerts")}>🔔 View My Notifications</button>
      <button style={{...S.btn(C.navyLight,C.white),border:`1px solid ${C.navyLight}`}} onClick={()=>setScreen("myAlerts")}>🔔 My Notifications</button>
{!editing?(
<div style={S.card()}>
          {[["📞 Phone",vol.phone],["🏢 Department",vol.department],["📅 Year",vol.year],["💼 Occupation",vol.occupation],["🏅 First Aid Trained",vol.first_aid_trained?"Yes":"No"],["📋 Training Details",vol.remarks]].map(([l,v])=>v?(
          {[["📞 Phone",vol.phone],["🏢 Dept",vol.department],["📅 Year",vol.year],["💼 Occupation",vol.occupation],["📋 Training",vol.remarks]].map(([l,v])=>v?(
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
            <button style={{...S.btn(C.gold,C.navy),marginBottom:0,flex:1}} onClick={saveEdit} disabled={saving}>{saving?"Saving...":"Save"}</button>
</div>
</div>
)}
@@ -635,119 +587,87 @@ function ProfileScreen({session,setScreen,volunteers,setVolunteers,onSessionUpda
);
}

function RegisterScreen({setScreen,session,onRegistered,userLoc,lang,sessionStore}){
function RegisterScreen({setScreen,session,onRegistered,userLoc,sessionStore}){
const[form,setForm]=useState({name:session?.name||"",email:session?.email||"",roll:"",phone:"",department:"",year:"",occupation:"",first_aid_trained:null,first_aid_certified:null,remarks:""});
const[done,setDone]=useState(false);
const[loading,setLoading]=useState(false);
const[errs,setErrs]=useState({});
function upd(k,v){setForm(p=>({...p,[k]:v}));setErrs(p=>({...p,[k]:null}));}
  function validate(){
    const e={};
    if(!form.name.trim()) e.name="Required";
    if(!form.email.includes("@")) e.email="Valid email required";
    if(!form.phone.trim()) e.phone="Required";
    if(!form.remarks.trim()) e.remarks="Required";
    if(form.first_aid_certified===null) e.cert="Required";
    setErrs(e);
    return Object.keys(e).length===0;
  }
  function validate(){const e={};if(!form.name.trim())e.name="Required";if(!form.email.includes("@"))e.email="Valid email required";if(!form.phone.trim())e.phone="Required";if(!form.remarks.trim())e.remarks="Required";if(form.first_aid_certified===null)e.cert="Required";setErrs(e);return Object.keys(e).length===0;}
async function submit(){
    if(!validate()) return;
    setLoading(true);
    if(!validate())return;setLoading(true);
try{
await db.addVolunteer({name:form.name,roll:form.roll,email:form.email,phone:form.phone,department:form.department,year:form.year,occupation:form.occupation,first_aid_trained:form.first_aid_trained||false,first_aid_certified:form.first_aid_certified||false,remarks:form.remarks,approved:false,online:false,availability:true,lat:userLoc?.lat||CAMPUS_CENTER.lat,lng:userLoc?.lng||CAMPUS_CENTER.lng});
const p={...session,registered:true,approved:false,name:form.name};
sessionStore.set(p);
pushVolNotif(form.email,{type:"registered",message:"📝 Registration submitted! Admin will review soon.",volName:form.name});
playSound("call");
      onRegistered(p);
      setDone(true);
      onRegistered(p);setDone(true);
}catch(e){alert("Error: "+e.message);}
setLoading(false);
}
  function YN({value,onChange,error}){
    return(
      <div style={{marginBottom:10}}>
        {[true,false].map(v=><button key={String(v)} style={S.chip(value,v)} onClick={()=>onChange(v)}>{v?(lang==="ta"?"ஆம்":"Yes"):(lang==="ta"?"இல்லை":"No")}</button>)}
        {error&&<p style={S.err}>{error}</p>}
      </div>
    );
  }
  if(done) return(
  if(done)return(
<div style={{...S.screen,textAlign:"center"}}>
<div style={{fontSize:60,marginBottom:14}}>✅</div>
<p style={{color:C.gold,fontSize:20,fontWeight:800,marginBottom:8}}>Application Submitted!</p>
      <div style={{...S.card(),background:"#1a2d1a",border:`1px solid ${C.green}`,textAlign:"left",marginBottom:14}}>
        <p style={{color:"#86efac",fontWeight:700,margin:"0 0 4px"}}>✅ Saved to Supabase</p>
        <p style={{color:C.gray,fontSize:12,margin:0}}>Admin will approve your application. Check My Notifications for updates.</p>
      </div>
<button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("myAlerts")}>🔔 View My Notifications</button>
<button style={S.btn(C.navyLight,C.white)} onClick={()=>setScreen("home")}>Back to Home</button>
</div>
);
return(
<div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      <div style={S.sHead}>📝 {lang==="ta"?"தன்னார்வலர் பதிவு":"Volunteer Registration"}</div>
      <div style={{...S.card(),background:"#1a2d1a",border:`1px solid ${C.green}`,marginBottom:12}}>
        <p style={{color:"#86efac",fontSize:12,margin:0}}>✅ Data saved permanently to Supabase. Admin approval required.</p>
      </div>
      {[["Full Name *","name","text","e.g. Karthik R"],["Roll Number (optional)","roll","text","e.g. 23CS101"],["Email *","email","email","yourname@psgcas.edu.in"],["Phone *","phone","tel","+91 9XXXXXXXXX"],["Department (optional)","department","text","e.g. Computer Science"],["Year of Study (optional)","year","text","e.g. 2nd Year"],["Occupation (optional)","occupation","text","Student / Doctor / Faculty / Staff"]].map(([l,k,t,ph])=>(
        <div key={k}><span style={S.label}>{l}</span><input style={S.input} type={t} value={form[k]} onChange={e=>upd(k,e.target.value)} placeholder={ph}/>{errs[k]&&<p style={S.err}>{errs[k]}</p>}</div>
      <div style={S.sHead}>📝 Volunteer Registration</div>
      {[["Full Name *","name","text"],["Roll Number","roll","text"],["Email *","email","email"],["Phone *","phone","tel"],["Department","department","text"],["Year","year","text"],["Occupation","occupation","text"]].map(([l,k,t])=>(
        <div key={k}><span style={S.label}>{l}</span><input style={S.input} type={t} value={form[k]} onChange={e=>upd(k,e.target.value)}/>{errs[k]&&<p style={S.err}>{errs[k]}</p>}</div>
))}
      <span style={S.label}>First Aid Training Completed?</span>
      <YN value={form.first_aid_trained} onChange={v=>upd("first_aid_trained",v)}/>
      <span style={S.label}>First Aid Training?</span>
      <div style={{marginBottom:10}}>{[true,false].map(v=><button key={String(v)} style={S.chip(form.first_aid_trained,v)} onClick={()=>upd("first_aid_trained",v)}>{v?"Yes":"No"}</button>)}</div>
<span style={S.label}>First Aid Certificate? *</span>
      <YN value={form.first_aid_certified} onChange={v=>upd("first_aid_certified",v)} error={errs.cert}/>
      <span style={S.label}>Training Details * (course, year, institute)</span>
      <div style={{marginBottom:10}}>{[true,false].map(v=><button key={String(v)} style={S.chip(form.first_aid_certified,v)} onClick={()=>upd("first_aid_certified",v)}>{v?"Yes":"No"}</button>)}{errs.cert&&<p style={S.err}>{errs.cert}</p>}</div>
      <span style={S.label}>Training Details *</span>
<input style={S.input} value={form.remarks} onChange={e=>upd("remarks",e.target.value)} placeholder="e.g. Red Cross Basic First Aid, 2024"/>
{errs.remarks&&<p style={S.err}>{errs.remarks}</p>}
      <button style={S.btn(C.gold,C.navy)} onClick={submit} disabled={loading}>{loading?"Saving to Supabase...":"Submit Application"}</button>
      <button style={S.btn(C.gold,C.navy)} onClick={submit} disabled={loading}>{loading?"Saving...":"Submit Application"}</button>
<button style={S.btn(C.navyLight,C.white)} onClick={()=>setScreen("home")}>Cancel</button>
</div>
);
}

function MyAlertsScreen({session,lang}){
function MyAlertsScreen({session}){
const email=session?.email;
const[notifs,setNotifs]=useState(()=>email?getVolNotifs(email):[]);
useEffect(()=>{
    if(!email) return;
    if(!email)return;
const t=setInterval(()=>setNotifs([...getVolNotifs(email)]),3000);
return()=>clearInterval(t);
},[email]);
function markRead(id){const u=notifs.map(n=>n.id===id?{...n,read:true}:n);setNotifs(u);if(email)saveVolNotifs(email,u);}
function clearAll(){setNotifs([]);if(email)saveVolNotifs(email,[]);}
const iconFor=t=>({call:"📞",map:"🗺",sos:"🚨",approved:"✅",rejected:"❌",broadcast:"📢",registered:"📝"}[t]||"🔔");
const unread=notifs.filter(n=>!n.read).length;
  if(!email) return(
  if(!email)return(
<div style={S.screen}>
      <div style={S.sHead}>🔔 {lang==="ta"?"என் விழிப்பூட்டல்கள்":"My Notifications"}</div>
      <div style={S.sHead}>🔔 My Notifications</div>
<div style={{...S.card(),textAlign:"center",padding:32}}><p style={{fontSize:32,margin:"0 0 10px"}}>🔒</p><p style={{color:C.gray,fontSize:13}}>Login to see notifications.</p></div>
</div>
);
return(
<div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={S.sHead}>🔔 {lang==="ta"?"என் விழிப்பூட்டல்கள்":"My Notifications"}</div>
        <div style={S.sHead}>🔔 My Notifications</div>
{notifs.length>0&&<button style={S.btnSm(C.navyLight,C.gray)} onClick={clearAll}>Clear All</button>}
</div>
{unread>0&&<div style={{...S.card(C.gold),marginBottom:8,textAlign:"center"}}><p style={{color:C.gold,fontWeight:800,fontSize:13,margin:0}}>🔔 {unread} unread</p></div>}
      <div style={{...S.card(),marginBottom:10,fontSize:11}}><span style={{color:C.gold,fontWeight:700}}>📧 {email}</span><span style={{color:C.gray}}> · refreshes every 3s</span></div>
{notifs.length===0&&<div style={{...S.card(),textAlign:"center",padding:28}}><p style={{fontSize:32,margin:"0 0 8px"}}>🔔</p><p style={{color:C.gray,fontSize:13}}>No notifications yet.</p></div>}
{notifs.map(n=>(
        <div key={n.id} onClick={()=>markRead(n.id)} style={{...S.card(n.type==="sos"||n.type==="call"?C.red:n.type==="approved"?C.green:C.gold),background:n.read?C.navyMid:n.type==="sos"?"#2d0a0a":n.type==="approved"?"#052e16":"#1a1400",cursor:"pointer",marginBottom:8}}>
        <div key={n.id} onClick={()=>markRead(n.id)} style={{...S.card(n.type==="sos"||n.type==="call"?C.red:C.gold),background:n.read?C.navyMid:n.type==="sos"?"#2d0a0a":"#1a1400",cursor:"pointer",marginBottom:8}}>
<div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
<span style={{fontSize:20,flexShrink:0}}>{iconFor(n.type)}</span>
<div style={{flex:1}}>
{!n.read&&<span style={{fontSize:9,background:C.red,color:C.white,padding:"1px 6px",borderRadius:10,fontWeight:800,display:"inline-block",marginBottom:2}}>NEW</span>}
<p style={{color:C.white,fontSize:13,margin:"2px 0",fontWeight:n.read?400:600}}>{n.message}</p>
{n.userLoc&&<p style={{color:"#fbbf24",fontSize:10,margin:"0 0 2px",fontFamily:"monospace"}}>📍 {fmtCoord(n.userLoc.lat)}, {fmtCoord(n.userLoc.lng)}</p>}
              {n.userPhone&&<p style={{color:"#86efac",fontSize:11,margin:"0 0 6px",fontWeight:700}}>📞 Caller: {n.userPhone}</p>}
              {(n.type==="sos"||n.type==="call")&&n.userPhone&&(
                <div style={{display:"flex",gap:6,marginBottom:4}}>
                  <button onClick={e=>{e.stopPropagation();window.location.href=`tel:${n.userPhone}`;}} style={{...S.btnSm(C.red,C.white),flex:1,fontSize:11,padding:"7px 8px"}}>📞 Call Now</button>
                </div>
              )}
              {n.userPhone&&<p style={{color:"#86efac",fontSize:11,margin:"0 0 6px",fontWeight:700}}>📞 {n.userPhone}</p>}
<p style={{color:C.gray,fontSize:10,margin:0}}>{n.time}</p>
</div>
</div>
@@ -761,17 +681,16 @@ function AdminAlerts(){
const[alerts,setAlerts]=useState([...gAlerts]);
useEffect(()=>subAlerts(a=>setAlerts([...a])),[]);
const icon=t=>({call:"📞",map:"🗺",sos:"🚨",approved:"✅",rejected:"❌",broadcast:"📢",registered:"📝"}[t]||"🔔");
  if(!alerts.length) return <div style={{...S.card(),textAlign:"center",padding:28}}><p style={{fontSize:28,margin:"0 0 8px"}}>🔔</p><p style={{color:C.gray,fontSize:13}}>No alerts yet.</p></div>;
  if(!alerts.length)return<div style={{...S.card(),textAlign:"center",padding:28}}><p style={{fontSize:28,margin:"0 0 8px"}}>🔔</p><p style={{color:C.gray,fontSize:13}}>No alerts yet.</p></div>;
return(
<div>
{alerts.map(a=>(
        <div key={a.id} onClick={()=>setAlerts(p=>p.map(x=>x.id===a.id?{...x,read:true}:x))} style={{...S.card(a.type==="sos"||a.type==="call"?C.red:C.gold),background:a.read?C.navyMid:a.type==="sos"?"#2d0a0a":"#1a1400",cursor:"pointer",marginBottom:8}}>
        <div key={a.id} style={{...S.card(a.type==="sos"||a.type==="call"?C.red:C.gold),background:a.read?C.navyMid:"#1a1400",cursor:"pointer",marginBottom:8}} onClick={()=>{}}>
<div style={S.row}>
<span style={{fontSize:20}}>{icon(a.type)}</span>
<div style={{flex:1}}>
              {!a.read&&<span style={{fontSize:9,background:C.red,color:C.white,padding:"1px 6px",borderRadius:10,fontWeight:800}}>NEW</span>}
<p style={{color:C.white,fontSize:12,margin:"3px 0"}}>{a.message}</p>
              {a.userPhone&&<p style={{color:"#86efac",fontSize:11,margin:"0 0 2px",fontWeight:700}}>📞 User: {a.userPhone}</p>}
              {a.userPhone&&<p style={{color:"#86efac",fontSize:11,margin:"0 0 2px",fontWeight:700}}>📞 {a.userPhone}</p>}
{a.userLoc&&<p style={{color:"#fbbf24",fontSize:10,margin:"0 0 2px",fontFamily:"monospace"}}>📍 {fmtCoord(a.userLoc.lat)}, {fmtCoord(a.userLoc.lng)}</p>}
<p style={{color:C.gray,fontSize:10,margin:0}}>{a.volName} · {a.time}</p>
</div>
@@ -782,7 +701,7 @@ function AdminAlerts(){
);
}

function AdminScreen({volunteers,setVolunteers,sosToday,lang}){
function AdminScreen({volunteers,setVolunteers,sosToday}){
const[tab,setTab]=useState("alerts");
const[username,setUsername]=useState("");
const[pin,setPin]=useState("");
@@ -792,75 +711,65 @@ function AdminScreen({volunteers,setVolunteers,sosToday,lang}){
const[busy,setBusy]=useState(false);
const[loginErr,setLoginErr]=useState("");
useEffect(()=>subAlerts(a=>setBadge(a.filter(x=>!x.read).length)),[]);

  if(!unlocked) return(
  if(!unlocked)return(
<div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
<div style={S.sHead}>🔐 Admin Access</div>
<div style={{...S.card(),textAlign:"center",padding:28}}>
        <p style={{color:C.gray,fontSize:13,marginBottom:14}}>Enter admin credentials to unlock</p>
<span style={S.label}>Username</span>
<input style={S.input} type="text" placeholder="Admin username" value={username} onChange={e=>{setUsername(e.target.value);setLoginErr("");}}/>
<span style={S.label}>Password</span>
        <input style={S.input} type="password" placeholder="Admin password" value={pin} onChange={e=>{setPin(e.target.value);setLoginErr("");}} onKeyDown={e=>{if(e.key==="Enter"){if(username===ADMIN_USERNAME&&pin===ADMIN_PIN)setUnlocked(true);else setLoginErr("Invalid username or password.");}}}/>
        {loginErr&&<p style={{...S.err,textAlign:"center",marginBottom:10}}>{loginErr}</p>}
        <button style={S.btn(C.gold,C.navy)} onClick={()=>{if(username===ADMIN_USERNAME&&pin===ADMIN_PIN)setUnlocked(true);else setLoginErr("Invalid username or password.");}}>Unlock Dashboard</button>
        <p style={{color:C.gray,fontSize:10,marginTop:4}}>Username: aga2026</p>
        <input style={S.input} type="password" placeholder="Admin password" value={pin} onChange={e=>{setPin(e.target.value);setLoginErr("");}}/>
        {loginErr&&<p style={{...S.err,textAlign:"center"}}>{loginErr}</p>}
        <button style={S.btn(C.gold,C.navy)} onClick={()=>{if(username===ADMIN_USERNAME&&pin===ADMIN_PIN)setUnlocked(true);else setLoginErr("Invalid credentials.");}}>Unlock Dashboard</button>
</div>
</div>
);

const pending=volunteers.filter(v=>!v.approved);
const approved=volunteers.filter(v=>v.approved);

async function approve(vol){
setBusy(true);
try{
await db.updateVolunteer(vol.id,{approved:true,online:true,availability:true});
setVolunteers(p=>p.map(v=>v.id===vol.id?{...v,approved:true,online:true,availability:true}:v));
sendAlert(vol,"approved");
      pushVolNotif(vol.email,{type:"approved",message:"✅ Your application has been approved! You are now live as a volunteer.",volName:vol.name});
      pushVolNotif(vol.email,{type:"approved",message:"✅ Your application has been approved!",volName:vol.name});
playSound("call");
}catch(e){alert(e.message);}
setBusy(false);
}
async function reject(vol){
    if(!window.confirm(`Reject ${vol.name}?`)) return;
    setBusy(true);
    if(!window.confirm(`Reject ${vol.name}?`))return;setBusy(true);
try{
await db.deleteVolunteer(vol.id);
setVolunteers(p=>p.filter(v=>v.id!==vol.id));
      pushVolNotif(vol.email,{type:"rejected",message:"❌ Your application was not approved this time.",volName:vol.name});
sendAlert(vol,"rejected");
}catch(e){alert(e.message);}
setBusy(false);
}
async function remove(vol){
    if(!window.confirm(`Remove ${vol.name} permanently?`)) return;
    setBusy(true);
    if(!window.confirm(`Remove ${vol.name}?`))return;setBusy(true);
try{await db.deleteVolunteer(vol.id);setVolunteers(p=>p.filter(v=>v.id!==vol.id));}catch(e){alert(e.message);}
setBusy(false);
}
function broadcast(){
    if(!bcast.trim()) return;
    if(!bcast.trim())return;
approved.forEach(v=>{sendAlert(v,"broadcast",{message:bcast});pushVolNotif(v.email,{type:"broadcast",message:`📢 Admin: ${bcast}`,volName:v.name});});
playSound("sos");setBcast("");alert(`Broadcast sent to ${approved.length} volunteer(s).`);
}

const tabs=[{k:"alerts",l:`🔔 Alerts${badge>0?` (${badge})`:""}`},{k:"pending",l:`⏳ Pending (${pending.length})`},{k:"approved",l:`✅ Approved (${approved.length})`},{k:"contacts",l:"📞 Contacts"},{k:"guide",l:"🩺 Guide"},{k:"broadcast",l:"📢 Broadcast"}];
return(
<div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
<div style={S.sHead}>🛡 Admin Dashboard</div>
      {busy&&<div style={{...S.card(),background:"#1a1400",border:`1px solid ${C.gold}`,marginBottom:10,textAlign:"center"}}><p style={{color:C.gold,fontSize:12,margin:0}}>⏳ Saving to Supabase...</p></div>}
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
{tabs.map(({k,l})=><button key={k} style={{...S.btnSm(tab===k?C.gold:C.navyLight,tab===k?C.navy:C.white),border:`1px solid ${tab===k?C.gold:C.navyLight}`,marginBottom:4}} onClick={()=>setTab(k)}>{l}</button>)}
</div>
{tab==="alerts"&&<AdminAlerts/>}
      {tab==="contacts"&&<ContactsScreen canEdit setScreen={()=>{}}/>}
      {tab==="guide"&&<GuideScreen setScreen={()=>{}} lang={lang} canEdit/>}
      {tab==="contacts"&&<ContactsScreen canEdit={true} setScreen={()=>{}}/>}
      {tab==="guide"&&<GuideScreen setScreen={()=>{}} canEdit={true}/>}
{tab==="broadcast"&&(
<div style={S.card()}>
<span style={S.label}>Broadcast Message</span>
          <textarea style={{...S.input,minHeight:80,resize:"vertical"}} value={bcast} onChange={e=>setBcast(e.target.value)} placeholder="e.g. Campus emergency drill at 3 PM today."/>
          <textarea style={{...S.input,minHeight:80,resize:"vertical"}} value={bcast} onChange={e=>setBcast(e.target.value)} placeholder="e.g. Campus emergency drill at 3 PM."/>
<button style={S.btn(C.gold,C.navy)} onClick={broadcast}>📢 Send to All Approved Volunteers</button>
</div>
)}
@@ -871,16 +780,13 @@ function AdminScreen({volunteers,setVolunteers,sosToday,lang}){
<div key={vol.id} style={S.card()}>
<div style={{...S.row,marginBottom:8}}>
<div style={{width:36,height:36,borderRadius:"50%",background:vol.approved?C.gold:C.gray,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:C.navy,flexShrink:0}}>{vol.name?.charAt(0)}</div>
                <div style={{flex:1}}><p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:0}}>{vol.department||vol.occupation||"—"}{vol.year?` · ${vol.year}`:""}</p></div>
                <div style={{flex:1}}><p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:0}}>{vol.email}</p></div>
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
{!vol.approved&&<button style={{...S.btnSm(C.green,C.white),flex:1,padding:10}} onClick={()=>approve(vol)} disabled={busy}>✓ Approve</button>}
@@ -897,7 +803,6 @@ function AdminScreen({volunteers,setVolunteers,sosToday,lang}){
export default function App(){
const sessionRef=useRef(null);
const sessionStore={get:()=>sessionRef.current,set:(v)=>{sessionRef.current=v;}};

const[lang,setLang]=useState("en");
const toggleLang=()=>setLang(l=>l==="en"?"ta":"en");
const[step,setStep]=useState("location");
@@ -912,31 +817,26 @@ export default function App(){
const[volunteers,setVolunteers]=useState([]);
const[sosToday,setSosToday]=useState(0);
const volIdRef=useRef(null);
  const userPhoneRef=useRef("");
  const userNameRef=useRef("");

const refreshVols=useCallback(()=>{db.getVolunteers().then(d=>setVolunteers(d)).catch(()=>{});},[]);

useEffect(()=>{if(step==="app"){refreshVols();const t=setInterval(refreshVols,30000);return()=>clearInterval(t);}},[step,refreshVols]);

useEffect(()=>{
    if(step!=="app"||!navigator.geolocation) return;
    if(step!=="app"||!navigator.geolocation)return;
const id=navigator.geolocation.watchPosition(p=>setUserLoc({lat:p.coords.latitude,lng:p.coords.longitude}),null,{enableHighAccuracy:true,maximumAge:30000});
return()=>navigator.geolocation.clearWatch(id);
},[step]);

useEffect(()=>{
    if(!session?.email||step!=="app"||!navigator.geolocation) return;
    if(!session?.email||step!=="app"||!navigator.geolocation)return;
const vol=volunteers.find(v=>v.email===session.email&&v.approved);
    if(!vol) return;
    if(!vol)return;
volIdRef.current=vol.id;
    const wid=navigator.geolocation.watchPosition(
      pos=>{
        const lat=pos.coords.latitude,lng=pos.coords.longitude;
        db.updateVolunteer(volIdRef.current,{lat,lng,online:true,loc_updated_at:new Date().toISOString()}).catch(()=>{});
        setVolunteers(p=>p.map(x=>x.id===volIdRef.current?{...x,lat,lng,loc_updated_at:new Date().toISOString()}:x));
      },null,{enableHighAccuracy:true,maximumAge:30000}
    );
    const wid=navigator.geolocation.watchPosition(pos=>{
      const{latitude:lat,longitude:lng}=pos.coords;
      db.updateVolunteer(volIdRef.current,{lat,lng,online:true,loc_updated_at:new Date().toISOString()}).catch(()=>{});
      setVolunteers(p=>p.map(x=>x.id===volIdRef.current?{...x,lat,lng}:x));
    },null,{enableHighAccuracy:true,maximumAge:30000});
return()=>navigator.geolocation.clearWatch(wid);
},[session?.email,volunteers.length,step]);

@@ -946,72 +846,67 @@ export default function App(){
if(l){setToast(l);setTimeout(()=>setToast(null),4500);}
}),[]);

  function onLocation(loc){setUserLoc(loc);if(userPhoneRef.current&&userNameRef.current){setStep("app");}else{setStep("phone");}}
  function onPhone(name,phone){
    userNameRef.current=name;userPhoneRef.current=phone;
    setUserName(name);setUserPhone(phone);
    setStep("app");
  }

  function onLocation(loc){setUserLoc(loc);setStep("phone");}
  function onPhone(name,phone){setUserName(name);setUserPhone(phone);setStep("app");}
function triggerSOS(){
const nearby=volunteers.filter(v=>v.approved&&v.online&&v.availability).map(v=>({...v,distance:userLoc&&v.lat?haversine(userLoc.lat,userLoc.lng,parseFloat(v.lat),parseFloat(v.lng)):9999})).filter(v=>v.distance<=CAMPUS_RADIUS_KM*1000).sort((a,b)=>a.distance-b.distance);
    if(!nearby.length){alert("No volunteers nearby. Please call Emergency Contacts!");setScreen("contacts");return;}
    if(!nearby.length){alert("No volunteers nearby! Please call Emergency Contacts.");setScreen("contacts");return;}
nearby.forEach(v=>{
sendAlert(v,"sos",{userLoc,userPhone,userName});
      pushVolNotif(v.email,{type:"sos",message:`🚨 SOS from ${userName||"Someone"}! Call: ${userPhone} · 📍 ${fmtCoord(userLoc?.lat)}, ${fmtCoord(userLoc?.lng)}`,volName:v.name,userLoc,userPhone,userName});
      pushVolNotif(v.email,{type:"sos",message:`🚨 SOS from ${userName||"Someone"}! Call: ${userPhone}`,volName:v.name,userLoc,userPhone});
});
playSound("sos");setSosToday(c=>c+1);
    alert(`🚨 SOS sent to ${nearby.length} AGA volunteer(s) nearby!\nYour name (${userName}) and number (${userPhone}) have been shared.`);
    alert(`🚨 SOS sent to ${nearby.length} volunteer(s)!\nYour name (${userName}) and number (${userPhone}) were shared.`);
}

  if(step==="location") return <LocationGate onEnable={onLocation} lang={lang} onToggle={toggleLang}/>;
  if(step==="phone") return(
  if(step==="location")return<LocationGate onEnable={onLocation} lang={lang} onToggle={toggleLang}/>;
  if(step==="phone")return(
<div style={{...S.app,display:"flex",flexDirection:"column"}}>
      <style>{globalCSS}</style>
      <style>{css}</style>
<Header lang={lang} onToggle={toggleLang}/>
      <PhoneGate onSave={onPhone} lang={lang} savedName={userName} savedPhone={userPhone}/>
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
    {id:"home",icon:"🏠",label:"Home"},
    {id:"volunteers",icon:"🆘",label:"Help"},
    {id:"guide",icon:"🩺",label:"First Aid"},
    {id:"myAlerts",icon:"🔔",label:"Alerts",badge:myNotifCount},
    {id:"admin",icon:"🛡",label:"Admin",badge},
];

const screens={
home:<HomeScreen userLoc={userLoc} setScreen={setScreen} lang={lang} onSOS={triggerSOS} volunteers={volunteers} sosToday={sosToday}/>,
volunteers:<VolunteersScreen userLoc={userLoc} setScreen={setScreen} setSelectedVol={setSelectedVol} volunteers={volunteers}/>,
map:<MapScreen userLoc={userLoc} selectedVol={selectedVol} setScreen={setScreen}/>,
campusMap:<CampusMapScreen setScreen={setScreen}/>,
    contacts:<ContactsScreen setScreen={setScreen}/>,
    guide:<GuideScreen setScreen={setScreen} lang={lang}/>,
    myAlerts:<MyAlertsScreen session={session} lang={lang}/>,
    contacts:<ContactsScreen canEdit={false} setScreen={setScreen}/>,
    guide:<GuideScreen setScreen={setScreen} canEdit={false}/>,
    myAlerts:<MyAlertsScreen session={session}/>,
login:<LoginScreen onLoggedIn={p=>{setSession(p);sessionStore.set(p);setScreen(p.registered?"profile":"register");}} setScreen={setScreen} sessionStore={sessionStore}/>,
    profile:<ProfileScreen session={session} setScreen={setScreen} volunteers={volunteers} setVolunteers={setVolunteers} onSessionUpdate={s=>{setSession(s);sessionStore.set(s);}} lang={lang} sessionStore={sessionStore}/>,
    register:session?<RegisterScreen setScreen={setScreen} session={session} onRegistered={p=>{setSession(p);sessionStore.set(p);refreshVols();}} userLoc={userLoc} lang={lang} sessionStore={sessionStore}/>:<LoginScreen onLoggedIn={p=>{setSession(p);sessionStore.set(p);setScreen("register");}} setScreen={setScreen} sessionStore={sessionStore}/>,
    admin:<AdminScreen volunteers={volunteers} setVolunteers={setVolunteers} sosToday={sosToday} lang={lang}/>,
    profile:<ProfileScreen session={session} setScreen={setScreen} volunteers={volunteers} setVolunteers={setVolunteers} onSessionUpdate={s=>{setSession(s);sessionStore.set(s);}} sessionStore={sessionStore}/>,
    register:session?<RegisterScreen setScreen={setScreen} session={session} onRegistered={p=>{setSession(p);sessionStore.set(p);refreshVols();}} userLoc={userLoc} sessionStore={sessionStore}/>:<LoginScreen onLoggedIn={p=>{setSession(p);sessionStore.set(p);setScreen("register");}} setScreen={setScreen} sessionStore={sessionStore}/>,
    admin:<AdminScreen volunteers={volunteers} setVolunteers={setVolunteers} sosToday={sosToday}/>,
};

return(
<div style={S.app}>
      <style>{globalCSS}</style>
      <style>{css}</style>
{toast&&(
        <div style={{position:"fixed",top:85,left:"50%",transform:"translateX(-50%)",zIndex:999,width:"90%",maxWidth:390,background:(toast.type==="call"||toast.type==="sos")?"#7f1d1d":"#1a1400",border:`2px solid ${(toast.type==="call"||toast.type==="sos")?C.red:C.gold}`,borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,animation:"toastIn 0.3s ease",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
          <span style={{fontSize:20}}>{toast.type==="sos"?"🆘":toast.type==="call"?"📞":toast.type==="approved"?"✅":toast.type==="registered"?"📝":"📢"}</span>
          <div style={{flex:1}}><p style={{fontWeight:800,fontSize:10,color:C.gold,margin:"0 0 2px",textTransform:"uppercase"}}>Alert</p><p style={{color:C.white,fontSize:12,margin:0}}>{toast.message}</p></div>
        <div style={{position:"fixed",top:85,left:"50%",transform:"translateX(-50%)",zIndex:999,width:"90%",maxWidth:390,background:(toast.type==="call"||toast.type==="sos")?"#7f1d1d":"#1a1400",border:`2px solid ${(toast.type==="sos"||toast.type==="call")?C.red:C.gold}`,borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,animation:"toastIn 0.3s ease",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
          <span style={{fontSize:20}}>{toast.type==="sos"?"🆘":toast.type==="call"?"📞":"📢"}</span>
          <div style={{flex:1}}><p style={{color:C.white,fontSize:12,margin:0}}>{toast.message}</p></div>
<button onClick={()=>setToast(null)} style={{background:"none",border:"none",color:C.gray,fontSize:16,cursor:"pointer",padding:0}}>✕</button>
</div>
)}
<Header lang={lang} onToggle={toggleLang}/>
      <LocationBanner userLoc={userLoc} lang={lang}/>
      <LocationBanner userLoc={userLoc}/>
<div>{screens[screen]||screens.home}</div>
<nav style={S.navBar}>
{navItems.map(n=>(
          <button key={n.id} style={S.navBtn(screen===n.id||(screen==="map"&&n.id==="volunteers")||(screen==="campusMap"&&n.id==="home"))} onClick={()=>setScreen(n.id)}>
          <button key={n.id} style={S.navBtn(screen===n.id)} onClick={()=>setScreen(n.id)}>
<span style={{fontSize:19,position:"relative",display:"inline-block"}}>
{n.icon}
{n.badge>0&&<span style={{position:"absolute",top:-3,right:-5,background:C.red,color:C.white,borderRadius:"50%",fontSize:8,fontWeight:800,width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{n.badge}</span>}
