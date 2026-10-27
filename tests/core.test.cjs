const assert=require('node:assert/strict');
const APP=require('node:fs').existsSync(require('node:path').join(__dirname,'../dist/core.js'))?'../dist/':'../';
const C=require(APP+'core.js');
const a=C.generate('little-world','woodland'),b=C.generate('little-world','woodland');
assert.deepEqual(a,b,'a seed and biome should reproduce the complete starting world');
assert.notDeepEqual(a.heights,C.generate('different-seed','woodland').heights,'a new seed should change the landscape');
for(const biome of Object.keys(C.BIOMES)){
 const s=C.generate('12345',biome);C.validate(JSON.parse(JSON.stringify(s)));
 assert(s.entities.some(e=>C.ELEMENTS[e.type].category==='plants'));
 assert(s.heights.every(Number.isFinite));
 assert(Math.abs(C.heightAt(0,0,s)-s.heights[0])<1e-8);
}
const before=C.heightAt(0,0,a);C.sculpt(a,0,0,'raise',1,.12);assert(C.heightAt(0,0,a)>before);
const after=C.heightAt(0,0,a);for(let i=0;i<20;i++)C.sculpt(a,0,0,'pond',1);assert(C.heightAt(0,0,a)<after);assert(C.heightAt(0,0,a)<a.water,'a pond brush should carve below the waterline');
const copy=C.validate(JSON.parse(JSON.stringify(a)));assert.deepEqual(copy.heights,a.heights,'terrain edits must survive a save round trip');
const planted={...a.entities.find(e=>C.ELEMENTS[e.type].category==='plants'),id:999,growth:.3};a.entities.push(planted);const time=a.clock;C.advance(a,20);assert(planted.growth>.3);assert(a.clock!==time);
a.paused=true;const paused=JSON.stringify(a);C.advance(a,100);assert.equal(JSON.stringify(a),paused,'pause must stop the ecosystem clock and growth');
assert.throws(()=>C.validate({version:1}));const bad=JSON.parse(JSON.stringify(a));bad.entities[0].x=Infinity;assert.throws(()=>C.validate(bad));
const badScale=JSON.parse(JSON.stringify(a));badScale.entities[0].scale=100000;assert.throws(()=>C.validate(badScale));
console.log('Passed: deterministic worlds, biome generation, sculpting, pond waterline, saved edits, growth, pause, and import validation.');
