const profileDefaults=[{id:'isme',name:'Ismael',emoji:'👤'},{id:'partner',name:'Partnerin',emoji:'👤'}];
let householdProfiles=JSON.parse(localStorage.getItem('bq_profiles')||'null')||profileDefaults;
let activeProfileId=localStorage.getItem('bq_active_profile')||householdProfiles[0].id;

function saveProfiles(){localStorage.setItem('bq_profiles',JSON.stringify(householdProfiles));localStorage.setItem('bq_active_profile',activeProfileId)}
function activeProfile(){return householdProfiles.find(p=>p.id===activeProfileId)||householdProfiles[0]}
function renderProfiles(){
  const p=activeProfile();
  const chip=document.getElementById('profileChip');
  if(chip)chip.innerHTML=`<span>${p.emoji}</span><b>${esc(p.name)}</b>`;
  const list=document.getElementById('profileList');
  if(list)list.innerHTML=householdProfiles.map(x=>`<button class="profile-row ${x.id===activeProfileId?'active':''}" onclick="switchProfile('${x.id}')"><span class="profile-avatar">${x.emoji}</span><span><b>${esc(x.name)}</b><small>${x.id===activeProfileId?'Aktives Profil':'Zum Profil wechseln'}</small></span></button>`).join('');
  ['txOwner','receiptOwner'].forEach(id=>{const el=document.getElementById(id);if(el){el.innerHTML=householdProfiles.map(x=>`<option value="${x.id}" ${x.id===activeProfileId?'selected':''}>${x.emoji} ${esc(x.name)}</option>`).join('')}});
}
function switchProfile(id){activeProfileId=id;saveProfiles();renderProfiles();profileDialog.close();render()}
function addProfile(e){e.preventDefault();const name=document.getElementById('profileName').value.trim();if(!name)return;const id='p'+Date.now().toString(36);householdProfiles.push({id,name,emoji:'👤'});activeProfileId=id;saveProfiles();e.target.reset();renderProfiles();render()}
function renameHousehold(){const value=prompt('Name des Haushalts',household);if(value&&value.trim()){household=value.trim();saveAll();render()}}
function downloadHousehold(){
 const data={format:'budgetquest-household',version:1,exportedAt:new Date().toISOString(),household,profiles:householdProfiles,settings,budgets,transactions:tx,xp};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=`BudgetQuest-${household.replace(/[^a-z0-9]+/gi,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function importHousehold(file){
 if(!file)return;
 try{const data=JSON.parse(await file.text());if(data.format!=='budgetquest-household')throw new Error('Keine BudgetQuest-Haushaltsdatei');
 household=data.household||household;householdProfiles=Array.isArray(data.profiles)&&data.profiles.length?data.profiles:profileDefaults;activeProfileId=householdProfiles[0].id;settings=data.settings||settings;budgets=Array.isArray(data.budgets)?data.budgets:budgets;tx=Array.isArray(data.transactions)?data.transactions:tx;xp=Number(data.xp||xp);localStorage.setItem('bq_setup_done','1');saveProfiles();saveAll();renderProfiles();render();profileDialog.close();alert('Haushalt erfolgreich übernommen.');}
 catch(err){alert('Import nicht möglich: '+err.message)}
}
const originalAddTransaction=window.addTransaction;
window.addTransaction=function(e){const before=tx.length;originalAddTransaction(e);if(tx.length>before){tx[tx.length-1].profileId=document.getElementById('txOwner')?.value||activeProfileId;saveAll();render()}};
const originalSaveReceipt=window.saveReceipt;
window.saveReceipt=function(e){const before=tx.length;originalSaveReceipt(e);if(tx.length>before){tx[tx.length-1].profileId=document.getElementById('receiptOwner')?.value||activeProfileId;saveAll();render()}};
const originalRenderTransactions=window.renderTransactions;
window.renderTransactions=function(){originalRenderTransactions();document.querySelectorAll('.transaction-shell').forEach(shell=>{const i=Number(shell.dataset.index),t=tx[i],p=householdProfiles.find(x=>x.id===(t?.profileId||''));const meta=shell.querySelector('.tx-meta');if(meta&&p)meta.insertAdjacentHTML('beforeend',` · ${p.emoji} ${esc(p.name)}`)})};
const originalSaveAll=window.saveAll;
window.saveAll=function(){originalSaveAll();saveProfiles()};
renderProfiles();render();
const proScript=document.createElement('script');proScript.src='pro.js?v=26';document.body.appendChild(proScript);