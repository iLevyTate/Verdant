// Exercise production markup and event handlers using a real DOM parser.
// Rendering is substituted here; geometry and pointer rays have separate scene checks.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom');
const C=require('../core.js'),S=require('../saves.js'),W=require('../workspace.js');
class Bus{constructor(){this.listeners=new Map();}addEventListener(k,f){const a=this.listeners.get(k)||[];a.push(f);this.listeners.set(k,a);}async emit(k){for(const f of this.listeners.get(k)||[])await f({type:k});}}
async function app({rendererFailure=false,engineMissing=false,noSavedWorld=false,width=390,existingData=null}={}){
 const {window,document}=parseHTML(fs.readFileSync(require.resolve('../index.html'),'utf8'));
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')??(Number(this.getAttribute('size'))>1||this.hasAttribute('multiple')?'':this.querySelector('option')?.getAttribute('value')??'');},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.getAttribute('value')===String(v));}});
 for(const d of document.querySelectorAll('dialog')){Object.defineProperty(d,'open',{get(){return this.hasAttribute('open');}});d.showModal=()=>d.setAttribute('open','');d.close=()=>{d.removeAttribute('open');d.dispatchEvent(new window.Event('close',{bubbles:true}));};}
 Object.defineProperty(document,'hidden',{value:false,writable:true});Object.defineProperty(document,'activeElement',{value:document.body,writable:true});
 const initial=C.generate('mobile-ui','woodland','sandbox');initial.entities=[{id:1,type:'tree',x:0,z:0,scale:.7,growth:1,health:1,rotation:0,variant:0,phase:0,harvest:.6},{id:2,type:'bunny',x:-2,z:-2,scale:.9,growth:1,health:1,rotation:0,variant:0,phase:0}];initial.nextId=3;initial.heights.fill(.6);initial.soil.fill(.6);initial.water=-.6;initial.wildGrowth=false;
 const original=JSON.stringify(initial),data=existingData||new Map(noSavedWorld?[]:[[S.KEY,original]]),store={fail:null,ignore:null,getItem:k=>data.get(k)??null,setItem(k,v){if(k===this.fail)throw Error('quota');if(k!==this.ignore)data.set(k,v);}},timeouts=[],intervals=[],downloads=[],frames=[];let now=100,world;
 class World{
  constructor(canvas,state){if(rendererFailure)throw Error('WebGL not supported');world=this;this.camera={attachControl(){},detachControl(){}};this.scene={executeWhenReady:f=>f()};this.rebuild(state);}
  rebuild(state){this.state=state;this.visuals=new Map(state.entities.map(e=>[e.id,{root:{position:{x:e.x,y:.6,z:e.z}}}]));}
  addEntity(e){this.visuals.set(e.id,{root:{position:{x:e.x,y:.6,z:e.z}}});}removeEntity(id){this.visuals.delete(id);}moveEntity(e){this.addEntity(e);}refreshPlant(){}refreshTerrain(){}updateClimate(){}showBrush(p){if(!p)this.ghostVisible=false;}showPreview(){this.ghostVisible=true;this.previewed=true;this.previewCalls=(this.previewCalls||0)+1;}resize(){}resetCamera(){}mist(){}setGraphics(){}focusEntity(){}lookCloser(id){this.closeup=id;}setGlassVisible(v){this.glass=v;}canPlacePlant(){return{ok:true};}canPlaceObject(){return{ok:true};}reducedMotion(){return this.state.motion==='reduced';}performanceReport(){return'60 fps';}pointAt(x,z){this.pickCalls=(this.pickCalls||0)+1;return{x,y:.6,z};}pickBranch(){return 3;}pickEntity(x,z){return this.state.entities.find(e=>Math.hypot(e.x-x,e.z-z)<.1)?.id??null;}
 }
 const waiting=Object.assign(new Bus(),{state:'installed',messages:[],postMessage(m){this.messages.push(m);}}),registration=Object.assign(new Bus(),{waiting:null,installing:null,checks:0,async update(){this.checks++;if(this.releaseReady)this.waiting=waiting;}}),sw=Object.assign(new Bus(),{controller:{},register:async()=>registration,ready:Promise.resolve({active:{}})}),location={reloads:0,reload(){this.reloads++;}};
 for(const element of document.querySelectorAll('button,select,input,canvas'))element.focus=()=>{document.activeElement=element;element.dispatchEvent(new window.Event('focusin',{bubbles:true}));};
 Object.assign(window,{TerrariumCore:C,VerdantSaves:S,VerdantWorkspace:W,BABYLON:engineMissing?undefined:{},innerWidth:width,innerHeight:844,isSecureContext:true,requestAnimationFrame:f=>{frames.push(f);return frames.length;},setInterval:(f,ms)=>{intervals.push({f,ms});},setTimeout:(f,ms)=>{timeouts.push({f,ms,active:true});return timeouts.length;},clearTimeout:id=>{if(timeouts[id-1])timeouts[id-1].active=false;}});
 const canvas=document.querySelector('#world');canvas.setPointerCapture=()=>{};
 const sandbox={window,document,localStorage:store,TerrariumWorld:World,navigator:{onLine:true,serviceWorker:sw},location,Event:window.Event,matchMedia:()=>({matches:false}),performance:{now:()=>now+=10},setTimeout:window.setTimeout,clearTimeout:window.clearTimeout,setInterval:window.setInterval,Date,Math,Blob,URL:{createObjectURL:b=>{downloads.push(b);return'blob:test';},revokeObjectURL(){}},console:rendererFailure||engineMissing?{...console,error(){}}:console};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require.resolve('../pwa.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(require.resolve('../game.js'),'utf8'),sandbox);
 window.dispatchEvent(new window.Event('load'));await tick();
 const $=s=>document.querySelector(s),click=s=>$(s).click(),change=(s,value)=>{$(s).value=String(value);$(s).dispatchEvent(new window.Event('change',{bubbles:true}));},pointer=(x,z)=>{for(const type of['pointerdown','pointerup']){const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{isPrimary:true,button:0,pointerId:1,pointerType:'touch',clientX:x,clientY:z});canvas.dispatchEvent(e);}};
 const key=(value,extra={})=>{const e=new window.Event('keydown',{bubbles:true,cancelable:true});Object.assign(e,{key:value,code:value===' '?'Space':'Key'+value.toUpperCase(),repeat:false,ctrlKey:false,metaKey:false,altKey:false,...extra});document.dispatchEvent(e);};
 return{$,click,change,pointer,key,original,world,store,data,location,registration,waiting,sw,timeouts,downloads,window,frames,canvas,intervals};
}
async function tick(){for(let i=0;i<6;i++)await Promise.resolve();}
(async()=>{
 let a=await app();assert(a.world,'the production game must finish binding the phone UI');assert(a.$('body').classList.contains('tray-collapsed'),'phones must open in a clear observe view');const initialCount=a.world.state.entities.length;a.pointer(3.8,0);assert.equal(a.world.state.entities.length,initialCount,'the initial view must not plant accidentally');assert(!a.$('.app-shell').hasAttribute('inert'),'the ready app must expose its working controls');
 a.click('#careToggle');assert(a.$('body').classList.contains('care-open'));a.change('#glassSelect','false');assert.equal(a.world.glass,false);a.click('#undoBtn');assert.equal(a.world.state.glassVisible,true);a.change('#motionSelect','reduced');assert(a.$('body').classList.contains('reduced-motion'));a.change('#matureSelect','false');assert.equal(a.world.state.maturePreview,false);a.click('#closeCare');
 a.click('#inspectBtn');a.pointer(0,0);assert(!a.$('#inspector').hidden);a.click('#trimBonsai');assert.equal(a.world.state.entities[0].pruning,.84);a.click('#undoBtn');assert.equal(a.world.state.entities[0].pruning,undefined);a.pointer(0,0);a.click('#trimBonsai');a.click('#regrowBonsai');assert(a.world.state.entities[0].regrowing);a.click('#focusOne');assert(a.$('#inspector').hidden);assert.equal(a.world.closeup,1);
 assert.equal(a.$('.tabs [data-category="life"]'),null);a.click('.tabs [data-category="plants"]');const before=a.world.state.entities.length;a.pointer(3.8,0);assert.equal(a.world.state.entities.length,before+1,'a touch tap must place an element');assert(a.world.previewed,'touch-down shows the placement preview');assert(!a.world.ghostVisible,'touch placement must clear the overlay');a.click('#undoBtn');assert.equal(a.world.state.entities.length,before);
 const touch=(type,x,isPrimary=true,id=1)=>{const e=new a.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerType:'touch',isPrimary,pointerId:id,button:0,clientX:x,clientY:0});a.canvas.dispatchEvent(e);};
 const beforeGesture=a.world.state.entities.length;touch('pointerdown',3.8);assert(a.world.ghostVisible);touch('pointermove',12);assert(!a.world.ghostVisible,'dragging to orbit must hide the preview');touch('pointerup',12);assert.equal(a.world.state.entities.length,beforeGesture);
 touch('pointerdown',3.8);touch('pointerdown',4,false,2);assert(!a.world.ghostVisible,'a pinch must hide the preview');touch('pointerup',4,false,2);touch('pointerup',3.8);assert.equal(a.world.state.entities.length,beforeGesture,'a pinch must not plant');
 a.world.previewCalls=0;a.world.pickCalls=0;a.window.innerWidth=1200;
 for(let i=0;i<20;i++){const e=new a.window.Event('pointermove',{bubbles:true});Object.assign(e,{pointerType:'mouse',clientX:3+i*.01,clientY:0});a.canvas.dispatchEvent(e);}
 assert.equal(a.world.previewCalls,0);assert.equal(a.world.pickCalls,0,'pointer bursts must defer terrain ray queries');assert.equal(a.frames.length,1,'pointer bursts must queue one preview per display frame');a.frames.splice(0).forEach(f=>f());assert.equal(a.world.previewCalls,1);assert.equal(a.world.pickCalls,1);
 const move=new a.window.Event('pointermove',{bubbles:true});Object.assign(move,{pointerType:'mouse',clientX:3,clientY:0});a.canvas.dispatchEvent(move);a.canvas.dispatchEvent(new a.window.Event('pointerleave'));a.frames.splice(0).forEach(f=>f());assert.equal(a.world.previewCalls,1,'leaving the canvas must cancel the queued preview');
 a.click('#photoBtn');const photograph=JSON.stringify(a.world.state);a.pointer(3.8,.5);assert.equal(JSON.stringify(a.world.state),photograph,'photo mode taps must not plant');a.click('#showUIBtn');a.click('.tabs [data-category="terrain"]');a.click('#photoBtn');const landscape=JSON.stringify(a.world.state);a.pointer(0,0);assert.equal(JSON.stringify(a.world.state),landscape,'photo mode gestures must not sculpt');a.click('#showUIBtn');a.window.innerWidth=390;a.click('.tabs [data-category="plants"]');
 a.store.fail=S.KEY;a.click('#saveBtn');assert(!a.$('#saveWarning').hidden);for(const timer of a.timeouts.filter(t=>t.ms===3600&&t.active))timer.f();assert(!a.$('#saveWarning').hidden,'the save warning must outlive its toast');a.click('#saveWarning [data-export-world]');assert(a.downloads.length);a.store.fail=null;a.click('#retrySave');assert(a.$('#saveWarning').hidden);
 a.click('#manageBackups');a.click('#createRestorePoint');assert(a.$('#backupChoice').querySelectorAll('option').length);const point=a.$('#backupChoice').value;a.$('#backupsDialog').close();a.change('#glassSelect','false');a.click('#saveBtn');a.click('#manageBackups');a.change('#backupChoice',point);a.click('#restoreSelected');assert.equal(a.world.state.glassVisible,false);assert(a.$('#backupsDialog').open===false);
 a.registration.releaseReady=true;a.click('[data-check-updates]');await tick();assert(a.$('#updateDialog').open);a.click('[data-update-later]');assert(!a.$('#updateDialog').open);assert(!a.$('#updateAvailable').hidden,'ready updates stay accessible after Later');a.click('#updateAvailable');assert(a.$('#updateDialog').open);a.store.fail=S.KEY;a.click('[data-update-app]');assert(!a.$('[data-update-error]').hidden);assert.equal(a.waiting.messages.length,0,'an unsaved world must block update activation');a.store.fail=null;a.click('[data-update-app]');assert.equal(a.waiting.messages.length,1);assert(a.$('[data-update-app]').disabled);await a.sw.emit('controllerchange');assert.equal(a.location.reloads,1);assert(a.data.get(S.CHECKPOINT));
 a=await app();a.click('#careToggle');a.$('#careModeSelect').focus();a.key('Escape');assert(!a.$('body').classList.contains('care-open'));assert.equal(a.window.document.activeElement.id,'careToggle');
 a.click('#inspectBtn');a.pointer(0,0);a.$('#trimBonsai').focus();a.key('Escape');assert(a.$('#inspector').hidden);assert.equal(a.window.document.activeElement.id,'inspectBtn');
 a.$('#world').focus();const beforeModifiers=JSON.stringify(a.world.state);a.key('m',{ctrlKey:true});a.key('m',{altKey:true});a.key('m',{repeat:true});assert.equal(JSON.stringify(a.world.state),beforeModifiers,'browser shortcuts/repeated keydowns must not mist the garden');a.key('h');assert(a.$('body').classList.contains('ui-hidden'));a.key('h',{repeat:true});assert(a.$('body').classList.contains('ui-hidden'));a.key('Escape');assert(!a.$('body').classList.contains('ui-hidden'));
 a.click('#careToggle');a.$('#world').focus();assert(!a.$('body').classList.contains('care-open'),'Tab can leave the care sheet normally');
 a=await app();a.change('#glassSelect','false');a.click('#newWorldBtn');const beforeReplace=JSON.stringify(a.world.state),beforeStorage=a.data.get(S.KEY);a.store.fail=S.HISTORY;a.$('#worldForm').dispatchEvent(new a.window.Event('submit',{bubbles:true,cancelable:true}));assert(a.$('#worldDialog').open,'failed backup must keep the form open');assert.equal(JSON.stringify(a.world.state),beforeReplace);assert.equal(a.data.get(S.KEY),beforeStorage);a.$('#worldDialog').close();a.store.fail=null;a.click('#undoBtn');assert.equal(a.world.state.glassVisible,true,'a failed replacement must not consume Undo');
 for(const options of [{rendererFailure:true},{engineMissing:true}]){a=await app(options);assert(a.$('.app-shell').hasAttribute('inert'));assert.equal(a.$('#loading').getAttribute('role'),'alert');assert(a.$('[data-export-original]'));assert.equal(a.data.get(S.KEY),a.original,'startup failure must preserve the original bytes');a.click('[data-export-original]');assert.equal(await a.downloads.at(-1).text(),a.original);a.registration.releaseReady=true;a.click('[data-check-updates]');await tick();assert(a.$('#updateDialog').open);a.click('[data-update-app]');assert.equal(a.waiting.messages.length,1,'an engine failure must still allow a checkpointed app update');assert.equal(a.data.get(S.BACKUP),a.original);}
 a=await app({engineMissing:true,noSavedWorld:true});a.registration.releaseReady=true;a.click('[data-check-updates]');await tick();a.click('[data-update-app]');assert.equal(a.waiting.messages.length,1,'an empty installation must not be blocked by a nonexistent save');assert.equal(a.data.get(S.KEY),undefined);
 a=await app();const other=JSON.parse(a.data.get(S.KEY));other.seeds+=1;a.data.set(S.KEY,JSON.stringify(other));a.click('#saveBtn');assert(!a.$('#saveWarning').hidden);assert(!a.$('#loadSavedCopy').hidden);assert.equal(a.location.reloads,0,'a conflict must never silently reload or overwrite');
 // Vessel design is an edit of the current garden, not New world.
 let v=await app();const originalGarden=JSON.stringify(v.world.state),originalAnimals=JSON.stringify(v.world.state.entities.filter(e=>C.ELEMENTS[e.type].creature));
 v.click('#careToggle');v.click('.terrarium-card [data-open-vessel]');assert(v.$('#vesselDialog').open);assert.equal(JSON.stringify(v.world.state),originalGarden);v.click('#vesselDialog .text-btn');assert(!v.$('#vesselDialog').open);assert.equal(JSON.stringify(v.world.state),originalGarden,'cancelling vessel choices must not edit the world');
 const shape=(app,value)=>{for(const radio of app.$('#vesselForm').querySelectorAll('input[name=vesselShape]'))radio.checked=radio.value===value;app.$('input[name=vesselShape][value='+value+']').dispatchEvent(new app.window.Event('change',{bubbles:true}));};
 const apply=app=>app.$('#vesselForm').dispatchEvent(new app.window.Event('submit',{bubbles:true,cancelable:true}));
 v.click('#careToggle');v.click('.terrarium-card [data-open-vessel]');shape(v,'oval');v.change('#vesselSizeInput','roomy');v.change('#baseStyleInput','slate');assert(v.$('#vesselFootprint').textContent.includes('161%'));apply(v);assert(!v.$('#vesselDialog').open);assert.equal(v.world.state.vesselShape,'oval');assert.equal(v.world.state.vesselSize,'roomy');assert.equal(v.world.state.baseStyle,'slate');assert.equal(JSON.stringify(v.world.state.entities.filter(e=>C.ELEMENTS[e.type].creature)),originalAnimals);assert.equal(JSON.stringify(v.world.state.heights),JSON.stringify(JSON.parse(originalGarden).heights));assert.equal(v.world.state.seeds,JSON.parse(originalGarden).seeds);
 v.click('#undoBtn');assert.equal(v.world.state.vesselShape,'bowl');assert.equal(v.world.state.vesselSize,'standard');assert.equal(v.world.state.baseStyle,'stone');v.click('#redoBtn');assert.equal(v.world.state.vesselShape,'oval');v.click('[data-export-world]');assert.equal(JSON.parse(await v.downloads.at(-1).text()).vesselSize,'roomy');
 const beforeFailedDesign=JSON.stringify(v.world.state);v.store.fail=S.HISTORY;v.click('#careToggle');v.click('.terrarium-card [data-open-vessel]');v.change('#vesselSizeInput','compact');apply(v);assert(v.$('#vesselDialog').open);assert(!v.$('#vesselMessage').hidden);assert.equal(JSON.stringify(v.world.state),beforeFailedDesign,'a failed backup must not apply a vessel change');v.click('#vesselDialog .text-btn');v.store.fail=null;v.click('#undoBtn');assert.equal(v.world.state.vesselShape,'bowl','a failed vessel change must not consume Undo');
 v=await app();v.click('#newWorldBtn');v.change('#newVesselShape','jar');v.change('#newVesselSize','compact');v.change('#newBaseStyle','none');v.$('#worldForm').dispatchEvent(new v.window.Event('submit',{bubbles:true,cancelable:true}));assert(!v.$('#worldDialog').open);assert.equal(v.world.state.vesselShape,'jar');assert.equal(v.world.state.vesselSize,'compact');assert.equal(v.world.state.baseStyle,'none');
 // The desktop editing dock uses arrow navigation and skips unavailable history actions.
 let dock=await app({width:1440});const arrow=(selector,key)=>{const event=new dock.window.Event('keydown',{bubbles:true,cancelable:true});Object.assign(event,{key,code:key,repeat:false});dock.$(selector).dispatchEvent(event);};dock.$('#inspectBtn').focus();arrow('#inspectBtn','ArrowRight');assert.equal(dock.window.document.activeElement.id,'orbitBtn');arrow('#orbitBtn','ArrowRight');assert.equal(dock.window.document.activeElement.id,'resetViewBtn');arrow('#resetViewBtn','End');assert.equal(dock.window.document.activeElement.id,'photoBtn');
 // A UI refresh must not reset a focused native dropdown before commit.
 let focus=await app({width:1440});focus.click('#careToggle');focus.$('#graphicsSelect').focus();focus.$('#graphicsSelect').value='performance';for(let step=0;step<5;step++)focus.intervals.find(timer=>timer.ms===100).f();assert.equal(focus.$('#graphicsSelect').value,'performance','periodic refresh must leave an in-progress choice alone');assert.equal(focus.world.state.graphics,'auto');focus.$('#graphicsSelect').dispatchEvent(new focus.window.Event('change',{bubbles:true}));assert.equal(JSON.parse(focus.data.get(S.KEY)).graphics,'performance');focus.$('#world').focus();assert(focus.$('body').classList.contains('care-open'),'desktop settings stay open while focus moves to the garden');
 // Desktop preferences must be in storage before a reload, without timers.
 let d=await app({width:1440});d.click('#careToggle');assert.equal(d.$('#carePanel').dataset.settingsTab,'display');
 for(const [selector,value,key]of [['#graphicsSelect','performance','graphics'],['#glassSelect','false','glassVisible'],['#motionSelect','reduced','motion'],['#growthSelect','24','growthRate'],['#lightingSelect','night','lighting']]){d.change(selector,value);assert.equal(String(JSON.parse(d.data.get(S.KEY))[key]),value,'each preference must save immediately');assert.equal(d.$('#saveStatus').dataset.state,'saved');}
 d.click('.vessel-shortcut');shape(d,'oval');d.change('#vesselSizeInput','roomy');d.change('#baseStyleInput','slate');apply(d);assert(!d.$('#vesselDialog').open);assert.equal(JSON.parse(d.data.get(S.KEY)).vesselShape,'oval');
 let reloaded=await app({width:1440,existingData:d.data});for(const key of ['graphics','glassVisible','motion','growthRate','lighting','vesselShape','vesselSize','baseStyle'])assert.equal(reloaded.world.state[key],d.world.state[key],'preferences must survive a real load path: '+key);
 reloaded.click('#careToggle');assert.equal(reloaded.$('#graphicsSelect').value,'performance');assert.equal(reloaded.$('#glassSelect').value,'false');reloaded.click('[data-settings-tab=files]');assert.equal(reloaded.$('#carePanel').dataset.settingsTab,'files');reloaded.click('[data-settings-tab=garden]');assert.equal(reloaded.$('#carePanel').dataset.settingsTab,'garden');
 reloaded.click('#closeCare');reloaded.click('#kitToggle');assert(reloaded.$('body').classList.contains('desktop-kit-collapsed'));reloaded.click('#kitToggle');assert(!reloaded.$('body').classList.contains('desktop-kit-collapsed'));
 reloaded.click('.tabs [data-category=plants]');reloaded.$('[data-element=fern]').focus();reloaded.key('+');assert.equal(reloaded.$('#sizeValue').textContent,'1.1×','letter/size shortcuts must work after clicking a tool button');reloaded.$('#world').focus();reloaded.key('9');assert.equal(reloaded.$('[data-element=grass]').getAttribute('aria-pressed'),'true','the ninth plant must have a working shortcut');
 reloaded.click('#orbitBtn');reloaded.pointer(0,0);assert(!reloaded.$('#inspector').hidden,'clicking an existing plant in Observe opens inspection');
 d=await app({width:1440});d.click('.vessel-shortcut');shape(d,'jar');d.change('#vesselSizeInput','compact');const unsavedDesign=JSON.stringify(d.world.state),storedDesign=d.data.get(S.KEY);d.store.ignore=S.KEY;apply(d);assert(d.$('#vesselDialog').open,'a silently discarded save must keep the form open');assert.equal(JSON.stringify(d.world.state),unsavedDesign);assert.equal(d.data.get(S.KEY),storedDesign);assert.equal(d.$('#saveStatus').dataset.state,'error');assert(!d.$('#vesselMessage').hidden);d.store.ignore=null;apply(d);assert(!d.$('#vesselDialog').open);assert.equal(JSON.parse(d.data.get(S.KEY)).vesselShape,'jar');assert.equal(d.world.state.vesselShape,'jar');
 d=await app({width:1440});d.store.ignore=S.KEY;d.change('#motionSelect','reduced');assert.equal(d.$('#saveStatus').dataset.state,'error');assert.equal(JSON.parse(d.data.get(S.KEY)).motion,'auto');d.store.ignore=null;d.click('#saveSettingsBtn');assert.equal(JSON.parse(d.data.get(S.KEY)).motion,'reduced');assert.equal(d.$('#saveStatus').dataset.state,'saved');
 let slots=await app({width:1440});slots.change('#motionSelect','reduced');slots.change('#glassSelect','false');slots.click('#openGardens');slots.$('#gardenNameInput').value='Woodland study';slots.click('#saveGardenSlot');const slotId=slots.world.state.gardenId;assert(slotId);slots.world.state.seeds+=37;const latestSeeds=slots.world.state.seeds;slots.click('#openGardenBtn');assert.equal(slots.world.state.seeds,latestSeeds);slots.$('#gardensDialog').close();slots.click('#newWorldBtn');slots.$('#seedInput').value='different';slots.$('#worldForm').dispatchEvent(new slots.window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(slots.world.state.motion,'reduced');assert.equal(slots.world.state.glassVisible,false);slots.click('#openGardens');slots.change('#gardenChoice',slotId);slots.click('#openGardenBtn');assert.equal(slots.world.state.seeds,latestSeeds);slots.click('#saveBtn');const again=await app({width:1440,existingData:slots.data});assert.equal(again.world.state.gardenId,slotId);assert.equal(again.world.state.gardenName,'Woodland study');assert.equal(again.world.state.motion,'reduced');
 const keyboard=await app({width:1440});keyboard.click('#openKeyboardBuild');keyboard.$('#keyboardSpecies').value='fern';keyboard.$('#keyboardX').value='2.5';keyboard.$('#keyboardZ').value='0';keyboard.$('#placementForm').dispatchEvent(new keyboard.window.Event('submit',{bubbles:true,cancelable:true}));const placed=keyboard.world.state.entities.at(-1);assert.equal(placed.type,'fern');assert.equal(placed.x,2.5);keyboard.$('#placementDialog').close();keyboard.click('#specimensBtn');keyboard.$('#specimenSearch').value='fern';keyboard.$('#specimenSearch').dispatchEvent(new keyboard.window.Event('input'));keyboard.click('#inspectChosen');assert(!keyboard.$('#inspector').hidden);keyboard.$('#transformX').value='3';keyboard.$('#transformZ').value='0';keyboard.$('#transformRotation').value='90';keyboard.$('#transformScale').value='0.7';keyboard.$('#transformForm').dispatchEvent(new keyboard.window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(placed.x,3);assert.equal(placed.rotation,Math.PI/2);keyboard.click('#undoBtn');assert.equal(keyboard.world.state.entities.at(-1).x,2.5);
 const direct=await app();direct.click('#inspectBtn');direct.pointer(0,0);assert(!direct.$('#inspectAdvanced').open,'selection starts compact');direct.click('[data-tree-tool="trim"]');direct.pointer(0,0);assert(direct.world.state.entities[0].branchPruning[3]<1,'direct cuts the actual picked branch');direct.click('#undoBtn');assert(!direct.world.state.entities[0].branchPruning,'direct cuts support Undo');
 direct.window.dispatchEvent(new direct.window.Event('appinstalled'));assert(direct.$('[data-get-app]').hidden);assert(direct.$('[data-install-app]').hidden);const installed=await app({existingData:direct.data});assert(installed.$('[data-get-app]').hidden,'installation persists across reloads');
 // A completed grass placement survives an immediate reload without running timers
 // or depending on mobile pagehide/visibility notifications.
 for(const variant of [0,1,2]){
  const seed=C.generate('mobile-ui','woodland','journey');seed.entities=[];seed.nextId=1;seed.heights.fill(.6);seed.soil.fill(.6);seed.water=-.6;seed.wildGrowth=false;
  while(C.previewEntity(seed,'grass',0,0,{rotation:0}).variant!==variant)seed.nextId++;
  const data=new Map([[S.KEY,JSON.stringify(seed)]]),grass=await app({existingData:data});grass.click('.tabs [data-category=plants]');grass.click('[data-element=grass]');grass.pointer(1.5,0);
  const planted=JSON.stringify(grass.world.state.entities.at(-1));assert.equal(JSON.parse(planted).type,'grass');assert.equal(JSON.parse(planted).variant,variant);assert.equal(grass.$('#saveStatus').dataset.state,'saved');
  assert.equal(JSON.stringify(JSON.parse(data.get(S.KEY)).entities.at(-1)),planted,'grass is in confirmed storage at the end of the tap');
  grass.click('#undoBtn');assert.equal(JSON.parse(data.get(S.KEY)).entities.length,0,'Undo is immediately durable');grass.click('#redoBtn');assert.equal(JSON.stringify(JSON.parse(data.get(S.KEY)).entities.at(-1)),planted);
  const loaded=await app({existingData:data});assert.equal(JSON.stringify(loaded.world.state.entities.at(-1)),planted);assert.equal(loaded.world.state.seeds,grass.world.state.seeds);assert.deepEqual(loaded.world.state.heights,grass.world.state.heights);
 }
 // A soil stroke commits its entire path once, including work after the first stamp.
 const soilApp=await app(),beforeSoil=JSON.stringify(soilApp.world.state.heights);soilApp.click('.tabs [data-category=terrain]');soilApp.click('[data-element=raise]');
 const soilPointer=(type,x)=>{const e=new soilApp.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{isPrimary:true,button:0,pointerId:1,pointerType:'touch',clientX:x,clientY:1});soilApp.canvas.dispatchEvent(e);};
 soilPointer('pointerdown',1);for(let i=0;i<40;i++)soilPointer('pointermove',1+i*.04);soilPointer('pointerup',2.6);const afterSoil=JSON.stringify(soilApp.world.state.heights);assert.notEqual(afterSoil,beforeSoil);assert.equal(JSON.stringify(JSON.parse(soilApp.data.get(S.KEY)).heights),afterSoil);soilApp.click('#undoBtn');assert.equal(JSON.stringify(soilApp.world.state.heights),beforeSoil);soilApp.click('#redoBtn');assert.equal(JSON.stringify(soilApp.world.state.heights),afterSoil,'Redo must restore the whole stroke');
 // Low supplies expose a usable action on the phone, even with no harvest.
 const barren=C.generate('seedless','woodland','journey');barren.entities=[];barren.nextId=1;barren.heights.fill(.6);barren.soil.fill(.6);barren.water=-.6;barren.seeds=0;barren.paused=true;
 let supply=await app({existingData:new Map([[S.KEY,JSON.stringify(barren)]])});assert(!supply.$('#harvestAllBtn').disabled);assert(supply.$('#harvestLabel').textContent.includes('12'));supply.click('#harvestAllBtn');assert.equal(supply.world.state.seeds,12);assert.equal(JSON.parse(supply.data.get(S.KEY)).seeds,12);assert.equal(supply.world.state.xp,0);supply.click('#walletBtn');assert(supply.$('[data-world-action=refill]').disabled);supply.click('[data-world-action=mode]');assert.equal(supply.world.state.mode,'sandbox');assert.equal(JSON.parse(supply.data.get(S.KEY)).mode,'sandbox');
 // Settings, selection, build tools and dialogs must hand off the canvas cleanly.
 const panels=await app();panels.click('#inspectBtn');panels.pointer(0,0);panels.click('#careToggle');assert(panels.$('#inspector').hidden,'opening settings dismisses inspection on a phone');panels.click('[data-settings-tab=display]');assert.equal(panels.$('#carePanel').dataset.settingsTab,'display');panels.click('#inspectBtn');assert(!panels.$('body').classList.contains('care-open'),'choosing an editing tool closes settings');panels.pointer(0,0);assert(!panels.$('#inspector').hidden);
 panels.click('#careToggle');panels.click('#specimensBtn');assert(!panels.$('body').classList.contains('care-open'));assert.equal(panels.$('#specimenChoice').value,'1','the native listbox needs an explicit initial selection');panels.click('#inspectChosen');assert(!panels.$('#inspector').hidden);assert(!panels.$('#specimensDialog').open);panels.click('#careToggle');panels.click('#editGardenBtn');assert(!panels.$('body').classList.contains('care-open'));assert.equal(panels.window.document.activeElement,panels.canvas);
 panels.click('.tabs [data-category=plants]');panels.click('[data-element=grass]');panels.click('#careToggle');const count=panels.world.state.entities.length;panels.pointer(3.8,0);assert(!panels.$('body').classList.contains('care-open'));assert.equal(panels.world.state.entities.length,count+1,'the first canvas tap after settings must perform the chosen edit');
 panels.click('#careToggle');panels.click('#openKeyboardBuild');assert(!panels.$('body').classList.contains('care-open'));const protectedState=JSON.stringify(panels.world.state);panels.pointer(-3,0);assert.equal(JSON.stringify(panels.world.state),protectedState,'an open options dialog cannot leak a pointer into the garden');panels.$('#keyboardSpecies').value='moss';panels.$('#keyboardX').value='-3';panels.$('#placementForm').dispatchEvent(new panels.window.Event('submit',{bubbles:true,cancelable:true}));assert(!panels.$('#placementDialog').open,'successful coordinate placement returns to the canvas');assert.equal(JSON.parse(panels.data.get(S.KEY)).entities.at(-1).type,'moss');
 // Fern fill is explicit, additive, affordable, immediately saved and one Undo.
 const patch=await app(),kept=JSON.stringify(patch.world.state.entities),terrain=JSON.stringify(patch.world.state.heights);patch.click('#careToggle');patch.click('#addFerns');assert.equal(patch.world.state.entities.length,JSON.parse(kept).length+3);assert.equal(JSON.stringify(patch.world.state.entities.slice(0,JSON.parse(kept).length)),kept);assert.equal(JSON.stringify(patch.world.state.heights),terrain);assert(!patch.$('body').classList.contains('care-open'));assert.equal(JSON.parse(patch.data.get(S.KEY)).entities.length,patch.world.state.entities.length);patch.click('#undoBtn');assert.equal(JSON.stringify(patch.world.state.entities),kept);
 const refreshGame = ui => { for(let i=0;i<5;i++) ui.intervals.find(timer=>timer.ms===100).f(); };
 const submit = (ui,selector) => ui.$(selector).dispatchEvent(new ui.window.Event('submit',{bubbles:true,cancelable:true}));
 const edit = await app();
 edit.click('#orbitBtn');
 edit.click('#orbitBtn');
 const initialEntities = edit.world.state.entities.length;
 edit.pointer(3.8,0);
 assert.equal(edit.world.state.entities.length,initialEntities,'reselecting Observe must never arm planting');

 const tree = edit.world.state.entities[0];
 Object.assign(tree,{x:.1234567,z:.2345678,rotation:.3141592,scale:.7123456});
 edit.click('#inspectBtn');
 edit.pointer(tree.x,tree.z);
 assert.equal(edit.$('#inspectBtn').getAttribute('aria-pressed'),'true');
 assert.equal(edit.$('#transformRotation').getAttribute('step'),'any');
 edit.$('#transformX').value='0.87';
 edit.$('#transformScale').focus();
 refreshGame(edit);
 assert.equal(edit.$('#transformX').value,'0.87','the simulation must preserve a draft after focus changes');
 submit(edit,'#transformForm');
 assert.equal(tree.x,.87);
 assert.equal(tree.z,.2345678);
 assert.equal(tree.rotation,.3141592);
 assert.equal(tree.scale,.7123456,'editing X must preserve precision of every other property');
 assert.equal(edit.$('#transformMessage').textContent,'Changes applied.');
 edit.click('#moveOne');
 assert(!edit.$('#movePrompt').hidden);
 edit.click('#cancelMove');
 assert.equal(edit.window.document.activeElement,edit.$('#moveOne'));
 assert.equal(edit.$('#inspector').hidden,false);
 edit.click('#moveOne');
 edit.key('Escape');
 assert(edit.$('#movePrompt').hidden);
 assert.equal(tree.x,.87);
 edit.click('#moveOne');
 edit.pointer(-2,1);
 assert.equal(tree.x,-2);
 assert(!edit.$('#inspector').hidden);
 assert.equal(JSON.parse(edit.data.get(S.KEY)).entities[0].z,1);
 edit.click('#undoBtn');
 assert.equal(edit.world.state.entities[0].x,.87);

 edit.click('#openGardens');
 edit.$('#gardenNameInput').value='Fern study';
 edit.$('#saveGardenSlot').focus();
 refreshGame(edit);
 assert.equal(edit.$('#gardenNameInput').value,'Fern study');
 edit.click('#saveGardenSlot');
 assert.equal(edit.world.state.gardenName,'Fern study');
 edit.world.state.seeds+=13;
 edit.click('#archiveGardenBtn');
 const backup=JSON.parse(edit.data.get(S.HISTORY))[0];
 assert.equal(JSON.parse(backup.data).seeds,edit.world.state.seeds,'archiving the open slot must keep the latest garden');

 const entry=await app();
 entry.click('#specimensBtn');
 entry.$('#specimenSearch').value='  no such plant  ';
 entry.$('#specimenSearch').dispatchEvent(new entry.window.Event('input'));
 assert(entry.$('#inspectChosen').disabled);
 assert.match(entry.$('#specimenMessage').textContent,/No matches/);
 entry.$('#specimensDialog').close();
 entry.click('#openKeyboardBuild');
 entry.$('#keyboardSpecies').value='grass';
 entry.$('#keyboardX').value='0';
 entry.$('#keyboardZ').value='0';
 const entityCount=entry.world.state.entities.length,seedCount=entry.world.state.seeds;
 submit(entry,'#placementForm');
 assert(entry.$('#placementDialog').open);
 assert(entry.$('#keyboardMessage').textContent.trim());
 assert.equal(entry.world.state.entities.length,entityCount);
 assert.equal(entry.world.state.seeds,seedCount);
 assert.equal(entry.$('#orbitBtn').getAttribute('aria-pressed'),'true','rejected placement must preserve the previous tool');
 entry.$('#stampX').value='';
 entry.click('#stampSoil');
 assert.match(entry.$('#keyboardMessage').textContent,/Choose coordinates/);
 entry.$('#stampX').value='2';
 entry.click('#stampSoil');
 assert.match(entry.$('#keyboardMessage').textContent,/applied/);
 entry.click('#undoBtn');
 entry.world.state.heights.fill(2.9);
 entry.click('#stampSoil');
 assert.match(entry.$('#keyboardMessage').textContent,/limit/);
 assert.equal(entry.$('#redoBtn').disabled,false,'an ineffective stamp must preserve Redo');

 const wallet=await app({width:1024,existingData:new Map([[S.KEY,JSON.stringify(barren)]])});
 assert.equal(wallet.$('.desktop-harvest-label').textContent,'Refill');
 wallet.click('#walletBtn');
 const guideAction=wallet.$('[data-world-action=refill]');
 assert(!guideAction.disabled);
 wallet.world.state.seeds=20;
 refreshGame(wallet);
 assert.equal(wallet.$('[data-world-action=refill]'),guideAction);
 assert(guideAction.disabled);
 assert.match(wallet.$('.seed-supply strong').textContent,/20 seeds/);
 console.log('Passed: production phone DOM controls, touch placement, trimming/Undo/regrowth, glass/motion/preview settings, persistent save errors/export/retry, dated restore, deferred/manual updates, and save-before-update consent.');
})().catch(e=>{console.error(e);process.exitCode=1;});
