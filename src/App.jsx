const { useState, useEffect, useRef, useCallback } = React;

const SUPABASE_URL = "https://qyoektirhvroaarnzazy.supabase.co";
const SUPABASE_KEY = "sb_publishable_3LBPKOMdfUMeEkguQO98ug_7jcYg9ct";
const ADMIN_USERNAME = "aga2026";
const ADMIN_PIN = "6202csacgspaga";
const CAMPUS_CENTER = { lat: 11.0345, lng: 77.0355 };
const CAMPUS_RADIUS_KM = 2.0;
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
  { id:"bls", icon:"🫀", title:"Basic Life Support", steps:["Ensure scene safety.","Tap shoulders: 'Are you okay?'","Call 108 immediately.","Head Tilt–Chin Lift. Check breathing 10 sec.","Not breathing → CPR."] },
  { id:"cpr", icon:"❤️", title:"CPR", steps:["Heel of hand on center of chest.","30 compressions, 5cm deep, 100–120/min.","2 rescue breaths.","Repeat 30:2 until help arrives."] },
  { id:"choking", icon:"😮", title:"Choking", steps:["Encourage forceful coughing.","5 sharp back blows.","5 abdominal thrusts.","If unconscious → CPR."] },
  { id:"fracture", icon:"🦴", title:"Fractures", steps:["Keep injured area still.","Do NOT straighten the bone.","Apply ice wrapped in cloth.","Seek medical help."] },
  { id:"bleeding", icon:"🩸", title:"Severe Bleeding", steps:["Apply direct pressure.","Elevate above heart.","Tourniquet if life-threatening.","Call 108."] },
  { id:"burns", icon:"🔥", title:"Burns", steps:["Remove from heat source.","Cool with running water 20 min.","Do NOT apply butter or oil.","Cover loosely."] },
  { id:"seizure", icon:"⚡", title:"Seizures", steps:["Move dangerous objects away.","Cushion the head.","Do NOT restrain.","Call 108 if >5 min."] },
  { id:"heartattack", icon:"💔", title:"Heart Attack", steps:["Call 108 immediately.","Help person sit comfortably.","Loosen tight clothing.","If unconscious → CPR."] },
  { id:"snakebite", icon:"🐍", title:"Snake Bite", steps:["Keep victim calm.","Wash bite gently.","Keep limb BELOW heart.","Call 108 — do NOT cut or suck."] },
  { id:"fire", icon:"🚒", title:"Fire Emergency", steps:["Activate fire alarm.","Use stairs NOT elevator.","Crawl below smoke.","STOP–DROP–ROLL if on fire."] },
];

const DEFAULT_CONTACTS = [
  { key:"ambulance", icon:"🚑", label:"Ambulance", number:"108", desc:"National Emergency" },
  { key:"hospital", icon:"🏥", label:"Hospital", number:"+914222572180", desc:"Nearest Govt. Hospital" },
  { key:"security", icon:"🔐", label:"College Security", number:"+914222572177", desc:"PSG CAS Security" },
  { key:"fire", icon:"🚒", label:"Fire Service", number:"101", desc:"Fire Emergency" },
  { key:"medical", icon:"⚕️", label:"Medical Room", number:"+914222572179", desc:"Campus Medical Center" },
];

function haversine(a,b,c,d){const R=6371000,r=x=>x*Math.PI/180,dL=r(c-a),dG=r(d-b),s=Math.sin(dL/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dG/2)**2;return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));}
function fmtDist(m){return m<1000?`${Math.round(m)}m`:`${(m/1000).toFixed(1)}km`;}
function fmtCoord(n){return n!=null?parseFloat(n).toFixed(5):"—";}

function playBeep(){try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=880;g.gain.setValueAtTime(0.3,ctx.currentTime);g.gain.linearRampToValueAtTime(0,ctx.currentTime+0.5);o.start();o.stop(ctx.currentTime+0.5);}catch(e){}}

let gAlerts=[], aListeners=[];
function subAlerts(fn){aListeners.push(fn);return()=>{aListeners=aListeners.filter(l=>l!==fn);};}
function pushGAlert(a){gAlerts=[a,...gAlerts].slice(0,50);aListeners.forEach(fn=>fn([...gAlerts]));}
const volNotifs={};
function getVN(email){return volNotifs[email]||[];}
function pushVN(email,n){if(!email)return;volNotifs[email]=[{...n,id:Date.now()+Math.random(),time:new Date().toLocaleTimeString(),read:false},...getVN(email)].slice(0,50);}
function sendAlert(vol,type,extra={}){
  const msgs={call:"📞 Someone is calling you!",sos:"🚨 SOS ALERT nearby!",approved:"✅ Application approved!",rejected:"❌ Application not approved.",broadcast:extra.message||"📢 Admin broadcast.",registered:"📝 Registration submitted!"};
  const notif={id:Date.now()+Math.random(),volId:vol?.id,volName:vol?.name||"All",type,message:msgs[type]||"Alert",time:new Date().toLocaleTimeString(),read:false,userLoc:extra.userLoc||null,userPhone:extra.userPhone||null};
  pushGAlert(notif);
  if(vol?.email)pushVN(vol.email,notif);
}

const guideData={items:[...FIRST_AID]};
const contactData={items:[...DEFAULT_CONTACTS]};

const C={navy:"#0A1628",navyMid:"#122040",navyLight:"#1A3058",gold:"#D4A017",red:"#C0392B",white:"#FFFFFF",gray:"#94A3B8",green:"#16A34A",blue:"#3B82F6"};
const btn=(bg,fg,mb=10)=>({display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"12px 18px",borderRadius:10,border:"none",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:mb,background:bg,color:fg});
const card=(border)=>({background:C.navyMid,border:`1px solid ${border||C.navyLight}`,borderRadius:12,padding:"14px 15px",marginBottom:10});
const inp={width:"100%",background:C.navyLight,border:`1px solid ${C.navyLight}`,borderRadius:8,padding:"10px 12px",color:C.white,fontSize:14,marginBottom:10,boxSizing:"border-box",outline:"none",fontFamily:"inherit"};
const lbl={fontSize:11,color:C.gold,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4,marginTop:8,display:"block"};
const badge=ok=>({fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:ok?"#14532d":"#7f1d1d",color:ok?"#86efac":"#fca5a5"});
const sHead={fontSize:12,fontWeight:800,color:C.gold,textTransform:"uppercase",letterSpacing:1,marginBottom:12};
const row={display:"flex",gap:8,alignItems:"center"};

const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
body{background:#0A1628;}
input::placeholder,textarea::placeholder{color:#475569;}
input:focus,textarea:focus{border-color:#D4A017!important;}
button:active{transform:scale(0.97);}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:#1A3058;border-radius:4px;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}
`;

function Header({lang, onToggle}) {
  return React.createElement("div", {style:{background:C.navyMid,borderBottom:`2px solid ${C.gold}`,padding:"8px 12px"}},
    React.createElement("div", {style:{display:"flex",justifyContent:"flex-end",marginBottom:4}},
      React.createElement("button", {onClick:onToggle,style:{background:C.navyLight,border:`1px solid ${C.gold}`,borderRadius:20,padding:"3px 10px",color:C.gold,fontSize:10,fontWeight:700,cursor:"pointer"}}, lang==="ta"?"தமிழ் / EN":"EN / தமிழ்")
    ),
    React.createElement("div", {style:{display:"flex",alignItems:"center",gap:8}},
      React.createElement("img", {src:AGA_LOGO,alt:"AGA",style:{width:52,height:52,objectFit:"contain"},onError:e=>{e.target.style.display="none";}}),
      React.createElement("div", {style:{flex:1,textAlign:"center"}},
        React.createElement("p", {style:{fontSize:14,fontWeight:900,color:C.white,margin:0}}, "AGA EMERGENCY RESPONSE"),
        React.createElement("p", {style:{fontSize:9,color:C.gold,fontWeight:700,margin:"2px 0 1px",textTransform:"uppercase"}}, "Alert Golden Army · PSGCAS Chapter"),
        React.createElement("p", {style:{fontSize:8,color:C.gray,margin:0}}, "PSG College of Arts & Science, Coimbatore")
      ),
      React.createElement("img", {src:PSG_LOGO,alt:"PSG",style:{width:46,height:52,objectFit:"contain"},onError:e=>{e.target.style.display="none";}})
    )
  );
}

function PhoneGate({onSave}) {
  const [name,setName] = useState("");
  const [phone,setPhone] = useState("");
  const [errs,setErrs] = useState({});
  function save(){
    const e={};
    if(!name.trim())e.name="Name required";
    if(phone.trim().length<7)e.phone="Valid phone required";
    if(Object.keys(e).length){setErrs(e);return;}
    onSave(name.trim(),phone.trim());
  }
  return React.createElement("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}},
    React.createElement("div",{style:{width:"100%",maxWidth:380,textAlign:"center"}},
      React.createElement("div",{style:{fontSize:48,marginBottom:16}},"📱"),
      React.createElement("p",{style:{fontSize:18,fontWeight:800,color:C.gold,marginBottom:8}},"Your Details"),
      React.createElement("div",{style:{...card(C.gold),textAlign:"left",marginBottom:16}},
        React.createElement("p",{style:{color:C.gray,fontSize:12,margin:0,lineHeight:1.6}},"Your name and phone will be shared with nearby volunteers in an emergency.")
      ),
      React.createElement("span",{style:lbl},"Full Name *"),
      React.createElement("input",{style:inp,type:"text",placeholder:"Your full name",value:name,onChange:e=>{setName(e.target.value);setErrs(p=>({...p,name:null}));}}),
      errs.name&&React.createElement("p",{style:{color:"#fca5a5",fontSize:11,marginTop:-6,marginBottom:8}},errs.name),
      React.createElement("span",{style:lbl},"Phone Number *"),
      React.createElement("input",{style:inp,type:"tel",placeholder:"+91 9XXXXXXXXX",value:phone,onChange:e=>{setPhone(e.target.value);setErrs(p=>({...p,phone:null}));}}),
      errs.phone&&React.createElement("p",{style:{color:"#fca5a5",fontSize:11,marginTop:-6,marginBottom:8}},errs.phone),
      React.createElement("button",{style:btn(C.gold,C.navy),onClick:save},"Save & Continue →")
    )
  );
}

function LocationGate({onEnable,lang,onToggle}) {
  const [err,setErr] = useState(false);
  function tryEnable(){
    setErr(false);
    if(!navigator.geolocation){onEnable(CAMPUS_CENTER);return;}
    navigator.geolocation.getCurrentPosition(
      pos=>onEnable({lat:pos.coords.latitude,lng:pos.coords.longitude}),
      ()=>{setErr(true);onEnable(CAMPUS_CENTER);},
      {enableHighAccuracy:true,timeout:12000}
    );
  }
  return React.createElement("div",{style:{...{fontFamily:"'Inter',system-ui,sans-serif",background:C.navy,minHeight:"100vh",color:C.white,maxWidth:430,margin:"0 auto"},display:"flex",flexDirection:"column"}},
    React.createElement(Header,{lang,onToggle}),
    React.createElement("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}},
      React.createElement("div",{style:{textAlign:"center"}},
        React.createElement("div",{style:{fontSize:52,marginBottom:20}},"🚨"),
        React.createElement("div",{style:{background:"#7f1d1d",border:`1px solid ${C.red}`,borderRadius:14,padding:20,marginBottom:16}},
          React.createElement("p",{style:{color:"#fecaca",fontWeight:700,fontSize:15,margin:"0 0 6px"}},"Location Access Required"),
          React.createElement("p",{style:{color:"#fca5a5",fontSize:13,margin:0,lineHeight:1.5}},"Your location is needed for emergency services.")
        ),
        err&&React.createElement("p",{style:{color:"#fbbf24",fontSize:12,marginBottom:12}},"Location denied — using campus center."),
        React.createElement("button",{style:btn(C.gold,C.navy),onClick:tryEnable},"📍 Enable Location")
      )
    )
  );
}

function HomeScreen({setScreen,onSOS,volunteers,sosToday}) {
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
  return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("button",{onClick:onSOS,style:{...btn(C.red,C.white,14),fontSize:20,fontWeight:900,padding:"22px 18px",borderRadius:16,boxShadow:"0 0 28px rgba(192,57,43,0.55)"}},"🚨 SOS — EMERGENCY"),
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}},
      tiles.map(t=>React.createElement("button",{key:t.to,onClick:()=>setScreen(t.to),style:{...btn(C.navyLight,C.white,0),flexDirection:"column",padding:"14px 8px",gap:4,border:`1px solid ${C.navyLight}`}},
        React.createElement("span",{style:{fontSize:22}},t.icon),
        React.createElement("span",{style:{fontSize:11,lineHeight:1.3}},t.label)
      ))
    ),
    React.createElement("div",{style:sHead},"📊 Dashboard"),
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}},
      [{v:approved.length,l:"Total Volunteers",c:C.gold},{v:active,l:"Active Now",c:C.green},{v:sosToday,l:"SOS Today",c:C.red},{v:volunteers.length,l:"Total Registered",c:C.blue}].map(({v,l,c})=>
        React.createElement("div",{key:l,style:{background:C.navyMid,border:`1px solid ${C.navyLight}`,borderRadius:12,padding:"12px 8px",textAlign:"center"}},
          React.createElement("p",{style:{fontSize:24,fontWeight:900,color:c,margin:0}},v),
          React.createElement("p",{style:{fontSize:10,color:C.gray,margin:"3px 0 0"}},l)
        )
      )
    )
  );
}

function VolunteersScreen({userLoc,setScreen,setSelectedVol,volunteers}) {
  const [filter,setFilter] = useState("all");
  const withDist = volunteers.filter(v=>v.approved).map(v=>({...v,distance:userLoc&&v.lat&&v.lng?haversine(userLoc.lat,userLoc.lng,parseFloat(v.lat),parseFloat(v.lng)):9999})).sort((a,b)=>a.distance-b.distance);
  const filtered = filter==="available"?withDist.filter(v=>v.availability&&v.online):filter==="certified"?withDist.filter(v=>v.first_aid_certified):withDist;
  function callVol(vol){window.location.href=`tel:${vol.phone}`;sendAlert(vol,"call",{userLoc});playBeep();}
  function viewMap(vol){setSelectedVol(vol);setScreen("map");}
  return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("div",{style:sHead},"🆘 Volunteers"),
    React.createElement("div",{style:{marginBottom:12}},
      ["all","available","certified"].map(f=>React.createElement("button",{key:f,onClick:()=>setFilter(f),style:{padding:"6px 12px",borderRadius:20,border:`1px solid ${filter===f?C.gold:C.navyLight}`,background:filter===f?C.gold:C.navyLight,color:filter===f?C.navy:C.gray,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:6,marginBottom:6}},f==="all"?"All":f==="available"?"Available":"Certified"))
    ),
    filtered.length===0&&React.createElement("div",{style:{...card(),textAlign:"center",padding:28}},React.createElement("p",{style:{color:C.gray,fontSize:13}},"No volunteers found.")),
    filtered.map(vol=>React.createElement("div",{key:vol.id,style:card(vol.distance<=CAMPUS_RADIUS_KM*1000?C.gold:C.navyLight)},
      vol.distance<=CAMPUS_RADIUS_KM*1000&&React.createElement("div",{style:{fontSize:10,color:C.gold,fontWeight:800,marginBottom:4}},"📍 WITHIN 2KM"),
      React.createElement("div",{style:{...row,marginBottom:8}},
        React.createElement("div",{style:{width:42,height:42,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:C.navy,flexShrink:0}},vol.name?.charAt(0)||"?"),
        React.createElement("div",{style:{flex:1}},
          React.createElement("p",{style:{fontSize:15,fontWeight:700,color:C.white,margin:0}},vol.name),
          React.createElement("p",{style:{fontSize:11,color:C.gray,margin:"2px 0 0"}},vol.department||vol.occupation||"—")
        ),
        React.createElement("div",{style:{textAlign:"right"}},
          React.createElement("p",{style:{fontSize:20,fontWeight:800,color:C.gold,margin:0}},fmtDist(vol.distance)),
          React.createElement("p",{style:{fontSize:10,color:C.gray}},"away")
        )
      ),
      React.createElement("div",{style:{background:C.navyLight,borderRadius:8,padding:"5px 10px",marginBottom:8,fontSize:11,color:C.gray,fontFamily:"monospace"}},"📍 "+fmtCoord(vol.lat)+", "+fmtCoord(vol.lng)),
      React.createElement("div",{style:{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}},
        React.createElement("span",{style:badge(vol.online)},vol.online?"Online":"Offline"),
        React.createElement("span",{style:badge(vol.availability)},vol.availability?"Available":"Unavailable"),
        React.createElement("span",{style:badge(vol.first_aid_certified)},vol.first_aid_certified?"✓ Certified":"Not Certified")
      ),
      React.createElement("div",{style:{display:"flex",gap:8}},
        React.createElement("button",{style:{...btn(C.red,C.white,0),flex:1,padding:"10px 8px",fontSize:13},onClick:()=>callVol(vol)},"📞 Call"),
        React.createElement("button",{style:{...btn(C.navyLight,C.white,0),flex:1,padding:"10px 8px",fontSize:13,border:`1px solid ${C.gray}`},onClick:()=>viewMap(vol)},"🗺 Map")
      )
    ))
  );
}

function MapScreen({userLoc,selectedVol,setScreen}) {
  const [volLoc,setVolLoc] = useState(selectedVol?{lat:parseFloat(selectedVol.lat||CAMPUS_CENTER.lat),lng:parseFloat(selectedVol.lng||CAMPUS_CENTER.lng)}:null);
  useEffect(()=>{
    if(!selectedVol?.id)return;
    const poll=()=>db.getVolunteers().then(vols=>{const v=vols.find(x=>x.id===selectedVol.id);if(v&&v.lat&&v.lng)setVolLoc({lat:parseFloat(v.lat),lng:parseFloat(v.lng)});}).catch(()=>{});
    poll();const t=setInterval(poll,10000);return()=>clearInterval(t);
  },[selectedVol?.id]);
  if(!selectedVol)return null;
  const vol=selectedVol;
  const uLat=userLoc?.lat||CAMPUS_CENTER.lat,uLng=userLoc?.lng||CAMPUS_CENTER.lng;
  const vLat=volLoc?.lat||CAMPUS_CENTER.lat,vLng=volLoc?.lng||CAMPUS_CENTER.lng;
  const dist=haversine(uLat,uLng,vLat,vLng);
  const osmUrl=`https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${uLat}%2C${uLng}%3B${vLat}%2C${vLng}`;
  return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("button",{style:{padding:"8px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:C.navyLight,color:C.white,marginBottom:12},onClick:()=>setScreen("volunteers")},"← Back"),
    React.createElement("div",{style:sHead},"🗺 Volunteer Location"),
    React.createElement("div",{style:{...card(C.gold),marginBottom:10}},
      React.createElement("p",{style:{fontSize:15,fontWeight:700,color:C.white,margin:0}},vol.name),
      React.createElement("p",{style:{fontSize:11,color:C.gray,margin:0}},vol.department||vol.occupation)
    ),
    React.createElement("div",{style:{display:"flex",gap:8,marginBottom:8}},
      React.createElement("div",{style:{flex:1,background:C.navyMid,border:`1px solid ${C.navyLight}`,borderRadius:12,padding:"12px 8px",textAlign:"center"}},
        React.createElement("p",{style:{color:C.gold,fontWeight:800,fontSize:20,margin:0}},fmtDist(dist)),
        React.createElement("p",{style:{color:C.gray,fontSize:10,margin:0}},"Distance")
      ),
      React.createElement("div",{style:{flex:1,background:C.navyMid,border:`1px solid ${C.navyLight}`,borderRadius:12,padding:"12px 8px",textAlign:"center"}},
        React.createElement("p",{style:{color:C.gold,fontWeight:800,fontSize:20,margin:0}},"~"+Math.max(1,Math.round(dist/80))+" min"),
        React.createElement("p",{style:{color:C.gray,fontSize:10,margin:0}},"Walk")
      )
    ),
    React.createElement("div",{style:{...card(),fontSize:11,fontFamily:"monospace",lineHeight:1.8,marginBottom:10}},
      React.createElement("div",{style:{color:C.blue}},"📍 You: "+fmtCoord(uLat)+", "+fmtCoord(uLng)),
      React.createElement("div",{style:{color:C.gold}},"🎯 "+vol.name?.split(" ")[0]+": "+fmtCoord(vLat)+", "+fmtCoord(vLng))
    ),
    React.createElement("button",{style:btn(C.gold,C.navy),onClick:()=>window.open(osmUrl,"_blank")},"🧭 Navigate (OpenStreetMap)"),
    React.createElement("button",{style:btn(C.red,C.white),onClick:()=>window.open(`tel:${vol.phone}`,"_self")},"📞 Call "+vol.name?.split(" ")[0])
  );
}

function CampusMapScreen({setScreen}) {
  const bbox=`${CAMPUS_CENTER.lng-0.006},${CAMPUS_CENTER.lat-0.004},${CAMPUS_CENTER.lng+0.006},${CAMPUS_CENTER.lat+0.004}`;
  return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("button",{style:{padding:"8px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:C.navyLight,color:C.white,marginBottom:12},onClick:()=>setScreen("home")},"← Back"),
    React.createElement("div",{style:sHead},"🗺️ Campus Map — PSG CAS"),
    React.createElement("div",{style:{borderRadius:12,overflow:"hidden",marginBottom:10,border:`1px solid ${C.gold}`}},
      React.createElement("iframe",{title:"map",width:"100%",height:"230",style:{border:0,display:"block"},src:`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${CAMPUS_CENTER.lat},${CAMPUS_CENTER.lng}`})
    ),
    React.createElement("button",{style:btn(C.gold,C.navy),onClick:()=>window.open(`https://www.openstreetmap.org/?mlat=${CAMPUS_CENTER.lat}&mlon=${CAMPUS_CENTER.lng}#map=17/${CAMPUS_CENTER.lat}/${CAMPUS_CENTER.lng}`,"_blank")},"🌍 Open Full Map")
  );
}

function GuideScreen({setScreen,canEdit}) {
  const [guide,setGuide] = useState([...guideData.items]);
  const [sel,setSel] = useState(null);
  const [editing,setEditing] = useState(null);
  const [ef,setEf] = useState({title:"",steps:""});
  if(sel!==null){
    const item=guide[sel];
    return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
      React.createElement("button",{style:{padding:"8px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:C.navyLight,color:C.white,marginBottom:12},onClick:()=>setSel(null)},"← Back"),
      React.createElement("div",{style:{...card(C.gold),marginBottom:12}},
        React.createElement("p",{style:{fontSize:28,margin:"0 0 6px"}},item.icon),
        React.createElement("p",{style:{fontSize:16,fontWeight:800,color:C.gold,margin:"0 0 12px"}},item.title),
        item.steps.map((step,i)=>React.createElement("div",{key:i,style:{display:"flex",gap:12,marginBottom:10}},
          React.createElement("div",{style:{width:22,height:22,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color:C.navy,flexShrink:0}},i+1),
          React.createElement("p",{style:{color:C.white,fontSize:13,margin:0,lineHeight:1.6}},step)
        ))
      ),
      canEdit&&React.createElement("button",{style:btn(C.navyLight,C.white),onClick:()=>{setEditing(item);setEf({title:item.title,steps:item.steps.join("\n")});setSel(null);}},"✏️ Edit"),
      React.createElement("button",{style:btn(C.red,C.white),onClick:()=>window.open("tel:108","_self")},"🚑 Call 108")
    );
  }
  return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    !canEdit&&React.createElement("button",{style:{padding:"8px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:C.navyLight,color:C.white,marginBottom:12},onClick:()=>setScreen("home")},"← Back"),
    React.createElement("div",{style:sHead},"🩺 First Aid Guide"),
    guide.map((item,i)=>React.createElement("button",{key:item.id,style:{...card(),width:"100%",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:12},onClick:()=>setSel(i)},
      React.createElement("span",{style:{fontSize:24,flexShrink:0}},item.icon),
      React.createElement("div",{style:{flex:1}},
        React.createElement("p",{style:{fontSize:14,fontWeight:700,color:C.white,margin:0}},item.title),
        React.createElement("p",{style:{fontSize:11,color:C.gray,margin:"2px 0 0"}},item.steps.length+" steps")
      ),
      React.createElement("span",{style:{color:C.gold,fontSize:16}},"›")
    )),
    editing&&React.createElement("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16}},
      React.createElement("div",{style:{background:C.navyMid,borderRadius:14,padding:20,width:"100%",maxWidth:380}},
        React.createElement("p",{style:{color:C.white,fontWeight:700,fontSize:15,marginBottom:8}},"✏️ Edit Card"),
        React.createElement("span",{style:lbl},"Title"),
        React.createElement("input",{style:inp,value:ef.title,onChange:e=>setEf(p=>({...p,title:e.target.value}))}),
        React.createElement("span",{style:lbl},"Steps (one per line)"),
        React.createElement("textarea",{style:{...inp,minHeight:140,resize:"vertical"},value:ef.steps,onChange:e=>setEf(p=>({...p,steps:e.target.value}))}),
        React.createElement("div",{style:{display:"flex",gap:8}},
          React.createElement("button",{style:{...btn(C.navyLight,C.white,0),flex:1},onClick:()=>setEditing(null)},"Cancel"),
          React.createElement("button",{style:{...btn(C.gold,C.navy,0),flex:1},onClick:()=>{const stepsArr=ef.steps.split("\n").map(s=>s.trim()).filter(Boolean);const u=guide.map(x=>x.id===editing.id?{...x,title:ef.title,steps:stepsArr}:x);guideData.items=u;setGuide(u);setEditing(null);}},"Save")
        )
      )
    )
  );
}

function ContactsScreen({canEdit,setScreen}) {
  const [contacts,setContacts] = useState([...contactData.items]);
  const [editKey,setEditKey] = useState(null);
  const [ef,setEf] = useState({icon:"",label:"",number:"",desc:""});
  const [adding,setAdding] = useState(false);
  function persist(next){contactData.items=next;setContacts([...next]);}
  function save(){if(!ef.label||!ef.number)return;adding?persist([...contacts,{key:`c-${Date.now()}`,icon:ef.icon||"📞",label:ef.label,number:ef.number,desc:ef.desc}]):persist(contacts.map(c=>c.key===editKey?{...c,...ef}:c));setEditKey(null);}
  return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    !canEdit&&React.createElement("button",{style:{padding:"8px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:C.navyLight,color:C.white,marginBottom:12},onClick:()=>setScreen("home")},"← Back"),
    React.createElement("div",{style:sHead},"📞 Emergency Contacts"),
    contacts.map(c=>React.createElement("div",{key:c.key,style:{background:C.red,borderRadius:12,padding:"13px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}},
      React.createElement("span",{style:{fontSize:22,cursor:"pointer"},onClick:()=>window.open(`tel:${c.number}`,"_self")},c.icon),
      React.createElement("div",{style:{flex:1,cursor:"pointer"},onClick:()=>window.open(`tel:${c.number}`,"_self")},
        React.createElement("p",{style:{fontSize:14,fontWeight:700,color:C.white,margin:0}},c.label),
        React.createElement("p",{style:{fontSize:11,color:"#fecaca",margin:0}},c.desc)
      ),
      React.createElement("div",{style:{cursor:"pointer",textAlign:"right"},onClick:()=>window.open(`tel:${c.number}`,"_self")},
        React.createElement("p",{style:{fontSize:13,color:"#fecaca",fontWeight:800,margin:0}},c.number),
        React.createElement("p",{style:{fontSize:9,color:"#fca5a5",margin:0}},"Tap to call")
      ),
      canEdit&&React.createElement("div",{style:{display:"flex",gap:4}},
        React.createElement("button",{style:{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.white,fontSize:12},onClick:()=>{setEditKey(c.key);setEf({icon:c.icon,label:c.label,number:c.number,desc:c.desc});setAdding(false);}},"✏️"),
        React.createElement("button",{style:{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.white,fontSize:12},onClick:()=>{if(window.confirm("Remove?"))persist(contacts.filter(x=>x.key!==c.key));}},"🗑️")
      )
    )),
    canEdit&&React.createElement("button",{style:btn(C.navyLight,C.white),onClick:()=>{setEditKey("__new__");setEf({icon:"📞",label:"",number:"",desc:""});setAdding(true);}},"➕ Add Contact"),
    editKey&&React.createElement("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}},
      React.createElement("div",{style:{background:C.navyMid,borderRadius:14,padding:20,width:"100%",maxWidth:340}},
        React.createElement("p",{style:{color:C.white,fontWeight:700,fontSize:15,marginBottom:12}},(adding?"Add":"Edit")+" Contact"),
        [["Icon","icon"],["Label","label"],["Phone","number"],["Description","desc"]].map(([l,k])=>React.createElement("div",{key:k},
          React.createElement("span",{style:lbl},l),
          React.createElement("input",{style:inp,value:ef[k],onChange:e=>setEf(x=>({...x,[k]:e.target.value}))})
        )),
        React.createElement("div",{style:{display:"flex",gap:8}},
          React.createElement("button",{style:{...btn(C.navyLight,C.white,0),flex:1},onClick:()=>setEditKey(null)},"Cancel"),
          React.createElement("button",{style:{...btn(C.gold,C.navy,0),flex:1},onClick:save},"Save")
        )
      )
    )
  );
}

function LoginScreen({onLoggedIn,setScreen,sessionStore}) {
  const [email,setEmail] = useState("");
  const [err,setErr] = useState("");
  function handle(){
    const t=email.trim().toLowerCase();
    if(!t.includes("@")||!t.includes(".")){setErr("Enter a valid email.");return;}
    const existing=sessionStore.get();
    const profile=(existing&&existing.email===t)?existing:{email:t,registered:false,name:"",approved:false};
    sessionStore.set(profile);onLoggedIn(profile);
  }
  return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("button",{style:{padding:"8px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:C.navyLight,color:C.white,marginBottom:12},onClick:()=>setScreen("home")},"← Back"),
    React.createElement("div",{style:sHead},"🔑 Volunteer Login"),
    React.createElement("span",{style:lbl},"Email ID"),
    React.createElement("input",{style:inp,type:"email",placeholder:"yourname@psgcas.edu.in",value:email,onChange:e=>{setEmail(e.target.value);setErr("");}}),
    err&&React.createElement("p",{style:{color:"#fca5a5",fontSize:11,marginTop:-6,marginBottom:8}},err),
    React.createElement("button",{style:btn(C.gold,C.navy),onClick:handle},"Continue with Email →")
  );
}

function ProfileScreen({session,setScreen,volunteers,setVolunteers,onSessionUpdate,sessionStore}) {
  const vol=session?volunteers.find(v=>v.email===session.email):null;
  const [saving,setSaving] = useState(false);
  if(!session)return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("div",{style:{...card(),textAlign:"center",padding:32}},
      React.createElement("p",{style:{fontSize:32,margin:"0 0 12px"}},"👤"),
      React.createElement("p",{style:{color:C.gray,fontSize:13,marginBottom:14}},"Please login to view your profile."),
      React.createElement("button",{style:btn(C.gold,C.navy),onClick:()=>setScreen("login")},"Login / Register")
    )
  );
  if(!vol)return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("div",{style:{...card(),textAlign:"center",padding:32}},
      React.createElement("p",{style:{fontSize:32,margin:"0 0 12px"}},"📝"),
      React.createElement("p",{style:{color:C.gray,fontSize:13,marginBottom:6}},"Not registered as a volunteer yet."),
      React.createElement("p",{style:{color:C.gold,fontSize:12,marginBottom:14}},session.email),
      React.createElement("button",{style:btn(C.gold,C.navy),onClick:()=>setScreen("register")},"Register Now"),
      React.createElement("button",{style:{...btn(C.navyLight,C.white),marginTop:4},onClick:()=>{sessionStore.set(null);onSessionUpdate(null);setScreen("home");}},"🚪 Logout")
    )
  );
  const isOnline=vol.online&&vol.availability;
  async function toggleAvail(){
    setSaving(true);
    try{const u={online:!vol.online,availability:!vol.availability};await db.updateVolunteer(vol.id,u);setVolunteers(p=>p.map(v=>v.id===vol.id?{...v,...u}:v));}
    catch(e){alert(e.message);}
    setSaving(false);
  }
  return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("div",{style:sHead},"👤 My Profile"),
    React.createElement("div",{style:{...card(C.gold),marginBottom:10}},
      React.createElement("div",{style:{...row,marginBottom:10}},
        React.createElement("div",{style:{width:48,height:48,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:C.navy,flexShrink:0}},vol.name?.charAt(0)||"?"),
        React.createElement("div",{style:{flex:1}},
          React.createElement("p",{style:{fontSize:16,fontWeight:800,color:C.white,margin:0}},vol.name),
          React.createElement("p",{style:{fontSize:11,color:C.gray,margin:"2px 0 0"}},vol.email)
        ),
        React.createElement("span",{style:badge(vol.approved)},vol.approved?"✅ Approved":"⏳ Pending")
      ),
      React.createElement("button",{style:{...btn(isOnline?"#14532d":"#1a3a1a","#86efac",0),border:`1px solid ${isOnline?C.green:"#166534"}`},onClick:toggleAvail,disabled:saving},saving?"Saving...":(isOnline?"🟢 Mark Unavailable":"🔴 Mark Available"))
    ),
    React.createElement("button",{style:btn(C.navyLight,C.white),onClick:()=>setScreen("myAlerts")},"🔔 My Notifications"),
    React.createElement("button",{style:{...btn(C.navyLight,C.white),border:`1px solid ${C.red}`,color:"#fca5a5"},onClick:()=>{sessionStore.set(null);onSessionUpdate(null);setScreen("home");}},"🚪 Logout")
  );
}

function RegisterScreen({setScreen,session,onRegistered,userLoc,sessionStore}) {
  const [form,setForm] = useState({name:session?.name||"",email:session?.email||"",phone:"",department:"",year:"",first_aid_certified:null,remarks:""});
  const [done,setDone] = useState(false);
  const [loading,setLoading] = useState(false);
  const [errs,setErrs] = useState({});
  function upd(k,v){setForm(p=>({...p,[k]:v}));setErrs(p=>({...p,[k]:null}));}
  async function submit(){
    const e={};
    if(!form.name.trim())e.name="Required";
    if(!form.phone.trim())e.phone="Required";
    if(!form.remarks.trim())e.remarks="Required";
    if(form.first_aid_certified===null)e.cert="Required";
    if(Object.keys(e).length){setErrs(e);return;}
    setLoading(true);
    try{
      await db.addVolunteer({name:form.name,email:form.email,phone:form.phone,department:form.department,year:form.year,first_aid_trained:false,first_aid_certified:form.first_aid_certified,remarks:form.remarks,approved:false,online:false,availability:true,lat:userLoc?.lat||CAMPUS_CENTER.lat,lng:userLoc?.lng||CAMPUS_CENTER.lng});
      const p={...session,registered:true,approved:false,name:form.name};
      sessionStore.set(p);
      pushVN(form.email,{type:"registered",message:"📝 Registration submitted! Admin will review soon.",volName:form.name});
      onRegistered(p);setDone(true);
    }catch(e){alert("Error: "+e.message);}
    setLoading(false);
  }
  if(done)return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95,textAlign:"center"}},
    React.createElement("div",{style:{fontSize:60,marginBottom:14}},"✅"),
    React.createElement("p",{style:{color:C.gold,fontSize:20,fontWeight:800,marginBottom:8}},"Application Submitted!"),
    React.createElement("button",{style:btn(C.gold,C.navy),onClick:()=>setScreen("myAlerts")},"🔔 My Notifications"),
    React.createElement("button",{style:btn(C.navyLight,C.white),onClick:()=>setScreen("home")},"Back to Home")
  );
  return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("div",{style:sHead},"📝 Volunteer Registration"),
    [["Full Name *","name","text"],["Email","email","email"],["Phone *","phone","tel"],["Department","department","text"],["Year","year","text"]].map(([l,k,t])=>React.createElement("div",{key:k},
      React.createElement("span",{style:lbl},l),
      React.createElement("input",{style:inp,type:t,value:form[k],onChange:e=>upd(k,e.target.value)}),
      errs[k]&&React.createElement("p",{style:{color:"#fca5a5",fontSize:11,marginTop:-6,marginBottom:8}},errs[k])
    )),
    React.createElement("span",{style:lbl},"First Aid Certificate? *"),
    React.createElement("div",{style:{marginBottom:10}},
      [true,false].map(v=>React.createElement("button",{key:String(v),onClick:()=>upd("first_aid_certified",v),style:{padding:"6px 12px",borderRadius:20,border:`1px solid ${form.first_aid_certified===v?C.gold:C.navyLight}`,background:form.first_aid_certified===v?C.gold:C.navyLight,color:form.first_aid_certified===v?C.navy:C.gray,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:6}},v?"Yes":"No")),
      errs.cert&&React.createElement("p",{style:{color:"#fca5a5",fontSize:11,marginTop:4}},errs.cert)
    ),
    React.createElement("span",{style:lbl},"Training Details *"),
    React.createElement("input",{style:inp,value:form.remarks,onChange:e=>upd("remarks",e.target.value),placeholder:"e.g. Red Cross Basic First Aid, 2024"}),
    errs.remarks&&React.createElement("p",{style:{color:"#fca5a5",fontSize:11,marginTop:-6,marginBottom:8}},errs.remarks),
    React.createElement("button",{style:btn(C.gold,C.navy),onClick:submit,disabled:loading},loading?"Saving...":"Submit Application"),
    React.createElement("button",{style:btn(C.navyLight,C.white),onClick:()=>setScreen("home")},"Cancel")
  );
}

function MyAlertsScreen({session}) {
  const email=session?.email;
  const [notifs,setNotifs] = useState(()=>email?getVN(email):[]);
  useEffect(()=>{
    if(!email)return;
    const t=setInterval(()=>setNotifs([...getVN(email)]),3000);
    return()=>clearInterval(t);
  },[email]);
  function markRead(id){const u=notifs.map(n=>n.id===id?{...n,read:true}:n);setNotifs(u);if(email)volNotifs[email]=u;}
  const iconFor=t=>({call:"📞",sos:"🚨",approved:"✅",rejected:"❌",broadcast:"📢",registered:"📝"}[t]||"🔔");
  const unread=notifs.filter(n=>!n.read).length;
  if(!email)return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("div",{style:sHead},"🔔 My Notifications"),
    React.createElement("div",{style:{...card(),textAlign:"center",padding:32}},React.createElement("p",{style:{color:C.gray,fontSize:13}},"Login to see notifications."))
  );
  return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("div",{style:sHead},"🔔 My Notifications"),
    unread>0&&React.createElement("div",{style:{...card(C.gold),marginBottom:8,textAlign:"center"}},React.createElement("p",{style:{color:C.gold,fontWeight:800,fontSize:13,margin:0}},`🔔 ${unread} unread`)),
    notifs.length===0&&React.createElement("div",{style:{...card(),textAlign:"center",padding:28}},React.createElement("p",{style:{color:C.gray,fontSize:13}},"No notifications yet.")),
    notifs.map(n=>React.createElement("div",{key:n.id,onClick:()=>markRead(n.id),style:{...card(n.type==="sos"?"#C0392B":C.gold),background:n.read?C.navyMid:n.type==="sos"?"#2d0a0a":"#1a1400",cursor:"pointer",marginBottom:8}},
      React.createElement("div",{style:{display:"flex",gap:10}},
        React.createElement("span",{style:{fontSize:20}},iconFor(n.type)),
        React.createElement("div",{style:{flex:1}},
          !n.read&&React.createElement("span",{style:{fontSize:9,background:C.red,color:C.white,padding:"1px 6px",borderRadius:10,fontWeight:800,display:"inline-block",marginBottom:2}},"NEW"),
          React.createElement("p",{style:{color:C.white,fontSize:13,margin:"2px 0",fontWeight:n.read?400:600}},n.message),
          n.userPhone&&React.createElement("p",{style:{color:"#86efac",fontSize:11,margin:"0 0 2px",fontWeight:700}},"📞 "+n.userPhone),
          React.createElement("p",{style:{color:C.gray,fontSize:10,margin:0}},n.time)
        )
      )
    ))
  );
}

function AdminAlerts() {
  const [alerts,setAlerts] = useState([...gAlerts]);
  useEffect(()=>subAlerts(a=>setAlerts([...a])),[]);
  const iconFor=t=>({call:"📞",sos:"🚨",approved:"✅",rejected:"❌",broadcast:"📢",registered:"📝"}[t]||"🔔");
  if(!alerts.length)return React.createElement("div",{style:{...card(),textAlign:"center",padding:28}},React.createElement("p",{style:{color:C.gray,fontSize:13}},"No alerts yet."));
  return React.createElement("div",null,
    alerts.map(a=>React.createElement("div",{key:a.id,style:{...card(a.type==="sos"?C.red:C.gold),background:C.navyMid,marginBottom:8}},
      React.createElement("div",{style:row},
        React.createElement("span",{style:{fontSize:20}},iconFor(a.type)),
        React.createElement("div",{style:{flex:1}},
          React.createElement("p",{style:{color:C.white,fontSize:12,margin:"3px 0"}},a.message),
          a.userPhone&&React.createElement("p",{style:{color:"#86efac",fontSize:11,margin:0}},"📞 "+a.userPhone),
          React.createElement("p",{style:{color:C.gray,fontSize:10,margin:0}},a.volName+" · "+a.time)
        )
      )
    ))
  );
}

function AdminScreen({volunteers,setVolunteers,sosToday}) {
  const [tab,setTab] = useState("alerts");
  const [username,setUsername] = useState("");
  const [pin,setPin] = useState("");
  const [unlocked,setUnlocked] = useState(false);
  const [loginErr,setLoginErr] = useState("");
  const [busy,setBusy] = useState(false);
  const [bcast,setBcast] = useState("");
  const [badge2,setBadge2] = useState(0);
  useEffect(()=>subAlerts(a=>setBadge2(a.filter(x=>!x.read).length)),[]);
  if(!unlocked)return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("div",{style:sHead},"🔐 Admin Access"),
    React.createElement("div",{style:{...card(),padding:28}},
      React.createElement("span",{style:lbl},"Username"),
      React.createElement("input",{style:inp,type:"text",placeholder:"Admin username",value:username,onChange:e=>{setUsername(e.target.value);setLoginErr("");}}),
      React.createElement("span",{style:lbl},"Password"),
      React.createElement("input",{style:inp,type:"password",placeholder:"Admin password",value:pin,onChange:e=>{setPin(e.target.value);setLoginErr("");}}),
      loginErr&&React.createElement("p",{style:{color:"#fca5a5",fontSize:11,marginBottom:8}},loginErr),
      React.createElement("button",{style:btn(C.gold,C.navy),onClick:()=>{if(username===ADMIN_USERNAME&&pin===ADMIN_PIN)setUnlocked(true);else setLoginErr("Invalid credentials.");}},"Unlock Dashboard")
    )
  );
  const pending=volunteers.filter(v=>!v.approved);
  const approved=volunteers.filter(v=>v.approved);
  async function approve(vol){setBusy(true);try{await db.updateVolunteer(vol.id,{approved:true,online:true,availability:true});setVolunteers(p=>p.map(v=>v.id===vol.id?{...v,approved:true,online:true,availability:true}:v));sendAlert(vol,"approved");pushVN(vol.email,{type:"approved",message:"✅ Your application has been approved!",volName:vol.name});}catch(e){alert(e.message);}setBusy(false);}
  async function reject(vol){if(!window.confirm("Reject "+vol.name+"?"))return;setBusy(true);try{await db.deleteVolunteer(vol.id);setVolunteers(p=>p.filter(v=>v.id!==vol.id));sendAlert(vol,"rejected");}catch(e){alert(e.message);}setBusy(false);}
  async function remove(vol){if(!window.confirm("Remove "+vol.name+"?"))return;setBusy(true);try{await db.deleteVolunteer(vol.id);setVolunteers(p=>p.filter(v=>v.id!==vol.id));}catch(e){alert(e.message);}setBusy(false);}
  function broadcast(){if(!bcast.trim())return;approved.forEach(v=>{sendAlert(v,"broadcast",{message:bcast});pushVN(v.email,{type:"broadcast",message:"📢 Admin: "+bcast,volName:v.name});});setBcast("");alert("Broadcast sent to "+approved.length+" volunteer(s).");}
  const tabs=[{k:"alerts",l:"🔔 Alerts"+(badge2>0?" ("+badge2+")":"")},{k:"pending",l:"⏳ Pending ("+pending.length+")"},{k:"approved",l:"✅ Approved ("+approved.length+")"},{k:"contacts",l:"📞 Contacts"},{k:"guide",l:"🩺 Guide"},{k:"broadcast",l:"📢 Broadcast"}];
  const list=tab==="pending"?pending:approved;
  return React.createElement("div",{style:{padding:"16px 14px",paddingBottom:95}},
    React.createElement("div",{style:sHead},"🛡 Admin Dashboard"),
    React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}},
      tabs.map(({k,l})=>React.createElement("button",{key:k,style:{padding:"6px 10px",borderRadius:8,border:`1px solid ${tab===k?C.gold:C.navyLight}`,background:tab===k?C.gold:C.navyLight,color:tab===k?C.navy:C.white,fontSize:11,fontWeight:700,cursor:"pointer",marginBottom:4},onClick:()=>setTab(k)},l))
    ),
    tab==="alerts"&&React.createElement(AdminAlerts,null),
    tab==="contacts"&&React.createElement(ContactsScreen,{canEdit:true,setScreen:()=>{}}),
    tab==="guide"&&React.createElement(GuideScreen,{setScreen:()=>{},canEdit:true}),
    tab==="broadcast"&&React.createElement("div",{style:card()},
      React.createElement("span",{style:lbl},"Broadcast Message"),
      React.createElement("textarea",{style:{...inp,minHeight:80,resize:"vertical"},value:bcast,onChange:e=>setBcast(e.target.value),placeholder:"e.g. Campus emergency drill at 3 PM."}),
      React.createElement("button",{style:btn(C.gold,C.navy),onClick:broadcast},"📢 Send to All Approved Volunteers")
    ),
    (tab==="pending"||tab==="approved")&&React.createElement("div",null,
      list.length===0&&React.createElement("div",{style:{...card(),textAlign:"center",padding:28}},React.createElement("p",{style:{color:C.gray,fontSize:13}},"No "+tab+" volunteers.")),
      list.map(vol=>React.createElement("div",{key:vol.id,style:card()},
        React.createElement("p",{style:{fontSize:14,fontWeight:700,color:C.white,margin:"0 0 4px"}},vol.name),
        React.createElement("p",{style:{fontSize:11,color:C.gray,margin:"0 0 8px"}},"📧 "+vol.email+" · 📞 "+vol.phone),
        React.createElement("p",{style:{fontSize:11,color:C.gray,margin:"0 0 8px"}},"🏅 Certified: "+(vol.first_aid_certified?"Yes ✅":"No ❌")),
        React.createElement("div",{style:{display:"flex",gap:8}},
          !vol.approved&&React.createElement("button",{style:{...btn(C.green,C.white,0),flex:1,padding:10},onClick:()=>approve(vol),disabled:busy},"✓ Approve"),
          React.createElement("button",{style:{...btn(C.red,C.white,0),flex:1,padding:10},onClick:()=>vol.approved?remove(vol):reject(vol),disabled:busy},vol.approved?"🗑 Remove":"✗ Reject")
        )
      ))
    )
  );
}

function App() {
  const sessionRef = useRef(null);
  const sessionStore = { get:()=>sessionRef.current, set:(v)=>{sessionRef.current=v;} };
  const [lang,setLang] = useState("en");
  const [step,setStep] = useState("location");
  const [screen,setScreen] = useState("home");
  const [userLoc,setUserLoc] = useState(null);
  const [userPhone,setUserPhone] = useState("");
  const [userName,setUserName] = useState("");
  const [selectedVol,setSelectedVol] = useState(null);
  const [toast,setToast] = useState(null);
  const [alertBadge,setAlertBadge] = useState(0);
  const [session,setSession] = useState(null);
  const [volunteers,setVolunteers] = useState([]);
  const [sosToday,setSosToday] = useState(0);
  const volIdRef = useRef(null);

  const refreshVols = useCallback(()=>{db.getVolunteers().then(d=>setVolunteers(d)).catch(()=>{});},[]);
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
      db.updateVolunteer(volIdRef.current,{lat,lng,online:true}).catch(()=>{});
      setVolunteers(p=>p.map(x=>x.id===volIdRef.current?{...x,lat,lng}:x));
    },null,{enableHighAccuracy:true,maximumAge:30000});
    return()=>navigator.geolocation.clearWatch(wid);
  },[session?.email,volunteers.length,step]);

  useEffect(()=>subAlerts(alerts=>{
    setAlertBadge(alerts.filter(a=>!a.read).length);
    const l=alerts[0];
    if(l){setToast(l);setTimeout(()=>setToast(null),4000);}
  }),[]);

  function triggerSOS(){
    const nearby=volunteers.filter(v=>v.approved&&v.online&&v.availability).map(v=>({...v,distance:userLoc&&v.lat?haversine(userLoc.lat,userLoc.lng,parseFloat(v.lat),parseFloat(v.lng)):9999})).filter(v=>v.distance<=CAMPUS_RADIUS_KM*1000).sort((a,b)=>a.distance-b.distance);
    if(!nearby.length){alert("No volunteers nearby! Please call Emergency Contacts.");setScreen("contacts");return;}
    nearby.forEach(v=>{sendAlert(v,"sos",{userLoc,userPhone,userName});pushVN(v.email,{type:"sos",message:"🚨 SOS from "+userName+"! Call: "+userPhone,volName:v.name,userLoc,userPhone});});
    playBeep();setSosToday(c=>c+1);
    alert("🚨 SOS sent to "+nearby.length+" volunteer(s)!\nYour name ("+userName+") and number ("+userPhone+") were shared.");
  }

  if(step==="location")return React.createElement(LocationGate,{onEnable:loc=>{setUserLoc(loc);setStep("phone");},lang,onToggle:()=>setLang(l=>l==="en"?"ta":"en")});
  if(step==="phone")return React.createElement("div",{style:{fontFamily:"'Inter',system-ui,sans-serif",background:C.navy,minHeight:"100vh",color:C.white,maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column"}},
    React.createElement("style",null,globalCSS),
    React.createElement(Header,{lang,onToggle:()=>setLang(l=>l==="en"?"ta":"en")}),
    React.createElement(PhoneGate,{onSave:(name,phone)=>{setUserName(name);setUserPhone(phone);setStep("app");}})
  );

  const myNotifCount=session?.email?getVN(session.email).filter(n=>!n.read).length:0;
  const navItems=[
    {id:"home",icon:"🏠",label:"Home"},
    {id:"volunteers",icon:"🆘",label:"Help"},
    {id:"guide",icon:"🩺",label:"First Aid"},
    {id:"myAlerts",icon:"🔔",label:"Alerts",badge:myNotifCount},
    {id:"admin",icon:"🛡",label:"Admin",badge:alertBadge},
  ];

  const screenMap = {
    home: React.createElement(HomeScreen,{setScreen,onSOS:triggerSOS,volunteers,sosToday}),
    volunteers: React.createElement(VolunteersScreen,{userLoc,setScreen,setSelectedVol,volunteers}),
    map: React.createElement(MapScreen,{userLoc,selectedVol,setScreen}),
    campusMap: React.createElement(CampusMapScreen,{setScreen}),
    contacts: React.createElement(ContactsScreen,{canEdit:false,setScreen}),
    guide: React.createElement(GuideScreen,{setScreen,canEdit:false}),
    myAlerts: React.createElement(MyAlertsScreen,{session}),
    login: React.createElement(LoginScreen,{onLoggedIn:p=>{setSession(p);sessionStore.set(p);setScreen(p.registered?"profile":"register");},setScreen,sessionStore}),
    profile: React.createElement(ProfileScreen,{session,setScreen,volunteers,setVolunteers,onSessionUpdate:s=>{setSession(s);sessionStore.set(s);},sessionStore}),
    register: session?React.createElement(RegisterScreen,{setScreen,session,onRegistered:p=>{setSession(p);sessionStore.set(p);refreshVols();},userLoc,sessionStore}):React.createElement(LoginScreen,{onLoggedIn:p=>{setSession(p);sessionStore.set(p);setScreen("register");},setScreen,sessionStore}),
    admin: React.createElement(AdminScreen,{volunteers,setVolunteers,sosToday}),
  };

  return React.createElement("div",{style:{fontFamily:"'Inter',system-ui,sans-serif",background:C.navy,minHeight:"100vh",color:C.white,maxWidth:430,margin:"0 auto",position:"relative",overflowX:"hidden"}},
    React.createElement("style",null,globalCSS),
    toast&&React.createElement("div",{style:{position:"fixed",top:85,left:"50%",transform:"translateX(-50%)",zIndex:999,width:"90%",maxWidth:390,background:toast.type==="sos"?"#7f1d1d":"#1a1400",border:`2px solid ${toast.type==="sos"?C.red:C.gold}`,borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}},
      React.createElement("span",{style:{fontSize:20}},toast.type==="sos"?"🆘":"📢"),
      React.createElement("p",{style:{color:C.white,fontSize:12,margin:0,flex:1}},toast.message),
      React.createElement("button",{onClick:()=>setToast(null),style:{background:"none",border:"none",color:C.gray,fontSize:16,cursor:"pointer",padding:0}},"✕")
    ),
    React.createElement(Header,{lang,onToggle:()=>setLang(l=>l==="en"?"ta":"en")}),
    userLoc&&React.createElement("div",{style:{background:"#0d1f35",borderBottom:`1px solid ${C.navyLight}`,padding:"5px 14px",display:"flex",alignItems:"center",gap:8}},
      React.createElement("span",{style:{fontSize:12}},"📍"),
      React.createElement("span",{style:{fontSize:10,color:C.gold,fontWeight:800}},"LOCATION: "),
      React.createElement("span",{style:{fontSize:10,color:C.white,fontFamily:"monospace",flex:1}},fmtCoord(userLoc.lat)+", "+fmtCoord(userLoc.lng)),
      React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:C.green,animation:"blink 2s infinite"}})
    ),
    screenMap[screen]||screenMap.home,
    React.createElement("nav",{style:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.navyMid,borderTop:`2px solid ${C.gold}`,display:"flex",zIndex:200}},
      navItems.map(n=>React.createElement("button",{key:n.id,onClick:()=>setScreen(n.id),style:{flex:1,padding:"9px 2px 7px",background:"none",border:"none",color:screen===n.id?C.gold:C.gray,fontSize:8,fontWeight:700,cursor:"pointer",textTransform:"uppercase",display:"flex",flexDirection:"column",alignItems:"center",gap:2}},
        React.createElement("span",{style:{fontSize:19,position:"relative",display:"inline-block"}},
          n.icon,
          n.badge>0&&React.createElement("span",{style:{position:"absolute",top:-3,right:-5,background:C.red,color:C.white,borderRadius:"50%",fontSize:8,fontWeight:800,width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center"}},n.badge)
        ),
        n.label
      ))
    )
  );
}

export default App;
