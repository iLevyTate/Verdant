const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const APP=fs.existsSync(path.join(__dirname,'../dist/core.js'))?'../dist/':'../',C=require(APP+'core.js'),S=require(APP+'saves.js');
const s=C.generate('keep-my-bonsai','woodland','sandbox'),tree=s.entities.find(e=>e.type==='tree')||C.place(s,'tree',0,0).entity;
assert(tree);tree.growth=1.1;tree.health=.93;tree.harvest=1;
const before=JSON.parse(JSON.stringify(tree)),climate=JSON.parse(JSON.stringify(s.heights)),seeds=s.seeds;
assert(!C.trimBonsai(s,s.entities.find(e=>e.type!=='tree').id).ok);
assert(!C.regrowBonsai(s,tree.id).ok);
for(const pruning of[.84,.68,.52]){assert(C.trimBonsai(s,tree.id).ok);assert.equal(tree.pruning,pruning);assert.equal(tree.regrowing,false);}
assert(!C.trimBonsai(s,tree.id).ok,'repeated trims must be bounded');
assert.deepEqual({...tree,pruning:undefined,regrowing:undefined},{...before,pruning:undefined,regrowing:undefined},'trimming must preserve identity, roots, size, maturity, health and stored seeds');
assert.equal(s.seeds,seeds);assert.deepEqual(s.heights,climate);
C.advance(s,2);assert.equal(tree.pruning,.52,'trimmed shapes stay held while other growth continues');
assert(C.regrowBonsai(s,tree.id).ok);s.paused=true;C.advance(s,10);assert.equal(tree.pruning,.52,'paused time must freeze regrowth');
s.paused=false;C.advance(s,1);assert(tree.pruning>.52&&tree.pruning<1,'regrowth must be gradual');
assert(C.trimBonsai(s,tree.id).ok);assert.equal(tree.pruning,.52);assert.equal(tree.regrowing,false,'trimming also stops regrowth');
assert(C.regrowBonsai(s,tree.id).ok);
for(let i=0;i<100&&tree.pruning<1;i++)C.advance(s,2);
assert.equal(tree.pruning,1);assert.equal(tree.regrowing,false);
C.trimBonsai(s,tree.id);s.glassVisible=false;
const loaded=C.validate(JSON.parse(JSON.stringify(s)));assert.equal(loaded.glassVisible,false);assert.deepEqual(loaded.entities,s.entities,'glass preference and trim must round-trip through exports and history');
for(const mutation of[e=>e.pruning=NaN,e=>e.pruning=.1,e=>e.regrowing='yes']){const bad=JSON.parse(JSON.stringify(s));mutation(bad.entities.find(e=>e.id===tree.id));assert.throws(()=>C.validate(bad));}
const pet=C.validate(JSON.parse(JSON.stringify(s)));pet.careMode='pet';pet.careState.alive=false;pet.careState.vitality=0;assert(!C.trimBonsai(pet,tree.id).ok);assert(!C.regrowBonsai(pet,tree.id).ok);
pet.entities.find(e=>e.id===tree.id).regrowing=true;C.advance(pet,2);assert.equal(pet.entities.find(e=>e.id===tree.id).pruning,tree.pruning,'lost pet worlds must not regrow');
const legacy=JSON.parse(JSON.stringify(s));delete legacy.glassVisible;for(const e of legacy.entities){delete e.pruning;delete e.regrowing;}
const original=JSON.stringify(legacy),data=new Map([[S.KEY,original]]),store={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},saves=S.create(store,C.validate),restored=saves.load();
assert.equal(restored.status,'loaded');assert.equal(restored.state.glassVisible,true);assert.deepEqual(restored.state.entities,legacy.entities);assert.equal(data.get(S.KEY),original,'updating must not rewrite or replace existing trees');
C.trimBonsai(restored.state,tree.id);restored.state.glassVisible=false;assert(saves.save(restored.state,{checkpoint:true}).ok);assert.equal(data.get(S.BACKUP),original);const reloaded=S.create(store,C.validate).load().state;assert.equal(reloaded.glassVisible,false);assert.equal(reloaded.entities.find(e=>e.id===tree.id).pruning,.84);
console.log('Passed: bounded bonsai trims, held shapes, gradual/pause/death-aware regrowth, unchanged tree identity and rewards, persistent glass view, and old/new save preservation.');
