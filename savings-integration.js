(()=>{
  const money=v=>'CHF '+Number(v||0).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2});
  const activeSaving=()=>Number(localStorage.getItem('bq_active_savings_monthly')||0);
  function ensureDashboard(){
    const today=document.getElementById('today');
    if(!today||document.getElementById('budgetReality'))return;
    const hero=today.querySelector('.hero');
    const block=document.createElement('div');
    block.id='budgetReality';
    block.className='card section';
    block.innerHTML='<div class="section-head"><div><h3>Monatsbudget im Überblick</h3><div class="tiny">Geplant, verbraucht und voraussichtliche Ersparnis</div></div></div><div class="budget-reality-grid"><div><span>Budgetierte Ausgaben total</span><strong id="brBudgeted"></strong><small>Fixkosten + variable Budgets</small></div><div><span>Bereits verbraucht</span><strong id="brUsed"></strong><small>Fixkosten + erfasste Ausgaben</small></div><div><span>Noch verfügbares Ausgabenbudget</span><strong id="brRemaining"></strong><small>Bis zum budgetierten Total</small></div><div><span>Erwartete Ersparnis</span><strong id="brExpected"></strong><small id="brExpectedNote"></small></div></div><div class="progress budget-reality-progress"><span id="brProgress"></span></div>';
    hero?.after(block);
    const style=document.createElement('style');
    style.textContent='.budget-reality-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}.budget-reality-grid>div{background:#0d1728;border:1px solid var(--line);border-radius:15px;padding:13px;display:grid;gap:5px}.budget-reality-grid span,.budget-reality-grid small{color:var(--muted);font-size:12px}.budget-reality-grid strong{font-size:19px}.budget-reality-progress{margin-top:13px}@media(max-width:720px){.budget-reality-grid{grid-template-columns:1fr 1fr}}';
    document.head.appendChild(style);
  }
  function updateDashboard(){
    ensureDashboard();
    if(typeof settings==='undefined'||typeof budgets==='undefined'||typeof monthSpent!=='function')return;
    const income=Number(settings.income||0),fixed=Number(settings.fixed||0),plannedSaving=Number(settings.saving||0);
    const variableBudget=budgets.reduce((s,b)=>s+Number(b.limit||0),0);
    const variableUsed=monthSpent();
    const budgetedExpenses=fixed+variableBudget;
    const usedExpenses=fixed+variableUsed;
    const remaining=Math.max(0,budgetedExpenses-usedExpenses);
    const expectedSaving=income-usedExpenses;
    const expectedRate=income?expectedSaving/income*100:0;
    const extraVsPlan=expectedSaving-plannedSaving;
    const plannedSpendAfterSaving=Math.max(0,income-plannedSaving);
    const heroValue=document.getElementById('incomeHero');
    const heroSub=document.getElementById('heroSpent');
    if(heroValue)heroValue.textContent=money(remaining);
    if(heroSub)heroSub.textContent=`Noch verfügbar von ${money(budgetedExpenses)} Ausgabenbudget`;
    const savingMetric=document.getElementById('savingRateMetric');
    if(savingMetric)savingMetric.textContent=`${expectedRate.toLocaleString('de-CH',{maximumFractionDigits:1})} % · ${money(expectedSaving)}`;
    document.getElementById('brBudgeted').textContent=money(budgetedExpenses);
    document.getElementById('brUsed').textContent=money(usedExpenses);
    document.getElementById('brRemaining').textContent=money(remaining);
    const expected=document.getElementById('brExpected');expected.textContent=money(expectedSaving);expected.className=expectedSaving>=plannedSaving?'positive':'negative';
    document.getElementById('brExpectedNote').textContent=extraVsPlan>=0?`${money(extraVsPlan)} mehr als Sparziel`:`${money(Math.abs(extraVsPlan))} unter Sparziel`;
    document.getElementById('brProgress').style.width=`${Math.min(100,budgetedExpenses?usedExpenses/budgetedExpenses*100:0)}%`;
    const goal=document.getElementById('goalValue');if(goal)goal.textContent=money(plannedSaving+activeSaving());
    window.bqBudgetSummary={income,fixed,variableBudget,variableUsed,budgetedExpenses,usedExpenses,remaining,expectedSaving,expectedRate,extraVsPlan,plannedSpendAfterSaving,activeSaving:activeSaving()};
  }
  const start=()=>{updateDashboard();const original=window.render;if(typeof original==='function'&&!original.__savingsWrapped){const wrapped=function(){original();updateDashboard()};wrapped.__savingsWrapped=true;window.render=wrapped}window.addEventListener('bq:savings-updated',updateDashboard)};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();