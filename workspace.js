/* Additional stores never replace or clear the existing primary garden. */
(function(root){'use strict';
const PREFS='verdant-device-v1',GARDENS='verdant-gardens-v1',VIEW_KEYS=['graphics','motion','lighting','glassVisible','maturePreview','batteryMode'];
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function create(getStorage,validate){
 const storage=()=>typeof getStorage==='function'?getStorage():getStorage;let editing=true,ownership='single-tab',releaseLock,claiming,preferenceError=false;const listeners=new Set();
 const notify=()=>listeners.forEach(fn=>fn({editing,ownership}));
 function write(key,value){const raw=JSON.stringify(value),s=storage();s.setItem(key,raw);if(s.getItem(key)!==raw)throw Error('Unconfirmed write');}
 function preferences(){try{const p=JSON.parse(storage().getItem(PREFS)||'{}');return p&&typeof p==='object'&&!Array.isArray(p)?p:{};}catch{return{};}}
 function valid(key,value){const choices={graphics:['auto','performance','cinematic'],motion:['auto','full','reduced'],lighting:['day','cycle','night']};return choices[key]?choices[key].includes(value):typeof value==='boolean';}
 function savePreferences(state,extra={}){try{const prefs={...preferences(),...extra};for(const key of VIEW_KEYS)if(valid(key,state[key]))prefs[key]=state[key];write(PREFS,prefs);preferenceError=false;return true;}catch{preferenceError=true;return false;}}
 function applyPreferences(state){const p=preferences();for(const key of VIEW_KEYS)if(valid(key,p[key]))state[key]=p[key];state.batteryMode=state.batteryMode===true;savePreferences(state);return state;}
 function acquire(locks){if(releaseLock)return Promise.resolve(true);if(claiming)return claiming;if(!locks?.request){editing=true;ownership='single-tab';notify();return true;}editing=false;ownership='waiting';claiming=new Promise(resolve=>{locks.request('verdant-world-v1:editor',{mode:'exclusive',ifAvailable:true},lock=>{if(!lock){ownership='other-tab';notify();resolve(false);return;}editing=true;ownership='protected';return new Promise(release=>{releaseLock=()=>{releaseLock=null;editing=false;ownership='released';release();notify();};notify();resolve(true);});}).catch(()=>{editing=false;ownership='unavailable';notify();resolve(false);});});return claiming.finally(()=>{claiming=null;});}
 function gardens(){try{const rows=JSON.parse(storage().getItem(GARDENS)||'[]');return Array.isArray(rows)?rows.filter(r=>r&&/^[\w-]{1,80}$/.test(r.id)&&typeof r.name==='string'&&typeof r.data==='string'&&Number.isFinite(r.at)).slice(0,3):[];}catch{return[];}}
 function saveGarden(state,name,id){if(!editing)return{ok:false,code:'other-tab'};try{const next=validate(clone(state)),rows=gardens(),slot=id||'garden-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),at=rows.findIndex(r=>r.id===slot);if(at<0&&rows.length===3)return{ok:false,code:'garden-limit'};next.gardenId=slot;next.gardenName=String(name||'My garden').trim().slice(0,48)||'My garden';const row={id:slot,name:next.gardenName,revision:(rows[at]?.revision||0)+1,at:Date.now(),data:JSON.stringify(next)};if(at<0)rows.unshift(row);else rows[at]=row;if(JSON.stringify(rows).length*2>1500000)return{ok:false,code:'garden-budget'};write(GARDENS,rows);return{ok:true,state:next};}catch(error){return{ok:false,code:'storage-failed',error};}}
 function openGarden(id){try{const r=gardens().find(r=>r.id===id);return r?{ok:true,state:applyPreferences(validate(JSON.parse(r.data)))}:{ok:false};}catch{return{ok:false};}}
 function removeGarden(id){if(!editing)return false;try{write(GARDENS,gardens().filter(r=>r.id!==id));return true;}catch{return false;}}
 async function health(api){const result={ownership,preferenceError,persisted:null,usage:null,quota:null};try{if(api?.persisted)result.persisted=await api.persisted();if(api?.estimate)Object.assign(result,await api.estimate());}catch{}return result;}
 return{applyPreferences,savePreferences,preferences,acquire,release:()=>releaseLock?.(),gardens,saveGarden,openGarden,removeGarden,health,onOwnership:fn=>listeners.add(fn),get editable(){return editing;},get ownership(){return ownership;},get preferenceError(){return preferenceError;}};
}
function createEdit(before,after,label='garden edit'){
 const changes=[],entities=[],ignored=new Set(['entities','clock','day','health','careUpdatedAt','nextId','placed','quests','stats','seeds','xp','mission','discoveries','seen','hydroRemainder','spreadClock','spreadSerial','terrainRevision']);let seeds=0,xp=0;
 for(const key of new Set([...Object.keys(before),...Object.keys(after)]))if(!ignored.has(key)&&!same(before[key],after[key])){
  if(['heights','soil'].includes(key))changes.push({key,cells:before[key].flatMap((value,index)=>value===after[key][index]?[]:[{index,delta:after[key][index]-value}])});
  else if(key==='careState')changes.push({key,fields:Object.keys(after[key]).filter(k=>k!=='ageHours'&&!same(before[key][k],after[key][k])).map(k=>({key:k,before:before[key][k],after:after[key][k]}))});
  else if(['moisture','water','baseWater'].includes(key))changes.push({key,delta:after[key]-before[key]});else changes.push({key,before:clone(before[key]),after:clone(after[key])});
 }
 const a=new Map(before.entities.map(e=>[e.id,e])),b=new Map(after.entities.map(e=>[e.id,e]));
 for(const id of new Set([...a.keys(),...b.keys()])){const old=a.get(id),next=b.get(id);if(!old||!next){entities.push({id,before:clone(old),after:clone(next)});seeds+=next?-(next.paid||0):Math.floor((old.paid||0)*.5);continue;}const fields=[];for(const key of new Set([...Object.keys(old),...Object.keys(next)]))if(!['growth','health'].includes(key)&&!same(old[key],next[key]))fields.push({key,before:clone(old[key]),after:clone(next[key])});if(fields.length)entities.push({id,fields});if((old.harvest||0)>=1&&next.harvest===0){seeds+=old.type==='tree'?7:old.type==='flower'?5:4;xp+=8;}}
 return{label,changes,entities,seeds,xp};
}
function applyEdit(state,edit,back=true){const target=back?'before':'after',factor=back?-1:1;
 for(const change of edit.changes){if(change.cells){for(const c of change.cells)state[change.key][c.index]=Math.max(change.key==='heights'?.12:.03,Math.min(change.key==='heights'?2.9:.99,state[change.key][c.index]+factor*c.delta));}
 else if(change.fields){for(const f of change.fields)state[change.key][f.key]=typeof f.before==='number'?Math.max(0,Math.min(1,state[change.key][f.key]+factor*(f.after-f.before))):f[target];}
 else if(change.delta!==undefined)state[change.key]=Math.max(change.key==='moisture'?0:-.6,Math.min(change.key==='moisture'?1:1.1,state[change.key]+factor*change.delta));else if(change[target]===undefined)delete state[change.key];else state[change.key]=clone(change[target]);}
 for(const change of edit.entities){const index=state.entities.findIndex(e=>e.id===change.id);if(change.fields){if(index>=0)for(const f of change.fields){if(f[target]===undefined)delete state.entities[index][f.key];else state.entities[index][f.key]=clone(f[target]);}}else if(change[target]===undefined){if(index>=0){change.detached=clone(state.entities[index]);state.entities.splice(index,1);}}else if(index<0)state.entities.push(clone(change.detached||change[target]));}
 state.seeds=Math.max(0,Math.min(9999,state.seeds+factor*edit.seeds));state.xp=Math.max(0,state.xp+factor*edit.xp);state.nextId=Math.max(state.nextId,1,...state.entities.map(e=>e.id+1));state.terrainRevision++;return state;
}
const api={PREFS,GARDENS,VIEW_KEYS,create,createEdit,applyEdit};if(typeof module!=='undefined')module.exports=api;else root.VerdantWorkspace=api;
})(typeof window!=='undefined'?window:globalThis);
