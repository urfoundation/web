/* UR stats dashboard: the page (tabs, panels, charts). Runs after engine.js, once window.SNAP is set. */
(function(){
const {$,$$,nf,cpt,fmtD,fmtDw}=UR;
const T={grid:'rgba(255,255,255,.06)',text:'#7E7E88',strong:'#FAFAFA',cross:'rgba(255,255,255,.22)',surface:'#111113',font:"'PP Neue Montreal',Helvetica,Arial,sans-serif"};
const tbF=v=>v==null?'—':v>=100?v.toFixed(0)+' TB':v>=10?v.toFixed(1)+' TB':v.toFixed(2)+' TB';
const gbs=v=>v==null?'—':v.toFixed(2)+' Gb/s';
const BAR='rgba(237,143,255,.26)',BAR_HI='#ED8FFF',ALT='#D6E6F4',AVG='#F7C8FF';
UR.THEME={acc:'#ED8FFF',rgb:'237,143,255',alt:'#D6E6F4',tint:'#161616'};document.body.dataset.accent='pink';
const plab=()=>UR.PERIODS[UR.P].lab;
const arrow=d=>d>0?'↑':d<0?'↓':'', cls=d=>d>0.05?'up':d<-0.05?'dn':'fl';
// a change, or nothing when history doesn't reach back a full period
const dl=(el,cur,prev,lab)=>{if(prev==null||!isFinite(prev)||prev===0||cur==null){el.innerHTML='<b class="fl">—</b>not enough history to compare';return}const d=UR.pct(cur,prev);if(Math.abs(d)<0.05){el.innerHTML=`<b class="fl">no change</b>${lab||'vs previous '+plab()}`;return}el.innerHTML=`<b class="${cls(d)}">${arrow(d)} ${Math.abs(d).toFixed(1)}%</b>${lab||'vs previous '+plab()}`};
const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
const html=(id,v)=>{const e=$(id);if(e)e.innerHTML=v};
const SUM=new Set(['traffic','newNets']),MEAN=new Set(['providers','throughput','conn','devices']);
const SER=(k,P)=>UR.series(k,SUM.has(k)?'sum':MEAN.has(k)?'mean':'last',P);
const L=UR.LIVE,K=UR.TOKEN,EP=UR.EP,S=window.SNAP;
const when=t=>UR.fmtWhen(t);
$$('#snap-at,.snap-at').forEach(e=>e.textContent=when(UR.NOW)+' local time');
set('#foot-tz','Times in '+UR.tzLabel().replace('your local time','local time'));

/* ---------- sections and controls ---------- */
const PAGES={overview:['UR Stats',''],
  network:['Network','Traffic, users and growth on URnetwork.'],
  providers:['Providers','Devices sharing their connection, counted by country and city, never by individual location.'],
  subnet:['SN25','Payouts, conviction and the Network Capacity Reserve, read from Bittensor mainnet.'],
  more:['More stats','Other figures from the network’s monitoring.'],
  method:['How we count','What each number means and where it comes from.']};
// each tab opens on its own default period until the viewer picks one (Network is the macro view: 90D)
const DEFP={network:90};
function show(p,user){if(!Object.hasOwn(PAGES,p))p='overview';{const nv=$('.nav'),b=$(`.nav button[data-t="${p}"]`);if(nv&&b&&nv.scrollWidth>nv.clientWidth)nv.scrollLeft=b.offsetLeft-(nv.clientWidth-b.offsetWidth)/2}const dp=Object.hasOwn(DEFP,p)?DEFP[p]:7;if(!UR.picked&&UR.P!==dp)UR.setP(dp);if(UR.closeChart)UR.closeChart(true);
  $$('.nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.t===p));
  $$('section[data-tab]').forEach(s=>s.hidden=s.dataset.tab!==p);
  set('#h1',PAGES[p][0]);set('#lede',PAGES[p][1]);$('#lede').hidden=!PAGES[p][1];
  $('#livewrap').hidden=true;$('#nowroute').hidden=p!=='network';$('#h1live').hidden=p!=='overview';$('#pbar').hidden=p==='method'||p==='subnet';$('#orgbar').hidden=true;
  if(location.hash!=='#'+p)history[user?'pushState':'replaceState'](null,'','#'+p);UR.hideTip();if(user)$('#h1').focus({preventScroll:true});
  const sec=$(`section[data-tab="${p}"]`);requestAnimationFrame(()=>{sec.querySelectorAll('*').forEach(e=>{if(e._draw)e._draw()});liveFade()})}
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
  html('#win',`<b>${UR.P<=3?'Last '+plab():fmtD(UR.END-(UR.P-1)*UR.DAY)+' – '+fmtD(UR.END)}</b>`)});

/* ---------- right now ---------- */
set('#lv-prov',nf(L.providers));set('#lv-users',nf(L.users24));
const h24=UR.Hs.traffic.slice(-24).filter(v=>v!=null).reduce((a,b)=>a+b,0);set('#lv-data',tbF(h24));
UR.liveCounter($('#live'));UR.liveCounter($('#nr-live'));
html('#lv-px',`$${K.usd.toFixed(2)} <em style="color:var(--muted)">${UR.signed(K.d24)} 24h</em>`);
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
const avgLab=P=>P===1?'24-hour average':P+'-day average';
// live values: users in the last 24 hours, providers online now (stats feed), data carried in the last 24 hours
const s24=x=>{const h=UR.Hs.traffic;if(x<23)return null;const a=h.slice(x-23,x+1).filter(v=>v!=null);return a.length?a.reduce((p,q)=>p+q,0):null};
const NOWV=()=>{const h=UR.Hs.traffic;let e=h.length-1;while(e>=0&&h[e]==null)e--;return{users:L.users24,prov:L.providers,data:s24(e)}};
// the point that ends a chart on the card's live value (daily charts; providers always, as its hourly series is an average)
const nowPt=k=>{const P=UR.P,v=NOWV(),t=Date.now();if(k==='providers')return{t,v:v.prov,lab:'Now, online'};if(P<=3)return null;
  if(k==='users24')return{t,v:v.users,lab:'Now, last 24 hours'};if(k==='traffic')return{t,v:v.data,lab:'Now, last 24 hours'};return null};
let picked=null;
UR.onChange(()=>{
  const P=UR.P,tr=SER('traffic'),ago=P===1?'vs a day ago':`vs ${plab()} ago`;
  // the cards show the live value (the same as the point that ends each chart), against the same value one period earlier
  const nw=NOWV(),back=(k,hv)=>{if(P<=3){const h=UR.Hs[k];let e=h.length-1;while(e>=0&&h[e]==null)e--;return hv?hv(e-P*24):h[e-P*24]??null}const d=UR.D[k];return d[d.length-P]??null};
  const unit=P===1?'hour':P===3?'6-hour block':'day';
  set('#o-data',tbF(nw.data));dl($('#o-data-d'),nw.data,P<=3?back('traffic',s24):back('traffic'),ago);
  set('#o-data-k','in the last 24 hours');
  html('#o-data-s',`${P>1?`${P}-day total <b>${tbF(tr.total)}</b><br><b>${tbF(tr.total/P)}</b> a day on average<br>`:''}<b>${gbs(tr.total*8e12/(P*86400)/1e9)}</b> on average`);
  const um=dailyUsers(P);set('#o-users',nf(nw.users));dl($('#o-users-d'),nw.users,back('users24'),ago);
  set('#o-users-k','in the last 24 hours');
  html('#o-users-s',P===1?'':`${avgLab(P)} <b>${nf(Math.round(um.total))}</b>`);
  const po=SER('providers'),ph=Math.round(Math.max(...po.v.filter(v=>v!=null)));
  set('#o-prov',nf(nw.prov));dl($('#o-prov-d'),nw.prov,back('providers'),ago);
  set('#o-prov-k',`online now, in ${L.countries} countries`);
  html('#o-prov-s',`${avgLab(P)} <b>${nf(Math.round(po.total))}</b>${ph>nw.prov?`<br>highest ${unit} <b>${nf(ph)}</b>`:''}`);
  const na=netsAdded(P);set('#o-nets',cpt(L.nets));html('#o-nets-d',na?`<b class="up">+${nf(Math.round(na.added))}</b>new in the last ${plab()}`:'');
  drawPick();
});
set('#c-ctry',L.countries);set('#c-city',nf(L.cities));
function drawPick(){const c=cs.find(x=>x.c===picked);
  if(!c){html('#c-pick','<p class="note" style="margin:0;text-align:center">Search or click a country to see its stats.</p>');return}
  const rank=cs.indexOf(c)+1,sh=c.v/UR.PROV*100,ct=(UR.CONTINENTS.find(x=>x[0]===c.ct)||[,''])[1];
  html('#c-pick',`<div class="pick-h"><h3>${c.n}<span>${ct} · rank ${rank} of ${cs.length}</span></h3><button class="xp" id="c-clear" aria-label="Clear ${c.n}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div><div class="pk-figs"><div class="fig"><span class="k">Providers online</span><span class="v">${nf(c.v)}</span></div><div class="fig"><span class="k">Share of all providers</span><span class="v">${sh<0.1?sh.toFixed(2):sh.toFixed(1)}%</span></div></div>`);
  $('#c-clear').addEventListener('click',()=>pick(null))}
const pick=c=>{const k=c&&(c.c||c);picked=k&&k!==picked?k:null;drawPick()};
html('#c-list',cs.map(c=>`<option value="${c.n}">`).join(''));
// country search: exact names and common aliases pick as you type; Enter also takes a unique partial match; otherwise say so
const normC=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^the\s+/,'').replace(/\s+/g,' ').trim();
const ALIAS={usa:'US',us:'US',america:'US','united states of america':'US',uk:'GB',britain:'GB','great britain':'GB',england:'GB',turkey:'TR',turkiye:'TR',korea:'KR','republic of korea':'KR','czech republic':'CZ',holland:'NL',netherlands:'NL',uae:'AE','viet nam':'VN',russia:'RU'};
function findCountry(q,partial){const k=normC(q);if(!k)return{c:null};if(ALIAS[k])return{c:cs.find(c=>c.c===ALIAS[k])||null};const ex=cs.find(c=>normC(c.n)===k||c.c.toLowerCase()===k);if(ex||!partial)return{c:ex||null};
  const st=cs.filter(c=>normC(c.n).startsWith(k)),inc=st.length?st:cs.filter(c=>normC(c.n).includes(k));return inc.length===1?{c:inc[0]}:{c:null,many:inc.length>1}}
function searchBox(inp,msg,onPick){const run=partial=>{const q=inp.value,r=findCountry(q,partial);if(r.c){msg.textContent='';onPick(r.c);inp.blur();return}
    if(partial&&q.trim())msg.textContent=r.many?'Several countries match. Keep typing or pick one from the list.':`No country called “${q.trim().slice(0,60)}” has providers online.`;else if(!q.trim())msg.textContent=''};
  inp.addEventListener('input',()=>run(false));inp.addEventListener('change',()=>run(true));inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run(true)}})}
searchBox($('#c-search'),$('#c-search-m'),c=>{picked=c.c;drawPick();const g=$('#globe');if(g._focus)g._focus(c)});
set('#c-conc',`Top 3 countries hold ${share(3).toFixed(0)}% of providers online.`);
const regTot=UR.CONTINENTS.map(([k,n])=>[n,cs.filter(c=>c.ct===k).reduce((a,c)=>a+c.v,0)]).sort((a,b)=>b[1]-a[1]);
const regRows=regTot.map(([n,v])=>`<div class="r"><span>${n}</span><b>${(v/UR.PROV*100).toFixed(1)}%</b><span class="tr"><i style="width:${(v/regTot[0][1]*100).toFixed(1)}%"></i></span></div>`).join('');
html('#c-reg',regRows);
const uLab=()=>UR.P>3?'Users':'Users, 24 hours to then';
const mini=(id,k,kind,fmt,name,zero)=>UR.chart($(id),()=>{const s=SER(k);return{t:s.t,series:[{v:s.v,kind,color:kind==='col'?BAR:BAR_HI,name:typeof name==='function'?name():name,fmt}],hiLast:BAR_HI,now:nowPt(k),zero:zero??kind==='col',T,height:70,ml:0,noX:true,yFmt:()=>'',label:name}});
mini('#o-data-c','traffic','col',tbF,'Carried');
mini('#o-users-c','users24','area',nf,uLab,false);
mini('#o-prov-c','providers','area',nf,'Online, average',false);
mini('#o-nets-c','nets','area',nf,'Networks, all time',false);
const trafficCfg=h=>{const s=SER('traffic'),daily=UR.P>3;const ser=[{v:s.v,kind:'col',color:BAR,name:'Carried '+UR.unitLab(),fmt:tbF}];
  if(daily){const n=s.v.length,full=UR.D.traffic,Ln=full.length;ser.push({v:s.v.map((_,i)=>{const j=Ln-n+i;const w=full.slice(Math.max(0,j-6),j+1).filter(v=>v!=null);return w.length?w.reduce((a,b)=>a+b,0)/w.length:null}),kind:'line',color:AVG,name:'7-day average',fmt:tbF})}
  return{t:s.t,series:ser,hiLast:BAR_HI,now:nowPt('traffic'),T,height:h,endLabel:daily,unit:'TB',label:'Data carried'}};
const bigTraffic=(el,h)=>UR.chart(el,()=>trafficCfg(h));
set('#rt-u',nf(L.users24));set('#rt-p',nf(L.providers));set('#rt-c',L.countries);
new IntersectionObserver(([e])=>{if(e.isIntersecting){const r=$('.route');r.classList.remove('play');void r.offsetWidth;r.classList.add('play')}},{threshold:.5}).observe($('.route'));
bigTraffic($('#o-big'),250);
const cumCfg=h=>{const t=UR.D.traffic,f=t.findIndex(v=>v!=null);let c=0;const cum=t.map(v=>v==null?null:(c+=v));return{t:UR.dayT.slice(f),series:[{v:cum.slice(f),kind:'area',color:BAR_HI,name:'Total carried',fmt:tbF}],T,height:h,ml:48,unit:'TB',xFmt:fmtD,tipX:fmtDw,endLabel:h>200,label:'Total data carried'}};
{const t=UR.D.traffic,f=t.findIndex(v=>v!=null);let c=0;t.forEach(v=>{if(v!=null)c+=v});
  set('#o-cum',tbF(c));html('#o-cum-s',`since ${fmtD(UR.dayT[f])}`);
  UR.chart($('#o-cum-c'),()=>cumCfg(236))}
{const area=(k,name,fmt,label,ml,ref)=>()=>{const s=SER(k);return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:typeof name==='function'?name():name,fmt}],zero:false,trim:true,T,height:380,endLabel:true,ml:ml||56,label,ref:ref&&ref(),now:nowPt(k)}};
  const CM={users:['Daily users',plab,area('users24',uLab,nf,'Daily users',undefined,()=>UR.P===1?null:{v:dailyUsers(UR.P).total,label:avgLab(UR.P)})],prov:['Providers online',plab,area('providers','Online, average',v=>nf(Math.round(v)),'Providers online',undefined,()=>({v:SER('providers').total,label:avgLab(UR.P)}))],
    data:['Data carried',plab,()=>trafficCfg(380)],nets:['Total networks',plab,area('nets','Networks, all time',nf,'Total networks',64)],cum:['Total data carried',()=>'All recorded',()=>cumCfg(380)]};
  let cm=null,opener=null;const box=$('#cmodal');
  const named=()=>typeof cm==='string';
  UR.chart($('#cm-chart'),()=>!cm?{t:[0],series:[],T}:named()?CM[cm][2]():(g=>({...g,height:380,noX:false,...(g.ml===0?{ml:56,yFmt:undefined}:{})}))(cm._get()));
  const head=()=>{if(!cm)return;const pn=named()?null:cm.closest('.pn'),chip=pn&&pn.querySelector('.ph .chip:not(.plab)');
    const fixed=named()?cm==='cum':!pn.querySelector('.ph .plab')&&!!chip&&/days|since/i.test(chip.textContent);
    set('#cm-title',named()?CM[cm][0]:pn.querySelector('.pt').textContent);$('#cm-period').hidden=fixed;$('#cm-chip').hidden=!fixed;set('#cm-chip',named()?'All recorded':chip?chip.textContent:'');
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
UR.onChange(()=>{const daily=UR.P>3,u=UR.unitLab();const leg=`<span><i class="bar" style="background:${BAR}"></i>${u[0].toUpperCase()+u.slice(1)}</span>`+(daily?`<span><i style="background:${AVG}"></i>7-day average</span>`:`<span><i class="bar" style="background:${BAR_HI}"></i>Latest</span>`);html('#o-big-leg',leg);html('#n-leg',leg)});
UR.globe($('#globe'),{scale:.41,onPick:c=>pick(c),picked:()=>picked});
{const r=UR.D.reserve,first=r.findIndex(v=>v!=null);
  set('#s-px','$'+K.usd.toFixed(2));html('#s-px-d',`τ${K.tao.toFixed(5)}`);
  set('#s-res',UR.alpha(UR.RESERVE.alpha));set('#s-res-d',`+${nf(UR.RESERVE.inflow)} α a day`);
  {const C=S.EXTRA.conviction;if(C)set('#s-lock',nf(Math.round(C.total))+' α')}}

/* ---------- NETWORK ---------- */
bigTraffic($('#n-data'),300);
const epTB=g=>g*1.073741824/1000;
UR.onChange(()=>{const s=SER('traffic'),P=UR.P,tf=UR.tipFmt();
  html('#n-data-t',`<table class="t"><thead><tr><th>${P<=3?'Time':'Day (UTC)'}</th><th>Carried</th></tr></thead><tbody>${s.t.map((t,i)=>`<tr><td>${tf(t)}</td><td>${tbF(s.v[i])}</td></tr>`).reverse().join('')}</tbody></table>`);
  let bi=0;s.v.forEach((v,i)=>{if((v??-1)>(s.v[bi]??-1))bi=i});const bl=P===1?'hour':P===3?'6 hours':'day';
  set('#n-k1',tbF(s.total));dl($('#n-k1-d'),s.total,s.prevTotal);
  set('#n-k2-t',P===1?'Average an hour':'Average a day');set('#n-k2',P===1?Math.round(s.total*1000/24)+' GB':tbF(s.total/P));html('#n-k2-s',`<b>${gbs(s.total*8e12/(P*86400)/1e9)}</b> on average`);
  set('#n-k3-t','Busiest '+bl);const gb=v=>v<1?Math.round(v*1000)+' GB':tbF(v);set('#n-k3',gb(s.v[bi]));html('#n-k3-s',`${P<=3?UR.tipFmt()(s.t[bi]):fmtDw(s.t[bi])}<br><span class="vs">vs ${P===1?gb(s.total/24)+' in an average hour':P===3?gb(s.total/12)+' in an average 6 hours':gb(s.total/P)+' average this period'}</span>`);
  const na=netsAdded(P),np=netsAdded(P,1);html('#n-new',na?`${nf(Math.round(na.added/P))} <small>a day</small>`:'—');dl($('#n-new-d'),na&&na.added,np&&np.added);
  set('#n-tot2',nf(L.nets))});
const wkLab=`Last week, ${fmtD(EP.start-7*UR.DAY)} – ${fmtD(EP.start)}`;
// when traffic flows: the period's average day, hour by hour, in the viewer's time.
// The hourly shape comes from throughput (hourly for 90 days); it's scaled so the 24 hours add up to the period's average day of data carried.
{const TP=S.TPH,hl=h=>String(h).padStart(2,'0')+':00';
  const hod=()=>{const n=UR.P*24,v=TP.v.slice(-n),t0=TP.t0+(TP.v.length-n)*36e5,by=Array.from({length:24},()=>[]);
    v.forEach((x,i)=>{if(x!=null)by[new Date(t0+i*36e5).getHours()].push(x)});
    const av=by.map(a=>a.length?a.reduce((p,q)=>p+q,0)/a.length:null),sum=av.reduce((p,q)=>p+(q||0),0),tr=SER('traffic'),day=tr.total/UR.P*1000;
    return av.map(x=>x==null?null:x/sum*day)};
  UR.hod=hod;
  UR.onChange(()=>{const av=hod(),f=av.filter(v=>v!=null),hi=av.indexOf(Math.max(...f)),lo=av.indexOf(Math.min(...f));set('#n-hod-n',`Busiest around ${hl(hi)}, quietest around ${hl(lo)}, local time.`)});
  UR.chart($('#n-hod'),()=>({t:Array.from({length:24},(_,h)=>h),series:[{v:hod(),kind:'col',color:BAR,name:'Approx.',fmt:v=>Math.round(v)+' GB an hour'}],T,height:240,ml:56,unit:'GB',xFmt:hl,tipX:h=>`${hl(h)} to ${hl((h+1)%24)}`,label:'When traffic flows'}))}
UR.chart($('#n-tp'),()=>{const s=SER('throughput');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:'Average',fmt:gbs}],T,height:220,endLabel:true,trim:true,unit:'Gb/s',ml:66,label:'Throughput'}});
// Option B: the same 24 hours as a clock face, midnight at the top
{const el=$('#n-clock'),hl=h=>String(h).padStart(2,'0')+':00';
  const draw=()=>{const w=el.clientWidth,h=280;if(!w)return;const v=UR.hod(),mx=Math.max(...v.filter(x=>x!=null)),cx=w/2,cy=h/2,r0=46,R=Math.min(w,h)/2-26,hi=v.indexOf(mx);
    const pt=(a,r)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)],ang=i=>i/24*2*Math.PI-Math.PI/2,half=Math.PI/24*0.82;let g='';
    [.5,1].forEach(f=>{g+=`<circle cx="${cx}" cy="${cy}" r="${r0+(R-r0)*f}" fill="none" stroke="${T.grid}"/>`});
    v.forEach((x,i)=>{if(x==null)return;const r1=r0+(R-r0)*x/mx,a=ang(i)+Math.PI/24,[x1,y1]=pt(a-half,r0),[x2,y2]=pt(a-half,r1),[x3,y3]=pt(a+half,r1),[x4,y4]=pt(a+half,r0);
      g+=`<path data-h="${i}" d="M${x1},${y1}L${x2},${y2}A${r1},${r1} 0 0 1 ${x3},${y3}L${x4},${y4}A${r0},${r0} 0 0 0 ${x1},${y1}Z" fill="${i===hi?BAR_HI:BAR}"/>`});
    [0,6,12,18].forEach(i=>{const [x,y]=pt(ang(i),R+14);g+=`<text x="${x}" y="${y+4}" text-anchor="middle" fill="${T.text}" font-size="10.5" font-family="${T.font}">${hl(i)}</text>`});
    g+=`<text x="${cx}" y="${cy-4}" text-anchor="middle" fill="${T.text}" font-size="10" font-family="${T.font}">Busiest</text><text x="${cx}" y="${cy+14}" text-anchor="middle" fill="${T.strong}" font-size="15" font-weight="600" font-family="${T.font}">${hl(hi)}</text>`;
    el.innerHTML=`<svg width="${w}" height="${h}" role="img" aria-label="Average data carried in each hour of the day, as a clock">${g}</svg>`;
    el.querySelectorAll('path[data-h]').forEach(p=>{const sh=e=>{const i=+p.dataset.h;UR.showTip(`<span class="k">${hl(i)} to ${hl((i+1)%24)}</span>${UR.tipRow('Approx.',Math.round(v[i])+' GB an hour')}`,e.clientX,e.clientY)};p.addEventListener('pointermove',sh);p.addEventListener('pointerdown',sh);p.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')UR.hideTip()})})};
  el._draw=draw;new ResizeObserver(draw).observe(el);UR.onChange(draw)}
// Users (proposed): four figures across, the daily chart underneath
UR.onChange(()=>{const q=UR.P===1?7:UR.P,um=dailyUsers(q);html('#n-u2',`<div class="fig"><span class="k">Last 24 hours</span><span class="v">${nf(L.users24)}</span></div><div class="fig"><span class="k">This week so far</span><span class="v">${nf(S.EPOCH.users)}</span></div><div class="fig"><span class="k">${wkLab}</span><span class="v">${nf(S.EPOCH.prevUsers)}</span></div>`)});
UR.chart($('#n-dau2'),()=>{const s=SER('users24');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:uLab(),fmt:nf}],T,height:220,trim:true,label:'Daily users'}});
// Growth (proposed): networks added in the period, growth since its start, and how often a new one arrives
const kM=v=>v>=1e6?(v/1e6).toFixed(2)+'M':Math.round(v/1e3)+'K',kMp=(a,b)=>kM(a)===kM(b)?[nf(Math.round(a)),nf(Math.round(b))]:[kM(a),kM(b)];
UR.onChange(()=>{const P=UR.P,na=netsAdded(P);if(!na){html('#n-g','');return}const start=na.start,end=na.end,added=Math.round(na.added),sec=P*86400/added;
  html('#n-g',`<div class="fig"><span class="k">Networks added, last ${plab()}</span><span class="v">+${nf(added)}</span></div><div class="fig"><span class="k">Growth, last ${plab()}</span><span class="v">+${(added/start*100).toFixed(1)}%</span><span class="d">${kMp(start,end).join(' → ')}</span></div><div class="fig"><span class="k">A new network every</span><span class="v">${sec<60?Math.round(sec)+' seconds':(sec/60).toFixed(1)+' minutes'}</span><span class="d">on average, last ${plab()}</span></div>`)});
// total data carried, all recorded, beside the clock
{const t=UR.D.traffic,f=t.findIndex(v=>v!=null);let c=0;t.forEach(v=>{if(v!=null)c+=v});set('#n-cum-s',`Since ${fmtD(UR.dayT[f])}`);UR.chart($('#n-cum3'),()=>({...cumCfg(300),endLabel:true}))}
// clock by default; bars on request (remembered in this browser)
{const pick=v=>{$$('#hodv button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));$('#n-clock').hidden=v!=='clock';$('#n-hod').hidden=v!=='bars';(v==='bars'?$('#n-hod'):$('#n-clock'))._draw();try{localStorage.setItem('ur-hod',v)}catch(e){}};
  $$('#hodv button').forEach(b=>b.addEventListener('click',()=>pick(b.dataset.v)));let v='clock';try{v=localStorage.getItem('ur-hod')||'clock'}catch(e){}if(v!=='clock'&&v!=='bars')v='clock';if(v!=='clock')requestAnimationFrame(()=>pick(v))}
UR.chart($('#n-new-c'),()=>{const s=SER('newNets');return{t:s.t,series:[{v:s.v.map(v=>v==null?null:Math.round(v)),kind:'col',color:BAR,name:'Sign-ups '+UR.unitLab(),fmt:nf}],hiLast:BAR_HI,T,height:200,trim:true,label:'Sign-ups'}});
UR.chart($('#n-cum-c'),()=>{const s=SER('nets');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:'Total',fmt:nf}],zero:false,trim:true,T,height:200,ml:56,label:'Total networks'}});


/* ---------- PROVIDERS ---------- */
let showAll=false,vPicked=null,ctFocus=null;
function tbl(){const P=UR.P,hasChg=Object.keys(S.COUNTRY_PAST[P]||{}).length>0,rows=(showAll?cs:cs.slice(0,15)).map((c,i)=>{const g=UR.chg(c);return`<tr><td class="l">${i+1}</td><td class="l"><span class="cc">${c.c}</span>${c.n}${(UR.NEWC[P]||[]).includes(c.c)?' <span class="chip" style="color:var(--orchid);border-color:rgba(237,143,255,.4)">New</span>':''}</td><td>${nf(c.v)}</td><td>${shareTxt(c.v)}<span class="bar"><i style="width:${(c.v/UR.CMAX*100).toFixed(1)}%"></i></span></td>${hasChg?`<td class="${g==null||cls(g)==='fl'?'':cls(g)}">${UR.signed(g)}</td>`:''}</tr>`}).join('');
  html('#v-tbl',`<thead><tr><th>#</th><th class="l">Country</th><th>Online now</th><th>Share</th>${hasChg?`<th>Change, last ${plab()}</th>`:''}</tr></thead><tbody>${rows}</tbody>`);
  set('#v-all',showAll?'Show top 15':`Show all ${cs.length} countries`)}
$('#v-all').addEventListener('click',()=>{showAll=!showAll;tbl()});
set('#v-act',nf(L.providers));
UR.onChange(()=>{const P=UR.P,s=SER('providers');
  const adj={1:'24-hour',3:'3-day',7:'7-day',30:'30-day',90:'90-day'}[P];
  dl($('#v-act-d'),L.providers,s.total,`vs the ${adj} average`);
  set('#v-avg-k',`Average online, last ${plab()}`);set('#v-avg',nf(Math.round(s.total)));
  set('#v-peak-k',`Highest ${P===1?'hour':P===3?'6-hour block':'day'}, last ${plab()}`);set('#v-peak',nf(Math.round(Math.max(...s.v.filter(v=>v!=null)))));
  const last=k=>{const v=UR.series(k,'last').v.filter(x=>x!=null);return v[v.length-1]};
  // change across the period, from the first to the last point of each chart
  const since=(id,k)=>{const sr=UR.series(k,'last'),i=sr.v.findIndex(v=>v!=null),a=sr.v[i],b=[...sr.v].reverse().find(v=>v!=null),d=Math.round(b-a);
    html(id,a==null?'':`<b class="${d>0?'up':d<0?'dn':'fl'}">${d>0?'↑ +'+nf(d):d<0?'↓ −'+nf(-d):'no change'}</b>since ${P<=3?UR.fmtWhen(sr.t[i]):fmtD(sr.t[i])}`)};
  set('#v-ctry',L.countries);since('#v-ctry-d','countries');set('#v-city',nf(L.cities));since('#v-city-d','cities');tbl();drawV()});
UR.chart($('#v-prov'),()=>{const s=SER('providers');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:'Online, average',fmt:v=>nf(Math.round(v))}],zero:false,trim:true,T,height:260,label:'Providers online'}});
[['#v-ctry-c','countries'],['#v-city-c','cities']].forEach(([id,k])=>UR.chart($(id),()=>{const s=UR.series(k,'last');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:'With a provider online',fmt:nf}],zero:false,trim:true,int:true,T,height:70,ml:0,noX:true,yFmt:()=>'',label:k}}));
// country lookup: search, or click a dot on the map; clicking it again (or empty map) clears
function ctName(k){return(UR.CONTINENTS.find(x=>x[0]===k)||[,''])[1]}
function pctS(v){return v<0.01?'<0.01':v<0.1?v.toFixed(2):v.toFixed(1)}
function shareTxt(v){return pctS(v/UR.PROV*100)+'%'}
function stat(k,v,c=''){return`<div><span class="k">${k}</span><span class="v ${c}">${v}</span></div>`}
function row(c,me){return`<button class="${me?'me':''}" data-c="${c.c}"><span class="rk">#${cs.indexOf(c)+1}</span><span>${c.n}</span><b>${nf(c.v)}</b></button>`}
function drawV(){const P=UR.P,past=S.COUNTRY_PAST[P]||{},has=Object.keys(past).length>0,c=cs.find(x=>x.c===vPicked);let h='';
  const clear=lab=>`<button class="xp" id="v-clear" aria-label="Clear ${lab}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>`;
  if(c){const i=cs.indexOf(c),g=UR.chg(c),near=cs.slice(Math.max(0,Math.min(i-2,cs.length-5)),Math.max(0,Math.min(i-2,cs.length-5))+5);
    h=`<div class="lk-head"><div><h3>${c.n}</h3><span class="meta">${ctName(c.ct)} · rank ${i+1} of ${cs.length}</span></div>${clear(c.n)}</div>
      <div class="lk-stats">${stat('Providers online',nf(c.v))}${stat('Share of all',pctS(c.v/UR.PROV*100)+'%')}${has&&g!=null?stat('Change, last '+plab(),UR.signed(g),cls(g)==='fl'?'':cls(g)):stat('Continent share',pctS(c.v/cs.filter(x=>x.ct===c.ct).reduce((a,x)=>a+x.v,0)*100)+'%')}</div>
      <div><div class="lk-lab">Nearby in the ranking</div><div class="lk-list">${near.map(x=>row(x,x===c)).join('')}</div></div>`}
  else if(ctFocus){const m=cs.filter(x=>x.ct===ctFocus),v=m.reduce((a,x)=>a+x.v,0),pv=m.reduce((a,x)=>a+(past[x.c]||0),0),g=has&&pv?UR.pct(v,pv):null;
    h=`<div class="lk-head"><div><h3>${ctName(ctFocus)}</h3><span class="meta">Continent · ${m.length} ${m.length===1?'country':'countries'}</span></div>${clear(ctName(ctFocus))}</div>
      <div class="lk-stats">${stat('Providers online',nf(v))}${stat('Share of all',pctS(v/UR.PROV*100)+'%')}${g!=null?stat('Change, last '+plab(),UR.signed(g),cls(g)==='fl'?'':cls(g)):stat('Countries',m.length)}</div>
      <div><div class="lk-lab">Top countries</div><div class="lk-list">${m.slice(0,5).map(x=>row(x,false)).join('')}</div></div>`}
  else{h=`<div class="lk-head"><div><h3>Worldwide</h3><span class="meta">Search, click a dot, or open a continent</span></div></div>
      <div class="lk-stats">${stat('Providers online',nf(L.providers))}${stat('Countries',L.countries)}${stat('Cities',nf(L.cities))}</div>
      <div><div class="lk-lab">Top countries</div><div class="lk-list">${cs.slice(0,5).map(x=>row(x,false)).join('')}</div></div>`}
  html('#v-pick',h);
  const x=$('#v-clear');if(x)x.addEventListener('click',()=>{$('#v-search').value='';set('#v-search-m','');if(vPicked)vPicked=null;else ctFocus=null;ctRows();drawV();mapDraw()});
  $$('#v-pick .lk-list button').forEach(b=>b.addEventListener('click',()=>pickV(b.dataset.c)))}
function mapDraw(){const p=$('#v-map').parentElement;if(p._draw)p._draw();if(ctFocus)ctRows()}
html('#v-list',cs.map(c=>`<option value="${c.n}">`).join(''));
function pickV(code){vPicked=code;const c=code&&cs.find(x=>x.c===code);if(c&&ctFocus&&c.ct!==ctFocus)ctFocus=null;ctRows();drawV();mapDraw()}
searchBox($('#v-search'),$('#v-search-m'),c=>pickV(c.c));
UR.flatMap($('#v-map'),{land:'#45454F',focus:()=>ctFocus,onPick:c=>pickV(c&&c.c!==vPicked?c.c:null),picked:()=>vPicked,dim:c=>ctFocus&&c.ct!==ctFocus});
// continents: open one for its top 5 countries; the map dims everything else
function ctRows(){const tot=UR.CONTINENTS.map(([k,n])=>[k,n,cs.filter(c=>c.ct===k).reduce((a,c)=>a+c.v,0)]).sort((a,b)=>b[2]-a[2]);
  html('#v-regbars',tot.map(([k,n,v])=>{const open=ctFocus===k,top=cs.filter(c=>c.ct===k).slice(0,5);
    return `<button class="r rbtn" data-ct="${k}" aria-expanded="${open}"><span><span class="cv">${open?'▾':'▸'}</span>${n}</span><b>${(v/UR.PROV*100).toFixed(1)}%</b><span class="tr"><i style="width:${(v/tot[0][2]*100).toFixed(1)}%"></i></span></button>${open?`<div class="ctop">${top.map(c=>`<button class="${c.c===vPicked?'me':''}" data-c="${c.c}"><span>${c.n}</span><b>${nf(c.v)}</b></button>`).join('')}</div>`:''}`}).join(''));
  $$('#v-regbars .rbtn').forEach(b=>b.addEventListener('click',()=>{ctFocus=ctFocus===b.dataset.ct?null:b.dataset.ct;vPicked=null;ctRows();drawV();mapDraw()}));
  $$('#v-regbars .ctop button').forEach(b=>b.addEventListener('click',()=>pickV(b.dataset.c)))}
ctRows();set('#v-conc-n',`Top 3 countries hold ${share(3).toFixed(0)}% of providers online.`);

/* ---------- SN25 ---------- */
// alpha price (USD) at a moment: the hourly series where it reaches, else that day's
function pxAt(t){if(t===EP.start&&S.EXTRA.prevSettlePx)return S.EXTRA.prevSettlePx;const h=UR.hourT.findIndex(x=>x>=t);if(h>=0&&UR.Hs.price[h]!=null)return UR.Hs.price[h];const d=UR.dayT.findIndex(x=>x<=t&&t<x+UR.DAY);return d>=0&&UR.D.price[d]!=null?UR.D.price[d]:K.usd}
set('#e-h','Current epoch');
set('#e-pct',`Epoch ${EP.n}`);html('#e-left',`<b>${Math.round(EP.p*100)}%</b> complete · <b>${EP.leftTxt}</b> left · ends ${when(EP.end)}, block ${nf(S.EPOCH.endBlock)}`);
// overview: this epoch so far. Operators pay per epoch, so its users and data are what the subnet earns from
{const E=S.EPOCH,f=(k,v,d)=>`<div><span class="k">${k}</span><span class="v">${v}</span><span class="d">${d}</span></div>`;
  html('#oe-meta',`<b>Epoch ${EP.n}</b> · ${Math.round(EP.p*100)}% complete`);$('#oe-bar').style.width=(EP.p*100).toFixed(1)+'%';
  html('#oe-figs',f('Users this epoch',nf(E.users),`${nf(E.prevUsers)} in epoch ${EP.n-1}`)+f('Data carried this epoch',tbF(epTB(E.dataGiB)),`${tbF(epTB(E.prevDataGiB))} in epoch ${EP.n-1}`)+f('Time left',EP.leftTxt,'ends '+when(EP.end)))}
{const W=7*UR.DAY,eps=[];for(let n=Math.max(0,EP.n-4);n<=EP.n+1;n++){const st=n===0?EP.start-(EP.n-1)*W-UR.DAY:EP.start+(n-EP.n)*W;eps.push({n,start:st,state:n<EP.n?'done':n===EP.n?'now':'sch'})}
  html('#e-tl',eps.map(e=>`<div class="${e.state}"${e.state==='now'?` style="--p:${(EP.p*100).toFixed(1)}%"`:''}><span>E${e.n}${e.state==='now'?' · now':e.state==='sch'?' · '+fmtD(e.start):''}</span></div>`).join(''));$('#e-tl').style.gridTemplateColumns=eps.map((e,i)=>e.n===0?'minmax(max-content,1.5fr)':i===eps.length-1?'minmax(max-content,4fr)':'7fr').join(' ')}
{const H=36e5,DAY=UR.DAY,hr=(a,b)=>UR.hourT.reduce((t,x,i)=>x>a&&x<=b&&UR.Hs.traffic[i]!=null?t+UR.Hs.traffic[i]:t,0),
    dy=(a,b)=>UR.dayT.reduce((t,x,i)=>{const s0=x,e0=x+DAY,o=Math.max(0,Math.min(b,e0)-Math.max(a,s0));return UR.D.traffic[i]!=null&&o>0?t+UR.D.traffic[i]*o/DAY:t},0);
  const curTB=epTB(S.EPOCH.dataGiB),prevTB=epTB(S.EPOCH.prevDataGiB);
  const X=S.EXTRA,PEND=X.payouts&&X.payouts.pending,
    PE=(X.payouts&&X.payouts.epochs)||{},
    earn=r=>{const p=PE[r.n]||{};if(p.testing)return'<span class="muted">—</span>';if(p.paid!=null)return`${nf(Math.round(p.paid))} α <span class="muted">· $${nf(Math.round(p.paid*(r.settlePx??pxAt(r.b))))}</span>`;if(p.pending!=null)return`${nf(Math.round(p.pending))} α <span class="muted">· ${p.note||'pending'}</span>`;return X.payouts?'<span class="muted">—</span>':r.miner!=null?`${nf(Math.round(r.miner))} α <span class="muted">· $${nf(Math.round(r.miner*(r.settlePx??pxAt(r.b))))}</span>`:'<span class="muted">—</span>'},
    rows=[{n:EP.n,a:EP.start,b:null,tb:curTB,users:S.EPOCH.users,dep:X.depositAlpha,cur:true}].concat(X.epochs
      ?Object.entries(X.epochs).map(([n,e])=>({n:+n,a:e.start,b:e.end,tb:e.dataGiB!=null?epTB(e.dataGiB):null,users:e.users,dep:e.deposits??null,miner:e.miner,settlePx:e.settlePx})).sort((p,q)=>q.n-p.n)
      :[{n:EP.n-1,a:EP.start-7*DAY,b:EP.start,tb:prevTB,users:S.EPOCH.prevUsers,dep:X.prevDepositAlpha,miner:X.prevMinerAlpha}]),
    dash='<span class="muted">—</span>',
    row=r=>`<tr class="${r.n<EP.n-2?'ep-old':''}${(PE[r.n]||{}).testing?' ep-test':''}"${(PE[r.n]||{}).testing?' title="Testing epoch: providers were still paid in USDC"':''}><td class="l">${r.n}</td><td class="l">${fmtD(r.a)} – ${r.cur?'now':fmtD(r.b)}</td><td>${r.tb!=null?tbF(r.tb):dash}</td><td>${r.users!=null?nf(r.users):dash}</td><td>${r.cur?'<span class="muted">at settlement</span>':earn(r)}</td></tr>`,
    old=rows.filter(r=>r.n<EP.n-2);
  html('#e-tbl',`<thead><tr><th class="l">Epoch</th><th class="l">Dates</th><th>Data carried</th><th>Users</th><th>Earned by providers</th></tr></thead><tbody>${rows.map(row).join('')}</tbody>`);
  if(old.length&&!$('#e-more')){const lo=Math.min(...old.map(r=>r.n)),hi=Math.max(...old.map(r=>r.n)),lab=lo===hi?`epoch ${lo}`:`epochs ${lo}–${hi}`;
    $('#e-tbl').closest('.tw').insertAdjacentHTML('afterend',`<button class="more" id="e-more" aria-expanded="false" aria-controls="e-tbl">Show ${lab}</button>`);
    $('#e-more').addEventListener('click',e=>{const on=$('#e-tbl').classList.toggle('show-old');e.currentTarget.setAttribute('aria-expanded',on);e.currentTarget.textContent=(on?'Hide ':'Show ')+lab})}}
if(S.EXTRA.payouts){const X=S.EXTRA,PE=X.payouts.epochs||{},EV=X.epochs||{},ent=Object.entries(PE),
    paid=ent.reduce((a,[,p])=>a+(p.paid||0),0),usd=ent.reduce((a,[n,p])=>a+(p.paid||0)*((EV[n]||{}).settlePx??pxAt((EV[n]||{}).end??EP.start)),0),
    pend=ent.filter(([,p])=>p.pending!=null);
  set('#p-tot',nf(Math.round(paid)));html('#p-usd',`worth <b>$${nf(Math.round(usd))}</b> at settlement`);
  html('#p-pend',pend.length?`<b>${nf(Math.round(pend.reduce((a,[,p])=>a+p.pending,0)))} α</b> pending · ${pend.map(([n,p])=>`epoch ${n}, ${p.note||'pending'}`).join('; ')}`:'')}
else {const X=S.EXTRA,E=X.epochs?Object.values(X.epochs).filter(e=>e.miner!=null):[],tot=E.length?E.reduce((a,e)=>a+e.miner,0):X.prevMinerAlpha+X.minerAlpha,usd=E.length?E.reduce((a,e)=>a+e.miner*(e.settlePx??pxAt(e.end)),0):X.prevMinerAlpha*pxAt(EP.start);set('#p-tot',nf(Math.round(tot)));html('#p-usd',`worth <b>$${nf(Math.round(usd))}</b> when settled`)}
// reserve balance: its own period (7D / 30D / All); the reserve is daily and SN25 has no page-wide period
{let RP=30;const r=UR.D.reserve,n=r.length,i0=r.findIndex(x=>x!=null);
  const rd=()=>{const a=r[n-1],bi=RP?n-1-RP:-1,b=bi>=i0&&i0>=0?r[bi]:null;html('#r-d',a==null||i0<0?'':b!=null?`<b class="up">+${nf(Math.round(a-b))} α</b>in the last ${RP} days`:`<b class="up">+${nf(Math.round(a-r[i0]))} α</b>since ${fmtD(UR.dayT[i0])}`)};
  UR.chart($('#r-c'),()=>{const k=RP||n;return{t:UR.dayT.slice(-k),xFmt:fmtD,tipX:fmtDw,series:[{v:r.slice(-k),kind:'area',color:BAR_HI,name:'Balance',fmt:UR.alpha}],trim:true,T,height:390,ml:56,unit:'α',label:'Reserve balance'}});
  const pick=p=>{RP=p;$$('#r-period button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.p===p));rd();$('#r-c')._draw()};
  $$('#r-period button').forEach(b=>b.addEventListener('click',()=>pick(+b.dataset.p)));pick(RP)}
// conviction locks (chain snapshot): the team lock pinned first, the rest by size
{const C=S.EXTRA.conviction,locks=C.locks.slice().sort((a,b)=>(b.coldkey===C.team)-(a.coldkey===C.team)||b.alpha-a.alpha),cnt=f=>C.locks.filter(f).length,short=a=>a.slice(0,6)+'…'+a.slice(-4);
  set('#cv-tot',nf(Math.round(C.total))+' α');set('#cv-tot-d',`${(C.shareOfOut*100).toFixed(1)}% of alpha outstanding`);
  set('#cv-perp',nf(Math.round(C.perpetual))+' α');set('#cv-perp-d',`${cnt(l=>l.perpetual)} locks, no unlock date`);
  set('#cv-dec',nf(Math.round(C.decaying))+' α');set('#cv-dec-d',`${cnt(l=>!l.perpetual)} locks, unlocking gradually`);
  html('#cv-tbl',`<thead><tr><th class="l">Wallet</th><th>Locked</th><th>Share</th><th class="l">Type</th></tr></thead><tbody>${locks.map(l=>`<tr class="${l.coldkey===C.team?'pin':''}"><td class="l"><code title="${l.coldkey}">${short(l.coldkey)}</code>${l.coldkey===C.team?'<span class="pinl">UR team</span>':''}</td><td>${nf(Math.round(l.alpha))} α</td><td>${(l.alpha/C.total*100).toFixed(1)}%<span class="bar"><i style="width:${(l.alpha/C.total*100).toFixed(1)}%"></i></span></td><td class="l">${l.perpetual?'Perpetual':'Decaying'}</td></tr>`).join('')}</tbody>`);
  set('#cv-n',`Read from Bittensor mainnet at block ${nf(C.block)}.`)}
const RS=UR.RESERVE;set('#r-bal',nf(Math.round(RS.alpha)));
{const W=[['Reserve wallet · 2-of-3 multisig',RS.wallet,nf(Math.round(RS.alpha))+' α'],...S.EXTRA.recipients.map(r=>[`Hotkey · UID ${r.uid}`,r.hotkey,nf(Math.round(r.alpha))+' α'])];
  html('#r-wallets',W.map(([k,a,v],i)=>`${i===1?'<div class="wsub">Receives on SN25 through two hotkeys it owns</div>':''}<div class="w${i?' hk':''}"><span class="k">${k}</span>${v?`<b style="grid-column:1">${v}</b>`:''}<code title="${a}">${a.slice(0,10)}…${a.slice(-8)}</code><button class="xp" data-a="${a}" aria-label="Copy ${k} address"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M10.5 5V3.5A1.5 1.5 0 009 2H3.5A1.5 1.5 0 002 3.5V9a1.5 1.5 0 001.5 1.5H5"/></svg></button></div>`).join(''));
  $$('#r-wallets .xp').forEach(b=>b.addEventListener('click',async()=>{const k=(b.getAttribute('aria-label')||'').replace(/^Copy /,'');try{await navigator.clipboard.writeText(b.dataset.a);set('#r-copied',`Copied the ${k}.`)}catch(e){set('#r-copied','Copy is blocked here. Select the address instead.')}clearTimeout(b._t);b._t=setTimeout(()=>set('#r-copied',''),3000)}))}

/* ---------- MORE STATS ---------- */
UR.onChange(()=>{const tp=SER('throughput'),dv=SER('devices'),cn=SER('conn'),ex=UR.series('extenders','mean');
  set('#m-tp',gbs(tp.total));dl($('#m-tp-d'),tp.total,tp.prevTotal);
  set('#m-dev',nf(Math.round(dv.total)));dl($('#m-dev-d'),dv.total,dv.prevTotal);
  set('#m-conn',nf(Math.round(cn.total*1440)));dl($('#m-conn-d'),cn.total,cn.prevTotal);
  set('#m-ext-a',UR.EXT.online);{const sr=UR.series('extenders','last'),i=sr.v.findIndex(v=>v!=null),a=sr.v[i],d=a==null?null:Math.round(UR.EXT.online-a);html('#m-ext-d',d==null?'':`<b class="${d>0?'up':d<0?'dn':'fl'}">${d>0?'↑ +'+d:d<0?'↓ −'+(-d):'no change'}</b>since ${UR.P<=3?UR.fmtWhen(sr.t[i]):fmtD(sr.t[i])}`)}});
UR.chart($('#m-ext-c'),()=>{const s=UR.series('extenders','mean');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:'Online, average',fmt:v=>Math.round(v)}],zero:false,trim:true,int:true,T,height:222,label:'Extenders online'}});
UR.chart($('#m-dev-c'),()=>{const s=SER('devices');return{t:s.t,series:[{v:s.v,kind:'area',color:BAR_HI,name:'Devices, daily average',fmt:nf}],trim:true,T,height:180,label:'Connected devices'}});
UR.chart($('#m-conn-c'),()=>{const s=SER('conn');return{t:s.t,series:[{v:s.v.map(v=>v==null?null:v*1440),kind:'area',color:BAR_HI,name:'A day',fmt:v=>nf(Math.round(v))}],trim:true,T,height:180,label:'New connections a day'}});
set('#m-ext-n',UR.EXT.online);{const mx=Math.max(1,...UR.EXT.list.map(x=>x[2]));html('#m-ext',UR.EXT.list.map(([c,n,v])=>`<div class="r"><span>${n}</span><b>${v}</b><span class="tr"><i style="width:${(v/mx*100).toFixed(0)}%"></i></span></div>`).join(''))}
const ipBar=(id,lid,d)=>{const t=d.v4+d.v6+d.dual,Cc=[['IPv4 only',d.v4,BAR_HI],['Dual-stack',d.dual,'#B77FC4'],['IPv6 only',d.v6,BAR]];
  html(id,Cc.map(([k,v,c])=>`<div style="flex:${Math.max(v,t*.002)};background:${c}" title="${k}: ${nf(v)}"></div>`).join(''));html(lid,Cc.map(([k,v,c])=>`<span><i class="bar" style="background:${c}"></i>${k} ${nf(v)}</span>`).join(''))};
ipBar('#m-ipp','#m-ipp-l',UR.IPFAM);ipBar('#m-ipe','#m-ipe-l',UR.EXT);


// preview of the live page's states: ?state=loading or ?state=error
{const st=new URLSearchParams(location.search).get('state');$$('#st a').forEach(a=>a.setAttribute('aria-current',(a.dataset.s||'')===(st||'')?'page':'false'));
  if(st==='loading')document.body.classList.add('is-loading');
  if(st==='error'){document.body.classList.add('is-error');const blank=()=>{$$('section[data-tab] :is(.big,.mid,.fig .v,.lk-stats .v,.kv dd,.rows b),#nowroute .rn b,.livebar .it b,#nr-live').forEach(e=>e.textContent='—');
      $$('section[data-tab] :is(.dl,.sub),#o-cum-s,#c-conc,#cv-n').forEach(e=>e.textContent='');$('#upd').classList.add('err');set('#upd','Couldn’t reach the stats source. Trying again in 1 min.')};UR.onChange(blank);setInterval(blank,1000)}}
$$('section[data-tab="method"] .pn>.ph .pt').forEach(h=>{const t={Network:'network',Providers:'providers',SN25:'subnet','More stats':'more'}[h.textContent.trim()],i=t&&$(`.nav button[data-t="${t}"] svg`);if(i){const c=i.cloneNode(true);c.classList.add('ico');c.setAttribute('aria-hidden','true');h.prepend(c)}});
$$('section[data-tab] .pn').forEach(pn=>{if(pn.querySelector('.xp'))return;const ch=[...pn.querySelectorAll('div')].find(d=>d._get);const ph=pn.querySelector(':scope > .ph');if(!ch||!ph)return;
  let tags=ph.querySelector(':scope > .tags');if(!tags){tags=document.createElement('div');tags.className='tags';[...ph.children].slice(1).forEach(c=>tags.appendChild(c));ph.appendChild(tags)}
  const b=document.createElement('button');b.className='xp';b.setAttribute('aria-label',`Expand the ${ph.querySelector('.pt').textContent} chart`);
  b.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9"/></svg>';b.addEventListener('click',()=>UR.openChart(ch,b));ch.classList.add('zoomable');ch.addEventListener('click',()=>UR.openChart(ch,b));tags.appendChild(b)});
let start=(location.hash||'').slice(1);show(Object.hasOwn(PAGES,start)?start:'overview');
})();
