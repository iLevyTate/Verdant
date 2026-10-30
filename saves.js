/* Stable, renderer-independent world storage. Updates never clear saved worlds. */
(function(root){
  'use strict';
  const KEY='verdant-world-v1',BACKUP=KEY+'-backup',CHECKPOINT=KEY+'-before-update',RECOVERY=KEY+'-recovery',HISTORY=KEY+'-history';
  function create(getStorage,validate){
    let expected=null,loaded=false,blocked=true;
    const storage=()=>typeof getStorage==='function'?getStorage():getStorage;
    const parse=raw=>validate(JSON.parse(raw));
    const failure=(code,error)=>({ok:false,code,error});
    function write(store,key,data){store.setItem(key,data);if(store.getItem(key)!==data)throw Error('Browser storage did not retain this write.');}
    function history(){try{const rows=JSON.parse(storage().getItem(HISTORY)||'[]');return Array.isArray(rows)?rows.filter(row=>row&&typeof row.id==='string'&&typeof row.data==='string'&&Number.isFinite(row.at)):[];}catch(error){return[];}}
    function remember(data,label,force=false){
      try{
        parse(data);const now=Date.now(),rows=history();if(rows[0]?.data===data||!force&&rows[0]&&now-rows[0].at<300000)return true;
        rows.unshift({id:now+'-'+Math.random().toString(36).slice(2,9),at:now,label:String(label).slice(0,60),data});
        let bytes=0;const kept=[];for(const row of rows)if(kept.length<5&&bytes+row.data.length<=768000){kept.push(row);bytes+=row.data.length;}if(!kept.some(row=>row.data===data))return false;write(storage(),HISTORY,JSON.stringify(kept));return true;
      }catch(error){return false;}
    }
    function snapshots(){
      try{
        const rows=history(),store=storage();for(const [id,label]of[[BACKUP,'Previous saved world'],[CHECKPOINT,'Before app update'],[RECOVERY,'Before latest restore']]){const data=store.getItem(id);if(data!==null)rows.push({id,label,at:0,data});}
        const seen=new Set();return rows.filter(row=>{try{const state=parse(row.data);if(seen.has(row.data))return false;seen.add(row.data);row.summary={seed:state.seed,biome:state.biome,day:state.day+1,elements:state.entities.length};return true;}catch(error){return false;}}).map(({data,...row})=>row);
      }catch(error){return[];}
    }
    function load(){
      try{
        const raw=storage().getItem(KEY);expected=raw;loaded=true;
        if(raw===null){const backup=[BACKUP,CHECKPOINT,HISTORY].some(key=>storage().getItem(key)!==null);if(backup){blocked=true;return{status:'recovery',raw:null,code:'missing-primary',backupAvailable:hasBackup()};}blocked=false;return{status:'new',state:null};}
        try{const state=parse(raw);blocked=false;return{status:'loaded',state};}
        catch(error){blocked=true;return{status:'recovery',raw,code:'unreadable',backupAvailable:hasBackup(),error};}
      }catch(error){blocked=true;return{status:'recovery',raw:null,code:'storage-unavailable',backupAvailable:false,error};}
    }
    function hasBackup(){return snapshots().length>0;}
    function save(state,{checkpoint=false,manual=false}={}){
      if(!loaded||blocked)return failure('recovery-required');
      try{
        const data=JSON.stringify(state);parse(data);const store=storage(),current=store.getItem(KEY);
        if(current!==expected)return failure('conflict');
        if(current!==null){parse(current);write(store,BACKUP,current);}
        // A dedicated checkpoint survives subsequent autosaves in the new release.
        if(checkpoint)write(store,CHECKPOINT,data);
        else if(current!==null&&store.getItem(CHECKPOINT)===null)write(store,CHECKPOINT,current);
        store.setItem(KEY,data);expected=data;const confirmed=store.getItem(KEY);if(confirmed!==data){expected=current;return failure('write-not-confirmed');}const historySaved=remember(checkpoint||manual?data:current||data,checkpoint?'Before app update':manual?'Manual save':'Automatic restore point',checkpoint||manual);return{ok:true,historySaved};
      }catch(error){return failure('storage-failed',error);}
    }
    function raw(){try{return storage().getItem(KEY)??storage().getItem(RECOVERY)??storage().getItem(BACKUP)??storage().getItem(CHECKPOINT);}catch(error){return null;}}
    function checkpointOriginal(){
      try{const store=storage(),current=store.getItem(KEY);if(current===null)return failure('no-world');if(current!==expected)return failure('conflict');write(store,CHECKPOINT,current);return{ok:true};}catch(error){return failure('storage-failed',error);}
    }
    function restoreFromRaw(data){
      try{
        const state=parse(data),store=storage(),current=store.getItem(KEY);
        if(current!==expected)return failure('conflict');
        if(current!==null)write(store,RECOVERY,current);
        write(store,KEY,data);expected=data;blocked=false;loaded=true;if(current!==null)remember(current,'Before restoring a world',true);return{ok:true,state};
      }catch(error){return failure('storage-failed',error);}
    }
    function restoreBackup(){
      try{
        const store=storage();
        for(const key of[BACKUP,CHECKPOINT]){const data=store.getItem(key);if(data!==null){try{parse(data);}catch(error){continue;}return restoreFromRaw(data);}}
        const point=history().find(row=>{try{parse(row.data);return true;}catch(error){return false;}});return point?restoreFromRaw(point.data):failure('no-backup');
      }catch(error){return failure('storage-failed',error);}
    }
    function createSnapshot(state){if(!loaded||blocked)return failure('recovery-required');try{if(storage().getItem(KEY)!==expected)return failure('conflict');const data=JSON.stringify(state);parse(data);return remember(data,'Saved restore point',true)?{ok:true}:failure('storage-failed');}catch(error){return failure('storage-failed',error);}}
    function restoreSnapshot(id){try{const data=[BACKUP,CHECKPOINT,RECOVERY].includes(id)?storage().getItem(id):history().find(row=>row.id===id)?.data;return data?restoreFromRaw(data):failure('no-backup');}catch(error){return failure('storage-failed',error);}}
    return{load,save,raw,restoreBackup,restoreFromRaw,checkpointOriginal,hasBackup,snapshots,createSnapshot,restoreSnapshot};
  }
  const api={create,KEY,BACKUP,CHECKPOINT,RECOVERY,HISTORY};if(typeof module!=='undefined')module.exports=api;else root.VerdantSaves=api;
})(typeof window!=='undefined'?window:globalThis);
