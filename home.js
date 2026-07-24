const homeDefaults={equity:260000,annualGross:Math.max(0,Number(settings?.income||0)*12),monthlySaving:Math.max(0,Number(settings?.saving||0)),pillar3aBalance:0,pillar3aAnnual:0,pillar3aMode:'withdraw',incomeGrowth:0,equityShare:20,affordabilityShare:33,calcInterest:5,maintenance:1,amortizationYears:15};
let homePlan={...homeDefaults,...JSON.parse(localStorage.getItem('bq_home_plan')||'{}')};
const homeMoney=v=>'CHF '+Math.round(Number(v||0)).toLocaleString('de-CH');
const homeMillions=v=>(Number(v||0)/1000000).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2})+' Mio.';
function homeValue(id){return Number(document.getElementById(id)?.value||0)}
function saveHomePlan(){localStorage.setItem('bq_home_plan',JSON.stringify(homePlan))}
function calcHomeAt(years){
 const cashEquity=homePlan.equity+homePlan.monthlySaving*12*years;
 const pillar3a=homePlan.pillar3aBalance+homePlan.pillar3aAnnual*years;
 const usable3a=homePlan.pillar3aMode==='withdraw'?pillar3a:0;
 const equity=cashEquity+usable3a;
 const income=homePlan.annualGross*Math.pow(1+homePlan.incomeGrowth/100,years);
 const eqShare=Math.max(.01,homePlan.equityShare/100),mortgageShare=1-eqShare;
 const equityLimit=equity/eqShare;
 const secondMortgage=Math.max(0,mortgageShare-2/3);
 const annualCostRate=mortgageShare*(homePlan.calcInterest/100)+(homePlan.maintenance/100)+(secondMortgage/Math.max(1,homePlan.amortizationYears));
 const affordabilityLimit=annualCostRate>0?(income*(homePlan.affordabilityShare/100))/annualCostRate:0;
 const price=Math.max(0,Math.min(equityLimit,affordabilityLimit));
 return{years,cashEquity,pillar3a,equity,income,equityLimit,affordabilityLimit,price,limiter:equityLimit<affordabilityLimit?'Eigenkapital':'Tragbarkeit'};
}
function renderHome(){
 const ids={homeEquity:'equity',homeGross:'annualGross',homeMonthlySaving:'monthlySaving',home3aBalance:'pillar3aBalance',home3aAnnual:'pillar3aAnnual',homeIncomeGrowth:'incomeGrowth',homeEquityShare:'equityShare',homeAffordability:'affordabilityShare',homeInterest:'calcInterest',homeMaintenance:'maintenance'};
 Object.entries(ids).forEach(([id,key])=>{const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=homePlan[key]});
 const mode=document.getElementById('home3aMode');if(mode&&document.activeElement!==mode)mode.value=homePlan.pillar3aMode;
 const rows=[calcHomeAt(0),calcHomeAt(2),calcHomeAt(3)];
 rows.forEach((r,i)=>{const suffix=i===0?'Now':i===1?'2':'3';document.getElementById('homePrice'+suffix).textContent=homeMillions(r.price);document.getElementById('homeEquity'+suffix).textContent=homeMoney(r.equity);document.getElementById('home3a'+suffix).textContent=homeMoney(r.pillar3a);document.getElementById('homeLimit'+suffix).textContent=r.limiter});
 const now=rows[0],three=rows[2];
 document.getElementById('homeHeroPrice').textContent=homeMillions(now.price);
 document.getElementById('homeHeroSub').textContent=`Heute möglich · begrenzt durch ${now.limiter.toLowerCase()}`;
 document.getElementById('homeGrowthText').textContent=`Mit Sparplan und Säule 3a steigt der mögliche Kaufpreis in drei Jahren um ${homeMoney(Math.max(0,three.price-now.price))}.`;
 document.getElementById('homeEquityLimit').textContent=homeMillions(now.equityLimit);
 document.getElementById('homeAffordabilityLimit').textContent=homeMillions(now.affordabilityLimit);
 document.getElementById('home3aNote').textContent=homePlan.pillar3aMode==='withdraw'?'Das 3a-Guthaben wird als verfügbares Eigenkapital eingerechnet. Bezugssteuern sind noch nicht abgezogen.':'Bei Verpfändung bleibt das 3a-Guthaben unangetastet und wird in dieser konservativen Berechnung nicht als direkt verfügbares Eigenkapital gezählt.';
}
function updateHomePlan(){
 homePlan={...homePlan,equity:homeValue('homeEquity'),annualGross:homeValue('homeGross'),monthlySaving:homeValue('homeMonthlySaving'),pillar3aBalance:homeValue('home3aBalance'),pillar3aAnnual:homeValue('home3aAnnual'),pillar3aMode:document.getElementById('home3aMode')?.value||'withdraw',incomeGrowth:homeValue('homeIncomeGrowth'),equityShare:homeValue('homeEquityShare'),affordabilityShare:homeValue('homeAffordability'),calcInterest:homeValue('homeInterest'),maintenance:homeValue('homeMaintenance')};
 saveHomePlan();renderHome();
}
document.querySelectorAll('[data-home-input]').forEach(el=>el.addEventListener('input',updateHomePlan));
document.getElementById('home3aMode')?.addEventListener('change',updateHomePlan);
const originalRenderHomeApp=window.render;window.render=function(){originalRenderHomeApp();renderHome()};
renderHome();