const CATEGORIES = ["Ground Zone","High Zone","Zero Zone","Middle Zone"];
const CATEGORY_ICON = {"Ground Zone":"🏟️","High Zone":"⛰️","Zero Zone":"🎯","Middle Zone":"🎪"};
const ADMIN_EMAIL = "ymusthafa313@gmail.com";
const ADMIN_PASSWORD_DEFAULT = "Must@9741";
const EVENT_DATE = new Date(2026,8,5).getTime();
const PLACE_POINTS = {first:20,second:10,third:7};
const GROUPS = [{id:"g1",name:"Kanz"},{id:"g2",name:"Jawhar"}];
const INITIAL_STUDENTS = [
  {id:"s1",groupId:"g1",studentId:"K01",name:"Mohammed A"},
  {id:"s2",groupId:"g1",studentId:"K02",name:"Shafi"},
  {id:"s3",groupId:"g1",studentId:"K03",name:"Fathima S"},
  {id:"s4",groupId:"g2",studentId:"J01",name:"Afsal K"},
  {id:"s5",groupId:"g2",studentId:"J02",name:"Ayesha R"},
  {id:"s6",groupId:"g2",studentId:"J03",name:"Zainab M"}
];
const INITIAL_COMPETITIONS = [
  {id:"1",name:"Speech Competition",category:"Ground Zone"},
  {id:"2",name:"Quran Recitation",category:"High Zone"},
  {id:"3",name:"Nasheed",category:"Zero Zone"},
  {id:"4",name:"Islamic Quiz",category:"Middle Zone"},
  {id:"5",name:"Essay Writing",category:"Ground Zone"},
  {id:"6",name:"Duff Competition",category:"High Zone"}
];
const INITIAL_RESULTS = {
  "1":{first:[{groupId:"g1",studentId:"K01"},{groupId:"g2",studentId:"J01"}],second:[{groupId:"g1",studentId:"K02"}],third:[{groupId:"g2",studentId:"J02"}],published:true},
  "2":{first:[{groupId:"g2",studentId:"J02"}],second:[{groupId:"g1",studentId:"K03"}],third:[{groupId:"g2",studentId:"J03"}],published:true}
};
const POSTER_THEMES = [
  {key:"emerald",label:"Emerald Gold",bgTop:"#0b2e22",bgBottom:"#123f2f",cardFill:"#0f3a2c",cardStroke:"#D4AF37",badgeFill:"#0f3a2c",badgeStroke:"#D4AF37",badgeText:"#D4AF37",numberBg:"#0f3a2c",numberText:"#D4AF37",pillFill:"#f4ead2",nameText:"#12261d",idText:"#5a6b60",headerText:"#D4AF37",subText:"rgba(244,234,210,0.75)"},
  {key:"cream",label:"Cream Gold",bgTop:"#f6efe0",bgBottom:"#efe4cc",cardFill:"#faf6ec",cardStroke:"#c9a227",badgeFill:"#123f2f",badgeStroke:"#c9a227",badgeText:"#f4ead2",numberBg:"#123f2f",numberText:"#f4ead2",pillFill:"#ffffff",nameText:"#16211c",idText:"#6b7a70",headerText:"#123f2f",subText:"#8a7a4a"},
  {key:"sky",label:"Sky Rose",bgTop:"#eaf2fb",bgBottom:"#fdeef4",cardFill:"#ffffff",cardStroke:"#c9a227",badgeFill:"#123f2f",badgeStroke:"#c9a227",badgeText:"#f4ead2",numberBg:"#123f2f",numberText:"#f4ead2",pillFill:"#f7f8fb",nameText:"#16211c",idText:"#6b7a8a",headerText:"#123f2f",subText:"#8a8fa0"},
  {key:"ocean",label:"Ocean Ivory",bgTop:"#0e3b52",bgBottom:"#e8dfc8",cardFill:"#faf6ec",cardStroke:"#c9a227",badgeFill:"#123f2f",badgeStroke:"#c9a227",badgeText:"#f4ead2",numberBg:"#123f2f",numberText:"#f4ead2",pillFill:"#ffffff",nameText:"#16211c",idText:"#6b7a70",headerText:"#123f2f",subText:"#3a5568"}
];

const storeKey="noor-mahal-preview-state-v1";
const defaultState={
  page:"home",selectedId:null,mobileNavOpen:false,
  competitions:INITIAL_COMPETITIONS,results:INITIAL_RESULTS,students:INITIAL_STUDENTS,
  totalResultVisible:false,posterGallery:[],justPublished:null,
  adminSignedIn:false,currentPassword:ADMIN_PASSWORD_DEFAULT,
  loginEmail:"",loginPassword:"",loginError:"",loginView:"signin",
  forgotEmail:"",generatedOtp:"",otpInput:"",forgotError:"",
  newPassword:"",newPasswordConfirm:"",query:"",filter:"all",adminTab:"dashboard"
};
let state=loadState();
function clone(x){return JSON.parse(JSON.stringify(x))}
function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(storeKey));
    if(saved) return {...clone(defaultState),...saved,adminSignedIn:false};
  }catch(e){}
  return clone(defaultState);
}
function persist(){
  const safe={...state,adminSignedIn:false,justPublished:null,loginPassword:"",otpInput:""};
  localStorage.setItem(storeKey,JSON.stringify(safe));
}
function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function placeEntries(v){return !v?[]:(Array.isArray(v)?v.filter(Boolean):[v])}
function findStudent(id){return state.students.find(s=>s.studentId===id)}
function groupName(id){return GROUPS.find(g=>g.id===id)?.name||"—"}
function computeTotals(){
  const totals=GROUPS.map(g=>({...g,total:0}));
  const byId=Object.fromEntries(totals.map(t=>[t.id,t]));
  Object.values(state.results).forEach(r=>{
    if(!r.published)return;
    ["first","second","third"].forEach(place=>{
      const credited=new Set();
      placeEntries(r[place]).forEach(e=>{if(e?.groupId)credited.add(e.groupId)});
      credited.forEach(g=>{if(byId[g])byId[g].total+=PLACE_POINTS[place]});
    });
  });
  return totals;
}
function announcedCount(){return Object.values(state.results).filter(r=>r.published).length}
function live(label="Live",dark=false){return `<span class="live ${dark?"dark":""}"><span class="live-dot"></span>${label}</span>`}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function nav(){
  const items=[["home","🏠","Home"],["competitions","🏆","Competitions"],["results","🥇","Results"],["totalresult","🏅","Total Result"],["gallery","🖼️","Gallery"],["admin","🔐","Admin"]];
  return `<div class="preview-banner">UI PREVIEW — mock data only. Publishing a result here updates this page's local state to simulate what happens live; it isn't connected to Supabase.</div>
  <header class="navbar"><nav class="nav-inner">
    <button class="brand" data-page="home"><span class="mosque">🕌</span><span>Sirajul Huda Arabic School</span></button>
    <div class="desktop-nav">${items.map(([k,i,l])=>`<button class="nav-btn ${state.page===k?"active":""}" data-page="${k}">${i} ${l}</button>`).join("")}</div>
    <button class="mobile-menu-btn" id="mobileToggle"><span></span><span></span><span></span></button>
  </nav>
  <div class="mobile-nav ${state.mobileNavOpen?"open":""}">${items.map(([k,i,l])=>`<button class="nav-btn ${state.page===k?"active":""}" data-page="${k}">${i} ${l}</button>`).join("")}</div></header>`;
}
function footer(){
  return `<footer><div class="footer-inner"><div><div class="footer-title">🕌 Sirajul Huda Arabic School</div><div class="footer-text">Meelad Fest 2K26 · لوها Waves of Love · Unnalu, Koyyur · Results update live — no refresh needed.</div></div><div class="copyright">© 2026 Sirajul Huda Arabic School, Unnalu, Koyyur.</div></div></footer>`;
}
function renderHome(){
  const n=announcedCount();
  return `<section class="hero"><div class="hero-pattern"></div>
    <img class="hero-logo left" src="logo-left.png" alt="Sirajul Huda Arabic School">
    <img class="hero-logo right" src="logo-right.png" alt="Waves of Love">
    <div class="hero-content"><div class="icon">🕌</div><h1>Meelad Fest 2K26</h1>
      <p>A celebration of faith, talent and community — featuring speech, recitation, nasheed and knowledge competitions for all ages.</p>
      <div class="hero-meta"><span>📅 Sep-05, Saturday</span><span>📍 Unnalu, Koyyur Post, Belthangady</span></div>
      <div class="actions"><button class="btn btn-gold" data-page="competitions">🏆 View Competitions</button><button class="btn btn-white-outline" data-page="results">🥇 View Results</button></div>
      <div style="margin-top:28px">${live("Live",true)}</div>
    </div>
  </section>
  <section class="stats"><div class="stat"><div class="stat-value">${state.competitions.length}</div><div class="stat-label">Competitions</div></div><div class="stat"><div class="stat-value">${n}</div><div class="stat-label">Announced</div></div><div class="stat"><div class="stat-value">${state.competitions.length-n}</div><div class="stat-label">Pending</div></div></section>
  <section class="section-center"><h2>Results update the moment they're announced.</h2><p>No refreshing needed — every visitor sees changes the instant an admin publishes them.</p></section>`;
}
function renderCompetitions(){
  const q=state.query.toLowerCase();
  const filtered=state.competitions.filter(c=>{
    const text=c.name.toLowerCase().includes(q);
    const r=state.results[c.id];
    const f=state.filter==="all"||(state.filter==="announced"?r?.published:!r?.published);
    return text&&f;
  });
  return `<div class="container"><div class="page-head"><div><h1>Competitions</h1></div>${live()}</div>
  <div class="filters"><input class="search" id="compSearch" value="${esc(state.query)}" placeholder="Search competitions..."><div class="filter-row">
    ${["all","announced","pending"].map(f=>`<button class="pill-btn ${state.filter===f?"active":""}" data-filter="${f}">${f==="all"?"All":f==="announced"?"🟢 Announced":"🟡 Pending"}</button>`).join("")}
  </div></div>
  <div class="cards">${filtered.map(c=>{
    const r=state.results[c.id],num=state.competitions.findIndex(x=>x.id===c.id)+1;
    return `<button class="comp-card" data-result="${esc(c.id)}"><div class="comp-top"><span class="num">${num}</span><span class="status ${r?.published?"announced":"pending"}">${r?.published?"🟢 Announced":"🟡 Pending"}</span></div><h3>${esc(c.name)}</h3><div class="muted" style="font-size:14px">Category: ${esc(c.category)}</div><div class="comp-footer">View Result →</div></button>`;
  }).join("")||`<div class="empty">No competitions found.</div>`}</div></div>`;
}
function winnerCard(medal,label,value,cls,just){
  const winners=placeEntries(value);
  return `<div class="result-card ${cls}"><span class="medal">${medal}</span><span class="label">${label}</span>${winners.length?winners.map(e=>{const s=findStudent(e.studentId);return `<div class="winner"><span class="winner-name">${just?"✨ ":""}${esc(s?.name||"—")}${just?" ✨":""}</span><span class="winner-id">ID: ${esc(e.studentId||"—")}</span></div>`}).join(""):`<span class="winner-name">—</span>`}</div>`;
}
function renderResult(){
  const c=state.competitions.find(x=>x.id===state.selectedId);
  if(!c){state.page="competitions";return renderCompetitions()}
  const r=state.results[c.id],ann=r?.published;
  return `<div class="container narrow"><button class="back" data-page="competitions">← Back to Competitions</button>
    <div class="page-head" style="margin-top:16px"><div><h1>${esc(c.name)}</h1><p>Category: ${esc(c.category)}</p></div>${live()}</div>
    <div style="margin-top:30px">${ann?`<div class="font-display" style="font-size:21px;color:#146356;margin-bottom:18px">🏆 Result Announced</div>
      <div class="result-grid">${winnerCard("🥇","1st Place",r.first,"gold",state.justPublished===c.id)}${winnerCard("🥈","2nd Place",r.second,"silver",state.justPublished===c.id)}${winnerCard("🥉","3rd Place",r.third,"bronze",state.justPublished===c.id)}</div>
      ${renderPosterGenerator(c,r)}`:`<div class="pending-box"><div class="box-icon">⏳</div><div class="box-title">Result Not Announced</div><div class="box-text">Results will be announced soon.</div></div>`}</div>
  </div>`;
}
function renderResults(){
  return `<div class="container medium"><div class="page-head"><div><h1>All Results</h1><p>Every competition, updated live.</p></div>${live()}</div>
  <div class="cards two">${state.competitions.map(c=>{const r=state.results[c.id];return `<button class="comp-card" data-result="${c.id}"><h3 style="margin-top:0">${esc(c.name)}</h3>${r?.published?`<ul class="list"><li>🥇 ID: ${placeEntries(r.first).map(e=>esc(e.studentId)).join(", ")||"—"}</li><li>🥈 ID: ${placeEntries(r.second).map(e=>esc(e.studentId)).join(", ")||"—"}</li><li>🥉 ID: ${placeEntries(r.third).map(e=>esc(e.studentId)).join(", ")||"—"}</li></ul>`:`<p style="margin-top:12px;color:#a16207;font-size:14px">⏳ Result Pending</p>`}</button>`}).join("")}</div></div>`;
}
function renderTotal(){
  if(!state.totalResultVisible)return `<div class="container narrow"><div class="page-head"><div><h1>🏅 Total Result</h1><p>Overall standings across every announced competition.</p></div>${live()}</div><div class="hidden-box"><div class="box-icon">🔒</div><div class="box-title">Total Result Not Published Yet</div><div class="box-text">The organizer hasn't made the overall standings public yet. Please check back soon.</div></div></div>`;
  const totals=computeTotals().sort((a,b)=>b.total-a.total).slice(0,3);
  const medals=["🥇","🥈","🥉"],labels=["1st Place","2nd Place","3rd Place"];
  return `<div class="container narrow"><div class="page-head"><div><h1>🏅 Total Result</h1><p>Overall standings across every announced competition.</p></div>${live()}</div>
    <div class="total-grid">${totals.map((g,i)=>`<div class="total-card"><div class="medal">${medals[i]}</div><div style="font-size:11px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">${labels[i]}</div><h3>${esc(g.name)}</h3><p>${g.total} Marks</p></div>`).join("")}</div>
    <p class="muted small" style="text-align:center;margin-top:20px">Scoring: 1st = 20 marks · 2nd = 10 marks · 3rd = 7 marks, added up across every announced competition.</p>
    ${renderLookup()}</div>`;
}
function renderLookup(){
  return `<div class="lookup"><h2>🔎 Participant Lookup</h2><div class="small muted" style="margin-top:4px">Enter a student ID to see which competitions they placed in.</div>
    <form class="lookup-form" id="lookupForm"><input id="lookupId" placeholder="Student ID (e.g. K01)"><button class="btn btn-green" type="submit">Search</button></form><div id="lookupOutput"></div></div>`;
}
function lookupOutput(id){
  const student=state.students.find(s=>s.studentId.toLowerCase()===id.trim().toLowerCase());
  if(!student)return `<p class="error" style="margin-top:16px">No student found with that ID.</p>`;
  const rows=[];
  Object.entries(state.results).forEach(([cid,r])=>{
    if(!r.published)return;
    ["first","second","third"].forEach(place=>{
      if(placeEntries(r[place]).some(e=>e?.studentId?.toLowerCase()===id.trim().toLowerCase())){
        const c=state.competitions.find(x=>x.id===cid);if(c)rows.push({name:c.name,place,medal:place==="first"?"🥇":place==="second"?"🥈":"🥉"});
      }
    });
  });
  return `<p style="margin-top:16px;font-size:14px;font-weight:700;color:#123f2f">${esc(student.name)} · ${esc(groupName(student.groupId))} · ID: ${esc(student.studentId)}</p>${rows.length?`<ul class="list">${rows.map(r=>`<li><span>${esc(r.name)}</span><strong>${r.medal} ${r.place==="first"?"1st":r.place==="second"?"2nd":"3rd"}</strong></li>`).join("")}</ul>`:`<p class="muted" style="margin-top:8px;font-size:14px">No announced placements yet.</p>`}`;
}
function renderGallery(){
  return `<div class="container medium"><div class="page-head"><div><h1>🖼️ Poster Gallery</h1><p>Posters generated from result pages, saved here for easy access.</p></div>${live()}</div>
    ${state.posterGallery.length?`<div class="gallery-grid">${state.posterGallery.map(p=>`<div class="gallery-card"><img src="${p.dataUrl}" alt="${esc(p.competitionName)}"><div class="gallery-info"><strong style="font-size:14px;color:#123f2f">${esc(p.competitionName)}</strong><div class="small muted" style="margin-top:3px">${esc(POSTER_THEMES.find(t=>t.key===p.style)?.label||p.style)} · ${new Date(p.createdAt).toLocaleDateString()}</div><div style="display:flex;gap:8px;margin-top:12px"><a class="btn btn-green" style="padding:7px 12px;font-size:12px" href="${p.dataUrl}" download="${esc(p.competitionName.replace(/\s+/g,"-"))}-poster.png">Download</a><button class="btn btn-danger" style="padding:7px 12px;font-size:12px" data-delete-poster="${p.id}">Remove</button></div></div></div>`).join("")}</div>`:
    `<div class="hidden-box"><div class="box-icon">🖼️</div><div class="box-title">No Posters Saved Yet</div><div class="box-text">Open any announced result and tap "Generate Poster" to create and save one here.</div></div>`}</div>`;
}
function renderLogin(){
  const title={signin:"Admin Sign In","forgot-email":"Forgot Password","forgot-otp":"Enter OTP","forgot-newpass":"Set New Password"}[state.loginView];
  const desc={signin:"Manage competitions and publish results.","forgot-email":"Enter your admin email to receive a one-time code.","forgot-otp":"Enter the 6-digit code to continue.","forgot-newpass:"Choose a new password for your admin account."}[state.loginView];
  let form="";
  if(state.loginView==="signin")form=`<div class="stack"><label><span class="form-label">Email</span><input id="loginEmail" value="${esc(state.loginEmail)}"></label><label><span class="form-label">Password</span><input id="loginPassword" type="password" value=""></label>${state.loginError?`<div class="error">${esc(state.loginError)}</div>`:""}<button class="btn btn-green" id="signIn">Sign In →</button><button class="back" id="forgotStart">Forgot password?</button><div class="small muted" style="text-align:center">In the real app this checks Supabase Auth. Here it validates against the preview admin account.</div></div>`;
  if(state.loginView==="forgot-email")form=`<div class="stack"><label><span class="form-label">Admin Email</span><input id="forgotEmail" value="${esc(state.forgotEmail)}"></label>${state.forgotError?`<div class="error">${esc(state.forgotError)}</div>`:""}<button class="btn btn-green" id="sendOtp">Send OTP →</button><button class="back" id="backSignIn">← Back to Sign In</button></div>`;
  if(state.loginView==="forgot-otp")form=`<div class="stack"><div class="otp-box"><div class="small muted">Preview mode — there's no real email service connected, so here's the code that would have been emailed to you:</div><div class="otp-code">${state.generatedOtp}</div></div><label><span class="form-label">Enter OTP</span><input id="otpInput" maxlength="6" placeholder="6-digit code" style="text-align:center;letter-spacing:.3em"></label>${state.forgotError?`<div class="error">${esc(state.forgotError)}</div>`:""}<button class="btn btn-green" id="verifyOtp">Verify Code →</button><button class="back" id="backForgotEmail">← Back</button></div>`;
  if(state.loginView==="forgot-newpass")form=`<div class="stack"><label><span class="form-label">New Password</span><input id="newPassword" type="password"></label><label><span class="form-label">Confirm New Password</span><input id="newPasswordConfirm" type="password"></label>${state.forgotError?`<div class="error">${esc(state.forgotError)}</div>`:""}<button class="btn btn-green" id="savePassword">Save New Password →</button></div>`;
  return `<div class="login-box"><div style="text-align:center;font-size:38px">🔐</div><h1>${title}</h1><p>${desc}</p><div class="auth-card">${form}</div></div>`;
}
function renderAdmin(){
  const announced=announcedCount(),pending=state.competitions.length-announced;
  const tabs=[["dashboard","📊","Dashboard"],["competitions","🏆","Competitions"],["students","🧑‍🎓","Students"],["results","🥇","Results"]];
  let content="";
  if(state.adminTab==="dashboard")content=renderAdminDashboard(announced,pending);
  if(state.adminTab==="competitions")content=renderCompetitionManager();
  if(state.adminTab==="students")content=renderStudentManager();
  if(state.adminTab==="results")content=renderResultManager();
  return `<div class="admin-wrap"><div class="admin-tabs"><div class="tab-row">${tabs.map(([k,i,l])=>`<button class="pill-btn ${state.adminTab===k?"active":""}" data-admin-tab="${k}">${i} ${l}</button>`).join("")}</div><button class="btn btn-outline" id="signOut" style="padding:9px 16px;font-size:12px">Sign Out</button></div>${content}</div>`;
}
function renderAdminDashboard(announced,pending){
  const totals=computeTotals().sort((a,b)=>b.total-a.total);
  const recent=Object.entries(state.results).filter(([,r])=>r.published).map(([id,r])=>{
    const c=state.competitions.find(x=>x.id===id);
    const names=placeEntries(r.first).map(e=>findStudent(e.studentId)?.name||"—");
    return `<li><strong>${esc(c?.name||"Unknown")}</strong><span class="small muted">🥇 ${esc(names.join(" & ")||"—")}</span></li>`;
  }).join("");
  return `<div class="admin-grid"><div class="mini-stat"><div class="mini-stat-value">${state.competitions.length}</div><div class="mini-stat-label">Competitions</div></div><div class="mini-stat"><div class="mini-stat-value">${state.students.length}</div><div class="mini-stat-label">Students</div></div><div class="mini-stat"><div class="mini-stat-value">${announced}</div><div class="mini-stat-label">Announced</div></div><div class="mini-stat"><div class="mini-stat-value" style="color:#ca8a04">${pending}</div><div class="mini-stat-label">Pending</div></div></div>
  <div class="admin-panels"><div class="panel"><h3>Total Marks (Kanz vs Jawhar)</h3>${totals.map((g,i)=>`<div class="score-row"><span style="font-size:14px;font-weight:700;color:#123f2f">${i===0?"🥇":"🥈"} ${esc(g.name)}</span><strong>${g.total}</strong></div>`).join("")}</div>
  <div class="panel"><h3>Total Result Page</h3><div class="small muted">Controls whether the public "Total Result" page shows the overall standings.</div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px"><strong style="font-size:14px;color:#123f2f">${state.totalResultVisible?"🟢 Visible to public":"🔒 Hidden from public"}</strong><button class="btn ${state.totalResultVisible?"btn-outline":"btn-green"}" id="toggleTotal" style="padding:9px 14px;font-size:12px">${state.totalResultVisible?"Hide":"Show to Public"}</button></div></div></div>
  <div style="margin-top:32px"><h2 class="font-display" style="font-size:19px;color:#123f2f">Recent Updates</h2>${recent?`<ul class="list">${recent}</ul>`:`<p class="muted" style="font-size:14px">No results published yet.</p>`}</div>`;
}
function renderCompetitionManager(){
  return `<div class="form-grid"><form class="panel stack" id="compForm"><h2 class="font-display" style="font-size:19px;color:#123f2f;margin:0">Add Competition</h2><label><span class="form-label">Name</span><input id="newCompName" required placeholder="e.g. Calligraphy Contest"></label><label><span class="form-label">Category</span><select id="newCompCategory">${CATEGORIES.map(c=>`<option>${c}</option>`).join("")}</select></label><button class="btn btn-green" type="submit">Add Competition</button></form>
  <div><h2 class="font-display" style="font-size:19px;color:#123f2f;margin:0">All Competitions</h2>${state.competitions.length?`<ul class="list">${state.competitions.map(c=>`<li><div style="display:flex;gap:12px;align-items:center"><span style="width:40px;height:40px;border-radius:9px;background:#ecfdf5;display:flex;align-items:center;justify-content:center">${CATEGORY_ICON[c.category]||"🏅"}</span><div><strong style="font-size:14px;color:#123f2f">${esc(c.name)}</strong><div class="small muted">${esc(c.category)} · ${state.results[c.id]?.published?"🟢 Announced":"🟡 Pending"}</div></div></div><div style="display:flex;gap:7px"><button class="btn btn-outline edit-comp" data-id="${c.id}" style="padding:7px 11px;font-size:12px">Edit</button><button class="btn btn-danger delete-comp" data-id="${c.id}" style="padding:7px 11px;font-size:12px">Delete</button></div></li>`).join("")}</ul>`:`<p class="muted" style="font-size:14px">No competitions yet — add one to get started.</p>`}</div></div>`;
}
function renderStudentManager(){
  return `<div class="student-grid">${GROUPS.map(g=>{const students=state.students.filter(s=>s.groupId===g.id);return `<div class="panel"><h2 class="font-display" style="font-size:19px;color:#123f2f;margin:0">${g.name}</h2><p class="small muted">Students in this group — this is what you'll pick from when entering results.</p><ul class="list">${students.map(s=>`<li><span><strong>${esc(s.name)}</strong> <span class="muted">· ID: ${esc(s.studentId)}</span></span><button class="btn btn-danger delete-student" data-id="${s.id}" style="padding:7px 11px;font-size:12px">Delete</button></li>`).join("")||`<li class="muted">No students yet.</li>`}</ul><form class="stack add-student-form" data-group="${g.id}" style="margin-top:14px"><input class="student-id" placeholder="Student ID (e.g. K01)" required><input class="student-name" placeholder="Student name" required><button class="btn btn-green" type="submit">Add Student</button></form></div>`}).join("")}</div>`;
}
function renderResultManager(){
  const selected=state.resultManagerId||"";
  const c=state.competitions.find(x=>x.id===selected);
  const r=selected?state.results[selected]:null;
  const slot=(place,i)=>{
    const e=placeEntries(state.resultForm?.[place]?.[i])[0]||{groupId:GROUPS[0].id,studentId:""};
    const students=state.students.filter(s=>s.groupId===e.groupId);
    return `<div class="stack" style="margin-top:8px"><select data-rgroup="${place}:${i}">${GROUPS.map(g=>`<option value="${g.id}" ${g.id===e.groupId?"selected":""}>${g.name}</option>`).join("")}</select><select data-rstudent="${place}:${i}"><option value="">— Select student —</option>${students.map(s=>`<option value="${esc(s.studentId)}" ${s.studentId===e.studentId?"selected":""}>${esc(s.name)} (ID: ${esc(s.studentId)})</option>`).join("")}</select></div>`;
  };
  const places=[["first","🥇","1st Place (20 marks)"],["second","🥈","2nd Place (10 marks)"],["third","🥉","3rd Place (7 marks)"]];
  return `<div class="panel" style="max-width:620px;margin-top:24px"><label><span class="form-label">Select Competition</span><select id="resultComp"><option value="">Choose a competition...</option>${state.competitions.map(c=>`<option value="${c.id}" ${c.id===selected?"selected":""}>${esc(c.name)} ${state.results[c.id]?.published?"🟢":"🟡"}</option>`).join("")}</select></label>
  ${state.students.length===0?`<p class="small" style="color:#a16207;margin-top:16px">Add students to Kanz or Jawhar in the Students tab first.</p>`:""}
  ${c?`<div style="margin-top:22px;padding:20px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.9)"><div class="small muted">Status: ${r?.published?"🟢 Announced":"🟡 Not Announced"}</div>${places.map(([p,m,l])=>`<div style="margin-top:16px;padding:12px;border:1px solid var(--line);border-radius:12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="form-label" style="margin:0">${m} ${l}</span>${(state.resultForm?.[p]?.length||1)<2?`<button class="btn btn-outline add-second" data-place="${p}" style="padding:5px 9px;font-size:11px">+ Add 2nd participant</button>`:`<button class="btn btn-danger remove-second" data-place="${p}" style="padding:5px 9px;font-size:11px">Remove 2nd</button>`}</div>${slot(p,0)}${(state.resultForm?.[p]?.length||1)>1?slot(p,1):""}</div>`).join("")}
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-gold" id="publishResult">${r?.published?"Update Result":"Publish Result"}</button>${r?.published?`<button class="btn btn-outline" id="revokeResult">Revoke Announcement</button>`:""}</div><div class="small muted" style="margin-top:12px">Tip: publish here, then jump to the Results page or that competition's page — it updates instantly, same as the real app. Add a 2nd participant to a place when there's a tie.</div></div>`:""}</div>`;
}
function renderPosterGenerator(c,r){
  return `<div class="poster-wrap"><div class="poster-head"><h3 class="font-display" style="margin:0;color:#123f2f;font-size:19px">Poster Preview</h3><div class="theme-row">${POSTER_THEMES.map(t=>`<button class="theme-btn ${state.posterTheme===t.key?"active":""}" data-theme="${t.key}">${t.label}</button>`).join("")}</div></div><div class="canvas-wrap"><canvas id="posterCanvas" class="poster-canvas" width="800" height="1000"></canvas></div><div class="actions" style="margin-top:16px"><button class="btn btn-gold" id="savePoster">💾 Save to Gallery</button></div></div>`;
}
function drawRoundedRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}
function wrapText(ctx,text,x,y,maxWidth,lineHeight){const words=String(text).split(" "),lines=[];let line="";words.forEach(w=>{const test=line?line+" "+w:w;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=w}else line=test});if(line)lines.push(line);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight))}
function drawPoster(c,r,students,themeKey){
  const t=POSTER_THEMES.find(x=>x.key===themeKey)||POSTER_THEMES[0],canvas=document.getElementById("posterCanvas");if(!canvas)return;
  const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,t.bgTop);bg.addColorStop(1,t.bgBottom);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const cardX=70,cardY=50,cardW=W-140,cardH=H-110,arch=cardW/2;
  ctx.beginPath();ctx.moveTo(cardX,cardY+arch);ctx.arc(cardX+arch,cardY+arch,arch,Math.PI,0,false);ctx.lineTo(cardX+cardW,cardY+cardH-30);ctx.quadraticCurveTo(cardX+cardW,cardY+cardH,cardX+cardW-30,cardY+cardH);ctx.lineTo(cardX+30,cardY+cardH);ctx.quadraticCurveTo(cardX,cardY+cardH,cardX,cardY+cardH-30);ctx.closePath();ctx.fillStyle=t.cardFill;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=t.cardStroke;ctx.stroke();
  ctx.textAlign="center";ctx.font="44px serif";ctx.fillStyle=t.headerText;ctx.fillText("🕌",W/2,cardY+70);
  ctx.font="700 20px sans-serif";ctx.fillText("SIRAJUL HUDA ARABIC SCHOOL",W/2,cardY+110);
  ctx.font="400 14px sans-serif";ctx.fillStyle=t.subText;ctx.fillText("لوها  ·  WAVES OF LOVE",W/2,cardY+135);
  const bw=200,bh=46,bx=W/2-bw/2,by=cardY+160;drawRoundedRect(ctx,bx,by,bw,bh,23);ctx.fillStyle=t.badgeFill;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=t.badgeStroke;ctx.stroke();ctx.font="700 24px sans-serif";ctx.fillStyle=t.badgeText;ctx.fillText("RESULT",W/2,by+31);
  ctx.font="700 26px serif";ctx.fillStyle=t.nameText;wrapText(ctx,c.name,W/2,by+90,cardW-120,32);
  const places=[["first","01"],["second","02"],["third","03"]],rowY0=by+220,rowGap=130,rowX=cardX+50,rowW=cardW-100,rowH=72;
  places.forEach(([p,num],i)=>{const winners=placeEntries(r[p]);const names=winners.length?winners.map(e=>students.find(s=>s.studentId===e.studentId)?.name||"—").join(" & "):"Result pending";const ids=winners.length?winners.map(e=>e.studentId||"—").join(", "):"—";const y=rowY0+i*rowGap;drawRoundedRect(ctx,rowX,y,64,rowH,16);ctx.fillStyle=t.numberBg;ctx.fill();ctx.textAlign="center";ctx.font="700 22px sans-serif";ctx.fillStyle=t.numberText;ctx.fillText(num,rowX+32,y+44);const px=rowX+80,pw=rowW-80;drawRoundedRect(ctx,px,y,pw,rowH,rowH/2);ctx.fillStyle=t.pillFill;ctx.fill();ctx.strokeStyle="rgba(0,0,0,.08)";ctx.lineWidth=1;ctx.stroke();ctx.textAlign="left";ctx.font=winners.length>1?"700 17px sans-serif":"700 22px sans-serif";ctx.fillStyle=t.nameText;ctx.fillText(names,px+26,y+30);ctx.font="400 14px sans-serif";ctx.fillStyle=t.idText;ctx.fillText("ID: "+ids,px+26,y+52)});
  ctx.textAlign="center";ctx.font="700 20px serif";ctx.fillStyle=t.headerText;ctx.fillText("Meelad Fest 2k26",W/2,cardY+cardH-46);ctx.font="400 14px sans-serif";ctx.fillStyle=t.subText;ctx.fillText("Sep-05 · Saturday · Unnalu, Koyyur",W/2,cardY+cardH-22);
}
function currentResultFormFrom(r){
  const empty=()=>[{groupId:GROUPS[0].id,studentId:""}];
  return {first:placeEntries(r?.first).length?clone(placeEntries(r.first)):empty(),second:placeEntries(r?.second).length?clone(placeEntries(r.second)):empty(),third:placeEntries(r?.third).length?clone(placeEntries(r.third)):empty()};
}
function render(){
  document.getElementById("app").innerHTML=nav()+`<main>${state.page==="home"?renderHome():state.page==="competitions"?renderCompetitions():state.page==="result"?renderResult():state.page==="results"?renderResults():state.page==="totalresult"?renderTotal():state.page==="gallery"?renderGallery():state.page==="admin"?(state.adminSignedIn?renderAdmin():renderLogin()):renderHome()}</main>${footer()}`;
  bind();
  if(state.page==="result"&&state.results[state.selectedId]?.published){state.posterTheme=state.posterTheme||"emerald";drawPoster(state.competitions.find(c=>c.id===state.selectedId),state.results[state.selectedId],state.students,state.posterTheme)}
}
function go(page,id=null){state.page=page;if(id!==null)state.selectedId=id;state.mobileNavOpen=false;persist();window.scrollTo(0,0);render()}
function bind(){
  document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
  const mt=document.getElementById("mobileToggle");if(mt)mt.addEventListener("click",()=>{state.mobileNavOpen=!state.mobileNavOpen;render()});
  document.querySelectorAll("[data-result]").forEach(b=>b.addEventListener("click",()=>go("result",b.dataset.result)));
  const search=document.getElementById("compSearch");if(search)search.addEventListener("input",e=>{state.query=e.target.value;render()});
  document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{state.filter=b.dataset.filter;render()});
  document.querySelectorAll("[data-delete-poster]").forEach(b=>b.addEventListener("click",()=>{state.posterGallery=state.posterGallery.filter(p=>p.id!==b.dataset.deletePoster);persist();render()}));
  document.querySelectorAll("[data-admin-tab]").forEach(b=>b.addEventListener("click",()=>{state.adminTab=b.dataset.adminTab;render()}));
  const lookup=document.getElementById("lookupForm");if(lookup)lookup.addEventListener("submit",e=>{e.preventDefault();document.getElementById("lookupOutput").innerHTML=lookupOutput(document.getElementById("lookupId").value)});
  bindAuth();bindAdmin();
}
function bindAuth(){
  const sign=document.getElementById("signIn");if(sign)sign.onclick=()=>{const email=document.getElementById("loginEmail").value.trim(),pass=document.getElementById("loginPassword").value;if(email.toLowerCase()===ADMIN_EMAIL.toLowerCase()&&pass===state.currentPassword){state.adminSignedIn=true;state.loginError="";persist();render()}else{state.loginError="Incorrect email or password.";render()}};
  const fs=document.getElementById("forgotStart");if(fs)fs.onclick=()=>{state.loginView="forgot-email";state.forgotEmail="";state.forgotError="";render()};
  const bs=document.getElementById("backSignIn");if(bs)bs.onclick=()=>{state.loginView="signin";render()};
  const so=document.getElementById("sendOtp");if(so)so.onclick=()=>{const email=document.getElementById("forgotEmail").value.trim();if(email.toLowerCase()!==ADMIN_EMAIL.toLowerCase()){state.forgotError="That email doesn't match the admin account.";render();return}state.generatedOtp=String(Math.floor(100000+Math.random()*900000));state.otpInput="";state.forgotError="";state.forgotEmail=email;state.loginView="forgot-otp";render()};
  const bo=document.getElementById("backForgotEmail");if(bo)bo.onclick=()=>{state.loginView="forgot-email";render()};
  const vo=document.getElementById("verifyOtp");if(vo)vo.onclick=()=>{if(document.getElementById("otpInput").value.trim()!==state.generatedOtp){state.forgotError="Incorrect code. Please try again.";render();return}state.forgotError="";state.loginView="forgot-newpass";render()};
  const sp=document.getElementById("savePassword");if(sp)sp.onclick=()=>{const a=document.getElementById("newPassword").value,b=document.getElementById("newPasswordConfirm").value;if(a.length<6){state.forgotError="Password must be at least 6 characters.";render();return}if(a!==b){state.forgotError="Passwords don't match.";render();return}state.currentPassword=a;state.loginEmail=ADMIN_EMAIL;state.loginView="signin";state.loginPassword="";state.forgotError="";persist();render()};
}
function bindAdmin(){
  const out=document.getElementById("signOut");if(out)out.onclick=()=>{state.adminSignedIn=false;state.loginEmail="";state.loginPassword="";state.loginError="";state.loginView="signin";persist();render()};
  const tt=document.getElementById("toggleTotal");if(tt)tt.onclick=()=>{state.totalResultVisible=!state.totalResultVisible;persist();render()};
  const cf=document.getElementById("compForm");if(cf)cf.onsubmit=e=>{e.preventDefault();const name=document.getElementById("newCompName").value.trim(),category=document.getElementById("newCompCategory").value;if(!name)return;state.competitions.push({id:newId(),name,category});persist();render()};
  document.querySelectorAll(".delete-comp").forEach(b=>b.onclick=()=>{if(confirm("Delete this competition? This also removes its result.")){state.competitions=state.competitions.filter(c=>c.id!==b.dataset.id);delete state.results[b.dataset.id];persist();render()}});
  document.querySelectorAll(".edit-comp").forEach(b=>b.onclick=()=>{const c=state.competitions.find(x=>x.id===b.dataset.id);if(!c)return;const name=prompt("Competition name:",c.name);if(name===null)return;const category=prompt("Category:",c.category);if(category===null)return;c.name=name.trim()||c.name;c.category=CATEGORIES.includes(category)?category:c.category;persist();render()});
  document.querySelectorAll(".delete-student").forEach(b=>b.onclick=()=>{if(confirm("Remove this student from the roster?")){state.students=state.students.filter(s=>s.id!==b.dataset.id);persist();render()}});
  document.querySelectorAll(".add-student-form").forEach(f=>f.onsubmit=e=>{e.preventDefault();const id=f.querySelector(".student-id").value.trim(),name=f.querySelector(".student-name").value.trim();if(!id||!name)return;state.students.push({id:newId(),groupId:f.dataset.group,studentId:id,name});persist();render()});
  const rc=document.getElementById("resultComp");if(rc)rc.onchange=()=>{state.resultManagerId=rc.value;state.resultForm=currentResultFormFrom(state.results[rc.value]);render()};
  if(state.resultManagerId&&!state.resultForm)state.resultForm=currentResultFormFrom(state.results[state.resultManagerId]);
  document.querySelectorAll("[data-rgroup]").forEach(s=>s.onchange=()=>{const [p,i]=s.dataset.rgroup.split(":");state.resultForm[p][+i]={groupId:s.value,studentId:""};persist();render()});
  document.querySelectorAll("[data-rstudent]").forEach(s=>s.onchange=()=>{const [p,i]=s.dataset.rstudent.split(":");state.resultForm[p][+i].studentId=s.value;persist()});
  document.querySelectorAll(".add-second").forEach(b=>b.onclick=()=>{const p=b.dataset.place;state.resultForm[p]=state.resultForm[p]||[{groupId:GROUPS[0].id,studentId:""}];if(state.resultForm[p].length<2)state.resultForm[p].push({groupId:GROUPS[0].id,studentId:""});persist();render()});
  document.querySelectorAll(".remove-second").forEach(b=>b.onclick=()=>{state.resultForm[b.dataset.place]=state.resultForm[b.dataset.place].slice(0,1);persist();render()});
  const pub=document.getElementById("publishResult");if(pub)pub.onclick=()=>{const id=state.resultManagerId;if(!id)return;state.results[id]={first:clone(state.resultForm.first),second:clone(state.resultForm.second),third:clone(state.resultForm.third),published:true};state.justPublished=id;setTimeout(()=>{state.justPublished=null;persist()},3000);persist();render()};
  const rev=document.getElementById("revokeResult");if(rev)rev.onclick=()=>{const id=state.resultManagerId;if(id){state.results[id]={...state.results[id],published:false};persist();render()}};
  document.querySelectorAll("[data-theme]").forEach(b=>b.onclick=()=>{state.posterTheme=b.dataset.theme;render()});
  const save=document.getElementById("savePoster");if(save)save.onclick=()=>{const c=state.competitions.find(x=>x.id===state.selectedId),r=state.results[state.selectedId],canvas=document.getElementById("posterCanvas");if(!canvas)return;const dataUrl=canvas.toDataURL("image/png");const a=document.createElement("a");a.href=dataUrl;a.download=`${c.name.replace(/\s+/g,"-")}-${state.posterTheme}-poster.png`;a.click();state.posterGallery.unshift({id:newId(),dataUrl,competitionName:c.name,style:state.posterTheme,createdAt:Date.now()});persist();render()};
}
render();
