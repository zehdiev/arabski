/* ================= ЛОГИКА НА ПРИЛОЖЕНИЕТО =================
   Зарежда се след level1.js (съдържанието на Ниво 1). */

/* ================= СГЛОБЯВАНЕ ================= */
const NONCON='اأإآدذرزوؤء';
const POS=['самостоятелна','начало','среда','край'];
const forms=L=>L==='ء'?['ء']:NONCON.includes(L)?[L,L,'ـ'+L,'ـ'+L]:[L,L+'ـ','ـ'+L+'ـ','ـ'+L];
const parse=s=>{const p=s.split('|');return p.length===3?{ar:p[0],tr:p[1],bg:p[2]}:{ar:p[0],bg:p[1]}};
const plain=s=>s.replace(/[\u064B-\u0652\u0670]/g,'');
/* Въпроси към текста: 'въпрос|верен отговор|грешен1|грешен2' */
const parseQ=s=>{const[q,a,...w]=s.split('|');return{q,a,w}};
const textQs=x=>x.q?x.q.map(parseQ):[];

/* Четене и писане: буквите (RW) и правописните уроци (RW_EXTRA) */
const parseA=s=>{const[ar,bg,ref]=s.split('|');return{ar,bg,ref}};
const HAMZA='ءأإآؤئ',SUN='تثدذرزسشصضطظلن';
const hasL=(ch,L)=>L==='ء'?HAMZA.includes(ch):ch===L;
/* позиция на буквата в думата: 1 начало, 2 среда, 3 край (индекси в POS); null, ако буквата не е точно веднъж */
function letterPos(word,L){const p=[...plain(word)].filter(ch=>/[ء-ي]/.test(ch)),idx=p.map((c,i)=>hasL(c,L)?i:-1).filter(i=>i>=0);
  if(idx.length!==1)return null;const i=idx[0];return i===0?1:i===p.length-1?3:2}
const rwCommon=x=>({lines:[],drills:(x.s||[]).map(parse),reading:(x.r||[]).map(parse),ayat:(x.a||[]).map(parseA),pairs:(x.pp||[]).map(p=>p.split('|')),cls:x.c&&Array.isArray(x.c)?x.c:[],tq:textQs(x)});
const rwLessons=[
 ...RW.map((x,i)=>{const pos={b:x.b.map(parse),m:x.m.map(parse),e:x.e.map(parse)},w=(x.w||[]).map(parse);
   return {kind:'letter',L:x.L,snd:x.snd,note:x.n,u:i<10?'Първа група букви':i<20?'Втора група букви':'Трета група букви',ar:'حَرْفُ '+x.L,t:'Буквата '+x.L+' ('+NAMES[x.L]+')',
     pos,neww:w,items:[...pos.b,...pos.m,...pos.e,...w],...rwCommon(x),cmp:x.c,pq:x.pq||'Коя дума съдържа буквата '+x.L+'?'}}),
 ...RW_EXTRA.map(x=>({kind:'letter',L:x.sym,special:true,u:'Правопис и четене',ar:x.ar,t:x.t,note:x.note,pos:null,neww:[],items:x.w.map(parse),...rwCommon(x),pq:x.pq}))
];
const rwFind=L=>rwLessons.find(l=>l.L===L);
const handLessons=[
 {kind:'handintro',u:'Въведение',ar:'الْحُرُوفُ فِي أَشْكَالٍ هَنْدَسِيَّةٍ',t:'Буквите като геометрични форми',note:'Арабските букви се строят от няколко основни форми: черта, дъга, кръг и точки. Пише се отдясно наляво. Разгледайте буквите и опитайте да напишете няколко.',trace:['ا','ب','ح','د','ر','س','ع','و']},
 {kind:'handintro',u:'Въведение',ar:'الْحُرُوفُ فِي أَوْضَاعِهَا الْمُخْتَلِفَةِ',t:'Буквите в различните им положения',note:'Повечето букви имат четири форми: самостоятелна, в началото, в средата и в края на думата. Шест букви (ا د ذ ر ز و) не се свързват с буквата след тях.',trace:['بـ','ـبـ','ـب','هـ','ـهـ','ـه','عـ','ـعـ','ـع']},
 ...HAND_LETTERS.map((L,i)=>{const src=L==='ا'?{items:[{ar:'بَابٌ'},{ar:'مَاءٌ'}]}:rwFind(L);
   return {kind:'hand',L,u:'Писане на буквите',ar:'الدَّرْسُ '+(i+1),t:'Буквата '+L+' ('+NAMES[L]+')',trace:[...new Set(forms(L))].concat(src.items.slice(0,2).map(x=>plain(x.ar)))}})
];
const picLessons=PIC.map(x=>({kind:'dialog',...x,tq:textQs(x),lines:x.d.map(parse),items:x.w.map(parse)}));
const stripSp=s=>s.replace(/^[^:]{1,30}:\s*/,'');
const expLessons=EXP.map(x=>({kind:x.review?'review':(x.d||x.s||x.r?'rich':'phrases'),...x,tq:textQs(x),items:x.w?x.w.map(parse):[],lines:x.d?x.d.map(parse):[],drills:x.s?x.s.map(parse):[],reading:x.r?x.r.map(parse):[]}));
expLessons.forEach(l=>{if(l.kind==='review'){l.own=l.items;l.items=[...l.items,...expLessons.filter(x=>x.u===l.u&&x.kind!=='review').flatMap(x=>x.items)]}});

const quranLessons=QURAN.map(x=>({kind:'quran',...x,tq:textQs(x),ayat:x.a.map(parse),items:x.w.map(parse)}));

/* Речник: събира всички думи от уроците, подредени по арабската азбука */
const ORDER='ءابتثجحخدذرزسشصضطظعغفقكلمنهوي';
const normAr=s=>plain(s).replace(/^ال/,'').replace(/[أإآ]/g,'ا').replace(/[ؤئ]/g,'ء');
function buildDict(){
  const src=[...picLessons.flatMap(l=>l.items),...rwLessons.flatMap(l=>l.items),...expLessons.filter(l=>l.kind!=='review').flatMap(l=>l.items),...expLessons.filter(l=>l.own).flatMap(l=>l.own),...quranLessons.flatMap(l=>l.items)];
  const seen=new Map();
  src.forEach(it=>{const p=plain(it.ar);if(p.split(' ').length>3||/[؟?]/.test(p))return;if(!seen.has(p))seen.set(p,it)});
  return [...seen.values()].map(it=>({...it,first:normAr(it.ar)[0]})).sort((a,b)=>{
    const x=normAr(a.ar),y=normAr(b.ar);for(let i=0;i<Math.min(x.length,y.length);i++){const d=ORDER.indexOf(x[i])-ORDER.indexOf(y[i]);if(d)return d}return x.length-y.length});
}

const BOOKS=[
 {id:'quran',title:'Уроци от Корана',ar:'دُرُوسٌ مِنَ الْقُرْآنِ الْكَرِيمِ',ic:'ق',desc:'Рецитиране и тълкуване',lessons:quranLessons},
 {id:'pic',title:'Книга с картини',ar:'كِتَابُ الصُّوَرِ',ic:'ص',desc:'Слушане и разговор',lessons:picLessons},
 {id:'rw',title:'Четене и писане',ar:'الْقِرَاءَةُ وَالْكِتَابَةُ',ic:'ك',desc:'Буквите и първите думи',lessons:rwLessons},
 {id:'exp',title:'Изразяване',ar:'التَّعْبِيرُ',ic:'ع',desc:'Фрази за ежедневни ситуации',lessons:expLessons},
 {id:'hand',title:'Тетрадка по калиграфия',ar:'كُرَّاسَةُ الْخَطِّ',ic:'خ',desc:'Писане на буквите с пръст',lessons:handLessons},
 {id:'dict',title:'Речник на Ниво 1',ar:'مُعْجَمُ كَلِمَاتِ الْمُسْتَوَى الْأَوَّلِ',ic:'م',desc:'Всички думи от курса с търсене',view:'dict'},
 {id:'guide',title:'Как да учим',ar:'دَلِيلُ الْمُتَعَلِّمِ',ic:'د',desc:'Препоръки за реда на учене',view:'guide'}
];
const DICT=buildDict();
const LEVELS=[
 {id:1,name:'Ниво 1',ar:'١',books:BOOKS},
 {id:2,name:'Ниво 2',ar:'٢',books:[]},{id:3,name:'Ниво 3',ar:'٣',books:[]},{id:4,name:'Ниво 4',ar:'٤',books:[]}
];

/* ================= НАПРЕДЪК ================= */
const done=new Set();
/* В Claude се ползва window.storage; при самостоятелно отваряне в браузър — localStorage. */
const PROGRESS_KEY='alif-progress';
async function loadProgress(){
  let raw=null;
  try{if(window.storage){const r=await window.storage.get(PROGRESS_KEY,false);if(r&&r.value)raw=r.value}}catch(e){}
  if(raw==null){try{raw=window.localStorage?localStorage.getItem(PROGRESS_KEY):null}catch(e){}}
  if(raw){try{JSON.parse(raw).forEach(k=>done.add(k))}catch(e){}}
}
async function saveProgress(){
  const raw=JSON.stringify([...done]);let saved=false;
  try{if(window.storage){await window.storage.set(PROGRESS_KEY,raw,false);saved=true}}catch(e){}
  if(!saved){try{if(window.localStorage)localStorage.setItem(PROGRESS_KEY,raw)}catch(e){}}
}
function markDone(k){if(!done.has(k)){done.add(k);saveProgress()}}

/* ================= ЗВУК ================= */
function say(t){try{if(!('speechSynthesis' in window))return;const u=new SpeechSynthesisUtterance(t);u.lang='ar-SA';u.rate=.8;const v=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.startsWith('ar'));if(v)u.voice=v;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
const sayBtn=t=>`<button class="say" data-say="${esc(t)}" aria-label="Чуй">🔊</button>`;
function bindSay(el){el.querySelectorAll('[data-say]').forEach(b=>b.onclick=e=>{e.stopPropagation();say(b.dataset.say)})}

/* ================= ПОМОЩНИ ================= */
const app=document.getElementById('app'),back=document.getElementById('back');
let stack=[];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const key=(b,i)=>b.id+'-'+i;
const isLong=s=>plain(s).length>14;
function bookStats(b){const n=b.lessons?b.lessons.length:0;let d=0;for(let i=0;i<n;i++)if(done.has(key(b,i)))d++;return[d,n]}
function levelStats(lv){let d=0,n=0;lv.books.forEach(b=>{if(b.lessons){const[x,y]=bookStats(b);d+=x;n+=y}});return[d,n]}
function go(v){stack.push(v);render()}
back.onclick=()=>{stack.pop();render()};

function render(){
  const v=stack[stack.length-1];back.hidden=stack.length<=1;window.scrollTo(0,0);
  if(v.t==='home')return home();
  if(v.t==='level')return level(v.l);
  if(v.t==='book')return book(v.l,v.b);
  if(v.t==='lesson')return lesson(v.l,v.b,v.i);
}

function home(){
  app.innerHTML=`<h2>Изберете ниво</h2><p class="sub">Курсът следва книгите от поредицата за обучение по арабски език.</p>
  <div class="levels">${LEVELS.map((lv,i)=>{const locked=!lv.books.length,[d,n]=levelStats(lv);
   return `<button class="level ${locked?'locked':''}" data-i="${i}" ${locked?'aria-disabled="true"':''}><div class="num">${lv.ar}</div><div><b>${lv.name}</b>
   <span>${locked?'Съдържанието предстои':`${d} от ${n} урока завършени`}</span>${locked?'':`<div class="bar"><i style="width:${n?d/n*100:0}%"></i></div>`}</div></button>`}).join('')}</div>`;
  app.querySelectorAll('.level:not(.locked)').forEach(b=>b.onclick=()=>go({t:'level',l:+b.dataset.i}));
}

function level(l){
  const lv=LEVELS[l];
  app.innerHTML=`<h2>${lv.name}</h2><p class="sub">Препоръчителен ред: започнете с Корана и „Книга с картини“, после „Четене и писане“.</p><div class="list">${lv.books.map((b,i)=>{
   if(b.empty)return `<div class="row empty"><div class="ic">؟</div><div><b>${b.title}</b><span>Очаква качване на книгата</span></div></div>`;
   const[d,n]=bookStats(b);
   return `<button class="row" data-i="${i}"><div class="ic">${b.ic}</div><div><b>${b.title}</b><span>${b.desc}${b.view?'':`. ${d} от ${n} урока`}</span></div></button>`}).join('')}</div>`;
  app.querySelectorAll('button.row').forEach(x=>x.onclick=()=>go({t:'book',l,b:+x.dataset.i}));
}

function dictView(lv,b){
  const letters=[...new Set(DICT.map(x=>x.first))];
  app.innerHTML=`<div class="crumbs">${lv.name}</div><h2>${b.title}</h2><div class="h2ar">${b.ar}</div><p class="sub">${DICT.length} думи от всички книги на нивото</p>
   <input id="q" type="search" placeholder="Търсене на български или арабски" style="width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:10px;font:inherit;font-size:15px;margin-bottom:10px">
   <div class="grid" id="ls" style="margin-bottom:14px;grid-template-columns:repeat(auto-fill,minmax(40px,1fr))">${letters.map(L=>`<div style="padding:2px;cursor:pointer" data-l="${L}"><span class="ar" style="font-size:24px">${L}</span></div>`).join('')}</div><div id="res"></div>`;
  const res=app.querySelector('#res'),q=app.querySelector('#q');
  const show=list=>{res.innerHTML=list.length?itemList(list.slice(0,150)):'<div class="note">Няма намерени думи. Опитайте с друга дума или буква.</div>';bindSay(res)};
  q.oninput=()=>{const s=q.value.trim().toLowerCase();if(!s)return show(DICT.filter(x=>x.first===letters[0]));
    const sp=normAr(s);show(DICT.filter(x=>x.bg.toLowerCase().includes(s)||normAr(x.ar).includes(sp)||plain(x.ar).includes(s)))};
  app.querySelectorAll('[data-l]').forEach(d=>d.onclick=()=>{q.value='';show(DICT.filter(x=>x.first===d.dataset.l))});
  show(DICT.filter(x=>x.first===letters[0]));
}

function guideView(lv,b){
  const steps=GUIDE_STEPS;
  app.innerHTML=`<div class="crumbs">${lv.name}</div><h2>${b.title}</h2><p class="sub">Препоръчителен ред, следващ поредицата</p>
   <div class="list">${steps.map(([h,p],i)=>`<div class="row" style="align-items:flex-start;cursor:default"><div class="ic n">${i+1}</div><div><b>${h}</b><span style="font-size:14px">${p}</span></div></div>`).join('')}</div>`;
}

function book(l,bi){
  const lv=LEVELS[l],b=lv.books[bi];let html='',cur=null;
  if(b.view==='dict')return dictView(lv,b);
  if(b.view==='guide')return guideView(lv,b);
  b.lessons.forEach((ls,i)=>{
    if(ls.u!==cur){cur=ls.u;html+=`<div class="unit">${esc(cur)}</div>`}
    const ic=ls.L?`<div class="ic">${ls.L}</div>`:`<div class="ic n">${i+1}</div>`;
    html+=`<button class="row" data-i="${i}">${ic}<div><b>${esc(ls.t)}</b><span class="ar" style="font-size:17px">${ls.ar}</span></div>${done.has(key(b,i))?'<span class="done" aria-label="завършен">✓</span>':''}</button>`;
  });
  app.innerHTML=`<div class="crumbs">${lv.name}</div><h2>${b.title}</h2><div class="h2ar">${b.ar}</div><p class="sub">${b.lessons.length} урока</p><div class="list">${html}</div>`;
  app.querySelectorAll('button.row').forEach(x=>x.onclick=()=>go({t:'lesson',l,b:bi,i:+x.dataset.i}));
}

const T={learn:['learn','Урок'],text:['text','Въпроси'],cards:['cards','Карти'],quiz:['quiz','Тест'],drill:['drill','Упражнения'],write:['write','Писане']};
const tabSet=(...ids)=>ids.map(id=>T[id]);
const TABS={rich:tabSet('learn','text','cards','quiz','drill'),quran:tabSet('learn','text','cards','quiz','drill'),letter:tabSet('learn','text','cards','quiz','drill'),dialog:tabSet('learn','text','cards','quiz','drill'),phrases:tabSet('learn','cards','quiz'),review:tabSet('learn','text','cards','quiz','drill'),hand:tabSet('write','quiz'),handintro:tabSet('write')};
function lessonTabs(ls){return TABS[ls.kind].filter(([id])=>
  id==='drill'?sentPool(ls).length>=2:
  id==='text'?!!(ls.tq&&ls.tq.length):
  id==='learn'&&ls.kind==='review'?!!(ls.reading.length||ls.own.length):true)}

function lesson(l,bi,i){
  const v=stack[stack.length-1],lv=LEVELS[l],b=lv.books[bi],ls=b.lessons[i],tabs=lessonTabs(ls),tab=tabs.some(t=>t[0]===v.tab)?v.tab:tabs[0][0],k=key(b,i);
  app.innerHTML=`<div class="crumbs">${lv.name} › ${b.title}</div><h2>${esc(ls.t)}</h2><div class="h2ar">${ls.ar}</div><p class="sub"></p>
  ${tabs.length>1?`<div class="tabs">${tabs.map(([id,n])=>`<button data-t="${id}" class="${tab===id?'on':''}">${n}</button>`).join('')}</div>`:''}<div id="body"></div>`;
  app.querySelectorAll('.tabs button').forEach(x=>x.onclick=()=>{v.tab=x.dataset.t;render()});
  const body=document.getElementById('body');
  const cardItems=ls.kind==='dialog'?[...ls.lines,...ls.items]:ls.kind==='rich'||ls.kind==='letter'?[...ls.items,...ls.drills]:ls.items;
  if(tab==='learn')learn(body,ls);
  if(tab==='cards')cards(body,cardItems);
  if(tab==='quiz')quiz(body,makeQs(ls,b),k);
  if(tab==='write')write(body,ls,k);
  if(tab==='drill')drill(body,ls,k+'-d');
  if(tab==='text')textQuiz(body,ls,k+'-q');
}

function itemList(items){return `<div class="items">${items.map(it=>`<div class="item"><div class="m"><b>${esc(it.bg)}</b>${it.tr?`<div class="tr">${esc(it.tr)}</div>`:''}</div><div class="w">${it.ar}</div>${sayBtn(it.ar)}</div>`).join('')}</div>`}

function readingBlock(rd){return `<div class="hero" style="text-align:right">${rd.map(x=>`<p class="ar" style="font-size:24px;line-height:1.9;color:var(--ink)">${x.ar}</p>`).join(' ')}
      <details style="text-align:left;margin-top:10px"><summary style="cursor:pointer;color:var(--teal);font-size:14px;font-weight:600">Покажи превода</summary>${rd.map(x=>`<p style="font-size:14px;color:var(--muted);margin-top:6px">${esc(x.bg)}</p>`).join('')}</details>
      <div style="margin-top:8px">${sayBtn(rd.map(x=>x.ar).join(' '))}</div></div>`}

function learn(el,ls){
  let h='';
  if(ls.kind==='letter'){
    const sec=t=>`<div class="unit" style="margin-top:22px">${t}</div>`;
    if(ls.special){h=`<div class="note">${esc(ls.note)}</div>`}
    else{const syl=ls.L==='ء'?['أَ','إِ','أُ','آ','ءَ']:[ls.L+'َ',ls.L+'ِ',ls.L+'ُ',ls.L+'ْ',ls.L+'َا',ls.L+'ِي',ls.L+'ُو'];
      h=`<div class="hero"><div class="big">${ls.L}</div><b>${NAMES[ls.L]}</b><p>Звук: ${esc(ls.snd)}</p>
      <div class="forms">${forms(ls.L).map((f,k)=>`<div><span class="ar">${f}</span><small>${POS[k]}</small></div>`).join('')}</div>
      <div style="margin-top:10px">${sayBtn(ls.L)}</div></div>
      ${NONCON.includes(ls.L)?'<div class="note">Тази буква не се свързва с буквата след нея.</div>':''}${ls.note?`<div class="note">${esc(ls.note)}</div>`:''}
      ${sec('Четете с кратки и дълги гласни')}<div class="syl">${syl.map(x=>`<button class="ar" data-say="${x}">${x}</button>`).join('')}</div>`}
    if(ls.pos){const f=forms(ls.L);[['b',1,'В началото на думата'],['m',2,'В средата на думата'],['e',3,'В края на думата']].forEach(([k,p,t])=>{
        h+=sec(`${t} <span class="ar" style="font-size:22px;color:var(--teal)">${f[p]||f[0]}</span>`)+itemList(ls.pos[k])});
      if(ls.neww.length)h+=sec('Нови думи')+itemList(ls.neww)}
    else h+=sec('Думи от урока')+itemList(ls.items);
    if(ls.drills.length)h+=sec('Слушайте и повторете')+itemList(ls.drills);
    if(ls.pairs.length)h+=sec(ls.cmp?`Сравнете звуците ${ls.L} и ${ls.cmp}`:esc(ls.pq.replace('?','')))+`<div class="pairs">${ls.pairs.map(([a,b])=>
      `<div><span class="ar">${a}</span>${sayBtn(a)}<span class="vs">—</span><span class="ar">${b}</span>${sayBtn(b)}</div>`).join('')}</div>`;
    if(ls.cls.length){const g=t=>ls.cls.filter(w=>(SUN.includes(plain(w)[2])?'s':'m')===t);
      h+=sec('Лунни и слънчеви думи')+`<div class="pairs cols"><div><b>лунна ال</b>${g('m').map(w=>`<span class="ar">${w}</span>`).join('')}</div><div><b>слънчева ال</b>${g('s').map(w=>`<span class="ar">${w}</span>`).join('')}</div></div>`}
    if(ls.ayat.length)h+=sec('От Корана')+`<div class="hero" style="text-align:right;padding:12px 16px">${ls.ayat.map((a,k)=>`<div style="padding:8px 0;${k?'border-top:1px solid var(--line)':''}">
      <div class="ar" style="font-size:26px;line-height:1.9;color:var(--teal)">${a.ar}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left"><span style="font-size:14px;color:var(--muted)">${esc(a.bg)} <i>(${esc(a.ref)})</i></span>${sayBtn(a.ar)}</div></div>`).join('')}</div>`;
    if(ls.reading.length)h+=sec('Текст за четене')+readingBlock(ls.reading);
  }else if(ls.kind==='dialog'){
    h=`<div class="label">Разговор</div><div class="dlg">${ls.lines.map((x,k)=>`<div class="bub ${k%2?'b':'a'}"><span class="ar">${x.ar}</span><small>${esc(x.bg)} ${sayBtn(x.ar)}</small></div>`).join('')}</div>
      <div class="label">Нови думи</div>`+itemList(ls.items);
  }else if(ls.kind==='rich'||ls.kind==='review'){
    const sec=t=>`<div class="unit" style="margin-top:22px">${t}</div>`;
    if(ls.lines.length){let sp=null,side=0;h+=sec('Разговор')+`<div class="dlg">${ls.lines.map(x=>{const m=x.ar.match(/^([^:]{1,30}):\s*/),who=m?m[1]:'';if(who!==sp){sp=who;side^=1}
      return `<div class="bub ${side?'a':'b'}">${who?`<small style="color:var(--gold);font-weight:700;justify-content:flex-end" class="ar">${who}</small>`:''}<span class="ar">${stripSp(x.ar)}</span><small>${esc(x.bg)} ${sayBtn(stripSp(x.ar))}</small></div>`}).join('')}</div>`}
    if(ls.reading.length)h+=sec(ls.kind==='review'?'Текст за четене':'Прочети')+readingBlock(ls.reading);
    if(ls.g)h+=sec('Граматика')+`<div class="note">${esc(ls.g)}</div>`;
    const ws=ls.kind==='review'?ls.own:ls.items;
    if(ws.length)h+=sec(ls.kind==='review'?'Нови думи':'Нови думи и изрази')+itemList(ws);
    if(ls.drills.length)h+=sec('Модели')+itemList(ls.drills);
    if(ls.kind==='review')h+=`<div class="note" style="margin-top:16px">Картите и тестът към този урок преговарят всички думи от темата „${esc(ls.u)}“.</div>`;
  }else if(ls.kind==='quran'){
    h=`<div class="hero" style="text-align:right;padding:16px 18px">${ls.ayat.map((a,k)=>`<div style="padding:10px 0;${k?'border-top:1px solid var(--line)':''}">
      <div class="ar" style="font-size:28px;line-height:1.9;color:var(--teal)">${a.ar} <span style="font-size:20px;color:var(--gold)">﴿${(k+1).toLocaleString('ar-EG')}﴾</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left"><span style="font-size:14px;color:var(--muted)">${esc(a.bg)}</span>${sayBtn(a.ar)}</div></div>`).join('')}</div>
      ${ls.x?ls.x.map(t=>`<div class="note">${esc(t)}</div>`).join(''):''}
      <div class="note" style="border-left-color:var(--line);color:var(--muted)">Преводът е на смисъла и е приблизителен. Гласът на устройството не спазва правилата на таджуид, затова за правилно рецитиране слушайте и запис от кари.</div>
      <div class="label">Нови думи</div>`+itemList(ls.items);
  }else{h=itemList(ls.items)}
  el.innerHTML=h;bindSay(el);
}

function cards(el,items){
  let i=0,open=false;const deck=shuffle(items);
  const draw=()=>{const it=deck[i];
   el.innerHTML=`<button class="card" id="c"><div class="face ${isLong(it.ar)?'long':''}">${it.ar}</div>
    ${open?`<div class="ans">${esc(it.bg)}${it.tr?`<small>${esc(it.tr)}</small>`:''}</div>`:'<div class="hint">Докоснете, за да видите превода</div>'}</button>
    <div class="nav"><button class="btn ghost" id="p">Предишна</button>${sayBtn(it.ar)}<span class="count">${i+1} / ${deck.length}</span><button class="btn" id="n">Следваща</button></div>`;
   el.querySelector('#c').onclick=()=>{open=!open;draw()};
   el.querySelector('#p').onclick=()=>{i=(i-1+deck.length)%deck.length;open=false;draw()};
   el.querySelector('#n').onclick=()=>{i=(i+1)%deck.length;open=false;draw()};bindSay(el)};
  draw();
}

/* ---------- въпроси ---------- */
function pick(pool,ans,field,n=3){return shuffle([...new Set(pool.map(x=>x[field]).filter(v=>v!==ans[field]))]).slice(0,n)}
function makeQs(ls,b){
  const bookPool=b.lessons.flatMap(x=>x.kind==='dialog'?[...x.lines,...x.items]:(x.items||[]));
  let qs=[];
  if(ls.kind==='hand'){
    if(!NONCON.includes(ls.L)){const f=forms(ls.L);[1,2,3].forEach(p=>qs.push({p:'В коя позиция е тази форма?',show:f[p],ar:true,ans:POS[p],opts:POS}))}
    qs.push({p:'Как се казва тази буква?',show:ls.L,ar:true,ans:NAMES[ls.L],opts:[NAMES[ls.L],...shuffle(HAND_LETTERS.filter(x=>x!==ls.L)).slice(0,3).map(x=>NAMES[x])]});
    const others=shuffle(HAND_LETTERS.filter(x=>x!==ls.L)).slice(0,3);
    qs.push({p:'Коя е буквата „'+NAMES[ls.L]+'“?',showBg:'„'+NAMES[ls.L]+'“',ansAr:ls.L,ans:ls.L,opts:[ls.L,...others],optAr:true});
    return qs.map(q=>({...q,opts:shuffle([...new Set(q.opts)])}));
  }
  const items=ls.kind==='dialog'?[...ls.items,...ls.lines]:ls.kind==='rich'?[...ls.items,...ls.drills]:ls.items;
  if(ls.kind==='quran'&&ls.ayat.length>2){
    /* аят, който се повтаря (напр. в сура Ал-Кафирун), няма еднозначен следващ — пропуска се */
    const cnt=t=>ls.ayat.filter(x=>x.ar===t).length;
    shuffle(ls.ayat.slice(0,-1).map((a,k)=>k).filter(k=>cnt(ls.ayat[k].ar)===1)).slice(0,3).forEach(k=>{
      const nxt=ls.ayat[k+1],others=shuffle([...new Set(ls.ayat.filter((x,j)=>j!==k+1&&j!==k&&x.ar!==nxt.ar&&x.ar!==ls.ayat[k].ar).map(x=>x.ar))]).slice(0,3);
      if(others.length)qs.push({p:'Кой аят следва?',show:ls.ayat[k].ar,ar:true,ans:nxt.ar,opts:shuffle([nxt.ar,...others]),optAr:true})});
  }
  if(ls.kind==='letter'&&!ls.special){
    const others=shuffle(RW.map(x=>x.L).filter(x=>x!==ls.L)).slice(0,3);
    qs.push({p:'Как се казва тази буква?',show:ls.L,ar:true,ans:NAMES[ls.L],opts:shuffle([NAMES[ls.L],...others.map(x=>NAMES[x])])});
  }
  shuffle(items).slice(0,9).forEach((it,n)=>{
    const rev=n%2===1;
    if(rev)qs.push({p:'Изберете арабския превод',showBg:it.bg,ans:it.ar,opts:shuffle([it.ar,...pick(bookPool,it,'ar')]),optAr:true});
    else qs.push({p:'Какво означава?',show:it.ar,ar:true,ans:it.bg,opts:shuffle([it.bg,...pick(bookPool,it,'bg')])});
  });
  return qs;
}

function quiz(el,qs,k){
  let n=0,score=0;qs=shuffle(qs);
  const draw=()=>{
    if(n>=qs.length){const pass=score/qs.length>=.7;if(pass)markDone(k);
      el.innerHTML=`<div class="result"><div class="score">${score} / ${qs.length}</div><p>${pass?'Урокът е завършен.':'Нужни са поне 70%, за да завършите урока.'}</p><button class="btn" id="r">Започнете отново</button></div>`;
      el.querySelector('#r').onclick=()=>quiz(el,qs,k);return}
    const q=qs[n],long=q.opts.some(o=>(q.optAr?plain(o):o).length>(q.optAr?12:18));
    el.innerHTML=`<div class="q"><p>Въпрос ${n+1} от ${qs.length}. ${q.p}</p>
     ${q.showBg?`<div class="face bg">${esc(q.showBg)}</div>`:`<div class="face ${isLong(q.show)?'long':''}">${q.show}</div>${sayBtn(q.show)}`}</div>
     <div class="opts ${long?'one':''}">${q.opts.map((o,j)=>`<button class="opt ${q.optAr?'ar':''}" data-j="${j}">${q.optAr?o:esc(o)}</button>`).join('')}</div>`;
    bindSay(el);
    el.querySelectorAll('.opt').forEach(btn=>btn.onclick=()=>{
      const pick=q.opts[+btn.dataset.j];
      el.querySelectorAll('.opt').forEach((x,j)=>{x.disabled=true;if(q.opts[j]===q.ans)x.classList.add('ok')});
      if(pick===q.ans)score++;else btn.classList.add('bad');
      setTimeout(()=>{n++;draw()},900)});
  };draw();
}

/* ---------- писане с пръст ---------- */
/* ---------- упражнения: попълни и подреди ---------- */
const STOP=new Set(['في','من','إلى','على','هل','يا','و','لا','أنا','ما','عن']);
const PUNCT=/[؟?.!،,:«»]/g;
function sentPool(ls){
  if(ls.kind==='quran')return ls.ayat;
  if(ls.kind==='dialog')return ls.lines;
  if(ls.kind==='review')return ls.reading.length?ls.reading:expLessons.filter(x=>x.u===ls.u&&x.kind!=='review').flatMap(sentPool);
  return [...ls.lines.map(x=>({ar:stripSp(x.ar),bg:x.bg})),...ls.drills,...ls.reading];
}
const toks=s=>s.replace(PUNCT,' ').split(/\s+/).filter(Boolean);
/* Упражнения към буквите, както в книгата: „عَيِّنِ الْكَلِمَةَ…“, място на буквата, „رَتِّبِ الْأَحْرُفَ…“, ال шамсия/камария */
function letterDrills(ls){
  const out=[];
  shuffle(ls.pairs).slice(0,3).forEach(([a,b])=>{
    const more=shuffle(ls.pairs.map(p=>p[1]).filter(o=>o!==b)).slice(0,1);
    out.push({type:'choice',p:ls.pq,opts:shuffle([a,b,...more]),ans:a,optAr:true})});
  if(ls.pos){
    shuffle([...ls.pos.b,...ls.pos.m,...ls.pos.e]).slice(0,3).forEach(it=>{const p=letterPos(it.ar,ls.L);
      if(p)out.push({type:'choice',p:`Къде е буквата ${ls.L} в тази дума?`,show:it.ar,sub:it.bg,ans:POS[p],opts:[POS[1],POS[2],POS[3]]})});
    shuffle(ls.items.filter(it=>!/\s/.test(it.ar)&&[...plain(it.ar)].length>=3&&[...plain(it.ar)].length<=6)).slice(0,2)
      .forEach(it=>out.push({type:'order',p:'Подредете буквите в дума',sep:'',x:it,t:[...plain(it.ar)]}));
  }
  shuffle(ls.cls).slice(0,4).forEach(w=>out.push({type:'choice',p:'Каква е ال в тази дума?',show:w,ans:SUN.includes(plain(w)[2])?'слънчева':'лунна',opts:['лунна','слънчева']}));
  return out;
}
function makeDrills(ls){
  const pool=sentPool(ls),extra=ls.kind==='letter'?letterDrills(ls):[];
  const nF=ls.kind==='letter'?3:5,nO=ls.kind==='letter'?2:4;
  const fill=[],order=[];
  if(pool.length>=2){
    const allW=[...new Set(pool.flatMap(x=>toks(x.ar)))];
    shuffle(pool).forEach(x=>{
      const t=toks(x.ar),cand=t.filter(w=>plain(w).length>=3&&!STOP.has(plain(w)));
      if(cand.length&&fill.length<nF){const w=cand[Math.random()*cand.length|0];
        const others=shuffle(allW.filter(o=>plain(o)!==plain(w)&&plain(o).length>=2)).slice(0,3);
        if(others.length>=2)fill.push({type:'fill',x,w,opts:shuffle([w,...others])})}
      if(t.length>=3&&t.length<=7&&order.length<nO)order.push({type:'order',x,t});
    });
  }
  return shuffle([...fill,...order,...extra]);
}
function drill(el,ls,k){
  const qs=makeDrills(ls);
  if(!qs.length){el.innerHTML='<div class="note">За този урок няма достатъчно изречения за упражнения.</div>';return}
  let n=0,score=0;
  const next=ok=>{if(ok)score++;setTimeout(()=>{n++;draw()},ok?900:1600)};
  const draw=()=>{
    if(n>=qs.length){const pass=score/qs.length>=.7;if(pass)markDone(k);
      el.innerHTML=`<div class="result"><div class="score">${score} / ${qs.length}</div><p>${pass?'Браво! Упражненията са изпълнени.':'Опитайте отново, за да затвърдите изреченията.'}</p><button class="btn" id="r">Нови упражнения</button></div>`;
      el.querySelector('#r').onclick=()=>drill(el,ls,k);return}
    const q=qs[n];
    if(q.type==='choice'){
      el.innerHTML=`<div class="q"><p>Упражнение ${n+1} от ${qs.length}. ${esc(q.p)}</p>${q.show?`<div class="face">${q.show}</div>${sayBtn(q.show)}`:''}${q.sub?`<p style="margin-top:6px">${esc(q.sub)}</p>`:''}</div>
       <div class="opts ${q.opts.length===3&&!q.optAr?'one':''}">${q.opts.map((o,j)=>`<button class="opt ${q.optAr?'ar':''}" data-j="${j}">${q.optAr?o:esc(o)}</button>`).join('')}</div>`;
      bindSay(el);
      el.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const ok=q.opts[+b.dataset.j]===q.ans;
        el.querySelectorAll('.opt').forEach((x,j)=>{x.disabled=true;if(q.opts[j]===q.ans)x.classList.add('ok')});if(!ok)b.classList.add('bad');say(q.show||q.ans);next(ok)});
    }else if(q.type==='fill'){
      const shown=q.x.ar.split(q.w).join('<span style="border-bottom:2px solid var(--gold);padding:0 22px;color:transparent">ـــ</span>');
      el.innerHTML=`<div class="q"><p>Упражнение ${n+1} от ${qs.length}. Попълнете липсващата дума</p><div class="face long" style="font-size:30px">${shown}</div><p style="margin-top:8px">${esc(q.x.bg)}</p></div>
       <div class="opts">${q.opts.map((o,j)=>`<button class="opt ar" data-j="${j}">${o}</button>`).join('')}</div>`;
      el.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const ok=q.opts[+b.dataset.j]===q.w;
        el.querySelectorAll('.opt').forEach((x,j)=>{x.disabled=true;if(q.opts[j]===q.w)x.classList.add('ok')});if(!ok)b.classList.add('bad');say(q.x.ar);next(ok)});
    }else{
      let picked=[];const chips=shuffle(q.t.map((w,i)=>({w,i})));
      const paint=()=>{
        el.innerHTML=`<div class="q"><p>Упражнение ${n+1} от ${qs.length}. ${q.p||'Подредете думите в изречение'}</p><p style="font-size:15px;color:var(--ink);margin:6px 0 12px">${esc(q.x.bg)}</p>
         <div class="ar" style="min-height:56px;border:1.5px dashed var(--line);border-radius:12px;padding:8px;display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-start;direction:rtl" id="ans">${picked.map((c,j)=>`<button class="opt ar" style="min-height:0;padding:4px 10px" data-u="${j}">${c.w}</button>`).join('')}</div></div>
         <div class="ar" style="display:flex;flex-wrap:wrap;gap:8px;direction:rtl;justify-content:center">${chips.filter(c=>!picked.includes(c)).map(c=>`<button class="opt ar" style="min-height:0;padding:6px 12px" data-c="${c.i}">${c.w}</button>`).join('')}</div>`;
        el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{picked.push(chips.find(c=>c.i==b.dataset.c));
          if(picked.length===q.t.length){const sp=q.sep??' ',ok=picked.map(c=>plain(c.w)).join(sp)===q.t.map(plain).join(sp);paint();
            const a=el.querySelector('#ans');a.style.borderColor=ok?'var(--ok)':'var(--bad)';a.style.background=ok?'#E6F3EB':'#F8E7E5';
            if(!ok)a.insertAdjacentHTML('afterend',`<p class="ar" style="font-size:22px;color:var(--ok);margin-top:8px">${q.x.ar}</p>`);
            el.querySelectorAll('button').forEach(x=>x.disabled=true);say(q.x.ar);next(ok)}else paint()});
        el.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{picked.splice(+b.dataset.u,1);paint()});
      };paint();
    }
  };draw();
}

/* ---------- въпроси към текста (както „أَجِبْ عَنِ الْأَسْئِلَةِ“ в книгите) ---------- */
function textSource(ls){
  if(ls.reading&&ls.reading.length)return ls.reading;
  if(ls.kind==='dialog')return ls.lines;
  if(ls.kind==='quran')return ls.ayat;
  return ls.items||[];
}
function makeTextQs(ls){return (ls.tq||[]).map(x=>({q:x.q,ans:x.a,opts:shuffle([x.a,...x.w])}))}
function textQuiz(el,ls,k){
  const qs=makeTextQs(ls),src=textSource(ls);
  if(!qs.length){el.innerHTML='<div class="note">Към този урок няма въпроси.</div>';return}
  let n=0,score=0;
  const text=`<details class="txt"><summary>Текстът</summary><div class="ar">${src.map(x=>`<p>${x.ar}</p>`).join('')}</div></details>`;
  const draw=()=>{
    if(n>=qs.length){const pass=score/qs.length>=.7;if(pass)markDone(k);
      el.innerHTML=`<div class="result"><div class="score">${score} / ${qs.length}</div><p>${pass?'Браво! Разбрали сте текста.':'Прочетете текста отново и опитайте пак.'}</p><button class="btn" id="r">Отначало</button></div>`;
      el.querySelector('#r').onclick=()=>textQuiz(el,ls,k);return}
    const q=qs[n];
    el.innerHTML=`<div class="note">Прочетете текста и отговорете на въпросите според него.</div>${text}
     <div class="q"><p>Въпрос ${n+1} от ${qs.length}</p><div class="face long">${q.q}</div>${sayBtn(q.q)}</div>
     <div class="opts one">${q.opts.map((o,j)=>`<button class="opt ar" data-j="${j}">${o}</button>`).join('')}</div>`;
    bindSay(el);
    el.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const ok=q.opts[+b.dataset.j]===q.ans;
      el.querySelectorAll('.opt').forEach((x,j)=>{x.disabled=true;if(q.opts[j]===q.ans)x.classList.add('ok')});
      if(ok)score++;else b.classList.add('bad');
      setTimeout(()=>{n++;draw()},ok?900:1600)});
  };draw();
}

function write(el,ls,k){
  let i=0;const list=ls.trace;
  const intro=ls.kind==='handintro'?`<div class="note">${esc(ls.note)}</div>${ls.t.includes('геометрични')?`<div class="grid" style="margin-bottom:16px">${ALL_LETTERS.map(L=>`<div><span class="ar">${L}</span><small>${NAMES[L]}</small></div>`).join('')}</div>`:''}`:'<div class="note">Проследете сивата буква с пръст или мишка. Пише се отдясно наляво.</div>';
  const draw=()=>{
    el.innerHTML=intro+`<div class="pad"><canvas id="cv"></canvas><div class="padbar"><button class="btn ghost" id="clr">Изчисти</button><span>${i+1} / ${list.length}</span>${sayBtn(list[i])}</div></div>
     <div class="nav"><button class="btn ghost" id="p">Предишна</button><button class="btn" id="n">${i===list.length-1?'Готово':'Следваща'}</button></div>`;
    bindSay(el);
    const cv=el.querySelector('#cv'),dpr=window.devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;
    cv.width=w*dpr;cv.height=h*dpr;const c=cv.getContext('2d');c.scale(dpr,dpr);
    const guide=()=>{c.clearRect(0,0,w,h);c.strokeStyle='#E6EBE9';c.lineWidth=1;c.beginPath();c.moveTo(16,h*.68);c.lineTo(w-16,h*.68);c.stroke();
      const txt=list[i],size=plain(txt).length>3?Math.min(h*.5,w/(plain(txt).length*.75)):h*.62;
      c.font=`${size}px Amiri, 'Noto Naskh Arabic', serif`;c.fillStyle='#D3E2DE';c.textAlign='center';c.direction='rtl';c.fillText(txt,w/2,h*.68)};
    guide();document.fonts&&document.fonts.ready.then(guide);
    let drawing=false;
    const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
    cv.onpointerdown=e=>{drawing=true;cv.setPointerCapture(e.pointerId);const[x,y]=pos(e);c.beginPath();c.moveTo(x,y);c.strokeStyle='#0E5E57';c.lineWidth=7;c.lineCap='round';c.lineJoin='round'};
    cv.onpointermove=e=>{if(!drawing)return;const[x,y]=pos(e);c.lineTo(x,y);c.stroke()};
    cv.onpointerup=cv.onpointercancel=()=>{drawing=false};
    el.querySelector('#clr').onclick=guide;
    el.querySelector('#p').onclick=()=>{if(i>0){i--;draw()}};
    el.querySelector('#n').onclick=()=>{if(i<list.length-1){i++;draw()}else{markDone(k);el.innerHTML=`<div class="result"><div class="score">✓</div><p>Упражнението по писане е завършено.</p><button class="btn" id="r">Отново</button></div>`;el.querySelector('#r').onclick=()=>write(el,ls,k)}};
  };draw();
}

stack=[{t:'home'}];
loadProgress().then(render);
if('speechSynthesis' in window)speechSynthesis.getVoices();
