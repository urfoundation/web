/* UR stats dashboard: the page (tabs, panels, charts). Runs after engine.js, once window.SNAP is set.
   Its words are the copy engine.js reads from window.UR_I18N: UR.TX (unit dashboard/script) and UR.PG (unit dashboard).
   SNAP can lack a part (a read failed, timed out or hasn't answered): each panel checks what it is drawn from
   (UR.need) and shows a note in its place without it. What depends on the data alone is a UR.part, and what depends on
   the period too a UR.onChange: both are drawn again when more data arrives (UR.refresh). */
(function(){
const {$,$$,nf,cpt,fmtD,fmtDw,esc,EN,TX,PG}=UR;
const T={grid:'rgba(255,255,255,.06)',text:'#7E7E88',strong:'#FAFAFA',cross:'rgba(255,255,255,.22)',surface:'#111113',font:"'PP Neue Montreal',Helvetica,Arial,sans-serif"};
const tbF=v=>v==null?'—':UR.un(v,v>=100?0:v>=10?1:2,'TB');
// the Overview's data carried figure: the same, with the unit's narrow form where UR.NARROW_CARD (ت.ب in Arabic)
const tbCard=v=>v==null?'—':UR.un(v,v>=100?0:v>=10?1:2,'TB',UR.NARROW_CARD);
const gbs=v=>v==null?'—':UR.un(v,2,'Gb/s');
const BAR='rgba(237,143,255,.26)',BAR_HI='#ED8FFF',ALT='#D6E6F4',AVG='#F7C8FF';
UR.THEME={acc:'#ED8FFF',rgb:'237,143,255',alt:'#D6E6F4',tint:'#161616'};document.body.dataset.accent='pink';
const plab=()=>UR.PERIODS[UR.P].lab;
const arrow=d=>d>0?'↑':d<0?'↓':'', cls=d=>d>0.05?'up':d<-0.05?'dn':'fl';
// a change, or nothing when history doesn't reach back a full period
const dl=(el,cur,prev,lab)=>{if(cur==null||!isFinite(cur)){el.innerHTML='';return}if(prev==null||!isFinite(prev)||prev===0){el.innerHTML='<b class="fl">—</b>'+esc(TX.change.notEnough);return}const d=UR.pct(cur,prev),vs=esc(lab||UR.f(TX.change.vsPrevious,{period:plab()}));if(Math.abs(d)<0.05){el.innerHTML=`<b class="fl">${esc(TX.change.none)}</b>${vs}`;return}el.innerHTML=`<b class="${cls(d)}">${arrow(d)} ${UR.pc(Math.abs(d),1)}</b>${vs}`};
const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
const html=(id,v)=>{const e=$(id);if(e)e.innerHTML=v};
const SUM=new Set(['traffic','newNets']),MEAN=new Set(['providers','throughput','conn','devices']);
const SER=(k,P)=>UR.series(k,SUM.has(k)?'sum':MEAN.has(k)?'mean':'last',P);
const L=UR.LIVE,K=UR.TOKEN,EP=UR.EP,S=window.SNAP;
const when=t=>UR.fmtWhen(t);
// a series with a figure in it; a panel's data (UR.need); the chain's, which shimmer while its first read is on its way
const any=a=>!!a&&a.some(v=>v!=null),need=UR.need;
// (the chain's own note while nothing from it has arrived; beside a part that did, the page's)
const chainDown=()=>!S.RESERVE&&!S.EXTRA.conviction;
const onChain=(el,ok,read)=>need(el,ok,{chain:chainDown(),wait:!ok&&(S.PENDING||[]).includes(read)});
$$('#snap-at,.snap-at').forEach(e=>e.textContent=UR.f(TX.time.local,{time:when(UR.NOW)}));
set('#foot-tz',UR.TZ==='utc'?TX.time.zoneUtc:(z=>z?UR.f(TX.time.zone,{zone:z}):TX.time.zoneUnknown)(UR.tzName()));

/* ---------- sections and controls ---------- */
const PAGES={overview:[PG.heading,''],
  network:[PG.nav.network,PG.ledes.network],
  providers:[PG.nav.providers,PG.ledes.providers],
  subnet:['SN25',PG.ledes.subnet],
  more:[PG.nav.more,PG.ledes.more],
  method:[PG.nav.method,PG.ledes.method]};
// each tab opens on its own default period until the viewer picks one (Network is the macro view: 90D)
const DEFP={network:90};
// the counter beside the Overview's h1, while there is data carried to count
let tab='overview';const liveShown=()=>{$('#h1live').hidden=tab!=='overview'||!UR.BPS};
function show(p,user){if(!Object.hasOwn(PAGES,p))p='overview';{const nv=$('.nav'),b=$(`.nav button[data-t="${p}"]`);if(nv&&b&&nv.scrollWidth>nv.clientWidth){if(getComputedStyle(nv).direction==='rtl'){const r=b.getBoundingClientRect(),q=nv.getBoundingClientRect();nv.scrollLeft+=r.left+r.width/2-q.left-q.width/2}else nv.scrollLeft=b.offsetLeft-(nv.clientWidth-b.offsetWidth)/2}}const dp=Object.hasOwn(DEFP,p)?DEFP[p]:7;if(!UR.picked&&UR.P!==dp)UR.setP(dp);if(UR.closeChart)UR.closeChart(true);
  tab=p;$$('.nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.t===p));
  $$('section[data-tab]').forEach(s=>s.hidden=s.dataset.tab!==p);
  set('#h1',PAGES[p][0]);set('#lede',PAGES[p][1]);$('#lede').hidden=!PAGES[p][1];
  $('#livewrap').hidden=true;$('#nowroute').hidden=p!=='network';liveShown();$('#pbar').hidden=p==='method'||p==='subnet';$('#orgbar').hidden=true;
  if(location.hash!=='#'+p)history[user?'pushState':'replaceState'](null,'','#'+p);UR.hideTip();if(user)$('#h1').focus({preventScroll:true});
  const sec=$(`section[data-tab="${p}"]`);requestAnimationFrame(()=>{sec.querySelectorAll('*').forEach(e=>{if(e._draw)UR.run(e._draw)});liveFade()})}
UR.part(liveShown);
$$('.nav button').forEach(b=>b.addEventListener('click',()=>{show(b.dataset.t,true);scrollTo({top:0})}));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>{show(b.dataset.go,true);scrollTo({top:0})}));
addEventListener('popstate',()=>show((location.hash||'').slice(1)||'overview'));
$$('#period button').forEach(b=>b.addEventListener('click',()=>{UR.picked=true;UR.setP(+b.dataset.p)}));
new IntersectionObserver(([e])=>$('#pbar').classList.toggle('stuck',!e.isIntersecting)).observe($('#pb-sent'));
const liveFade=()=>{const b=$('#livebar');$('#livewrap').classList.toggle('fade',b.scrollWidth-b.clientWidth-b.scrollLeft>4)};
$('#livebar').addEventListener('scroll',liveFade);addEventListener('resize',liveFade);
UR.onChange(()=>{
  $$('#period button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.p===UR.P));
  $$('.plab').forEach(e=>e.textContent=plab());
  html('#win',`<b>${esc(UR.P<=3?UR.f(TX.lastPeriod,{period:plab()}):UR.f(TX.time.days,{from:fmtD(UR.END-(UR.P-1)*UR.DAY),to:fmtD(UR.END)}))}</b>`)});

/* ---------- right now ---------- */
UR.part(()=>{set('#lv-prov',nf(L.providers));set('#lv-users',nf(L.users24));
  const h24=UR.Hs.traffic.slice(-24).filter(v=>v!=null).reduce((a,b)=>a+b,0);set('#lv-data',tbF(h24));
  html('#lv-px',`${UR.usd(K.usd)} <em style="color:var(--muted)">${esc(UR.f(TX.overview.change24h,{change:UR.signed(K.d24)}))}</em>`)});
UR.liveCounter($('#live'));UR.liveCounter($('#nr-live'));
/* ---------- OVERVIEW ---------- */
const cs=UR.COUNTRIES,share=k=>cs.slice(0,k).reduce((a,c)=>a+c.v,0)/UR.PROV*100;
// networks added over the last P days (or 1D/3D hours), from the running total: end of window minus end of the window before
function netsAdded(P,off=0){const h=P<=3,a=h?UR.Hs.nets:UR.D.nets,n=h?P*24:P,L0=a.length,at=i=>{for(let j=Math.min(i,L0-1);j>=0;j--)if(a[j]!=null)return a[j];return null};
  const ei=L0-1-off*n,si=ei-n;if(si<0&&off>0)return null;const end=at(ei),start=si<0?a.find(x=>x!=null):at(si);return end==null||start==null?null:{start,end,added:end-start}}
// daily users over P days = the average of each day's 24-hour count; for 1D that is the last 24 hours
const dailyUsers=P=>{if(P>3)return UR.series('users24','mean');const h=UR.Hs.users24,n=h.length;
  const avg=k=>{const a=[];for(let i=0;i<P;i++){const v=h[n-1-(k+i)*24];if(v!=null)a.push(v)}return a.length?a.reduce((x,y)=>x+y,0)/a.length:null};return{total:avg(0),prevTotal:avg(P)}};
// the latest point of a gauge (the chart's last bucket) and the same point one period earlier
const latest=(k,agg,P)=>{const h=P<=3,src=h?UR.Hs[k]:UR.D[k],b=h?UR.PERIODS[P].bucket:1,off=h?P*24:P;
  const red=e=>{if(e<0)return null;const a=src.slice(Math.max(0,e-b+1),e+1).filter(v=>v!=null);return a.length?(agg==='mean'?a.reduce((x,y)=>x+y,0)/a.length:a[a.length-1]):null};
  let e=src.length-1;while(e>=0&&red(e)==null)e--;return{cur:red(e),prev:red(e-off)}};
const avgLab=P=>TX.periodAverage['d'+P];
// live values: users in the last 24 hours, providers online now (stats feed), data carried in the last 24 hours
const s24=x=>{const h=UR.Hs.traffic;if(x<23)return null;const a=h.slice(x-23,x+1).filter(v=>v!=null);return a.length?a.reduce((p,q)=>p+q,0):null};
// (the data carried only while its 24 hours end in the last hours: without panel 1's sums the last 72 are empty, and
// an older 24 hours is not the last)
const NOWV=()=>{const h=UR.Hs.traffic;let e=h.length-1;while(e>=0&&h[e]==null)e--;return{users:L.users24,prov:L.providers,data:e>=h.length-3?s24(e):null}};
// the point that ends a chart on the card's live value (daily charts; providers always, as its hourly series is an average)
const nowPt=k=>{const P=UR.P,v=NOWV(),t=Date.now();if(k==='providers')return{t,v:v.prov,lab:TX.chart.nowOnline};if(P<=3)return null;
  if(k==='users24')return{t,v:v.users,lab:TX.chart.nowLast24};if(k==='traffic')return{t,v:v.data,lab:TX.chart.nowLast24};return null};
let picked=null;
UR.onChange(()=>{
  const P=UR.P,tr=SER('traffic'),ago=P===1?TX.change.vsDayAgo:UR.f(TX.change.vsAgo,{period:plab()});
  // the cards show the live value (the same as the point that ends each chart), against the same value one period earlier
  const nw=NOWV(),back=(k,hv)=>{if(P<=3){const h=UR.Hs[k];let e=h.length-1;while(e>=0&&h[e]==null)e--;return hv?hv(e-P*24):h[e-P*24]??null}const d=UR.D[k];return d[d.length-P]??null};
  const bk=UR.bucketKey();
  // each card: its live figure and its chart over the period, or, with neither, the card's note
  if(need($('#o-data'),nw.data!=null||any(tr.v))){
    set('#o-data',tbCard(nw.data));dl($('#o-data-d'),nw.data,P<=3?back('traffic',s24):back('traffic'),ago);
    set('#o-data-k',nw.data==null?'':TX.overview.last24);
    html('#o-data-s',tr.total==null?'':`${P>1?`${UR.h(TX.periodTotal['d'+P],{value:`<b>${tbF(tr.total)}</b>`})}<br>${UR.h(TX.overview.aDayOnAverage,{value:`<b>${tbF(tr.total/P)}</b>`})}<br>`:''}${UR.h(TX.overview.onAverage,{value:`<b>${gbs(tr.total*8e12/(P*86400)/1e9)}</b>`})}`)}
  if(need($('#o-users'),nw.users!=null||any(SER('users24').v))){
    const um=dailyUsers(P);set('#o-users',nf(nw.users));dl($('#o-users-d'),nw.users,back('users24'),ago);
    set('#o-users-k',nw.users==null?'':TX.overview.last24);
    html('#o-users-s',P===1||um.total==null?'':UR.h(TX.overview.labelValue,{label:esc(avgLab(P)),value:`<b>${nf(Math.round(um.total))}</b>`}))}
  const po=SER('providers');
  if(need($('#o-prov'),nw.prov!=null||any(po.v))){
    const ph=Math.round(Math.max(...po.v.filter(v=>v!=null)));
    set('#o-prov',nf(nw.prov));dl($('#o-prov-d'),nw.prov,back('providers'),ago);
    set('#o-prov-k',L.countries==null?'':UR.f(UR.pl(TX.overview.onlineInCountries,L.countries),{count:EN?L.countries:nf(L.countries)}));
    html('#o-prov-s',po.total==null?'':`${UR.h(TX.overview.labelValue,{label:esc(avgLab(P)),value:`<b>${nf(Math.round(po.total))}</b>`})}${ph>nw.prov?`<br>${UR.h(TX.overview.highest[bk],{value:`<b>${nf(ph)}</b>`})}`:''}`)}
  const na=netsAdded(P);
  if(need($('#o-nets'),L.nets!=null||na)){set('#o-nets',cpt(L.nets));html('#o-nets-d',na?`<b class="up">+${nf(Math.round(na.added))}</b>${esc(UR.f(TX.overview.newInLast,{period:plab()}))}`:'')}
  drawPick();
});
function drawPick(){const c=cs.find(x=>x.c===picked);
  if(!c){html('#c-pick',`<p class="note" style="margin:0;text-align:center">${esc(TX.country.prompt)}</p>`);return}
  const rank=cs.indexOf(c)+1,sh=c.v/UR.PROV*100,ct=(UR.CONTINENTS.find(x=>x[0]===c.ct)||[,''])[1];
  html('#c-pick',`<div class="pick-h"><h3>${c.n}<span>${esc(UR.f(TX.country.rank,{continent:ct,rank,total:cs.length}))}</span></h3><button class="xp" id="c-clear" aria-label="${esc(UR.f(TX.country.clear,{name:c.n}))}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div><div class="pk-figs"><div class="fig"><span class="k">${esc(PG.titles.providersOnline)}</span><span class="v">${nf(c.v)}</span></div><div class="fig"><span class="k">${esc(TX.country.shareOfAllProviders)}</span><span class="v">${UR.pc(sh,sh<0.1?2:1)}</span></div></div>`);
  $('#c-clear').addEventListener('click',()=>pick(null))}
const pick=c=>{const k=c&&(c.c||c);picked=k&&k!==picked?k:null;drawPick()};
// country search: exact names and common aliases pick as you type; Enter also takes a unique partial match; otherwise say so
const normC=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^the\s+/,'').replace(/\s+/g,' ').trim();
const ALIAS={usa:'US',us:'US',america:'US','united states of america':'US',uk:'GB',britain:'GB','great britain':'GB',england:'GB',turkey:'TR',turkiye:'TR',korea:'KR','republic of korea':'KR','czech republic':'CZ',holland:'NL',netherlands:'NL',uae:'AE','viet nam':'VN',russia:'RU'};
function findCountry(q,partial){const k=normC(q);if(!k)return{c:null};if(ALIAS[k])return{c:cs.find(c=>c.c===ALIAS[k])||null};const ex=cs.find(c=>normC(c.n)===k||c.c.toLowerCase()===k||(c.en&&normC(c.en)===k));if(ex||!partial)return{c:ex||null};
  const st=cs.filter(c=>normC(c.n).startsWith(k)),inc=st.length?st:cs.filter(c=>normC(c.n).includes(k));return inc.length===1?{c:inc[0]}:{c:null,many:inc.length>1}}
function searchBox(inp,msg,onPick){const run=partial=>{const q=inp.value,r=findCountry(q,partial);if(r.c){msg.textContent='';onPick(r.c);inp.blur();return}
    if(partial&&q.trim())msg.textContent=r.many?TX.country.several:UR.f(TX.country.none,{query:q.trim().slice(0,60)});else if(!q.trim())msg.textContent=''};
  inp.addEventListener('input',()=>run(false));inp.addEventListener('change',()=>run(true));inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run(true)}})}
searchBox($('#c-search'),$('#c-search-m'),c=>{picked=c.c;drawPick();const g=$('#globe');if(g._focus)g._focus(c)});
// the globe's card: the countries with providers online now (Grafana's panel 33), with the counts of countries and cities
UR.part(()=>{if(!need($('#c-reg'),cs.length))return;
  set('#c-ctry',L.countries??'—');set('#c-city',nf(L.cities));
  html('#c-list',cs.map(c=>`<option value="${c.n}">`).join(''));
  set('#c-conc',UR.f(TX.country.top3,{share:UR.pc(share(3),0)}));
  const regTot=UR.CONTINENTS.map(([k,n])=>[n,cs.filter(c=>c.ct===k).reduce((a,c)=>a+c.v,0)]).sort((a,b)=>b[1]-a[1]);
  html('#c-reg',regTot.map(([n,v])=>`<div class="r"><span>${esc(n)}</span><b>${UR.pc(v/UR.PROV*100,1)}</b><span class="tr"><i style="width:${(v/regTot[0][1]*100).toFixed(1)}%"></i></span></div>`).join(''))});
const uLab=()=>UR.P>3?PG.titles.users:TX.chart.usersToThen;
const mini=(id,k,kind,fmt,name,zero)=>UR.chart($(id),()=>{const s=SER(k),nm=typeof name==='function'?name():name;return{t:s.t,series:[{v:s.v,kind,color:kind==='col'?BAR:BAR_HI,name:nm,fmt}],hiLast:BAR_HI,now:nowPt(k),zero:zero??kind==='col',T,height:70,ml:0,noX:true,yFmt:()=>'',label:nm}});
mini('#o-data-c','traffic','col',tbF,TX.chart.carried);
mini('#o-users-c','users24','area',nf,uLab,false);
mini('#o-prov-c','providers','area',nf,TX.chart.onlineAverage,false);
mini('#o-nets-c','nets','area',nf,TX.chart.networksAllTime,false);
const trafficCfg=h=>{const s=SER('traffic'),daily=UR.P>3;const ser=[{v:s.v,kind:'col',color:BAR,name:TX.chart.carriedPer[UR.bucketKey()],fmt:tbF}];
  if(daily){const n=s.v.length,full=UR.D.traffic,Ln=full.length;ser.push({v:s.v.map((_,i)=>{const j=Ln-n+i;const w=full.slice(Math.max(0,j-6),j+1).filter(v=>v!=null);return w.length?w.reduce((a,b)=>a+b,0)/w.length:null}),kind:'line',color:AVG,name:TX.chart.sevenDayAverage,fmt:tbF})}
  return{t:s.t,series:ser,hiLast:BAR_HI,now:nowPt('traffic'),T,height:h,endLabel:daily,unit:'TB',label:PG.titles.dataCarried}};
const bigTraffic=(el,h)=>UR.chart(el,()=>trafficCfg(h));
UR.part(()=>{set('#rt-u',nf(L.users24));set('#rt-p',nf(L.providers));set('#rt-c',L.countries??'—')});
new IntersectionObserver(([e])=>{if(e.isIntersecting){const r=$('.route');r.classList.remove('play');void r.offsetWidth;r.classList.add('play')}},{threshold:.5}).observe($('.route'));
UR.onChange(()=>need($('#o-big'),any(SER('traffic').v)));
bigTraffic($('#o-big'),250);
const cumCfg=h=>{const t=UR.D.traffic,f=t.findIndex(v=>v!=null);let c=0;const cum=t.map(v=>v==null?null:(c+=v));return{t:UR.dayT.slice(f),series:[{v:cum.slice(f),kind:'area',color:BAR_HI,name:TX.chart.totalCarried,fmt:tbF}],T,height:h,ml:48,unit:'TB',xFmt:fmtD,tipX:fmtDw,endLabel:h>200,label:PG.titles.totalDataCarried}};
UR.part(()=>{const t=UR.D.traffic,f=t.findIndex(v=>v!=null);if(!need($('#o-cum'),f>=0))return;let c=0;t.forEach(v=>{if(v!=null)c+=v});
  set('#o-cum',tbF(c));html('#o-cum-s',esc(UR.f(TX.change.since,{date:fmtD(UR.dayT[f])})))});
UR.chart($('#o-cum-c'),()=>cumCfg(236));
{const area=(k,name,fmt,label,ml,ref)=>()=>{const s=SER(k);return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:typeof name==='function'?name():name,fmt}],zero:false,trim:true,T,height:380,endLabel:true,ml:ml||56,label,ref:ref&&ref(),now:nowPt(k)}};
  const CM={users:[PG.titles.dailyUsers,plab,area('users24',uLab,nf,PG.titles.dailyUsers,undefined,()=>UR.P===1?null:{v:dailyUsers(UR.P).total,label:avgLab(UR.P)})],prov:[PG.titles.providersOnline,plab,area('providers',TX.chart.onlineAverage,v=>nf(Math.round(v)),PG.titles.providersOnline,undefined,()=>({v:SER('providers').total,label:avgLab(UR.P)}))],
    data:[PG.titles.dataCarried,plab,()=>trafficCfg(380)],nets:[PG.titles.totalNetworks,plab,area('nets',TX.chart.networksAllTime,nf,PG.titles.totalNetworks,64)],cum:[PG.titles.totalDataCarried,()=>TX.chart.allRecorded,()=>cumCfg(380)]};
  let cm=null,opener=null;const box=$('#cmodal');
  const named=()=>typeof cm==='string';
  UR.chart($('#cm-chart'),()=>!cm?{t:[0],series:[],T}:named()?CM[cm][2]():(g=>({...g,height:380,noX:false,...(g.ml===0?{ml:56,yFmt:undefined}:{})}))(cm._get()));
  const head=()=>{if(!cm)return;const pn=named()?null:cm.closest('.pn'),chip=pn&&pn.querySelector('.ph .chip:not(.plab)');
    // a chart whose chip names its own span (the running total's "Since …") keeps it, without the period buttons
    const fixed=named()?cm==='cum':!pn.querySelector('.ph .plab')&&!!chip&&chip.matches('#n-cum-s');
    set('#cm-title',named()?CM[cm][0]:pn.querySelector('.pt').textContent);$('#cm-period').hidden=fixed;$('#cm-chip').hidden=!fixed;set('#cm-chip',named()?TX.chart.allRecorded:chip?chip.textContent:'');
    $$('#cm-period button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.p===UR.P));queueMicrotask(()=>{if(cm)html('#cm-leg',named()?(cm==='data'?$('#o-big-leg').innerHTML:''):((pn.querySelector('.legend')||{}).innerHTML||''))})};
  const open=(k,src)=>{if(document.body.classList.contains('is-error')||document.body.classList.contains('is-loading'))return;cm=k;opener=src;box.hidden=false;head();$('#cm-chart')._draw();$('#cm-x').focus()};UR.openChart=open;
  const close=quiet=>{if(box.hidden)return;box.hidden=true;cm=null;UR.hideTip();if(opener&&!quiet)opener.focus()};UR.closeChart=close;
  $$('[data-cm]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.cm,b.closest('.pn').querySelector('.xp'))));
  $$('#cm-period button').forEach(b=>b.addEventListener('click',()=>{UR.picked=true;UR.setP(+b.dataset.p)}));
  $('#cm-x').addEventListener('click',close);box.addEventListener('click',e=>{if(e.target===box)close()});
  addEventListener('keydown',e=>{if(box.hidden)return;if(e.key==='Escape'){close();return}
    if(e.key==='Tab'){const f=[...box.querySelectorAll('button:not([hidden]),[tabindex="0"]')].filter(x=>x.offsetParent);if(!f.length)return;const a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}else if(!box.contains(document.activeElement)){e.preventDefault();a.focus()}}});
  UR.onChange(head)}
UR.onChange(()=>{const daily=UR.P>3;const leg=`<span><i class="bar" style="background:${BAR}"></i>${esc(TX.chart.legendPer[UR.bucketKey()])}</span>`+(daily?`<span><i style="background:${AVG}"></i>${esc(TX.chart.sevenDayAverage)}</span>`:`<span><i class="bar" style="background:${BAR_HI}"></i>${esc(TX.chart.latest)}</span>`);html('#o-big-leg',leg);html('#n-leg',leg)});
UR.globe($('#globe'),{scale:.41,onPick:c=>pick(c),picked:()=>picked});
// the SN25 card: the alpha price is the stats feed's; its price in TAO, the reserve and what flows into it a day (the
// subnet's emission by its routing) and the alpha locked are read from Bittensor mainnet: blank under one note (#s-na)
// while the page can't reach it, shimmering while its first read is on its way
UR.part(()=>{const RS=UR.RESERVE,C=S.EXTRA.conviction,pend=k=>(S.PENDING||[]).includes(k),rw=!RS&&pend('reserve'),cw=!C&&pend('conviction');
  set('#s-px',UR.usd(K.usd));set('#s-px-d',RS&&K.tao!=null?`τ${UR.fx(K.tao,5)}`:'');
  set('#s-res',RS?UR.alpha(RS.alpha):rw?'':'—');set('#s-res-d',RS?UR.f(TX.overview.alphaPerDay,{value:nf(RS.inflow)}):'');
  set('#s-lock',C?nf(Math.round(C.total))+' α':cw?'':'—');
  [['#s-px-d',rw],['#s-res',rw],['#s-res-d',rw],['#s-lock',cw]].forEach(([id,w])=>$(id).classList.toggle('wait',w));
  const off=(!RS&&!rw)||(!C&&!cw),n=$('#s-na');n.hidden=!off;n.textContent=off?(chainDown()?TX.chainUnavailable:TX.unavailable):''});

/* ---------- NETWORK ---------- */
UR.onChange(()=>need($('#n-data'),any(SER('traffic').v)));
bigTraffic($('#n-data'),300);
const epTB=g=>g==null?null:g*1.073741824/1000;
UR.onChange(()=>{const s=SER('traffic'),P=UR.P,tf=UR.tipFmt();
  set('#n-k2-t',P===1?TX.network.averageHour:TX.network.averageDay);set('#n-k3-t',TX.network.busiest[UR.bucketKey()]);
  // the period's data carried: its three figures and its table
  if(['#n-k1','#n-k2','#n-k3'].map(id=>need($(id),any(s.v))).every(Boolean)){
  html('#n-data-t',`<table class="t"><thead><tr><th>${esc(P<=3?TX.network.tableTime:TX.network.tableDay)}</th><th>${esc(TX.chart.carried)}</th></tr></thead><tbody>${s.t.map((t,i)=>`<tr><td>${esc(tf(t))}</td><td>${tbF(s.v[i])}</td></tr>`).reverse().join('')}</tbody></table>`);
  let bi=0;s.v.forEach((v,i)=>{if((v??-1)>(s.v[bi]??-1))bi=i});const bk=UR.bucketKey();
  set('#n-k1',tbF(s.total));dl($('#n-k1-d'),s.total,s.prevTotal);
  set('#n-k2',P===1?UR.un(Math.round(s.total*1000/24),0,'GB'):tbF(s.total/P));html('#n-k2-s',UR.h(TX.overview.onAverage,{value:`<b>${gbs(s.total*8e12/(P*86400)/1e9)}</b>`}));
  const gb=v=>v<1?UR.un(Math.round(v*1000),0,'GB'):tbF(v);set('#n-k3',gb(s.v[bi]));html('#n-k3-s',`${esc(P<=3?UR.tipFmt()(s.t[bi]):fmtDw(s.t[bi]))}<br><span class="vs">${esc(UR.f(TX.network.vsAverage[bk],{value:P===1?gb(s.total/24):P===3?gb(s.total/12):gb(s.total/P)}))}</span>`)}
  const na=netsAdded(P),np=netsAdded(P,1);
  if(need($('#n-new'),na||any(SER('newNets').v))){html('#n-new',na?`${nf(Math.round(na.added/P))} <small>${esc(TX.network.aDay)}</small>`:'—');dl($('#n-new-d'),na&&na.added,np&&np.added)}
  if(need($('#n-tot2'),L.nets!=null||any(SER('nets').v)))set('#n-tot2',nf(L.nets))});
// when traffic flows: the period's average day, hour by hour, in the viewer's time.
// The hourly shape comes from throughput (hourly for 90 days); it's scaled so the 24 hours add up to the period's average day of data carried.
{const hl=h=>String(h).padStart(2,'0')+':00';
  const hod=()=>{const TP=S.TPH,n=UR.P*24,v=TP.v.slice(-n),t0=TP.t0+(TP.v.length-n)*36e5,by=Array.from({length:24},()=>[]);
    v.forEach((x,i)=>{if(x!=null)by[new Date(t0+i*36e5).getHours()].push(x)});
    const av=by.map(a=>a.length?a.reduce((p,q)=>p+q,0)/a.length:null),sum=av.reduce((p,q)=>p+(q||0),0),tr=SER('traffic'),day=tr.total/UR.P*1000;
    return av.map(x=>x==null?null:x/sum*day)};
  UR.hod=hod;
  UR.onChange(()=>{if(!need($('#n-hod-n'),S.TPH&&any(S.TPH.v.slice(-UR.P*24))&&SER('traffic').total!=null))return;
    const av=hod(),f=av.filter(v=>v!=null),hi=av.indexOf(Math.max(...f)),lo=av.indexOf(Math.min(...f));set('#n-hod-n',UR.f(TX.network.busiestQuietest,{busy:hl(hi),quiet:hl(lo)}))});
  UR.chart($('#n-hod'),()=>({t:Array.from({length:24},(_,h)=>h),series:[{v:hod(),kind:'col',color:BAR,name:TX.chart.approx,fmt:v=>UR.f(TX.chart.perHour,{value:UR.un(Math.round(v),0,'GB')})}],T,height:240,ml:56,unit:'GB',xFmt:hl,tipX:h=>UR.f(TX.time.hours,{from:hl(h),to:hl((h+1)%24)}),label:PG.titles.whenTrafficFlows}))}
UR.chart($('#n-tp'),()=>{const s=SER('throughput');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:TX.chart.average,fmt:gbs}],T,height:220,endLabel:true,trim:true,unit:'Gb/s',ml:66,label:PG.titles.throughput}});
// Option B: the same 24 hours as a clock face, midnight at the top
{const el=$('#n-clock'),hl=h=>String(h).padStart(2,'0')+':00';
  const draw=()=>{const w=el.clientWidth,h=280;if(!w)return;const v=UR.hod(),mx=Math.max(...v.filter(x=>x!=null)),cx=w/2,cy=h/2,r0=46,R=Math.min(w,h)/2-26,hi=v.indexOf(mx);
    const pt=(a,r)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)],ang=i=>i/24*2*Math.PI-Math.PI/2,half=Math.PI/24*0.82;let g='';
    [.5,1].forEach(f=>{g+=`<circle cx="${cx}" cy="${cy}" r="${r0+(R-r0)*f}" fill="none" stroke="${T.grid}"/>`});
    v.forEach((x,i)=>{if(x==null)return;const r1=r0+(R-r0)*x/mx,a=ang(i)+Math.PI/24,[x1,y1]=pt(a-half,r0),[x2,y2]=pt(a-half,r1),[x3,y3]=pt(a+half,r1),[x4,y4]=pt(a+half,r0);
      g+=`<path data-h="${i}" d="M${x1},${y1}L${x2},${y2}A${r1},${r1} 0 0 1 ${x3},${y3}L${x4},${y4}A${r0},${r0} 0 0 0 ${x1},${y1}Z" fill="${i===hi?BAR_HI:BAR}"/>`});
    [0,6,12,18].forEach(i=>{const [x,y]=pt(ang(i),R+14);g+=`<text x="${x}" y="${y+4}" text-anchor="middle" fill="${T.text}" font-size="10.5" font-family="${T.font}">${hl(i)}</text>`});
    g+=`<text x="${cx}" y="${cy-4}" text-anchor="middle" fill="${T.text}" font-size="10" font-family="${T.font}">${esc(TX.chart.busiest)}</text><text x="${cx}" y="${cy+14}" text-anchor="middle" fill="${T.strong}" font-size="15" font-weight="600" font-family="${T.font}">${hl(hi)}</text>`;
    el.innerHTML=`<svg width="${w}" height="${h}" role="img" aria-label="${esc(TX.chart.clockAria)}">${g}</svg>`;
    el.querySelectorAll('path[data-h]').forEach(p=>{const sh=e=>{const i=+p.dataset.h;UR.showTip(`<span class="k">${esc(UR.f(TX.time.hours,{from:hl(i),to:hl((i+1)%24)}))}</span>${UR.tipRow(esc(TX.chart.approx),esc(UR.f(TX.chart.perHour,{value:UR.un(Math.round(v[i]),0,'GB')})))}`,e.clientX,e.clientY)};p.addEventListener('pointermove',sh);p.addEventListener('pointerdown',sh);p.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')UR.hideTip()})})};
  el._draw=draw;new ResizeObserver(()=>UR.run(draw)).observe(el);UR.onChange(draw)}
// Users (proposed): four figures across, the daily chart underneath
UR.onChange(()=>{const E=S.EPOCH;if(!need($('#n-u2'),L.users24!=null||E||any(SER('users24').v)))return;
  const wkLab=E&&UR.f(TX.network.epochDates,{n:EP.n-1,from:fmtD(EP.start-7*UR.DAY),to:fmtD(EP.start)});
  html('#n-u2',`<div class="fig"><span class="k">${esc(TX.network.last24)}</span><span class="v">${nf(L.users24)}</span></div>`+(E?`<div class="fig"><span class="k">${esc(PG.titles.thisEpoch)}</span><span class="v">${nf(E.users)}</span></div><div class="fig"><span class="k">${esc(wkLab)}</span><span class="v">${nf(E.prevUsers)}</span></div>`:''))});
UR.chart($('#n-dau2'),()=>{const s=SER('users24');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:uLab(),fmt:nf}],T,height:220,trim:true,label:PG.titles.dailyUsers}});
// Growth (proposed): networks added in the period, growth since its start, and how often a new one arrives
const kM=v=>EN?(v>=1e6?(v/1e6).toFixed(2)+'M':Math.round(v/1e3)+'K'):UR.numF({notation:'compact',maximumFractionDigits:v>=1e6?2:0}).format(v),kMp=(a,b)=>kM(a)===kM(b)?[nf(Math.round(a)),nf(Math.round(b))]:[kM(a),kM(b)];
UR.onChange(()=>{const P=UR.P,na=netsAdded(P);if(!need($('#n-g'),na)){html('#n-g','');return}const start=na.start,end=na.end,added=Math.round(na.added),sec=P*86400/added;
  const range=kMp(start,end),every=sec<60?UR.f(UR.pl(TX.network.seconds,Math.round(sec)),{count:EN?Math.round(sec):nf(Math.round(sec))}):UR.f(UR.pl(TX.network.minutes,+(sec/60).toFixed(1),{minimumFractionDigits:1}),{count:UR.fx(sec/60,1)});
  html('#n-g',`<div class="fig"><span class="k">${esc(UR.f(TX.network.networksAdded,{period:plab()}))}</span><span class="v">+${nf(added)}</span></div><div class="fig"><span class="k">${esc(UR.f(TX.network.growthLast,{period:plab()}))}</span><span class="v">+${UR.pc(added/start*100,1)}</span><span class="d">${esc(UR.f(TX.network.growthRange,{from:range[0],to:range[1]}))}</span></div><div class="fig"><span class="k">${esc(TX.network.newEvery)}</span><span class="v">${esc(every)}</span><span class="d">${esc(UR.f(TX.network.onAverageLast,{period:plab()}))}</span></div>`)});
// total data carried, all recorded, beside the clock
UR.part(()=>{const f=UR.D.traffic.findIndex(v=>v!=null);if(need($('#n-cum3'),f>=0))set('#n-cum-s',UR.f(TX.network.sinceChip,{date:fmtD(UR.dayT[f])}))});
UR.chart($('#n-cum3'),()=>({...cumCfg(300),endLabel:true}));
// clock by default; bars on request (remembered in this browser)
{const pick=v=>{$$('#hodv button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));$('#n-clock').hidden=v!=='clock';$('#n-hod').hidden=v!=='bars';(v==='bars'?$('#n-hod'):$('#n-clock'))._draw();try{localStorage.setItem('ur-hod',v)}catch(e){}};
  $$('#hodv button').forEach(b=>b.addEventListener('click',()=>pick(b.dataset.v)));let v='clock';try{v=localStorage.getItem('ur-hod')||'clock'}catch(e){}if(v!=='clock'&&v!=='bars')v='clock';if(v!=='clock')requestAnimationFrame(()=>pick(v))}
UR.chart($('#n-new-c'),()=>{const s=SER('newNets');return{t:s.t,series:[{v:s.v.map(v=>v==null?null:Math.round(v)),kind:'col',color:BAR,name:TX.chart.signupsPer[UR.bucketKey()],fmt:nf}],hiLast:BAR_HI,T,height:200,trim:true,label:PG.titles.signups}});
UR.chart($('#n-cum-c'),()=>{const s=SER('nets');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:TX.chart.total,fmt:nf}],zero:false,trim:true,T,height:200,ml:56,label:PG.titles.totalNetworks}});


/* ---------- PROVIDERS ---------- */
let showAll=false,vPicked=null,ctFocus=null;
function tbl(){const P=UR.P,hasChg=Object.keys(S.COUNTRY_PAST[P]||{}).length>0,rows=(showAll?cs:cs.slice(0,15)).map((c,i)=>{const g=UR.chg(c);return`<tr><td class="l">${i+1}</td><td class="l"><span class="cc">${c.c}</span>${c.n}${(UR.NEWC[P]||[]).includes(c.c)?` <span class="chip" style="color:var(--orchid);border-color:rgba(237,143,255,.4)">${esc(TX.country.newChip)}</span>`:''}</td><td>${nf(c.v)}</td><td>${esc(shareTxt(c.v))}<span class="bar"><i style="width:${(c.v/UR.CMAX*100).toFixed(1)}%"></i></span></td>${hasChg?`<td class="${g==null||cls(g)==='fl'?'':cls(g)}">${UR.signed(g)}</td>`:''}</tr>`}).join('');
  html('#v-tbl',`<thead><tr><th>#</th><th class="l">${esc(TX.country.tableCountry)}</th><th>${esc(TX.country.tableOnline)}</th><th>${esc(TX.country.share)}</th>${hasChg?`<th>${esc(UR.f(TX.country.changeLast,{period:plab()}))}</th>`:''}</tr></thead><tbody>${rows}</tbody>`);
  set('#v-all',showAll?TX.country.showTop:UR.f(UR.pl(TX.country.showAll,cs.length),{count:EN?cs.length:nf(cs.length)}))}
$('#v-all').addEventListener('click',()=>{showAll=!showAll;tbl()});
UR.onChange(()=>{const P=UR.P,s=SER('providers');
  if(need($('#v-act'),L.providers!=null||any(s.v))){set('#v-act',nf(L.providers));
    dl($('#v-act-d'),L.providers,s.total,TX.vsPeriodAverage['d'+P]);
    set('#v-avg-k',UR.f(TX.country.averageOnline,{period:plab()}));set('#v-avg',s.total==null?'—':nf(Math.round(s.total)));
    set('#v-peak-k',UR.f(TX.country.highestLast[UR.bucketKey()],{period:plab()}));set('#v-peak',nf(Math.round(Math.max(...s.v.filter(v=>v!=null)))))}
  const last=k=>{const v=UR.series(k,'last').v.filter(x=>x!=null);return v[v.length-1]};
  // change across the period, from the first to the last point of each chart
  const since=(id,k)=>{const sr=UR.series(k,'last'),i=sr.v.findIndex(v=>v!=null),a=sr.v[i],b=[...sr.v].reverse().find(v=>v!=null),d=Math.round(b-a);
    html(id,a==null?'':`<b class="${d>0?'up':d<0?'dn':'fl'}">${d>0?'↑ +'+nf(d):d<0?'↓ −'+nf(-d):esc(TX.change.none)}</b>${esc(UR.f(TX.change.since,{date:P<=3?UR.fmtWhen(sr.t[i]):fmtD(sr.t[i])}))}`)};
  if(need($('#v-ctry'),L.countries!=null||any(UR.series('countries','last').v))){set('#v-ctry',L.countries??'—');since('#v-ctry-d','countries')}
  if(need($('#v-city'),L.cities!=null||any(UR.series('cities','last').v))){set('#v-city',nf(L.cities));since('#v-city-d','cities')}
  if(need($('#v-tbl'),cs.length))tbl();
  if(need($('#v-pick'),cs.length))drawV()});
UR.onChange(()=>need($('#v-prov'),any(SER('providers').v)));
UR.chart($('#v-prov'),()=>{const s=SER('providers');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:TX.chart.onlineAverage,fmt:v=>nf(Math.round(v))}],zero:false,trim:true,T,height:260,label:PG.titles.providersOnline}});
[['#v-ctry-c','countries',TX.chart.countriesAria],['#v-city-c','cities',TX.chart.citiesAria]].forEach(([id,k,lab])=>UR.chart($(id),()=>{const s=UR.series(k,'last');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:TX.chart.withProvider,fmt:nf}],zero:false,trim:true,int:true,T,height:70,ml:0,noX:true,yFmt:()=>'',label:lab}}));
// country lookup: search, or click a dot on the map; clicking it again (or empty map) clears
function ctName(k){return(UR.CONTINENTS.find(x=>x[0]===k)||[,''])[1]}
function pctS(v){return EN?(v<0.01?'<0.01':v<0.1?v.toFixed(2):v.toFixed(1))+'%':v<0.01?'<'+UR.pc(0.01,2):UR.pc(v,v<0.1?2:1)}
function shareTxt(v){return pctS(v/UR.PROV*100)}
function stat(k,v,c=''){return`<div><span class="k">${esc(k)}</span><span class="v ${c}">${esc(v)}</span></div>`}
function row(c,me){return`<button class="${me?'me':''}" data-c="${c.c}"><span class="rk">#${cs.indexOf(c)+1}</span><span>${c.n}</span><b>${nf(c.v)}</b></button>`}
function drawV(){const P=UR.P,past=S.COUNTRY_PAST[P]||{},has=Object.keys(past).length>0,c=cs.find(x=>x.c===vPicked);let h='';
  const clear=lab=>`<button class="xp" id="v-clear" aria-label="${esc(UR.f(TX.country.clear,{name:lab}))}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>`;
  if(c){const i=cs.indexOf(c),g=UR.chg(c),near=cs.slice(Math.max(0,Math.min(i-2,cs.length-5)),Math.max(0,Math.min(i-2,cs.length-5))+5);
    h=`<div class="lk-head"><div><h3>${c.n}</h3><span class="meta">${esc(UR.f(TX.country.rank,{continent:ctName(c.ct),rank:i+1,total:cs.length}))}</span></div>${clear(c.n)}</div>
      <div class="lk-stats">${stat(PG.titles.providersOnline,nf(c.v))}${stat(TX.country.shareOfAll,pctS(c.v/UR.PROV*100))}${has&&g!=null?stat(UR.f(TX.country.changeLast,{period:plab()}),UR.signed(g),cls(g)==='fl'?'':cls(g)):stat(TX.country.continentShare,pctS(c.v/cs.filter(x=>x.ct===c.ct).reduce((a,x)=>a+x.v,0)*100))}</div>
      <div><div class="lk-lab">${esc(TX.country.nearby)}</div><div class="lk-list">${near.map(x=>row(x,x===c)).join('')}</div></div>`}
  else if(ctFocus){const m=cs.filter(x=>x.ct===ctFocus),v=m.reduce((a,x)=>a+x.v,0),pv=m.reduce((a,x)=>a+(past[x.c]||0),0),g=has&&pv?UR.pct(v,pv):null;
    h=`<div class="lk-head"><div><h3>${esc(ctName(ctFocus))}</h3><span class="meta">${esc(UR.f(UR.pl(TX.country.continent,m.length),{count:m.length}))}</span></div>${clear(ctName(ctFocus))}</div>
      <div class="lk-stats">${stat(PG.titles.providersOnline,nf(v))}${stat(TX.country.shareOfAll,pctS(v/UR.PROV*100))}${g!=null?stat(UR.f(TX.country.changeLast,{period:plab()}),UR.signed(g),cls(g)==='fl'?'':cls(g)):stat(PG.titles.countries,m.length)}</div>
      <div><div class="lk-lab">${esc(TX.country.topCountries)}</div><div class="lk-list">${m.slice(0,5).map(x=>row(x,false)).join('')}</div></div>`}
  else{h=`<div class="lk-head"><div><h3>${esc(TX.country.worldwide)}</h3><span class="meta">${esc(TX.country.worldwideHint)}</span></div></div>
      <div class="lk-stats">${stat(PG.titles.providersOnline,nf(L.providers))}${stat(PG.titles.countries,L.countries??'—')}${stat(PG.titles.cities,nf(L.cities))}</div>
      <div><div class="lk-lab">${esc(TX.country.topCountries)}</div><div class="lk-list">${cs.slice(0,5).map(x=>row(x,false)).join('')}</div></div>`}
  html('#v-pick',h);
  const x=$('#v-clear');if(x)x.addEventListener('click',()=>{$('#v-search').value='';set('#v-search-m','');if(vPicked)vPicked=null;else ctFocus=null;ctRows();drawV();mapDraw()});
  $$('#v-pick .lk-list button').forEach(b=>b.addEventListener('click',()=>pickV(b.dataset.c)))}
function mapDraw(){const p=$('#v-map').parentElement;if(p._draw)p._draw();if(ctFocus)ctRows()}
UR.part(()=>html('#v-list',cs.map(c=>`<option value="${c.n}">`).join('')));
function pickV(code){vPicked=code;const c=code&&cs.find(x=>x.c===code);if(c&&ctFocus&&c.ct!==ctFocus)ctFocus=null;ctRows();drawV();mapDraw()}
searchBox($('#v-search'),$('#v-search-m'),c=>pickV(c.c));
UR.flatMap($('#v-map'),{land:'#45454F',focus:()=>ctFocus,onPick:c=>pickV(c&&c.c!==vPicked?c.c:null),picked:()=>vPicked,dim:c=>ctFocus&&c.ct!==ctFocus});
UR.part(()=>{if(need($('#v-map'),cs.length))mapDraw()});
// continents: open one for its top 5 countries; the map dims everything else
function ctRows(){const tot=UR.CONTINENTS.map(([k,n])=>[k,n,cs.filter(c=>c.ct===k).reduce((a,c)=>a+c.v,0)]).sort((a,b)=>b[2]-a[2]);
  html('#v-regbars',tot.map(([k,n,v])=>{const open=ctFocus===k,top=cs.filter(c=>c.ct===k).slice(0,5);
    return `<button class="r rbtn" data-ct="${k}" aria-expanded="${open}"><span><span class="cv">${open?'▾':'▸'}</span>${esc(n)}</span><b>${UR.pc(v/UR.PROV*100,1)}</b><span class="tr"><i style="width:${(v/tot[0][2]*100).toFixed(1)}%"></i></span></button>${open?`<div class="ctop">${top.map(c=>`<button class="${c.c===vPicked?'me':''}" data-c="${c.c}"><span>${c.n}</span><b>${nf(c.v)}</b></button>`).join('')}</div>`:''}`}).join(''));
  $$('#v-regbars .rbtn').forEach(b=>b.addEventListener('click',()=>{ctFocus=ctFocus===b.dataset.ct?null:b.dataset.ct;vPicked=null;ctRows();drawV();mapDraw()}));
  $$('#v-regbars .ctop button').forEach(b=>b.addEventListener('click',()=>pickV(b.dataset.c)))}
UR.part(()=>{if(!need($('#v-regbars'),cs.length))return;ctRows();set('#v-conc-n',UR.f(TX.country.top3,{share:UR.pc(share(3),0)}))});

/* ---------- SN25 ---------- */
set('#e-h',TX.epoch.current);
UR.part(()=>{if(!need($('#e-pct'),EP.n!=null))return;
  set('#e-pct',UR.f(TX.epoch.name,{n:EP.n}));html('#e-left',UR.h(TX.epoch.progress,{percent:`<b>${UR.pc(Math.round(EP.p*100),0)}</b>`,left:`<b>${esc(EP.leftTxt)}</b>`,when:esc(when(EP.end)),block:nf(S.EPOCH.endBlock)}))});
// overview: this epoch so far. Operators pay per epoch, so its users and data are what the subnet earns from
UR.part(()=>{const E=S.EPOCH,f=(k,v,d)=>`<div><span class="k">${k}</span><span class="v">${v}</span><span class="d">${d}</span></div>`;if(!need($('#oe-figs'),E))return;
  html('#oe-meta',UR.h(TX.epoch.overview,{epoch:`<b>${esc(UR.f(TX.epoch.name,{n:EP.n}))}</b>`,percent:UR.pc(Math.round(EP.p*100),0)}));$('#oe-bar').style.width=(EP.p*100).toFixed(1)+'%';
  html('#oe-figs',f(esc(TX.epoch.usersThisEpoch),nf(E.users),esc(UR.f(TX.epoch.inEpoch,{value:nf(E.prevUsers),n:EP.n-1})))+f(esc(TX.epoch.dataThisEpoch),tbF(epTB(E.dataGiB)),esc(UR.f(TX.epoch.inEpoch,{value:tbF(epTB(E.prevDataGiB)),n:EP.n-1})))+f(esc(TX.epoch.timeLeft),esc(EP.leftTxt),esc(UR.f(TX.epoch.ends,{when:when(EP.end)}))))});
UR.part(()=>{if(EP.n==null)return;const W=7*UR.DAY,eps=[];for(let n=Math.max(0,EP.n-4);n<=EP.n+1;n++){const st=n===0?EP.start-(EP.n-1)*W-UR.DAY:EP.start+(n-EP.n)*W;eps.push({n,start:st,state:n<EP.n?'done':n===EP.n?'now':'sch'})}
  html('#e-tl',eps.map(e=>`<div class="${e.state}"${e.state==='now'?` style="--p:${(EP.p*100).toFixed(1)}%"`:''}><span>${esc(UR.f(e.state==='now'?TX.epoch.shortNow:e.state==='sch'?TX.epoch.shortOn:TX.epoch.short,{n:e.n,date:e.state==='sch'?fmtD(e.start):''}))}</span></div>`).join(''));$('#e-tl').style.gridTemplateColumns=eps.map((e,i)=>e.n===0?'minmax(max-content,1.5fr)':i===eps.length-1?'minmax(max-content,4fr)':'7fr').join(' ')});
const earnedIn=n=>{const X=S.EXTRA,p=((X.payouts&&X.payouts.epochs)||{})[n]||{},e=(X.epochs||{})[n];if(p.testing)return null;if(p.earned!=null)return p.earned;if(e&&e.miner!=null)return e.miner;return n===EP.n-1&&X.prevMinerAlpha?X.prevMinerAlpha:null};
UR.part(()=>{if(EP.n==null)return;const H=36e5,DAY=UR.DAY,hr=(a,b)=>UR.hourT.reduce((t,x,i)=>x>a&&x<=b&&UR.Hs.traffic[i]!=null?t+UR.Hs.traffic[i]:t,0),
    dy=(a,b)=>UR.dayT.reduce((t,x,i)=>{const s0=x,e0=x+DAY,o=Math.max(0,Math.min(b,e0)-Math.max(a,s0));return UR.D.traffic[i]!=null&&o>0?t+UR.D.traffic[i]*o/DAY:t},0);
  const curTB=epTB(S.EPOCH.dataGiB),prevTB=epTB(S.EPOCH.prevDataGiB);
  const X=S.EXTRA,PEND=X.payouts&&X.payouts.pending,
    PE=(X.payouts&&X.payouts.epochs)||{},
    earn=r=>{const p=PE[r.n]||{},a=earnedIn(r.n);if(a==null)return'<span class="muted">—</span>';return`${nf(Math.round(a))} α <span class="muted">· ${esc(p.paid!=null?TX.epoch.paid:TX.epoch.pending)}</span>`},
    rows=[{n:EP.n,a:EP.start,b:null,tb:curTB,users:S.EPOCH.users,dep:X.depositAlpha,cur:true}].concat(X.epochs
      ?Object.entries(X.epochs).map(([n,e])=>({n:+n,a:e.start,b:e.end,tb:e.dataGiB!=null?epTB(e.dataGiB):null,users:e.users,dep:e.deposits??null,miner:e.miner,settlePx:e.settlePx})).sort((p,q)=>q.n-p.n)
      :[{n:EP.n-1,a:EP.start-7*DAY,b:EP.start,tb:prevTB,users:S.EPOCH.prevUsers,dep:X.prevDepositAlpha,miner:X.prevMinerAlpha}]),
    dash='<span class="muted">—</span>',
    row=r=>`<tr class="${r.n<EP.n-2?'ep-old':''}${(PE[r.n]||{}).testing?' ep-test':''}"${(PE[r.n]||{}).testing?` title="${esc(TX.epoch.testing)}"`:''}><td class="l">${r.n}</td><td class="l">${esc(UR.f(TX.time.days,{from:fmtD(r.a),to:r.cur?TX.epoch.now:fmtD(r.b)}))}</td><td>${r.tb!=null?tbF(r.tb):dash}</td><td>${r.users!=null?nf(r.users):dash}</td><td>${r.cur?(X.minerAlpha?`${nf(Math.round(X.minerAlpha))} α <span class="muted">· ${esc(TX.epoch.inProgress)}</span>`:`<span class="muted">${esc(TX.epoch.atSettlement)}</span>`):earn(r)}</td></tr>`,
    old=rows.filter(r=>r.n<EP.n-2);
  html('#e-tbl',`<thead><tr><th class="l">${esc(TX.epoch.tableEpoch)}</th><th class="l">${esc(TX.epoch.tableDates)}</th><th>${esc(PG.titles.dataCarried)}</th><th>${esc(PG.titles.users)}</th><th>${esc(PG.titles.earned)}</th></tr></thead><tbody>${rows.map(row).join('')}</tbody>`);
  if(old.length){const lo=Math.min(...old.map(r=>r.n)),hi=Math.max(...old.map(r=>r.n)),lab=on=>lo===hi?UR.f(on?TX.epoch.hide:TX.epoch.show,{n:lo}):UR.f(on?TX.epoch.hideRange:TX.epoch.showRange,{from:lo,to:hi});
    if(!$('#e-more')){$('#e-tbl').closest('.tw').insertAdjacentHTML('afterend',`<button class="more" id="e-more" aria-expanded="false" aria-controls="e-tbl"></button>`);
      $('#e-more').addEventListener('click',e=>{const on=$('#e-tbl').classList.toggle('show-old');e.currentTarget.setAttribute('aria-expanded',on);e.currentTarget.textContent=e.currentTarget._lab(on)})}
    const b=$('#e-more');b._lab=lab;b.textContent=lab($('#e-tbl').classList.contains('show-old'))}});
// earned by providers, all time: finished epochs (testing aside) plus the current epoch's, in progress; pending until confirmed paid
UR.part(()=>{if(!need($('#p-tot'),EP.n!=null))return;const X=S.EXTRA,PE=(X.payouts&&X.payouts.epochs)||{},EV=X.epochs||{},ns=[...new Set([...Object.keys(EV),...Object.keys(PE),EP.n-1].map(Number))].filter(n=>n>=0&&n<EP.n),
    got=ns.map(n=>[n,earnedIn(n)]).filter(([,a])=>a!=null),tot=got.reduce((s,[,a])=>s+a,0),
    paid=got.reduce((s,[n])=>s+(PE[n]&&PE[n].paid!=null?PE[n].paid:0),0),pend=tot-paid;
  const cur=X.minerAlpha||0;set('#p-tot',nf(Math.round(tot)+Math.round(cur)));
  html('#p-pend',[paid?UR.h(TX.epoch.paidValue,{value:`<b>${nf(Math.round(paid))} α</b>`}):'',pend>0?UR.h(TX.epoch.pendingValue,{value:`<b>${nf(Math.round(pend))} α</b>`}):'',`<a href="/mainnet">${esc(TX.epoch.schedule)}</a>`].filter(Boolean).join(' · ')+(cur?`<br>${UR.h(TX.epoch.inProgressValue,{value:`<b>${nf(Math.round(cur))} α</b>`,n:EP.n})}`:''))});
// reserve balance: its own period (7D / 30D / All); the reserve is daily and SN25 has no page-wide period
{let RP=30;
  const rd=()=>{const r=UR.D.reserve,n=r.length,i0=r.findIndex(x=>x!=null),a=r[n-1],bi=RP?n-1-RP:-1,b=bi>=i0&&i0>=0?r[bi]:null;html('#r-d',a==null||i0<0?'':b!=null?`<b class="up">+${nf(Math.round(a-b))} α</b>${esc(UR.f(UR.pl(TX.reserve.inLastDays,RP),{count:RP}))}`:`<b class="up">+${nf(Math.round(a-r[i0]))} α</b>${esc(UR.f(TX.change.since,{date:fmtD(UR.dayT[i0])}))}`)};
  UR.chart($('#r-c'),()=>{const r=UR.D.reserve,k=RP||r.length;return{t:UR.dayT.slice(-k),xFmt:fmtD,tipX:fmtDw,series:[{v:r.slice(-k),kind:'area',color:BAR_HI,name:TX.chart.balance,fmt:UR.alpha}],trim:true,T,height:390,ml:56,unit:'α',label:PG.titles.reserveBalance}});
  const pick=p=>{RP=p;$$('#r-period button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.p===p));rd();$('#r-c')._draw()};
  $$('#r-period button').forEach(b=>b.addEventListener('click',()=>pick(+b.dataset.p)));
  UR.part(()=>{if(need($('#r-c'),any(UR.D.reserve)))rd()});pick(RP)}
// conviction locks (chain snapshot): the team lock pinned first, the rest by size
UR.part(()=>{const C=S.EXTRA.conviction;if(!onChain($('#cv-tot'),C,'conviction'))return;const locks=C.locks.slice().sort((a,b)=>(b.coldkey===C.team)-(a.coldkey===C.team)||b.alpha-a.alpha),cnt=f=>C.locks.filter(f).length,short=a=>a.slice(0,6)+'…'+a.slice(-4);
  const nP=cnt(l=>l.perpetual),nD=cnt(l=>!l.perpetual);
  set('#cv-tot',nf(Math.round(C.total))+' α');set('#cv-tot-d',UR.f(TX.conviction.ofOutstanding,{percent:UR.pc(C.shareOfOut*100,1)}));
  set('#cv-perp',nf(Math.round(C.perpetual))+' α');set('#cv-perp-d',UR.f(UR.pl(TX.conviction.perpetualLocks,nP),{count:EN?nP:nf(nP)}));
  set('#cv-dec',nf(Math.round(C.decaying))+' α');set('#cv-dec-d',UR.f(UR.pl(TX.conviction.decayingLocks,nD),{count:EN?nD:nf(nD)}));
  html('#cv-tbl',`<thead><tr><th class="l">${esc(TX.conviction.wallet)}</th><th>${esc(TX.conviction.locked)}</th><th>${esc(TX.country.share)}</th><th class="l">${esc(TX.conviction.type)}</th></tr></thead><tbody>${locks.map(l=>`<tr class="${l.coldkey===C.team?'pin':''}"><td class="l"><code title="${l.coldkey}">${short(l.coldkey)}</code>${l.coldkey===C.team?`<span class="pinl">${esc(TX.conviction.team)}</span>`:''}</td><td>${nf(Math.round(l.alpha))} α</td><td>${UR.pc(l.alpha/C.total*100,1)}<span class="bar"><i style="width:${(l.alpha/C.total*100).toFixed(1)}%"></i></span></td><td class="l">${esc(l.perpetual?PG.titles.perpetual:PG.titles.decaying)}</td></tr>`).join('')}</tbody>`);
  set('#cv-n',UR.f(TX.conviction.readAt,{block:nf(C.block)}))});
UR.part(()=>{const RS=UR.RESERVE;if(!onChain($('#r-bal'),RS,'reserve'))return;set('#r-bal',nf(Math.round(RS.alpha)));
  const W=[[TX.reserve.wallet,RS.wallet,nf(Math.round(RS.alpha))+' α'],...S.EXTRA.recipients.map(r=>[UR.f(TX.reserve.hotkey,{uid:r.uid}),r.hotkey,nf(Math.round(r.alpha))+' α'])];
  html('#r-wallets',W.map(([k,a,v],i)=>`${i===1?`<div class="wsub">${esc(TX.reserve.receives)}</div>`:''}<div class="w${i?' hk':''}"><span class="k">${esc(k)}</span>${v?`<b style="grid-column:1">${v}</b>`:''}<code title="${a}">${a.slice(0,10)}…${a.slice(-8)}</code><button class="xp" data-a="${a}" aria-label="${esc(UR.f(TX.reserve.copy,{name:k}))}"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M10.5 5V3.5A1.5 1.5 0 009 2H3.5A1.5 1.5 0 002 3.5V9a1.5 1.5 0 001.5 1.5H5"/></svg></button></div>`).join(''));
  $$('#r-wallets .xp').forEach((b,i)=>b.addEventListener('click',async()=>{const k=W[i][0];try{await navigator.clipboard.writeText(b.dataset.a);set('#r-copied',UR.f(TX.reserve.copied,{name:k}))}catch(e){set('#r-copied',TX.reserve.copyBlocked)}clearTimeout(b._t);b._t=setTimeout(()=>set('#r-copied',''),3000)}))});

/* ---------- MORE STATS ---------- */
UR.onChange(()=>{const tp=SER('throughput'),dv=SER('devices'),cn=SER('conn'),ex=UR.series('extenders','mean');
  if(need($('#m-tp'),any(tp.v))){set('#m-tp',gbs(tp.total));dl($('#m-tp-d'),tp.total,tp.prevTotal)}
  if(need($('#m-dev'),any(dv.v))){set('#m-dev',nf(Math.round(dv.total)));dl($('#m-dev-d'),dv.total,dv.prevTotal)}
  if(need($('#m-conn'),any(cn.v))){set('#m-conn',nf(Math.round(cn.total*1440)));dl($('#m-conn-d'),cn.total,cn.prevTotal)}
  if(need($('#m-ext-a'),UR.EXT.online!=null||any(ex.v))){set('#m-ext-a',UR.EXT.online??'—');const sr=UR.series('extenders','last'),i=sr.v.findIndex(v=>v!=null),a=sr.v[i],d=a==null||UR.EXT.online==null?null:Math.round(UR.EXT.online-a);html('#m-ext-d',d==null?'':`<b class="${d>0?'up':d<0?'dn':'fl'}">${d>0?'↑ +'+d:d<0?'↓ −'+(-d):esc(TX.change.none)}</b>${esc(UR.f(TX.change.since,{date:UR.P<=3?UR.fmtWhen(sr.t[i]):fmtD(sr.t[i])}))}`)}});
UR.chart($('#m-ext-c'),()=>{const s=UR.series('extenders','mean');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:TX.chart.onlineAverage,fmt:v=>Math.round(v)}],zero:false,trim:true,int:true,T,height:222,label:PG.titles.extendersOnline}});
UR.chart($('#m-dev-c'),()=>{const s=SER('devices');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:TX.chart.devicesDaily,fmt:nf}],trim:true,T,height:180,label:PG.titles.connectedDevices}});
UR.chart($('#m-conn-c'),()=>{const s=SER('conn');return{t:s.t,series:[{v:s.v.map(v=>v==null?null:v*1440),kind:'area',color:BAR_HI,name:TX.chart.aDay,fmt:v=>nf(Math.round(v))}],trim:true,T,height:180,label:TX.chart.connectionsAria}});
UR.part(()=>{if(!need($('#m-ext'),UR.EXT.list))return;set('#m-ext-n',UR.EXT.online??'—');const mx=Math.max(1,...UR.EXT.list.map(x=>x[2]));html('#m-ext',UR.EXT.list.map(([c,n,v])=>`<div class="r"><span>${n}</span><b>${v}</b><span class="tr"><i style="width:${(v/mx*100).toFixed(0)}%"></i></span></div>`).join(''))});
const ipBar=(id,lid,d)=>{const t=d.v4+d.v6+d.dual,Cc=[[TX.ipFamily.v4,d.v4,BAR_HI],[TX.ipFamily.dual,d.dual,'#B77FC4'],[TX.ipFamily.v6,d.v6,BAR]];
  html(id,Cc.map(([k,v,c])=>`<div style="flex:${Math.max(v,t*.002)};background:${c}" title="${esc(UR.f(TX.ipFamily.title,{label:k,value:nf(v)}))}"></div>`).join(''));html(lid,Cc.map(([k,v,c])=>`<span><i class="bar" style="background:${c}"></i>${esc(UR.f(TX.ipFamily.legend,{label:k,value:nf(v)}))}</span>`).join(''))};
UR.part(()=>{if(need($('#m-ipp'),UR.IPFAM.v4!=null))ipBar('#m-ipp','#m-ipp-l',UR.IPFAM);if(UR.EXT.v4!=null)ipBar('#m-ipe','#m-ipe-l',UR.EXT)});


// preview of the live page's states: ?state=loading or ?state=error
{const st=new URLSearchParams(location.search).get('state');$$('#st a').forEach(a=>a.setAttribute('aria-current',(a.dataset.s||'')===(st||'')?'page':'false'));
  if(st==='loading')document.body.classList.add('is-loading');
  if(st==='error'){document.body.classList.add('is-error');$$('section[data-tab] .pn').forEach(p=>{p.dataset.unavailable=TX.unavailable});const blank=()=>{$$('section[data-tab] :is(.big,.mid,.fig .v,.lk-stats .v,.kv dd,.rows b),#nowroute .rn b,.livebar .it b,#nr-live').forEach(e=>e.textContent='—');
      $$('section[data-tab] :is(.dl,.sub),#o-cum-s,#c-conc,#cv-n').forEach(e=>e.textContent='');$('#upd').classList.add('err');set('#upd',TX.previewError)};UR.onChange(blank);setInterval(blank,1000)}}
// How we count's first four sections are the tabs', in their order: each takes its tab's icon
$$('section[data-tab="method"] .pn>.ph .pt').forEach((h,k)=>{const t=['network','providers','subnet','more'][k],i=t&&$(`.nav button[data-t="${t}"] svg`);if(i){const c=i.cloneNode(true);c.classList.add('ico');c.setAttribute('aria-hidden','true');h.prepend(c)}});
$$('section[data-tab] .pn').forEach(pn=>{if(pn.querySelector('.xp'))return;const ch=[...pn.querySelectorAll('div')].find(d=>d._get);const ph=pn.querySelector(':scope > .ph');if(!ch||!ph)return;
  let tags=ph.querySelector(':scope > .tags');if(!tags){tags=document.createElement('div');tags.className='tags';[...ph.children].slice(1).forEach(c=>tags.appendChild(c));ph.appendChild(tags)}
  const b=document.createElement('button');b.className='xp';b.setAttribute('aria-label',UR.f(TX.chart.expand,{title:ph.querySelector('.pt').textContent}));
  b.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9"/></svg>';b.addEventListener('click',()=>UR.openChart(ch,b));ch.classList.add('zoomable');ch.addEventListener('click',()=>UR.openChart(ch,b));tags.appendChild(b)});
let start=(location.hash||'').slice(1);show(Object.hasOwn(PAGES,start)?start:'overview');
})();
