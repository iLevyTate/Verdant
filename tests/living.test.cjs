const assert=require('node:assert/strict'),{B,C,createWorld}=require('./headless.cjs');
// Care feedback is render-only: it reads soil, health and care state, and
// never writes them back into the saved garden.
try{
const s=C.generate('living-response','woodland','sandbox');s.wildGrowth=false;
const world=createWorld(s),step=(frames,dt=.05)=>{for(let i=0;i<frames;i++){world.frameDelta=dt;world.time+=dt;world.animate();}};
const plants=type=>[...world.visuals.values()].filter(v=>v.entity.type===type),fern=plants('fern')[0],flower=plants('flower')[0];
assert(fern&&flower,'the woodland fixture must contain ferns and flowers');
const water=value=>{s.soil=s.soil.map(()=>value);s.moisture=value;};

// Moist soil keeps every plant upright.
water(.85);step(8);for(const v of world.visuals.values())if(C.ELEMENTS[v.entity.type].category==='plants')assert.equal(v.droop||0,0,v.entity.type+' must stand upright in moist soil');
const saved=JSON.stringify(s.entities);

// Dry soil wilts moisture-loving plants gradually, through the instance data.
water(.2);step(1);assert.equal(fern.droopTarget,1,'a fern in dry soil is fully wilted');assert(fern.droop>0&&fern.droop<.2,'wilting starts slowly');
step(200);assert(fern.droop>.95,'wilting completes');const shown=fern.root.instancedBuffers?.verdantState?.w??fern.root.metadata.verdantState[3];assert(Math.abs(shown-fern.droop)<1e-6,'the shader receives the wilt amount');

// Watering restores turgor faster than drought removed it.
water(.85);step(10);assert(fern.droop<.45,'leaves recover within seconds of water');step(80);assert.equal(fern.droop,0);
assert.equal(JSON.stringify(s.entities),saved,'care feedback must not change saved plants');

// Misting beads the glass, venting clears it, and hidden glass hides it.
water(.5);step(40);const calm=world.condensationLevel;world.mist();step(40);assert(world.condensationLevel>calm+.3&&world.condensation.isVisible,'misting fogs the glass');
const misted=world.condensationLevel;world.vent();assert.equal(world.gust,1);step(1);const windy=world.scene.metadata.verdantMotion.wind;step(40);assert(world.condensationLevel<misted*.25,'venting clears condensation');assert(world.scene.metadata.verdantMotion.wind<windy,'the vent gust settles');
s.glassVisible=false;world.mist();step(20);assert(!world.condensation.isVisible,'no condensation without glass');s.glassVisible=true;

// A touch bends foliage on a damped spring that settles back to rest.
world.nudge(fern.entity.id);step(6,.016);assert(world.scene.metadata.verdantTouch.strength>.05,'a tap bends the plant');step(400,.016);assert(Math.abs(world.scene.metadata.verdantTouch.strength)<1e-3,'the plant settles');
world.brushFoliage({x:fern.entity.x,z:fern.entity.z});step(60,.016);assert(world.scene.metadata.verdantTouch.strength>.4,'brushing holds foliage aside');world.brushFoliage(null);step(400,.016);assert(Math.abs(world.scene.metadata.verdantTouch.strength)<1e-3);

// Reduced motion shows the plant's state without animating it.
s.motion='reduced';world.nudge(fern.entity.id);step(4,.016);assert.equal(world.scene.metadata.verdantTouch.strength,0,'reduced motion never shakes foliage');
water(.2);step(1);assert.equal(fern.droop,1,'reduced motion shows wilting immediately');s.motion='auto';water(.85);step(80);

// A new planting emerges from the soil and grows to its planted size.
const result=C.place(s,'fern',fern.entity.x+1.1,fern.entity.z,{});assert(result.ok,'the fixture has room for a new fern');world.addEntity(result.entity);world.sprout(result.entity.id);const sprout=world.visuals.get(result.entity.id);assert(sprout.displayGrowth<result.entity.growth*.2,'a seedling starts small');step(60,.05);assert(Math.abs(sprout.displayGrowth-result.entity.growth)<.02&&!sprout.emerging,'and reaches its planted size');

world.dispose();console.log('Passed: moisture-driven wilting and faster recovery, render-only care state, mist condensation and vent clearing, settling touch springs, reduced-motion stillness and seedling emergence.');
}catch(error){console.error(error);process.exit(1);}
