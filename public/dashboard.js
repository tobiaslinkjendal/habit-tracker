// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let hour=new Date().getHours(),workOpen=false,workoutOpen=false;
let morningOpen=false,morningLogged=false,sleepLogged=false,sleepTime=null;
let wcVisible=false,detailRange=90,weightKg=85.3,baseWeight=85.3;
const goalWeight=79.9;
let noteOpen=false,pressTimer=null,ctxTodo=null;
var hmSelIcon='ph-heart',hmSelColor='#4ade80',hmSelType='toggle';
var hmPrevCount=0,hmPrevActive=false,hmTrackTarget=4,hmEditId=null;
var ctxMode='todo',ctxHabitKey=null,ctxHabitBuiltin=false;
var hiddenBuiltins=[],tsStart=7,tsEnd=22;
var builtinCat={'ico-bread':'morning','ico-pill':'morning','ico-ff':'morning','ico-teeth-am':'morning','ico-barbell':'positive','ico-run':'positive','ico-yoga':'positive','ico-book':'positive','ico-cross':'positive','ico-avo':'positive','ico-cookie':'bad','ico-pizza':'bad','ico-yt':'bad','ico-tv':'bad','ico-soda':'bad','ico-alc':'bad','ico-inspire':'positive'};

// Load from server-rendered globals
var _sh=window.__customHabits||[],_st=window.__todos||[],_sl=window.__todayLogs||[];

var customHabits=_sh.map(function(h){return{id:h.id,name:h.name,icon:h.icon,color:h.color,type:h.type,category:h.category||'own-row',target:h.target||4,time:h.time_pref||'all',desc:h.description||''};});
var customParents=customHabits.filter(function(h){return h.type==='parent';});

var todos=_st.map(function(t){return{id:t.id,text:t.text,created:new Date(t.created_at).getTime(),completedAt:t.completed_at?new Date(t.completed_at).getTime():null};});

var initialHabitValues={};
_sl.forEach(function(log){if(log.value>0)initialHabitValues[log.habit_id]=log.value;});

var chatHistory=[],customHabitCache={};
var workCtrState={mail:{n:initialHabitValues['mail']||0,t:null},chat:{n:initialHabitValues['chat']||0,t:null},meet:{n:initialHabitValues['meet']||0,t:null}};

// ══════════════════════════════════════════════
// FAKE HISTORICAL DATA (insight visualizations only)
// ══════════════════════════════════════════════
const weightData=(function(){var d=[],w=89.4;for(var i=365;i>=0;i--){w+=((Math.random()-.52)*.22);w=Math.round(w*10)/10;d.push(w);}d[d.length-1]=weightKg;return d;})();
const workoutLogs=(function(){var l=[];for(var i=179;i>=0;i--){var t=[];if(Math.random()>.62)t.push('barbell');if(Math.random()>.75)t.push('run');if(Math.random()>.82)t.push('yoga');if(t.length)l.push({daysAgo:i,types:t});}return l;})();
const workDayLogs=(function(){var l=[];for(var i=179;i>=0;i--){if(Math.random()>.25)l.push({daysAgo:i,mail:Math.random()>.3,chat:Math.random()>.4,meet:Math.random()>.5,inspire:Math.random()>.7});}return l;})();
const sleepLogs=(function(){var l=[];for(var i=90;i>=0;i--){if(Math.random()>.15){var h=22+Math.floor(Math.random()*3)+(Math.random()>.5?0:-.5);l.push({daysAgo:i,hour:Math.max(21,Math.min(25,h))});}}return l;})();

const trackers={
  water:{total:8,checked:initialHabitValues['water']||0,icon:'ph-drop-simple',color:'var(--water)'},
  mail: {total:6,checked:0,icon:'ph-envelope-simple',color:'var(--work-mail)'},
  chat: {total:4,checked:0,icon:'ph-chat-text',color:'var(--work-chat)'},
  meet: {total:4,checked:0,icon:'ph-user-circle',color:'var(--work-meet)'},
};

const HABITS={
  'ico-bread':  {ph:'ph-bread',       color:'var(--bread)',   prob:.65,avgH:7.8,stdH:.8,  label:'Breakfast',   txt:'Breakfast keeps you from mid-morning snacking. You skip it ~35% of days — mostly on rushed mornings.'},
  'ico-pill':   {ph:'ph-pill',        color:'var(--vitamin)', prob:.78,avgH:7.5,stdH:.5,  label:'Vitamins',    txt:'B12 and omegas — most consistent morning habit. Best kept as a pair with breakfast.'},
  'ico-ff':     {ph:'ph-fast-forward',color:'var(--sprint)',  prob:.55,avgH:7.2,stdH:.7,  label:'Quick move',  txt:'Quick movement extends your morning focus window. Worth every 2 minutes.'},
  'ico-teeth-am':{ph:'ph-tooth',      color:'var(--teeth)',   prob:.90,avgH:7.6,stdH:.5,  label:'Teeth AM',    txt:'Near-perfect morning teeth habit. Evening is where streaks break.'},
  'ico-barbell':{ph:'ph-barbell',     color:'var(--workout)', prob:.38,avgH:17, stdH:2,   label:'Strength',    txt:'Strength sessions are your longest but least frequent. Saturdays are your best sessions.'},
  'ico-run':    {ph:'ph-sneaker-move',color:'var(--workout)', prob:.25,avgH:18, stdH:1.5, label:'Run',         txt:'Runs cluster on dry days — weather plays a big role.'},
  'ico-yoga':   {ph:'ph-scales',      color:'var(--workout)', prob:.18,avgH:7.5,stdH:1,   label:'Yoga',        txt:'Rare but high-quality days. You consistently rate yoga days as your best.'},
  'ico-book':   {ph:'ph-book-open',   color:'var(--read)',    prob:.88,avgH:21.5,stdH:.8, label:'Reading',     txt:'7-day streak. Almost always after 21:00 — deeply embedded evening habit.'},
  'ico-cross':  {ph:'ph-cross',       color:'var(--read)',    prob:.55,avgH:21, stdH:1,   label:'Bible',       txt:'Bible reading gaps on busy days. Even 5 minutes keeps the streak alive.'},
  'ico-avo':    {ph:'ph-avocado',     color:'#6ab04c',        prob:.35,avgH:12, stdH:3,   label:'Clean eating',txt:'Only 2 clean eating days this week — trending up month-on-month.'},
  'ico-cookie': {ph:'ph-cookie',      color:'var(--bad)',     prob:.45,avgH:15, stdH:3,   label:'Snack',       txt:'Snacking peaks at 15:00 — classic energy dip. A walk often resolves it.'},
  'ico-pizza':  {ph:'ph-pizza',       color:'var(--bad)',     prob:.30,avgH:19, stdH:2,   label:'Junk food',   txt:'Junk food happens on tired evenings. Often correlates with no workout that day.'},
  'ico-yt':     {ph:'ph-youtube-logo',color:'var(--bad)',     prob:.55,avgH:20.5,stdH:2,  label:'YouTube',     txt:'YouTube clusters 20–23h, directly competing with reading time.'},
  'ico-tv':     {ph:'ph-screencast',  color:'var(--bad)',     prob:.38,avgH:21, stdH:1.5, label:'Series',      txt:'Series watching tends to happen on low-energy days when workout was also skipped.'},
  'ico-soda':   {ph:'ph-pint-glass',  color:'var(--bad)',     prob:.40,avgH:14, stdH:4,   label:'Soda',        txt:'Soda intake spikes on workdays, mostly lunch. Worth replacing with sparkling water.'},
  'ico-alc':    {ph:'ph-beer-stein',  color:'var(--bad)',     prob:.22,avgH:20, stdH:2,   label:'Alcohol',     txt:'Social drinking, mostly Fri/Sat. Correlates with worse sleep quality that night.'},
  'ico-inspire':{ph:'ph-lightbulb-filament',color:'var(--inspire)',prob:.3,avgH:14,stdH:3,label:'Inspired',   txt:'Inspiring days cluster around startup events and good sleep nights.'},
  'water':      {ph:'ph-drop-simple', color:'var(--water)',   prob:.85,avgH:11, stdH:4,   label:'Water',       txt:'You drink most in the morning and again at 15:00. Evenings are where you fall short.'},
  'work':       {ph:'ph-briefcase',   color:'var(--work)',    label:'Work',    txt:''},
  'sleep':      {ph:'ph-moon',        color:'var(--sleep)',   label:'Sleep',   txt:''},
  'workout':    {ph:'ph-lightning',   color:'var(--workout)', label:'Workout', txt:''},
  'mail':       {ph:'ph-envelope-simple',color:'var(--work-mail)',prob:.72,avgH:10,stdH:2,label:'Emails',   txt:'Emails peak mid-morning. Fewer on Fridays.'},
  'chat':       {ph:'ph-chat-text',   color:'var(--work-chat)',prob:.65,avgH:11,stdH:2,   label:'Chats',    txt:'Chat volume drops sharply after 15:00.'},
  'meet':       {ph:'ph-user-circle', color:'var(--work-meet)',prob:.5, avgH:13,stdH:2,   label:'Meetings', txt:'Meetings cluster Tuesday–Thursday.'},
};

const colorMap={'var(--water)':'#4fc3f7','var(--workout)':'#d97706','var(--read)':'#4ade80','var(--bad)':'#ef4444','var(--sleep)':'#a78bfa','var(--vitamin)':'#b57bee','var(--sprint)':'#16c784','var(--bread)':'#c8925a','var(--inspire)':'#fde68a','var(--teeth)':'#fffff0','var(--work)':'#60a5fa','var(--work-mail)':'#60a5fa','var(--work-chat)':'#818cf8','var(--work-meet)':'#a78bfa','var(--work-ins)':'#fde68a'};
function resolveColor(c){return colorMap[c]||c;}

// ══════════════════════════════════════════════
// PERSISTENCE
// ══════════════════════════════════════════════
async function persistHabitLog(habitId,value){
  var sb=window.__sb,uid=window.__userId;if(!sb||!uid)return;
  var date=new Date().toISOString().slice(0,10);
  await sb.from('habit_logs').upsert({user_id:uid,habit_id:habitId,value:value,date:date},{onConflict:'user_id,habit_id,date'});
}
async function persistSaveHabit(habit){
  var sb=window.__sb,uid=window.__userId;if(!sb||!uid)return;
  await sb.from('habits').upsert({id:habit.id,user_id:uid,name:habit.name,icon:habit.icon,color:habit.color,type:habit.type,category:habit.category,target:habit.target,time_pref:habit.time,description:habit.desc});
}
async function persistDeleteHabit(id){
  var sb=window.__sb,uid=window.__userId;if(!sb||!uid)return;
  await sb.from('habits').delete().eq('id',id).eq('user_id',uid);
}

// ══════════════════════════════════════════════
// CLOCK
// ══════════════════════════════════════════════
function updateClock(){
  var now=new Date();hour=now.getHours();
  var t=String(hour).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  var cl=document.getElementById('clock');if(cl)cl.textContent=t;
  var nt=document.getElementById('note-time');if(nt)nt.textContent=t;
}
setInterval(updateClock,10000);
updateClock();

// ══════════════════════════════════════════════
// GENERATE FAKE LOGS
// ══════════════════════════════════════════════
function genLogs(key){
  var h=HABITS[key]||customHabitCache[key];if(!h||!h.prob)return[];
  var logs=[];
  for(var i=179;i>=0;i--){
    if(Math.random()<h.prob){
      var cnt=(key==='water')?Math.floor(Math.random()*5)+3:1;
      for(var j=0;j<cnt;j++){
        var hr=Math.max(0,Math.min(23,h.avgH+(Math.random()-.5)*h.stdH*3));
        logs.push({daysAgo:i,hour:hr,minute:Math.floor(Math.random()*60)});
      }
    }
  }
  return logs;
}

// ══════════════════════════════════════════════
// INSIGHT
// ══════════════════════════════════════════════
function openInsight(key){
  var h=HABITS[key]||customHabitCache[key];if(!h)return;
  var rc=resolveColor(h.color);
  var ico=document.getElementById('io-icon');
  ico.className='io-big-icon ph-duotone '+h.ph;ico.style.color=rc;
  var streak=Math.floor(Math.random()*14)+1,weekPct=Math.floor(Math.random()*45)+50;
  var todayV=key==='water'?trackers.water.checked:key==='work'?workCtrState.mail.n:initialHabitValues[key]||0;
  document.getElementById('io-stats').innerHTML='<div class="io-stat"><div class="io-stat-v" style="color:'+rc+'">'+todayV+'</div><div class="io-stat-l">today</div></div><div class="io-stat"><div class="io-stat-v" style="color:#a78bfa">'+streak+'</div><div class="io-stat-l">streak</div></div><div class="io-stat"><div class="io-stat-v" style="color:#4ade80">'+weekPct+'%</div><div class="io-stat-l">week</div></div>';
  document.getElementById('io-txt').textContent=h.txt;
  document.getElementById('io-dist').style.display='none';
  if(key==='work'){buildWorkHeatmap(rc);buildWorkCalendar();}
  else if(key==='sleep'){buildSleepChart();buildRegularCalendar(key,h,sleepLogs,rc,false);}
  else if(key==='workout'){buildWorkoutInsight(rc);}
  else{var logs=genLogs(key);buildHeatmap(logs,rc);buildRegularCalendar(key,h,logs,rc,key==='water');}
  document.getElementById('io').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeInsight(){document.getElementById('io').classList.remove('open');document.body.style.overflow='';}

// ══════════════════════════════════════════════
// TIME HEATMAP
// ══════════════════════════════════════════════
function buildHeatmap(logs,color){
  var svg=document.getElementById('time-svg');svg.innerHTML='';
  var lbls=document.getElementById('time-labels');lbls.innerHTML='';
  if(!logs.length)return;
  var W=Math.min(400,window.innerWidth)-44,H=68,padV=6;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  var bins=new Array(48).fill(0);
  logs.forEach(function(l){bins[Math.min(47,Math.floor(l.hour)*2+(l.minute>=30?1:0))]++;});
  var active=bins.map(function(v,i){return v>0?i:-1;}).filter(function(i){return i>=0;});
  if(!active.length)return;
  var minS=Math.max(0,Math.min.apply(null,active)-2),maxS=Math.min(47,Math.max.apply(null,active)+2);
  var slice=bins.slice(minS,maxS+1),maxV=Math.max.apply(null,slice.concat([1])),n=slice.length;
  var sx=function(i){return(i/(n-1||1))*W;},sy=function(v){return padV+(1-(v/maxV))*(H-padV*2);};
  var dF='M 0 '+H;
  for(var i=0;i<n;i++){if(i===0)dF+=' L '+sx(0)+' '+sy(slice[0]);else{var x0=sx(i-1),y0=sy(slice[i-1]),x1=sx(i),y1=sy(slice[i]),cx=(x0+x1)/2;dF+=' C '+cx+' '+y0+' '+cx+' '+y1+' '+x1+' '+y1;}}
  dF+=' L '+W+' '+H+' Z';
  var fill=document.createElementNS('http://www.w3.org/2000/svg','path');fill.setAttribute('d',dF);fill.setAttribute('fill',color);fill.setAttribute('fill-opacity','.07');svg.appendChild(fill);
  var dL='M '+sx(0)+' '+sy(slice[0]);
  for(var i=1;i<n;i++){var x0=sx(i-1),y0=sy(slice[i-1]),x1=sx(i),y1=sy(slice[i]),cx=(x0+x1)/2;dL+=' C '+cx+' '+y0+' '+cx+' '+y1+' '+x1+' '+y1;}
  var path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',dL);path.setAttribute('fill','none');path.setAttribute('stroke',color);path.setAttribute('stroke-width','1.5');path.setAttribute('stroke-linecap','round');svg.appendChild(path);
  var pts=[minS,Math.round((minS+maxS)/2),maxS];
  pts.forEach(function(slot){var hh=Math.floor(slot/2),mm=slot%2===0?'00':'30';lbls.innerHTML+='<span class="io-ht">'+String(hh).padStart(2,'0')+':'+mm+'</span>';});
}

function buildWorkHeatmap(color){
  var fakeLogs=[];
  for(var i=0;i<90;i++){if(Math.random()>.3){var h=8+Math.random()*9;fakeLogs.push({hour:h,minute:Math.floor(Math.random()*60),daysAgo:i});}}
  buildHeatmap(fakeLogs,color);
  document.getElementById('io-txt').textContent='Your most productive hours are 09–11. Activity drops after 15:00 on most days.';
}

function buildSleepChart(){
  var svg=document.getElementById('time-svg');svg.innerHTML='';
  var lbls=document.getElementById('time-labels');lbls.innerHTML='';
  if(!sleepLogs.length)return;
  var W=Math.min(400,window.innerWidth)-44,H=68,ns='http://www.w3.org/2000/svg';
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  var recent=sleepLogs.slice(-30),minH=21,maxH=26;
  var sx=function(i){return(i/(recent.length-1||1))*W;},sy=function(h){return 6+(h-minH)/(maxH-minH)*(H-12);};
  recent.forEach(function(l,i){var c=document.createElementNS(ns,'circle');c.setAttribute('cx',sx(i));c.setAttribute('cy',sy(l.hour));c.setAttribute('r','2.5');c.setAttribute('fill','#a78bfa');c.setAttribute('opacity','.7');svg.appendChild(c);});
  var avg=recent.reduce(function(s,l){return s+l.hour;},0)/recent.length;
  var al=document.createElementNS(ns,'line');al.setAttribute('x1','0');al.setAttribute('x2',String(W));al.setAttribute('y1',String(sy(avg)));al.setAttribute('y2',String(sy(avg)));al.setAttribute('stroke','#a78bfa');al.setAttribute('stroke-width','.5');al.setAttribute('opacity','.3');al.setAttribute('stroke-dasharray','3 3');svg.appendChild(al);
  lbls.innerHTML='<span class="io-ht">21:00</span><span class="io-ht">'+String(Math.floor(avg)).padStart(2,'0')+':'+(avg%1>=.5?'30':'00')+' avg</span><span class="io-ht">02:00</span>';
  document.getElementById('io-txt').textContent='Average bedtime '+String(Math.floor(avg)).padStart(2,'0')+':'+(avg%1>=.5?'30':'00')+'. You sleep earlier on workout days.';
}

function buildRegularCalendar(key,h,logs,color,useIntensity){
  var grid=document.getElementById('cal-grid');grid.innerHTML='';
  var rc=resolveColor(color),dayMap={};
  if(useIntensity){var tpd={};logs.forEach(function(l){if(!tpd[l.daysAgo])tpd[l.daysAgo]=0;tpd[l.daysAgo]++;});var target=trackers[key]?trackers[key].total:1;Object.keys(tpd).forEach(function(da){dayMap[da]=Math.min(1,tpd[da]/target);});}
  else{logs.forEach(function(l){dayMap[l.daysAgo]=1;});}
  var rows=Math.ceil(180/14);
  for(var r=0;r<rows;r++){for(var c=13;c>=0;c--){var da=r*14+(13-c);var cell=document.createElement('div');cell.className='cal-cell';var dot=document.createElement('div');dot.className='dot';if(da===0)dot.classList.add('today');if(da<0)dot.classList.add('future');else if(dayMap[da]!==undefined){var ratio=dayMap[da];if(ratio>=0.95){dot.classList.add('active');dot.style.background=rc;}else{dot.style.background=rc;dot.style.opacity=String(0.15+ratio*0.75);dot.style.border='none';}}cell.appendChild(dot);grid.appendChild(cell);}}
}

function buildWorkoutInsight(rc){
  var allLogs=[];
  workoutLogs.forEach(function(l){l.types.forEach(function(t){var avgH=t==='barbell'?17:t==='run'?18:7.5;allLogs.push({hour:avgH+(Math.random()-.5)*2,minute:Math.floor(Math.random()*60),daysAgo:l.daysAgo});});});
  buildHeatmap(allLogs,rc);
  var bT=0,rT=0,yT=0;
  workoutLogs.forEach(function(l){if(l.types.indexOf('barbell')>=0)bT++;if(l.types.indexOf('run')>=0)rT++;if(l.types.indexOf('yoga')>=0)yT++;});
  var tot=bT+rT+yT||1,bP=Math.round(bT/tot*100),rP=Math.round(rT/tot*100),yP=100-bP-rP;
  var d=document.getElementById('io-dist');d.style.display='block';
  d.innerHTML='<div class="io-dist-bar"><div class="io-dist-seg" style="width:'+bP+'%;background:#d97706;opacity:.7"></div><div class="io-dist-seg" style="width:'+rP+'%;background:#16c784;opacity:.7"></div><div class="io-dist-seg" style="width:'+yP+'%;background:#a78bfa;opacity:.7"></div></div><div class="io-dist-labels"><span class="io-dist-lbl"><span class="io-dist-dot" style="background:#d97706"></span>'+bP+'% strength</span><span class="io-dist-lbl"><span class="io-dist-dot" style="background:#16c784"></span>'+rP+'% run</span><span class="io-dist-lbl"><span class="io-dist-dot" style="background:#a78bfa"></span>'+yP+'% yoga</span></div>';
  document.getElementById('io-txt').textContent=workoutLogs.length+' workout days. Strength is your default — runs depend on weather, yoga on rest days.';
  var binaryLogs=workoutLogs.map(function(l){return{daysAgo:l.daysAgo};});
  buildRegularCalendar('workout',HABITS['workout'],binaryLogs,rc,false);
}

function buildWorkCalendar(){
  var grid=document.getElementById('cal-grid');grid.innerHTML='';
  var dayMap={};workDayLogs.forEach(function(l){dayMap[l.daysAgo]=l;});
  var rows=Math.ceil(180/14),ns='http://www.w3.org/2000/svg';
  for(var r=0;r<rows;r++){for(var c=13;c>=0;c--){var da=r*14+(13-c);var cell=document.createElement('div');cell.className='cal-cell';
    if(da>180){var e=document.createElement('div');e.className='dot future';cell.appendChild(e);}
    else{var d=dayMap[da];var svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 16 16');svg.style.width='12px';svg.style.height='12px';svg.style.display='block';
      var quads=[{d:'M 8,8 L 8,2 A 6,6 0 0 1 14,8 Z',color:'#60a5fa',done:d&&d.mail},{d:'M 8,8 L 14,8 A 6,6 0 0 1 8,14 Z',color:'#818cf8',done:d&&d.chat},{d:'M 8,8 L 8,14 A 6,6 0 0 1 2,8 Z',color:'#a78bfa',done:d&&d.meet},{d:'M 8,8 L 2,8 A 6,6 0 0 1 8,2 Z',color:'#fde68a',done:d&&d.inspire}];
      quads.forEach(function(q){var p=document.createElementNS(ns,'path');p.setAttribute('d',q.d);p.setAttribute('fill',d&&q.done?q.color:'#1e1e1e');svg.appendChild(p);});
      var ring=document.createElementNS(ns,'circle');ring.setAttribute('cx','8');ring.setAttribute('cy','8');ring.setAttribute('r','6');ring.setAttribute('fill','none');ring.setAttribute('stroke',d?'#333':'#1a1a1a');ring.setAttribute('stroke-width','.5');svg.appendChild(ring);
      cell.appendChild(svg);}
    grid.appendChild(cell);}}
}

// ══════════════════════════════════════════════
// LONG PRESS
// ══════════════════════════════════════════════
function attachPress(el,tapFn,holdFn){
  if(!el)return;
  var moved=false;
  el.addEventListener('pointerdown',function(){moved=false;pressTimer=setTimeout(function(){pressTimer=null;holdFn();},450);});
  el.addEventListener('pointermove',function(){if(pressTimer)moved=true;});
  el.addEventListener('pointerup',function(){if(pressTimer&&!moved){clearTimeout(pressTimer);pressTimer=null;tapFn();}else if(pressTimer){clearTimeout(pressTimer);pressTimer=null;}});
  el.addEventListener('pointercancel',function(){clearTimeout(pressTimer);pressTimer=null;});
}

function toggleIco(id,color){
  var el=document.getElementById(id);if(!el)return;
  if(el.classList.contains('active')){el.classList.remove('active');el.classList.add('ghost');el.style.color='';persistHabitLog(id,0);}
  else{el.classList.remove('ghost');el.classList.add('active');el.style.color=color;persistHabitLog(id,1);}
}

// ══════════════════════════════════════════════
// MODES
// ══════════════════════════════════════════════
function triggerMorning(){
  morningOpen=!morningOpen;
  if(!morningLogged&&morningOpen){morningLogged=true;activate('sun-ico','#d97706');}
  document.getElementById('morning-spawn').classList.toggle('open',morningOpen);
  if(morningOpen)initWeightDrag();
}
function triggerWork(){
  if(workOpen)return;workOpen=true;activate('ico-work','var(--work)');
  document.getElementById('work-spawn').classList.add('open');
  ['sec-morning','sec-workout','sec-positive','div-pos','sec-bad','div-bad'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display='none';});
  initWorkCounters();
}
function endWork(){
  workOpen=false;deactivate('ico-work');
  document.getElementById('work-spawn').classList.remove('open');
  ['sec-morning','sec-workout','sec-positive','div-pos','sec-bad','div-bad'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display='';});
  updateVisibility();
}
function toggleWorkout(){
  workoutOpen=!workoutOpen;
  var ico=document.getElementById('ico-workout');
  if(workoutOpen){ico.classList.remove('ghost');ico.style.color='var(--workout)';}
  else{ico.classList.add('ghost');ico.style.color='';}
  document.getElementById('workout-spawn').classList.toggle('open',workoutOpen);
}
function activate(id,c){var e=document.getElementById(id);if(!e)return;e.classList.remove('ghost');e.style.color=c;}
function deactivate(id){var e=document.getElementById(id);if(!e)return;e.classList.add('ghost');e.style.color='';}
function updateVisibility(){
  var ms=document.getElementById('sec-morning'),ss=document.getElementById('sec-sleep');
  if(ms)ms.style.display=(hour>=5&&hour<12)?'':'none';
  if(ss)ss.style.display=(hour>=20||hour<4)?'':'none';
  Object.keys(HABITS).filter(function(k){return['water','work','sleep','workout'].indexOf(k)<0;}).forEach(function(k){
    var el=document.getElementById(k.replace('ico-','sh-'));
    if(el)el.style.display=hiddenBuiltins.indexOf(k)>=0?'none':'';
  });
}

// ══════════════════════════════════════════════
// TRACKERS
// ══════════════════════════════════════════════
function renderTracker(id){
  var t=trackers[id],el=document.getElementById('drops-'+id);if(!el)return;
  el.innerHTML='';
  for(var i=0;i<t.total;i++){
    var d=document.createElement('i'),filled=i<t.checked;
    d.className=filled?('ph-duotone '+t.icon+' t-unit'):('ph '+t.icon+' t-unit ghost');
    if(filled){d.style.color=t.color;d.style.setProperty('--ph-duotone-opacity','0.18');}
    (function(idx){d.onclick=function(e){e.stopPropagation();t.checked=idx<t.checked?idx:idx+1;renderTracker(id);persistHabitLog(id,t.checked);};})(i);
    el.appendChild(d);
  }
}
function tapTracker(e,id){if(e.target.closest('.t-unit'))return;var t=trackers[id];if(t.checked<t.total){t.checked++;renderTracker(id);persistHabitLog(id,t.checked);}}

// ══════════════════════════════════════════════
// WEIGHT
// ══════════════════════════════════════════════
function updateWeightColor(){
  var el=document.getElementById('ww-num');if(!el)return;el.textContent=weightKg.toFixed(1);
  var d=weightKg-baseWeight;el.style.color=d>=0.4?'#f87171':d<=-0.4?'#6ee7b7':'#d0d0d0';
}
function initWeightDrag(){
  var el=document.getElementById('ww-num');if(!el||el.dataset.init)return;el.dataset.init='1';
  var sx=0,sw=0,moved=false;
  el.addEventListener('pointerdown',function(e){sx=e.clientX;sw=weightKg;moved=false;el.setPointerCapture(e.pointerId);});
  el.addEventListener('pointermove',function(e){if(!(e.buttons&1))return;var dx=e.clientX-sx;if(Math.abs(dx)>4)moved=true;weightKg=Math.round((sw+dx*.05)*10)/10;updateWeightColor();});
  el.addEventListener('pointerup',function(e){if(!moved)toggleWC();});
}
function toggleWC(){wcVisible=!wcVisible;var w=document.getElementById('wc-wrap');if(wcVisible){buildMiniChart();w.classList.add('open');}else w.classList.remove('open');}
function weightChartClick(){wcVisible=false;document.getElementById('wc-wrap').classList.remove('open');buildDetailChart(detailRange);document.getElementById('detail-overlay').classList.add('open');}
function buildMiniChart(){
  var svg=document.getElementById('wc-svg');svg.innerHTML='';
  var W=Math.min(400,window.innerWidth)-44,H=40,p=2;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.style.height='40px';
  var data=weightData.slice(-90),mn=Math.min.apply(null,data)-.3,mx=Math.max.apply(null,data)+.3;
  var sx=function(i){return p+(i/(data.length-1))*(W-p*2);},sy=function(v){return p+(1-(v-mn)/(mx-mn))*(H-p*2);};
  var ns='http://www.w3.org/2000/svg',d='M '+sx(0)+' '+sy(data[0]);
  for(var i=1;i<data.length;i++){var x0=sx(i-1),y0=sy(data[i-1]),x1=sx(i),y1=sy(data[i]),cx=(x0+x1)/2;d+=' C '+cx+' '+y0+' '+cx+' '+y1+' '+x1+' '+y1;}
  var path=document.createElementNS(ns,'path');path.setAttribute('d',d);path.setAttribute('fill','none');path.setAttribute('stroke','#c8c8c8');path.setAttribute('stroke-width','1.2');path.setAttribute('stroke-linecap','round');svg.appendChild(path);
  var gy=sy(goalWeight);var gl=document.createElementNS(ns,'line');gl.setAttribute('x1',p);gl.setAttribute('x2',W-p);gl.setAttribute('y1',gy);gl.setAttribute('y2',gy);gl.setAttribute('stroke','#fff');gl.setAttribute('stroke-width','.5');gl.setAttribute('stroke-dasharray','3 3');gl.setAttribute('opacity','.15');svg.appendChild(gl);
}
function setRange(days,btn){detailRange=days;document.querySelectorAll('.ov-rb').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');buildDetailChart(days);}
function buildDetailChart(days){
  var svg=document.getElementById('detail-svg');svg.innerHTML='';
  var data=weightData.slice(-days),W=356,H=220,pl=30,pr=6,pt=8,pb=20,iw=W-pl-pr,ih=H-pt-pb;
  var mn=Math.min.apply(null,data)-.8,mx=Math.max.apply(null,data)+.8;
  var ns='http://www.w3.org/2000/svg';
  var mk=function(tag,a){var e=document.createElementNS(ns,tag);Object.keys(a).forEach(function(k){e.setAttribute(k,a[k]);});return e;};
  var sx=function(i){return pl+(i/(data.length-1))*iw;},sy=function(v){return pt+(1-(v-mn)/(mx-mn))*ih;};
  for(var i=0;i<=4;i++){var v=mn+(mx-mn)*i/4,y=sy(v);svg.appendChild(mk('line',{x1:pl,x2:pl+iw,y1:y,y2:y,stroke:'#141414','stroke-width':'1'}));var t=document.createElementNS(ns,'text');t.setAttribute('x',pl-3);t.setAttribute('y',y+3);t.setAttribute('text-anchor','end');t.setAttribute('font-size','7');t.setAttribute('fill','#2a2a2a');t.textContent=v.toFixed(1);svg.appendChild(t);}
  var n=data.length,xi=Array.from({length:n},function(_,i){return i;});
  var mmx=xi.reduce(function(a,b){return a+b;})/n,mmy=data.reduce(function(a,b){return a+b;})/n;
  var slope=xi.reduce(function(s,x,i){return s+(x-mmx)*(data[i]-mmy);},0)/xi.reduce(function(s,x){return s+(x-mmx)*(x-mmx);},0);
  svg.appendChild(mk('line',{x1:sx(0),x2:sx(n-1),y1:sy(mmy-slope*mmx),y2:sy(slope*(n-1)+(mmy-slope*mmx)),stroke:'#252525','stroke-width':'1','stroke-dasharray':'3 3'}));
  var d='M '+sx(0)+' '+sy(data[0]);for(var i=1;i<data.length;i++){var x0=sx(i-1),y0=sy(data[i-1]),x1=sx(i),y1=sy(data[i]),cx=(x0+x1)/2;d+=' C '+cx+' '+y0+' '+cx+' '+y1+' '+x1+' '+y1;}
  svg.appendChild(mk('path',{d:d,fill:'none',stroke:'#c0c0c0','stroke-width':'1.4','stroke-linecap':'round'}));
  var gy=sy(goalWeight);svg.appendChild(mk('line',{x1:pl,x2:pl+iw,y1:gy,y2:gy,stroke:'#252525','stroke-width':'.7','stroke-dasharray':'3 3'}));
  for(var i=0;i<data.length;i+=Math.floor(Math.random()*5)+3)svg.appendChild(mk('circle',{cx:sx(i),cy:sy(data[i]),r:'2',fill:'#d97706',opacity:'.5'}));
  for(var i=0;i<=4;i++){var idx=Math.round(i*(data.length-1)/4);var tt=document.createElementNS(ns,'text');tt.setAttribute('x',sx(idx));tt.setAttribute('y',H-4);tt.setAttribute('text-anchor','middle');tt.setAttribute('font-size','7');tt.setAttribute('fill','#242424');var date=new Date();date.setDate(date.getDate()-(data.length-1-idx));tt.textContent=String(date.getDate()).padStart(2,'0')+'.'+String(date.getMonth()+1).padStart(2,'0');svg.appendChild(tt);}
}

// ══════════════════════════════════════════════
// NOTE
// ══════════════════════════════════════════════
async function sendNote(){
  var i=document.getElementById('note-inp'),text=i.value.trim();if(!text)return;
  var sb=window.__sb,uid=window.__userId;
  if(sb&&uid)sb.from('notes').insert({user_id:uid,text:text}).then(function(){});
  i.value='';i.placeholder='saved ✓';
  setTimeout(function(){i.placeholder='note something…';toggleNote();},800);
}
function toggleNote(){
  noteOpen=!noteOpen;
  document.getElementById('nav-icons').style.display=noteOpen?'none':'flex';
  document.getElementById('nav-note-field').classList.toggle('open',noteOpen);
  if(noteOpen)document.getElementById('note-inp').focus();
}

// ══════════════════════════════════════════════
// PANELS
// ══════════════════════════════════════════════
function openPanel(id){
  document.querySelectorAll('.panel.open').forEach(function(p){p.classList.remove('open');});
  document.body.style.overflow='hidden';
  document.getElementById(id).classList.add('open');
  if(id==='todo-panel')renderTodoList();
  if(id==='hm-panel')showHmList();
}
function closePanel(id){document.getElementById(id).classList.remove('open');document.body.style.overflow='';}

// ══════════════════════════════════════════════
// TODO
// ══════════════════════════════════════════════
function renderTodoList(scrollToNew){
  var list=document.getElementById('todo-list');list.innerHTML='';
  var completed=todos.filter(function(t){return t.completedAt!==null;}).sort(function(a,b){return a.completedAt-b.completedAt;});
  var pending=todos.filter(function(t){return t.completedAt===null;}).sort(function(a,b){return a.created-b.created;});
  completed.forEach(function(t){list.appendChild(makeTodoEl(t));});
  pending.forEach(function(t){list.appendChild(makeTodoEl(t));});
  setTimeout(function(){
    var items=list.querySelectorAll('.todo-item');
    if(scrollToNew){var last=items[items.length-1];if(last)last.scrollIntoView({block:'end',behavior:'smooth'});}
    else if(pending.length){if(items[completed.length])items[completed.length].scrollIntoView({block:'start',behavior:'instant'});}
  },0);
}
function makeTodoEl(t){
  var el=document.createElement('div');el.className='todo-item';
  var cb=document.createElement('div');cb.className='todo-cb'+(t.completedAt?' done':'');
  var txt=document.createElement('div');txt.className='todo-text'+(t.completedAt?' done':'');
  txt.textContent=t.text;el.appendChild(cb);el.appendChild(txt);
  var pt=null,pm=false;
  el.addEventListener('pointerdown',function(){pm=false;pt=setTimeout(function(){pt=null;showCtxMenu(t,el);},480);});
  el.addEventListener('pointermove',function(){if(pt)pm=true;});
  el.addEventListener('pointerup',function(){if(pt&&!pm){clearTimeout(pt);pt=null;toggleTodo(t.id);}else if(pt){clearTimeout(pt);pt=null;}});
  el.addEventListener('pointercancel',function(){if(pt){clearTimeout(pt);pt=null;}});
  return el;
}
function toggleTodo(id){
  var t=todos.find(function(x){return x.id===id;});if(!t)return;
  t.completedAt=t.completedAt?null:Date.now();
  var sb=window.__sb,uid=window.__userId;
  if(sb&&uid)sb.from('todos').update({completed_at:t.completedAt?new Date(t.completedAt).toISOString():null}).eq('id',id).eq('user_id',uid).then(function(){});
  renderTodoList();
}
async function addTodo(){
  var inp=document.getElementById('todo-inp'),text=inp.value.trim();if(!text)return;
  var tmpId='tmp-'+Date.now();
  var todo={id:tmpId,text:text,created:Date.now(),completedAt:null};
  todos.push(todo);inp.value='';renderTodoList(true);
  var sb=window.__sb,uid=window.__userId;
  if(sb&&uid){
    var res=await sb.from('todos').insert({user_id:uid,text:text}).select().single();
    if(res.data){var idx=todos.findIndex(function(t){return t.id===tmpId;});if(idx>=0)todos[idx].id=res.data.id;}
  }
}
function showCtxMenu(t,el){
  ctxMode='todo';ctxTodo=t;
  var menu=document.getElementById('ctx-menu');
  document.getElementById('ctx-undo').style.display=t.completedAt?'block':'none';
  menu.querySelector('.ctx-item.danger').textContent='Delete';
  var rect=el.getBoundingClientRect();
  menu.style.top=(rect.bottom+4)+'px';menu.style.left=(rect.left+20)+'px';
  menu.classList.add('open');
  setTimeout(function(){document.addEventListener('pointerdown',closeCtxOnce,{once:true});},10);
}
function closeCtxOnce(e){if(!e.target.closest('#ctx-menu'))document.getElementById('ctx-menu').classList.remove('open');}
function ctxEdit(){
  document.getElementById('ctx-menu').classList.remove('open');
  if(ctxMode==='habit'){openHmEdit(ctxHabitKey,ctxHabitBuiltin);return;}
  if(!ctxTodo)return;
  var nv=prompt('Edit task:',ctxTodo.text);
  if(nv&&nv.trim()){
    ctxTodo.text=nv.trim();
    var sb=window.__sb,uid=window.__userId;
    if(sb&&uid)sb.from('todos').update({text:ctxTodo.text}).eq('id',ctxTodo.id).eq('user_id',uid).then(function(){});
    renderTodoList();
  }
}
function ctxUndo(){
  document.getElementById('ctx-menu').classList.remove('open');
  if(ctxMode==='habit'){var idx=hiddenBuiltins.indexOf(ctxHabitKey);if(idx>=0)hiddenBuiltins.splice(idx,1);else hiddenBuiltins.push(ctxHabitKey);updateVisibility();showHmList();return;}
  if(!ctxTodo)return;ctxTodo.completedAt=null;
  var sb=window.__sb,uid=window.__userId;
  if(sb&&uid)sb.from('todos').update({completed_at:null}).eq('id',ctxTodo.id).eq('user_id',uid).then(function(){});
  renderTodoList();
}
function ctxDelete(){
  document.getElementById('ctx-menu').classList.remove('open');
  if(ctxMode==='habit'){var id=ctxHabitKey;customHabits=customHabits.filter(function(h){return h.id!==id;});persistDeleteHabit(id);showHmList();renderCustomHabits();return;}
  if(!ctxTodo)return;
  var id=ctxTodo.id;todos=todos.filter(function(t){return t.id!==id;});
  var sb=window.__sb,uid=window.__userId;
  if(sb&&uid)sb.from('todos').delete().eq('id',id).eq('user_id',uid).then(function(){});
  renderTodoList();
}

// ══════════════════════════════════════════════
// HABIT MANAGER
// ══════════════════════════════════════════════
var ICON_SET=['ph-heart','ph-heart-pulse','ph-drop','ph-drop-simple','ph-tooth','ph-pill','ph-bandage','ph-brain','ph-stethoscope','ph-bread','ph-pizza','ph-cookie','ph-avocado','ph-coffee','ph-apple','ph-egg','ph-carrot','ph-fish','ph-beer-stein','ph-pint-glass','ph-martini','ph-fork-knife','ph-bowl-food','ph-ice-cream','ph-cake','ph-hamburger','ph-wine','ph-bottle-water','ph-tea','ph-barbell','ph-sneaker-move','ph-scales','ph-bicycle','ph-steps','ph-person-simple-run','ph-person-simple-walk','ph-person-simple-bike','ph-tree','ph-tree-evergreen','ph-flower','ph-flower-tulip','ph-leaf','ph-plant','ph-sun','ph-sun-horizon','ph-moon','ph-moon-stars','ph-star','ph-sparkle','ph-cloud','ph-cloud-rain','ph-cloud-lightning','ph-cloud-snow','ph-wind','ph-umbrella','ph-rainbow','ph-snowflake','ph-fire','ph-flame','ph-wave','ph-mountains','ph-butterfly','ph-bird','ph-cat','ph-dog','ph-briefcase','ph-envelope','ph-envelope-simple','ph-chat-text','ph-chat-circle','ph-user-circle','ph-users','ph-sign-out','ph-phone','ph-desktop','ph-keyboard','ph-pencil','ph-pen','ph-note-pencil','ph-notebook','ph-book','ph-book-open','ph-books','ph-calendar','ph-clock','ph-timer','ph-alarm','ph-hourglass','ph-chart-bar','ph-chart-line','ph-chart-pie','ph-youtube-logo','ph-screencast','ph-television','ph-monitor-play','ph-music-note','ph-music-notes','ph-headphones','ph-speaker-high','ph-camera','ph-film-strip','ph-game-controller','ph-cross','ph-yin-yang','ph-peace','ph-house','ph-bed','ph-sofa','ph-bathtub','ph-shower','ph-toolbox','ph-wrench','ph-gear','ph-lock','ph-shield','ph-key','ph-tag','ph-flag','ph-thumbs-up','ph-thumbs-down','ph-smiley','ph-lightbulb','ph-lightbulb-filament','ph-question','ph-info','ph-trophy','ph-medal','ph-target','ph-rocket','ph-lightning','ph-fast-forward','ph-crown','ph-certificate','ph-graduation-cap','ph-coins','ph-currency-dollar','ph-wallet','ph-gift','ph-confetti','ph-infinity','ph-palette','ph-paint-brush','ph-scissors','ph-map-pin','ph-globe','ph-compass','ph-car','ph-airplane','ph-train','ph-boat'];

function showHmList(){
  document.getElementById('hm-panel-title').textContent='Habits';
  document.getElementById('hm-form').style.display='none';
  var ex=document.getElementById('hm-existing');ex.innerHTML='';
  var lbl=document.createElement('div');lbl.className='hm-label';lbl.style.paddingTop='16px';lbl.textContent='Your habits';ex.appendChild(lbl);
  Object.keys(HABITS).filter(function(k){return['water','work','sleep','workout'].indexOf(k)<0;}).forEach(function(k){
    var h=HABITS[k],isHidden=hiddenBuiltins.indexOf(k)>=0;
    var row=document.createElement('div');row.className='hm-habit-row';row.style.opacity=isHidden?'0.35':'1';
    row.innerHTML='<i class="ph-duotone '+h.ph+' hm-habit-ico" style="color:'+resolveColor(h.color)+';--ph-duotone-opacity:.4"></i><span class="hm-habit-name">'+h.label+'</span><span class="hm-habit-meta">'+(isHidden?'hidden':(h.prob?Math.round(h.prob*100)+'%':''))+'</span>';
    ex.appendChild(row);hmAddLongPress(row,k,true);
  });
  customHabits.forEach(function(h){
    var row=document.createElement('div');row.className='hm-habit-row';
    row.innerHTML='<i class="ph-duotone '+h.icon+' hm-habit-ico" style="color:'+h.color+';--ph-duotone-opacity:.4"></i><span class="hm-habit-name">'+h.name+'</span><span class="hm-habit-meta">'+h.type+'</span>';
    ex.appendChild(row);hmAddLongPress(row,h.id,false);
  });
  document.getElementById('hm-form-preview').style.display='none';
  var bot=document.getElementById('hm-panel-bottom');bot.innerHTML='';
  var newBtn=document.createElement('button');newBtn.className='hm-btn primary';newBtn.style.cssText='flex:1;margin:0';newBtn.textContent='+ New Habit';newBtn.onclick=openHmNew;
  var x=document.createElement('i');x.className='ph ph-x panel-close-x';x.onclick=function(){closePanel('hm-panel');};
  bot.appendChild(newBtn);bot.appendChild(x);
}

function openHmNew(){
  hmEditId=null;
  document.getElementById('hm-panel-title').textContent='New Habit';
  document.getElementById('hm-edit-warning').style.display='none';
  document.getElementById('hm-existing').innerHTML='';
  document.getElementById('hm-form').style.display='block';
  document.getElementById('hm-name').value='';
  document.getElementById('hm-desc').value='';
  document.getElementById('hm-target-row').style.display='none';
  document.getElementById('hm-time-custom').style.display='none';
  document.getElementById('hm-color-hex').style.display='none';
  hmSelIcon='ph-heart';hmSelColor='#4ade80';hmSelType='toggle';hmPrevCount=0;hmPrevActive=false;
  hmTrackTarget=4;document.getElementById('hm-target-count').textContent='4';
  tsStart=7;tsEnd=22;
  resetChips('hm-color-chips','#4ade80');resetChips('hm-time-chips','all');
  resetChips('hm-type-chips','toggle');resetChips('hm-cat-chips','own-row');
  rebuildCatChips();renderHmIconGrid('');updateHmPreview();wireChipGroups();
  refreshColorDots('hm-color-chips');
  document.getElementById('hm-form-preview').style.display='block';
  var bot=document.getElementById('hm-panel-bottom');bot.innerHTML='';
  var saveBtn=document.createElement('button');saveBtn.id='hm-save-btn';saveBtn.className='hm-btn primary';saveBtn.style.cssText='flex:1;margin:0';
  saveBtn.innerHTML='<i class="ph ph-floppy-disk" style="margin-right:5px;vertical-align:middle"></i>Save';
  saveBtn.onclick=saveHabit;
  var x=document.createElement('i');x.className='ph ph-x panel-close-x';x.onclick=showHmList;
  bot.appendChild(saveBtn);bot.appendChild(x);
}

function hmAddLongPress(row,key,isBuiltin){
  var pt=null,pm=false;
  row.addEventListener('pointerdown',function(){pm=false;pt=setTimeout(function(){pt=null;showHabitCtx(key,isBuiltin,row);},480);});
  row.addEventListener('pointermove',function(){if(pt)pm=true;});
  row.addEventListener('pointerup',function(){if(pt&&!pm){clearTimeout(pt);pt=null;}else if(pt){clearTimeout(pt);pt=null;}});
  row.addEventListener('pointercancel',function(){if(pt){clearTimeout(pt);pt=null;}});
}

function showHabitCtx(key,isBuiltin,el){
  ctxMode='habit';ctxHabitKey=key;ctxHabitBuiltin=isBuiltin;
  var menu=document.getElementById('ctx-menu');
  var undoItem=document.getElementById('ctx-undo'),isHidden=hiddenBuiltins.indexOf(key)>=0;
  undoItem.style.display='block';undoItem.textContent=isHidden?'Show on home screen':'Hide from home screen';
  menu.querySelector('.ctx-item.danger').style.display=isBuiltin?'none':'block';
  menu.querySelector('.ctx-item.danger').textContent='Delete';
  var rect=el.getBoundingClientRect();
  menu.style.top=(rect.bottom+4)+'px';menu.style.left=(rect.left+20)+'px';
  menu.classList.add('open');
  setTimeout(function(){document.addEventListener('pointerdown',closeCtxOnce,{once:true});},10);
}

function openHmEdit(key,isBuiltin){
  var h=isBuiltin?HABITS[key]:customHabits.find(function(x){return x.id===key;});if(!h)return;
  hmEditId=key;
  var icon=isBuiltin?h.ph:h.icon,color=isBuiltin?resolveColor(h.color):h.color;
  var name=isBuiltin?h.label:(h.name||''),type=isBuiltin?'toggle':(h.type||'toggle');
  var time=isBuiltin?'all':(h.time||'all'),cat=isBuiltin?(builtinCat[key]||'positive'):(h.category||'positive');
  document.getElementById('hm-panel-title').textContent='Edit Habit';
  document.getElementById('hm-existing').innerHTML='';
  document.getElementById('hm-form').style.display='block';
  document.getElementById('hm-edit-warning').style.display=isBuiltin?'block':'none';
  document.getElementById('hm-name').value=name;
  document.getElementById('hm-desc').value=isBuiltin?'':(h.desc||'');
  document.getElementById('hm-target-row').style.display=type==='tracker'?'flex':'none';
  document.getElementById('hm-time-custom').style.display='none';
  hmSelIcon=icon;hmSelColor=color;hmSelType=type;hmPrevCount=0;hmPrevActive=false;
  hmTrackTarget=isBuiltin?1:(h.target||4);document.getElementById('hm-target-count').textContent=hmTrackTarget;
  tsStart=7;tsEnd=22;
  resetChips('hm-color-chips',color);resetChips('hm-time-chips',time);
  resetChips('hm-type-chips',type);rebuildCatChips();resetChips('hm-cat-chips',cat);
  renderHmIconGrid('');updateHmPreview();wireChipGroups();
  document.getElementById('hm-form-preview').style.display='block';
  var bot=document.getElementById('hm-panel-bottom');bot.innerHTML='';
  var saveBtn=document.createElement('button');saveBtn.id='hm-save-btn';saveBtn.className='hm-btn primary';saveBtn.style.cssText='flex:1;margin:0';
  saveBtn.innerHTML='<i class="ph ph-floppy-disk" style="margin-right:5px;vertical-align:middle"></i>Save changes';
  saveBtn.onclick=saveHabit;
  var x=document.createElement('i');x.className='ph ph-x panel-close-x';x.onclick=showHmList;
  bot.appendChild(saveBtn);bot.appendChild(x);
}

function rebuildCatChips(){
  var chips=document.getElementById('hm-cat-chips');
  chips.innerHTML='<span class="hm-chip sel" data-v="own-row">Own row</span><span class="hm-chip" data-v="positive">Positive</span><span class="hm-chip" data-v="bad">Bad habit</span><span class="hm-chip" data-v="morning">Morning</span>';
  customParents.forEach(function(p){var c=document.createElement('span');c.className='hm-chip';c.dataset.v='parent:'+p.id;c.textContent=p.name;chips.appendChild(c);});
}

function wireChipGroups(){
  document.querySelectorAll('.hm-chips').forEach(function(group){
    group.onclick=function(e){
      var chip=e.target.closest('.hm-chip');if(!chip)return;
      group.querySelectorAll('.hm-chip').forEach(function(c){c.classList.remove('sel');});chip.classList.add('sel');
      if(group.id==='hm-color-chips'){
        var hexInp=document.getElementById('hm-color-hex');
        if(chip.dataset.v==='custom'){hexInp.style.display='block';hexInp.focus();}
        else{hexInp.style.display='none';hmSelColor=chip.dataset.v;updateHmPreview();}
        refreshColorDots('hm-color-chips');
      }
      if(group.id==='hm-type-chips'){hmSelType=chip.dataset.v;hmPrevCount=0;hmPrevActive=false;document.getElementById('hm-target-row').style.display=hmSelType==='tracker'?'flex':'none';updateHmPreview();}
      if(group.id==='hm-time-chips'){var isCustom=chip.dataset.v==='custom';document.getElementById('hm-time-custom').style.display=isCustom?'block':'none';if(isCustom)initTimeSlider();}
    };
  });
  var hexInp=document.getElementById('hm-color-hex');
  if(!hexInp.dataset.wired){hexInp.dataset.wired='1';hexInp.oninput=function(){var v=hexInp.value.trim();if(v&&!v.startsWith('#'))v='#'+v;if(/^#[0-9a-fA-F]{6}$/.test(v)){hmSelColor=v;updateHmPreview();}};}
  refreshColorDots('hm-color-chips');
}

function updateTimeSlider(){
  var track=document.getElementById('hm-ts-track');if(!track)return;
  var fill=document.getElementById('hm-ts-fill');
  var sp=tsStart/24*100,ep=tsEnd/24*100;
  document.getElementById('hm-ts-s').style.left=sp+'%';document.getElementById('hm-ts-e').style.left=ep+'%';
  document.getElementById('hm-ts-sl').textContent=String(tsStart%24).padStart(2,'0');document.getElementById('hm-ts-el').textContent=String(tsEnd%24).padStart(2,'0');
  var a='rgba(255,255,255,0.15)',w='#fff';
  if(tsStart===tsEnd||tsEnd-tsStart===24)fill.style.background=w;
  else if(tsStart<tsEnd)fill.style.background='linear-gradient(to right,'+a+' 0%,'+a+' '+sp+'%,'+w+' '+sp+'%,'+w+' '+ep+'%,'+a+' '+ep+'%,'+a+' 100%)';
  else fill.style.background='linear-gradient(to right,'+w+' 0%,'+w+' '+ep+'%,'+a+' '+ep+'%,'+a+' '+sp+'%,'+w+' '+sp+'%,'+w+' 100%)';
}

function initTimeSlider(){
  var track=document.getElementById('hm-ts-track');if(!track||track.dataset.inited)return;track.dataset.inited='1';updateTimeSlider();
  ['hm-ts-s','hm-ts-e'].forEach(function(id){
    var dot=document.getElementById(id),isStart=id==='hm-ts-s',drag=false;
    dot.addEventListener('pointerdown',function(e){drag=true;dot.setPointerCapture(e.pointerId);e.stopPropagation();});
    dot.addEventListener('pointermove',function(e){if(!drag)return;var rect=track.getBoundingClientRect();var pct=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));var hr=Math.round(pct*24);if(isStart)tsStart=Math.min(23,hr);else tsEnd=Math.max(1,hr);updateTimeSlider();});
    dot.addEventListener('pointerup',function(){drag=false;});dot.addEventListener('pointercancel',function(){drag=false;});
  });
  document.getElementById('hm-days').onclick=function(e){var d=e.target.closest('.hm-day');if(!d)return;d.classList.toggle('inactive');};
}

function resetChips(gid,val){document.getElementById(gid).querySelectorAll('.hm-chip').forEach(function(c){c.classList.toggle('sel',c.dataset.v===val);});}
function getChipVal(gid){var s=document.getElementById(gid).querySelector('.hm-chip.sel');return s?s.dataset.v:'';}

function renderHmIconGrid(filter){
  var grid=document.getElementById('hm-icon-grid');grid.innerHTML='';
  var q=filter.toLowerCase().replace(/^ph-/,'');
  ICON_SET.filter(function(ic){return!q||ic.replace('ph-','').indexOf(q)>=0;}).forEach(function(ic){
    var el=document.createElement('div');el.className='hm-iopt'+(ic===hmSelIcon?' sel':'');
    el.innerHTML='<i class="ph-duotone '+ic+'" style="--ph-duotone-opacity:.3"></i>';
    el.onclick=function(){hmSelIcon=ic;grid.querySelectorAll('.hm-iopt').forEach(function(e){e.classList.remove('sel');});el.classList.add('sel');updateHmPreview();};
    grid.appendChild(el);
  });
}
function filterHmIcons(){renderHmIconGrid(document.getElementById('hm-ico-search').value);}

function updateHmPreview(){
  var preview=document.getElementById('hm-preview');if(!preview)return;
  preview.innerHTML='';preview.style.flexDirection='row';preview.style.gap='12px';preview.style.justifyContent='center';preview.style.alignItems='center';
  var ic=hmSelIcon,color=hmSelColor,type=hmSelType;
  if(type==='toggle'){
    var iEl=document.createElement('i');iEl.className='ph-duotone '+ic+' prev-ico'+(hmPrevActive?'':' ghost');iEl.style.cssText='--ph-duotone-opacity:.18;color:'+(hmPrevActive?color:'');
    iEl.onclick=function(){hmPrevActive=!hmPrevActive;updateHmPreview();};
    preview.appendChild(iEl);var hint=document.createElement('span');hint.style.cssText='font-size:9px;color:#333';hint.textContent='tap';preview.appendChild(hint);
  }else if(type==='counter'){
    var isAct=hmPrevCount>0;
    var iEl=document.createElement('i');iEl.className='ph-duotone '+ic+' prev-ico'+(isAct?'':' ghost');iEl.style.cssText='--ph-duotone-opacity:.18;color:'+(isAct?color:'')+';cursor:pointer';
    var cnt=document.createElement('span');cnt.className='prev-count';cnt.textContent=String(hmPrevCount);
    var ps={t:null};
    iEl.onclick=function(){
      if(ps.t){clearTimeout(ps.t);ps.t=null;if(hmPrevCount>0)hmPrevCount--;cnt.textContent=String(hmPrevCount);if(hmPrevCount===0){iEl.classList.add('ghost');iEl.style.color='';}}
      else{ps.t=setTimeout(function(){ps.t=null;hmPrevCount++;cnt.textContent=String(hmPrevCount);iEl.classList.remove('ghost');iEl.style.color=color;},300);}
    };
    preview.appendChild(iEl);preview.appendChild(cnt);var hint2=document.createElement('span');hint2.style.cssText='font-size:9px;color:#333';hint2.textContent='dbl=−1';preview.appendChild(hint2);
  }else if(type==='tracker'){
    var wrap=document.createElement('div');wrap.style.cssText='display:flex;gap:4px;flex-wrap:wrap;justify-content:center;width:100%';
    var pc={n:0};
    var drawPT=function(){wrap.innerHTML='';for(var i=0;i<hmTrackTarget;i++){(function(idx){var u=document.createElement('i');var filled=idx<pc.n;u.className=filled?('ph-duotone '+ic+' t-unit'):('ph '+ic+' t-unit ghost');u.style.cssText='font-size:20px;cursor:pointer';if(filled){u.style.color=color;u.style.setProperty('--ph-duotone-opacity','0.18');}u.onclick=function(e){e.stopPropagation();pc.n=idx<pc.n?idx:idx+1;drawPT();};wrap.appendChild(u);})(i);}};
    drawPT();wrap.onclick=function(e){if(e.target.closest('.t-unit'))return;if(pc.n<hmTrackTarget){pc.n++;drawPT();}};preview.appendChild(wrap);
  }else if(type==='parent'){
    var iEl=document.createElement('i');iEl.className='ph-duotone '+ic+' t-ico'+(hmPrevActive?'':' ghost');iEl.style.cssText='--ph-duotone-opacity:.18;font-size:28px;color:'+(hmPrevActive?color:'');
    iEl.onclick=function(){hmPrevActive=!hmPrevActive;updateHmPreview();};
    preview.style.flexDirection='column';preview.appendChild(iEl);
    if(hmPrevActive){var row=document.createElement('div');row.style.cssText='display:flex;gap:10px';for(var i=0;i<3;i++){var c=document.createElement('i');c.className='ph-duotone ph-plus';c.style.cssText='font-size:22px;color:#252525;--ph-duotone-opacity:.18';row.appendChild(c);}preview.appendChild(row);}
  }
}

function renderCustomHabits(){
  document.querySelectorAll('[data-custom]').forEach(function(el){el.remove();});
  document.getElementById('custom-own-rows').innerHTML='';
  var own=document.getElementById('custom-own-rows');
  customHabits.filter(function(h){return h.type==='parent';}).forEach(function(p){
    var sec=document.createElement('div');sec.className='csec';sec.dataset.custom='1';
    var wrap=document.createElement('div');wrap.className='t-wrap';
    var ico=document.createElement('i');ico.className='ph-duotone '+p.icon+' t-ico ghost';ico.style.cssText='font-size:28px;--ph-duotone-opacity:.18';
    wrap.appendChild(ico);var spawn=document.createElement('div');spawn.className='spawn';spawn.id='custom-spawn-'+p.id;
    var divEl=document.createElement('div');divEl.className='div';divEl.style.marginTop='2px';divEl.dataset.custom='1';
    sec.appendChild(wrap);sec.appendChild(spawn);own.parentNode.insertBefore(sec,own);own.parentNode.insertBefore(divEl,own);
    var isOpen=false;
    attachPress(wrap,function(){isOpen=!isOpen;if(isOpen){ico.style.color=p.color;ico.classList.remove('ghost');spawn.classList.add('open');}else{ico.style.color='';ico.classList.add('ghost');spawn.classList.remove('open');}},function(){});
  });
  customHabits.filter(function(h){return h.type!=='parent';}).forEach(function(h){
    var cat=h.category||'positive',dest=null;
    if(cat==='positive')dest=document.getElementById('sec-positive');
    else if(cat==='bad')dest=document.getElementById('sec-bad');
    else if(cat==='morning')dest=document.getElementById('morning-spawn');
    else if(cat==='own-row')dest=own;
    else if(cat.indexOf('parent:')===0)dest=document.getElementById('custom-spawn-'+cat.replace('parent:',''));
    if(!dest)dest=document.getElementById('sec-positive');
    var initVal=initialHabitValues[h.id]||0;

    if(h.type==='toggle'){
      var sh=document.createElement('div');sh.className='sh';sh.dataset.custom='1';
      var ico=document.createElement('i');
      ico.className='ph-duotone '+h.icon+' sh-ico'+(initVal?'':' ghost');
      ico.id='custom-ico-'+h.id;ico.style.cssText='--ph-duotone-opacity:.18';
      if(initVal)ico.style.color=h.color;
      sh.appendChild(ico);dest.appendChild(sh);
      attachPress(sh,(function(hh){return function(){
        var el=document.getElementById('custom-ico-'+hh.id);if(!el)return;
        if(el.classList.contains('ghost')){el.classList.remove('ghost');el.style.color=hh.color;persistHabitLog(hh.id,1);}
        else{el.classList.add('ghost');el.style.color='';persistHabitLog(hh.id,0);}
      };})(h),function(){});

    }else if(h.type==='counter'){
      var sh=document.createElement('div');sh.className='sh';sh.dataset.custom='1';sh.style.cssText='flex-direction:column;align-items:center;gap:2px';
      var ico=document.createElement('i');
      ico.className='ph-duotone '+h.icon+' sh-ico'+(initVal?'':' ghost');
      ico.id='custom-ico-'+h.id;ico.style.cssText='--ph-duotone-opacity:.18';
      if(initVal)ico.style.color=h.color;
      var cnt=document.createElement('span');cnt.style.cssText='font-size:10px;color:#444;font-variant-numeric:tabular-nums';cnt.textContent=String(initVal);
      sh.appendChild(ico);sh.appendChild(cnt);dest.appendChild(sh);
      attachPress(sh,(function(hh,icoEl,cntEl){
        var s={n:initialHabitValues[hh.id]||0,t:null};
        return function(){
          if(s.t){clearTimeout(s.t);s.t=null;if(s.n>0)s.n--;cntEl.textContent=String(s.n);if(s.n===0){icoEl.classList.add('ghost');icoEl.style.color='';}persistHabitLog(hh.id,s.n);}
          else{s.t=setTimeout(function(){s.t=null;s.n++;cntEl.textContent=String(s.n);icoEl.style.color=hh.color;icoEl.classList.remove('ghost');persistHabitLog(hh.id,s.n);},300);}
        };
      })(h,ico,cnt),(function(hh){return function(){
        customHabitCache[hh.id]={ph:hh.icon,color:hh.color,prob:0.5,avgH:14,stdH:2,label:hh.name,txt:hh.desc||''};
        openInsight(hh.id);
      };})(h));

    }else if(h.type==='tracker'){
      var row=document.createElement('div');row.className='tracker-row';row.dataset.custom='1';
      var main=document.createElement('div');main.className='tracker-main';
      var icons=document.createElement('div');icons.className='t-icons';
      main.appendChild(icons);row.appendChild(main);dest.appendChild(row);
      (function(hh,iconsEl){
        var c=initialHabitValues[hh.id]||0,tgt=hh.target||4;
        function draw(){iconsEl.innerHTML='';for(var i=0;i<tgt;i++){var u=document.createElement('i');var filled=i<c;u.className=filled?('ph-duotone '+hh.icon+' t-unit'):('ph '+hh.icon+' t-unit ghost');if(filled){u.style.color=hh.color;u.style.setProperty('--ph-duotone-opacity','0.18');}(function(idx){u.onclick=function(e){e.stopPropagation();c=idx<c?idx:idx+1;draw();persistHabitLog(hh.id,c);};})(i);iconsEl.appendChild(u);}}
        draw();main.onclick=function(e){if(e.target.closest('.t-unit'))return;if(c<tgt){c++;draw();persistHabitLog(hh.id,c);}};
      })(h,icons);
    }
  });
  if(own.children.length>0){var ownDiv=document.createElement('div');ownDiv.className='div';ownDiv.dataset.custom='1';own.insertAdjacentElement('afterend',ownDiv);}
}

function saveHabit(){
  var name=document.getElementById('hm-name').value.trim();if(!name){document.getElementById('hm-name').focus();return;}
  if(hmEditId){
    var idx=customHabits.findIndex(function(h){return h.id===hmEditId;});
    if(idx>=0){Object.assign(customHabits[idx],{name:name,icon:hmSelIcon,color:hmSelColor,type:hmSelType,time:getChipVal('hm-time-chips'),category:getChipVal('hm-cat-chips'),desc:document.getElementById('hm-desc').value,target:hmTrackTarget});persistSaveHabit(customHabits[idx]);}
    hmEditId=null;
  }else{
    var id=crypto.randomUUID();
    var habit={id:id,name:name,icon:hmSelIcon,color:hmSelColor,type:hmSelType,time:getChipVal('hm-time-chips'),category:getChipVal('hm-cat-chips'),desc:document.getElementById('hm-desc').value,target:hmTrackTarget};
    customHabits.push(habit);if(hmSelType==='parent')customParents.push(habit);
    persistSaveHabit(habit);
  }
  renderCustomHabits();
  var btn=document.getElementById('hm-save-btn');
  btn.innerHTML='<i class="ph ph-check" style="margin-right:5px;vertical-align:middle"></i>Saved';
  btn.style.color='#4ade80';
  setTimeout(function(){showHmList();},600);
}

// ══════════════════════════════════════════════
// CHAT
// ══════════════════════════════════════════════
async function sendChat(){
  var inp=document.getElementById('chat-inp'),text=inp.value.trim();if(!text)return;
  var msgs=document.getElementById('chat-msgs');
  var ub=document.createElement('div');ub.className='chat-bubble user';ub.textContent=text;msgs.appendChild(ub);
  inp.value='';msgs.scrollTop=msgs.scrollHeight;
  chatHistory.push({role:'user',content:text});
  var ab=document.createElement('div');ab.className='chat-bubble ai';ab.textContent='…';msgs.appendChild(ab);msgs.scrollTop=msgs.scrollHeight;
  var context={
    habits:customHabits.map(function(h){return{name:h.name,type:h.type};}),
    todayLogs:_sl,waterChecked:trackers.water.checked
  };
  try{
    var res=await fetch(window.__chatEndpoint||'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:chatHistory,context:context})});
    var reader=res.body.getReader(),decoder=new TextDecoder(),aiText='';ab.textContent='';
    while(true){var chunk=await reader.read();if(chunk.done)break;aiText+=decoder.decode(chunk.value,{stream:true});ab.textContent=aiText;msgs.scrollTop=msgs.scrollHeight;}
    chatHistory.push({role:'assistant',content:aiText});
  }catch(e){ab.textContent='Could not reach Claude right now.';}
}

// ══════════════════════════════════════════════
// WORK COUNTERS
// ══════════════════════════════════════════════
function initWorkCounters(){
  var container=document.getElementById('work-counters');if(!container)return;container.innerHTML='';
  var defs=[{key:'mail',icon:'ph-envelope-simple',color:'var(--work-mail)',rc:'#60a5fa'},{key:'chat',icon:'ph-chat-text',color:'var(--work-chat)',rc:'#818cf8'},{key:'meet',icon:'ph-user-circle',color:'var(--work-meet)',rc:'#a78bfa'}];
  defs.forEach(function(d){
    var s=workCtrState[d.key];
    var wrap=document.createElement('div');wrap.style.cssText='display:flex;align-items:center;gap:10px;cursor:pointer;padding:6px 14px;user-select:none;-webkit-user-select:none';
    var ico=document.createElement('i');ico.className='ph-duotone '+d.icon+(s.n>0?'':' ghost');ico.style.cssText='font-size:26px;--ph-duotone-opacity:.18;color:'+(s.n>0?d.rc:'');
    var num=document.createElement('span');num.style.cssText='font-size:20px;font-weight:200;font-variant-numeric:tabular-nums;min-width:2ch;color:#555';num.textContent=String(s.n);
    wrap.appendChild(ico);wrap.appendChild(num);container.appendChild(wrap);
    function tap(){
      if(s.t){clearTimeout(s.t);s.t=null;if(s.n>0)s.n--;num.textContent=String(s.n);if(s.n===0){ico.classList.add('ghost');ico.style.color='';}persistHabitLog(d.key,s.n);}
      else{s.t=setTimeout(function(){s.t=null;s.n++;num.textContent=String(s.n);ico.classList.remove('ghost');ico.style.color=d.rc;persistHabitLog(d.key,s.n);},300);}
    }
    attachPress(wrap,tap,function(){openInsight(d.key);});
  });
}

// ══════════════════════════════════════════════
// COLOR DOTS
// ══════════════════════════════════════════════
function refreshColorDots(groupId){
  var group=document.getElementById(groupId||'hm-color-chips');if(!group)return;
  group.querySelectorAll('.hm-chip').forEach(function(c){
    var dot=c.querySelector('.hm-cdot');if(!dot)return;
    var color=c.dataset.v;if(!color||color==='custom')return;
    if(c.classList.contains('sel')){var r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);dot.style.background='rgba('+r+','+g+','+b+',0.22)';}
    else{dot.style.background='transparent';}
  });
}

// ══════════════════════════════════════════════
// APPLY TODAY'S LOGS TO BUILTIN TOGGLES
// ══════════════════════════════════════════════
(function applyInitialState(){
  ['ico-bread','ico-pill','ico-ff','ico-teeth-am','ico-barbell','ico-run','ico-yoga','ico-book','ico-cross','ico-avo','ico-cookie','ico-pizza','ico-yt','ico-tv','ico-soda','ico-alc','ico-inspire'].forEach(function(id){
    if(initialHabitValues[id]){
      var el=document.getElementById(id);if(!el)return;
      el.classList.remove('ghost');el.classList.add('active');
      var h=HABITS[id];if(h)el.style.color=resolveColor(h.color);
    }
  });
})();

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
const pressMap=[
  ['sh-bread',   'ico-bread',    'var(--bread)',   'ico-bread'],
  ['sh-pill',    'ico-pill',     'var(--vitamin)', 'ico-pill'],
  ['sh-ff',      'ico-ff',       'var(--sprint)',  'ico-ff'],
  ['sh-teeth-am','ico-teeth-am', 'var(--teeth)',   'ico-teeth-am'],
  ['sh-barbell', 'ico-barbell',  'var(--workout)', 'ico-barbell'],
  ['sh-run',     'ico-run',      'var(--workout)', 'ico-run'],
  ['sh-yoga',    'ico-yoga',     'var(--workout)', 'ico-yoga'],
  ['sh-book',    'ico-book',     'var(--read)',    'ico-book'],
  ['sh-cross',   'ico-cross',    'var(--read)',    'ico-cross'],
  ['sh-avo',     'ico-avo',      '#6ab04c',        'ico-avo'],
  ['sh-cookie',  'ico-cookie',   'var(--bad)',     'ico-cookie'],
  ['sh-pizza',   'ico-pizza',    'var(--bad)',     'ico-pizza'],
  ['sh-yt',      'ico-yt',       'var(--bad)',     'ico-yt'],
  ['sh-tv',      'ico-tv',       'var(--bad)',     'ico-tv'],
  ['sh-soda',    'ico-soda',     'var(--bad)',     'ico-soda'],
  ['sh-alc',     'ico-alc',      'var(--bad)',     'ico-alc'],
  ['sh-inspire', 'ico-inspire',  'var(--inspire)', 'ico-inspire'],
];

attachPress(document.getElementById('water-row'),function(e){},function(){openInsight('water');});
attachPress(document.getElementById('sh-work'),function(){triggerWork();},function(){openInsight('work');});
attachPress(document.getElementById('sh-sleep'),function(){sleepLogged=true;sleepTime=new Date();activate('moon-ico','var(--sleep)');persistHabitLog('sleep',1);},function(){openInsight('sleep');});

setTimeout(function(){
  pressMap.forEach(function(m){attachPress(document.getElementById(m[0]),function(){toggleIco(m[1],m[2]);},function(){openInsight(m[3]);});});
  attachPress(document.getElementById('workout-trigger'),function(){toggleWorkout();},function(){openInsight('workout');});
},100);

['water','mail','chat','meet'].forEach(renderTracker);
updateWeightColor();updateVisibility();renderCustomHabits();
