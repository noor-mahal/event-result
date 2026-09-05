const EVENT_DATE=new Date(2026,8,5).getTime();
const PLACE_POINTS={first:10,second:5,third:3};
const CATEGORIES=["High Zone","Mid Zone","Zero Zone","Ground Zone"];
const ICONS={"High Zone":"🔺","Mid Zone":"🟡","Zero Zone":"⚪","Ground Zone":"🟤"};
const NAV=[["home","🏠","Home"],["competitions","🏆","Competitions"],["results","🥇","Results"],["totalresult","🏅","Total Result"],["gallery","🖼️","Gallery"],["admin","🔐","Admin"]];

let state={page:"home",selectedId:null,mobile:false,groups:[],students:[],competitions:[],results:{},gallery:[],signed:false,loading:true,totalResultVisible:true};
let query="",filter="all",adminTab="dashboard",loginView="signin",loginError="",forgotError="",justPublished=null,adminDraft={};

function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function groupName(id){return state.groups.find(g=>String(g.id)===String(id))?.name||"—"}
function student(id){return state.students.find(s=>String(s.studentId).toLowerCase()===String(id).toLowerCase())}
function totals(){return state.groups.slice(0,2).map((g,i)=>({...g,name:i===0?"KANZ":"Jawahar",total:Object.values(state.results).reduce((sum,r)=>sum+(r?.published?["first","second","third"].reduce((x,p)=>x+(r[p]||[]).reduce((z,s)=>z+(String(s?.groupId)===String(g.id)?PLACE_POINTS[p]:0),0),0):0),0)}))}
function live(){return `<span class="live"><i class="dot"></i>Live</span>`}
function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}

async function loadAll(){
  state.loading=true; render();
  const jobs=[
    ["groups",()=>appSupabase.from("groups").select("*").order("id")],
    ["students",()=>appSupabase.from("students").select("*")],
    ["competitions",()=>appSupabase.from("competitions").select("*").order("id")],
    ["results",()=>appSupabase.from("results").select("*")],
    ["gallery",()=>appSupabase.from("gallery").select("*").order("created_at",{ascending:false})],
    ["settings",()=>appSupabase.from("site_settings").select("*").eq("key","total_result_visible").maybeSingle()]
  ];
  const settled=await Promise.all(jobs.map(async([name,fn])=>{
    try{const r=await fn();return [name,r.data,r.error]}catch(e){return[name,null,e]}
  }));
  const errors=settled.filter(x=>x[2]);
  const byName=Object.fromEntries(settled.map(([name,data,error])=>[name,{data,error}]));
  if(byName.groups?.data)state.groups=byName.groups.data;
  if(byName.students?.data)state.students=byName.students.data.map(s=>({id:s.id,groupId:s.group_id,studentId:s.student_code,name:s.name}));
  if(byName.competitions?.data)state.competitions=byName.competitions.data;
  if(byName.results?.data){
    state.results={};
    byName.results.data.forEach(r=>state.results[r.competition_id]={first:r.first||[],second:r.second||[],third:r.third||[],published:!!r.published});
  }
  if(byName.gallery?.data)state.gallery=byName.gallery.data.map(p=>({id:p.id,dataUrl:p.image_data,competitionName:p.competition_name,style:p.style,createdAt:new Date(p.created_at).getTime()}));
  if(byName.settings?.data) state.totalResultVisible = byName.settings.data.value !== false && byName.settings.data.value !== "false";
  state.loading=false; render();
  if(errors.length)console.warn("Supabase table errors:",errors.map(x=>`${x[0]}: ${x[2]?.message||x[2]}`));
  return errors.length===0;
}

let realtimeTimer=null,realtimeChannel=null;
function refreshFromRealtime(){clearTimeout(realtimeTimer);realtimeTimer=setTimeout(()=>loadAll(),250)}
function subscribeRealtime(){
  if(realtimeChannel)try{appSupabase.removeChannel(realtimeChannel)}catch(e){}
  realtimeChannel=appSupabase.channel("public-data")
    .on("postgres_changes",{event:"*",schema:"public",table:"groups"},refreshFromRealtime)
    .on("postgres_changes",{event:"*",schema:"public",table:"results"},refreshFromRealtime)
    .on("postgres_changes",{event:"*",schema:"public",table:"competitions"},refreshFromRealtime)
    .on("postgres_changes",{event:"*",schema:"public",table:"students"},refreshFromRealtime)
    .on("postgres_changes",{event:"*",schema:"public",table:"gallery"},refreshFromRealtime)
    .on("postgres_changes",{event:"*",schema:"public",table:"site_settings"},refreshFromRealtime)
    .subscribe(status=>console.log("Realtime:",status));
}

async function initAuth(){
  try{
    const {data,error}=await appSupabase.auth.getSession();
    if(error)console.warn("Auth session:",error.message);
    state.signed=!!data?.session;
  }catch(e){console.warn("Auth init:",e);state.signed=false}
  appSupabase.auth.onAuthStateChange((event,session)=>{
    if(event==="PASSWORD_RECOVERY"){state.signed=true;loginView="forgot-newpass";state.page="admin";render();return}
    state.signed=!!session;
    render();
  });
}

function go(p,id=null){state.page=p;if(id!==null)state.selectedId=id;state.mobile=false;render();window.scrollTo(0,0)}
function nav(){return `<header><nav><button class="brand" onclick="go('home')">🕌 <span class="display">Sirajul Huda</span></button><div class="navlinks">${NAV.filter(n=>n[0]!=="totalresult"||state.totalResultVisible||state.signed).map(n=>`<button class="${state.page===n[0]?'active':''}" onclick="go('${n[0]}')">${n[1]} ${n[2]}</button>`).join("")}</div><button class="hamb" onclick="state.mobile=!state.mobile;render()"><span></span><span></span><span></span></button></nav><div class="mobilelinks ${state.mobile?'open':''}">${NAV.filter(n=>n[0]!=="totalresult"||state.totalResultVisible||state.signed).map(n=>`<button class="${state.page===n[0]?'active':''}" onclick="go('${n[0]}')">${n[1]} ${n[2]}</button>`).join("")}</div></header>`}

function home(){
  const announced=Object.values(state.results).filter(r=>r?.published).length;
  return `<section class="hero"><div class="pattern"></div><div class="hero-inner"><div class="mosque">🕌</div><div class="eyebrow">Sirajul Huda Arabic School · Unnalu, Koyyur</div><div class="arabic display">لوها · WAVES OF LOVE</div><h1 class="display">Meelad Fest 2K26</h1><p>A celebration of faith, talent and community — featuring speech, recitation, nasheed and knowledge competitions for all ages.</p><div class="meta"><span>📅 Sep-05, Saturday</span><span>📍 Unnalu, Koyyur Post, Belthangady</span></div><div class="actions"><button class="btn gold" onclick="go('competitions')">🏆 View Competitions</button><button class="btn outline" onclick="go('results')">🥇 View Results</button></div><div style="margin-top:25px">${live()}</div></div></section><div class="stats"><div class="statgrid"><div class="stat"><b>${state.competitions.length}</b><small>Competitions</small></div><div class="stat"><b>${announced}</b><small>Announced</small></div><div class="stat"><b>${Math.max(0,state.competitions.length-announced)}</b><small>Pending</small></div></div></div><section class="container center"><p class="display" style="font-size:24px;color:#064e3b">Results update the moment they're announced.</p><p class="muted">Live for every visitor — powered by Supabase.</p></section>`
}
function competitions(){
  let list=state.competitions.filter(c=>String(c.name||"").toLowerCase().includes(query.toLowerCase())).filter(c=>filter==="all"||(filter==="announced"?state.results[c.id]?.published:!state.results[c.id]?.published));
  return `<div class="container"><div class="pagehead"><div><h1 class="display">Competitions</h1></div>${live()}</div><div class="filters"><input class="input search" placeholder="Search competitions..." value="${esc(query)}" oninput="query=this.value;render()">${["all","announced","pending"].map(f=>`<button class="pill ${filter===f?'active':''}" onclick="filter='${f}';render()">${f==="all"?"All":f==="announced"?"🟢 Announced":"🟡 Pending"}</button>`).join("")}</div><div class="grid grid3" style="margin-top:30px">${list.map(c=>{let a=!!state.results[c.id]?.published;let order=state.competitions.findIndex(x=>x.id===c.id)+1;return `<button class="card compcard" onclick="go('result','${esc(c.id)}')"><div class="rowtop"><span class="order">${order}</span><span class="status ${a?'announced':'pending'}">${a?'🟢 Announced':'🟡 Pending'}</span></div><h3 class="display" style="color:#064e3b">${esc(c.name)}</h3><p class="muted">Category: ${esc(c.category)}</p><div class="link">View Result →</div></button>`}).join("")||`<div class="card">No competitions found.</div>`}</div></div>`
}
function resultPage(){
  let c=state.competitions.find(x=>String(x.id)===String(state.selectedId)),r=state.results[state.selectedId],a=!!r?.published;
  if(!c)return competitions();
  let places=[["🥇","1st Place","first"],["🥈","2nd Place","second"],["🥉","3rd Place","third"]];
  return `<div class="container narrow"><button class="smallbtn" onclick="go('competitions')">← Back to Competitions</button><div class="pagehead" style="margin-top:15px"><div><h1 class="display">${esc(c.name)}</h1><p class="muted">Category: ${esc(c.category)}</p></div>${live()}</div><div style="margin-top:30px">${a?`<div class="display" style="font-size:20px;color:#047857;margin-bottom:18px">🏆 Result Announced</div><div class="grid grid3">${places.map(p=>{let ss=r[p[2]]||[];return `<div class="place ${p[2]}">${justPublished===c.id?'<div>✨</div>':''}<span class="medal">${p[0]}</span><span class="label">${p[1]}</span><div class="names">${ss.length?ss.map(x=>isNoneGroup(x.groupId)?`<span class="name nopart">No participant</span>`:`<span class="name">${esc(student(x.studentId)?.name||"—")}</span><span>ID: ${esc(x.studentId||"—")}</span>`).join(""):`<span class="name">—</span>`}</div></div>`}).join("")}</div>${posterGenerator(c,r)}`:`<div class="empty"><div style="font-size:32px">⏳</div><p class="display">Result Not Announced</p><p class="muted">Results will be announced soon.</p></div>`}</div></div>`
}

const themes={
 emerald:{label:"Emerald Gold",bg1:"#0b2e22",bg2:"#123f2f",card:"#0f3a2c",stroke:"#D4AF37",pill:"#f4ead2",text:"#12261d",head:"#D4AF37",sub:"#c8c0a4"},
 cream:{label:"Cream Gold",bg1:"#f6efe0",bg2:"#efe4cc",card:"#faf6ec",stroke:"#c9a227",pill:"#fff",text:"#16211c",head:"#123f2f",sub:"#8a7a4a"},
 sky:{label:"Sky Rose",bg1:"#eaf2fb",bg2:"#fdeef4",card:"#fff",stroke:"#c9a227",pill:"#f7f8fb",text:"#16211c",head:"#123f2f",sub:"#8a8fa0"},
 ocean:{label:"Ocean Ivory",bg1:"#0e3b52",bg2:"#e8dfc8",card:"#faf6ec",stroke:"#c9a227",pill:"#fff",text:"#16211c",head:"#123f2f",sub:"#3a5568"}
};
let posterTheme="emerald";
function posterGenerator(c,r){return `<div class="card" style="margin-top:30px"><div class="pagehead"><h3 class="display">Poster Preview</h3><div class="themebar">${Object.entries(themes).map(([k,t])=>`<button class="pill ${posterTheme===k?'active':''}" onclick="posterTheme='${k}';render()">${t.label}</button>`).join("")}</div></div><div class="poster-wrap"><canvas id="poster" width="800" height="1000"></canvas></div><div class="center" style="margin-top:12px"><button class="btn gold" onclick="savePoster('${esc(c.id)}')">💾 Save to Gallery</button></div></div>`}
function drawPoster(cid){
  let c=state.competitions.find(x=>String(x.id)===String(cid)),r=state.results[cid],canvas=document.getElementById("poster");if(!canvas)return;
  let ctx=canvas.getContext("2d"),t=themes[posterTheme],W=800,H=1000;ctx.clearRect(0,0,W,H);
  let bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,t.bg1);bg.addColorStop(1,t.bg2);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=t.card;ctx.strokeStyle=t.stroke;ctx.lineWidth=3;round(ctx,70,50,660,840,80);ctx.fill();ctx.stroke();ctx.textAlign="center";
  ctx.fillStyle=t.head;ctx.font="44px serif";ctx.fillText("🕌",400,120);ctx.font="700 20px sans-serif";ctx.fillText("SIRAJUL HUDA ARABIC SCHOOL",400,160);
  ctx.font="14px sans-serif";ctx.fillStyle=t.sub;ctx.fillText("لوها · WAVES OF LOVE",400,185);ctx.fillStyle=t.card;ctx.strokeStyle=t.stroke;round(ctx,300,210,200,46,23);ctx.fill();ctx.stroke();
  ctx.fillStyle=t.head;ctx.font="700 24px sans-serif";ctx.fillText("RESULT",400,241);ctx.fillStyle=t.text;ctx.font="700 26px serif";wrap(ctx,c.name,400,330,520,32);
  [["01","first"],["02","second"],["03","third"]].forEach((p,i)=>{let y=390+i*130,ss=r[p[1]]||[],names=ss.map(x=>isNoneGroup(x.groupId)?"No participant":student(x.studentId)?.name||"Result pending").join(", ");ctx.fillStyle=t.card;round(ctx,120,y,64,72,16);ctx.fill();ctx.fillStyle=t.head;ctx.font="700 22px sans-serif";ctx.fillText(p[0],152,y+46);ctx.fillStyle=t.pill;round(ctx,200,y,480,72,36);ctx.fill();ctx.textAlign="left";ctx.fillStyle=t.text;ctx.font="700 22px sans-serif";ctx.fillText(names||"Result pending",226,y+30);ctx.font="14px sans-serif";ctx.fillStyle=t.sub;ctx.fillText("ID: "+(ss.map(x=>x.studentId).join(", ")||"—"),226,y+52)});
  ctx.textAlign="center";ctx.fillStyle=t.head;ctx.font="700 20px serif";ctx.fillText("Meelad Fest 2k26",400,850);ctx.font="14px sans-serif";ctx.fillStyle=t.sub;ctx.fillText("Sep-05 · Saturday · Unnalu, Koyyur",400,875)
}
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}
function wrap(ctx,text,x,y,max,line){let words=String(text||"").split(" "),s="",n=[];words.forEach(w=>{let z=s?s+" "+w:w;if(ctx.measureText(z).width>max&&s){n.push(s);s=w}else s=z});if(s)n.push(s);n.forEach((v,i)=>ctx.fillText(v,x,y+i*line))}
async function savePoster(cid){let c=state.competitions.find(x=>String(x.id)===String(cid)),canvas=document.getElementById("poster");if(!canvas||!c)return;drawPoster(cid);let data=canvas.toDataURL("image/png");let a=document.createElement("a");a.href=data;a.download=`${c.name.replace(/\s+/g,"-")}-${posterTheme}-poster.png`;a.click();const{error}=await appSupabase.from("gallery").insert({competition_name:c.name,style:posterTheme,image_data:data});if(error)alert("Could not save to Gallery: "+error.message);else alert("Poster saved to Gallery.")}

function resultsPage(){return `<div class="container narrow"><div class="pagehead"><div><h1 class="display">All Results</h1><p class="muted">Every competition, updated live.</p></div>${live()}</div><div class="grid grid2" style="margin-top:30px">${state.competitions.map(c=>{let r=state.results[c.id];return `<button class="card compcard" onclick="go('result','${esc(c.id)}')"><h3 class="display" style="color:#064e3b">${esc(c.name)}</h3>${r?.published?`<ul class="muted resultlist"><li>🥇 ID: ${esc((r.first||[])[0]?.studentId||"—")}</li><li>🥈 ID: ${esc((r.second||[])[0]?.studentId||"—")}</li><li>🥉 ID: ${esc((r.third||[])[0]?.studentId||"—")}</li></ul>`:`<p style="color:#a16207">⏳ Result Pending</p>`}</button>`}).join("")}</div></div>`}
function totalPage(){if(!state.totalResultVisible&&!state.signed)return `<div class="container narrow center"><div class="empty"><div style="font-size:32px">🔒</div><p class="display">Total Result Hidden</p><p class="muted">The administrator has temporarily hidden the overall result.</p></div></div>`;let ts=totals().sort((a,b)=>b.total-a.total);return `<div class="container narrow"><div class="pagehead"><div><h1 class="display">🏅 Total Result</h1><p class="muted">Overall standings across every announced competition.</p></div>${live()}</div><div class="grid grid3" style="margin-top:30px">${ts.slice(0,3).map((g,i)=>`<div class="place ${["first","second","third"][i]}"><span class="medal">${["🥇","🥈","🥉"][i]}</span><span class="label">${["1st Place","2nd Place","3rd Place"][i]}</span><span class="name">${esc(g.name)}</span><span>${g.total} Marks</span></div>`).join("")}</div><p class="center muted" style="font-size:12px;margin-top:20px">Scoring: 1st = 10 marks · 2nd = 5 marks · 3rd = 3 marks.</p></div>`}
function gallery(){return `<div class="container narrow"><div class="pagehead"><div><h1 class="display">🖼️ Poster Gallery</h1><p class="muted">Posters generated from result pages.</p></div>${live()}</div>${state.gallery.length?`<div class="grid grid3" style="margin-top:30px">${state.gallery.map(p=>`<div class="card"><img src="${esc(p.dataUrl)}" style="width:100%;border-radius:10px"><p><b>${esc(p.competitionName)}</b></p><small class="muted">${themes[p.style]?.label||esc(p.style)} · ${new Date(p.createdAt).toLocaleDateString()}</small><div class="actions" style="margin-top:10px"><a class="btn green" href="${esc(p.dataUrl)}" download="${esc(p.competitionName.replace(/\s+/g,'-'))}-poster.png">Download</a>${state.signed?`<button class="smallbtn danger" onclick="removePoster('${esc(p.id)}')">Remove</button>`:""}</div></div>`).join("")}</div>`:`<div class="empty" style="margin-top:30px"><div style="font-size:32px">🖼️</div><p class="display">No Posters Saved Yet</p></div>`}</div>`}
async function removePoster(id){if(!confirm("Remove this poster?"))return;const{error}=await appSupabase.from("gallery").delete().eq("id",id);if(error)alert(error.message);else loadAll()}

function adminLogin(){if(state.signed&&loginView!=="forgot-newpass")return adminPanel();return `<div class="container narrow center" style="max-width:500px"><div style="font-size:40px">🔐</div><h1 class="display">${loginView==="signin"?"Admin Sign In":loginView==="forgot-email"?"Forgot Password":"Set New Password"}</h1><p class="muted">${loginView==="signin"?"Manage competitions and publish results.":loginView==="forgot-email"?"Enter your admin email to receive a password reset link.":"Choose a new password for your admin account."}</p>${loginView==="signin"?signin():loginView==="forgot-email"?forgotEmailView():newPassView()}</div>`}
function box(content){return `<div class="card" style="margin-top:25px;text-align:left">${content}</div>`}
function signin(){return box(`<form onsubmit="signIn(event)"><div class="field"><label>Email</label><input id="lemail" type="email" autocomplete="username" class="input" placeholder="admin@example.com" required></div><div class="field" style="margin-top:14px"><label>Password</label><input id="lpass" type="password" autocomplete="current-password" class="input" required></div>${loginError?`<p class="error">${esc(loginError)}</p>`:""}<button id="signInBtn" class="btn green" type="submit" style="width:100%;margin-top:14px">Sign In →</button></form><button class="smallbtn" style="width:100%;margin-top:10px" onclick="loginView='forgot-email';loginError='';render()">Forgot password?</button>`)}
function forgotEmailView(){return box(`<form onsubmit="sendReset(event)"><div class="field"><label>Admin Email</label><input id="femail" type="email" autocomplete="email" class="input" required></div>${forgotError?`<p class="error">${esc(forgotError)}</p>`:""}<button class="btn green" type="submit" style="width:100%;margin-top:14px">Send Reset Link →</button></form><button class="smallbtn" style="width:100%;margin-top:10px" onclick="loginView='signin';forgotError='';render()">← Back to Sign In</button>`)}
function newPassView(){return box(`<form onsubmit="saveNewPass(event)"><div class="field"><label>New Password</label><input id="np1" type="password" autocomplete="new-password" class="input" minlength="6" required></div><div class="field" style="margin-top:14px"><label>Confirm New Password</label><input id="np2" type="password" autocomplete="new-password" class="input" minlength="6" required></div>${forgotError?`<p class="error">${esc(forgotError)}</p>`:""}<button class="btn green" type="submit" style="width:100%;margin-top:14px">Save New Password →</button></form>`)}
async function signIn(e){
  if(e)e.preventDefault();
  const email=document.getElementById("lemail")?.value.trim()||"",password=document.getElementById("lpass")?.value||"",button=document.getElementById("signInBtn");
  loginError="";
  if(button){button.disabled=true;button.textContent="Signing in…"}
  try{
    const{data,error}=await appSupabase.auth.signInWithPassword({email,password});
    if(error){
      const msg=String(error.message||"");
      if(/email not confirmed/i.test(msg))loginError="Email is not confirmed in Supabase Authentication.";
      else if(/invalid login credentials/i.test(msg))loginError="Email or password is incorrect.";
      else loginError=msg||"Unable to sign in.";
      render();return;
    }
    if(!data?.session){loginError="No login session was returned. Check Supabase Authentication.";render();return}
    state.signed=true;loginError="";state.page="admin";loginView="signin";await loadAll();render();
  }catch(err){loginError=err?.message||"Unable to connect to Supabase.";render()}
}
async function sendReset(e){
  if(e)e.preventDefault();
  const email=document.getElementById("femail")?.value.trim()||"";
  forgotError="";
  try{
    const redirectTo=window.location.origin+window.location.pathname;
    const{error}=await appSupabase.auth.resetPasswordForEmail(email,{redirectTo});
    if(error){forgotError=error.message;render();return}
    alert("Reset link sent. Check the admin email inbox.");
    loginView="signin";render();
  }catch(err){forgotError=err?.message||"Unable to send reset link.";render()}
}
async function saveNewPass(e){
  if(e)e.preventDefault();
  const a=document.getElementById("np1")?.value||"",b=document.getElementById("np2")?.value||"";
  if(a.length<6){forgotError="Password must be at least 6 characters.";render();return}
  if(a!==b){forgotError="Passwords don't match.";render();return}
  try{
    const{error}=await appSupabase.auth.updateUser({password:a});
    if(error){forgotError=error.message;render();return}
    forgotError="";loginView="signin";alert("Password updated successfully.");render();
  }catch(err){forgotError=err?.message||"Unable to update password.";render()}
}
async function signOut(){await appSupabase.auth.signOut();state.signed=false;loginView="signin";state.page="admin";render()}

function adminPanel(){
  let announced=Object.values(state.results).filter(r=>r?.published).length;
  return `<div class="container"><div class="tabs">${[["dashboard","📊 Dashboard"],["competitions","🏆 Competitions"],["students","🧑‍🎓 Students"],["results","🥇 Results"]].map(x=>`<button class="pill ${adminTab===x[0]?'active':''}" onclick="adminTab='${x[0]}';render()">${x[1]}</button>`).join("")}<button class="smallbtn" onclick="signOut()" style="margin-left:auto">Sign Out</button></div>${adminTab==="dashboard"?dashboard(announced):adminTab==="competitions"?manageCompetitions():adminTab==="students"?manageStudents():manageResults()}</div>`
}
function dashboard(a){let ts=totals().sort((x,y)=>y.total-x.total);return `<div class="grid grid2" style="margin-top:25px"><div class="grid grid2"><div class="card"><b style="font-size:28px">${state.competitions.length}</b><p class="muted">Competitions</p></div><div class="card"><b style="font-size:28px">${state.students.length}</b><p class="muted">Students</p></div><div class="card"><b style="font-size:28px">${a}</b><p class="muted">Announced</p></div><div class="card"><b style="font-size:28px">${state.competitions.length-a}</b><p class="muted">Pending</p></div></div><div class="card"><h3 class="display">Total Marks</h3>${ts.slice(0,2).map((g,i)=>`<div class="list"><span>${i===0?"🥇":"🥈"} <b>${esc(g.name)}</b></span><b>${g.total}</b></div>`).join("")}</div><div class="card" style="margin-top:20px"><h3 class="display">Public Display Settings</h3><div class="setting-row"><div><b>Total Result</b><div class="muted" style="font-size:12px">Show or hide the overall Total Result page for visitors.</div></div><label class="switch"><input type="checkbox" ${state.totalResultVisible?"checked":""} onchange="toggleTotalResult(this.checked)"><span class="slider"></span></label></div></div></div>`}
async function toggleTotalResult(visible){
  const next=!!visible;
  state.totalResultVisible=next;
  render();
  const {error}=await appSupabase.from("site_settings").upsert({key:"total_result_visible",value:next},{onConflict:"key"});
  if(error){
    console.error("Total Result setting save failed:",error);
    state.totalResultVisible=!next;
    render();
    alert("Could not save Total Result setting. Run site-settings.sql in Supabase SQL Editor once, then try again.");
    return;
  }
  state.totalResultVisible=next;
  render();
}

function manageCompetitions(){return `<div class="grid grid2" style="margin-top:25px"><div class="card"><h2 class="display">Add Competition</h2><div class="field"><label>Name</label><input id="cn" class="input" placeholder="Competition name"></div><div class="field" style="margin-top:14px"><label>Category</label><select id="cc" class="select">${CATEGORIES.map(c=>`<option>${c}</option>`).join("")}</select></div><button class="btn green" style="margin-top:15px" onclick="addComp()">Add Competition</button></div><div><h2 class="display">All Competitions</h2><ul class="list">${state.competitions.map(c=>`<li><span>${ICONS[c.category]||"🏅"} <b>${esc(c.name)}</b><small class="muted"> · ${esc(c.category)} · ${state.results[c.id]?.published?"🟢 Announced":"🟡 Pending"}</small></span><span><button class="smallbtn" onclick="editComp('${esc(c.id)}')">Edit</button> <button class="smallbtn danger" onclick="deleteComp('${esc(c.id)}')">Delete</button></span></li>`).join("")}</ul></div></div>`}
async function addComp(){let n=document.getElementById("cn")?.value.trim(),c=document.getElementById("cc")?.value;if(!n)return;const{error}=await appSupabase.from("competitions").insert({id:newId(),name:n,category:c});if(error)alert(error.message);else loadAll()}
async function editComp(id){let c=state.competitions.find(x=>String(x.id)===String(id));if(!c)return;let n=prompt("Competition name:",c.name);if(n===null)return;let cat=prompt("Category:",c.category);if(!n.trim())return;let patch={name:n.trim()};if(CATEGORIES.includes(cat))patch.category=cat;const{error}=await appSupabase.from("competitions").update(patch).eq("id",id);if(error)alert(error.message);else loadAll()}
async function deleteComp(id){if(!confirm("Delete this competition? This may also remove its result."))return;const{error}=await appSupabase.from("competitions").delete().eq("id",id);if(error)alert(error.message);else loadAll()}
function manageStudents(){return `<div class="grid grid2" style="margin-top:25px">${state.groups.slice(0,2).map((g,gi)=>{let ss=state.students.filter(s=>String(s.groupId)===String(g.id));return `<div class="card"><h2 class="display">${gi===0?"KANZ":"Jawahar"}</h2><ul class="list">${ss.map(s=>`<li><span><b>${esc(s.name)}</b><small class="muted"> · ID: ${esc(s.studentId)}</small></span><button class="smallbtn danger" onclick="delStudent('${esc(s.id)}')">Delete</button></li>`).join("")||"<li>No students yet.</li>"}</ul><div class="field"><label>Student ID</label><input id="sid-${esc(g.id)}" class="input" placeholder="e.g. K01"></div><div class="field" style="margin-top:8px"><label>Student Name</label><input id="sn-${esc(g.id)}" class="input"></div><button class="btn green" style="margin-top:10px" onclick="addStudent('${esc(g.id)}')">Add Student</button></div>`}).join("")}</div>`}
async function addStudent(gid){let id=document.getElementById("sid-"+gid)?.value.trim(),n=document.getElementById("sn-"+gid)?.value.trim();if(!id||!n)return;const{error}=await appSupabase.from("students").insert({id:newId(),group_id:gid,student_code:id,name:n});if(error)alert(error.message);else loadAll()}
async function delStudent(id){if(!confirm("Remove this student?"))return;const{error}=await appSupabase.from("students").delete().eq("id",id);if(error)alert(error.message);else loadAll()}
function manageResults(){return `<div style="max-width:650px;margin-top:25px"><div class="field"><label>Select Competition</label><select id="rc" class="select" onchange="selectedAdminComp(this.value)"><option value="">Choose a competition...</option>${state.competitions.map(c=>`<option value="${esc(c.id)}">${esc(c.name)} ${state.results[c.id]?.published?"🟢":"🟡"}</option>`).join("")}</select></div><div id="resultForm"></div></div>`}
function resultGroups(){
  const gs=state.groups.slice(0,2);
  return [
    ...(gs[0]?[{id:gs[0].id,name:"KANZ"}]:[]),
    ...(gs[1]?[{id:gs[1].id,name:"Jawahar"}]:[]),
    {id:"__none__",name:"No participant"}
  ];
}
function isNoneGroup(id){return String(id)==="__none__"}
function draftResult(id){let r=state.results[id]||{};if(!adminDraft[id])adminDraft[id]={first:(r.first||[]).map(x=>({...x})),second:(r.second||[]).map(x=>({...x})),third:(r.third||[]).map(x=>({...x}))};["first","second","third"].forEach(p=>{if(!adminDraft[id][p].length)adminDraft[id][p]=[{groupId:state.groups[0]?.id||"__none__",studentId:state.students.find(s=>String(s.groupId)===String(state.groups[0]?.id))?.studentId||""}]});return adminDraft[id]}
function selectedAdminComp(id){let c=state.competitions.find(x=>String(x.id)===String(id)),box=document.getElementById("resultForm");if(!box)return;if(!c){box.innerHTML="";return}let d=draftResult(id),html=`<div class="card" style="margin-top:20px"><p class="muted">Status: ${state.results[id]?.published?"🟢 Announced":"🟡 Not Announced"}</p>`;[["first","🥇 1st Place (20 marks)"],["second","🥈 2nd Place (10 marks)"],["third","🥉 3rd Place (7 marks)"]].forEach(([p,label])=>{html+=`<div class="card" style="margin-top:12px;padding:12px"><b>${label}</b>`;d[p].forEach((x,i)=>{let g=x.groupId||state.groups[0]?.id||"__none__";html+=`<div class="result-entry"><select class="select" onchange="updateResultDraft('${esc(id)}','${p}',${i},'group',this.value)">${resultGroups().map(z=>`<option value="${esc(z.id)}" ${String(z.id)===String(g)?"selected":""}>${esc(z.name)}</option>`).join("")}</select>${isNoneGroup(g)?`<div class="input nopart">No participant</div>`:`<select class="select" onchange="updateResultDraft('${esc(id)}','${p}',${i},'student',this.value)">${state.students.filter(z=>String(z.groupId)===String(g)).map(z=>`<option value="${esc(z.studentId)}" ${String(z.studentId)===String(x.studentId)?"selected":""}>${esc(z.name)} (ID: ${esc(z.studentId)})</option>`).join("")}</select>`}<button class="smallbtn danger" onclick="removeResultStudent('${esc(id)}','${p}',${i})" ${d[p].length===1?"disabled":""}>Remove</button></div>`});html+=`<button class="smallbtn" style="margin-top:10px" onclick="addResultStudent('${esc(id)}','${p}')">+ Add Student</button></div>`});html+=`<div class="actions" style="justify-content:flex-start"><button class="btn gold" onclick="publishResult('${esc(id)}')">${state.results[id]?.published?"Update Result":"Publish Result"}</button>${state.results[id]?.published?`<button class="smallbtn" onclick="revokeResult('${esc(id)}')">Revoke Announcement</button>`:""}</div></div>`;box.innerHTML=html}
function updateResultDraft(id,p,i,type,value){let d=draftResult(id);if(type==="group"){d[p][i].groupId=value;d[p][i].studentId=isNoneGroup(value)?"":state.students.find(s=>String(s.groupId)===String(value))?.studentId||""}else d[p][i].studentId=value;selectedAdminComp(id)}
function addResultStudent(id,p){let d=draftResult(id),last=d[p][d[p].length-1]||{groupId:state.groups[0]?.id||"__none__"},g=isNoneGroup(last.groupId)?"__none__":last.groupId;d[p].push({groupId:g,studentId:state.students.find(s=>String(s.groupId)===String(g))?.studentId||""});selectedAdminComp(id)}
function removeResultStudent(id,p,i){let d=draftResult(id);if(d[p].length>1){d[p].splice(i,1);selectedAdminComp(id)}}
async function publishResult(id){let d=draftResult(id),row={competition_id:id,published:true};["first","second","third"].forEach(p=>row[p]=d[p].map(x=>({groupId:x.groupId,studentId:x.studentId||""})).filter(x=>x.groupId));const{error}=await appSupabase.from("results").upsert(row,{onConflict:"competition_id"});if(error){alert(error.message);return}justPublished=id;await loadAll();setTimeout(()=>{justPublished=null;render()},3000)}
async function revokeResult(id){const{error}=await appSupabase.from("results").update({published:false}).eq("competition_id",id);if(error)alert(error.message);else loadAll()}

function footer(){return `<footer><div class="footerin"><div><strong>🕌 Sirajul Huda Arabic School</strong><div>Milad Fest 2K26 · لوها Waves of Love · Unnalu, Koyyur</div></div><div>© 2026 Sirajul Huda Arabic School, Unnalu, Koyyur.</div></div></footer>`}
function render(){
  const app=document.getElementById("app");if(!app)return;
  if(state.loading){app.innerHTML=`<div class="preview">Loading live data…</div>`;return}
  let content=state.page==="home"?home():state.page==="competitions"?competitions():state.page==="result"?resultPage():state.page==="results"?resultsPage():state.page==="totalresult"?totalPage():state.page==="gallery"?gallery():adminLogin();
  app.innerHTML=`${nav()}<main>${content}</main>${footer()}`;
  if(state.page==="result"&&state.selectedId&&state.results[state.selectedId]?.published)drawPoster(state.selectedId);
  if(state.page==="admin"&&state.signed&&adminTab==="results"){const sel=document.getElementById("rc");if(sel&&sel.value)selectedAdminComp(sel.value)}
}
setInterval(()=>{if(state.page==="home")render()},1000);

(async function boot(){
  try{await initAuth();await loadAll();subscribeRealtime()}catch(error){
    console.error("Application startup error:",error);state.loading=false;
    const app=document.getElementById("app");
    if(app)app.innerHTML=`<div class="preview" style="padding:30px;text-align:center"><h2>Website startup error</h2><p>${esc(error?.message||"Unknown error")}</p><button class="btn green" onclick="location.reload()">Reload</button></div>`;
  }
})();
