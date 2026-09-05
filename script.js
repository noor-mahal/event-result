const EVENT_DATE=new Date(2026,8,5).getTime();
const PLACE_POINTS={first:20,second:10,third:7};
const CATEGORIES=["High Zone","Mid Zone","Zero Zone","Ground Zone"];
const ICONS={"High Zone":"🔺","Mid Zone":"🟡","Zero Zone":"⚪","Ground Zone":"🟤"};
const NAV=[["home","🏠","Home"],["competitions","🏆","Competitions"],["results","🥇","Results"],["totalresult","🏅","Total Result"],["gallery","🖼️","Gallery"],["admin","🔐","Admin"]];

let state={page:"home",selectedId:null,mobile:false,groups:[],students:[],competitions:[],results:{},gallery:[],signed:false,loading:true};
let query="",filter="all",adminTab="dashboard",loginView="signin",loginError="",forgotError="",justPublished=null,adminDraft={};

function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function groupName(id){return state.groups.find(g=>String(g.id)===String(id))?.name||"—"}
function student(id){return state.students.find(s=>String(s.studentId).toLowerCase()===String(id).toLowerCase())}
function totals(){return state.groups.map(g=>({...g,total:Object.values(state.results).reduce((sum,r)=>sum+(r?.published?["first","second","third"].reduce((x,p)=>x+(r[p]||[]).reduce((z,s)=>z+(String(s?.groupId)===String(g.id)?PLACE_POINTS[p]:0),0),0):0),0)}))}
function live(){return `<span class="live"><i class="dot"></i>Live</span>`}
function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}

async function loadAll(){
  state.loading=true;
  render();

  const jobs = [
    ["groups", () => supabase.from("groups").select("*").order("id")],
    ["students", () => supabase.from("students").select("*")],
    ["competitions", () => supabase.from("competitions").select("*").order("id")],
    ["results", () => supabase.from("results").select("*")],
    ["gallery", () => supabase.from("gallery").select("*").order("created_at",{ascending:false})]
  ];

  const results = await Promise.all(jobs.map(async ([name,fn]) => {
    try {
      const response = await fn();
      return [name, response.data, response.error];
    } catch (error) {
      return [name, null, error];
    }
  }));

  const errors = results.filter(([,data,error]) => error);
  const byName = Object.fromEntries(results.map(([name,data,error]) => [name,{data,error}]));

  if(byName.groups?.data) state.groups=byName.groups.data;
  if(byName.students?.data){
    state.students=byName.students.data.map(s=>({
      id:s.id,
      groupId:s.group_id,
      studentId:s.student_code,
      name:s.name
    }));
  }
  if(byName.competitions?.data) state.competitions=byName.competitions.data;
  if(byName.results?.data){
    state.results={};
    byName.results.data.forEach(r=>{
      state.results[r.competition_id]={
        first:r.first||[],
        second:r.second||[],
        third:r.third||[],
        published:!!r.published
      };
    });
  }
  if(byName.gallery?.data){
    state.gallery=byName.gallery.data.map(p=>({
      id:p.id,
      dataUrl:p.image_data,
      competitionName:p.competition_name,
      style:p.style,
      createdAt:new Date(p.created_at).getTime()
    }));
  }

  state.loading=false;
  render();

  if(errors.length){
    console.warn("Some Supabase tables could not be loaded:", errors.map(([name,,error]) => `${name}: ${error?.message||error}`));
  }

  return errors.length===0;
}

let realtimeTimer=null;
function subscribeRealtime(){
  supabase.channel("public-data")
    .on("postgres_changes",{event:"*",schema:"public",table:"groups"},refreshFromRealtime)
    .on("postgres_changes",{event:"*",schema:"public",table:"results"},refreshFromRealtime)
    .on("postgres_changes",{event:"*",schema:"public",table:"competitions"},refreshFromRealtime)
    .on("postgres_changes",{event:"*",schema:"public",table:"students"},refreshFromRealtime)
    .on("postgres_changes",{event:"*",schema:"public",table:"gallery"},refreshFromRealtime)
    .subscribe();
}
function refreshFromRealtime(){
  clearTimeout(realtimeTimer);
  realtimeTimer=setTimeout(()=>loadAll(),150);
}

async function initAuth(){
  try{
    const {data,error}=await supabase.auth.getSession();
    if(error) console.warn("Supabase session check:",error.message);
    state.signed=!!data?.session;
  }catch(error){
    console.warn("Supabase auth initialization failed:",error);
    state.signed=false;
  }

  supabase.auth.onAuthStateChange((event,session)=>{
    if(event==="PASSWORD_RECOVERY"){
      loginView="forgot-newpass";
      state.signed=false;
      render();
      return;
    }
    state.signed=!!session;
    render();
  });
}

function go(p,id=null){state.page=p;if(id!==null)state.selectedId=id;state.mobile=false;render();window.scrollTo(0,0)}
function nav(){
  return `<header><nav><button class="brand" onclick="go('home')">🕌 <span class="display">Sirajul Huda</span></button>
  <div class="navlinks">${NAV.map(n=>`<button class="${state.page===n[0]?'active':''}" onclick="go('${n[0]}')">${n[1]} ${n[2]}</button>`).join("")}</div>
  <button class="hamb" onclick="state.mobile=!state.mobile;render()"><span></span><span></span><span></span></button></nav>
  <div class="mobilelinks ${state.mobile?'open':''}">${NAV.map(n=>`<button class="${state.page===n[0]?'active':''}" onclick="go('${n[0]}')">${n[1]} ${n[2]}</button>`).join("")}</div></header>`
}
function home(){
  const announced=Object.values(state.results).filter(r=>r?.published).length;
  return `<section class="hero"><div class="pattern"></div><div class="hero-inner"><div class="mosque">🕌</div>
  <div class="eyebrow">Sirajul Huda Arabic School · Unnalu, Koyyur</div><div class="arabic display">لوها · WAVES OF LOVE</div>
  <h1 class="display">Meelad Fest 2K26</h1><p>A celebration of faith, talent and community — featuring speech, recitation, nasheed and knowledge competitions for all ages.</p>
  <div class="meta"><span>📅 Sep-05, Saturday</span><span>📍 Unnalu, Koyyur Post, Belthangady</span></div>
  <div class="actions"><button class="btn gold" onclick="go('competitions')">🏆 View Competitions</button><button class="btn outline" onclick="go('results')">🥇 View Results</button></div>
  <div style="margin-top:25px">${live()}</div></div></section>
  <div class="stats"><div class="statgrid"><div class="stat"><b>${state.competitions.length}</b><small>Competitions</small></div><div class="stat"><b>${announced}</b><small>Announced</small></div><div class="stat"><b>${Math.max(0,state.competitions.length-announced)}</b><small>Pending</small></div></div></div>
  <section class="container center"><p class="display" style="font-size:24px;color:#064e3b">Results update the moment they're announced.</p><p class="muted">Live for every visitor — powered by Supabase.</p></section>`
}
function competitions(){
  let list=state.competitions.filter(c=>String(c.name||"").toLowerCase().includes(query.toLowerCase())).filter(c=>filter==="all"||(filter==="announced"?state.results[c.id]?.published:!state.results[c.id]?.published));
  return `<div class="container"><div class="pagehead"><div><h1 class="display">Competitions</h1></div>${live()}</div>
  <div class="filters"><input class="input search" placeholder="Search competitions..." value="${esc(query)}" oninput="query=this.value;render()">${["all","announced","pending"].map(f=>`<button class="pill ${filter===f?'active':''}" onclick="filter='${f}';render()">${f==="all"?"All":f==="announced"?"🟢 Announced":"🟡 Pending"}</button>`).join("")}</div>
  <div class="grid grid3" style="margin-top:30px">${list.map(c=>{let a=state.results[c.id]?.published;let order=state.competitions.findIndex(x=>x.id===c.id)+1;return `<button class="card compcard" onclick="go('result','${esc(c.id)}')"><div class="rowtop"><span class="order">${order}</span><span class="status ${a?'announced':'pending'}">${a?'🟢 Announced':'🟡 Pending'}</span></div><h3 class="display" style="color:#064e3b">${esc(c.name)}</h3><p class="muted">Category: ${esc(c.category)}</p><div class="link">View Result →</div></button>`}).join("")||`<div class="card">No competitions found.</div>`}</div></div>`
}
function resultPage(){
  let c=state.competitions.find(x=>String(x.id)===String(state.selectedId)),r=state.results[state.selectedId],a=!!r?.published;
  if(!c)return competitions();
  let places=[["🥇","1st Place","first"],["🥈","2nd Place","second"],["🥉","3rd Place","third"]];
  return `<div class="container narrow"><button class="smallbtn" onclick="go('competitions')">← Back to Competitions</button><div class="pagehead" style="margin-top:15px"><div><h1 class="display">${esc(c.name)}</h1><p class="muted">Category: ${esc(c.category)}</p></div>${live()}</div><div style="margin-top:30px">${a?`<div class="display" style="font-size:20px;color:#047857;margin-bottom:18px">🏆 Result Announced</div><div class="grid grid3">${places.map(p=>{let ss=r[p[2]]||[];return `<div class="place ${p[2]}">${justPublished===c.id?'<div>✨</div>':''}<span class="medal">${p[0]}</span><span class="label">${p[1]}</span><div class="names">${ss.length?ss.map(x=>`<span class="name">${esc(student(x.studentId)?.name||"—")}</span><span>ID: ${esc(x.studentId||"—")}</span>`).join(""):`<span class="name">—</span>`}</div></div>`}).join("")}</div>${posterGenerator(c,r)}`:`<div class="empty"><div style="font-size:32px">⏳</div><p class="display">Result Not Announced</p><p class="muted">Results will be announced soon.</p></div>`}</div></div>`
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
  [["01","first"],["02","second"],["03","third"]].forEach((p,i)=>{let y=390+i*130,ss=r[p[1]]||[],names=ss.map(x=>student(x.studentId)?.name||"Result pending").join(", ");ctx.fillStyle=t.card;round(ctx,120,y,64,72,16);ctx.fill();ctx.fillStyle=t.head;ctx.font="700 22px sans-serif";ctx.fillText(p[0],152,y+46);ctx.fillStyle=t.pill;round(ctx,200,y,480,72,36);ctx.fill();ctx.textAlign="left";ctx.fillStyle=t.text;ctx.font="700 22px sans-serif";ctx.fillText(names||"Result pending",226,y+30);ctx.font="14px sans-serif";ctx.fillStyle=t.sub;ctx.fillText("ID: "+(ss.map(x=>x.studentId).join(", ")||"—"),226,y+52)});
  ctx.textAlign="center";ctx.fillStyle=t.head;ctx.font="700 20px serif";ctx.fillText("Meelad Fest 2k26",400,850);ctx.font="14px sans-serif";ctx.fillStyle=t.sub;ctx.fillText("Sep-05 · Saturday · Unnalu, Koyyur",400,875)
}
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}
function wrap(ctx,text,x,y,max,line){let words=String(text||"").split(" "),s="",n=[];words.forEach(w=>{let z=s?s+" "+w:w;if(ctx.measureText(z).width>max&&s){n.push(s);s=w}else s=z});if(s)n.push(s);n.forEach((v,i)=>ctx.fillText(v,x,y+i*line))}
async function savePoster(cid){
  let c=state.competitions.find(x=>String(x.id)===String(cid)),canvas=document.getElementById("poster");if(!canvas||!c)return;drawPoster(cid);
  let data=canvas.toDataURL("image/png"),a=document.createElement("a");a.href=data;a.download=`${c.name.replace(/\s+/g,"-")}-${posterTheme}-poster.png`;a.click();
  const {error}=await supabase.from("gallery").insert({competition_name:c.name,style:posterTheme,image_data:data});
  if(error){alert("Could not save to Gallery: "+error.message);return} alert("Poster saved to Gallery.")
}
function resultsPage(){return `<div class="container narrow"><div class="pagehead"><div><h1 class="display">All Results</h1><p class="muted">Every competition, updated live.</p></div>${live()}</div><div class="grid grid2" style="margin-top:30px">${state.competitions.map(c=>{let r=state.results[c.id];return `<button class="card compcard" onclick="go('result','${esc(c.id)}')"><h3 class="display" style="color:#064e3b">${esc(c.name)}</h3>${r?.published?`<ul class="muted resultlist"><li>🥇 ID: ${esc((r.first||[])[0]?.studentId||"—")}</li><li>🥈 ID: ${esc((r.second||[])[0]?.studentId||"—")}</li><li>🥉 ID: ${esc((r.third||[])[0]?.studentId||"—")}</li></ul>`:`<p style="color:#a16207">⏳ Result Pending</p>`}</button>`}).join("")}</div>${bulletinGenerator()}</div>`}
function bulletinGenerator(){return `<div class="card" style="margin-top:30px"><div class="pagehead"><div><h2 class="display">🖼️ Results Bulletin</h2><p class="muted">Generate a poster covering up to 10 competitions.</p></div><button class="btn green" onclick="generateBulletin()">Generate Bulletin</button></div><div id="bulletinBox"></div></div>`}
function generateBulletin(){let box=document.getElementById("bulletinBox");box.innerHTML=`<div class="poster-wrap" style="margin-top:15px"><canvas id="bulletin" width="900" height="1200"></canvas></div><div class="center"><button class="btn gold" onclick="downloadBulletin()">💾 Download Bulletin</button></div>`;drawBulletin()}
function drawBulletin(){let c=document.getElementById("bulletin");if(!c)return;let ctx=c.getContext("2d"),t=themes[posterTheme],W=900,H=1200;let bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,t.bg1);bg.addColorStop(1,t.bg2);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);ctx.fillStyle=t.card;ctx.strokeStyle=t.stroke;ctx.lineWidth=3;round(ctx,40,40,820,1120,28);ctx.fill();ctx.stroke();ctx.textAlign="center";ctx.fillStyle=t.head;ctx.font="700 22px sans-serif";ctx.fillText("SIRAJUL HUDA ARABIC SCHOOL — RESULTS",450,90);ctx.font="14px sans-serif";ctx.fillStyle=t.sub;ctx.fillText("Meelad Fest 2k26 · Competitions 1–"+Math.min(10,state.competitions.length),450,114);let y=160;state.competitions.slice(0,10).forEach((x,i)=>{let r=state.results[x.id];ctx.fillStyle=t.pill;round(ctx,80,y,740,80,16);ctx.fill();ctx.textAlign="left";ctx.fillStyle=t.text;ctx.font="700 18px sans-serif";ctx.fillText(`${i+1}. ${x.name}`,105,y+28);ctx.font="14px sans-serif";ctx.fillStyle=t.sub;let line=r?.published?`🥇 ${(r.first||[]).map(x=>student(x.studentId)?.name||"—").join(", ")}   🥈 ${(r.second||[]).map(x=>student(x.studentId)?.name||"—").join(", ")}   🥉 ${(r.third||[]).map(x=>student(x.studentId)?.name||"—").join(", ")}`:"⏳ Result pending";ctx.fillText(line,105,y+53);y+=96});ctx.textAlign="center";ctx.fillStyle=t.sub;ctx.font="italic 12px sans-serif";ctx.fillText("Generated live from the Results page",450,1135)}
function downloadBulletin(){let c=document.getElementById("bulletin");if(!c)return;let a=document.createElement("a");a.href=c.toDataURL("image/png");a.download="results-bulletin.png";a.click()}
function totalPage(){let ts=totals().sort((a,b)=>b.total-a.total);return `<div class="container narrow"><div class="pagehead"><div><h1 class="display">🏅 Total Result</h1><p class="muted">Overall standings across every announced competition.</p></div>${live()}</div><div class="grid grid3" style="margin-top:30px">${ts.slice(0,3).map((g,i)=>`<div class="place ${["first","second","third"][i]}"><span class="medal">${["🥇","🥈","🥉"][i]}</span><span class="label">${["1st Place","2nd Place","3rd Place"][i]}</span><span class="name">${esc(g.name)}</span><span>${g.total} Marks</span></div>`).join("")}</div><p class="center muted" style="font-size:12px;margin-top:20px">Scoring: 1st = 20 marks · 2nd = 10 marks · 3rd = 7 marks.</p>${lookup()}</div>`}
function lookup(){return `<div class="card" style="margin-top:30px"><h2 class="display">🔎 Participant Lookup</h2><p class="muted">Enter a student ID to see announced placements.</p><form onsubmit="lookupDo(event)" style="display:flex;gap:8px;margin-top:15px"><input id="lookupId" class="input" placeholder="Student ID (e.g. K01)"><button class="btn green">Search</button></form><div id="lookupOut"></div></div>`}
function lookupDo(e){e.preventDefault();let id=document.getElementById("lookupId").value.trim(),s=student(id),out=document.getElementById("lookupOut");if(!s){out.innerHTML='<p class="error">No student found with that ID.</p>';return}let rows=[];Object.entries(state.results).forEach(([cid,r])=>{if(!r?.published)return;["first","second","third"].forEach(p=>{if((r[p]||[]).some(x=>String(x?.studentId).toLowerCase()===id.toLowerCase())){let c=state.competitions.find(x=>String(x.id)===String(cid));if(c)rows.push([c.name,p])}})});out.innerHTML=`<p><b>${esc(s.name)}</b> · ${esc(groupName(s.groupId))} · ID: ${esc(s.studentId)}</p>${rows.length?`<ul class="list">${rows.map(x=>`<li>${esc(x[0])}<b>${x[1]==="first"?"🥇 1st":x[1]==="second"?"🥈 2nd":"🥉 3rd"}</b></li>`).join("")}</ul>`:'<p class="muted">No announced placements yet.</p>'}`}
function gallery(){return `<div class="container narrow"><div class="pagehead"><div><h1 class="display">🖼️ Poster Gallery</h1><p class="muted">Posters generated from result pages.</p></div>${live()}</div>${state.gallery.length?`<div class="grid grid3" style="margin-top:30px">${state.gallery.map(p=>`<div class="card"><img src="${esc(p.dataUrl)}" style="width:100%;border-radius:10px"><p><b>${esc(p.competitionName)}</b></p><small class="muted">${themes[p.style]?.label||esc(p.style)} · ${new Date(p.createdAt).toLocaleDateString()}</small><div class="actions" style="margin-top:10px"><a class="btn green" href="${esc(p.dataUrl)}" download="${esc(p.competitionName.replace(/\s+/g,'-'))}-poster.png">Download</a>${state.signed?`<button class="smallbtn danger" onclick="removePoster('${esc(p.id)}')">Remove</button>`:""}</div></div>`).join("")}</div>`:`<div class="empty" style="margin-top:30px"><div style="font-size:32px">🖼️</div><p class="display">No Posters Saved Yet</p><p class="muted">Open an announced result and generate a poster.</p></div>`}</div>`}
async function removePoster(id){if(!confirm("Remove this poster?"))return;const {error}=await supabase.from("gallery").delete().eq("id",id);if(error)alert(error.message)}

function adminLogin(){if(state.signed)return adminPanel();return `<div class="container narrow center" style="max-width:500px"><div style="font-size:40px">🔐</div><h1 class="display">${loginView==="signin"?"Admin Sign In":loginView==="forgot-email"?"Forgot Password":"Set New Password"}</h1><p class="muted">${loginView==="signin"?"Manage competitions and publish results.":loginView==="forgot-email"?"Enter your admin email to receive a password reset link.":"Choose a new password for your admin account."}</p>${loginView==="signin"?signin():loginView==="forgot-email"?forgotEmailView():newPassView()}</div>`}
function box(content){return `<div class="card" style="margin-top:25px;text-align:left">${content}</div>`}
function signin(){return box(`<div class="field"><label>Email</label><input id="lemail" class="input" placeholder="admin@example.com"></div><div class="field" style="margin-top:14px"><label>Password</label><input id="lpass" type="password" class="input"></div>${loginError?`<p class="error">${esc(loginError)}</p>`:""}<button class="btn green" style="width:100%;margin-top:14px" onclick="signIn()">Sign In →</button><button class="smallbtn" style="width:100%;margin-top:10px" onclick="loginView='forgot-email';loginError='';render()">Forgot password?</button><p class="muted center" style="font-size:11px;margin-top:12px">Data is stored in Supabase and visible to every visitor in real time.</p>`)}
function forgotEmailView(){return box(`<div class="field"><label>Admin Email</label><input id="femail" class="input" placeholder="admin@example.com"></div>${forgotError?`<p class="error">${esc(forgotError)}</p>`:""}<button class="btn green" style="width:100%;margin-top:14px" onclick="sendReset()">Send Reset Link →</button><button class="smallbtn" style="width:100%;margin-top:10px" onclick="loginView='signin';render()">← Back to Sign In</button>`)}
function newPassView(){return box(`<div class="field"><label>New Password</label><input id="np1" type="password" class="input"></div><div class="field" style="margin-top:14px"><label>Confirm New Password</label><input id="np2" type="password" class="input"></div>${forgotError?`<p class="error">${esc(forgotError)}</p>`:""}<button class="btn green" style="width:100%;margin-top:14px" onclick="saveNewPass()">Save New Password →</button>`)}
async function signIn(){
  const emailInput=document.getElementById("lemail");
  const passwordInput=document.getElementById("lpass");
  const email=emailInput?.value.trim()||"";
  const password=passwordInput?.value||"";

  loginError="";
  if(!email){
    loginError="Please enter your admin email.";
    render();
    return;
  }
  if(!password){
    loginError="Please enter your password.";
    render();
    return;
  }

  const button=document.querySelector('button[onclick="signIn()"]');
  if(button){
    button.disabled=true;
    button.textContent="Signing in…";
  }

  try{
    const {data,error}=await supabase.auth.signInWithPassword({
      email,
      password
    });

    if(error){
      console.error("Supabase sign-in error:",error);
      const msg=String(error.message||"");
      if(/email not confirmed/i.test(msg)){
        loginError="Email is not confirmed in Supabase Authentication.";
      }else if(/invalid login credentials/i.test(msg)){
        loginError="Email or password is incorrect.";
      }else{
        loginError=msg||"Unable to sign in.";
      }
      render();
      return;
    }

    if(!data?.session){
      loginError="Sign-in completed without a session. Check Supabase Authentication settings.";
      render();
      return;
    }

    state.signed=true;
    loginError="";
    await loadAll();
    render();
  }catch(error){
    console.error("Sign-in exception:",error);
    loginError=error?.message||"Unable to connect to Supabase.";
    render();
  }
}
setInterval(()=>{if(state.page==="home")render()},1000);
(async function boot(){
  try{
    await initAuth();
  }catch(error){
    console.error("Auth startup error:",error);
  }

  try{
    await loadAll();
  }catch(error){
    console.error("Data startup error:",error);
    state.loading=false;
    render();
  }

  subscribeRealtime();
})();
