const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const APP=fs.existsSync(path.join(__dirname,'../dist/pwa.js'))?'../dist/':'../';
class Bus{
 constructor(){this.listeners=new Map();}
 addEventListener(type,fn){const all=this.listeners.get(type)||[];all.push(fn);this.listeners.set(type,all);}
 dispatchEvent(event){for(const fn of this.listeners.get(event.type)||[])fn(event);return !event.defaultPrevented;}
 async emit(type,extra={}){const event={type,...extra};await Promise.all((this.listeners.get(type)||[]).map(fn=>fn(event)));}
}
async function app({waiting=true,controller=true,hidden=false,otherDialog=false}={}){
 const worker=()=>Object.assign(new Bus(),{state:'installed',messages:[],postMessage(message){this.messages.push(message);}});
 const registration=Object.assign(new Bus(),{waiting:waiting?worker():null,installing:null,updates:0,async update(){this.updates++;}});
 const window=Object.assign(new Bus(),{isSecureContext:true,timers:[],setInterval(fn,ms){this.timers.push({fn,ms});},setTimeout(fn,ms){this.timers.push({fn,ms});return this.timers.length;},clearTimeout(id){if(this.timers[id-1])this.timers[id-1].cleared=true;}}),document=Object.assign(new Bus(),{hidden}),sw=Object.assign(new Bus(),{controller:controller?{}:null,async register(){return registration;},ready:Promise.resolve({active:{}})});
 const dialog={open:false,shown:0,showModal(){this.open=true;this.shown++;},close(){this.open=false;document.dispatchEvent({type:'close'});},addEventListener(type,fn){this[type]=fn;}},install={...dialog,shown:0},other={open:otherDialog},error={hidden:true,textContent:''},update={hidden:true,disabled:false},installButton={hidden:false,hasAttribute(){return false;}};
 const statuses=[{textContent:''}];document.querySelector=selector=>selector==='#updateDialog'?dialog:selector==='#installDialog'?install:selector==='dialog[open]'?[dialog,install,other].find(d=>d.open):selector==='[data-update-error]'?error:null;
 const check={disabled:false,textContent:''},indicator={hidden:true,disabled:false},updateStatus={textContent:''};document.querySelectorAll=selector=>selector==='[data-pwa-status]'?statuses:selector==='[data-update-app]'?[update]:selector==='[data-install-app]'?[installButton]:selector==='[data-update-error]'?[error]:selector==='[data-check-updates]'?[check]:selector==='[data-show-update]'?[indicator]:selector==='[data-update-status]'?[updateStatus]:[];
 const navigator={onLine:true,serviceWorker:sw},location={reloads:0,reload(){this.reloads++;}};
 vm.runInNewContext(fs.readFileSync(require.resolve(APP+'pwa.js'),'utf8'),{window,document,navigator,location,Event,matchMedia:()=>({matches:false}),Date,console});
 await window.emit('load');await Promise.resolve();
 const click=async selector=>{await document.emit('click',{target:{closest:query=>query===selector?{}:null}});for(let i=0;i<8;i++)await Promise.resolve();};
 return{window,document,navigator,sw,registration,dialog,other,error,update,location,worker,click,check,indicator,updateStatus};
}
(async()=>{
 let a=await app();assert(a.dialog.open,'an already-waiting update must prompt on open');assert.equal(a.registration.waiting.messages.length,0,'never auto-activate an update');assert.equal(a.window.timers[0].ms,300000);
 const oldWorker=a.registration.waiting;await a.click('[data-update-later]');assert(!a.dialog.open);await a.window.VerdantPWA.checkForUpdates(true);assert(!a.dialog.open,'Later must suppress repeated prompts for this release');assert(!oldWorker.messages.length);
 assert(!a.indicator.hidden,'Later keeps a visible route back to the ready update');await a.click('[data-show-update]');assert(a.dialog.open,'the visible update action reopens a deferred update');await a.click('[data-update-later]');
 a.registration.waiting=a.worker();await a.window.VerdantPWA.checkForUpdates(true);assert(a.dialog.open,'a newer release should prompt again');let saves=0;a.window.addEventListener('verdant:save',event=>{assert(event.checkpoint,'updates must request a dedicated world checkpoint');saves++;});await a.click('[data-update-app]');assert.equal(saves,1);assert.equal(a.registration.waiting.messages[0].type,'ACTIVATE_UPDATE');assert.equal(a.location.reloads,0,'reload only after the new service worker takes control');await a.sw.emit('controllerchange');assert.equal(a.location.reloads,1);
 a=await app();a.window.addEventListener('verdant:save',e=>e.preventDefault());await a.click('[data-update-app]');assert(a.dialog.open&&!a.error.hidden);assert(!a.registration.waiting.messages.length,'failed saving must block update activation');assert.equal(a.location.reloads,0);
 a=await app({otherDialog:true});assert(!a.dialog.open);a.other.open=false;await a.document.emit('close');assert(a.dialog.open,'ask once an existing form is closed');
 a=await app({hidden:true});assert(!a.dialog.open);a.document.hidden=false;await a.document.emit('visibilitychange');assert(a.dialog.open);assert(a.registration.updates>0,'returning to the app checks for new updates');
 a=await app({waiting:false});a.registration.installing=a.worker();a.registration.installing.state='installing';await a.registration.emit('updatefound');a.registration.waiting=a.registration.installing;a.registration.waiting.state='installed';await a.registration.waiting.emit('statechange');assert(a.dialog.open,'newly downloaded updates prompt');
 a=await app({waiting:false});await a.sw.emit('controllerchange');assert(a.dialog.open,'an update accepted in another tab still asks before reloading this tab');await a.click('[data-update-app]');assert.equal(a.location.reloads,1);
 a=await app({waiting:false,controller:false});await a.sw.emit('controllerchange');assert(!a.dialog.open&&!a.location.reloads,'first installation must not look like an update');
 a=await app({waiting:false});a.navigator.onLine=false;await a.window.VerdantPWA.checkForUpdates(true);assert.equal(a.registration.updates,0,'offline checks must not interrupt play');a.navigator.onLine=true;await a.window.emit('online');assert.equal(a.registration.updates,1,'reconnecting checks immediately');
 a=await app({waiting:false});await a.click('[data-check-updates]');assert.equal(a.registration.updates,1,'manual checks bypass the automatic throttle');assert.match(a.updateStatus.textContent,/latest available/);a.registration.update=async()=>{throw Error('offline server');};await a.click('[data-check-updates]');assert.match(a.updateStatus.textContent,/Could not check/);assert(!a.check.disabled,'a failed check must remain retryable');
 a=await app({waiting:false});a.registration.update=()=>new Promise(()=>{});const pending=a.window.VerdantPWA.checkForUpdates(true);assert(a.check.disabled);const timeout=a.window.timers.findLast(t=>t.ms===15000&&!t.cleared);assert(timeout);timeout.fn();await pending;assert(!a.check.disabled);assert.match(a.updateStatus.textContent,/Could not check/);a.registration.update=async()=>{};await a.window.VerdantPWA.checkForUpdates(true);assert.match(a.updateStatus.textContent,/latest available/,'a timed-out check must remain retryable');
 console.log('Passed: startup/return/reconnection/periodic update checks, consent before activation, Later deferral, installation races, other tabs, and saving failure protection.');
})().catch(error=>{console.error(error);process.exitCode=1;});
