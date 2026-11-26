const assert=require('node:assert/strict'),C=require('../core.js');
function flat(){const s=C.generate('garden-regressions','woodland','journey');s.entities=[];s.nextId=1;s.heights.fill(.6);s.soil.fill(.6);s.water=s.baseWater=-.6;s.wildGrowth=false;return s;}
// An empty, paused garden with no mature plants can always resume building.
const empty=flat();empty.seeds=0;empty.paused=true;const original=JSON.stringify(empty);assert(C.refillSeeds(empty).ok);assert.equal(empty.seeds,12);const expected=JSON.parse(original);expected.seeds=12;assert.deepEqual(empty,expected,'a refill changes only the seed balance');assert(!C.refillSeeds(empty).ok,'repeat taps cannot stack packets');
for(const type of C.PLANTS){const s=JSON.parse(original);C.refillSeeds(s);assert(C.place(s,type,0,0).ok,'starter seeds cover '+type);}
for(const [balance,allowed]of [[0,true],[8,true],[9,false],[12,false],[9999,false]]){const s=flat();s.seeds=balance;assert.equal(C.refillSeeds(s).ok,allowed);assert.equal(s.seeds,allowed?12:balance);}
const free=flat();free.mode='sandbox';free.seeds=0;assert(!C.refillSeeds(free).ok);assert(C.place(free,'tree',0,0).ok);assert.equal(free.seeds,0);
// Planning uses clear dry roots and never changes existing specimens or IDs.
for(const vesselShape of Object.keys(C.VESSEL_SHAPES))for(const vesselSize of Object.keys(C.VESSEL_SIZES)){
 const s=flat();Object.assign(s,{vesselShape,vesselSize});C.place(s,'rock',0,0);const before=JSON.stringify(s),sites=C.fernSites(s);assert.equal(JSON.stringify(s),before);assert.deepEqual(C.fernSites(s),sites);assert.equal(sites.length,3,'every vessel has room in an empty garden');
 for(const site of sites){const r=C.place(s,'fern',site.x,site.z,{rotation:site.rotation,size:.85});assert(r.ok);assert.equal(r.entity.id,site.id);assert.equal(r.entity.variant,site.variant);assert(!C.localConditions(site.x,site.z,s).submerged);}
 assert.equal(s.entities[0].type,'rock');C.validate(JSON.parse(JSON.stringify(s)));
}
const flooded=flat();flooded.water=1.1;assert.equal(C.fernSites(flooded).length,0);assert.equal(C.fernSites(flat(),3,{accept:()=>false}).length,0,'mature renderer clearance can veto every site');
const full=flat();full.entities=Array.from({length:C.MAX_ENTITIES},(_,i)=>({...C.previewEntity(full,'rock',0,0),id:i+1}));full.nextId=C.MAX_ENTITIES+1;assert.equal(C.fernSites(full).length,0);
for(const biome of ['woodland','tropical'])for(const seed of ['240816','ferns','moist-soil']){const s=C.generate(seed,biome);assert(s.entities.filter(e=>e.type==='fern').length>=10,'new moist gardens have a fuller fern understory');assert.deepEqual(C.generate(seed,biome),s);C.validate(JSON.parse(JSON.stringify(s)));}
console.log('Passed: seed recovery from empty/paused gardens, bounded refills without rewards, unlimited Free build, deterministic additive fern patches, all vessel footprints, dry/solid/full-world checks, and fuller new gardens.');
