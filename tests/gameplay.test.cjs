const assert=require('node:assert/strict');
const APP=require('node:fs').existsSync(require('node:path').join(__dirname,'../dist/core.js'))?'../dist/':'../';
const C=require('./legacy-core.cjs');
function empty(seed='test-garden'){
  const s=C.generate(seed,'woodland');s.entities=[];s.heights.fill(1);s.soil.fill(.64);s.water=s.baseWater=-.6;s.weather='clear';s.sun=.65;s.wildGrowth=false;return s;
}
function entity(type,x=0,z=0,origin='wild'){
  return{id:1,type,x,z,origin,paid:0,rotation:0,scale:1,growth:1,health:.9,harvest:0,phase:0,variant:1};
}
const a=C.generate('a-quiet-creek','woodland'),b=C.generate('a-quiet-creek','woodland');
assert.deepEqual(a,b);assert.deepEqual(C.weatherAt(a),C.weatherAt(b));
assert.notDeepEqual(a.heights,C.generate('new-land','woodland').heights);
const landforms=new Set(Array.from({length:20},(_,i)=>C.generate(String(i)).landform.style));assert(landforms.size>=3,'seeds should generate a variety of landforms');

const climate=empty(),baseline=C.localConditions(0,0,climate);climate.entities.push(entity('tree',.3));
const shaded=C.localConditions(0,0,climate);assert(shaded.light<baseline.light);assert(shaded.moisture>baseline.moisture);
climate.entities.push({...entity('log',.2),id:2});assert(C.localConditions(0,0,climate).nutrients>shaded.nutrients);
climate.entities.push({...entity('butterfly',1),id:3});assert.equal(C.localConditions(0,0,climate).pollination,1);

const budget=empty();const start=budget.seeds,placed=C.place(budget,'fern',-2,-2,{rotation:.7,size:1.2});assert(placed.ok);assert.equal(budget.seeds,start-C.COSTS.fern);assert.equal(placed.entity.rotation,.7);assert.equal(placed.entity.scale,C.ELEMENTS.fern.scale*1.2);
const balance=budget.seeds,count=budget.entities.length;assert(!C.place(budget,'fern',-2,-2).ok);assert.equal(budget.seeds,balance);assert.equal(budget.entities.length,count);
assert(C.relocate(budget,placed.entity.id,2,2).ok);assert.equal(budget.seeds,balance,'moving should not cost more seeds');
assert.equal(C.remove(budget,placed.entity.id),Math.floor(C.COSTS.fern*.5));
budget.mode='sandbox';budget.seeds=0;assert(C.place(budget,'tree',0,0).ok);assert.equal(budget.seeds,0,'Free build must remain unlimited');

const journey=empty();C.place(journey,'fern',-2,-2);C.place(journey,'moss',0,-2);const third=C.place(journey,'clover',2,-2);assert.equal(journey.mission,1);assert(third.events.some(e=>e.type==='mission'));
const paidXP=journey.xp,paidSeeds=journey.seeds;C.updateProgress(journey);assert.equal(journey.xp,paidXP);assert.equal(journey.seeds,paidSeeds,'chapter rewards must not be paid twice');
C.recordSculpt(journey);C.care(journey,'mist');assert.equal(journey.mission,2);

const harvest=empty();const mature=entity('flower');mature.harvest=1;harvest.entities=[mature];assert(C.isReady(mature));const result=C.harvest(harvest);assert.equal(result.count,1);assert.equal(result.seeds,5);assert(!C.isReady(mature));assert.equal(C.harvest(harvest).seeds,0,'a harvest must reset readiness');

const pairing=empty();pairing.entities=[entity('flower',0,0)];pairing.nextId=2;const insect=C.place(pairing,'butterfly',1,0);assert(insect.ok);assert(pairing.discoveries.includes('pollination'),'placing a butterfly near a wild flower should discover pollination');

const canopySoil=empty('canopy'),bareSoil=empty('canopy');canopySoil.entities=[entity('tree',0,0)];for(let i=0;i<70;i++){C.advance(canopySoil,1);C.advance(bareSoil,1);}assert(canopySoil.soil[0]>bareSoil.soil[0],'canopies should slow actual local soil evaporation');
const rainy=empty('hydrology'),clear=empty('hydrology');rainy.weather='rain';rainy.wildGrowth=clear.wildGrowth=false;
for(let i=0;i<80;i++){C.advance(rainy,1);C.advance(clear,1);}assert(rainy.moisture>clear.moisture+.08,'rain must infiltrate the soil while clear skies dry it');assert(rainy.soil.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
const erosion=empty();erosion.wildGrowth=true;erosion.weather='rain';erosion.soil.fill(.8);erosion.heights[1]=1.8;const before=erosion.heights[1],sum=erosion.heights.reduce((x,y)=>x+y,0);C.advance(erosion,8);assert(erosion.heights[1]<before,'wet slopes should erode');assert(erosion.terrainRevision>0);assert(Math.abs(erosion.heights.reduce((x,y)=>x+y,0)-sum)<1e-7,'erosion should transport rather than create soil');

const spreadA=empty('seedlings'),spreadB=empty('seedlings');for(const s of[spreadA,spreadB]){s.wildGrowth=true;s.entities=[entity('clover')];s.nextId=2;}
for(let i=0;i<125;i++){C.advance(spreadA,1);C.advance(spreadB,1);}assert(spreadA.entities.some(e=>e.origin==='spread'),'healthy mature plants should spread');assert.deepEqual(spreadA,spreadB,'self-seeding must be deterministic for the same simulation');
const frozen=JSON.stringify(spreadA);spreadA.paused=true;const paused=JSON.stringify(spreadA);assert.deepEqual(C.advance(spreadA,20),[]);assert.equal(JSON.stringify(spreadA),paused);

const old=C.generate('old-save');old.version=1;const coordinates=old.entities.map(e=>[e.id,e.type,e.x,e.z]);delete old.soil;delete old.mode;delete old.stats;delete old.seeds;const upgraded=C.validate(JSON.parse(JSON.stringify(old)));assert.equal(upgraded.version,2);assert.equal(upgraded.mode,'sandbox');assert.deepEqual(upgraded.entities.map(e=>[e.id,e.type,e.x,e.z]),coordinates,'legacy worlds must retain their layout');assert.equal(upgraded.soil.length,upgraded.heights.length);
const saved=C.validate(JSON.parse(JSON.stringify(spreadB)));assert.deepEqual(saved.soil,spreadB.soil);assert.equal(saved.seeds,spreadB.seeds);assert.equal(saved.mission,spreadB.mission);
const corrupt=JSON.parse(JSON.stringify(spreadB));corrupt.soil[0]='wet';assert.throws(()=>C.validate(corrupt));const duplicate=JSON.parse(JSON.stringify(a));duplicate.entities[1].id=duplicate.entities[0].id;assert.throws(()=>C.validate(duplicate));
console.log('Passed: varied landforms, deterministic weather, local habitats, seed economy, placement and relocation, chapter rewards, harvesting, hydrology, erosion conservation, deterministic spreading, pause, and legacy save migration.');
