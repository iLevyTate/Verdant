(function(){
  'use strict';
  let promptEvent,registration,applyingUpdate=false,offlineReady=false,deferredWorker,needsReload=false,lastCheck=0;
  let hadController=!!navigator.serviceWorker?.controller;
  const $=s=>document.querySelector(s);
  const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const updateReady=()=>!!registration?.waiting||needsReload;
  function status(){
    const text=installed()?'Installed · '+(navigator.onLine?'on your home screen':'playing offline'):offlineReady?(navigator.onLine?'Ready to play offline':'Playing offline'):'Connect once to prepare offline play';
    document.querySelectorAll('[data-pwa-status]').forEach(e=>e.textContent=text);
    document.querySelectorAll('[data-install-app]').forEach(e=>{e.hidden=installed()||(e.hasAttribute('data-native-install')&&!promptEvent);e.textContent=promptEvent?'Install Verdant':'Install / add to home screen';});
    document.querySelectorAll('[data-update-app]').forEach(e=>{e.hidden=!updateReady();e.disabled=applyingUpdate;});
  }
  function offerUpdate(){
    status();
    if(!updateReady()||applyingUpdate||document.hidden||deferredWorker===(registration?.waiting||'reload'))return;
    const dialog=$('#updateDialog');if(!dialog||dialog.open||$('dialog[open]'))return;
    dialog.showModal();
  }
  function deferUpdate(){deferredWorker=registration?.waiting||'reload';$('#updateDialog')?.close();}
  async function applyUpdate(){
    if(!updateReady()||applyingUpdate)return;
    const saveRequest=new Event('verdant:save',{cancelable:true});saveRequest.checkpoint=true;const saved=window.dispatchEvent(saveRequest);
    if(!saved){const error=$('[data-update-error]');if(error){error.hidden=false;error.textContent='Your world could not be saved. Choose Later and export it from New world. Retry the update once browser storage is available.';}return;}
    applyingUpdate=true;status();$('#updateDialog')?.close();
    if(registration?.waiting)registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});else location.reload();
  }
  async function install(){
    if(installed())return;
    if(promptEvent){const event=promptEvent;promptEvent=null;try{await event.prompt();await event.userChoice;}catch(error){const dialog=$('#installDialog');if(dialog&&!dialog.open)dialog.showModal();}finally{status();}return;}
    const dialog=$('#installDialog');if(dialog&&!dialog.open)dialog.showModal();
  }
  function observeWorker(worker){
    if(!worker)return;
    worker.addEventListener('statechange',()=>{if(worker.state==='installed')offerUpdate();});
    if(worker.state==='installed')offerUpdate();
  }
  async function checkForUpdates(force=false){
    if(!registration||document.hidden||navigator.onLine===false)return;
    const now=Date.now();if(!force&&now-lastCheck<60000)return;lastCheck=now;
    try{await registration.update();offerUpdate();}catch(error){/* Keep the installed game usable while offline or the server is unavailable. */}
  }
  async function register(){
    if(!('serviceWorker'in navigator)||!window.isSecureContext){status();return;}
    try{
      registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});lastCheck=Date.now();
      registration.addEventListener('updatefound',()=>observeWorker(registration.installing));observeWorker(registration.installing);offerUpdate();
      const ready=await navigator.serviceWorker.ready;offlineReady=!!ready.active;offerUpdate();
    }catch(error){document.querySelectorAll('[data-pwa-status]').forEach(e=>e.textContent='Offline setup unavailable. Reopen online to retry.');}
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;status();});
  window.addEventListener('appinstalled',()=>{promptEvent=null;status();});
  window.addEventListener('online',()=>{status();checkForUpdates(true);});window.addEventListener('offline',status);
  window.addEventListener('focus',()=>checkForUpdates());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkForUpdates(true);offerUpdate();}});
  document.addEventListener('close',offerUpdate,true);
  navigator.serviceWorker?.addEventListener('controllerchange',()=>{
    if(applyingUpdate){location.reload();return;}
    if(hadController){needsReload=true;deferredWorker=undefined;offerUpdate();}else{hadController=true;status();}
  });
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-get-app]')){status();const dialog=$('#installDialog');if(dialog&&!dialog.open)dialog.showModal();}
    if(event.target.closest('[data-install-app]'))install();
    if(event.target.closest('[data-update-app]'))applyUpdate();
    if(event.target.closest('[data-update-later]'))deferUpdate();
    if(event.target.closest('[data-close-install]'))$('#installDialog')?.close();
  });
  $('#updateDialog')?.addEventListener('cancel',()=>{deferredWorker=registration?.waiting||'reload';});
  window.VerdantPWA={install,refresh:status,checkForUpdates};window.addEventListener('load',register);document.addEventListener('DOMContentLoaded',status);
  window.setInterval(()=>checkForUpdates(),5*60*1000);
})();
