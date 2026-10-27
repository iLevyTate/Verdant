/* Stable, renderer-independent world storage. Updates never clear saved worlds. */
(function(root){
  'use strict';
  const KEY='verdant-world-v1',BACKUP=KEY+'-backup',CHECKPOINT=KEY+'-before-update',RECOVERY=KEY+'-recovery';
  function create(getStorage,validate){
    let expected=null,loaded=false,blocked=true;
    const storage=()=>typeof getStorage==='function'?getStorage():getStorage;
    const parse=raw=>validate(JSON.parse(raw));
    const failure=(code,error)=>({ok:false,code,error});
    function load(){
      try{
        const raw=storage().getItem(KEY);expected=raw;loaded=true;
        if(raw===null){const backup=[BACKUP,CHECKPOINT].some(key=>storage().getItem(key)!==null);if(backup){blocked=true;return{status:'recovery',raw:null,code:'missing-primary',backupAvailable:hasBackup()};}blocked=false;return{status:'new',state:null};}
        try{const state=parse(raw);blocked=false;return{status:'loaded',state};}
        catch(error){blocked=true;return{status:'recovery',raw,code:'unreadable',backupAvailable:hasBackup(),error};}
      }catch(error){blocked=true;return{status:'recovery',raw:null,code:'storage-unavailable',backupAvailable:false,error};}
    }
    function hasBackup(){try{return[BACKUP,CHECKPOINT].some(key=>{const raw=storage().getItem(key);if(raw===null)return false;try{parse(raw);return true;}catch(error){return false;}});}catch(error){return false;}}
    function save(state,{checkpoint=false}={}){
      if(!loaded||blocked)return failure('recovery-required');
      try{
        const data=JSON.stringify(state);parse(data);const store=storage(),current=store.getItem(KEY);
        if(current!==expected)return failure('conflict');
        if(current!==null){parse(current);store.setItem(BACKUP,current);}
        // A dedicated checkpoint survives subsequent autosaves in the new release.
        if(checkpoint)store.setItem(CHECKPOINT,data);
        else if(current!==null&&store.getItem(CHECKPOINT)===null)store.setItem(CHECKPOINT,current);
        store.setItem(KEY,data);expected=data;return{ok:true};
      }catch(error){return failure('storage-failed',error);}
    }
    function raw(){try{return storage().getItem(KEY)??storage().getItem(RECOVERY)??storage().getItem(BACKUP)??storage().getItem(CHECKPOINT);}catch(error){return null;}}
    function checkpointOriginal(){
      try{const store=storage(),current=store.getItem(KEY);if(current===null)return failure('no-world');if(current!==expected)return failure('conflict');store.setItem(CHECKPOINT,current);return{ok:true};}catch(error){return failure('storage-failed',error);}
    }
    function restoreFromRaw(data){
      try{
        const state=parse(data),store=storage(),current=store.getItem(KEY);
        if(current!==expected)return failure('conflict');
        if(current!==null)store.setItem(RECOVERY,current);
        store.setItem(KEY,data);expected=data;blocked=false;loaded=true;return{ok:true,state};
      }catch(error){return failure('storage-failed',error);}
    }
    function restoreBackup(){
      try{
        const store=storage();
        for(const key of[BACKUP,CHECKPOINT]){const data=store.getItem(key);if(data!==null){try{parse(data);}catch(error){continue;}return restoreFromRaw(data);}}
        return failure('no-backup');
      }catch(error){return failure('storage-failed',error);}
    }
    return{load,save,raw,restoreBackup,restoreFromRaw,checkpointOriginal,hasBackup};
  }
  const api={create,KEY,BACKUP,CHECKPOINT,RECOVERY};if(typeof module!=='undefined')module.exports=api;else root.VerdantSaves=api;
})(typeof window!=='undefined'?window:globalThis);
