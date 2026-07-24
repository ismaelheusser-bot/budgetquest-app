(()=>{
const KEY='bq_income_plan_v1';
const defaults={
 people:[
  {name:'Ismael Heusser',sources:[{name:'Oberholzer AG',monthly:8564,type:'Hauptlohn'}],annual:[{name:'Jährlicher Bonus',amount:0,month:6},{name:'13. Monatslohn',amount:0,month:12}]},
  {name:'Sarah Heusser',sources:[{name:'Ärztefon AG',monthly:1196,type:'Nebeneinkommen'},{name:'Kinderpraxis Uster',monthly:1024,type:'Nebeneinkommen'},{name:'Diakoniewerk Neumünster',monthly:811,type:'Nebeneinkommen'}],annual:[{name:'Jährlicher Bonus',amount:0,month:12},{name:'13. Monatslohn',amount:0,month:12}]}
 ]
};
let plan=JSON.parse(localStorage.getItem(KEY)||'null')||defaults;
const fmt=v=>'CHF '+Number(v||0).toLocaleString('de-CH',{maximumFractionDigits:2});
const esc2=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function save(){localStorage.setItem(KEY,JSON.stringify(plan));renderIncomePlanner()}
function personTotals(p){const regular=p.sources.reduce((s,x)=>s+(+x.monthly||0),0),annual=p.annual.reduce((s,x)=>s+(+x.amount||0),0);return{regular,annual,monthlyEquivalent:regular+annual/12,year:regular*12+annual}}
function renderIncomePlanner(){const host=document.getElementById('incomePlanner');if(!host)return;const totals=plan.people.map(personTotals),regular=totals.reduce((s,x)=>s+x.regular,0),annual=totals.reduce((s,x)=>s+x.annual,0),monthlyEq=regular+annual/12;
 host.innerHTML=`<div class="section-head"><div><h2>👤 Einkommensplanung</h2><div class="tiny">Getrennt nach Ismael und Sarah</div></div></div>
 <div class="metric-grid"><div class="metric"><label>Regelmässig pro Monat</label><strong class="positive">${fmt(regular)}</strong></div><div class="metric"><label>Variable Einnahmen pro Jahr</label><strong>${fmt(annual)}</strong></div><div class="metric"><label>Ø pro Monat inkl. Bonus</label><strong>${fmt(monthlyEq)}</strong></div></div>
 <div class="grid2 section">${plan.people.map((p,pi)=>{const t=personTotals(p);return`<div class="card"><div class="section-head"><div><h3>${pi===0?'👨':'👩'} ${esc2(p.name)}</h3><div class="tiny">${fmt(t.regular)} monatlich · ${fmt(t.year)} jährlich</div></div></div>
 <h4>Regelmässige Einkommen</h4>${p.sources.map((x,si)=>`<div class="category-review"><div><strong>${esc2(x.name)}</strong><div class="tiny">${esc2(x.type||'Einkommen')}</div></div><div><input style="max-width:130px" type="number" step="1" value="${+x.monthly||0}" onchange="updateIncomeSource(${pi},${si},this.value)"><button class="text-btn" onclick="removeIncomeSource(${pi},${si})">Löschen</button></div></div>`).join('')}
 <button class="btn secondary" onclick="addIncomeSource(${pi})">+ Einkommensquelle</button>
 <h4 class="section">Variable/Jährliche Einkommen</h4>${p.annual.map((x,ai)=>`<div class="category-review"><div><strong>${esc2(x.name)}</strong><div class="tiny">Auszahlung Monat ${x.month||12}</div></div><div><input style="max-width:130px" type="number" step="1" value="${+x.amount||0}" onchange="updateAnnualIncome(${pi},${ai},this.value)"><button class="text-btn" onclick="removeAnnualIncome(${pi},${ai})">Löschen</button></div></div>`).join('')}
 <button class="btn secondary" onclick="addAnnualIncome(${pi})">+ Bonus / 13. Monatslohn</button></div>`}).join('')}</div>`;
}
window.updateIncomeSource=(pi,si,v)=>{plan.people[pi].sources[si].monthly=Math.max(0,+v||0);save()};
window.updateAnnualIncome=(pi,ai,v)=>{plan.people[pi].annual[ai].amount=Math.max(0,+v||0);save()};
window.removeIncomeSource=(pi,si)=>{plan.people[pi].sources.splice(si,1);save()};
window.removeAnnualIncome=(pi,ai)=>{plan.people[pi].annual.splice(ai,1);save()};
window.addIncomeSource=pi=>{const name=prompt('Einkommensquelle / Arbeitgeber');if(!name)return;const amount=+prompt('Monatlicher Nettobetrag in CHF','0');plan.people[pi].sources.push({name,monthly:Math.max(0,amount||0),type:'Lohn'});save()};
window.addAnnualIncome=pi=>{const name=prompt('Bezeichnung, z. B. Bonus oder 13. Monatslohn','Jährlicher Bonus');if(!name)return;const amount=+prompt('Jährlicher Betrag in CHF','0'),month=Math.min(12,Math.max(1,+prompt('Auszahlungsmonat 1–12','12')||12));plan.people[pi].annual.push({name,amount:Math.max(0,amount||0),month});save()};
window.getBudgetQuestIncomePlan=()=>plan;
const budget=document.getElementById('budget');if(budget){const host=document.createElement('div');host.id='incomePlanner';host.className='section';budget.appendChild(host);renderIncomePlanner()}

let manualMode=false;
const step2=document.querySelector('.wizard-step[data-step="2"]');
if(step2){
 const actions=step2.querySelector('.wizard-actions');
 const manual=document.createElement('button');
 manual.type='button';manual.className='btn secondary';manual.textContent='Ohne Import manuell einrichten';manual.onclick=()=>window.startManualSetup();
 actions?.insertBefore(manual,actions.lastElementChild);
 const note=document.createElement('p');note.className='tiny';note.textContent='Der CSV-Import ist optional. Bei ungenauen Bankdaten kannst du Löhne, Fixkosten und Sparziel vollständig selbst eintragen.';
 step2.insertBefore(note,actions);
}
function manualIncomeTotal(){return plan.people.reduce((sum,p)=>sum+p.sources.reduce((s,x)=>s+(+x.monthly||0),0),0)}
window.startManualSetup=()=>{
 manualMode=true;
 const income=document.getElementById('setupIncome'),fixed=document.getElementById('setupFixed'),saving=document.getElementById('setupSaving'),cats=document.getElementById('setupCategories');
 income.value=manualIncomeTotal();
 fixed.value=Number(JSON.parse(localStorage.getItem('bq_settings')||'null')?.fixed||0);
 saving.value=Number(JSON.parse(localStorage.getItem('bq_settings')||'null')?.saving||0);
 cats.innerHTML=`<div class="info-note"><strong>Manuelle Einrichtung</strong><br>Es werden keine Bankbuchungen importiert. Trage die drei Monatswerte oben selbst ein. Die Löhne kannst du nach dem Öffnen des Dashboards unter <b>Budget → Einkommensplanung</b> getrennt für Ismael und Sarah bearbeiten.</div>
 <div class="category-review"><span>👨 Ismael Heusser</span><strong>${fmt(personTotals(plan.people[0]).regular)}/Monat</strong></div>
 <div class="category-review"><span>👩 Sarah Heusser</span><strong>${fmt(personTotals(plan.people[1]).regular)}/Monat</strong></div>
 <div class="tiny" style="margin-top:12px">Fixkosten werden hier als Monatsgesamtbetrag eingetragen. Einzelne Budgetkategorien lassen sich anschliessend jederzeit ergänzen.</div>`;
 const title=document.querySelector('.wizard-step[data-step="4"] h1');if(title)title.textContent='Budget manuell einrichten';
 const p=document.querySelector('.wizard-step[data-step="4"] > p');if(p)p.textContent='Bitte trage deine Monatswerte ein. Du kannst alles später ändern.';
 window.setupNext(4);
};
const originalFinish=window.finishSetup;
window.finishSetup=function(){
 if(!manualMode)return originalFinish();
 const household=(document.getElementById('setupHousehold').value||'Unser Haushalt').trim();
 const settings={income:+document.getElementById('setupIncome').value||0,fixed:+document.getElementById('setupFixed').value||0,saving:+document.getElementById('setupSaving').value||0};
 localStorage.setItem('bq_household',household);localStorage.setItem('bq_settings',JSON.stringify(settings));localStorage.setItem(KEY,JSON.stringify(plan));localStorage.setItem('bq_setup_done','1');
 document.getElementById('setupWizard').hidden=true;location.reload();
};

// Budget beginnt am ersten Tag des aktuellen Monats.
const now=new Date();
const budgetStart=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
const inCurrentBudget=row=>row&&String(row.date||'')>=budgetStart;
localStorage.setItem('bq_budget_start',budgetStart);

// Historische Buchungen aus früheren Importen entfernen.
if(Array.isArray(tx)){
 const current=tx.filter(inCurrentBudget);
 if(current.length!==tx.length){tx=current;saveAll();render()}
}

// Alte Daten dürfen analysiert werden, werden aber nicht als Buchungen übernommen.
const finishWithDateFilter=window.finishSetup;
window.finishSetup=function(){
 if(!manualMode&&setupAnalysis&&Array.isArray(setupAnalysis.rows))setupAnalysis.rows=setupAnalysis.rows.filter(inCurrentBudget);
 return finishWithDateFilter.apply(this,arguments);
};
const importCsvWithDateFilter=window.importCsv;
window.importCsv=function(){
 if(Array.isArray(csvRows))csvRows=csvRows.filter(inCurrentBudget);
 return importCsvWithDateFilter.apply(this,arguments);
};

// Sichtbare Löschfunktionen für einzelne oder alle Buchungen nachladen.
if(!document.querySelector('script[data-bq-reset-controls]')){
 const script=document.createElement('script');
 script.src='reset-controls.js?v=18';
 script.dataset.bqResetControls='1';
 document.body.appendChild(script);
}
})();