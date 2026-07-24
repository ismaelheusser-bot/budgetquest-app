(()=>{
  const KEY='bq_savings_assistant';
  const defaults={adults:2,children:2,pets:0,housing:'rent',housingCost:0,shoppingTrips:4,takeaway:2,restaurants:2,spontaneous:3,planning:3,priceCompare:3,discounts:3,brands:3,subscriptions:0,insuranceAnnual:0,insuranceCompared:0,vehicles:1,vehicleMonthly:0,publicTransportMonthly:0,holidayAnnual:0,hobbiesMonthly:0};
  const load=()=>({...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')});
  const save=data=>localStorage.setItem(KEY,JSON.stringify(data));
  const money=v=>'CHF '+Number(v||0).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2});
  const num=id=>Number(document.getElementById(id)?.value||0);
  const val=id=>document.getElementById(id)?.value||'';
  const field=(label,id,type='number',extra='')=>`<label>${label}<input id="${id}" type="${type}" ${extra}></label>`;
  const select=(label,id,options)=>`<label>${label}<select id="${id}">${options.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label>`;

  function createUI(){
    if(document.getElementById('assistant'))return;
    const screen=document.createElement('section');
    screen.id='assistant';screen.className='screen';
    screen.innerHTML=`
      <div class="section-head"><div><h2>Spar-Assistent</h2><div class="tiny">Deine Angaben werden nur auf diesem Gerät gespeichert.</div></div><div class="pill" id="assistantProfileScore">Profil 0 %</div></div>
      <div class="grid2 section">
        <div class="card"><h3>👨‍👩‍👧 Haushalt</h3><div class="assistant-grid">
          ${field('Erwachsene','saAdults','number','min="1" max="10"')}${field('Kinder','saChildren','number','min="0" max="10"')}${field('Haustiere','saPets','number','min="0" max="10"')}
          ${select('Wohnform','saHousing',[['rent','Miete'],['own','Eigentum']])}${field('Miete / Hypothek pro Monat','saHousingCost','number','min="0" step="10"')}
        </div></div>
        <div class="card"><h3>🛒 Einkaufen & Essen</h3><div class="assistant-grid">
          ${field('Lebensmitteleinkäufe pro Woche','saShoppingTrips','number','min="0" max="30"')}${field('Take-away pro Monat','saTakeaway','number','min="0" max="60"')}${field('Restaurantbesuche pro Monat','saRestaurants','number','min="0" max="60"')}
          ${field('Spontankäufe 1–5','saSpontaneous','range','min="1" max="5"')}${field('Einkäufe planen 1–5','saPlanning','range','min="1" max="5"')}${field('Preise vergleichen 1–5','saPriceCompare','range','min="1" max="5"')}${field('Aktionen nutzen 1–5','saDiscounts','range','min="1" max="5"')}${field('Markenprodukte 1–5','saBrands','range','min="1" max="5"')}
        </div></div>
        <div class="card"><h3>🚗 Mobilität</h3><div class="assistant-grid">
          ${field('Fahrzeuge','saVehicles','number','min="0" max="10"')}${field('Fahrzeugkosten pro Monat','saVehicleMonthly','number','min="0" step="10"')}${field('ÖV-Kosten pro Monat','saPublicTransportMonthly','number','min="0" step="10"')}
        </div></div>
        <div class="card"><h3>📺 Verträge & Freizeit</h3><div class="assistant-grid">
          ${field('Abonnemente pro Monat','saSubscriptions','number','min="0" step="1"')}${field('Versicherungen pro Jahr','saInsuranceAnnual','number','min="0" step="10"')}${field('Jahre seit letztem Vergleich','saInsuranceCompared','number','min="0" max="30"')}${field('Ferienbudget pro Jahr','saHolidayAnnual','number','min="0" step="50"')}${field('Hobbys pro Monat','saHobbiesMonthly','number','min="0" step="10"')}
        </div></div>
      </div>
      <div class="actions section"><button class="btn" id="saveAssistant">Angaben speichern & analysieren</button><button class="btn secondary" id="resetAssistant">Zurücksetzen</button></div>
      <div class="card section"><div class="section-head"><div><h3>Deine grössten Sparhebel</h3><div class="tiny">Priorisiert nach realistischem monatlichem Potenzial.</div></div><strong id="assistantTotal"></strong></div><div id="assistantResults"></div></div>`;
    document.querySelector('.app')?.appendChild(screen);

    const nav=document.querySelector('.nav');
    const btn=document.createElement('button');btn.dataset.target='assistant';btn.textContent='Assistent';nav?.appendChild(btn);

    const style=document.createElement('style');style.textContent=`
      .assistant-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:11px}.assistant-grid input,.assistant-grid select{width:100%;border:1px solid #31425f;border-radius:13px;padding:12px;background:#0d1728;color:white}.assistant-grid input[type=range]{padding:8px 0}.lever{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:start;padding:15px 0;border-bottom:1px solid var(--line)}.lever-rank{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#f5c40018;color:#ffe36d;font-weight:900}.lever h4{margin:0 0 4px}.lever p{margin:0;color:var(--muted);font-size:13px;line-height:1.45}.lever strong{white-space:nowrap;color:var(--green)}.assistant-empty{padding:24px 4px;color:var(--muted);text-align:center}@media(max-width:720px){.assistant-grid{grid-template-columns:1fr}.nav{grid-template-columns:repeat(7,minmax(0,1fr))!important;overflow:visible!important}.nav button{font-size:9px!important;padding:9px 1px!important;min-width:0!important}.nav button[data-target="assistant"]{font-size:0!important}.nav button[data-target="assistant"]:after{content:'Coach';font-size:9px}}
    `;document.head.appendChild(style);

    bindNavigation();bindActions();fillForm();analyse();
  }

  function bindNavigation(){
    document.querySelectorAll('.nav button').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
      button.classList.add('active');document.getElementById(button.dataset.target)?.classList.add('active');
      window.scrollTo({top:0,behavior:'smooth'});
    }));
  }

  function fillForm(){const d=load();Object.entries(d).forEach(([k,v])=>{const el=document.getElementById('sa'+k[0].toUpperCase()+k.slice(1));if(el)el.value=v});profileScore(d)}
  function readForm(){return{adults:num('saAdults'),children:num('saChildren'),pets:num('saPets'),housing:val('saHousing'),housingCost:num('saHousingCost'),shoppingTrips:num('saShoppingTrips'),takeaway:num('saTakeaway'),restaurants:num('saRestaurants'),spontaneous:num('saSpontaneous'),planning:num('saPlanning'),priceCompare:num('saPriceCompare'),discounts:num('saDiscounts'),brands:num('saBrands'),subscriptions:num('saSubscriptions'),insuranceAnnual:num('saInsuranceAnnual'),insuranceCompared:num('saInsuranceCompared'),vehicles:num('saVehicles'),vehicleMonthly:num('saVehicleMonthly'),publicTransportMonthly:num('saPublicTransportMonthly'),holidayAnnual:num('saHolidayAnnual'),hobbiesMonthly:num('saHobbiesMonthly')}}
  function profileScore(d){const keys=['adults','children','housing','shoppingTrips','spontaneous','planning','priceCompare','subscriptions','insuranceAnnual','vehicles','holidayAnnual','hobbiesMonthly'];const done=keys.filter(k=>d[k]!==''&&d[k]!==null&&d[k]!==undefined).length;document.getElementById('assistantProfileScore').textContent=`Profil ${Math.round(done/keys.length*100)} %`}
  function transactions(){try{return JSON.parse(localStorage.getItem('bq_tx')||'[]')}catch{return[]}}
  function spentBy(pattern){const now=new Date();return transactions().filter(t=>{const d=new Date(t.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()&&Number(t.amount)>0&&pattern.test(`${t.cat||''} ${t.title||''}`)}).reduce((s,t)=>s+Number(t.amount||0),0)}

  function analyse(){
    const d=load(),levers=[];
    const foodSpent=spentBy(/Lebensmittel|migros|coop|aldi|lidl|denner|volg/i);
    const diningSpent=spentBy(/Restaurant|Take.?away|cafe|pizzeria|mcdonald|burger/i);
    const subSpent=spentBy(/Abonnement|netflix|spotify|disney|swisscom|sunrise|salt|apple\.com\/bill/i);
    const transportSpent=spentBy(/Transport|tank|shell|avia|agrola|parking|sbb/i);

    const foodPotential=Math.max(0,Math.round((foodSpent||Math.max(300,(d.adults*260+d.children*150)))*(0.03+(d.shoppingTrips>3?(d.shoppingTrips-3)*0.018:0)+(d.spontaneous-1)*0.012+(d.brands-1)*0.01-(d.planning-1)*0.006)));
    if(foodPotential>=10)levers.push({name:'Lebensmittel',value:foodPotential,text:d.shoppingTrips>3?`${d.shoppingTrips} Einkäufe pro Woche erhöhen das Risiko für ungeplante Zusatzkäufe. Ein fester Wocheneinkauf ist hier der stärkste Hebel.`:'Mehr Einkaufsplanung, Preisvergleich und weniger Markenprodukte können die Kosten senken.'});

    const diningBase=diningSpent||d.takeaway*22+d.restaurants*55;const diningPotential=Math.round(Math.max(0,diningBase*0.28));
    if(diningPotential>=10)levers.push({name:'Restaurant & Take-away',value:diningPotential,text:`Aktuell sind ${d.restaurants} Restaurant- und ${d.takeaway} Take-away-Besuche pro Monat eingetragen. Eine moderate Reduktion wurde berechnet.`});

    const subscriptionsBase=Math.max(subSpent,d.subscriptions);const subPotential=Math.round(Math.max(0,subscriptionsBase*0.22));
    if(subPotential>=5)levers.push({name:'Abonnemente',value:subPotential,text:'Prüfe doppelte, selten genutzte oder jährlich günstigere Abonnemente.'});

    const insurancePotential=d.insuranceCompared>=3?Math.round(d.insuranceAnnual/12*0.08):0;
    if(insurancePotential>=10)levers.push({name:'Versicherungen',value:insurancePotential,text:`Der letzte Vergleich liegt ${d.insuranceCompared} Jahre zurück. Das Potenzial ist eine vorsichtige Schätzung von 8 % der Prämien.`});

    const mobilityBase=Math.max(transportSpent,d.vehicleMonthly+d.publicTransportMonthly);const mobilityPotential=Math.round(mobilityBase*(d.vehicles>0?0.08:0.04));
    if(mobilityPotential>=10)levers.push({name:'Mobilität',value:mobilityPotential,text:'Fahrten bündeln, Parkkosten prüfen und Fixkosten pro Fahrzeug sichtbar machen.'});

    const leisureBase=d.hobbiesMonthly+d.holidayAnnual/12;const leisurePotential=Math.round(leisureBase*0.06);
    if(leisurePotential>=10)levers.push({name:'Freizeit & Ferien',value:leisurePotential,text:'Nicht pauschal streichen: Lege zuerst ein Monatslimit fest und reduziere nur Ausgaben ohne echten Nutzen.'});

    levers.sort((a,b)=>b.value-a.value);const total=levers.reduce((s,l)=>s+l.value,0);profileScore(d);
    document.getElementById('assistantTotal').textContent=total?`${money(total)} / Monat`:'Noch keine Analyse';
    document.getElementById('assistantResults').innerHTML=levers.length?levers.slice(0,5).map((l,i)=>`<div class="lever"><div class="lever-rank">${i+1}</div><div><h4>${l.name}</h4><p>${l.text}</p></div><strong>${money(l.value)}</strong></div>`).join(''):'<div class="assistant-empty">Trage deine aktuellen Angaben ein. Danach zeigt der Assistent die grössten Sparhebel.</div>';
  }

  function bindActions(){
    document.getElementById('saveAssistant').onclick=()=>{const d=readForm();save(d);analyse();if(typeof xp==='number'){xp+=40;localStorage.setItem('bq_xp',xp);if(typeof render==='function')render()}alert('Angaben gespeichert. Die Sparhebel wurden aktualisiert.')};
    document.getElementById('resetAssistant').onclick=()=>{if(confirm('Alle Assistenten-Angaben zurücksetzen?')){localStorage.removeItem(KEY);fillForm();analyse()}};
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',createUI):createUI();
})();