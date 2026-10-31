(function(){
  'use strict';
  const APP_RELEASE='release-43b66af68119c23f';
  let canEdit=!(typeof MessageChannel!=='undefined'&&navigator.serviceWorker?.controller?.postMessage),blockReason='';
  let promptEvent,registration,applyingUpdate=false,offlineReady=false,deferredWorker,needsReload=false,lastCheck=0,checking=false,checkMessage='',reloading=false;
  let hadController=!!navigator.serviceWorker?.controller;
  const $=s=>document.querySelector(s),all=s=>document.querySelectorAll(s);
  const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const updateReady=()=>!!registration?.waiting||needsReload;
  function status(){
    all('[data-app-build]').forEach(e=>e.textContent='Build '+APP_RELEASE.replace('release-','')+(lastCheck?' · last check '+new Date(lastCheck).toLocaleTimeString():''));
    const ready=updateReady(),text=installed()?'Installed · '+(navigator.onLine?'on your home screen':'playing offline'):offlineReady?(navigator.onLine?'Ready to play offline':'Playing offline'):'Connect once to prepare offline play';
    all('[data-pwa-status]').forEach(e=>e.textContent=text);
    all('[data-install-app]').forEach(e=>{e.hidden=installed()||(e.hasAttribute('data-native-install')&&!promptEvent);e.textContent=promptEvent?'Install Verdant':'Install / add to home screen';});
    all('[data-update-app]').forEach(e=>{e.hidden=!ready&&!applyingUpdate;e.disabled=applyingUpdate;e.textContent=applyingUpdate?'Updating…':'Save & update now';});
    all('[data-show-update]').forEach(e=>{e.hidden=!ready;e.disabled=applyingUpdate;});
    all('[data-update-later]').forEach(e=>e.disabled=applyingUpdate);
    all('[data-check-updates]').forEach(e=>{e.disabled=checking||applyingUpdate;e.textContent=checking?'Checking…':'Check for updates';});
    all('[data-update-status]').forEach(e=>e.textContent=applyingUpdate?'Saving your world and applying the update…':ready?'An update is ready. Update now or keep playing.':checkMessage||'Updates are checked automatically. You can also check here.');
    document.body?.classList?.toggle('has-update',ready);
  }
  async function refreshClients(){const controller=navigator.serviceWorker?.controller;if(typeof MessageChannel==='undefined'||!controller?.postMessage){canEdit=true;return true;}try{const answer=await new Promise((resolve,reject)=>{const channel=new MessageChannel(),timer=window.setTimeout(()=>{channel.port1.close();reject(Error('timeout'));},4000);channel.port1.onmessage=e=>{window.clearTimeout(timer);channel.port1.close();resolve(e.data);};controller.postMessage({type:'CLIENT_HELLO',protocol:4,release:APP_RELEASE},[channel.port2]);});canEdit=answer.canEdit===true;offlineReady=answer.offlineReady===true;blockReason=canEdit?'':'An earlier Verdant tab is still open. Export its changes, then close or update it.';}catch{canEdit=false;blockReason='Release safety could not be checked. Reconnect and retry.';}window.dispatchEvent(new Event('verdant:release-status'));status();return canEdit;}
  function offerUpdate(force=false){
    status();if(!updateReady()||applyingUpdate||document.hidden||!force&&deferredWorker===(registration?.waiting||'reload'))return;
    const dialog=$('#updateDialog');if(!dialog||dialog.open||!force&&$('dialog[open]'))return;dialog.showModal();
  }
  function deferUpdate(){if(applyingUpdate)return;deferredWorker=registration?.waiting||'reload';$('#updateDialog')?.close();status();}
  function error(message){all('[data-update-error]').forEach(e=>{e.hidden=false;e.textContent=message;});status();}
  function saveWorld(){const request=new Event('verdant:save',{cancelable:true});request.checkpoint=true;return window.dispatchEvent(request);}
  function reloadSaved(){if(reloading)return;if(!saveWorld()){applyingUpdate=false;needsReload=true;error('Your latest progress could not be saved. Export this world before reloading, or choose Later and retry saving.');return;}reloading=true;location.reload();}
  async function applyUpdate(){
    if(!updateReady()||applyingUpdate)return;
    if(!saveWorld()){offerUpdate(true);error('Your world could not be saved. Export a copy below, then choose Later to retry saving or load the saved world.');return;}
    all('[data-update-error]').forEach(e=>e.hidden=true);applyingUpdate=true;status();
    const worker=registration?.waiting;
    if(!worker){reloadSaved();return;}
    try{worker.postMessage({type:'ACTIVATE_UPDATE'});}catch(problem){applyingUpdate=false;error('The update could not start. Your world is saved. Check for updates and try again.');return;}
    window.setTimeout?.(()=>{if(!applyingUpdate||reloading)return;if(worker.state==='activated'){reloadSaved();return;}applyingUpdate=false;error('The update has not finished. Your world is saved. Retry now, or choose Later and check again.');},15000);
  }
  async function install(){
    if(installed())return;
    if(promptEvent){const event=promptEvent;promptEvent=null;try{await event.prompt();await event.userChoice;}catch(problem){const dialog=$('#installDialog');if(dialog&&!dialog.open)dialog.showModal();}finally{status();}return;}
    const dialog=$('#installDialog');if(dialog&&!dialog.open)dialog.showModal();
  }
  function observeWorker(worker){
    if(!worker)return;
    const changed=()=>{if(worker.state==='installed'){offerUpdate();window.setTimeout?.(()=>offerUpdate(),100);}else if(worker.state==='redundant'){checkMessage='The new release could not finish downloading. Your installed game is still available; reconnect and check again.';status();}else{checkMessage='Downloading the latest release…';status();}};
    worker.addEventListener('statechange',changed);if(worker.state==='installed')changed();
  }
  async function checkForUpdates(force=false){
    if(checking||document.hidden)return;
    if(navigator.onLine===false){checkMessage=updateReady()?'A downloaded update is ready, even while offline.':'You are offline. Reconnect to check for updates.';status();return;}
    if(!registration){checkMessage='Update checks are preparing. Reopen the published app online if this continues.';status();return;}
    const now=Date.now();if(!force&&now-lastCheck<60000)return;lastCheck=now;checking=true;checkMessage='Checking for updates…';status();
    let timeout;
    try{const update=registration.update();if(window.setTimeout)await Promise.race([update,new Promise((resolve,reject)=>{timeout=window.setTimeout(()=>reject(Error('Update check timed out')),15000);})]);else await update;checkMessage=registration.installing?'Downloading the latest release…':updateReady()?'An update is ready.':'You have the latest available release.';offerUpdate();}
    catch(problem){checkMessage='Could not check for updates. Your installed game is still available. Reconnect and try again.';}
    finally{if(timeout!==undefined)window.clearTimeout?.(timeout);checking=false;status();}
  }
  async function register(){
    if(!('serviceWorker'in navigator)||!window.isSecureContext){checkMessage='Open the published HTTPS app to install updates.';status();return;}
    try{
      registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});lastCheck=Date.now();
      registration.addEventListener('updatefound',()=>observeWorker(registration.installing));observeWorker(registration.installing);offerUpdate();
      const ready=await navigator.serviceWorker.ready;if(typeof MessageChannel==='undefined'||!ready.active?.postMessage)offlineReady=!!ready.active;await refreshClients();offerUpdate();
    }catch(problem){checkMessage='Update setup is unavailable. Reopen the app online to retry.';status();}
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;status();});
  window.addEventListener('appinstalled',()=>{promptEvent=null;status();});
  window.addEventListener('online',()=>{status();checkForUpdates(true);});window.addEventListener('offline',status);
  window.addEventListener('focus',()=>checkForUpdates());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkForUpdates(true);offerUpdate();}});
  document.addEventListener('close',()=>offerUpdate(),true);
  navigator.serviceWorker?.addEventListener('controllerchange',()=>{refreshClients();if(applyingUpdate){reloadSaved();return;}if(hadController){needsReload=true;deferredWorker=undefined;offerUpdate();}else{hadController=true;status();}});
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-get-app]')){status();const dialog=$('#installDialog');if(dialog&&!dialog.open)dialog.showModal();}
    if(event.target.closest('[data-install-app]'))install();
    if(event.target.closest('[data-check-updates]'))checkForUpdates(true);
    if(event.target.closest('[data-show-update]'))offerUpdate(true);
    if(event.target.closest('[data-update-app]'))applyUpdate();
    if(event.target.closest('[data-update-later]'))deferUpdate();
    if(event.target.closest('[data-close-install]'))$('#installDialog')?.close();
  });
  $('#updateDialog')?.addEventListener('cancel',event=>{if(applyingUpdate){event.preventDefault();return;}deferredWorker=registration?.waiting||'reload';});
  window.VerdantPWA={install,refresh:status,checkForUpdates,refreshClients,release:APP_RELEASE,get canEdit(){return canEdit;},get blockReason(){return blockReason;}};window.addEventListener('load',register);document.addEventListener('DOMContentLoaded',status);
  navigator.serviceWorker?.addEventListener('message',event=>{if(event.data?.type==='REQUEST_CLIENT_RELEASE')refreshClients();if(event.data?.type==='RELEASE_STATUS'&&event.data.canEdit===true){canEdit=true;blockReason='';window.dispatchEvent(new Event('verdant:release-status'));}});
  window.setInterval(()=>checkForUpdates(),5*60*1000);
  window.setInterval(()=>{if(!document.hidden)refreshClients();},15000);

})();
