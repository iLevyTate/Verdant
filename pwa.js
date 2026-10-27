(function(){
  'use strict';
  let promptEvent,registration,applyingUpdate=false,offlineReady=false;
  const $=s=>document.querySelector(s);
  const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  function status(){
    const text=installed()?'Installed · '+(navigator.onLine?'on your home screen':'playing offline'):offlineReady?(navigator.onLine?'Ready to play offline':'Playing offline'):'Connect once to prepare offline play';
    document.querySelectorAll('[data-pwa-status]').forEach(e=>e.textContent=text);
    document.querySelectorAll('[data-install-app]').forEach(e=>{e.hidden=installed()||(e.hasAttribute("data-native-install")&&!promptEvent);e.textContent=promptEvent?'Install Verdant':'Install / add to home screen';});
    document.querySelectorAll('[data-update-app]').forEach(e=>e.hidden=!registration?.waiting);
  }
  async function install(){
    if(installed())return;
    if(promptEvent){const event=promptEvent;promptEvent=null;await event.prompt();await event.userChoice;status();return;}
    const dialog=$('#installDialog');if(dialog)dialog.showModal();
  }
  async function register(){
    if(!('serviceWorker'in navigator)||!window.isSecureContext){status();return;}
    try{registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});const ready=await navigator.serviceWorker.ready;offlineReady=!!ready.active;status();
      registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')status();});});
    }catch(error){document.querySelectorAll('[data-pwa-status]').forEach(e=>e.textContent='Offline setup unavailable. Reopen online to retry.');}
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;status();});
  window.addEventListener('appinstalled',()=>{promptEvent=null;status();});
  window.addEventListener('online',status);window.addEventListener('offline',status);
  navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(applyingUpdate)location.reload();});
  document.addEventListener('click',event=>{if(event.target.closest('[data-get-app]')){status();$('#installDialog')?.showModal();}if(event.target.closest('[data-install-app]'))install();if(event.target.closest('[data-update-app]')&&registration?.waiting){window.dispatchEvent(new Event('verdant:save'));applyingUpdate=true;registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});}if(event.target.closest('[data-close-install]'))$('#installDialog').close();});
  window.VerdantPWA={install,refresh:status};window.addEventListener('load',register);document.addEventListener('DOMContentLoaded',status);
})();
