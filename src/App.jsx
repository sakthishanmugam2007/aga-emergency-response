import React, { useState, useEffect, useRef, useCallback } from "react";

const SUPABASE_URL = "https://qyoektirhvroaarnzazy.supabase.co";
const SUPABASE_KEY = "sb_publishable_3LBPKOMdfUMeEkguQO98ug_7jcYg9ct";
const ADMIN_USERNAME = "aga2026";
const ADMIN_PIN = "6202csacgspaga";
const CAMPUS_RADIUS_KM = 2.0;
const CAMPUS_CENTER = { lat: 11.0345, lng: 77.0355 };
const AGA_LOGO = "https://i.ibb.co/N6N6r8hv/1000032378-removebg-preview.png";
const PSG_LOGO = "https://i.ibb.co/67sWvHfs/1000032364-removebg-preview.png";

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

const FIRST_AID = [
  { id:"bls", icon:"🫀", title:"Basic Life Support", steps:["Ensure scene safety.","Tap shoulders: 'Are you okay?'","Call 108 immediately.","Head Tilt–Chin Lift. Check breathing 10 sec.","Breathing → Recovery Position. Not breathing → CPR."] },
  { id:"cpr", icon:"❤️", title:"CPR", steps:["Heel of hand on center of chest.","Second hand on top, interlock fingers.","30 compressions, 5cm deep, 100–120/min.","2 rescue breaths — pinch nose, cover mouth.","Repeat 30:2 until help arrives."] },
  { id:"choking", icon:"😮", title:"Choking", steps:["Encourage forceful coughing.","5 sharp back blows between shoulder blades.","5 abdominal thrusts inward and upward.","Continue alternating.","If unconscious → CPR immediately."] },
  { id:"fracture", icon:"🦴", title:"Fractures", steps:["Keep injured area still.","Do NOT straighten the bone.","Apply ice wrapped in cloth — 20 min on/off.","Support with splint beyond joints.","Seek medical help immediately."] },
  { id:"bleeding", icon:"🩸", title:"Severe Bleeding", steps:["Wear gloves if available.","Apply direct pressure with clean cloth.","Elevate injured part above heart.","Tourniquet 5–7 cm above wound if life-threatening.","Call 108 if severe."] },
  { id:"burns", icon:"🔥", title:"Burns", steps:["Remove from heat source immediately.","Cool with running water 20 min — NOT ice.","Remove tight jewelry carefully.","Cover loosely with sterile dressing.","Do NOT apply butter or oil."] },
  { id:"seizure", icon:"⚡", title:"Seizures", steps:["Stay calm. Move dangerous objects away.","Cushion the head.","Loosen tight clothing around neck.","Do NOT restrain or put anything in mouth.","Call 108 if seizure lasts more than 5 minutes."] },
  { id:"heartattack", icon:"💔", title:"Heart Attack", steps:["Call 108 immediately.","Help person sit comfortably.","Loosen tight clothing.","No food or drinks.","If unconscious and not breathing → CPR."] },
  { id:"snakebite", icon:"🐍", title:"Snake Bite", steps:["Keep victim calm and still.","Wash bite gently with clean water.","Keep bitten limb BELOW heart level.","Remove rings near bite.","Call 108 — do NOT cut, suck or tourniquet."] },
  { id:"fire", icon:"🚒", title:"Fire Emergency", steps:["Activate fire alarm immediately.","Use stairs NOT elevator.","Crawl below smoke level.","Cover nose and mouth with wet cloth.","Move to assembly point. STOP–DROP–ROLL if on fire."] },
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
  { name:"Assembly Point", lat:11.0352, lng:77.0370, icon:"📢" },
  { name:"Medical Room", lat:11.0355, lng:77.0375, icon:"⚕️" },
];

function haversine(a,b,c,d){const R=6371000,r=x=>x*Math.PI/180,dL=r(c-a),dG=r(d-b),s=Math.sin(dL/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dG/2)**2;return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));}
function bearingDeg(a,b,c,d){const r=x=>x*Math.PI/180,dG=r(d-b);return(Math.atan2(Math.sin(dG)*Math.cos(r(c)),Math.cos(r(a))*Math.sin(r(c))-Math.sin(r(a))*Math.cos(r(c))*Math.cos(dG))*180/Math.PI+360)%360;}
function fmtDist(m){return m<1000?`${Math.round(m)}m`:`${(m/1000).toFixed(1)}km`;}
function fmtCoord(n){return n!=null?parseFloat(n).toFixed(5):"—";}

function playSound(type){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const now=ctx.currentTime;
    const b=(f,s,d,w="square",v=0.3)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type=w;o.frequency.setValueAtTime(f,now+s);g.gain.setValueAtTime(0,now+s);g.gain.linearRampToValueAtTime(v,now+s+0.03);g.gain.linearRampToValueAtTime(0,now+s+d);o.start(now+s);o.stop(now+s+d+0.05);};
    if(type==="sos")[0,.2,.4,.6,.8,1].forEach((t,i)=>b(i%2===0?700:1300,t,.18,"sawtooth",.4));
    else if(type==="call")[0,.28,.56,.84].forEach((t,i)=>b(i%2===0?880:1100,t,.24));
    else[0,.18,.36].forEach(t=>b(1400,t,.15,"sine",.25));
  }catch(e){}
}

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
  btn:(bg,fg)=>({display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"12px 18px",borderRadius:10,border:"none",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10,background:bg,color:fg}),
  btnSm:(bg,fg)=>({padding:"8px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:bg,color:fg}),
  card:(border)=>({background:C.navyMid,border:`1px solid ${border||C.navyLight}`,borderRadius:12,padding:"14px 15px",marginBottom:10}),
  label:{fontSize:11,color:C.gold,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4,marginTop:8,display:"block"},
  input:{width:"100%",background:C.navyLight,border:`1px solid ${C.navyLight}`,borderRadius:8,padding:"10px 12px",color:C.white,fontSize:14,marginBottom:10,boxSizing:"border-box",outline:"none",fontFamily:"inherit"},
  badge:(ok)=>({fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:ok?"#14532d":"#7f1d1d",color:ok?"#86efac":"#fca5a5"}),
  navBar:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.navyMid,borderTop:`2px solid ${C.gold}`,display:"flex",zIndex:200},
  navBtn:(a)=>({flex:1,padding:"9px 2px 7px",background:"none",border:"none",color:a?C.gold:C.gray,fontSize:8,fontWeight:700,cursor:"pointer",textTransform:"uppercase",display:"flex",flexDirection:"column",alignItems:"center",gap:2}),
  sHead:{fontSize:12,fontWeight:800,color:C.gold,textTransform:"uppercase",letterSpacing:1,marginBottom:12},
  chip:(s,v)=>({padding:"6px 12px",borderRadius:20,border:`1px solid ${s===v?C.gold:C.navyLight}`,background:s===v?C.gold:C.navyLight,color:s===v?C.navy:C.gray,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:6,marginBottom:6}),
  statBox:{background:C.navyMid,border:`1px solid ${C.navyLight}`,borderRadius:12,padding:"12px 8px",textAlign:"center"},
  row:{display:"flex",gap:8,alignItems:"center"},
  err:{color:"#fca5a5",fontSize:11,marginTop:-6,marginBottom:8},
};

function Header({lang,onToggle}){
  return(
    <div style={{background:C.navyMid,borderBottom:`2px solid ${C.gold}`,padding:"8px 12px"}}>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}>
        <button onClick={onToggle} style={{background:C.navyLight,border:`1px solid ${C.gold}`,borderRadius:20,padding:"3px 10px",color:C.gold,fontSize:10,fontWeight:700,cursor:"pointer"}}>
          {lang==="ta"?"தமிழ் / EN":"EN / தமிழ்"}
        </button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <img src={AGA_LOGO} alt="AGA" style={{width:52,height:52,objectFit:"contain",flexShrink:0}} onError={e=>{e.target.style.display="none";}}/>
        <div style={{flex:1,textAlign:"center"}}>
          <p style={{fontSize:14,fontWeight:900,color:C.white,margin:0,lineHeight:1.3}}>AGA {lang==="ta"?"அவசர சேவை":"EMERGENCY RESPONSE"}</p>
          <p style={{fontSize:9,color:C.gold,fontWeight:700,margin:"2px 0 1px",letterSpacing:0.5,textTransform:"uppercase"}}>Alert Golden Army · PSGCAS Chapter</p>
          <p style={{fontSize:8,color:C.gray,margin:0}}>PSG College of Arts & Science, Coimbatore</p>
        </div>
        <img src={PSG_LOGO} alt="PSG CAS" style={{width:46,height:52,objectFit:"contain",flexShrink:0}} onError={e=>{e.target.style.display="none";}}/>
      </div>
    </div>
  );
}

function LocationBanner({userLoc}){
  if(!userLoc)return null;
  return(
    <div style={{background:"#0d1f35",borderBottom:`1px solid ${C.navyLight}`,padding:"5px 14px",display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:12}}>📍</span>
      <span style={{fontSize:10,color:C.gold,fontWeight:800}}>LOCATION: </span>
      <span style={{fontSize:10,color:C.white,fontFamily:"monospace",flex:1}}>{fmtCoord(userLoc.lat)}, {fmtCoord(userLoc.lng)}</span>
      <div style={{width:7,height:7,borderRadius:"50%",background:C.green,animation:"blink 2s infinite"}}/>
    </div>
  );
}

function PhoneGate({onSave,lang}){
  const[name,setName]=useState("");
  const[phone,setPhone]=useState("");
  const[errs,setErrs]=useState({});
  function save(){
    const e={};
    if(!name.trim())e.name="Name is required";
    if(phone.trim().length<7)e.phone="Please enter a valid phone number";
    if(Object.keys(e).length){setErrs(e);return;}
    onSave(name.trim(),phone.trim());
  }
  return(
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>📱</div>
        <p style={{fontSize:18,fontWeight:800,color:C.gold,marginBottom:8}}>Your Details</p>
        <div style={{...S.card(C.gold),textAlign:"left",marginBottom:16}}>
          <p style={{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}}>Your name and phone number will be shared with nearby volunteers in an emergency.</p>
        </div>
        <span style={S.label}>Full Name *</span>
        <input style={S.input} type="text" placeholder="Your full name" value={name} onChange={e=>{setName(e.target.value);setErrs(p=>({...p,name:null}));}}/>
        {errs.name&&<p style={S.err}>{errs.name}</p>}
        <span style={S.label}>Phone Number *</span>
        <input style={S.input} type="tel" placeholder="+91 9XXXXXXXXX" value={phone} onChange={e=>{setPhone(e.target.value);setErrs(p=>({...p,phone:null}));}}/>
        {errs.phone&&<p style={S.err}>{errs.phone}</p>}
        <button style={S.btn(C.gold,C.navy)} onClick={save}>Save & Continue →</button>
      </div>
    </div>
  );
}

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
            <p style={{color:"#fecaca",fontWeight:700,fontSize:15,margin:"0 0 6px"}}>Location Access Required</p>
            <p style={{color:"#fca5a5",fontSize:13,margin:0,lineHeight:1.5}}>Your location is needed for emergency services.</p>
          </div>
          {err&&<p style={{color:"#fbbf24",fontSize:12,marginBottom:12}}>Location denied — using campus center as fallback.</p>}
          <button style={S.btn(C.gold,C.navy)} onClick={tryEnable}>📍 Enable Location</button>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({userLoc,setScreen,lang,onSOS,volunteers,sosToday}){
  const approved=volunteers.filter(v=>v.approved);
  const active=approved.filter(v=>v.online&&v.availability).length;
  const tiles=[
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
        🚨 SOS — EMERGENCY
      </button>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {tiles.map(b=>(
          <button key={b.to} style={{...S.btn(C.navyLight,C.white),marginBottom:0,flexDirection:"column",padding:"14px 8px",gap:4,border:`1px solid ${C.navyLight}`}} onClick={()=>setScreen(b.to)}>
            <span style={{fontSize:22}}>{b.icon}</span>
            <span style={{fontSize:11,lineHeight:1.3}}>{b.label}</span>
          </button>
        ))}
      </div>
      <div style={S.sHead}>📊 Dashboard</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.gold,margin:0}}>{approved.length}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>Total Volunteers</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.green,margin:0}}>{active}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>Active Now</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.red,margin:0}}>{sosToday}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>SOS Today</p></div>
        <div style={S.statBox}><p style={{fontSize:24,fontWeight:900,color:C.blue,margin:0}}>{volunteers.length}</p><p style={{fontSize:10,color:C.gray,margin:"3px 0 0"}}>Total Registered</p></div>
      </div>
    </div>
  );
}

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
    <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      <div style={S.sHead}>{nearby.length>0?`🆘 ${nearby.length} Volunteers Within 2km`:"🆘 All Volunteers"}</div>
      <p style={{color:C.gray,fontSize:11,marginTop:-8,marginBottom:12}}>Sorted by distance · live GPS</p>
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

function MapScreen({userLoc,selectedVol,setScreen}){
  const[myLoc,setMyLoc]=useState(userLoc);
  const[volLoc,setVolLoc]=useState(selectedVol?{lat:parseFloat(selectedVol.lat||CAMPUS_CENTER.lat),lng:parseFloat(selectedVol.lng||CAMPUS_CENTER.lng)}:null);
  useEffect(()=>{
    if(!navigator.geolocation)return;
    const id=navigator.geolocation.watchPosition(p=>setMyLoc({lat:p.coords.latitude,lng:p.coords.longitude}),null,{enableHighAccuracy:true,maximumAge:5000});
    return()=>navigator.geolocation.clearWatch(id);
  },[]);
  useEffect(()=>{
    if(!selectedVol?.id)return;
    const poll=()=>db.getVolunteers().then(vols=>{const v=vols.find(x=>x.id===selectedVol.id);if(v&&v.lat&&v.lng)setVolLoc({lat:parseFloat(v.lat),lng:parseFloat(v.lng)});}).catch(()=>{});
    poll();const t=setInterval(poll,10000);return()=>clearInterval(t);
  },[selectedVol?.id]);
  if(!selectedVol){return null;}
  const vol=selectedVol;
  const uLat=myLoc?.lat||CAMPUS_CENTER.lat,uLng=myLoc?.lng||CAMPUS_CENTER.lng;
  const vLat=volLoc?.lat||CAMPUS_CENTER.lat,vLng=volLoc?.lng||CAMPUS_CENTER.lng;
  const dist=haversine(uLat,uLng,vLat,vLng);
  const deg=bearingDeg(uLat,uLng,vLat,vLng);
  const osmUrl=`https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${uLat}%2C${uLng}%3B${vLat}%2C${vLng}`;
  return(
    <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("volunteers")}>← Back</button>
      <div style={S.sHead}>🗺 Volunteer Live Location</div>
      <div style={{...S.card(C.gold),marginBottom:10}}>
        <div style={S.row}>
          <div style={{width:38,height:38,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:C.navy}}>{vol.name?.charAt(0)}</div>
          <div style={{flex:1}}><p style={{fontSize:15,fontWeight:700,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:0}}>{vol.department||vol.occupation}</p></div>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.green}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <div style={{...S.statBox,flex:1}}><p style={{color:C.gold,fontWeight:800,fontSize:20,margin:0}}>{fmtDist(dist)}</p><p style={{color:C.gray,fontSize:10,margin:0}}>Distance</p></div>
        <div style={{...S.statBox,flex:1}}><p style={{color:C.gold,fontWeight:800,fontSize:20,margin:0}}>~{Math.max(1,Math.round(dist/80))} min</p><p style={{color:C.gray,fontSize:10,margin:0}}>Walk</p></div>
      </div>
      <div style={{...S.card(),marginBottom:8,fontSize:11,fontFamily:"monospace",lineHeight:1.8}}>
        <div style={{color:C.blue}}>📍 You: {fmtCoord(uLat)}, {fmtCoord(uLng)}</div>
        <div style={{color:C.gold}}>🎯 {vol.name?.split(" ")[0]}: {fmtCoord(vLat)}, {fmtCoord(vLng)}</div>
      </div>
      <div style={{background:C.navyLight,borderRadius:12,height:170,marginBottom:10,position:"relative",overflow:"hidden"}}>
        {[1,2,3].map(r=><div key={r} style={{position:"absolute",top:"50%",left:"50%",width:r*52,height:r*52,marginLeft:-(r*26),marginTop:-(r*26),border:`1px solid rgba(148,163,184,0.2)`,borderRadius:"50%"}}/>)}
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:C.blue,border:`2px solid ${C.white}`,margin:"0 auto"}}/>
          <p style={{fontSize:9,color:C.blue,margin:"2px 0 0",fontWeight:700}}>You</p>
        </div>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:`rotate(${deg}deg) translateY(-68px) rotate(${-deg}deg) translate(-50%,-50%)`,textAlign:"center"}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:C.gold,border:`2px solid ${C.navy}`,margin:"0 auto"}}/>
          <p style={{fontSize:9,color:C.gold,fontWeight:700,margin:"2px 0 0",whiteSpace:"nowrap"}}>{vol.name?.split(" ")[0]}</p>
        </div>
      </div>
      <button style={S.btn(C.gold,C.navy)} onClick={()=>window.open(osmUrl,"_blank")}>🧭 Navigate (OpenStreetMap)</button>
      <button style={S.btn(C.red,C.white)} onClick={()=>window.open(`tel:${vol.phone}`,"_self")}>📞 Call {vol.name?.split(" ")[0]}</button>
    </div>
  );
}

function CampusMapScreen({setScreen}){
  const bbox=`${CAMPUS_CENTER.lng-0.006},${CAMPUS_CENTER.lat-0.004},${CAMPUS_CENTER.lng+0.006},${CAMPUS_CENTER.lat+0.004}`;
  return(
    <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("home")}>← Back</button>
      <div style={S.sHead}>🗺️ Campus Map — PSG CAS</div>
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

function GuideScreen({setScreen,canEdit}){
  const[guide,setGuide]=useState([...guideStore.data]);
  const[selected,setSelected]=useState(null);
  const[editing,setEditing]=useState(null);
  const[editForm,setEditForm]=useState({title:"",steps:""});
  if(selected!==null){
    const item=guide[selected];
    return(
      <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
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
          <button style={{...S.btn(C.navyLight,C.white),marginBottom:8}} onClick={()=>{setEditing(item);setEditForm({title:item.title,steps:item.steps.join("\n")});setSelected(null);}}>✏️ Edit This Card</button>
        )}
        <button style={S.btn(C.red,C.white)} onClick={()=>window.open("tel:108","_self")}>🚑 Call Ambulance 108</button>
      </div>
    );
  }
  return(
    <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      {!canEdit&&<button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("home")}>← Back</button>}
      <div style={S.sHead}>🩺 First Aid Guide</div>
      <div style={{...S.card(),marginBottom:10,background:"#1a2d1a",border:`1px solid ${C.green}`}}>
        <p style={{color:"#86efac",fontSize:12,margin:0}}>⚠️ Always call 108 in a real emergency.</p>
      </div>
      {guide.map((item,i)=>(
        <button key={item.id} style={{...S.card(),width:"100%",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:12}} onClick={()=>setSelected(i)}>
          <span style={{fontSize:24,flexShrink:0}}>{item.icon}</span>
          <div style={{flex:1}}><p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{item.title}</p><p style={{fontSize:11,color:C.gray,margin:"2px 0 0"}}>{item.steps.length} steps</p></div>
          <span style={{color:C.gold,fontSize:16}}>›</span>
        </button>
      ))}
      {editing&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:500,padding:16,overflowY:"auto"}}>
          <div style={{background:C.navyMid,borderRadius:14,padding:20,width:"100%",maxWidth:380,marginTop:16}}>
            <p style={{color:C.white,fontWeight:700,fontSize:15,marginBottom:4}}>✏️ Edit Card</p>
            <span style={S.label}>Title</span>
            <input style={S.input} value={editForm.title} onChange={e=>setEditForm(p=>({...p,title:e.target.value}))}/>
            <span style={S.label}>Steps — one per line</span>
            <textarea style={{...S.input,minHeight:160,resize:"vertical"}} value={editForm.steps} onChange={e=>setEditForm(p=>({...p,steps:e.target.value}))}/>
            <div style={{display:"flex",gap:8}}>
              <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1}} onClick={()=>setEditing(null)}>Cancel</button>
              <button style={{...S.btn(C.gold,C.navy),marginBottom:0,flex:1}} onClick={()=>{
                const stepsArr=editForm.steps.split("\n").map(s=>s.trim()).filter(Boolean);
                const u=guide.map(x=>x.id===editing.id?{...x,title:editForm.title,steps:stepsArr}:x);
                guideStore.data=u;setGuide(u);setEditing(null);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactsScreen({canEdit,setScreen}){
  const[contacts,setContacts]=useState([...contactsStore.data]);
  const[editKey,setEditKey]=useState(null);
  const[ef,setEf]=useState({icon:"",label:"",number:"",desc:""});
  const[adding,setAdding]=useState(false);
  function persist(next){contactsStore.data=next;setContacts([...next]);}
  function save(){if(!ef.label||!ef.number)return;adding?persist([...contacts,{key:`c-${Date.now()}`,icon:ef.icon||"📞",label:ef.label,number:ef.number,desc:ef.desc}]):persist(contacts.map(c=>c.key===editKey?{...c,...ef}:c));setEditKey(null);}
  return(
    <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
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

function LoginScreen({onLoggedIn,setScreen,sessionStore}){
  const[email,setEmail]=useState("");
  const[err,setErr]=useState("");
  function handle(){
    const t=email.trim().toLowerCase();
    if(!t.includes("@")||!t.includes(".")){setErr("Enter a valid email.");return;}
    const existing=sessionStore.get();
    const profile=(existing&&existing.email===t)?existing:{email:t,registered:false,name:"",approved:false};
    sessionStore.set(profile);onLoggedIn(profile);
  }
  return(
    <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      <button style={{...S.btnSm(C.navyLight,C.white),marginBottom:12}} onClick={()=>setScreen("home")}>← Back</button>
      <div style={S.sHead}>🔑 Volunteer Login</div>
      <div style={{...S.card(),marginBottom:12}}><p style={{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}}>Your profile is saved permanently in Supabase.</p></div>
      <span style={S.label}>Email ID</span>
      <input style={S.input} type="email" placeholder="yourname@psgcas.edu.in" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}/>
      {err&&<p style={S.err}>{err}</p>}
      <button style={S.btn(C.gold,C.navy)} onClick={handle}>Continue with Email →</button>
    </div>
  );
}

function ProfileScreen({session,setScreen,volunteers,setVolunteers,onSessionUpdate,sessionStore}){
  const vol=session?volunteers.find(v=>v.email===session.email):null;
  const[editing,setEditing]=useState(false);
  const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({name:vol?.name||"",phone:vol?.phone||"",department:vol?.department||"",year:vol?.year||"",occupation:vol?.occupation||"",remarks:vol?.remarks||""});
  if(!session)return(
    <div style={S.screen}>
      <div style={{...S.card(),textAlign:"center",padding:32}}>
        <p style={{fontSize:32,margin:"0 0 12px"}}>👤</p>
        <p style={{color:C.gray,fontSize:13,marginBottom:14}}>Please login to view your profile.</p>
        <button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("login")}>Login / Register</button>
      </div>
    </div>
  );
  if(!vol)return(
    <div style={S.screen}>
      <div style={{...S.card(),textAlign:"center",padding:32}}>
        <p style={{fontSize:32,margin:"0 0 12px"}}>📝</p>
        <p style={{color:C.gray,fontSize:13,marginBottom:6}}>Not registered as volunteer yet.</p>
        <p style={{color:C.gold,fontSize:12,marginBottom:14}}>{session.email}</p>
        <button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("register")}>Register Now</button>
        <button style={{...S.btn(C.navyLight,C.white),marginTop:4}} onClick={()=>{sessionStore.set(null);onSessionUpdate(null);setScreen("home");}}>🚪 Logout</button>
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
    try{await db.updateVolunteer(vol.id,form);setVolunteers(p=>p.map(v=>v.id===vol.id?{...v,...form}:v));const s={...session,name:form.name};sessionStore.set(s);onSessionUpdate(s);setEditing(false);}
    catch(e){alert(e.message);}
    setSaving(false);
  }
  return(
    <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      <div style={S.sHead}>👤 My Profile</div>
      <div style={{...S.card(C.gold),marginBottom:10}}>
        <div style={{...S.row,marginBottom:10}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:C.navy,flexShrink:0}}>{vol.name?.charAt(0)||"?"}</div>
          <div style={{flex:1}}><p style={{fontSize:16,fontWeight:800,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:"2px 0 0"}}>{vol.email}</p></div>
          <span style={S.badge(vol.approved)}>{vol.approved?"✅ Approved":"⏳ Pending"}</span>
        </div>
        <button style={{...S.btn(isOnline?"#14532d":"#1a3a1a","#86efac"),marginBottom:0,border:`1px solid ${isOnline?C.green:"#166534"}`}} onClick={toggleAvail} disabled={saving}>
          {saving?"Saving...":(isOnline?"🟢 Mark Unavailable":"🔴 Mark Available")}
        </button>
      </div>
      <button style={{...S.btn(C.navyLight,C.white),border:`1px solid ${C.navyLight}`}} onClick={()=>setScreen("myAlerts")}>🔔 My Notifications</button>
      {!editing?(
        <div style={S.card()}>
          {[["📞 Phone",vol.phone],["🏢 Dept",vol.department],["📅 Year",vol.year],["💼 Occupation",vol.occupation],["📋 Training",vol.remarks]].map(([l,v])=>v?(
            <div key={l} style={{marginBottom:8}}><span style={{...S.label,marginTop:0}}>{l}</span><p style={{color:C.white,fontSize:13,margin:0}}>{v}</p></div>
          ):null)}
          <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,marginTop:10}} onClick={()=>setEditing(true)}>✏️ Edit My Details</button>
        </div>
      ):(
        <div style={S.card()}>
          {[["Name","name","text"],["Phone","phone","tel"],["Department","department","text"],["Year","year","text"],["Occupation","occupation","text"],["Training Details","remarks","text"]].map(([l,k,t])=>(
            <div key={k}><span style={S.label}>{l}</span><input style={S.input} type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.btn(C.navyLight,C.white),marginBottom:0,flex:1}} onClick={()=>setEditing(false)}>Cancel</button>
            <button style={{...S.btn(C.gold,C.navy),marginBottom:0,flex:1}} onClick={saveEdit} disabled={saving}>{saving?"Saving...":"Save"}</button>
          </div>
        </div>
      )}
      <button style={{...S.btn(C.navyLight,C.white),marginTop:4,border:`1px solid ${C.red}`,color:"#fca5a5"}} onClick={()=>{sessionStore.set(null);onSessionUpdate(null);setScreen("home");}}>🚪 Logout</button>
    </div>
  );
}

function RegisterScreen({setScreen,session,onRegistered,userLoc,sessionStore}){
  const[form,setForm]=useState({name:session?.name||"",email:session?.email||"",roll:"",phone:"",department:"",year:"",occupation:"",first_aid_trained:null,first_aid_certified:null,remarks:""});
  const[done,setDone]=useState(false);
  const[loading,setLoading]=useState(false);
  const[errs,setErrs]=useState({});
  function upd(k,v){setForm(p=>({...p,[k]:v}));setErrs(p=>({...p,[k]:null}));}
  function validate(){const e={};if(!form.name.trim())e.name="Required";if(!form.email.includes("@"))e.email="Valid email required";if(!form.phone.trim())e.phone="Required";if(!form.remarks.trim())e.remarks="Required";if(form.first_aid_certified===null)e.cert="Required";setErrs(e);return Object.keys(e).length===0;}
  async function submit(){
    if(!validate())return;setLoading(true);
    try{
      await db.addVolunteer({name:form.name,roll:form.roll,email:form.email,phone:form.phone,department:form.department,year:form.year,occupation:form.occupation,first_aid_trained:form.first_aid_trained||false,first_aid_certified:form.first_aid_certified||false,remarks:form.remarks,approved:false,online:false,availability:true,lat:userLoc?.lat||CAMPUS_CENTER.lat,lng:userLoc?.lng||CAMPUS_CENTER.lng});
      const p={...session,registered:true,approved:false,name:form.name};
      sessionStore.set(p);
      pushVolNotif(form.email,{type:"registered",message:"📝 Registration submitted! Admin will review soon.",volName:form.name});
      playSound("call");
      onRegistered(p);setDone(true);
    }catch(e){alert("Error: "+e.message);}
    setLoading(false);
  }
  if(done)return(
    <div style={{...S.screen,textAlign:"center"}}>
      <div style={{fontSize:60,marginBottom:14}}>✅</div>
      <p style={{color:C.gold,fontSize:20,fontWeight:800,marginBottom:8}}>Application Submitted!</p>
      <button style={S.btn(C.gold,C.navy)} onClick={()=>setScreen("myAlerts")}>🔔 View My Notifications</button>
      <button style={S.btn(C.navyLight,C.white)} onClick={()=>setScreen("home")}>Back to Home</button>
    </div>
  );
  return(
    <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      <div style={S.sHead}>📝 Volunteer Registration</div>
      {[["Full Name *","name","text"],["Roll Number","roll","text"],["Email *","email","email"],["Phone *","phone","tel"],["Department","department","text"],["Year","year","text"],["Occupation","occupation","text"]].map(([l,k,t])=>(
        <div key={k}><span style={S.label}>{l}</span><input style={S.input} type={t} value={form[k]} onChange={e=>upd(k,e.target.value)}/>{errs[k]&&<p style={S.err}>{errs[k]}</p>}</div>
      ))}
      <span style={S.label}>First Aid Training?</span>
      <div style={{marginBottom:10}}>{[true,false].map(v=><button key={String(v)} style={S.chip(form.first_aid_trained,v)} onClick={()=>upd("first_aid_trained",v)}>{v?"Yes":"No"}</button>)}</div>
      <span style={S.label}>First Aid Certificate? *</span>
      <div style={{marginBottom:10}}>{[true,false].map(v=><button key={String(v)} style={S.chip(form.first_aid_certified,v)} onClick={()=>upd("first_aid_certified",v)}>{v?"Yes":"No"}</button>)}{errs.cert&&<p style={S.err}>{errs.cert}</p>}</div>
      <span style={S.label}>Training Details *</span>
      <input style={S.input} value={form.remarks} onChange={e=>upd("remarks",e.target.value)} placeholder="e.g. Red Cross Basic First Aid, 2024"/>
      {errs.remarks&&<p style={S.err}>{errs.remarks}</p>}
      <button style={S.btn(C.gold,C.navy)} onClick={submit} disabled={loading}>{loading?"Saving...":"Submit Application"}</button>
      <button style={S.btn(C.navyLight,C.white)} onClick={()=>setScreen("home")}>Cancel</button>
    </div>
  );
}

function MyAlertsScreen({session}){
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
      <div style={S.sHead}>🔔 My Notifications</div>
      <div style={{...S.card(),textAlign:"center",padding:32}}><p style={{fontSize:32,margin:"0 0 10px"}}>🔒</p><p style={{color:C.gray,fontSize:13}}>Login to see notifications.</p></div>
    </div>
  );
  return(
    <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={S.sHead}>🔔 My Notifications</div>
        {notifs.length>0&&<button style={S.btnSm(C.navyLight,C.gray)} onClick={clearAll}>Clear All</button>}
      </div>
      {unread>0&&<div style={{...S.card(C.gold),marginBottom:8,textAlign:"center"}}><p style={{color:C.gold,fontWeight:800,fontSize:13,margin:0}}>🔔 {unread} unread</p></div>}
      {notifs.length===0&&<div style={{...S.card(),textAlign:"center",padding:28}}><p style={{fontSize:32,margin:"0 0 8px"}}>🔔</p><p style={{color:C.gray,fontSize:13}}>No notifications yet.</p></div>}
      {notifs.map(n=>(
        <div key={n.id} onClick={()=>markRead(n.id)} style={{...S.card(n.type==="sos"||n.type==="call"?C.red:C.gold),background:n.read?C.navyMid:n.type==="sos"?"#2d0a0a":"#1a1400",cursor:"pointer",marginBottom:8}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:20,flexShrink:0}}>{iconFor(n.type)}</span>
            <div style={{flex:1}}>
              {!n.read&&<span style={{fontSize:9,background:C.red,color:C.white,padding:"1px 6px",borderRadius:10,fontWeight:800,display:"inline-block",marginBottom:2}}>NEW</span>}
              <p style={{color:C.white,fontSize:13,margin:"2px 0",fontWeight:n.read?400:600}}>{n.message}</p>
              {n.userLoc&&<p style={{color:"#fbbf24",fontSize:10,margin:"0 0 2px",fontFamily:"monospace"}}>📍 {fmtCoord(n.userLoc.lat)}, {fmtCoord(n.userLoc.lng)}</p>}
              {n.userPhone&&<p style={{color:"#86efac",fontSize:11,margin:"0 0 6px",fontWeight:700}}>📞 {n.userPhone}</p>}
              <p style={{color:C.gray,fontSize:10,margin:0}}>{n.time}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminAlerts(){
  const[alerts,setAlerts]=useState([...gAlerts]);
  useEffect(()=>subAlerts(a=>setAlerts([...a])),[]);
  const icon=t=>({call:"📞",map:"🗺",sos:"🚨",approved:"✅",rejected:"❌",broadcast:"📢",registered:"📝"}[t]||"🔔");
  if(!alerts.length)return<div style={{...S.card(),textAlign:"center",padding:28}}><p style={{fontSize:28,margin:"0 0 8px"}}>🔔</p><p style={{color:C.gray,fontSize:13}}>No alerts yet.</p></div>;
  return(
    <div>
      {alerts.map(a=>(
        <div key={a.id} style={{...S.card(a.type==="sos"||a.type==="call"?C.red:C.gold),background:a.read?C.navyMid:"#1a1400",cursor:"pointer",marginBottom:8}} onClick={()=>{}}>
          <div style={S.row}>
            <span style={{fontSize:20}}>{icon(a.type)}</span>
            <div style={{flex:1}}>
              <p style={{color:C.white,fontSize:12,margin:"3px 0"}}>{a.message}</p>
              {a.userPhone&&<p style={{color:"#86efac",fontSize:11,margin:"0 0 2px",fontWeight:700}}>📞 {a.userPhone}</p>}
              {a.userLoc&&<p style={{color:"#fbbf24",fontSize:10,margin:"0 0 2px",fontFamily:"monospace"}}>📍 {fmtCoord(a.userLoc.lat)}, {fmtCoord(a.userLoc.lng)}</p>}
              <p style={{color:C.gray,fontSize:10,margin:0}}>{a.volName} · {a.time}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminScreen({volunteers,setVolunteers,sosToday}){
  const[tab,setTab]=useState("alerts");
  const[username,setUsername]=useState("");
  const[pin,setPin]=useState("");
  const[unlocked,setUnlocked]=useState(false);
  const[badge,setBadge]=useState(0);
  const[bcast,setBcast]=useState("");
  const[busy,setBusy]=useState(false);
  const[loginErr,setLoginErr]=useState("");
  useEffect(()=>subAlerts(a=>setBadge(a.filter(x=>!x.read).length)),[]);
  if(!unlocked)return(
    <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      <div style={S.sHead}>🔐 Admin Access</div>
      <div style={{...S.card(),textAlign:"center",padding:28}}>
        <span style={S.label}>Username</span>
        <input style={S.input} type="text" placeholder="Admin username" value={username} onChange={e=>{setUsername(e.target.value);setLoginErr("");}}/>
        <span style={S.label}>Password</span>
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
      pushVolNotif(vol.email,{type:"approved",message:"✅ Your application has been approved!",volName:vol.name});
      playSound("call");
    }catch(e){alert(e.message);}
    setBusy(false);
  }
  async function reject(vol){
    if(!window.confirm(`Reject ${vol.name}?`))return;setBusy(true);
    try{
      await db.deleteVolunteer(vol.id);
      setVolunteers(p=>p.filter(v=>v.id!==vol.id));
      sendAlert(vol,"rejected");
    }catch(e){alert(e.message);}
    setBusy(false);
  }
  async function remove(vol){
    if(!window.confirm(`Remove ${vol.name}?`))return;setBusy(true);
    try{await db.deleteVolunteer(vol.id);setVolunteers(p=>p.filter(v=>v.id!==vol.id));}catch(e){alert(e.message);}
    setBusy(false);
  }
  function broadcast(){
    if(!bcast.trim())return;
    approved.forEach(v=>{sendAlert(v,"broadcast",{message:bcast});pushVolNotif(v.email,{type:"broadcast",message:`📢 Admin: ${bcast}`,volName:v.name});});
    playSound("sos");setBcast("");alert(`Broadcast sent to ${approved.length} volunteer(s).`);
  }
  const tabs=[{k:"alerts",l:`🔔 Alerts${badge>0?` (${badge})`:""}`},{k:"pending",l:`⏳ Pending (${pending.length})`},{k:"approved",l:`✅ Approved (${approved.length})`},{k:"contacts",l:"📞 Contacts"},{k:"guide",l:"🩺 Guide"},{k:"broadcast",l:"📢 Broadcast"}];
  return(
    <div style={{...S.screen,animation:"fadeUp 0.3s ease"}}>
      <div style={S.sHead}>🛡 Admin Dashboard</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {tabs.map(({k,l})=><button key={k} style={{...S.btnSm(tab===k?C.gold:C.navyLight,tab===k?C.navy:C.white),border:`1px solid ${tab===k?C.gold:C.navyLight}`,marginBottom:4}} onClick={()=>setTab(k)}>{l}</button>)}
      </div>
      {tab==="alerts"&&<AdminAlerts/>}
      {tab==="contacts"&&<ContactsScreen canEdit={true} setScreen={()=>{}}/>}
      {tab==="guide"&&<GuideScreen setScreen={()=>{}} canEdit={true}/>}
      {tab==="broadcast"&&(
        <div style={S.card()}>
          <span style={S.label}>Broadcast Message</span>
          <textarea style={{...S.input,minHeight:80,resize:"vertical"}} value={bcast} onChange={e=>setBcast(e.target.value)} placeholder="e.g. Campus emergency drill at 3 PM."/>
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
                <div style={{flex:1}}><p style={{fontSize:14,fontWeight:700,color:C.white,margin:0}}>{vol.name}</p><p style={{fontSize:11,color:C.gray,margin:0}}>{vol.email}</p></div>
                {vol.approved&&<span style={S.badge(vol.online)}>{vol.online?"Online":"Offline"}</span>}
              </div>
              <div style={{fontSize:11,color:C.gray,marginBottom:8,lineHeight:1.8}}>
                <p style={{margin:0}}>📞 {vol.phone}</p>
                <p style={{margin:0}}>🏅 Certified: {vol.first_aid_certified?"Yes ✅":"No ❌"}</p>
                {vol.remarks&&<p style={{margin:0}}>📋 {vol.remarks}</p>}
              </div>
              <div style={{display:"flex",gap:8}}>
                {!vol.approved&&<button style={{...S.btnSm(C.green,C.white),flex:1,padding:10}} onClick={()=>approve(vol)} disabled={busy}>✓ Approve</button>}
                <button style={{...S.btnSm(C.red,C.white),flex:1,padding:10}} onClick={()=>vol.approved?remove(vol):reject(vol)} disabled={busy}>{vol.approved?"🗑 Remove":"✗ Reject"}</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default function App(){
  const sessionRef=useRef(null);
  const sessionStore={get:()=>sessionRef.current,set:(v)=>{sessionRef.current=v;}};
  const[lang,setLang]=useState("en");
  const toggleLang=()=>setLang(l=>l==="en"?"ta":"en");
  const[step,setStep]=useState("location");
  const[screen,setScreen]=useState("home");
  const[userLoc,setUserLoc]=useState(null);
  const[userPhone,setUserPhone]=useState("");
  const[userName,setUserName]=useState("");
  const[selectedVol,setSelectedVol]=useState(null);
  const[toast,setToast]=useState(null);
  const[badge,setBadge]=useState(0);
  const[session,setSession]=useState(null);
  const[volunteers,setVolunteers]=useState([]);
  const[sosToday,setSosToday]=useState(0);
  const volIdRef=useRef(null);

  const refreshVols=useCallback(()=>{db.getVolunteers().then(d=>setVolunteers(d)).catch(()=>{});},[]);
  useEffect(()=>{if(step==="app"){refreshVols();const t=setInterval(refreshVols,30000);return()=>clearInterval(t);}},[step,refreshVols]);

  useEffect(()=>{
    if(step!=="app"||!navigator.geolocation)return;
    const id=navigator.geolocation.watchPosition(p=>setUserLoc({lat:p.coords.latitude,lng:p.coords.longitude}),null,{enableHighAccuracy:true,maximumAge:30000});
    return()=>navigator.geolocation.clearWatch(id);
  },[step]);

  useEffect(()=>{
    if(!session?.email||step!=="app"||!navigator.geolocation)return;
    const vol=volunteers.find(v=>v.email===session.email&&v.approved);
    if(!vol)return;
    volIdRef.current=vol.id;
    const wid=navigator.geolocation.watchPosition(pos=>{
      const{latitude:lat,longitude:lng}=pos.coords;
      db.updateVolunteer(volIdRef.current,{lat,lng,online:true,loc_updated_at:new Date().toISOString()}).catch(()=>{});
      setVolunteers(p=>p.map(x=>x.id===volIdRef.current?{...x,lat,lng}:x));
    },null,{enableHighAccuracy:true,maximumAge:30000});
    return()=>navigator.geolocation.clearWatch(wid);
  },[session?.email,volunteers.length,step]);

  useEffect(()=>subAlerts(alerts=>{
    setBadge(alerts.filter(a=>!a.read).length);
    const l=alerts[0];
    if(l){setToast(l);setTimeout(()=>setToast(null),4500);}
  }),[]);

  function onLocation(loc){setUserLoc(loc);setStep("phone");}
  function onPhone(name,phone){setUserName(name);setUserPhone(phone);setStep("app");}
  function triggerSOS(){
    const nearby=volunteers.filter(v=>v.approved&&v.online&&v.availability).map(v=>({...v,distance:userLoc&&v.lat?haversine(userLoc.lat,userLoc.lng,parseFloat(v.lat),parseFloat(v.lng)):9999})).filter(v=>v.distance<=CAMPUS_RADIUS_KM*1000).sort((a,b)=>a.distance-b.distance);
    if(!nearby.length){alert("No volunteers nearby! Please call Emergency Contacts.");setScreen("contacts");return;}
    nearby.forEach(v=>{
      sendAlert(v,"sos",{userLoc,userPhone,userName});
      pushVolNotif(v.email,{type:"sos",message:`🚨 SOS from ${userName||"Someone"}! Call: ${userPhone}`,volName:v.name,userLoc,userPhone});
    });
    playSound("sos");setSosToday(c=>c+1);
    alert(`🚨 SOS sent to ${nearby.length} volunteer(s)!\nYour name (${userName}) and number (${userPhone}) were shared.`);
  }

  if(step==="location")return<LocationGate onEnable={onLocation} lang={lang} onToggle={toggleLang}/>;
  if(step==="phone")return(
    <div style={{...S.app,display:"flex",flexDirection:"column"}}>
      <style>{css}</style>
      <Header lang={lang} onToggle={toggleLang}/>
      <PhoneGate onSave={onPhone} lang={lang}/>
    </div>
  );

  const myNotifCount=session?.email?getVolNotifs(session.email).filter(n=>!n.read).length:0;
  const navItems=[
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
    contacts:<ContactsScreen canEdit={false} setScreen={setScreen}/>,
    guide:<GuideScreen setScreen={setScreen} canEdit={false}/>,
    myAlerts:<MyAlertsScreen session={session}/>,
    login:<LoginScreen onLoggedIn={p=>{setSession(p);sessionStore.set(p);setScreen(p.registered?"profile":"register");}} setScreen={setScreen} sessionStore={sessionStore}/>,
    profile:<ProfileScreen session={session} setScreen={setScreen} volunteers={volunteers} setVolunteers={setVolunteers} onSessionUpdate={s=>{setSession(s);sessionStore.set(s);}} sessionStore={sessionStore}/>,
    register:session?<RegisterScreen setScreen={setScreen} session={session} onRegistered={p=>{setSession(p);sessionStore.set(p);refreshVols();}} userLoc={userLoc} sessionStore={sessionStore}/>:<LoginScreen onLoggedIn={p=>{setSession(p);sessionStore.set(p);setScreen("register");}} setScreen={setScreen} sessionStore={sessionStore}/>,
    admin:<AdminScreen volunteers={volunteers} setVolunteers={setVolunteers} sosToday={sosToday}/>,
  };

  return(
    <div style={S.app}>
      <style>{css}</style>
      {toast&&(
        <div style={{position:"fixed",top:85,left:"50%",transform:"translateX(-50%)",zIndex:999,width:"90%",maxWidth:390,background:(toast.type==="call"||toast.type==="sos")?"#7f1d1d":"#1a1400",border:`2px solid ${(toast.type==="sos"||toast.type==="call")?C.red:C.gold}`,borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,animation:"toastIn 0.3s ease",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
          <span style={{fontSize:20}}>{toast.type==="sos"?"🆘":toast.type==="call"?"📞":"📢"}</span>
          <div style={{flex:1}}><p style={{color:C.white,fontSize:12,margin:0}}>{toast.message}</p></div>
          <button onClick={()=>setToast(null)} style={{background:"none",border:"none",color:C.gray,fontSize:16,cursor:"pointer",padding:0}}>✕</button>
        </div>
      )}
      <Header lang={lang} onToggle={toggleLang}/>
      <LocationBanner userLoc={userLoc}/>
      <div>{screens[screen]||screens.home}</div>
      <nav style={S.navBar}>
        {navItems.map(n=>(
          <button key={n.id} style={S.navBtn(screen===n.id)} onClick={()=>setScreen(n.id)}>
            <span style={{fontSize:19,position:"relative",display:"inline-block"}}>
              {n.icon}
              {n.badge>0&&<span style={{position:"absolute",top:-3,right:-5,background:C.red,color:C.white,borderRadius:"50%",fontSize:8,fontWeight:800,width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{n.badge}</span>}
            </span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
