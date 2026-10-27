const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const APP=fs.existsSync(path.join(__dirname,'../dist/core.js'))?'../dist/':'../',C=require(APP+'core.js');
function flat(){const s=C.generate('every-element','woodland','sandbox');s.entities=[];s.nextId=1;s.heights.fill(1);s.soil.fill(.6);s.water=s.baseWater=-.6;s.wildGrowth=false;return s;}
const tested=[];
for(const [type,def]of Object.entries(C.ELEMENTS)){
 if(def.tool)continue;
 const s=flat(),placed=C.place(s,type,-1,-1,{rotation:.7,size:1.2});assert(placed.ok,type+' must be placeable');const e=placed.entity,id=e.id,scale=e.scale;assert.equal(e.rotation,.7);assert(C.relocate(s,id,1,1).ok,type+' must move');
 for(const variant of[0,1,2]){e.variant=variant;const loaded=C.validate(JSON.parse(JSON.stringify(s))),copy=loaded.entities.find(e=>e.id===id);assert.equal(copy.type,type);assert.equal(copy.scale,scale);assert.equal(copy.rotation,.7);assert.equal(copy.x,1);assert.equal(copy.z,1);assert.equal(copy.variant,variant);}
 if(def.category==='plants'){const growth=e.growth;C.advance(s,20);assert(e.growth>growth,type+' must grow');e.growth=1;e.harvest=1;assert.equal(C.harvest(s,id).count,1,type+' must harvest');assert.equal(C.harvest(s,id).count,0,type+' cannot pay twice');}
 else assert.equal(C.harvest(s,id).count,0,type+' must not be harvestable');
 assert(!C.place(s,type,Infinity,0).ok);assert(!C.place(s,type,6,0).ok);C.remove(s,id);assert(!s.entities.some(e=>e.id===id),type+' must remove');tested.push(type);
}
for(const tool of['raise','lower','smooth','pond']){const s=flat();if(tool==='smooth')s.heights[0]=2;const before=C.heightAt(0,0,s);for(let i=0;i<16;i++)C.sculpt(s,0,0,tool,1);const after=C.heightAt(0,0,s);if(tool==='raise')assert(after>before);if(tool==='lower')assert(after<before);if(tool==='pond')assert(after<s.water);if(tool==='smooth'){assert(after<before,'smoothing must soften the peak rather than raise everything toward it');assert(s.heights.slice(1,97).some(h=>h>1),'smoothing distributes the peak into its neighbors');}assert(s.heights.every(h=>Number.isFinite(h)&&h>=.1&&h<=3.2));C.validate(JSON.parse(JSON.stringify(s)));}
const untouched=flat(),terrain=untouched.heights.slice();for(const args of[[NaN,0,'raise',1],[0,0,'lower',0],[0,0,'unknown',1],[0,0,'raise',1,Infinity]])assert(!C.sculpt(untouched,...args));assert.deepEqual(untouched.heights,terrain,'invalid brush input must not corrupt terrain');
for(const [key,value]of[['water',Infinity],['water',999],['nextId',Number.MAX_SAFE_INTEGER],['day',.5]]){const bad=flat();bad[key]=value;assert.throws(()=>C.validate(bad),'invalid '+key+' must be rejected rather than poison a saved world');}
const maximum=flat();while(maximum.entities.length<C.MAX_ENTITIES)assert(C.place(maximum,'butterfly',0,0).ok);assert(!C.place(maximum,'butterfly',0,0).ok,'the scene cap must be enforced');assert(C.relocate(maximum,maximum.entities[0].id,1,1).ok,'full worlds must still allow moving existing elements');
console.log('Passed: all '+tested.length+' placeable elements, three saved variants each, growth/harvest rules, rotation/size, relocation/removal, all terrain tools, invalid placement, and full-world behavior.');
