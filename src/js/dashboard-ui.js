// dashboard-ui.js (complete, drop into /src/js/dashboard-ui.js)
// Polished wiring for all sections: Overview, Pomodoro, AI Planner, Projects,
// Leaderboard, Merch, Subscriptions, Analytics, Water, Settings.
// No external dependencies.

const app = document.getElementById('app');
const sidebar = document.getElementById('sidebar');
const openSidebar = document.getElementById('openSidebar');
const closeSidebar = document.getElementById('closeSidebar');
const navBtns = Array.from(document.querySelectorAll('.nav-btn'));

const sections = {
  overview: document.getElementById('sect-overview'),
  pomodoro: document.getElementById('sect-pomodoro'),
  planner: document.getElementById('sect-planner'),
  projects: document.getElementById('sect-projects'),
  leaderboard: document.getElementById('sect-leaderboard'),
  merch: document.getElementById('sect-merch'),
  subscription: document.getElementById('sect-subscription'),
  analytics: document.getElementById('sect-analytics'),
  water: document.getElementById('sect-water'),
  settings: document.getElementById('sect-settings')
};

// Simple local state with persistence
const STORAGE_KEY = 'timora_state_v3';
function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

let state = Object.assign({
  user: { name: 'Guest User', email: 'guest@example.com', coins: 1200, sub:'Free' },
  focusHours: 12,
  streak: 3,
  pending: 5,
  recentSessions: [
    {title:'Focus Session Completed', subtitle:'25 minutes • Math Revision', coins:10},
    {title:'New Achievement Unlocked', subtitle:'Early Bird - Start before 8 AM', coins:0},
    {title:'Task Completed', subtitle:'Integration practice problems', coins:0}
  ],
  projects: [
    {id:'p1', title:'Math Revision', desc:'JEE Advanced', status:'In Progress', tasks:3, progress:66},
    {id:'p2', title:'DSA Practice', desc:'Daily problems', status:'Pending', tasks:5, progress:20}
  ],
  leaderboard: [{name:'Aisha', hours:48},{name:'Ravi', hours:36},{name:'Mira', hours:30}],
  weeklyHours: 12,
  analytics: { weekly: [2,4,6,4,2,3,1] },
  water: { cups:3, goal:'3L' },
}, loadState());

/* ---------- DOM Helpers ---------- */
const $ = s => document.querySelector(s);
const $all = s => Array.from(document.querySelectorAll(s));
function setText(id, v){ const el=document.getElementById(id); if(el) el.textContent = v; }

/* ---------- UI Renderers ---------- */
function updateProfileUI(){
  const name = state.user.name || 'Guest User';
  const email = state.user.email || 'guest@example.com';
  setText('ui-username', name);
  setText('ui-username-mini', name.split(' ')[0] || name);
  setText('ui-email', email);
  setText('ui-name-card', name);
  setText('ui-email-card', email);
  setText('subStatus', state.user.sub || 'Free');
  setText('ui-coins', state.user.coins || 0);
  setText('ui-coins-small', `${state.user.coins || 0} coins`);
}
function updateKpis(){
  setText('ui-focus-hours', `${state.focusHours}h`);
  setText('ui-streak', state.streak);
  setText('ui-pending', state.pending);
  // big hero coin (if exists)
  const heroCoins = document.getElementById('ui-coins-hero');
  if(heroCoins) heroCoins.textContent = state.user.coins || 0;
}
function populateRecentSessions(){
  const ul = document.getElementById('recentSessions');
  if(!ul) return;
  ul.innerHTML = '';
  state.recentSessions.slice(0,6).forEach(it=>{
    const li = document.createElement('li');
    li.className = 'mb-3 rounded-lg p-3';
    li.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div class="font-semibold">${it.title}</div>
          <div class="text-xs text-slate-500 mt-1">${it.subtitle||''}</div>
        </div>
        <div class="text-sm ${it.coins? 'text-green-600':''}">${it.coins? '+'+it.coins+' coins':''}</div>
      </div>`;
    ul.appendChild(li);
  });
}

function populateProjects(){
  const wrap = document.getElementById('projectsList');
  if(!wrap) return;
  wrap.innerHTML = '';
  state.projects.forEach(p=>{
    const c = document.createElement('div');
    c.className = 'glass-card rounded-2xl p-6 hover-lift';
    c.innerHTML = `
      <div class="flex items-start justify-between mb-4">
        <div class="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50">
          <svg class="w-6 h-6 text-[var(--primary)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
        </div>
        <div class="flex gap-1">
          <button class="p-1 editProjBtn" data-id="${p.id}" title="Edit">✎</button>
          <button class="p-1 delProjBtn" data-id="${p.id}" title="Delete">🗑</button>
        </div>
      </div>
      <h3 class="text-xl font-bold text-slate-800 mb-2">${p.title}</h3>
      <p class="text-sm text-slate-500 mb-4">${p.desc}</p>
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm text-slate-600">${p.tasks} tasks</span>
        <span class="text-xs font-semibold ${p.status==='In Progress'? 'text-green-600 bg-green-50':'text-amber-600 bg-amber-50'} px-2 py-1 rounded-full">${p.status}</span>
      </div>
      <div class="mb-4">
        <div class="flex justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span>${p.progress}%</span></div>
        <div class="h-2 bg-slate-100 rounded-full overflow-hidden"><div class="progress-bar" style="width:${p.progress}%"></div></div>
      </div>
      <button class="openProjBtn w-full py-2 rounded-lg border-2 border-slate-200 hover:border-[var(--primary)] font-medium" data-proj="${p.id}">View Tasks</button>
    `;
    wrap.appendChild(c);
  });

  // Add 'create new' card if not present (button is in HTML by default in many versions)
}

function populateLeaderboard(){
  const ol = document.getElementById('leaderboard');
  if(!ol) return;
  ol.innerHTML = '';
  state.leaderboard.forEach((p,i)=>{
    const li = document.createElement('li');
    li.className = 'p-3 rounded-lg bg-white/60 mb-2';
    li.innerHTML = `<div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center font-semibold">${i+1}</div><div><div class="font-semibold">${p.name} — ${p.hours}h</div><div class="text-xs text-slate-500">${i===0?'Top performer':''}</div></div></div>`;
    ol.appendChild(li);
  });
}

function populateMerch(){
  // Keep demo merch values in DOM (we show a diary item already). If needed, update price/availability from state.
  const buyBtn = document.getElementById('buyDiaryBtn');
  if(buyBtn) buyBtn.addEventListener('click', ()=> {
    const modal = document.getElementById('orderModal');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
  });
}
function populateSubscriptions(){
  // nothing heavy: subscription cards are present in HTML. We can highlight current plan:
  const subs = { free:'Free', standard:'Standard', premium:'Premium' };
  // If state.user.sub is set, visually highlight it:
  const cur = state.user.sub || 'Free';
  // Simple: set text in card (id 'subStatus' exists)
  setText('subStatus', cur);
}

function populateAnalytics(){
  setText('weeklyHours', state.weeklyHours + 'h');
  // Basic bars are in HTML; leave finer chart for Chart.js option later.
}

/* ---------- Navigation ---------- */
function showSection(name){
  Object.keys(sections).forEach(k=>{
    const el = sections[k];
    if(!el) return;
    if(k === name) el.classList.remove('hidden'); else el.classList.add('hidden');
  });
  navBtns.forEach(b => b.classList.toggle('active-nav', b.dataset.section === name));
  // small UI behavior: close sidebar on mobile
  if(window.innerWidth < 1024) app.classList.add('sidebar-hidden');
}

openSidebar && openSidebar.addEventListener('click', ()=> app.classList.remove('sidebar-hidden'));
closeSidebar && closeSidebar.addEventListener('click', ()=> app.classList.add('sidebar-hidden'));
navBtns.forEach(b => b.addEventListener('click', ()=> { showSection(b.dataset.section); }));

/* ---------- Auth / Profile ---------- */
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn && logoutBtn.addEventListener('click', ()=> {
  // demo sign-out: reset user demo values
  state.user = { name:'Guest User', email:'guest@example.com', coins: 0, sub:'Free' };
  saveState();
  updateAll();
  toast('Signed out (demo)');
});

const openProfileBtn = document.getElementById('openProfileBtn');
openProfileBtn && openProfileBtn.addEventListener('click', ()=> showSection('settings'));

const saveProfileBtn = document.getElementById('saveProfileBtn');
saveProfileBtn && saveProfileBtn.addEventListener('click', ()=>{
  const name = (document.getElementById('editName')||{}).value || '';
  const email = (document.getElementById('editEmail')||{}).value || '';
  if(name) state.user.name = name;
  if(email) state.user.email = email;
  saveState();
  updateAll();
  saveProfileBtn.textContent = 'Saved ✓';
  setTimeout(()=> saveProfileBtn.textContent = 'Save (local)', 1200);
});

/* ---------- Planner ---------- */
const plannerForm = document.getElementById('plannerForm');
plannerForm && plannerForm.addEventListener('submit', e=>{
  e.preventDefault();
  const subjects = (document.getElementById('plannerSubjects').value || '').split(',').map(s=>s.trim()).filter(Boolean);
  const hours = Number(document.getElementById('plannerHours').value) || 3;
  const days = Number(document.getElementById('plannerDays').value) || 7;
  document.getElementById('plannerResult').textContent = `Generated ${days}-day plan — ${hours} hours/day (demo)`;
  renderTimetablePreview(1, hours, subjects);
  state.weeklyHours = Math.min(40, Math.round(hours * Math.min(days,7) / 7));
  saveState();
  populateAnalytics();
});

/* --- Timetable preview helper --- */
function renderTimetablePreview(day=1, hours=3, subjects=[]){
  const container = document.getElementById('timetable');
  if(!container) return;
  container.innerHTML = '';
  if(subjects.length === 0) subjects = ['Maths','Physics','Coding'];
  for(let i=0;i<Math.min(subjects.length,4); i++){
    const h = Math.max(1, Math.round(hours / Math.min(subjects.length,3)));
    const block = document.createElement('div');
    block.className = 'p-6 rounded-2xl hover-lift shadow-lg';
    block.style.background = i%2 ? 'linear-gradient(135deg,#06b6d4,#3b82f6)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)';
    block.style.color = 'white';
    block.innerHTML = `<div class="flex items-center justify-between mb-3"><span class="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">${9+i}:00 - ${10+i}:00</span></div>
      <h4 class="text-xl font-bold mb-2">${subjects[i]}</h4>
      <p class="text-sm opacity-90 mb-4">${h} hour(s) — Day ${day}</p>
      <button class="importTaskBtn w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 font-medium">Add to Projects →</button>`;
    container.appendChild(block);
  }
}

/* ---------- Pomodoro ---------- */
let pom = { mode:'focus', remaining: 25*60, timer:null, running:false, sessions:0 };
const pomTimerEl = document.getElementById('pom-timer');
const pomSessionCount = document.getElementById('pomSessionsToday');
const pomTotalFocus = document.getElementById('pomTotalFocus');
function formatTime(s){ const m=Math.floor(s/60); const sec=s%60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
function setPomMode(mode){ pom.mode = mode; pom.remaining = mode==='focus'?25*60:(mode==='short'?5*60:15*60); if(pomTimerEl) pomTimerEl.textContent = formatTime(pom.remaining); }
setPomMode('focus');

const pomStart = document.getElementById('pomStart');
const pomPause = document.getElementById('pomPause');
const pomReset = document.getElementById('pomReset');
const pomModes = Array.from(document.querySelectorAll('.pom-mode'));

pomStart && pomStart.addEventListener('click', ()=>{
  if(pom.running) return;
  pom.running = true;
  pom.timer = setInterval(()=>{
    pom.remaining -= 1;
    if(pomTimerEl) pomTimerEl.textContent = formatTime(pom.remaining);
    if(pom.remaining <= 0){
      clearInterval(pom.timer);
      pom.running = false;
      // session complete actions
      if(pom.mode === 'focus'){
        state.user.coins = (state.user.coins||0) + 10;
        state.recentSessions.unshift({title:'Focus Session Completed', subtitle:`${pom.mode==='focus'?25:0} minutes • Auto`, coins:10});
        state.focusHours = Math.round((state.focusHours||0) + (25/60));
        pom.sessions += 1;
        setText('pomSessionsToday', pom.sessions);
        saveState();
        updateAll();
        toast('+10 coins — good job!');
      }
      setPomMode('focus'); // reset to default
    }
  }, 1000);
});

pomPause && pomPause.addEventListener('click', ()=> { if(pom.timer) clearInterval(pom.timer); pom.running=false; });
pomReset && pomReset.addEventListener('click', ()=> { if(pom.timer) clearInterval(pom.timer); pom.running=false; setPomMode(pom.mode); });

pomModes.forEach(b => b.addEventListener('click', ()=> {
  setPomMode(b.dataset.mode);
  // highlight selected
  pomModes.forEach(x => x.classList.remove('selected'));
  b.classList.add('selected');
}));

/* ---------- Order modal (Merch) ---------- */
const orderModal = document.getElementById('orderModal');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');
const cancelOrderBtn = document.getElementById('cancelOrderBtn');
if(cancelOrderBtn) cancelOrderBtn.addEventListener('click', ()=> orderModal.classList.add('hidden'));
if(confirmOrderBtn) confirmOrderBtn.addEventListener('click', ()=>{
  const name = (document.getElementById('orderName')||{}).value || '';
  const addr = (document.getElementById('orderAddress')||{}).value || '';
  if(!name || !addr){ alert('Please fill name & address (demo)'); return; }
  if((state.user.coins||0) < 8000){ alert('Not enough coins (demo)'); }
  else { state.user.coins -= 8000; toast('Order placed (demo)'); saveState(); updateProfileUI(); }
  orderModal.classList.add('hidden');
});

/* ---------- Water tracker ---------- */
const cups = $all('.cup');
cups.forEach(c => c.addEventListener('click', ()=>{
  const idx = Number(c.dataset.index);
  state.water.cups = idx+1;
  cups.forEach((cup,i)=> { cup.style.background = i <= idx ? 'linear-gradient(180deg, rgba(114,89,236,0.12), rgba(198,102,247,0.06))' : ''; });
  saveState();
}));

function refreshWaterUI(){ cups.forEach((cup,i)=> cup.style.background = i < (state.water.cups||0) ? 'linear-gradient(180deg, rgba(114,89,236,0.12), rgba(198,102,247,0.06))' : ''); setText('waterGoal', state.water.goal||'3L'); }

/* ---------- Helper: Toast ---------- */
function toast(msg, ttl=1500){
  const t = document.createElement('div');
  t.className = 'fixed right-6 top-6 bg-white/95 px-4 py-2 rounded shadow-lg';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.classList.add('fade'), 20);
  setTimeout(()=> t.remove(), ttl);
}

/* ---------- Small UI actions ---------- */
const newProjectBtn = document.getElementById('newProjectBtn');
newProjectBtn && newProjectBtn.addEventListener('click', ()=>{
  const title = prompt('Project title (demo)') || 'Untitled Project';
  state.projects.unshift({id:Date.now().toString(), title, desc:'User created', status:'Backlog', tasks:0, progress:0});
  saveState();
  populateProjects();
  toast('Project created (demo)');
});

$all(document).forEach(()=>{}); // noop to avoid linter complaints

/* ---------- Reset demo ---------- */
const resetBtn = document.getElementById('resetStateBtn');
resetBtn && resetBtn.addEventListener('click', ()=>{
  if(!confirm('Reset demo state?')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

/* ---------- Update All ---------- */
function updateAll(){
  updateProfileUI();
  updateKpis();
  populateRecentSessions();
  populateProjects();
  populateLeaderboard();
  populateMerch();
  populateSubscriptions();
  populateAnalytics();
  refreshWaterUI();
  // ensure Overview visible if nothing selected
  if(!Array.from(navBtns).some(b=> b.classList.contains('active-nav'))) showSection('overview');
}
updateAll();

// default: show overview on load
document.addEventListener('DOMContentLoaded', ()=> showSection('overview'));

// expose small debug helpers
window.Timora = { state, saveState, updateAll, showSection };
