const homeDefaults={equity:260000,annualGross:Math.max(0,Number(settings?.income||0)*12),monthlySaving:Math.max(0,Number(settings?.saving||0)),incomeGrowth:0,equityShare:20,affordabilityShare:33,calcInterest:5,maintenance:1,amortizationYears:15};
let homePlan={...homeDefaults,...JSON.parse(localStorage.getItem('bq_home_plan')||'{}')};
const homeMoney=v=>'CHF '+Math.round(Number(v||0)).toLocaleString('de-CH');
const homeMillions=v=>(Number(v||0)/1000000).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2})+' Mio.';
function homeValue(id){return Number(document.getElementById(id)?.value||0)}
function saveHomePlan(){localStorage.setItem('bq_home_plan',JSON.stringify(homePlan))}
function calcHomeAt(years){
 const equity=homePlan.equity+homePlan.monthlySaving*12*years;
 const income=homePlan.annualGross*Math.pow(1+homePlan.incomeGrowth/100,years);
 const eqShare=Math.max(.01,homePlan.equityShare/100),mortgageShare=1-eqShare;
 const equityLimit=equity/eqShare;
 const secondMortgage=Math.max(0,mortgageShare-2/3);
 const annualCostRate=mortgageShare*(homePlan.calcInterest/100)+(homePlan.maintenance/100)+(secondMortgage/Math.max(1,homePlan.amortizationYears));
 const affordabilityLimit=annualCostRate>0?(income*(homePlan.affordabilityShare/100))/annualCostRate:0;
 const price=Math.max(0,Math.min(equityLimit,affordabilityLimit));
 return{years,equity,income,equityLimit,affordabilityLimit,price,limiter:equityLimit<affordabilityLimit?'Eigenkapital':'Tragbarkeit'};
}
function renderHome(){
 const ids={homeEquity:'equity',homeGross:'annualGross',homeMonthlySaving:'monthlySaving',homeIncomeGrowth:'incomeGrowth',homeEquityShare:'equityShare',homeAffordability:'affordabilityShare',homeInterest:'calcInterest',homeMaintenance:'maintenance'};
 Object.entries(ids).forEach(([id,key])=>{const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=homePlan[key]});
 const rows=[calcHomeAt(0),calcHomeAt(2),calcHomeAt(3)];
 rows.forEach((r,i)=>{const suffix=i===0?'Now':i===1?'2':'3';document.getElementById('homePrice'+suffix).textContent=homeMillions(r.price);document.getElementById('homeEquity'+suffix).textContent=homeMoney(r.equity);document.getElementById('homeLimit'+suffix).textContent=r.limiter});
 const now=rows[0],three=rows[2];
 document.getElementById('homeHeroPrice').textContent=homeMillions(now.price);
 document.getElementById('homeHeroSub').textContent=`Heute möglich · begrenzt durch ${now.limiter.toLowerCase()}`;
 document.getElementById('homeGrowthText').textContent=`Mit eurem Sparplan steigt der mögliche Kaufpreis in drei Jahren um ${homeMoney(Math.max(0,three.price-now.price))}.`;
 document.getElementById('homeEquityLimit').textContent=homeMillions(now.equityLimit);
 document.getElementById('homeAffordabilityLimit').textContent=homeMillions(now.affordabilityLimit);
}
function updateHomePlan(){
 homePlan={...homePlan,equity:homeValue('homeEquity'),annualGross:homeValue('homeGross'),monthlySaving:homeValue('homeMonthlySaving'),incomeGrowth:homeValue('homeIncomeGrowth'),equityShare:homeValue('homeEquityShare'),affordabilityShare:homeValue('homeAffordability'),calcInterest:homeValue('homeInterest'),maintenance:homeValue('homeMaintenance')};
 saveHomePlan();renderHome();
}
document.querySelectorAll('[data-home-input]').forEach(el=>el.addEventListener('input',updateHomePlan));
const originalRenderHomeApp=window.render;window.render=function(){originalRenderHomeApp();renderHome()};
renderHome();