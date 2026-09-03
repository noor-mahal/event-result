const EVENT_DATE = new Date(2026,8,5).getTime();
const PLACE_POINTS = {first:10,second:5,third:3};
const ADMIN_EMAIL = "ymusthafa313@gmail.com";
const ADMIN_PASSWORD = "Must#9741"; // Preview only — client-side demo authentication.

const CATEGORIES = ["Speaking","Recitation","Vocal","Knowledge","Writing","Percussion","Art","General"];
const ICONS = {Speaking:"🎤",Recitation:"📖",Vocal:"🎶",Knowledge:"🧠",Writing:"✍️",Percussion:"🥁",Art:"🎨",General:"🏅"};
const NAV = [["home","🏠 Home"],["competitions","🏆 Competitions"],["results","🥇 Results"],["totalresult","🏅 Total Result"],["gallery","🖼️ Gallery"],["admin","🔐 Admin"]];

const INITIAL_GROUPS = [{id:"g1",name:"Kanz"},{id:"g2",name:"Jawhar"}];
const INITIAL_STUDENTS = [
  {id:"s1",groupId:"g1",studentId:"K01",name:"Mohammed A"},
  {id:"s2",groupId:"g1",studentId:"K02",name:"Shafi"},
  {id:"s3",groupId:"g1",studentId:"K03",name:"Fathima S"},
  {id:"s4",groupId:"g2",studentId:"J01",name:"Afsal K"},
  {id:"s5",groupId:"g2",studentId:"J02",name:"Ayesha R"},
  {id:"s6",groupId:"g2",studentId:"J03",name:"Zainab M"}
];
const INITIAL_COMPETITIONS = [
  {id:"1",name:"Speech Competition",category:"Speaking"},
  {id:"2",name:"Quran Recitation",category:"Recitation"},
  {id:"3",name:"Nasheed",category:"Vocal"},
  {id:"4",name:"Islamic Quiz",category:"Knowledge"},
  {id:"5",name:"Essay Writing",category:"Writing"},
  {id:"6",name:"Duff Competition",category:"Percussion"}
];
const INITIAL_RESULTS = {
  "1":{first:{groupId:"g1",studentId:"K01"},second:{groupId:"g2",studentId:"J01"},third:{groupId:"g1",studentId:"K02"},published:true},
  "2":{first:{groupId:"g2",studentId:"J02"},second:{groupId:"g1",studentId:"K03"},third:{groupId:"g2",studentId:"J03"},published:true}
};

let state = {
  page:"home", selectedId:null, mobile:false, competitions:structuredClone(INITIAL_COMPETITIONS),
  results:structuredClone(INITIAL_RESULTS), groups:structuredClone(INITIAL_GROUPS),
  students:structuredClone(INITIAL_STUDENTS), totalVisible:false, gallery:[],
  signedIn:false, query:"", filter:"all", adminTab:"dashboard", justPublished:null
};

const app = document.getElementById("app");
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const studentById = id => state.students.find(s=>s.studentId===id);
const groupName = id => state.groups.find(g=>g.id===id)?.name || "—";
const announcedCount = () => Object.values(state.results).filter(r=>r.published).length;

function totals(){
  const t = state.groups.map(g=>({...g,total:0}));
  Object.values(state.results).forEach(r=>{
    if(!r.published)return;
    ["first","second","third"].forEach(p=>{
      const id=r[p]?.groupId, x=t.find(g=>g.id===id); if(x)x.total+=PLACE_POINTS[p];
    });
  });
  return t;
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function countdown(){
  const d=Math.max(0,EVENT_DATE-Date.now());
  return {days:Math.floor(d/86400000),hours:Math.floor(d/3600000)%24,minutes:Math.floor(d/60000)%60,seconds:Math.floor(d/1000)%60};
}
function live(dark=false){return `<span class="live ${dark?"dark":""}"><i class="dot"></i>Live</span>`}
function button(label,cls="btn btn-green",action=""){return `<button class="${cls}" data-action="${action}">${label}</button>`}

function layout(content){
  app.innerHTML=`
  <div class="preview-banner">UI PREVIEW — mock data only. Publishing a result updates this browser's local state; it is not connected to Supabase.</div>
  <header class="navbar">
    <nav class="container nav-inner">
      <button class="brand" data-page="home"><span>🕌</span><span class="font-display">Sirajul Huda</span></button>
      <div class="nav-links">${NAV.map(([k,l])=>`<button class="nav-btn ${state.page===k?"active":""}" data-page="${k}">${l}</button>`).join("")}</div>
      <button class="menu-btn" id="menuBtn">☰</button>
    </nav>
    <div class="mobile-nav ${state.mobile?"open":""}">${NAV.map(([k,l])=>`<button class="${state.page===k?"active":""}" data-page="${k}">${l}</button>`).join("")}</div>
  </header>
  <main>${content}</main>
  <footer><div class="container footer-row"><div><strong>🕌 Sirajul Huda Arabic Madrasa</strong><div>Miladh The First 2K26 · Unnalu, Koyyur · Results update live — no refresh needed.</div></div><small>© 2026 Sirajul Huda Arabic Madrasa, Unnalu, Koyyur.</small></div></footer>`;
  bindGlobal();
}

function home(){
  const c=countdown(), n=announcedCount();
  return `<section class="hero"><div class="hero-content">
    <div class="hero-mosque">🕌</div><p class="eyebrow">Sirajul Huda Arabic Madrasa, Unnalu, Koyyur</p>
    <h1 class="font-display">Miladh The First 2K26</h1>
    <p class="hero-desc">A celebration of faith, talent and community — featuring speech, recitation, nasheed and knowledge competitions for all ages.</p>
    <div class="meta"><span>📅 September 5, 2026</span><span>📍 Unnalu, Koyyur Post, Belthangady</span></div>
    <div class="countdown">${[["Days",c.days],["Hours",c.hours],["Min",c.minutes],["Sec",c.seconds]].map(x=>`<div class="count-box"><strong>${String(x[1]).padStart(2,"0")}</strong><small>${x[0]}</small></div>`).join("")}</div>
    <div class="hero-actions">${button("🏆 View Competitions","btn btn-gold","page:competitions")}${button("🥇 View Results","btn btn-outline","page:results")}</div>
    <div style="margin-top:30px">${live(true)}</div>
  </div></section>
  <div class="container stats"><div class="stat"><strong>${state.competitions.length}</strong><span>Competitions</span></div><div class="stat"><strong>${n}</strong><span>Announced</span></div><div class="stat"><strong>${state.competitions.length-n}</strong><span>Pending</span></div></div>
  <section class="home-note"><h2>Results update the moment they're announced.</h2><p>No refreshing needed — this preview updates immediately when an admin publishes a result.</p></section>`;
}

function competitions(){
  let list=state.competitions.filter(c=>{
    const q=c.name.toLowerCase().includes(state.query.toLowerCase()), r=state.results[c.id];
    return q && (state.filter==="all"||(state.filter==="announced"&&r?.published)||(state.filter==="pending"&&!r?.published));
  });
  return `<div class="container page"><div class="page-head"><div><h1>Competitions</h1><div class="subtitle">${state.competitions.length} competitions this year</div></div>${live()}</div>
  <div class="search-row"><input class="input search-input" id="compSearch" placeholder="Search competitions..." value="${esc(state.query)}"><div class="filters">${["all","announced","pending"].map(f=>`<button class="filter-btn ${state.filter===f?"active":""}" data-filter="${f}">${f==="all"?"All":f==="announced"?"🟢 Announced":"🟡 Pending"}</button>`).join("")}</div></div>
  <div class="grid">${list.map(c=>{const a=state.results[c.id]?.published;return `<button class="card comp-card" data-result="${c.id}"><div class="comp-top"><span class="icon-box">${ICONS[c.category]||"🏅"}</span><span class="status ${a?"announced":"pending"}">${a?"🟢 Announced":"🟡 Pending"}</span></div><h3>${esc(c.name)}</h3><p>Category: ${esc(c.category)}</p><div class="card-footer">View Result →</div></button>`}).join("")}</div></div>`;
}

function resultPage(){
  const c=state.competitions.find(x=>x.id===state.selectedId), r=state.results[state.selectedId];
  if(!c)return competitions();
  if(!r?.published)return `<div class="container page"><button class="back" data-page="competitions">← Back to Competitions</button><div class="result-head"><div><h1>${esc(c.name)}</h1><div class="subtitle">Category: ${esc(c.category)}</div></div>${live()}</div><div class="empty result-box"><div style="font-size:34px">⏳</div><h3>Result Not Announced</h3><p>Results will be announced soon.</p></div></div>`;
  const places=[["first","🥇","1st Place"],["second","🥈","2nd Place"],["third","🥉","3rd Place"]];
  return `<div class="container page"><button class="back" data-page="competitions">← Back to Competitions</button><div class="result-head"><div><h1>${esc(c.name)}</h1><div class="subtitle">Category: ${esc(c.category)}</div></div>${live()}</div><div class="result-box"><h2 class="font-display" style="color:#166534">🏆 Result Announced</h2><div class="podium">${places.map(([p,m,l])=>{const e=r[p],s=studentById(e?.studentId);return `<div class="place-card"><div class="medal">${m}</div><span class="place-label">${l}</span><div class="place-name">${esc(s?.name||"—")}</div><div class="place-id">ID: ${esc(e?.studentId||"—")}</div></div>`}).join("")}</div>${posterGenerator(c,r)}</div></div>`;
}

function results(){
 return `<div class="container page"><div class="page-head"><div><h1>All Results</h1><div class="subtitle">Every competition, updated live.</div></div>${live()}</div><div class="grid" style="grid-template-columns:repeat(2,1fr)">${state.competitions.map(c=>{const r=state.results[c.id];return `<button class="card comp-card" data-result="${c.id}"><h3>${esc(c.name)}</h3>${r?.published?`<ul style="list-style:none;padding:0;margin:12px 0;line-height:1.8;font-size:13px"><li>🥇 ID: ${esc(r.first?.studentId||"—")}</li><li>🥈 ID: ${esc(r.second?.studentId||"—")}</li><li>🥉 ID: ${esc(r.third?.studentId||"—")}</li></ul>`:`<p>⏳ Result Pending</p>`}</button>`}).join("")}</div></div>`;
}

function totalResult(){
 if(!state.totalVisible)return `<div class="container page"><div class="page-head"><div><h1>🏅 Total Result</h1><div class="subtitle">Overall standings across every announced competition.</div></div>${live()}</div><div class="empty" style="margin-top:35px"><div style="font-size:32px">🔒</div><h3>Total Result Not Published Yet</h3><p>The organizer hasn't made the overall standings public yet. Please check back soon.</p></div></div>`;
 const top=[...totals()].sort((a,b)=>b.total-a.total).slice(0,3), medals=["🥇","🥈","🥉"], labels=["1st Place","2nd Place","3rd Place"];
 return `<div class="container page"><div class="page-head"><div><h1>🏅 Total Result</h1><div class="subtitle">Overall standings across every announced competition.</div></div>${live()}</div><div class="total-grid">${top.map((g,i)=>`<div class="place-card"><div class="medal">${medals[i]}</div><span class="place-label">${labels[i]}</span><div class="place-name">${esc(g.name)}</div><div class="marks">${g.total} Marks</div></div>`).join("")}</div><p style="text-align:center;color:var(--muted);font-size:11px;margin-top:18px">Scoring: 1st = 10 marks · 2nd = 5 marks · 3rd = 3 marks.</p>${lookup()}</div>`;
}

function lookup(){
 return `<div class="card lookup"><h2 class="font-display" style="color:#065f46">🔎 Participant Lookup</h2><div class="subtitle">Enter a student ID to see which competitions they placed in.</div><form id="lookupForm"><input class="input" id="lookupId" placeholder="Student ID (e.g. K01)"><button class="btn btn-green">Search</button></form><div id="lookupResult"></div></div>`;
}

function gallery(){
 return `<div class="container page"><div class="page-head"><div><h1>🖼️ Poster Gallery</h1><div class="subtitle">Posters generated from result pages, saved here for easy access.</div></div>${live()}</div>${state.gallery.length?`<div class="gallery-grid">${state.gallery.map(p=>`<div class="card gallery-item"><img src="${p.dataUrl}" alt="${esc(p.competitionName)}"><div class="gallery-body"><b>${esc(p.competitionName)}</b><div class="muted">${p.style==="full"?"Full Details":"Top 3"} · ${new Date(p.createdAt).toLocaleDateString()}</div><div class="gallery-actions"><a class="small-btn green" href="${p.dataUrl}" download="${esc(p.competitionName).replace(/\\s+/g,"-")}-poster.png">Download</a><button class="small-btn red" data-delete-poster="${p.id}">Remove</button></div></div></div>`).join("")}</div>`:`<div class="empty" style="margin-top:35px"><div style="font-size:32px">🖼️</div><h3>No Posters Saved Yet</h3><p>Open any announced result and tap “Generate Poster” to create and save one here.</p></div>`}</div>`;
}

function admin(){
 if(!state.signedIn)return `<div class="container admin-login"><div style="text-align:center;font-size:38px">🔐</div><h1 style="text-align:center">Admin Sign In</h1><div class="subtitle" style="text-align:center">Manage competitions and publish results.</div><form class="card admin-form" id="loginForm"><div class="field"><label>Email</label><input class="input" id="email" placeholder="Admin email"></div><div class="field"><label>Password</label><input class="input" type="password" id="password" placeholder="Password"></div><div id="loginError"></div><button class="btn btn-green" style="width:100%">Sign In →</button><p class="muted" style="text-align:center;margin-top:12px">Preview authentication only. A production site should use a server/auth provider.</p></form></div>`;
 return `<div class="container page"><div class="admin-tabs"><div class="tabs">${[["dashboard","📊 Dashboard"],["competitions","🏆 Competitions"],["students","🧑‍🎓 Students"],["results","🥇 Results"]].map(([k,l])=>`<button class="tab ${state.adminTab===k?"active":""}" data-admin-tab="${k}">${l}</button>`).join("")}</div><button class="small-btn" id="signOut">Sign Out</button></div>${adminContent()}</div>`;
}
function adminContent(){
 if(state.adminTab==="dashboard")return dashboard();
 if(state.adminTab==="competitions")return competitionManager();
 if(state.adminTab==="students")return studentManager();
 return resultManager();
}
function dashboard(){
 const ts=[...totals()].sort((a,b)=>b.total-a.total);
 return `<div class="mini-grid">${[["Competitions",state.competitions.length],["Students",state.students.length],["Announced",announcedCount()],["Pending",state.competitions.length-announcedCount()]].map(x=>`<div class="card mini-stat"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join("")}</div><div class="admin-columns"><div class="card"><div class="muted">Total Marks (Kanz vs Jawhar)</div><ul class="list">${ts.map((g,i)=>`<li><span> ${i===0?"🥇":"🥈"} <strong>${esc(g.name)}</strong></span><b>${g.total}</b></li>`).join("")}</ul></div><div class="card"><div class="muted">Total Result Page</div><p class="subtitle">Controls whether the public Total Result page shows overall standings.</p><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b>${state.totalVisible?"🟢 Visible to public":"🔒 Hidden from public"}</b><button class="btn ${state.totalVisible?"btn-outline":"btn-green"}" id="toggleTotal">${state.totalVisible?"Hide":"Show to Public"}</button></div></div></div>`;
}
function competitionManager(){
 return `<div class="admin-columns"><form class="card" id="addCompForm"><h2 class="font-display" style="color:#065f46">Add Competition</h2><div class="field"><label>Name</label><input class="input" id="newCompName" placeholder="e.g. Calligraphy Contest" required></div><div class="field"><label>Category</label><select class="select" id="newCompCat">${CATEGORIES.map(c=>`<option>${c}</option>`).join("")}</select></div><button class="btn btn-green">Add Competition</button></form><div><h2 class="font-display" style="color:#065f46">All Competitions</h2><ul class="list">${state.competitions.map(c=>`<li><span class="list-main"><strong>${ICONS[c.category]||"🏅"} ${esc(c.name)}</strong><br><span class="muted">${esc(c.category)} · ${state.results[c.id]?.published?"🟢 Announced":"🟡 Pending"}</span></span><button class="small-btn red" data-delete-comp="${c.id}">Delete</button></li>`).join("")}</ul></div></div>`;
}
function studentManager(){
 return `<div class="admin-columns">${state.groups.map(g=>`<div class="card"><h2 class="font-display" style="color:#065f46">${esc(g.name)}</h2><div class="muted">Students in this group</div><ul class="list">${state.students.filter(s=>s.groupId===g.id).map(s=>`<li><span class="list-main"><strong>${esc(s.name)}</strong><br><span class="muted">ID: ${esc(s.studentId)}</span></span><button class="small-btn red" data-delete-student="${s.id}">Delete</button></li>`).join("")}</ul><form class="add-student" data-group="${g.id}"><input class="input" name="studentId" placeholder="Student ID (e.g. K01)" required><input class="input" name="name" placeholder="Student name" required style="margin-top:7px"><button class="btn btn-green" style="margin-top:8px">Add Student</button></form></div>`).join("")}</div>`;
}
function resultManager(){
 return `<div class="result-manager"><label class="muted">Select Competition</label><select class="select" id="adminCompSelect"><option value="">Choose a competition...</option>${state.competitions.map(c=>`<option value="${c.id}">${esc(c.name)} ${state.results[c.id]?.published?"🟢":"🟡"}</option>`).join("")}</select><div id="editor"></div></div>`;
}
function renderEditor(id){
 if(!id){document.getElementById("editor").innerHTML="";return}
 const r=state.results[id]||{}, groups=state.groups;
 let f={first:r.first||{groupId:groups[0].id,studentId:""},second:r.second||{groupId:groups[0].id,studentId:""},third:r.third||{groupId:groups[0].id,studentId:""}};
 document.getElementById("editor").innerHTML=`<div class="card" style="margin-top:18px"><div class="subtitle">Status: ${r.published?"🟢 Announced":"🟡 Not Announced"}</div>${[["first","🥇 1st Place (10 marks)"],["second","🥈 2nd Place (5 marks)"],["third","🥉 3rd Place (3 marks)"]].map(([p,l])=>`<div class="place-editor"><label>${l}</label><select class="select group-select" data-place="${p}">${groups.map(g=>`<option value="${g.id}" ${f[p].groupId===g.id?"selected":""}>${esc(g.name)}</option>`).join("")}</select><select class="select student-select" data-place="${p}">${studentsOptions(f[p].groupId,f[p].studentId)}</select></div>`).join("")}<div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-gold" id="publishBtn">${r.published?"Update Result":"Publish Result"}</button>${r.published?`<button class="btn btn-outline" id="revokeBtn">Revoke Announcement</button>`:""}</div><p class="muted" style="margin-top:12px">Publishing updates this preview instantly and adds marks to the group's Total Result.</p></div>`;
 document.querySelectorAll(".group-select").forEach(s=>s.onchange=()=>{const p=s.dataset.place; const student=document.querySelector(`.student-select[data-place="${p}"]`);student.innerHTML=studentsOptions(s.value,"");});
 document.getElementById("publishBtn").onclick=()=>{
   const data={};["first","second","third"].forEach(p=>{const g=document.querySelector(`.group-select[data-place="${p}"]`).value,s=document.querySelector(`.student-select[data-place="${p}"]`).value;data[p]={groupId:g,studentId:s};});
   state.results[id]={...data,published:true}; state.justPublished=id; state.selectedId=id; save(); render(); setTimeout(()=>{state.justPublished=null},2500);
 };
 if(document.getElementById("revokeBtn"))document.getElementById("revokeBtn").onclick=()=>{state.results[id]={...state.results[id],published:false};save();render()};
}
function studentsOptions(groupId,selected){
 return `<option value="">— Select student —</option>${state.students.filter(s=>s.groupId===groupId).map(s=>`<option value="${esc(s.studentId)}" ${selected===s.studentId?"selected":""}>${esc(s.name)} (ID: ${esc(s.studentId)})</option>`).join("")}`;
}

function posterGenerator(c,r){
 return `<div class="poster-wrap card"><div class="poster-controls"><h3 style="margin:0">Poster Generator</h3><div><button class="small-btn" id="top3Poster">Top 3</button><button class="small-btn" id="fullPoster">Full Details</button></div></div><canvas id="posterCanvas" class="poster-canvas" width="800" height="1000"></canvas><div style="text-align:center"><button class="btn btn-gold" id="savePoster">💾 Save to Gallery</button></div></div>`;
}
function drawPoster(style="top3"){
 const c=state.competitions.find(x=>x.id===state.selectedId),r=state.results[state.selectedId],canvas=document.getElementById("posterCanvas");if(!canvas||!c||!r)return;
 const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height,g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#0d3d33");g.addColorStop(1,"#146356");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.strokeStyle="rgba(255,255,255,.25)";ctx.lineWidth=4;ctx.strokeRect(20,20,W-40,H-40);ctx.textAlign="center";ctx.fillStyle="#FBE9A6";ctx.font="600 22px sans-serif";ctx.fillText("SIRAJUL HUDA ARABIC MADRASA",W/2,90);ctx.font="400 16px sans-serif";ctx.fillStyle="rgba(255,255,255,.7)";ctx.fillText("Miladh The First 2K26 · Unnalu, Koyyur",W/2,120);
 ctx.fillStyle="#fff";ctx.font="700 40px serif";wrapText(ctx,c.name,W/2,190,W-120,46);
 [["first","🥇","1ST PLACE",340],["second","🥈","2ND PLACE",530],["third","🥉","3RD PLACE",720]].forEach(([p,m,l,y])=>{const e=r[p],s=studentById(e?.studentId);ctx.font="48px serif";ctx.fillText(m,W/2,y);ctx.font="600 16px sans-serif";ctx.fillStyle="#FBE9A6";ctx.fillText(l,W/2,y+34);ctx.font="700 30px sans-serif";ctx.fillStyle="#fff";ctx.fillText(s?.name||"—",W/2,y+74);ctx.font="400 18px sans-serif";ctx.fillStyle="rgba(255,255,255,.75)";ctx.fillText(`ID: ${e?.studentId||"—"}`,W/2,y+102);});
 if(style==="full"){ctx.font="400 15px sans-serif";ctx.fillStyle="rgba(255,255,255,.6)";ctx.fillText(`Category: ${c.category}`,W/2,H-115);ctx.fillText("September 5, 2026",W/2,H-90);ctx.fillText("Unnalu, Koyyur Post, Belthangady",W/2,H-65);}
 ctx.font="italic 13px sans-serif";ctx.fillStyle="rgba(255,255,255,.4)";ctx.fillText("Generated live from the results page",W/2,H-30);
}
function wrapText(ctx,text,x,y,maxWidth,lineHeight){const words=text.split(" "),lines=[];let line="";words.forEach(w=>{const t=line?line+" "+w:w;if(ctx.measureText(t).width>maxWidth&&line){lines.push(line);line=w}else line=t});if(line)lines.push(line);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));}

function render(){
 let content=state.page==="home"?home():state.page==="competitions"?competitions():state.page==="result"?resultPage():state.page==="results"?results():state.page==="totalresult"?totalResult():state.page==="gallery"?gallery():admin();
 layout(content);
 if(state.page==="result"){drawPoster(); document.getElementById("top3Poster")?.addEventListener("click",()=>drawPoster("top3"));document.getElementById("fullPoster")?.addEventListener("click",()=>drawPoster("full"));document.getElementById("savePoster")?.addEventListener("click",savePoster);}
 if(state.page==="totalresult")document.getElementById("lookupForm")?.addEventListener("submit",lookupSubmit);
 if(state.page==="admin"&&state.signedIn&&state.adminTab==="results")document.getElementById("adminCompSelect")?.addEventListener("change",e=>renderEditor(e.target.value));
 if(state.page==="admin"&&state.signedIn)bindAdmin();
}
function bindGlobal(){
 document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{state.page=b.dataset.page;state.mobile=false;state.selectedId=null;render()});
 document.getElementById("menuBtn")?.addEventListener("click",()=>{state.mobile=!state.mobile;render()});
 document.querySelectorAll("[data-result]").forEach(b=>b.onclick=()=>{state.selectedId=b.dataset.result;state.page="result";render()});
 document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;render()});
 document.getElementById("compSearch")?.addEventListener("input",e=>{state.query=e.target.value;render();const x=document.getElementById("compSearch");x.focus();x.setSelectionRange(x.value.length,x.value.length)});
 document.querySelectorAll("[data-delete-poster]").forEach(b=>b.onclick=()=>{state.gallery=state.gallery.filter(p=>p.id!==b.dataset.deletePoster);save();render()});
}
function bindAdmin(){
 document.querySelectorAll("[data-admin-tab]").forEach(b=>b.onclick=()=>{state.adminTab=b.dataset.adminTab;render()});
 document.getElementById("signOut")?.addEventListener("click",()=>{state.signedIn=false;render()});
 document.getElementById("toggleTotal")?.addEventListener("click",()=>{state.totalVisible=!state.totalVisible;save();render()});
 document.getElementById("addCompForm")?.addEventListener("submit",e=>{e.preventDefault();state.competitions.push({id:uid(),name:document.getElementById("newCompName").value.trim(),category:document.getElementById("newCompCat").value});save();render()});
 document.querySelectorAll("[data-delete-comp]").forEach(b=>b.onclick=()=>{if(confirm("Delete this competition? This also removes its result.")){state.competitions=state.competitions.filter(c=>c.id!==b.dataset.deleteComp);delete state.results[b.dataset.deleteComp];save();render()}});
 document.querySelectorAll("[data-delete-student]").forEach(b=>b.onclick=()=>{if(confirm("Remove this student from the roster?")){state.students=state.students.filter(s=>s.id!==b.dataset.deleteStudent);save();render()}});
 document.querySelectorAll(".add-student").forEach(f=>f.onsubmit=e=>{e.preventDefault();const fd=new FormData(f);state.students.push({id:uid(),groupId:f.dataset.group,studentId:fd.get("studentId").trim(),name:fd.get("name").trim()});save();render()});
 document.getElementById("loginForm")?.addEventListener("submit",e=>{e.preventDefault();if(document.getElementById("email").value.trim().toLowerCase()===ADMIN_EMAIL.toLowerCase()&&document.getElementById("password").value===ADMIN_PASSWORD){state.signedIn=true;state.adminTab="dashboard";render()}else document.getElementById("loginError").innerHTML='<p class="error">Incorrect email or password.</p>'});
}
function lookupSubmit(e){
 e.preventDefault();const id=document.getElementById("lookupId").value.trim(),s=studentById(id),box=document.getElementById("lookupResult");
 if(!s){box.innerHTML='<p class="error">No student found with that ID.</p>';return}
 const rows=[];Object.entries(state.results).forEach(([cid,r])=>{if(!r.published)return;["first","second","third"].forEach(p=>{if(r[p]?.studentId?.toLowerCase()===id.toLowerCase()){const c=state.competitions.find(x=>x.id===cid);if(c)rows.push({name:c.name,place:p,medal:p==="first"?"🥇":p==="second"?"🥈":"🥉"})}})});
 box.innerHTML=`<p><b>${esc(s.name)}</b> · ${esc(groupName(s.groupId))} · ID: ${esc(s.studentId)}</p>${rows.length?`<ul>${rows.map(r=>`<li><span>${esc(r.name)}</span><b>${r.medal} ${r.place==="first"?"1st":r.place==="second"?"2nd":"3rd"}</b></li>`).join("")}</ul>`:'<p class="muted">No announced placements yet.</p>'}`;
}
function savePoster(){
 const canvas=document.getElementById("posterCanvas"),dataUrl=canvas.toDataURL("image/png"),c=state.competitions.find(x=>x.id===state.selectedId);
 const a=document.createElement("a");a.href=dataUrl;a.download=`${c.name.replace(/\s+/g,"-")}-poster.png`;a.click();
 state.gallery.unshift({id:uid(),dataUrl,competitionName:c.name,style:"top3",createdAt:Date.now()});save();alert("Poster saved to Gallery.");
}
function save(){try{localStorage.setItem("sirajulHudaPreview",JSON.stringify({competitions:state.competitions,results:state.results,students:state.students,totalVisible:state.totalVisible,gallery:state.gallery}))}catch(e){}}
function load(){try{const x=JSON.parse(localStorage.getItem("sirajulHudaPreview")||"null");if(x){state.competitions=x.competitions||state.competitions;state.results=x.results||state.results;state.students=x.students||state.students;state.totalVisible=!!x.totalVisible;state.gallery=x.gallery||[]}}catch(e){}}
load();render();setInterval(()=>{if(state.page==="home")render()},1000);
