// AstroDesk V0.6 UI patch
// Keeps the existing Vedic/KP/Horary calculation API and replaces the working/report layout.

function v06Brand(){
  const b=(db.branding&&db.branding[session])||{};
  return {
    brandName:b.brandName||'My Astrology Practice',
    tagline:b.tagline||'',
    phone:b.phone||'',
    whatsapp:b.whatsapp||'',
    email:b.email||'',
    website:b.website||'',
    address:b.address||'',
    signature:b.signature||'',
    signatureImage:b.signatureImage||'',
    logo:b.logo||'',
    disclaimer:b.disclaimer||''
  };
}

function v06Normalize(r){
  if(!r.page1Blocks||!Array.isArray(r.page1Blocks)) r.page1Blocks=[];
  while(r.page1Blocks.length<4) r.page1Blocks.push('');
  r.page1Blocks=r.page1Blocks.slice(0,4);
  return r;
}

function v06ChoiceList(){
  const r=active, list=[];
  const add=(id,title)=>{ if(!list.some(x=>x.id===id)) list.push({id,title}); };

  if(r.systems?.vedic){
    for(const c of r.vedic?.charts||[]){
      const title=(CHARTS.find(x=>x[0]===c)||[c,c])[1];
      add(`vedic.chart.${c}`,`Vedic · ${title}`);
    }
    const map={
      birthDetails:'Vedic · Birth Details / Nakshatra',
      planetPositions:'Vedic · Planet Positions',
      dasha:'Vedic · Vimshottari Dasha',
      yoga:'Vedic · Raja Yoga',
      mangalDosha:'Vedic · Mangal Dosha',
      kaalSarp:'Vedic · Kaal Sarp Dosha',
      sadeSati:'Vedic · Sade Sati',
      sarvashtakavarga:'Vedic · Sarvashtakavarga',
      panchang:'Vedic · Panchang',
      upagraha:'Vedic · Upagraha Positions'
    };
    for(const k of r.vedic?.options||[]){
      const id=k==='dasha'?'vedic.dashaPeriods':`vedic.${k}`;
      add(id,map[k]||`Vedic · ${pretty(k)}`);
    }
  }

  if(r.systems?.kp){
    const opts=new Set(r.kp?.options||[]);
    if(opts.has('kpChart')) add('kp.chart','KP · Chart');
    if(opts.has('kpPositions')){
      add('kp.planets','KP · Planet Positions');
      add('kp.cusps','KP · Cusp Positions');
    }
    if(opts.has('planetSignificators')) add('kp.planetSignificators','KP · Planet Significators');
    if(opts.has('houseSignificators')) add('kp.houseSignificators','KP · House Significators');
    if(opts.has('dasha')) add('kp.dashaPeriods','KP · Vimshottari Dasha');
  }

  if(r.systems?.horary){
    add('horary.meta','Horary · Question & Number');
    add('horary.rpTaking','Horary · Ruling Planets — Taking Number');
    add('horary.rpJudgment','Horary · Ruling Planets — Judgment');
    add('horary.chart','Horary · Judgment KP Chart');
    add('horary.planets','Horary · Judgment Planet Positions');
    add('horary.cusps','Horary · Judgment Cusp Positions');
    add('horary.planetSig','Horary · Planet Significators');
    add('horary.houseSig','Horary · House Significators');
    add('horary.dasha','Horary · Dasha');
  }
  return list;
}

function v06Recommended(){
  const r=active;
  if(r.systems?.kp && !r.systems?.vedic && !r.systems?.horary){
    return ['kp.chart','kp.planets','kp.houseSignificators','kp.dashaPeriods'];
  }
  if(r.systems?.horary && !r.systems?.vedic && !r.systems?.kp){
    return ['horary.chart','horary.rpJudgment','horary.planetSig','horary.houseSig'];
  }
  if(r.systems?.vedic && !r.systems?.kp && !r.systems?.horary){
    return ['vedic.chart.rasi','vedic.planetPositions','vedic.chart.navamsa','vedic.dashaPeriods'];
  }
  if(r.systems?.kp && r.systems?.vedic){
    return ['vedic.chart.rasi','kp.planets','vedic.chart.navamsa','kp.houseSignificators'];
  }
  const ids=v06ChoiceList().map(x=>x.id);
  return ids.slice(0,4);
}

function v06EnsureBlocks(force=false){
  v06Normalize(active);
  const ids=new Set(v06ChoiceList().map(x=>x.id));
  if(force || active.page1Blocks.every(x=>!x || !ids.has(x))){
    active.page1Blocks=v06Recommended();
  }
  for(let i=0;i<4;i++){
    if(active.page1Blocks[i] && ids.has(active.page1Blocks[i])) continue;
    active.page1Blocks[i]=v06Recommended().find(x=>ids.has(x)&&!active.page1Blocks.includes(x))
      || [...ids].find(x=>!active.page1Blocks.includes(x)) || '';
  }
}

function v06Label(id){
  return v06ChoiceList().find(x=>x.id===id)?.title || 'Select content';
}

function v06Deep(x){
  return unwrap(x)||{};
}

function v06Table(arr,maxRows=10,maxCols=6){
  if(!Array.isArray(arr)||!arr.length) return '<div class="v06-empty">No calculated data yet.</div>';
  const keys=[];
  for(const row of arr.slice(0,maxRows)){
    if(!row||typeof row!=='object') continue;
    for(const k of Object.keys(row)){
      const s=scalar(row[k]);
      if(s!==''&&!keys.includes(k)) keys.push(k);
    }
  }
  const cols=keys.slice(0,maxCols);
  if(!cols.length) return '<div class="v06-empty">Calculated.</div>';
  return `<div class="v06-mini-table-wrap"><table class="v06-mini-table"><thead><tr>${cols.map(k=>`<th>${esc(pretty(k))}</th>`).join('')}</tr></thead><tbody>${arr.slice(0,maxRows).map(row=>`<tr>${cols.map(k=>`<td>${esc(scalar(row?.[k]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function v06KV(obj,max=12){
  const x=v06Deep(obj), pairs=[];
  if(!x||typeof x!=='object') return `<div class="v06-empty">${esc(scalar(x)||'No calculated data yet.')}</div>`;
  for(const [k,v] of Object.entries(x)){
    const s=scalar(v);
    if(s!=='') pairs.push([pretty(k),s]);
  }
  if(!pairs.length) return '<div class="v06-empty">Calculated.</div>';
  return `<div class="v06-kv">${pairs.slice(0,max).map(([k,v])=>`<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`;
}

function v06Generic(data,maxRows=10){
  const x=v06Deep(data);
  if(Array.isArray(x)) return v06Table(x,maxRows);
  if(x&&typeof x==='object'){
    const preferred=x.planet_positions||x.houses||x.items||x.results;
    if(Array.isArray(preferred)) return v06Table(preferred,maxRows);
    const a=rows(x);
    if(Array.isArray(a)) return v06Table(a,maxRows);
  }
  return v06KV(x);
}

function v06BlockBody(id){
  const c=active.calculations||{};
  if(!id) return '<div class="v06-empty">Choose a section above.</div>';

  if(id.startsWith('vedic.chart.')){
    const k=id.split('.').pop();
    return c.vedic?.charts?.[k] ? `<div class="v06-chart">${c.vedic.charts[k]}</div>` : '<div class="v06-empty">Generate the selected Vedic chart.</div>';
  }
  if(id==='vedic.birthDetails') return v06Generic(c.vedic?.birthDetails,8);
  if(id==='vedic.planetPositions') return v06Generic(c.vedic?.planetPositions,10);
  if(id==='vedic.dashaPeriods') return v06Generic(c.vedic?.dashaPeriods,9);
  if(id.startsWith('vedic.')){
    const k=id.split('.')[1];
    return v06Generic(c.vedic?.[k],9);
  }

  const kp=c.kp||{};
  if(id==='kp.chart') return kp.kpChartSvg ? `<div class="v06-chart">${kp.kpChartSvg}</div>` : '<div class="v06-empty">Generate KP Chart.</div>';
  if(id==='kp.planets') return v06Table(v06Deep(kp.kpPositions).planet_positions||[],10,6);
  if(id==='kp.cusps') return v06Table(v06Deep(kp.kpPositions).houses||[],12,6);
  if(id==='kp.planetSignificators') return v06Generic(kp.planetSignificators,10);
  if(id==='kp.houseSignificators') return v06Generic(kp.houseSignificators,12);
  if(id==='kp.dashaPeriods') return v06Generic(kp.dashaPeriods,9);

  const h=c.horary||{};
  if(id==='horary.meta'){
    return `<div class="v06-kv">
      <div><span>Question</span><b>${esc(h.meta?.question||active.horary?.question||'—')}</b></div>
      <div><span>Horary Number</span><b>${esc(h.meta?.number||active.horary?.number||'—')}</b></div>
      <div><span>Taking Number Time</span><b>${esc(h.meta?.takingDateTime||'—')}</b></div>
      <div><span>Judgment Time</span><b>${esc(h.meta?.judgmentDateTime||'—')}</b></div>
    </div>`;
  }
  if(id==='horary.rpTaking') return h.taking?.rulingPlanets ? rpInline(h.taking.rulingPlanets) : '<div class="v06-empty">Generate Horary calculation.</div>';
  if(id==='horary.rpJudgment') return h.judgment?.rulingPlanets ? rpInline(h.judgment.rulingPlanets) : '<div class="v06-empty">Generate Horary calculation.</div>';
  if(id==='horary.chart') return h.kpChartSvg ? `<div class="v06-chart">${h.kpChartSvg}</div>` : '<div class="v06-empty">Generate Horary KP Chart.</div>';
  if(id==='horary.planets') return v06Table(v06Deep(h.judgment?.kp).planet_positions||[],10,6);
  if(id==='horary.cusps') return v06Table(v06Deep(h.judgment?.kp).houses||[],12,6);
  if(id==='horary.planetSig') return v06Generic(h.planetSignificators,10);
  if(id==='horary.houseSig') return v06Generic(h.houseSignificators,12);
  if(id==='horary.dasha') return v06Generic(h.dashaPeriods,9);

  return '<div class="v06-empty">No calculated data yet.</div>';
}

function v06Quick(){
  try{
    if(typeof v05QuickSummary==='function') return v05QuickSummary();
  }catch(e){}
  return [['Lagna','—'],['Rashi','—'],['Nakshatra','—'],['Pada','—'],['Gana','—'],['Lagna Sub Lord (1SL)','—']];
}

function v06Header(){
  const b=v06Brand();
  return `<div class="v06-report-header">
    <div class="v06-report-logo">${b.logo?`<img src="${b.logo}">`:'<div class="v06-logo-mark">✦</div>'}</div>
    <div class="v06-report-brand">
      <h1>${esc(b.brandName)}</h1>
      <div>${esc(b.tagline||'Personal Astrology Consultation')}</div>
    </div>
    <div class="v06-report-contact">
      <span><b>Website</b>${esc(b.website||'—')}</span>
      <span><b>Mob</b>${esc(b.phone||'—')}</span>
      <span><b>WhatsApp</b>${esc(b.whatsapp||'—')}</span>
      <span><b>Email</b>${esc(b.email||'—')}</span>
    </div>
  </div>`;
}

function v06Page1HTML(){
  v06EnsureBlocks();
  const quick=v06Quick();
  return `<div class="v06-page-inner">
    ${v06Header()}
    <div class="v06-client-row">
      <div><span>Name</span><b>${esc(active.client||'—')}</b></div>
      <div><span>DOB</span><b>${esc(active.dob||'—')}</b></div>
      <div><span>Time</span><b>${esc(active.tob||'—')}</b></div>
      <div><span>Place</span><b>${esc(active.pob||'—')}</b></div>
    </div>
    <div class="v06-quick-row">
      ${quick.map(([k,v])=>`<div><span>${esc(k)}</span><b>${esc(v||'—')}</b></div>`).join('')}
    </div>
    <div class="v06-block-grid">
      ${active.page1Blocks.map((id,i)=>`<section class="v06-report-block">
        <div class="v06-block-title"><span>${i+1}</span>${esc(v06Label(id))}</div>
        <div class="v06-block-content">${v06BlockBody(id)}</div>
      </section>`).join('')}
    </div>
    ${v06Footer()}
  </div>`;
}

function v06Footer(){
  const b=v06Brand();
  return `<div class="v06-report-footer">
    <div class="v06-disclaimer">${esc(b.disclaimer||'')}</div>
    <div class="v06-signature">${b.signatureImage?`<img src="${b.signatureImage}">`:''}<b>${esc(b.signature||'Astrologer')}</b><span>Signature</span></div>
  </div>`;
}

function v06Page2PrintHTML(){
  const b=v06Brand();
  return `<div class="v06-page-inner v06-prediction-page">
    <div class="v06-prediction-head">
      <div><b>${esc(b.brandName)}</b><span>${esc(b.tagline||'Personal Astrology Consultation')}</span></div>
      <div><span>Client</span><b>${esc(active.client||'—')}</b></div>
    </div>
    <div class="v06-prediction-title">Personal Prediction</div>
    <div class="v06-prediction-body">${active.content||'<p>Write the astrologer’s personal prediction here.</p>'}</div>
    <div class="v06-prediction-footer">${esc(b.website||'')}${b.phone?` · ${esc(b.phone)}`:''}</div>
  </div>`;
}

function v06PdfHTML(){
  return `<div class="v06-print-report">
    <section class="v06-print-page">${v06Page1HTML()}</section>
    <section class="v06-print-page">${v06Page2PrintHTML()}</section>
  </div>`;
}

function v06RenderBlockBar(){
  const host=$('#v06BlockBar');
  if(!host) return;
  v06EnsureBlocks();
  const choices=v06ChoiceList();
  const options=(selected)=>`<option value="">None</option>${choices.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(x.title)}</option>`).join('')}`;
  host.innerHTML=`
    <div class="v06-blockbar-head">
      <div><b>Page 1 — Four Horoscope Blocks</b><span>Choose what the astrologer wants to show in each block.</span></div>
      <button class="btn" id="v06Recommended">Recommended</button>
    </div>
    <div class="v06-block-selects">
      ${active.page1Blocks.map((x,i)=>`<label><span>Block ${i+1} · ${i<2?'Top':'Bottom'} ${i%2===0?'Left':'Right'}</span><select data-v06-block="${i}">${options(x)}</select></label>`).join('')}
    </div>`;
  $$('[data-v06-block]').forEach(s=>s.onchange=()=>{
    active.page1Blocks[+s.dataset.v06Block]=s.value;
    saveActive(true);
    v06RefreshPages();
  });
  $('#v06Recommended').onclick=()=>{
    active.page1Blocks=v06Recommended();
    saveActive(true);
    v06RenderBlockBar();
    v06RefreshPages();
  };
}

function v06Checks(prefix,items,selected){
  return `<div class="v06-chip-grid">${items.map(([id,label])=>`<label class="v06-chip"><input type="checkbox" data-${prefix}="${id}" ${selected.includes(id)?'checked':''}><span>${esc(label)}</span></label>`).join('')}</div>`;
}

function v06RenderSystemOptions(){
  const host=$('#v06Options');
  if(!host) return;
  const r=active;
  let h='';
  if(r.systems?.vedic){
    h+=`<div class="v06-option-panel">
      <div class="v06-option-title"><b>Vedic</b><label>Ayanamsa <select id="va"><option value="1">Lahiri</option><option value="3">Raman</option></select></label></div>
      <div class="v06-option-label">Calculations</div>
      ${v06Checks('vo',VEDIC_OPTIONS,r.vedic.options||[])}
      <div class="v06-option-label">Charts</div>
      ${v06Checks('vc',CHARTS,r.vedic.charts||[])}
    </div>`;
  }
  if(r.systems?.kp){
    h+=`<div class="v06-option-panel">
      <div class="v06-option-title"><b>KP</b><label>KP Ayanamsa <select id="ka"><option value="5">KP</option><option value="45">KP New</option></select></label></div>
      ${v06Checks('ko',KP_OPTIONS,r.kp.options||[])}
    </div>`;
  }
  if(r.systems?.horary){
    h+=`<div class="v06-option-panel">
      <div class="v06-option-title"><b>Horary / KP Prashna</b><label>Ayanamsa <select id="ha"><option value="5">KP</option><option value="45">KP New</option></select></label></div>
      <div class="v06-horary-grid">
        <label>Question<textarea id="hq" rows="2">${esc(r.horary.question||'')}</textarea></label>
        <label>Horary Number (1–249)<input id="hn" type="number" min="1" max="249" value="${esc(r.horary.number||'')}"></label>
        <label>Taking Date<input id="td" type="date" value="${esc(r.horary.takingDate||'')}"></label>
        <label>Taking Time<input id="tt" type="time" value="${esc(r.horary.takingTime||'')}"></label>
        <label>Judgment Date<input id="jd" type="date" value="${esc(r.horary.judgmentDate||'')}"></label>
        <label>Judgment Time<input id="jt" type="time" value="${esc(r.horary.judgmentTime||'')}"></label>
      </div>
    </div>`;
  }
  host.innerHTML=h||'<div class="v06-empty">Select Vedic, KP or Horary.</div>';

  if(r.systems?.vedic){
    $('#va').value=String(r.vedic.ayanamsa||1);
    $('#va').onchange=e=>r.vedic.ayanamsa=+e.target.value;
    $$('[data-vo]').forEach(x=>x.onchange=()=>{toggle(r.vedic.options,x.dataset.vo,x.checked);v06RenderBlockBar();});
    $$('[data-vc]').forEach(x=>x.onchange=()=>{toggle(r.vedic.charts,x.dataset.vc,x.checked);v06RenderBlockBar();});
  }
  if(r.systems?.kp){
    $('#ka').value=String(r.kp.ayanamsa||5);
    $('#ka').onchange=e=>r.kp.ayanamsa=+e.target.value;
    $$('[data-ko]').forEach(x=>x.onchange=()=>{toggle(r.kp.options,x.dataset.ko,x.checked);v06RenderBlockBar();});
  }
  if(r.systems?.horary){
    $('#ha').value=String(r.horary.ayanamsa||5);
    $('#ha').onchange=e=>r.horary.ayanamsa=+e.target.value;
    $('#hq').oninput=e=>r.horary.question=e.target.value;
    $('#hn').oninput=e=>r.horary.number=e.target.value;
    $('#td').onchange=e=>r.horary.takingDate=e.target.value;
    $('#tt').onchange=e=>r.horary.takingTime=e.target.value;
    $('#jd').onchange=e=>r.horary.judgmentDate=e.target.value;
    $('#jt').onchange=e=>r.horary.judgmentTime=e.target.value;
  }
}

function v06Location(){
  const i=$('#pob');
  if(!i||!config.prokeralaClientId||typeof LocationSearch==='undefined') return;
  let picked=false;
  new LocationSearch(i,d=>{
    picked=true;
    active.pob=i.value;
    active.coordinates=`${d.latitude},${d.longitude}`;
    active.timezone=d.timezone;
    i.setCustomValidity('');
    const el=$('#loc');
    if(el) el.textContent=`Selected: ${d.latitude}, ${d.longitude} · ${d.timezone}`;
  },{clientId:config.prokeralaClientId,persistKey:'astrodeskV06'});
  i.addEventListener('change',()=>{
    active.pob=i.value;
    if(!picked){
      active.coordinates='';
      active.timezone='';
      const el=$('#loc');
      if(el) el.textContent='Please select a place from suggestions.';
    }
    picked=false;
  });
}

function v06RenderSetup(){
  const host=$('#v06Setup');
  if(!host) return;
  const r=active;
  host.innerHTML=`
    <div class="v06-setup-top">
      <label><span>Client Name</span><input id="client" value="${esc(r.client||'')}" placeholder="Client name"></label>
      <label><span>DOB</span><input id="dob" type="date" value="${esc(r.dob||'')}"></label>
      <label><span>Time</span><input id="tob" type="time" value="${esc(r.tob||'')}"></label>
      <label class="v06-place"><span>Place</span><input id="pob" value="${esc(r.pob||'')}" placeholder="Type and choose a suggestion"><small id="loc">${r.coordinates?`Selected: ${esc(r.coordinates)} · ${esc(r.timezone)}`:''}</small></label>
      <label><span>Chart Style</span><select id="style"><option value="north-indian">North Indian</option><option value="south-indian">South Indian</option><option value="east-indian">East Indian</option></select></label>
      <label><span>App / API Language</span><select id="lang"><option value="en">English</option><option value="hi">Hindi</option><option value="ta">Tamil</option><option value="ml">Malayalam</option></select></label>
    </div>
    <div class="v06-system-row">
      <div><b>Astrology System</b><span>Select one or more.</span></div>
      <div class="systems">
        <button class="system-toggle ${r.systems.vedic?'active':''}" data-v06-system="vedic">Vedic</button>
        <button class="system-toggle ${r.systems.kp?'active':''}" data-v06-system="kp">KP</button>
        <button class="system-toggle ${r.systems.horary?'active':''}" data-v06-system="horary">Horary</button>
      </div>
      <button class="btn" id="v06ToggleOptions">Calculation Options ▾</button>
    </div>
    <div id="v06Options" class="v06-options"></div>
    <div class="v06-action-row">
      <div class="v06-status"><span class="dot" id="dot"></span><span id="status">Select calculations, then generate the horoscope.</span></div>
      <button class="btn primary" id="go">Generate Horoscope</button>
      <button class="btn" id="v06PdfView">PDF View</button>
      <button class="btn" id="save">Save</button>
      <button class="btn primary" id="print">PDF / Print</button>
    </div>`;

  $('#style').value=r.chartStyle||'north-indian';
  $('#lang').value=r.language||'en';
  $('#client').oninput=e=>{r.client=e.target.value;v06RefreshPagesDebounced();};
  $('#dob').onchange=e=>{r.dob=e.target.value;v06RefreshPages();};
  $('#tob').onchange=e=>{r.tob=e.target.value;v06RefreshPages();};
  $('#pob').oninput=e=>{r.pob=e.target.value;v06RefreshPagesDebounced();};
  $('#style').onchange=e=>r.chartStyle=e.target.value;
  $('#lang').onchange=e=>r.language=e.target.value;

  $$('[data-v06-system]').forEach(b=>b.onclick=()=>{
    const s=b.dataset.v06System;
    r.systems[s]=!r.systems[s];
    v06EnsureBlocks(true);
    v06RenderSetup();
    v06RenderBlockBar();
    v06RefreshPages();
  });

  v06RenderSystemOptions();
  v06Location();

  $('#v06ToggleOptions').onclick=()=>{
    $('#v06Options').classList.toggle('collapsed');
    $('#v06ToggleOptions').textContent=$('#v06Options').classList.contains('collapsed')?'Calculation Options ▸':'Calculation Options ▾';
  };
  $('#go').onclick=calculate;
  $('#v06PdfView').onclick=v06EnterPreview;
  $('#save').onclick=()=>saveActive();
  $('#print').onclick=printReport;
}

let v06RefreshTimer=null;
function v06RefreshPagesDebounced(){
  clearTimeout(v06RefreshTimer);
  v06RefreshTimer=setTimeout(v06RefreshPages,180);
}

function v06RefreshPages(){
  const p1=$('#v06Page1');
  if(p1) p1.innerHTML=v06Page1HTML();
  const client=$('#v06Page2Client');
  if(client) client.textContent=active.client||'Personal Prediction';
}

function v06EditorToolbar(){
  return `<div class="v06-toolbar">
    <button data-cmd="bold"><b>B</b></button>
    <button data-cmd="italic"><i>I</i></button>
    <button data-cmd="underline"><u>U</u></button>
    <select id="fs"><option value="3">Normal</option><option value="4">Large</option><option value="5">Larger</option></select>
    <button data-cmd="justifyLeft">Left</button>
    <button data-cmd="justifyCenter">Center</button>
    <button data-cmd="justifyRight">Right</button>
    <button data-cmd="insertUnorderedList">• List</button>
    <button data-cmd="insertOrderedList">1. List</button>
    <button id="voice">🎙 Voice</button>
    <button id="translate">Translate</button>
    <button id="polish">Polish</button>
    <button data-cmd="undo">Undo</button>
    <button data-cmd="redo">Redo</button>
  </div>`;
}

function v06BindEditor(){
  const ed=$('#editor');
  if(!ed) return;
  $$('[data-cmd]').forEach(b=>b.onclick=()=>{
    document.execCommand(b.dataset.cmd,false,null);
    ed.focus();
  });
  const fs=$('#fs');
  if(fs) fs.onchange=e=>{document.execCommand('fontSize',false,e.target.value);ed.focus();};
  ed.oninput=()=>{active.content=ed.innerHTML;};
  const voice=$('#voice'); if(voice) voice.onclick=voiceType;
  const translate=$('#translate'); if(translate) translate.onclick=()=>alert('Translation will be connected as a language-only service. It will not create astrology predictions.');
  const polish=$('#polish'); if(polish) polish.onclick=()=>alert('Polish Language will improve grammar/wording only. It will never alter the astrologer’s prediction.');
}

function v06EnterPreview(){
  sync();
  v06RefreshPages();
  const modal=document.createElement('div');
  modal.className='v06-preview-modal';
  modal.id='v06PreviewModal';
  modal.innerHTML=`<div class="v06-preview-top"><div><b>2-Page PDF Preview</b><span>Page 1 on the left · Page 2 on the right</span></div><div><button class="btn" id="v06ClosePreview">Back to Edit</button><button class="btn primary" id="v06PreviewPrint">PDF / Print</button></div></div><div class="v06-preview-pages"><section class="v06-paper">${v06Page1HTML()}</section><section class="v06-paper">${v06Page2PrintHTML()}</section></div>`;
  document.body.appendChild(modal);
  $('#v06ClosePreview').onclick=()=>modal.remove();
  $('#v06PreviewPrint').onclick=printReport;
}

async function calculate(){
  sync();
  const r=active;
  if(!r.coordinates||!r.timezone) return alert('Please choose the place from the suggestion list.');
  const systems=['vedic','kp','horary'].filter(s=>r.systems?.[s]);
  if(!systems.length) return alert('Select at least one astrology system.');
  if((r.systems.vedic||r.systems.kp)&&(!r.dob||!r.tob)) return alert('DOB and Time are required for Vedic/KP.');

  const dotEl=$('#dot'), statusEl=$('#status'), go=$('#go');
  if(dotEl) dotEl.className='dot busy';
  if(statusEl) statusEl.textContent='Calculating selected horoscope sections...';
  if(go){go.disabled=true;go.textContent='Calculating...';}
  try{
    for(const s of systems){
      const resp=await fetch('/api/calculate',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload(s))
      });
      const data=await resp.json();
      if(!resp.ok) throw new Error(data.error||`Calculation failed (${resp.status})`);
      active.calculations[s]=data.data;
    }
    v06EnsureBlocks(false);
    saveActive(true);
    v06RenderBlockBar();
    v06RefreshPages();
    if(dotEl) dotEl.className='dot ok';
    if(statusEl) statusEl.textContent='Horoscope generated. You can write the prediction while viewing Page 1.';
  }catch(e){
    console.error(e);
    if(dotEl) dotEl.className='dot error';
    if(statusEl) statusEl.textContent=e.message||'Calculation failed.';
    alert(e.message||'Calculation failed.');
  }finally{
    if(go){go.disabled=false;go.textContent='Generate Horoscope';}
  }
}

function calcView(){
  v06RefreshPages();
}

function pdfView(){
  v06EnterPreview();
}

function printReport(){
  sync();
  saveActive(true);
  printArea.innerHTML=v06PdfHTML();
  window.print();
}

function saveActive(silent=false){
  sync();
  v06Normalize(active);
  active.updated=new Date().toISOString().slice(0,10);
  const i=db.reports.findIndex(x=>x.id===active.id);
  if(i>=0) db.reports[i]=active; else db.reports.push(active);
  saveDB();
  if(!silent) alert('Report saved on this browser.');
}

function login(){
  app.innerHTML=`<div class="login v06-login"><div class="login-card"><div class="v06-login-mark">✦</div><div class="brand">AstroDesk Report Studio</div><div class="sub">Horoscope on the left. Astrologer prediction on the right.</div><div class="note" style="margin:14px 0">V0.6 · Vedic + KP + Horary · Fixed 2-Page Report</div><div class="field"><label>Email</label><input id="email" value="astro@example.com"></div><div class="field"><label>Password</label><input id="pass" type="password" value="Astro123!"></div><button class="btn primary full" id="login">Login</button></div></div>`;
  $('#login').onclick=()=>{
    const u=db.users.find(x=>x.email.toLowerCase()===$('#email').value.trim().toLowerCase()&&x.password===$('#pass').value);
    if(!u) return alert('Invalid login');
    session=u.id; sessionStorage.setItem('astrodesk_session',session); render();
  };
}

function shell(){
  app.innerHTML=`<div class="shell v06-shell"><aside class="side"><div class="side-logo">AstroDesk <span class="side-version">V0.6</span></div><div class="nav"><button data-v="dashboard">Dashboard</button><button data-v="new">New Report</button><button data-v="reports">My Reports</button><button data-v="branding">My Branding</button></div></aside><main class="main"><div class="top"><div><div class="title" id="title"></div><div class="sub" id="sub"></div></div><button class="btn" id="logout">Logout</button></div><div id="view"></div></main></div>`;
  $('#logout').onclick=()=>{session='';sessionStorage.removeItem('astrodesk_session');render();};
  $('.nav').onclick=e=>{if(e.target.dataset.v) show(e.target.dataset.v);};
  show('dashboard');
}

function dashboard(){
  setTitle('Dashboard','V0.6 working layout: horoscope on the left, personal prediction on the right.');
  const mine=db.reports.filter(r=>r.userId===session);
  view.innerHTML=`<div class="grid cols4">
    <div class="card"><div class="label">My Reports</div><div class="stat">${mine.length}</div></div>
    <div class="card"><div class="label">Systems</div><div class="stat" style="font-size:18px">Vedic · KP · Horary</div></div>
    <div class="card"><div class="label">Working View</div><div class="stat" style="font-size:18px">Horoscope + Prediction</div></div>
    <div class="card"><div class="label">PDF</div><div class="stat" style="font-size:18px">2 Pages Side by Side</div></div>
  </div>
  <div class="card" style="margin-top:14px"><b>Start a report</b><div class="sub" style="margin:6px 0 12px">Enter birth details at the top, generate the horoscope, then write your prediction while keeping Page 1 visible.</div><button class="btn primary" id="start">+ New Report</button></div>`;
  $('#start').onclick=()=>openReport(blank());
}

function openReport(r){
  active=v06Normalize(r);
  v06EnsureBlocks(false);
  currentTab='editor';
  setTitle(r.client?`Report · ${r.client}`:'New Report','Client details and selections stay on top. Page 1 horoscope stays beside Page 2 prediction.');
  view.innerHTML=`
    <div class="v06-report-workspace">
      <section class="card v06-setup-card"><div id="v06Setup"></div></section>
      <section class="card v06-blockbar" id="v06BlockBar"></section>
      <div class="v06-workbench">
        <section class="v06-page-column">
          <div class="v06-page-label"><b>1st Page · Horoscope</b><span>Live structured report</span></div>
          <div class="v06-paper v06-edit-paper" id="v06Page1">${v06Page1HTML()}</div>
        </section>
        <section class="v06-page-column">
          <div class="v06-page-label"><b>2nd Page · Personal Prediction</b><span id="v06Page2Client">${esc(active.client||'Personal Prediction')}</span></div>
          <div class="v06-paper v06-prediction-editor-paper">
            <div class="v06-editor-head">
              <div><b>${esc(v06Brand().brandName)}</b><span>${esc(v06Brand().tagline||'Personal Astrology Consultation')}</span></div>
              <div><span>Client</span><b>${esc(active.client||'—')}</b></div>
            </div>
            ${v06EditorToolbar()}
            <div class="v06-editor-title">Personal Prediction</div>
            <div class="v06-editor" id="editor" contenteditable="true" data-placeholder="Write the personal prediction here while viewing the horoscope on the left...">${active.content||''}</div>
          </div>
        </section>
      </div>
    </div>`;
  v06RenderSetup();
  v06RenderBlockBar();
  v06BindEditor();
  v06RefreshPages();
}

function reports(){
  setTitle('My Reports','Saved locally in this browser.');
  const mine=db.reports.filter(r=>r.userId===session).sort((a,b)=>b.updated.localeCompare(a.updated));
  view.innerHTML=`<div class="row" style="justify-content:flex-end;margin-bottom:12px"><button class="btn primary" id="nr">+ New Report</button></div><div class="card"><table class="table"><thead><tr><th>Client</th><th>DOB</th><th>Systems</th><th>Updated</th><th></th></tr></thead><tbody>${mine.map(r=>`<tr><td>${esc(r.client||'Untitled')}</td><td>${esc(r.dob)}</td><td>${Object.entries(r.systems||{}).filter(x=>x[1]).map(x=>x[0].toUpperCase()).join(', ')}</td><td>${esc(r.updated)}</td><td><button class="btn" data-open="${r.id}">Open</button></td></tr>`).join('')||'<tr><td colspan="5">No reports yet.</td></tr>'}</tbody></table></div>`;
  $('#nr').onclick=()=>openReport(blank());
  $$('[data-open]').forEach(b=>b.onclick=()=>openReport(db.reports.find(r=>r.id===b.dataset.open)));
}

// Re-render after this patch is loaded so the V0.6 functions take effect immediately.
try{ render(); }catch(e){ console.error('V0.6 render error',e); }
