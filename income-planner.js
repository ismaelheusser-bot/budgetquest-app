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
window.addIncomeSource=pi=>{const name=prompt('Einkommensquelle / Arbeitgeber');if(!name)return;const amount=+prompt('Monatlicher Nettobetrag in CHF','0');plan.people[pi].sources.push({name,monthly:Math.max(0,amount||0),type:'Einkommen'});save()};
window.addAnnualIncome=pi=>{const name=prompt('Bezeichnung, z. B. Bonus oder 13. Monatslohn','Jährlicher Bonus');if(!name)return;const amount=+prompt('Jährlicher Betrag in CHF','0'),month=Math.min(12,Math.max(1,+prompt('Auszahlungsmonat 1–12','12')||12));plan.people[pi].annual.push({name,amount:Math.max(0,amount||0),month});save()};
window.getBudgetQuestIncomePlan=()=>plan;
const budget=document.getElementById('budget');if(budget){const host=document.createElement('div');host.id='incomePlanner';host.className='section';budget.appendChild(host);renderIncomePlanner()}
})();