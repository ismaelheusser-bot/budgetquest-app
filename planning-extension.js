(()=>{
 const SCHOOL_KEY='bq_private_school_monthly';
 const money=v=>'CHF '+Number(v||0).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const schoolCost=()=>Math.max(0,Number(localStorage.getItem(SCHOOL_KEY)||0));

 function makeCollapsible(card,title,summaryFn){
  if(!card||card.dataset.collapsibleReady)return;
  card.dataset.collapsibleReady='1';
  const body=document.createElement('div');body.className='collapsible-body';
  while(card.firstChild)body.appendChild(card.firstChild);
  const head=document.createElement('button');head.type='button';head.className='collapsible-head';
  head.innerHTML=`<span><strong>${title}</strong><small class="collapsible-summary"></small></span><b>▾</b>`;
  card.append(head,body);
  const setOpen=open=>{card.classList.toggle('collapsed',!open);head.querySelector('b').textContent=open?'▴':'▾';head.querySelector('.collapsible-summary').textContent=summaryFn?summaryFn():''};
  head.onclick=()=>setOpen(card.classList.contains('collapsed'));
  card._setCollapsed=()=>setOpen(false);card._setOpen=()=>setOpen(true);setOpen(true);
 }

 function ensureSchoolInput(){
  const form=document.querySelector('#budget form[onsubmit*="saveSettings"]');
  if(!form||document.getElementById('privateSchoolInput'))return;
  const fixed=document.getElementById('fixedInput');
  const fixedLabel=fixed?.closest('label');
  if(fixedLabel)fixedLabel.childNodes[0].textContent='Übrige Fixkosten';
  const label=document.createElement('label');
  label.innerHTML='Privatschule pro Monat<input id="privateSchoolInput" type="number" min="0" step="0.05" inputmode="decimal"><small class="tiny">Wird als feste monatliche Ausgabe zusätzlich zu den übrigen Fixkosten gerechnet.</small>';
  fixedLabel?.after(label);
  document.getElementById('privateSchoolInput').value=schoolCost();
  const card=form.closest('.card');
  makeCollapsible(card,'Grunddaten',()=>`Einkommen ${money(settings?.income)} · Fixkosten ${money(Number(settings?.fixed||0)+schoolCost())} · Sparziel ${money(settings?.saving)}`);
  form.addEventListener('submit',()=>{
   localStorage.setItem(SCHOOL_KEY,String(Math.max(0,Number(document.getElementById('privateSchoolInput')?.value||0))));
   setTimeout(()=>{card?._setCollapsed?.();window.dispatchEvent(new Event('bq:fixed-costs-updated'))},0);
  },true);
 }

 function ensureOtherCollapsibles(){
  const addForm=document.querySelector('#budget form[onsubmit*="addBudget"]');
  const addCard=addForm?.closest('.card');
  makeCollapsible(addCard,'Kategorie hinzufügen',()=>`${budgets?.length||0} Kategorien eingerichtet`);
  addForm?.addEventListener('submit',()=>setTimeout(()=>addCard?._setCollapsed?.(),0),true);
  const homeCard=document.querySelector('#home .card.section');
  makeCollapsible(homeCard,'Eigenheim-Angaben',()=>`Eigenkapital ${homeMoney(typeof homePlan!=='undefined'?homePlan.equity:0)} · Sparen ${homeMoney(typeof homePlan!=='undefined'?homePlan.monthlySaving:0)}/Monat`);
  document.querySelectorAll('[data-home-input],#home3aMode').forEach(el=>el.addEventListener('change',()=>setTimeout(()=>homeCard?._setCollapsed?.(),80)));
 }

 function ensureFiveYears(){
  const grid=document.querySelector('#home .timeline-grid');
  if(!grid||document.getElementById('homePrice5'))return;
  [4,5].forEach(year=>{const card=document.createElement('div');card.className='home-year';card.innerHTML=`<small>In ${year} Jahren</small><strong id="homePrice${year}"></strong><span>Eigenmittel <b id="homeEquity${year}"></b></span><span>Säule 3a <b id="home3a${year}"></b></span><em id="homeLimit${year}"></em>`;grid.appendChild(card)});
  grid.style.gridTemplateColumns='repeat(5,minmax(170px,1fr))';grid.style.overflowX='auto';
 }

 function renderExtension(){
  ensureSchoolInput();ensureOtherCollapsibles();ensureFiveYears();
  if(typeof calcHomeAt==='function'){
   [4,5].forEach(year=>{const r=calcHomeAt(year);const p=document.getElementById('homePrice'+year),e=document.getElementById('homeEquity'+year),a=document.getElementById('home3a'+year),l=document.getElementById('homeLimit'+year);if(p)p.textContent=homeMillions(r.price);if(e)e.textContent=homeMoney(r.equity);if(a)a.textContent=homeMoney(r.pillar3a);if(l)l.textContent=r.limiter});
   const now=calcHomeAt(0),five=calcHomeAt(5),simFive=calcHomeAt(5,true),growth=document.getElementById('homeGrowthText');
   if(growth)growth.textContent=homeSavingsMode()==='committed'?`Mit Sparziel, übernommenen Sparhebeln und Säule 3a steigt der mögliche Kaufpreis in fünf Jahren um ${homeMoney(Math.max(0,five.price-now.price))}.`:`Aktueller Sparplan: +${homeMoney(Math.max(0,five.price-now.price))} Kaufpreis in fünf Jahren. Mit allen aktivierten Sparhebeln wären es +${homeMoney(Math.max(0,simFive.price-now.price))}.`;
  }
 }

 const style=document.createElement('style');style.textContent='.collapsible-head{width:100%;display:flex;justify-content:space-between;align-items:center;background:transparent;border:0;color:inherit;padding:0;text-align:left}.collapsible-head span{display:grid;gap:4px}.collapsible-summary{color:var(--muted);font-size:12px}.collapsed .collapsible-body{display:none}.collapsed{padding-bottom:16px}.timeline-grid{scrollbar-width:none}.timeline-grid::-webkit-scrollbar{display:none}';document.head.appendChild(style);
 const start=()=>{renderExtension();const original=window.render;if(typeof original==='function'&&!original.__planningWrapped){const wrapped=function(){original();renderExtension()};wrapped.__planningWrapped=true;window.render=wrapped}window.addEventListener('bq:savings-updated',renderExtension);window.addEventListener('bq:fixed-costs-updated',renderExtension)};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();