const assert=require('node:assert/strict'),{B,C,createWorld}=require('./headless.cjs');
try{
 const s=C.generate('grass-render-save','woodland','sandbox');s.entities=[];s.nextId=1;s.heights.fill(.6);s.soil.fill(.6);s.water=-.6;s.wildGrowth=false;
 for(const [i,variant]of [0,1,2].entries()){const r=C.place(s,'grass',-2+i*2,-1);r.entity.variant=variant;r.entity.growth=.4+i*.2;}
 const loaded=C.validate(JSON.parse(JSON.stringify(s))),saved=JSON.stringify(loaded),world=createWorld(loaded);
 assert.equal(B.Engine.Version,require('../vendor/babylon.js').Engine.Version,'scene tests use the shipped browser engine');assert(JSON.stringify(loaded)===saved,'rendering keeps the validated save unchanged');
 for(const e of loaded.entities){const visual=world.visuals.get(e.id);assert(visual?.root.isEnabled());assert(visual.root.getTotalVertices()>0);assert.equal(visual.entity.variant,e.variant);assert(visual.root.scaling.y>0);}
 const anchors=JSON.stringify(loaded.entities),soil=JSON.stringify(loaded.heights),sites=C.fernSites(loaded,3,{accept:e=>world.canPlacePlant(e).ok});assert.equal(sites.length,3,'real mature geometry accepts an open fern patch');assert.equal(JSON.stringify(loaded.entities),anchors);
 for(const site of sites){const r=C.place(loaded,'fern',site.x,site.z,{size:.85,rotation:site.rotation});assert(r.ok);assert(world.canPlacePlant(r.entity).ok);world.addEntity(r.entity);world.sprout(r.entity.id);assert(world.visuals.get(r.entity.id)?.root.isEnabled());}
 assert.equal(JSON.stringify(loaded.entities.slice(0,3)),anchors);assert.equal(JSON.stringify(loaded.heights),soil);world.setGraphics('performance');world.setGraphics('auto');assert.equal(JSON.stringify(loaded.entities.slice(0,3)),anchors);world.dispose();
 const again=C.validate(JSON.parse(JSON.stringify(loaded))),restored=createWorld(again);for(const e of again.entities)assert(restored.visuals.has(e.id),'every grass and fern returns after reload');restored.dispose();
 console.log('Passed: shipped Babylon runtime, all grass variants visible after reload, mature fern clearance, additive saved patches and resource-safe quality changes.');
}catch(e){console.error(e.name+': '+e.message+'\n'+String(e.stack).slice(-1600));process.exitCode=1;}
