/* Проверка: node test.cjs
   Зарежда level1.js и app.js както браузърът (общ глобален обхват) и проверява съдържанието и упражненията. */
const fs=require('fs'),vm=require('vm');
const el=()=>({innerHTML:'',hidden:false,onclick:null,style:{},querySelector:()=>el(),querySelectorAll:()=>[],insertAdjacentHTML(){}});
const store={};
const ctx={console,setTimeout,Math,JSON,
  document:{getElementById:()=>el(),fonts:null},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)}},
};
ctx.window=ctx;ctx.window.scrollTo=()=>{};
vm.createContext(ctx);
for(const f of ['level1.js','app.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+f,'utf8'),ctx,{filename:f});
const R=src=>vm.runInContext(src,ctx);

let errors=0,checks=0;
const err=m=>{errors++;if(errors<=60)console.log('ГРЕШКА:',m)};
const ok=(c,m)=>{checks++;if(!c)err(m)};

const BOOKS=R('BOOKS'),plain=R('plain');
const DIAC=/[ً-ْٰ]/;
// дума без огласовка (позволени: къси служебни думи и думи само с дълги гласни)
const bare=s=>s.replace(/[؟?.!،,:«»()]/g,' ').split(/\s+/).filter(w=>w&&/[ء-ي]/.test(w)&&!DIAC.test(w)&&plain(w).length>2);

for(const b of BOOKS){if(!b.lessons)continue;
  b.lessons.forEach((ls,i)=>{
    const where=`${b.id} #${i+1} „${ls.t}“`;
    // 1) тест (makeQs) — многократно, защото е случаен
    if(R('TABS')[ls.kind].some(t=>t[0]==='quiz'))for(let r=0;r<25;r++){
      const qs=R('makeQs')(ls,b);
      ok(qs.length>0,where+': тестът е празен');
      qs.forEach(q=>{ok(q.opts.includes(q.ans),where+': верният отговор липсва сред вариантите: '+q.ans);
        ok(new Set(q.opts).size===q.opts.length,where+': повтарящи се варианти');
        ok(q.opts.length>=2,where+': по-малко от 2 варианта')})}
    // 2) упражнения (makeDrills)
    if(R('lessonTabs')(ls).some(t=>t[0]==='drill'))for(let r=0;r<25;r++){
      R('makeDrills')(ls).forEach(q=>{
        if(q.type==='fill'){ok(q.opts.includes(q.w),where+': липсващата дума не е сред вариантите');ok(q.x.ar.includes(q.w),where+': думата не е в изречението')}
        else if(q.type==='choice')ok(q.opts.includes(q.ans),where+': верният отговор липсва сред вариантите')
        else ok(q.t.length>=3,where+': твърде кратко за подреждане')})}
    // 3) въпроси към текста
    (ls.tq||[]).forEach(x=>{const where2=where+' въпрос „'+x.q+'“';
      ok(x.q&&x.a&&x.w.length===2,where2+': трябват въпрос, верен и 2 грешни отговора');
      ok(new Set([x.a,...x.w]).size===3,where2+': повтарящи се отговори');
      [x.q,x.a,...x.w].forEach(s=>ok(!bare(s).length,where2+': дума без огласовка: '+bare(s).join(' ')))});
    R('makeTextQs')(ls).forEach(q=>ok(q.opts.includes(q.ans),where+': верният отговор липсва (въпроси към текста)'));
    // 4) формат на думите
    (ls.items||[]).forEach(it=>{ok(it.ar&&it.bg,where+': дума без арабски текст или превод')});
  });
}
// 5) всеки текст за четене в „Изразяване“ има въпроси
R('expLessons').forEach((l,i)=>{if(l.reading.length)ok(l.tq.length>=3,`exp #${i+1}: текстът няма поне 3 въпроса`)});
// 6) напредък: localStorage при липса на window.storage
R('done.add("t-1");saveProgress()');
ok(store['alif-progress']&&JSON.parse(store['alif-progress']).includes('t-1'),'напредъкът не се записва в localStorage');
// 8) „Четене и писане“: думите са в правилната колона, двойките и упражненията към буквите
const POSN={b:1,m:2,e:3};
R('rwLessons').forEach((ls,i)=>{const where=`rw #${i+1} „${ls.t}“`;
  if(ls.pos)for(const k of ['b','m','e']){ok(ls.pos[k].length>=3,where+': под 3 думи в колона '+k);
    ls.pos[k].forEach(it=>ok(R('letterPos')(it.ar,ls.L)===POSN[k],where+`: „${it.ar}“ не е с буквата в позиция ${k}`))}
  if(!ls.special)ls.pairs.forEach(([a,b])=>{const has=w=>[...plain(w)].some(c=>R('hasL')(c,ls.L));
    ok(has(a)&&!has(b),where+`: двойката ${a} / ${b} е сгрешена`)});
  ok(ls.drills.length>=4,where+': под 4 изречения');ok(ls.reading.length>=3,where+': няма текст за четене');
  ls.ayat.forEach(a=>ok(a.ar&&a.bg&&a.ref&&!a.ar.includes('Q['),where+': непълен аят'));
  const all=[...ls.items.map(x=>x.ar),...ls.drills.map(x=>x.ar),...ls.reading.map(x=>x.ar),...ls.cls];
  all.forEach(s=>ok(!bare(s).length,where+': дума без огласовка: '+bare(s).join(' ')));
  for(let r=0;r<25;r++)R('letterDrills')(ls).forEach(q=>{
    if(q.type==='choice')ok(q.opts.includes(q.ans)&&new Set(q.opts).size===q.opts.length,where+': упражнение без верен/с повтарящ се отговор');
    else ok(q.t.join('')===plain(q.x.ar),where+': буквите не дават думата')});
});
ok(R('rwLessons').length===32,'„Четене и писане“ трябва да има 32 урока');
// 7) речник
ok(R('DICT').length>100,'речникът е твърде малък');

console.log(`\nПроверки: ${checks}, грешки: ${errors}`);
process.exit(errors?1:0);
