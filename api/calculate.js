const { DateTime } = require('luxon');

const BASE = 'https://api.prokerala.com';
let tokenCache = { token: null, expiresAt: 0 };

async function token() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt - 60000) return tokenCache.token;
  const clientId = process.env.PROKERALA_CLIENT_ID;
  const clientSecret = process.env.PROKERALA_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Prokerala environment variables are missing.');
  const body = new URLSearchParams({grant_type:'client_credentials',client_id:clientId,client_secret:clientSecret});
  const r = await fetch(`${BASE}/token`, {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
  const text = await r.text();
  if (!r.ok) throw new Error(`Prokerala authentication failed (${r.status}): ${text.slice(0,250)}`);
  const data = JSON.parse(text);
  tokenCache = {token:data.access_token,expiresAt:now + Number(data.expires_in || 3600)*1000};
  return tokenCache.token;
}

async function api(path, params={}, accept='application/json') {
  const access = await token();
  const url = new URL(`${BASE}/v2${path}`);
  for (const [k,v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k,String(v));
  const r = await fetch(url,{headers:{Authorization:`Bearer ${access}`,Accept:accept}});
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} (${r.status}): ${text.slice(0,350)}`);
  return accept === 'image/svg+xml' ? text : JSON.parse(text);
}

function dt(date,time,zone){
  const x=DateTime.fromISO(`${date}T${time}`,{zone});
  if(!x.isValid) throw new Error(`Invalid date/time: ${x.invalidExplanation || 'unknown error'}`);
  return x.toISO({suppressMilliseconds:true});
}
function unwrap(x){return x && typeof x==='object' && Object.prototype.hasOwnProperty.call(x,'data') ? x.data : x}
function name(x){if(x==null)return '';if(typeof x==='string'||typeof x==='number')return String(x);return x.name||x.title||x.symbol||''}
function moon(kp){const d=unwrap(kp)||{};return (d.planet_positions||[]).find(p=>/moon/i.test(name(p.planet)))}
function house1(kp){const d=unwrap(kp)||{};const a=d.houses||[];return a.find(h=>Number(h.house?.id||h.house?.number||h.house)===1)||a[0]}
function weekdayLord(iso){const w=DateTime.fromISO(iso).weekday;return ({1:'Moon',2:'Mars',3:'Mercury',4:'Jupiter',5:'Venus',6:'Saturn',7:'Sun'})[w]||''}
function rulingPlanets(kp,iso){
  const h=house1(kp)||{},m=moon(kp)||{};
  return {
    lagnaLord:name(h.rasi?.lord),
    lagnaStarLord:name(h.nakshatra_lord),
    moonSignLord:name(m.rasi?.lord),
    moonStarLord:name(m.nakshatra_lord),
    dayLord:weekdayLord(iso)
  };
}
async function safe(out,key,promise){
  try{out[key]=await promise}catch(e){out.errors=out.errors||{};out.errors[key]=e.message}
}

async function vedic(i){
  const datetime=dt(i.date,i.time,i.timezone);
  const common={ayanamsa:Number(i.ayanamsa||1),coordinates:i.coordinates,datetime,la:i.language||'en'};
  const selected=new Set(i.options||[]), out={input:{...common,timezone:i.timezone},charts:{},errors:{}}, jobs=[];
  const add=(key,path,params=common,accept='application/json')=>jobs.push(safe(out,key,api(path,params,accept)));
  if(selected.has('birthDetails'))add('birthDetails','/astrology/birth-details');
  if(selected.has('planetPositions'))add('planetPositions','/astrology/planet-position',{...common,planets:'0,1,2,3,4,5,6,100,101,102'});
  if(selected.has('dasha'))add('dashaPeriods','/astrology/dasha-periods',{...common,year_length:1});
  if(selected.has('yoga'))add('yoga','/astrology/yoga');
  if(selected.has('mangalDosha'))add('mangalDosha','/astrology/mangal-dosha');
  if(selected.has('kaalSarp'))add('kaalSarp','/astrology/kaal-sarp-dosha');
  if(selected.has('sadeSati'))add('sadeSati','/astrology/sade-sati');
  if(selected.has('sarvashtakavarga'))add('sarvashtakavarga','/astrology/sarvashtakavarga');
  if(selected.has('panchang'))add('panchang','/astrology/panchang');
  if(selected.has('upagraha'))add('upagraha','/astrology/upagraha-position');
  for(const chartType of i.charts||[]){
    jobs.push(api('/astrology/chart',{...common,chart_type:chartType,chart_style:i.chartStyle||'north-indian',format:'svg'},'image/svg+xml')
      .then(v=>out.charts[chartType]=v).catch(e=>out.errors[`chart_${chartType}`]=e.message));
  }
  await Promise.all(jobs); return out;
}

async function kp(i){
  const datetime=dt(i.date,i.time,i.timezone);
  const common={ayanamsa:Number(i.ayanamsa||5),coordinates:i.coordinates,datetime,la:i.language||'en'};
  const selected=new Set(i.options||[]),out={input:{...common,timezone:i.timezone},errors:{}},jobs=[];
  const add=(key,path,params=common,accept='application/json')=>jobs.push(safe(out,key,api(path,params,accept)));
  if(selected.has('kpPositions'))add('kpPositions','/astrology/kp-planet-position');
  if(selected.has('planetSignificators'))add('planetSignificators','/astrology/kp-planet-significator');
  if(selected.has('houseSignificators'))add('houseSignificators','/astrology/kp-house-significator');
  if(selected.has('dasha'))add('dashaPeriods','/astrology/dasha-periods',{...common,year_length:1});
  if(selected.has('kpChart'))add('kpChartSvg','/astrology/kp-chart',{...common,chart_style:i.chartStyle||'north-indian'},'image/svg+xml');
  await Promise.all(jobs); return out;
}

async function horary(i){
  const h=i.horary||{}, num=Number(h.number);
  if(!h.question)throw new Error('Horary question is required.');
  if(!num||num<1||num>249)throw new Error('Horary number must be between 1 and 249.');
  if(!h.takingDate||!h.takingTime||!h.judgmentDate||!h.judgmentTime)throw new Error('Taking Number time and Judgment time are required.');
  const takingISO=dt(h.takingDate,h.takingTime,i.timezone), judgmentISO=dt(h.judgmentDate,h.judgmentTime,i.timezone);
  const base={ayanamsa:Number(i.ayanamsa||5),coordinates:i.coordinates,la:i.language||'en'};
  const out={meta:{question:h.question,number:num,takingDateTime:takingISO,judgmentDateTime:judgmentISO,timezone:i.timezone,coordinates:i.coordinates,
    note:'The current Prokerala API provides KP calculations by date/time/location. The 1–249 Horary Number is stored in the report, but a dedicated number-to-ascendant engine is not exposed by this API.'},taking:{},judgment:{},errors:{}};
  let takingKP=null,judgmentKP=null;
  try{takingKP=await api('/astrology/kp-planet-position',{...base,datetime:takingISO});out.taking.kp=takingKP;out.taking.rulingPlanets=rulingPlanets(takingKP,takingISO)}catch(e){out.errors.takingKP=e.message}
  try{judgmentKP=await api('/astrology/kp-planet-position',{...base,datetime:judgmentISO});out.judgment.kp=judgmentKP;out.judgment.rulingPlanets=rulingPlanets(judgmentKP,judgmentISO)}catch(e){out.errors.judgmentKP=e.message}
  await Promise.all([
    safe(out,'kpChartSvg',api('/astrology/kp-chart',{...base,datetime:judgmentISO,chart_style:i.chartStyle||'north-indian'},'image/svg+xml')),
    safe(out,'planetSignificators',api('/astrology/kp-planet-significator',{...base,datetime:judgmentISO})),
    safe(out,'houseSignificators',api('/astrology/kp-house-significator',{...base,datetime:judgmentISO})),
    safe(out,'dashaPeriods',api('/astrology/dasha-periods',{...base,datetime:judgmentISO,year_length:1}))
  ]);
  return out;
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'POST only'});
  try{
    const i=req.body||{};
    if(!i.system)return res.status(400).json({error:'System is required.'});
    if(!i.coordinates||!i.timezone)return res.status(400).json({error:'Please select a valid place.'});
    let data;
    if(i.system==='vedic')data=await vedic(i);
    else if(i.system==='kp')data=await kp(i);
    else if(i.system==='horary')data=await horary(i);
    else return res.status(400).json({error:'Unknown astrology system.'});
    res.status(200).json({system:i.system,data});
  }catch(e){console.error(e);res.status(500).json({error:e.message||'Unexpected server error.'})}
};
