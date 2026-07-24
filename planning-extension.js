(()=>{
 const SCHOOL_KEY='bq_private_school_monthly';
 const money=v=>'CHF '+Number(v||0).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const schoolCost=()=>Math.max(0,Number(localStorage.getItem(SCHOOL_KEY)||0));

 function migrateSarahProfile(){
  if(typeof householdProfiles!=='undefined'&&Array.isArray(householdProfiles)){
   let changed=false;
   householdProfiles=householdProfiles.map((profile,index)=>{
    const name=String(profile?.name||'').trim();
    if(profile?.id==='partner'||/^partnerin$/i.test(name)||(!name&&index===1)){
     changed=changed||name!=='Sarah Heusser';
     return{...profile,id:profile?.id||'partner',name:'Sarah Heusser',emoji:profile?.emoji||'👤'};
    }
    return profile;
   });
   if(changed&&typeof saveProfiles==='function')saveProfiles();
   if(typeof renderProfiles==='function')renderProfiles();
  }
  document.querySelectorAll('.share-box h3').forEach(el=>{
   if(/partnerin/i.test(el.textContent||''))el.textContent='Mit Sarah Heusser teilen';
  });
 }

 function restoreThreeYearHomeView(){
  [4,5].forEach(year=>document.getElementById('homePrice'+year)?.closest('.home-year')?.remove());
  document.getElementById('homeTimelineControls')?.remove();
  const grid=document.querySelector('#home .timeline-grid');
  if(grid){grid.style.gridTemplateColumns='';grid.style.overflowX='';grid.style.scrollSnapType='';grid.style.padding='';}
 }

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
  const fixed=document.getElementById('fixedInput'),fixedLabel=fixed?.closest('label');
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
  const addForm=document.querySelector('#budget form[onsubmit*="addBudget"]'),addCard=addForm?.closest('.card');
  makeCollapsible(addCard,'Kategorie hinzufügen',()=>`${budgets?.length||0} Kategorien eingerichtet`);
  addForm?.addEventListener('submit',()=>setTimeout(()=>addCard?._setCollapsed?.(),0),true);
  const homeCard=document.querySelector('#home .card.section');
  makeCollapsible(homeCard,'Eigenheim-Angaben',()=>`Eigenkapital ${homeMoney(typeof homePlan!=='undefined'?homePlan.equity:0)} · Sparen ${homeMoney(typeof homePlan!=='undefined'?homePlan.monthlySaving:0)}/Monat`);
 }

 function renderExtension(){migrateSarahProfile();restoreThreeYearHomeView();ensureSchoolInput();ensureOtherCollapsibles();}
 const style=document.createElement('style');
 style.textContent='.collapsible-head{width:100%;display:flex;justify-content:space-between;align-items:center;background:transparent;border:0;color:inherit;padding:0;text-align:left}.collapsible-head span{display:grid;gap:4px}.collapsible-summary{color:var(--muted);font-size:12px}.collapsed .collapsible-body{display:none}.collapsed{padding-bottom:16px}';
 document.head.appendChild(style);
 const start=()=>{renderExtension();const original=window.render;if(typeof original==='function'&&!original.__planningWrapped){const wrapped=function(){original();renderExtension()};wrapped.__planningWrapped=true;window.render=wrapped}window.addEventListener('bq:savings-updated',renderExtension);window.addEventListener('bq:fixed-costs-updated',renderExtension);window.addEventListener('bq:income-updated',renderExtension)};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();