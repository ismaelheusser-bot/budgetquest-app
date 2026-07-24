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

function householdBackupData(){
 return{
  format:'budgetquest-household',version:2,exportedAt:new Date().toISOString(),household,
  profiles:householdProfiles,activeProfileId,settings,budgets,transactions:tx,xp,
  homePlan:JSON.parse(localStorage.getItem('bq_home_plan')||'null'),
  wealth:JSON.parse(localStorage.getItem('bq_wealth')||'null'),
  incomePlan:JSON.parse(localStorage.getItem('bq_income_plan_v1')||'null'),
  budgetStart:localStorage.getItem('bq_budget_start')||null
 };
}
function backupFile(){
 const safe=(household||'Haushalt').replace(/[^a-z0-9äöü]+/gi,'-').replace(/^-|-$/g,'');
 return new File([JSON.stringify(householdBackupData(),null,2)],`BudgetQuest-${safe}.json`,{type:'application/json'});
}
function setCloudStatus(text,isError=false){const el=document.getElementById('icloudStatus');if(el){el.textContent=text;el.style.color=isError?'#ff8d8d':''}}
async function saveHouseholdToICloud(){
 const file=backupFile();
 setCloudStatus('iCloud-Sicherung wird vorbereitet…');
 try{
  if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
   await navigator.share({title:'BudgetQuest Haushalt',text:'BudgetQuest-Haushaltsdatei in iCloud Drive sichern.',files:[file]});
   localStorage.setItem('bq_last_cloud_backup',new Date().toISOString());
   setCloudStatus('Sicherung übergeben. Wähle „In Dateien sichern“ und deinen iCloud-Ordner.');
   return;
  }
  const a=document.createElement('a'),url=URL.createObjectURL(file);a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  localStorage.setItem('bq_last_cloud_backup',new Date().toISOString());
  setCloudStatus('Datei erstellt. Verschiebe sie in der Dateien-App nach iCloud Drive.');
 }catch(err){
  if(err?.name==='AbortError'){setCloudStatus('Sicherung abgebrochen.');return}
  setCloudStatus('Sicherung nicht möglich: '+err.message,true);
 }
}
function chooseICloudBackup(){document.getElementById('icloudImportInput')?.click()}
function downloadHousehold(){saveHouseholdToICloud()}
async function importHousehold(file){
 if(!file)return;
 try{
  const data=JSON.parse(await file.text());
  if(data.format!=='budgetquest-household')throw new Error('Keine BudgetQuest-Haushaltsdatei');
  const stamp=data.exportedAt?new Date(data.exportedAt).toLocaleString('de-CH'):'unbekannt';
  if(!confirm(`iCloud-Sicherung vom ${stamp} laden?\n\nDie aktuellen Daten auf diesem Gerät werden ersetzt.`)){setCloudStatus('Wiederherstellung abgebrochen.');return}
  household=data.household||household;
  householdProfiles=Array.isArray(data.profiles)&&data.profiles.length?data.profiles:profileDefaults;
  activeProfileId=data.activeProfileId&&householdProfiles.some(p=>p.id===data.activeProfileId)?data.activeProfileId:householdProfiles[0].id;
  settings=data.settings||settings;
  budgets=Array.isArray(data.budgets)?data.budgets:budgets;
  tx=Array.isArray(data.transactions)?data.transactions:tx;
  xp=Number(data.xp||xp);
  if(data.homePlan)localStorage.setItem('bq_home_plan',JSON.stringify(data.homePlan));
  if(data.wealth)localStorage.setItem('bq_wealth',JSON.stringify(data.wealth));
  if(data.incomePlan)localStorage.setItem('bq_income_plan_v1',JSON.stringify(data.incomePlan));
  if(data.budgetStart)localStorage.setItem('bq_budget_start',data.budgetStart);
  localStorage.setItem('bq_setup_done','1');
  localStorage.setItem('bq_last_cloud_restore',new Date().toISOString());
  saveProfiles();saveAll();renderProfiles();render();
  setCloudStatus(`iCloud-Sicherung vom ${stamp} geladen.`);
  profileDialog.close();
  alert('iCloud-Sicherung erfolgreich geladen. Die App wird neu geöffnet.');
  location.reload();
 }catch(err){setCloudStatus('Import nicht möglich: '+err.message,true);alert('Import nicht möglich: '+err.message)}
 finally{const input=document.getElementById('icloudImportInput');if(input)input.value=''}
}
function installICloudControls(){
 const box=document.querySelector('.cloud-note');if(!box)return;
 const last=localStorage.getItem('bq_last_cloud_backup');
 box.innerHTML=`<strong>☁️ iCloud Drive</strong><p>Speichere den gesamten Haushalt als gemeinsame Datei in iCloud Drive. Auf dem anderen Gerät wird dieselbe Datei wieder geladen.</p><div class="actions"><button class="btn" type="button" onclick="saveHouseholdToICloud()">In iCloud sichern</button><button class="btn secondary" type="button" onclick="chooseICloudBackup()">Aus iCloud laden</button></div><input id="icloudImportInput" type="file" accept="application/json,.json" hidden onchange="importHousehold(this.files[0])"><div id="icloudStatus" class="tiny" style="margin-top:10px">${last?'Letzte Sicherung: '+new Date(last).toLocaleString('de-CH'):'Noch keine iCloud-Sicherung erstellt.'}</div><p class="tiny">Auf dem iPhone: „In iCloud sichern“ → „In Dateien sichern“ → iCloud Drive. Verwendet auf beiden Geräten denselben freigegebenen Ordner und ersetzt beim Sichern die bestehende Datei.</p>`;
}

const originalAddTransaction=window.addTransaction;
window.addTransaction=function(e){const before=tx.length;originalAddTransaction(e);if(tx.length>before){tx[tx.length-1].profileId=document.getElementById('txOwner')?.value||activeProfileId;saveAll();render()}};
const originalSaveReceipt=window.saveReceipt;
window.saveReceipt=function(e){const before=tx.length;originalSaveReceipt(e);if(tx.length>before){tx[tx.length-1].profileId=document.getElementById('receiptOwner')?.value||activeProfileId;saveAll();render()}};
const originalRenderTransactions=window.renderTransactions;
window.renderTransactions=function(){originalRenderTransactions();document.querySelectorAll('.transaction-shell').forEach(shell=>{const i=Number(shell.dataset.index),t=tx[i],p=householdProfiles.find(x=>x.id===(t?.profileId||''));const meta=shell.querySelector('.tx-meta');if(meta&&p)meta.insertAdjacentHTML('beforeend',` · ${p.emoji} ${esc(p.name)}`)})};
const originalSaveAll=window.saveAll;
window.saveAll=function(){originalSaveAll();saveProfiles()};
renderProfiles();render();installICloudControls();
const proScript=document.createElement('script');proScript.src='pro.js?v=28';document.body.appendChild(proScript);