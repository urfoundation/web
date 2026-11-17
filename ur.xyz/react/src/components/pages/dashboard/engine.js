/* UR stats dashboard engine: the period engine (1D/3D/7D/30D/90D), formatting, tooltip, chart, globe and map helpers.
   Reads window.SNAP, built from live sources by loader.js (react/src/lib/dashboardData.js), and window.UR_I18N, the
   page's language: its copy (t: unit dashboard/script, page: unit dashboard; react/src/i18n/pages/dashboard/) and
   format.js's interpolate and plural. English keeps its own number and date formats; other languages use Intl.
   SNAP holds what has answered so far: a part that failed is null or empty (dashboardData.js assembleLive), and the
   loader merges each later answer into it and calls UR.refresh(), which derives again what follows from it and
   draws every part of the page again. Nothing here throws for a missing part (UR.run). */
(function(){
'use strict';
const UR=window.UR={};
// a drawing step that fails is reported and skipped: it never stops the page's other parts
const run=UR.run=f=>{try{f()}catch(e){console.error('dashboard:',e)}};
const I=window.UR_I18N,EN=UR.EN=I.lang==='en',LOC=I.locale;
const TX=UR.TX=I.t,PG=UR.PG=I.page;
const esc=UR.esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
UR.f=(s,v)=>I.interpolate(s,v);                         // a template's {placeholders} filled, as text
UR.h=(s,v)=>I.interpolate(esc(s),v);                    // the same as markup: the values are markup
UR.pl=(forms,n,o)=>I.plural(forms,n,o);                 // a plural node's form for n (o: Intl.PluralRules options)
UR.THEME={acc:'#87FB67',rgb:'135,251,103',alt:'#ED8FFF',tint:'#131A15'};
const LAND={"step": 1.5, "lat0": 83.25, "cols": 240, "rows": ["000000000000000000000003fe0000000000000000000000000000000000", "000000000000001ffff3ffffff8e00000000000000000000000000000000", "00000000000000fc7f9ffffffff000000fc00180000007c0000000000000", "0000000000043b7bf87fffffffe00000f80000000000001c000000000000", "0000000000c00007e03fffffffe00000700000000000000c000000000000", "00000000003d8e308000ffffffe0000000000001e00003fff0000f000000", "000000000700000000003fffffc000000000000600003fff800000000000", "0000000007bacecfc0001fffff800000000000180303fffffffc06000000", "c0010000023fc0cfff0007f8007fffffffffff1c077ffffffffcfff80000", "001fffc0f23ffac10fe00fffff00000007fc0000877fffffffffffffc07c", "3f800000000f3c867e1ff8000fffffffc00039c804400000000000000000", "13f00000000000007e01f0007fffffff80001c0000800000000000000000", "e780000000000002f01bf807ff81ffff0381e00000000000000000000000", "0007fffffffffff360f803f800300003f9fffffffffffffffffffffffffe", "003fffffffffffc08e3001f00000000ff3fffffffffffffffffffffffbfc", "003ffbffffffff800fc000600000001ff3ffffffffffffffffffffff07c0", "000f801fffffff800fcc00000000000ff0ffffffffffffffffffff261800", "00014001ffffffc007fe000000000800e0fffffffffffffffffff8007000", "00040000fffffffc07fe000000000c06e3fffffffffffffffffff000f800", "002000007fffffff9fffc0000000160217ffffffffffffffffffc000f000", "000000013fffffff9fffe0000000371ffffffffffffffffffffffe00e000", "000000001fffffffdfffc0000000079ffffffffffffffffffffffe008000", "000000001ffffffffff3000000000c7ffffffffffffffffffffffd000000", "000000000fffffffffd87000000005fffffffffffffffffffffff8000000", "0000000007fffffffff80800000003fffffffffffffffffffffff8000000", "0000000007ffffffffff0000000001fffff27f1ffffffffffffff0000000", "0000000007ffffffffc80000000001ff3fe03e3fffffffffffffe3000000", "0000000007ffffffff80000000003fc18fe00f1fffffffffffff07000000", "0000000007ffffffff00000000003f8067e79f8ffffffffffffc00000000", "0000000007fffffffe00000000003f00263fff8fffffffffff5806000000", "0000000003fffffffc00000000003f00233fff8ffffffffffe1c04000000", "0000000001fffffff800000000000e2e003fffffffffffffff8c1c000000", "0000000001fffffff800000000000dfe00c2ffffffffffffff0cfc000000", "00000000007ffffff000000000001ffe0000ffffffffffffff00e0000000", "00000000003fffffc000000000003fffc601ffffffffffffff8100000000", "000000000017ffffc000000000003ffff7ffffffffffffffff8000000000", "000000000017ff904000000000007fffffffff3fffffffffff8000000000", "00000000001bfe00400000000001fffffffcff9fffffffffff8000000000", "000000000005fe00680000000003fffffffeff87ffffffffff0000000000", "000000000004fe00000000000003fffffffe7fcc07fffffffe0000000000", "0000000000007e00000000000007ffffffff3ffe03fffffffc8000000000", "0000000000003e00100000000007ffffffffbfff03ffe7ffe00000000000", "0000000000003e0c0e0000000007ffffffff9ffe007fc3fe000000000000", "0000000000001f1c00c000000007ffffffff9ffc007f01fec00000000000", "00000000000007f8000000000007ffffffffcff8007e01fe00c000000000", "000000000000013f000000000007ffffffffcfe0007c017f008000000000", "000000000000001f800000000007fffffffff7800038007f808000000000", "0000000000000003000000000007fffffffffc000038003f802000000000", "0000000000000001014000000003fffffffff8c000180007005000000000", "0000000000000000837e00000001ffffffffffc000180002000000000000", "00000000000000004fff00000001ffffffffff8000040060003000000000", "00000000000000000fff80000000ffffffffff8000040010001000000000", "00000000000000000ffff80000003f1fffffff0000000098060000000000", "000000000000000007fffc0000000003ffffff00000000d80c0000000000", "00000000000000000ffffc0000000003fffffe00000000683e0000000000", "00000000000000001ffffe0000000003fffff800000000387ee400000000", "00000000000000003fffff8000000003fffff000000000187c0480000000", "00000000000000003fffffc000000003ffffe0000000001c7d8058000000", "00000000000000003ffffffc00000001ffffe0000000000e08487f000000", "00000000000000003fffffff00000000ffffc0000000000600000f800000", "00000000000000003fffffff80000000ffffc0000000000320004fc08000", "00000000000000001fffffff800000007fffc0000000000038000f602000", "00000000000000000fffffff000000007fffe00000000000002000300000", "00000000000000000ffffffe000000007fffe00000000000000000000000", "000000000000000007fffffe000000007fffe000000000000001e1000000", "000000000000000007fffffc00000000ffffe08000000000000be3000000", "000000000000000003fffffc00000000ffffe1c000000000001fe3800000", "000000000000000000fffffc00000000ffff878000000000003ffb800000", "0000000000000000007ffffc00000000ffff078000000000007fffc00000", "0000000000000000007ffff8000000007ffe03000000000001ffffe00400", "0000000000000000007ffff8000000007fff07000000000007fffff00200", "0000000000000000007fffe0000000003fff0700000000000ffffff80000", "0000000000000000007fff00000000003ffe0600000000000ffffffc0000", "0000000000000000007fff00000000003ffc0000000000000ffffffc0000", "0000000000000000007fff00000000003ffc0000000000000ffffffc0000", "000000000000000000fffe00000000001ff800000000000007fffffc0000", "000000000000000000fffc00000000000ff000000000000007fffffc0000", "000000000000000000fff800000000000fe000000000000007f87ffc0000", "000000000000000000fff000000000000f8000000000000007e02ff80000", "000000000000000000ffc00000000000000000000000000000000ff00010", "000000000000000001ffc000000000000000000000000000000007f00008", "000000000000000001ff800000000000000000000000000000000340000e", "000000000000000001fe000000000000000000000000000000000000000c", "000000000000000001f80000000000000000000000000000000000600008", "000000000000000001f80000000000000000000000000000000000600030", "000000000000000003f000000000000000000000000000000000000000c0", "000000000000000003e000000000000000000000000000000000000001c0", "000000000000000003f00000000000000000000000000000000000000000", "000000000000000003e00000000000000000000000000000000000000000", "000000000000000003c00000000000000000000000000000000000000000", "000000000000000003c18000000000000000000000000000000000000000", "000000000000000001e00000000000000000000000000000000000000000", "000000000000000000f80000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000"]};

/* ---------- helpers ---------- */
const $=UR.$=(s,r=document)=>r.querySelector(s);
const $$=UR.$$=(s,r=document)=>[...r.querySelectorAll(s)];
const DPR=UR.DPR=Math.min(2,window.devicePixelRatio||1);
const RM=UR.RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const H=36e5, DAY=UR.DAY=864e5;
const NF={},numF=UR.numF=o=>{const k=JSON.stringify(o);return NF[k]||(NF[k]=new Intl.NumberFormat(LOC,o))};
const DF={},dtF=o=>{const k=JSON.stringify(o);return DF[k]||(DF[k]=new Intl.DateTimeFormat(LOC,o))};
const UNITS={TB:'terabyte',PB:'petabyte',GB:'gigabyte','Gb/s':'gigabit-per-second'};
// a figure the page doesn't have (its read failed or hasn't answered) prints as a dash
const NO='—',no=v=>v==null||!isFinite(v);
const nf=UR.nf=n=>no(n)?NO:EN?Math.round(n).toLocaleString('en-US'):numF({maximumFractionDigits:0}).format(Math.round(n));
// a number with d decimals; with a unit (TB, GB, Gb/s, or a symbol such as α), in Intl's narrow form if `narrow`, as the
// charts' axes write it; a percentage (v in %); a price in US$
// (loader.js usd: Intl's, and in Spanish "US$1,97", since a bare "$" also means pesos there)
const fx=UR.fx=(v,d)=>no(v)?NO:EN?v.toFixed(d):numF({minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
const un=UR.un=(v,d,u,narrow)=>no(v)?NO:EN?v.toFixed(d)+' '+u:UNITS[u]?numF({style:'unit',unit:UNITS[u],unitDisplay:narrow?'narrow':'short',minimumFractionDigits:d,maximumFractionDigits:d}).format(v):fx(v,d)+' '+u;
// whether the Overview's data carried figure, on a card a quarter of the row wide, writes its unit's narrow form: in
// Arabic only, whose short terabyte is the whole word (تيرابايت) and ran past the card at desktop widths; its narrow
// form is ت.ب, as the axes write it (elsewhere the narrow form is the short one, or drops the space: "10,8TB")
UR.NARROW_CARD=I.lang==='ar';
UR.pc=(v,d)=>no(v)?NO:EN?v.toFixed(d)+'%':numF({style:'percent',minimumFractionDigits:d,maximumFractionDigits:d}).format(v/100);
UR.usd=v=>no(v)?NO:EN?'$'+v.toFixed(2):I.usd(v);
// a chart's number outside English: d decimals at most, compact (12K) or fixed, with the chart's unit (narrow: the
// axis's shortest form, which keeps a long unit name such as Arabic's terabyte inside the chart's margin)
const qn=(v,d,compact,u,narrow)=>{const o=compact?{notation:'compact',maximumFractionDigits:d}:{minimumFractionDigits:d,maximumFractionDigits:d};if(UNITS[u])Object.assign(o,{style:'unit',unit:UNITS[u],unitDisplay:narrow?'narrow':'short'});const s=numF(o).format(v);return u&&!UNITS[u]?s+' '+u:s};
const cpt=UR.cpt=(n,d=1)=>{if(no(n))return NO;const a=Math.abs(n);if(!EN)return a>=1e3?numF({notation:'compact',maximumFractionDigits:a>=1e6?2:d}).format(n):numF({maximumFractionDigits:1}).format(Math.round(n*10)/10);return a>=1e6?(n/1e6).toFixed(2)+'M':a>=1e3?(n/1e3).toFixed(d)+'K':String(Math.round(n*10)/10)};
const fmtD=UR.fmtD=t=>EN?new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).replace('Sept','Sep'):dtF({day:'numeric',month:'short',timeZone:'UTC'}).format(t);
const fmtDw=UR.fmtDw=t=>EN?new Date(t).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).replace('Sept','Sep'):dtF({weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(t);
/* times of day follow the visitor's clock (or UTC); daily totals stay UTC days, as the source reports them */
UR.TZ='local';
const tzo=()=>UR.TZ==='utc'?'UTC':undefined;
const hh=UR.hh=t=>EN?new Date(t).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:tzo()}):dtF({hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:tzo()}).format(t);
const fmtDwT=UR.fmtDwT=t=>EN?new Date(t).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:tzo()}).replace('Sept','Sep'):dtF({weekday:'short',day:'numeric',month:'short',timeZone:tzo()}).format(t);
UR.fmtWhen=t=>EN?fmtDwT(t)+', '+hh(t):dtF({weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:tzo()}).format(t);
// the visitor's time zone's short name ("CET"), or null
UR.tzName=()=>{try{return new Intl.DateTimeFormat(EN?'en-GB':LOC,{timeZoneName:'short'}).formatToParts(new Date()).find(p=>p.type==='timeZoneName').value}catch(e){return null}};
UR.tb=v=>v>=1000?(v/1000).toFixed(2)+' PB':v>=100?v.toFixed(0)+' TB':v>=10?v.toFixed(1)+' TB':v.toFixed(2)+' TB';
UR.pct=(a,b)=>b?(a/b-1)*100:0;
UR.signed=(v,d=1)=>v==null||!isFinite(v)?'—':EN?(v>=0?'+':'−')+Math.abs(v).toFixed(d)+'%':numF({style:'percent',signDisplay:'always',minimumFractionDigits:d,maximumFractionDigits:d}).format(v/100);
UR.alpha=v=>no(v)?NO:nf(v)+' α';
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=rng(3141);const noise=a=>1+(R()-.5)*a;
function niceStep(v){const p=10**Math.floor(Math.log10(v)),f=v/p;return(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p}
const scaleY=UR.scaleY=(max,min=0,n=4)=>{const st=niceStep(Math.max(1e-9,(max-min)/n));const lo=Math.floor(min/st)*st,top=Math.ceil(max/st)*st;const t=[];for(let v=lo;v<=top+st*1e-6;v+=st)t.push(+v.toFixed(8));return{lo,top,ticks:t}};
const colPath=UR.colPath=(x,y,w,h,r)=>{if(h<=0.4)return'';r=Math.min(r,w/2,h);return`M${x},${y+h}V${y+r}Q${x},${y} ${x+r},${y}H${x+w-r}Q${x+w},${y} ${x+w},${y+r}V${y+h}Z`};
const RO=new ResizeObserver(es=>es.forEach(e=>{if(e.target._draw)run(e.target._draw)}));
UR.bindDraw=(el,fn)=>{el._draw=fn;RO.observe(el);run(fn)};
// Whether the panel holding `el` has its data (`ok`), and if not, what it shows instead (page.css .pn.na): its title
// and a short note, the chain's own (chain) when what it lacks is read from Bittensor mainnet, which the visitor's
// network may not reach, else the page's. `wait`: not yet, the read is still on its way (its figures shimmer, .wait),
// as every panel's is while Grafana's first reads are still out (SNAP.LOADING). Returns ok, so a part can draw only
// when there is something to draw.
UR.need=(el,ok,{chain=false,wait=false}={})=>{const pn=el&&el.closest('.pn');ok=!!ok;if(!pn)return ok;
  if(!chain&&window.SNAP.LOADING)wait=true;
  pn.classList.toggle('na',!ok&&!wait);pn.classList.toggle('wait',!ok&&wait);
  if(ok||wait)delete pn.dataset.na;else pn.dataset.na=chain?TX.chainUnavailable:TX.unavailable;
  return ok};

/* ---------- time base ---------- */
// The time base is the moment the page read its data: a later answer adds to it, never moves it on. The last full day
// (UR.END) can still move, once the days the history file lacks are read; dayT and hourT are kept in place (loader.js).
const S=window.SNAP;                                  // real snapshot: see mvp-data.js
const NOW=UR.NOW=S.NOW;
const dayT=UR.dayT=S.dayT, ND=dayT.length, hourT=UR.hourT=S.hourT, NH=hourT.length;
const LAUNCH=UR.LAUNCH=Date.UTC(2026,7,28);
const D=UR.D=S.D, Hs=UR.Hs=S.Hs;
const GEO={US:[39.5,-98.4,'NA'],FR:[46.6,2.4,'EU'],DE:[51.1,10.4,'EU'],GB:[53.0,-1.8,'EU'],VN:[15.9,105.8,'AS'],BR:[-12.0,-51.9,'SA'],ES:[40.2,-3.6,'EU'],IT:[42.8,12.6,'EU'],CA:[50.5,-96,'NA'],TH:[15.1,101.0,'AS'],NL:[52.2,5.5,'EU'],RU:[55.7,40.0,'EU'],IN:[21.0,78.5,'AS'],SG:[1.35,103.8,'AS'],KR:[36.4,127.9,'AS'],JP:[36.5,138.5,'AS'],PH:[12.5,122.5,'AS'],HK:[22.3,114.2,'AS'],SE:[60.5,15.5,'EU'],CN:[33.0,104.0,'AS'],AT:[47.6,14.1,'EU'],MX:[23.6,-102.5,'NA'],AU:[-25.7,134.5,'OC'],RO:[45.9,25.0,'EU'],ID:[-2.5,117.0,'AS'],UA:[49.0,31.4,'EU'],FI:[63.0,26.0,'EU'],TR:[39.0,35.2,'AS'],ZA:[-29.0,24.7,'AF'],KH:[12.7,105.0,'AS'],PL:[52.0,19.4,'EU'],BG:[42.7,25.3,'EU'],KZ:[48.0,67.0,'AS'],CH:[46.8,8.2,'EU'],BD:[23.7,90.3,'AS'],CZ:[49.8,15.5,'EU'],AR:[-34.6,-64.0,'SA'],PT:[39.6,-8.0,'EU'],NG:[9.1,8.7,'AF'],IE:[53.2,-8.0,'EU'],LT:[55.2,23.9,'EU'],HU:[47.2,19.5,'EU'],CO:[4.6,-74.0,'SA'],CL:[-33.5,-70.6,'SA'],MY:[3.9,102.0,'AS'],TW:[23.7,121.0,'AS'],BE:[50.6,4.6,'EU'],NO:[61.0,8.5,'EU'],DK:[56.0,10.0,'EU'],GR:[39.0,22.0,'EU'],IL:[31.4,35.0,'AS'],AE:[24.0,54.0,'AS'],EG:[26.8,30.8,'AF'],KE:[0.2,37.9,'AF'],PK:[30.0,70.0,'AS'],NZ:[-41.0,174.0,'OC'],MA:[31.8,-7.0,'AF'],RS:[44.0,21.0,'EU'],PE:[-9.2,-75.0,'SA'],SA:[24.0,45.0,'AS'],LK:[7.9,80.7,'AS'],LV:[56.9,24.6,'EU'],BI:[-3.4,29.9,'AF'],SI:[46.1,14.9,'EU'],BW:[-22.3,24.7,'AF'],SK:[48.7,19.7,'EU'],EE:[58.6,25.0,'EU'],MK:[41.6,21.7,'EU'],HR:[45.1,15.2,'EU'],MD:[47.4,28.4,'EU'],SC:[-4.7,55.5,'AF'],ML:[17.6,-4.0,'AF'],CY:[35.1,33.4,'AS'],GE:[42.3,43.4,'AS'],IR:[32.4,53.7,'AS'],LA:[19.9,102.5,'AS'],IQ:[33.2,43.7,'AS'],PA:[8.5,-80.8,'NA'],IS:[64.9,-19.0,'EU'],LU:[49.8,6.1,'EU'],AL:[41.2,20.2,'EU'],BH:[26.0,50.6,'AS'],BY:[53.7,28.0,'EU'],KG:[41.2,74.8,'AS'],AD:[42.5,1.6,'EU'],BA:[43.9,17.7,'EU'],KY:[19.3,-81.3,'NA'],DO:[18.7,-70.2,'NA'],GF:[3.9,-53.1,'SA'],PF:[-17.7,-149.4,'OC'],LB:[33.9,35.9,'AS'],MT:[35.9,14.4,'EU'],NP:[28.4,84.1,'AS'],OM:[21.5,55.9,'AS'],PY:[-23.4,-58.4,'SA'],PR:[18.2,-66.6,'NA'],QA:[25.4,51.2,'AS'],TT:[10.7,-61.2,'NA'],UG:[1.4,32.3,'AF'],DZ:[28.0,2.6,'AF'],AM:[40.1,45.0,'AS'],AZ:[40.3,47.6,'AS'],BN:[4.5,114.7,'AS'],GH:[7.9,-1.0,'AF'],JM:[18.1,-77.3,'NA'],LI:[47.16,9.55,'EU'],MO:[22.2,113.55,'AS'],SM:[43.94,12.46,'EU']};
UR.CONTINENTS=['NA','EU','AS','SA','AF','OC'].map(k=>[k,TX.continents[k]]);
UR.OTHER={n:0,v:0};
// what follows from SNAP, again on each UR.refresh(); these four are filled in place, so the page may hold them
const LIVE=UR.LIVE={},COUNTRIES=UR.COUNTRIES=[],EP=UR.EP={},TOKEN=UR.TOKEN={};
UR.ver=0;let ckey=null;
function derive(){
  UR.END=S.END;                                       // 00:00 UTC of the last complete day
  D.reserve=D.reserve.map((v,i,a)=>v==null&&a[i-1]!=null&&a[i+1]!=null?(a[i-1]+a[i+1])/2:v);   // fill a day the daily chain sample skipped
  Object.assign(LIVE,S.LIVE);
  // the countries with providers online now (none until Grafana's panel 33 answers); UR.ver counts their changes
  const ck=JSON.stringify(S.COUNTRY_NOW);if(ck!==ckey){ckey=ck;UR.ver++}
  COUNTRIES.splice(0,COUNTRIES.length,...Object.entries(S.COUNTRY_NOW).map(([c,v])=>{const g=GEO[c]||[null,null,'XX'];return EN?{c,n:S.COUNTRY_NAMES[c]||c,la:g[0],lo:g[1],ct:g[2],v}:{c,n:I.region(c)||S.COUNTRY_NAMES[c]||c,en:S.COUNTRY_NAMES[c],la:g[0],lo:g[1],ct:g[2],v}}).sort((a,b)=>b.v-a.v));
  UR.PROV=COUNTRIES.reduce((a,c)=>a+c.v,0);UR.CMAX=COUNTRIES.length?COUNTRIES[0].v:0;
  UR.IPFAM=S.IPFAM;UR.EXT=EN||!S.EXT.list?S.EXT:{...S.EXT,list:S.EXT.list.map(([c,n,v])=>[c,I.region(c)||n,v])};
  /* SN25: the epoch is the stats feed's (none without it) */
  for(const k of Object.keys(EP))delete EP[k];
  const E0=S.EPOCH;
  // its progress and time left by the clock: the stats feed can answer minutes after the page read the rest
  if(E0){const now=Date.now();Object.assign(EP,{n:E0.n,start:E0.start,end:E0.end,now});
    EP.p=(now-EP.start)/(EP.end-EP.start);EP.days=(now-EP.start)/DAY;
    const lm=Math.max(0,Math.floor((EP.end-now)/6e4)),lh=Math.floor(lm/60),p2=x=>String(x).padStart(2,'0');EP.leftTxt=lh>=24?UR.f(TX.time.leftDays,{days:Math.floor(lh/24),hours:p2(lh%24)}):UR.f(TX.time.leftHours,{hours:lh,minutes:p2(lm%60)})}
  const px=(a,b)=>a==null||b==null?null:UR.pct(a,b);
  Object.assign(TOKEN,S.TOKEN,{d24:px(Hs.price[NH-1],Hs.price[NH-25]),d7:(()=>{const p=D.price.filter(v=>v!=null);return p.length>7?px(Hs.price[NH-1],p[p.length-8]):null})()});
  // the reserve, its emission and its routing are Bittensor mainnet's: null while the page can't read it
  UR.RESERVE=S.RESERVE&&S.EMISSION&&S.ROUTING?{alpha:S.RESERVE.alpha,inflow:S.EMISSION.minerPerDay*S.ROUTING.reserve,minerPerDay:S.EMISSION.minerPerDay,share:S.ROUTING.reserve,
    programs:[['Regional Pre-Install','Network coverage','In preparation'],['Additional exit coverage for an existing operator','Network coverage','Indicative'],['Reliability on existing operator routes','Route reliability','Indicative'],['Provider capacity for a second operator','Operator onboarding','Indicative']],
    wallet:S.RESERVE.wallet}:null;
  UR.NEWC={};[1,3,7,30,90].forEach(P=>{const past=S.COUNTRY_PAST[P]||{};UR.NEWC[P]=Object.keys(past).length?COUNTRIES.filter(c=>!past[c.c]).map(c=>c.c):[]});
  // the last 24 hours carried (the Data carried card), spread per second, while they end in the last hours (the newest
  // hour or two can still be empty; without panel 1's 24-hour sum the last 72 are); else the last full day; 0 without either
  UR.BPS=(()=>{const h=Hs.traffic;let e=h.length-1;while(e>=0&&h[e]==null)e--;const a=h.slice(Math.max(0,e-23),e+1).filter(v=>v!=null);return a.length===24&&e>=NH-3?a.reduce((x,y)=>x+y,0):(D.traffic[ND-1]||0)})()*1e12/86400;
}
run(derive);

/* ---------- period engine ---------- */
UR.PERIODS={1:{k:PG.periods.d1,lab:TX.periodLength.d1,bucket:1},3:{k:PG.periods.d3,lab:TX.periodLength.d3,bucket:6},7:{k:PG.periods.d7,lab:TX.periodLength.d7,bucket:24},30:{k:PG.periods.d30,lab:TX.periodLength.d30,bucket:24},90:{k:PG.periods.d90,lab:TX.periodLength.d90,bucket:24}};
UR.P=7; UR.ORG='all'; UR.subs=[]; UR.parts=[];
UR.onChange=f=>{UR.subs.push(f);run(f)};
UR.setP=p=>{UR.P=p;UR.subs.forEach(run)};
UR.setOrg=o=>{UR.ORG=o;UR.subs.forEach(run)};
// a part of the page drawn from the data alone (not the period): now, and again on each refresh
UR.part=f=>{UR.parts.push(f);run(f)};
// more data has arrived (loader.js merged it into SNAP): derive again, and draw every part and chart again; the focus,
// if the redraw took its element away, goes to the same chart or to the element with the same id
UR.refresh=()=>{const a=document.activeElement,box=a&&a!==document.body&&a.closest?a.closest('[id]'):null,svg=a&&a.tagName==='svg';
  run(derive);UR.parts.forEach(run);UR.subs.forEach(run);
  if(box&&!a.isConnected){const b=document.getElementById(box.id),f=b&&(svg?b.querySelector('svg'):b);if(f&&f.focus)f.focus({preventScroll:true})}};
// the period's step: an hour (1D), 6 hours (3D) or a day; names the copy's per-step strings
UR.bucketKey=()=>({1:'hour',3:'sixHours'})[UR.P]||'day';
UR.windowLab=()=>{const P=UR.P;if(P<=3){return `${fmtDwT(NOW-P*DAY)}, ${hh(NOW-P*DAY)} to ${fmtDwT(NOW)}, ${hh(NOW)}`}return `${fmtD(UR.END-(P-1)*DAY)} to ${fmtD(UR.END)}, the last full day`};
// series(key, agg) -> {t, v, total, prevTotal}. agg: 'sum' | 'mean' | 'last'
UR.series=(key,agg,P=UR.P)=>{
  const hourly=P<=3, src=hourly?Hs[key]:D[key], T=hourly?hourT:dayT, n=hourly?P*24:P, b=hourly?UR.PERIODS[P].bucket:1;
  const L=src.length, cur=src.slice(L-n), prev=src.slice(L-2*n,L-n), ct=T.slice(L-n);
  const red=a=>{const f=a.filter(v=>v!=null);if(!f.length)return null;return agg==='sum'?f.reduce((x,y)=>x+y,0):agg==='mean'?f.reduce((x,y)=>x+y,0)/f.length:f[f.length-1]};
  const t=[],v=[];for(let i=0;i<n;i+=b){t.push(ct[Math.min(n-1,i+b-1)]);v.push(red(cur.slice(i,i+b)))}
  return{t,v,total:red(cur),prevTotal:red(prev),hourly,bucket:b};
};
UR.xFmt=()=>{const P=UR.P;return P===1?hh:P===3?(t=>EN?new Date(t).toLocaleDateString('en-GB',{weekday:'short',timeZone:tzo()})+' '+hh(t):dtF({weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:tzo()}).format(t)):fmtD};
UR.tipFmt=()=>{const P=UR.P,b=UR.PERIODS[P].bucket;if(P>3)return fmtDw;return t=>{const a=t-b*H,same=fmtDwT(a)===fmtDwT(t);return (same?UR.f(TX.time.sameDay,{day:fmtDwT(a),from:hh(a),to:hh(t)}):UR.f(TX.time.twoDays,{fromDay:fmtDwT(a),from:hh(a),toDay:fmtDwT(t),to:hh(t)}))+(UR.TZ==='utc'?' UTC':'')}};
UR.chg=c=>{const p=(S.COUNTRY_PAST[UR.P]||{})[c.c];return p?UR.pct(c.v,p):null};

/* ---------- tooltip ---------- */
let tip;
UR.showTip=(html,x,y)=>{if(!tip){tip=document.createElement('div');tip.id='tip';tip.setAttribute('role','status');document.body.appendChild(tip)}
  tip.innerHTML=html;tip.classList.add('on');const r=tip.getBoundingClientRect();let L=x+16,T=y-r.height-12;if(L+r.width>innerWidth-8)L=x-r.width-16;if(T<8)T=y+18;tip.style.left=Math.max(8,L)+'px';tip.style.top=T+'px'};
UR.hideTip=()=>{if(tip)tip.classList.remove('on')};
{let tt;addEventListener('scroll',UR.hideTip,{passive:true,capture:true});addEventListener('pointercancel',UR.hideTip,true);
  addEventListener('pointerdown',e=>{clearTimeout(tt);if(!(e.target.closest&&e.target.closest('svg,canvas')))UR.hideTip()},true);
  addEventListener('pointerup',e=>{if(e.pointerType!=='mouse'){clearTimeout(tt);tt=setTimeout(UR.hideTip,2000)}},true)}
UR.tipRow=(k,v,c)=>`<div class="row"><span>${c?`<i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c};margin-right:6px"></i>`:''}${k}</span><span class="v">${v}</span></div>`;

/* ---------- chart: columns (optionally stacked) and lines on ONE y scale; nulls break lines ---------- */
UR.chart=(el,get)=>{
  function draw(){
    const w=el.clientWidth;if(!w)return;const o=get();
    const T=o.T,h=o.height||220,SP=h<=90,EL=o.endLabel&&w>=480,m={l:o.ml??52,r:EL?84:12,t:o.endLabel&&!EL?24:14,b:o.noX?6:24};if(w-m.l-m.r<40)return;
    if(o.trim){let f=0;while(f<o.t.length-1&&o.series.every(q=>q.v[f]==null))f++;if(f){o.t=o.t.slice(f);o.series=o.series.map(q=>({...q,v:q.v.slice(f)}))}}
    if(o.now&&o.now.v!=null){o.t=o.t.concat(o.now.t);o.series=o.series.map((q,k)=>({...q,v:q.v.concat(k===0?o.now.v:null)}))}
    const n=o.t.length,cols=o.series.filter(q=>q.kind==='col'),lines=o.series.filter(q=>q.kind!=='col');
    const stackTop=i=>o.stack?cols.reduce((a,q)=>a+(q.v[i]||0),0):Math.max(0,...cols.map(q=>q.v[i]||0));
    let mx=0,mn=Infinity;for(let i=0;i<n;i++){mx=Math.max(mx,stackTop(i));lines.forEach(q=>{if(q.v[i]!=null){mx=Math.max(mx,q.v[i]);mn=Math.min(mn,q.v[i])}})}
    const RF=!SP&&o.ref&&o.ref.v!=null&&isFinite(o.ref.v)?o.ref:null;if(RF){mx=Math.max(mx,RF.v);mn=Math.min(mn,RF.v)}
    const zero=o.zero!==false||cols.length;let sc=scaleY(mx||1,zero?0:mn*0.98);if(o.int&&sc.ticks.length>1&&!Number.isInteger(sc.ticks[1]-sc.ticks[0])){const a=Math.floor(zero?0:mn),b=Math.max(Math.ceil(mx),a+2);sc={lo:a,top:b,ticks:[a,Math.round((a+b)/2),b]}}const{lo,top,ticks}=sc;
    const step=ticks.length>1?ticks[1]-ticks[0]:1,u=o.unit?' '+o.unit:'';const dec=x=>{for(let d=0;d<5;d++){const y=x*10**d;if(Math.abs(y-Math.round(y))<1e-6)return d}return 4};const dTick=v=>v===0?'0':top>=1e6?(v/1e6).toFixed(dec(step/1e6))+'M':top>=1e4?(v/1e3).toFixed(dec(step/1e3))+'K':v.toFixed(dec(step));
    const qTick=v=>v===0?qn(0,0,false,o.unit,true):top>=1e6?qn(v,dec(step/1e6),true,o.unit,true):top>=1e4?qn(v,dec(step/1e3),true,o.unit,true):qn(v,dec(step),false,o.unit,true);
    const iw=w-m.l-m.r,ih=h-m.t-m.b,bw=iw/n,px=i=>m.l+bw*i+bw/2,py=v=>m.t+ih-((v-lo)/((top-lo)||1))*ih,yF=o.yFmt||(EN?(v=>dTick(v)+u):qTick),vF=o.vFmt||(EN?(v=>(Math.abs(v)>=1e4?nf(v):Math.abs(v)>=10?v.toFixed(1):v.toFixed(2))+u):(v=>Math.abs(v)>=1e4?qn(Math.round(v),0,false,o.unit):qn(v,Math.abs(v)>=10?1:2,false,o.unit)));
    let g='';
    if(!SP)ticks.forEach(t=>{g+=`<line x1="${m.l}" x2="${w-m.r}" y1="${py(t)}" y2="${py(t)}" stroke="${T.grid}"/><text x="${m.l-8}" y="${py(t)+4}" text-anchor="end" fill="${T.text}" font-size="11" font-family="${T.font}">${yF(t)}</text>`});
    if(RF){const y=py(RF.v),f=(lines[0]&&lines[0].fmt)||vF;g+=`<line x1="${m.l}" x2="${w-m.r}" y1="${y}" y2="${y}" stroke="${T.strong}" stroke-opacity=".55" stroke-dasharray="4 4"/><text x="${m.l+8}" y="${y-7}" fill="${T.strong}" fill-opacity=".8" font-size="11.5" font-family="${T.font}">${esc(UR.f(TX.overview.labelValue,{label:RF.label,value:f(RF.v)}))}</text>`}
    const cw=Math.max(1,Math.min(22,bw<6?bw-1:bw-2));
    for(let i=0;i<n;i++){let base=0;cols.forEach((q,k)=>{const v=q.v[i]||0;if(!o.stack&&k>0)base=0;const y0=py(base+v),y1=py(base);
      const gap=o.stack&&base>0?2:0;g+=`<path d="${colPath(px(i)-cw/2,y0,cw,Math.max(0,y1-y0-gap),Math.min(3,cw/2))}" fill="${o.hiLast&&i===n-1&&!o.stack?o.hiLast:q.color}"/>`;if(o.stack)base+=v})}
    lines.forEach(q=>{const V=q.v.slice(),gp=new Array(n).fill(false);
      for(let i=0;i<n;i++)if(V[i]==null){let a=i-1,b=i;while(b<n&&q.v[b]==null)b++;if(a>=0&&b<n&&q.v[a]!=null){for(let k=i;k<b;k++){V[k]=q.v[a]+(q.v[b]-q.v[a])*(k-a)/(b-a);gp[k]=true}}i=b}
      let d='',dd='',area='',start=-1,pp='';V.forEach((v,i)=>{if(v==null){if(start>=0&&q.kind==='area')area+=`L${px(i-1)},${py(lo)}L${px(start)},${py(lo)}Z`;start=-1;return}
        const p=`${px(i).toFixed(1)},${py(v).toFixed(1)}`;if(start<0){d+='M'+p;area+='M'+p;start=i}else{if(gp[i]||gp[i-1]||(o.now&&q===o.series[0]&&i===n-1)){dd+=`M${pp}L${p}`;d+='M'+p}else d+='L'+p;area+='L'+p}pp=p});
      if(dd)g+=`<path d="${dd}" fill="none" stroke="#5C5C66" stroke-width="1.5" stroke-dasharray="1 4" stroke-linecap="round"/>`;
      if(start>=0&&q.kind==='area')area+=`L${px(n-1)},${py(lo)}L${px(start)},${py(lo)}Z`;
      if(q.kind==='area'){UR._gid=(UR._gid||0)+1;g+=`<defs><linearGradient id="ag${UR._gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${q.color}" stop-opacity="${SP?.12:(q.op??.1)*1.8}"/><stop offset="1" stop-color="${q.color}" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#ag${UR._gid})"/>`}
      g+=`<path d="${d}" fill="none" stroke="${q.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      const li=q.v.length-1;if(q.v[li]!=null)g+=(SP?'':`<circle cx="${px(li)}" cy="${py(q.v[li])}" r="10" fill="${q.color}" fill-opacity=".18"/>`)+`<circle cx="${px(li)}" cy="${py(q.v[li])}" r="${SP?3.5:4}" fill="${q.color}" stroke="${T.surface}" stroke-width="2"/>`});
    if(o.endLabel){const L=lines[0];const li=n-1;if(L&&L.v[li]!=null)g+=EL?`<text x="${px(li)+12}" y="${py(L.v[li])+4}" fill="${T.strong}" font-size="12.5" font-weight="500" font-family="${T.font}">${(L.fmt||vF)(L.v[li])}</text>`:`<text x="${px(li)-10}" y="${py(L.v[li])-12}" text-anchor="end" fill="${T.strong}" font-size="12.5" font-weight="500" font-family="${T.font}">${(L.fmt||vF)(L.v[li])}</text>`}
    if(!o.noX){const xf=o.xFmt||UR.xFmt(),xi=iw<260?[0,n-1]:iw>500&&n>8?[0,1,2,3,4].map(k=>Math.round((n-1)*k/4)):[0,Math.floor((n-1)/2),n-1],xl=xi.length-1;xi.forEach((i,k)=>{g+=`<text x="${k===0?m.l:k===xl?w-m.r:px(i)}" y="${h-6}" text-anchor="${k===0?'start':k===xl?'end':'middle'}" fill="${T.text}" font-size="11" font-family="${T.font}">${xf(o.t[i])}</text>`})}
    g+=`<g class="hov"></g><rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent"/>`;
    el.innerHTML=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" tabindex="0" role="img" aria-label="${esc(o.label||'')}" style="display:block;outline-offset:4px">${g}</svg>`;
    const svg=el.firstChild,hov=svg.querySelector('.hov');let cur=-1;const tf0=o.tipX||UR.tipFmt(),tf=t=>o.now&&t===o.now.t?o.now.lab:tf0(t);
    const at=(i,cx,cy)=>{if(i<0||i>=n){hov.innerHTML='';UR.hideTip();cur=-1;if(o.onHover)o.onHover(null);return}cur=i;const L=lines[0];if(o.onHover)o.onHover(i,o.t[i],o.series);
      hov.innerHTML=`<line x1="${px(i)}" x2="${px(i)}" y1="${m.t}" y2="${m.t+ih}" stroke="${T.cross}"/>`+(L&&L.v[i]!=null?`<circle cx="${px(i)}" cy="${py(L.v[i])}" r="4.5" fill="${L.color}" stroke="${T.surface}" stroke-width="2"/>`:'');
      if(cx==null){const r=svg.getBoundingClientRect();cx=r.left+px(i);cy=r.top+m.t+ih/3}
      if(!o.noTip)UR.showTip(`<span class="k">${esc(tf(o.t[i]))}</span>${o.series.map(q=>UR.tipRow(esc(q.name),q.v[i]==null?esc(TX.chart.noData):(q.fmt||vF)(q.v[i]),o.series.length>1?q.color:null)).join('')}`,cx,cy)};
    const onPt=e=>{const r=svg.getBoundingClientRect();at(Math.floor((e.clientX-r.left-m.l)/bw),e.clientX,e.clientY)};svg.addEventListener('pointermove',onPt);svg.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')onPt(e)});
    svg.addEventListener('pointerleave',()=>at(-1));svg.addEventListener('blur',()=>at(-1));
    svg.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();at(Math.max(0,Math.min(n-1,cur<0?n-1:cur+(e.key==='ArrowRight'?1:-1))))});
  }
  el._draw=draw;el._get=get;RO.observe(el);UR.subs.push(draw);run(draw);
};

/* ---------- land grid + globe (dots are countries, never locations) ---------- */
UR.LANDPTS=(()=>{const pts=[];LAND.rows.forEach((hex,ri)=>{const lat=LAND.lat0-ri*LAND.step;let bits='';for(const c of hex)bits+=parseInt(c,16).toString(2).padStart(4,'0');
  for(let ci=0;ci<LAND.cols;ci++)if(bits[ci]==='1')pts.push([lat,-180+LAND.step/2+ci*LAND.step])});return pts})();
const nodeTip=(c,chg)=>`<span class="k">${c.n}</span>${UR.tipRow(esc(PG.titles.providersOnline),nf(c.v))}${UR.tipRow(esc(TX.country.share),UR.pc(c.v/UR.PROV*100,c.v/UR.PROV*100<0.1?2:1))}${chg&&UR.chg(c)!=null?UR.tipRow(esc(UR.f(TX.country.changeLast,{period:UR.PERIODS[UR.P].lab})),UR.signed(UR.chg(c))):''}<div style="color:#8E8E98;margin-top:4px">${esc(TX.country.clickToPin)}</div>`;
UR.globe=(cv,o={})=>{
  const x=cv.getContext('2d');let w=0,h=0,R=0,cx=0,cy=0,running=false,visible=false;
  let rot=o.rot??70,tilt=22*Math.PI/180,vel=0,drag=null,idle=0;const rad=Math.PI/180;
  const vec=(la,lo)=>[Math.cos(la)*Math.sin(lo),Math.sin(la),Math.cos(la)*Math.cos(lo)];
  const pv=UR.LANDPTS.map(([la,lo])=>vec(la*rad,lo*rad));
  // its dots, made again when a refresh brings other countries (UR.ver)
  let nodes=[],ver=-1;const mk=()=>{nodes=UR.COUNTRIES.filter(c=>c.la!=null).map(c=>({c,v:vec(c.la*rad,c.lo*rad),r:1.6+7*Math.sqrt(c.v/UR.CMAX),ph:Math.random()*4}));ver=UR.ver};
  function size(){const r=cv.getBoundingClientRect();w=r.width;h=r.height;if(!w||!h)return;cv.width=w*DPR;cv.height=h*DPR;x.setTransform(DPR,0,0,DPR,0,0);R=Math.min(w,h)*(o.scale||.42);cx=w*.5;cy=h*.5}
  function P(v){const lo=rot*rad,c=Math.cos(lo),s=Math.sin(lo);const X=v[0]*c+v[2]*s,Z=-v[0]*s+v[2]*c,Y=v[1];const ct=Math.cos(tilt),st=Math.sin(tilt);return[cx+X*R,cy-(Y*ct-Z*st)*R,Y*st+Z*ct]}
  function frame(ts){
    if(!running)return;if(ver!==UR.ver)mk();
    if(!drag){if(Math.abs(vel)>.01){rot+=vel;vel*=.95}else if(!RM&&ts-idle>1800)rot+=.04}
    x.clearRect(0,0,w,h);
    const halo=x.createRadialGradient(cx,cy,R*.92,cx,cy,R*1.28);halo.addColorStop(0,`rgba(${UR.THEME.rgb},.08)`);halo.addColorStop(1,`rgba(${UR.THEME.rgb},0)`);x.fillStyle=halo;x.beginPath();x.arc(cx,cy,R*1.28,0,7);x.fill();
    const body=x.createRadialGradient(cx-R*.35,cy-R*.4,R*.1,cx,cy,R);body.addColorStop(0,UR.THEME.tint);body.addColorStop(1,'#0B0C0C');x.fillStyle=body;x.beginPath();x.arc(cx,cy,R,0,7);x.fill();x.strokeStyle=`rgba(${UR.THEME.rgb},.16)`;x.lineWidth=1;x.stroke();
    const ds=Math.max(1.1,R/190);for(let i=0;i<pv.length;i++){const p=P(pv[i]);if(p[2]<-.02)continue;x.fillStyle=`rgba(200,200,212,${(.12+.55*p[2]).toFixed(3)})`;x.fillRect(p[0]-ds/2,p[1]-ds/2,ds,ds)}
    const tt=ts/1000;cv._nodes=[];
    for(let i=nodes.length-1;i>=0;i--){const n=nodes[i],p=P(n.v);if(p[2]<=0)continue;const r=n.r*(.7+.3*p[2])*(R/300);
      const g=x.createRadialGradient(p[0],p[1],0,p[0],p[1],r*3);g.addColorStop(0,`rgba(${UR.THEME.rgb},.24)`);g.addColorStop(1,`rgba(${UR.THEME.rgb},0)`);x.fillStyle=g;x.beginPath();x.arc(p[0],p[1],r*3,0,7);x.fill();
      x.fillStyle=UR.THEME.acc;x.beginPath();x.arc(p[0],p[1],Math.max(1.4,r*.55),0,7);x.fill();
      if(o.picked&&o.picked()===n.c.c){x.strokeStyle='#F2F4EF';x.lineWidth=1.6;x.beginPath();x.arc(p[0],p[1],Math.max(8,r+7),0,7);x.stroke()}
      cv._nodes.push({c:n.c,px:p[0],py:p[1],r:Math.max(6,r)})}
    x.font='500 11.5px "PP Neue Montreal", Helvetica, Arial, sans-serif';x.textBaseline='middle';
    const lim=R<170?20000:R<240?6000:2200;cv._nodes.filter(n=>n.c.v>lim).forEach(n=>{const t=`${n.c.c} ${cpt(n.c.v)}`,tw=x.measureText(t).width;x.fillStyle='rgba(10,11,11,.72)';x.fillRect(n.px+10,n.py-8,tw+8,16);x.fillStyle='#E4E4EA';x.fillText(t,n.px+14,n.py)});
    requestAnimationFrame(frame)}
  cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,rot,tilt};cv.setPointerCapture(e.pointerId);vel=0});
  cv.addEventListener('pointermove',e=>{if(drag){const nr=drag.rot+(e.clientX-drag.x)*.35;vel=nr-rot;rot=nr;tilt=Math.max(-.2,Math.min(.9,drag.tilt+(e.clientY-drag.y)*.004));idle=performance.now();UR.hideTip();return}
    const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;let best=null,bd=1e9;(cv._nodes||[]).forEach(n=>{const d=Math.hypot(n.px-mx,n.py-my);if(d<n.r+6&&d<bd){bd=d;best=n}});
    if(best)UR.showTip(nodeTip(best.c),e.clientX,e.clientY);else UR.hideTip()});
  let down=null;cv.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});
  const end=e=>{if(down&&e&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<5&&o.onPick){const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;let best=null,bd=1e9;(cv._nodes||[]).forEach(n=>{const d=Math.hypot(n.px-mx,n.py-my);if(d<n.r+8&&d<bd){bd=d;best=n}});o.onPick(best?best.c:null)}down=null;drag=null;idle=performance.now()};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',()=>{drag=null;down=null});cv.addEventListener('pointerleave',UR.hideTip);
  cv._focus=c=>{rot=-c.lo;tilt=Math.max(-.2,Math.min(.9,c.la*rad));vel=0;idle=performance.now()+6000};
  new ResizeObserver(size).observe(cv);size();
  const go=()=>{if(running||!visible)return;running=true;size();requestAnimationFrame(frame)};
  new IntersectionObserver(es=>{visible=es[0].isIntersecting&&!!cv.offsetParent;if(visible)go();else running=false}).observe(cv);
};

/* ---------- flat dot map ---------- */
const landMap=()=>{if(UR.LANDMAP)return UR.LANDMAP;const rc=([la,lo])=>[Math.round((LAND.lat0-la)/LAND.step),Math.round((lo+180-LAND.step/2)/LAND.step)],A0=UR.LANDPTS.filter(([la,lo])=>(la<=68.5||(lo>-75&&lo<-10))&&!(la>64&&lo>-12&&lo<4)),S0=new Set(A0.map(p=>rc(p).join(',')));const P0=A0.filter(p=>{if(p[0]<=60)return true;const[r,c]=rc(p);let n=1;for(let k=r-1;S0.has(k+','+c);k--)n++;for(let k=r+1;S0.has(k+','+c);k++)n++;return n>=3}),K=new Map();P0.forEach((p,i)=>{const[r,c]=rc(p);K.set(r+','+c,i)});
  const comp=new Int32Array(P0.length).fill(-1),size=[],lat=[],tall=[];P0.forEach((p,i)=>{if(comp[i]>=0)return;const id=size.length;let n=0,ls=0,r0=1e9,r1=-1e9;const st=[i];comp[i]=id;while(st.length){const j=st.pop();n++;ls+=P0[j][0];const[r,c]=rc(P0[j]);r0=Math.min(r0,r);r1=Math.max(r1,r);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const k=K.get((r+a)+','+(c+b));if(k!=null&&comp[k]<0){comp[k]=id;st.push(k)}}}size.push(n);lat.push(ls/n);tall.push(r1-r0)});
  return UR.LANDMAP=P0.filter((p,i)=>!(lat[comp[i]]>60&&(size[comp[i]]<25||tall[comp[i]]<2)))};
let LCc=null,LCv=-1;const landCt=()=>{if(LCc&&LCv===UR.ver)return LCc;LCv=UR.ver;for(const f in CTR)delete CTR[f];const cs=UR.COUNTRIES.filter(c=>c.la!=null&&c.ct),key=(r,c)=>r+','+c,rc=(la,lo)=>[Math.round((LAND.lat0-la)/LAND.step),Math.round((lo+180-LAND.step/2)/LAND.step)];
  const ct=landMap().map(([la,lo])=>{let b=null,bd=1e9;const k=Math.cos(la*Math.PI/180);for(const c of cs){let dl=Math.abs(c.lo-lo);if(dl>180)dl=360-dl;const d=(c.la-la)**2+(dl*k)**2;if(d<bd){bd=d;b=c}}if(lo>60&&la>45)return 'AS';if(la<13&&lo>-77.5&&lo<-34)return 'SA';if((la>59&&lo<-10&&!(la<67.5&&lo>-25))||(la>50&&lo<-130))return 'NA';return b?b.ct:null});
  const idx=new Map();landMap().forEach(([la,lo],k)=>idx.set(key(...rc(la,lo)),k));
  const edge=landMap().map(([la,lo],k)=>{const[r,c]=rc(la,lo);return [[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const j=idx.get(key(r+a,c+b));return j==null||ct[j]!==ct[k]})});return LCc={ct,edge}};
const CTR={};const contourOf=F=>{if(CTR[F])return CTR[F];const LC=landCt(),R=LAND.rows.length,C=LAND.cols,W2=C+2,m=new Uint8Array((R+2)*W2),at=(r,c)=>m[(r+1)*W2+c+1];
  landMap().forEach(([la,lo],k)=>{if(LC.ct[k]!==F)return;const r=Math.round((LAND.lat0-la)/LAND.step),c=Math.round((lo+180-LAND.step/2)/LAND.step);m[(r+1)*W2+c+1]=1});
  const seg=[];for(let r=-1;r<R;r++)for(let c=-1;c<C;c++){const i=at(r,c)*8+at(r,c+1)*4+at(r+1,c+1)*2+at(r+1,c);if(!i||i===15)continue;const T=[r,c+.5],Rt=[r+.5,c+1],B=[r+1,c+.5],L=[r+.5,c],a=(p,q)=>seg.push([p,q]);
    switch(i){case 1:case 14:a(L,B);break;case 2:case 13:a(B,Rt);break;case 3:case 12:a(L,Rt);break;case 4:case 11:a(T,Rt);break;case 6:case 9:a(T,B);break;case 7:case 8:a(L,T);break;case 5:a(L,B);a(T,Rt);break;case 10:a(L,T);a(B,Rt);break}}
  const K=p=>p[0]*2+'_'+p[1]*2,adj=new Map();seg.forEach((s,i)=>s.forEach(p=>{const k=K(p);if(!adj.has(k))adj.set(k,[]);adj.get(k).push(i)}));
  const used=new Uint8Array(seg.length),loops=[];for(let i=0;i<seg.length;i++){if(used[i])continue;used[i]=1;const pl=[seg[i][0],seg[i][1]];let cur=seg[i][1];for(;;){const j=(adj.get(K(cur))||[]).find(j=>!used[j]);if(j==null)break;used[j]=1;cur=K(seg[j][0])===K(cur)?seg[j][1]:seg[j][0];pl.push(cur)}if(pl.length>=15)loops.push(pl)}
  const ch=p=>{for(let it=0;it<2;it++){const q=[];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];q.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}q.push(q[0]);p=q}return p};
  return CTR[F]=loops.map(ch)};
UR.flatMap=(cv,o)=>{const TOP=84,BOT=-57;
  function draw(){const w=cv.parentElement.clientWidth;if(!w)return;const h=Math.round(w*(TOP-BOT)/360);cv.width=w*DPR;cv.height=h*DPR;cv.style.width=w+'px';cv.style.height=h+'px';
    const x=cv.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);x.clearRect(0,0,w,h);const P=(la,lo)=>[(lo+180)/360*w,(TOP-la)/(TOP-BOT)*h],cell=w/LAND.cols;
    const F=o.focus&&o.focus(),LC=F?landCt():null;landMap().forEach(([la,lo],k)=>{const[px,py]=P(la,lo),inF=F&&LC.ct[k]===F;x.fillStyle=!F?o.land:inF?'#76767F':'#1A1A20';x.beginPath();x.arc(px,py,Math.max(.6,cell*.3),0,7);x.fill()});
    if(F&&UR.MAP_OUTLINE!==false){x.save();x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=w<600?.9:1.1;x.lineJoin=x.lineCap='round';x.beginPath();contourOf(F).forEach(pl=>{pl.forEach(([r,c],i)=>{const[px,py]=P(LAND.lat0-r*LAND.step,-180+LAND.step/2+c*LAND.step);i?x.lineTo(px,py):x.moveTo(px,py)})});x.stroke();x.restore()}
    const nodes=[];UR.COUNTRIES.filter(c=>c.la!=null).reverse().forEach(c=>{const[px,py]=P(c.la,c.lo),r=Math.max(1.6,(2+11*Math.sqrt(c.v/UR.CMAX))*Math.min(1,Math.max(.45,w/900)));nodes.push({c,px,py,r});x.globalAlpha=o.dim&&o.dim(c)?.15:1;
      const gr=x.createRadialGradient(px,py,0,px,py,r*2.6);gr.addColorStop(0,`rgba(${UR.THEME.rgb},.18)`);gr.addColorStop(1,`rgba(${UR.THEME.rgb},0)`);x.fillStyle=gr;x.beginPath();x.arc(px,py,r*2.6,0,7);x.fill();
      x.fillStyle=UR.THEME.acc;x.beginPath();x.arc(px,py,r,0,7);x.fill();x.strokeStyle='#111113';x.lineWidth=Math.min(2,r*.45);x.stroke();x.globalAlpha=1;
      if(o.picked&&o.picked()===c.c){x.strokeStyle='#F2F4EF';x.lineWidth=1.6;x.beginPath();x.arc(px,py,r+5,0,7);x.stroke()}});
    cv._nodes=nodes}
  cv.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;let best=null,bd=1e9;(cv._nodes||[]).forEach(n=>{const d=Math.hypot(n.px-mx,n.py-my);if(d<Math.max(10,n.r+6)&&d<bd){bd=d;best=n}});
    if(best)UR.showTip(nodeTip(best.c,true),e.clientX,e.clientY);else UR.hideTip()});
  let dn=null;cv.addEventListener('pointerdown',e=>{dn=[e.clientX,e.clientY]});
  cv.addEventListener('pointerup',e=>{if(!o.onPick||!dn||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>5){dn=null;return}dn=null;const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;let best=null,bd=1e9;(cv._nodes||[]).forEach(n=>{const d=Math.hypot(n.px-mx,n.py-my);if(d<Math.max(10,n.r+6)&&d<bd){bd=d;best=n}});o.onPick(best?best.c:null)});
  if(o.onPick)cv.style.cursor='pointer';
  cv.addEventListener('pointerleave',UR.hideTip);cv.parentElement._draw=draw;RO.observe(cv.parentElement);run(draw)};

/* ---------- live counter ---------- */
UR.liveCounter=el=>{const t0=performance.now();const tick=()=>{const b=UR.BPS*(performance.now()-t0)/1000;el.textContent=b>=1e12?un(b/1e12,3,'TB'):un(b/1e9,2,'GB');setTimeout(tick,RM?1000:90)};tick()};
})();
