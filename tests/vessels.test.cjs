const assert=require('node:assert/strict');
const {B,C,createWorld}=require('./headless.cjs');
const S=require('../saves.js'),copy=value=>JSON.parse(JSON.stringify(value));

// An update defaults old saves to the existing bowl without moving their data.
const old=C.generate('existing-vessel','woodland','sandbox');
delete old.vesselShape;delete old.vesselSize;delete old.baseStyle;
old.entities.push({id:old.nextId++,type:'bunny',x:-2,z:1,scale:.9,growth:1,health:.8,rotation:.4,variant:1,phase:2,origin:'wild',paid:12,harvest:0});
const raw=JSON.stringify(old),storage=new Map([[S.KEY,raw]]),store={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
const saves=S.create(store,C.validate),loaded=saves.load().state;
assert.equal(storage.get(S.KEY),raw);
assert.deepEqual(loaded.entities,old.entities);assert.deepEqual(loaded.heights,old.heights);assert.deepEqual(loaded.soil,old.soil);
assert.equal(loaded.vesselShape,'bowl');assert.equal(loaded.vesselSize,'standard');assert.equal(loaded.baseStyle,'stone');
const archived=JSON.stringify(loaded.entities.filter(e=>C.ELEMENTS[e.type].creature)),heights=JSON.stringify(loaded.heights),soil=JSON.stringify(loaded.soil),before=copy(loaded);
assert(saves.createSnapshot(loaded).ok);
assert(C.resizeVessel(loaded,{vesselShape:'oval',vesselSize:'roomy',baseStyle:'slate'}));
const oval=C.vesselSpec(loaded);
for(const plant of loaded.entities.filter(e=>!C.ELEMENTS[e.type].creature)){
 const previous=before.entities.find(e=>e.id===plant.id);
 assert(Math.abs(plant.x-previous.x*oval.x)<1e-12);assert(Math.abs(plant.z-previous.z*oval.z)<1e-12);
 assert.deepEqual({...plant,x:previous.x,z:previous.z},previous,'resizing preserves every non-position plant field');
}
assert.equal(JSON.stringify(loaded.entities.filter(e=>C.ELEMENTS[e.type].creature)),archived);
assert.equal(JSON.stringify(loaded.heights),heights);assert.equal(JSON.stringify(loaded.soil),soil);
for(const key of ['seed','seeds','xp','mission','careState','discoveries','nextId','water','baseWater'])assert.deepEqual(loaded[key],before[key]);
assert(saves.save(loaded,{checkpoint:true}).ok);assert.equal(storage.get(S.BACKUP),raw);
assert.deepEqual(C.validate(copy(loaded)),loaded,'new vessel settings round-trip through the existing world format');
for(const field of ['vesselShape','vesselSize','baseStyle']){const bad=copy(loaded);bad[field]='unsupported';assert.throws(()=>C.validate(bad),/unsupported terrarium/);}

const world=createWorld(C.generate('vessel-geometry','woodland','sandbox'));
world.engine.getRenderWidth=()=>window.innerWidth;world.engine.getRenderHeight=()=>window.innerHeight;
world.engine.getDeltaTime=()=>1000/60;
assert(world.contactShadow.material.needAlphaBlending(),'contact shadow must blend its texture alpha');
assert(world.contactShadow.material.diffuseTexture.hasAlpha);
assert.equal(world.contactShadow.material.disableDepthWrite,true);
const context=world.contactShadow.material.diffuseTexture.getContext();
assert.equal(context.getImageData(0,0,1,1).data[3],0,'shadow texture corners must be fully transparent');
assert(context.getImageData(128,128,1,1).data[3]>0);
assert(world.contactShadow.getTotalVertices()>90,'the shadow must be a circular mesh, not the old rectangular plane');
assert(B.Vector3.TransformNormal(B.Vector3.FromArray(world.contactShadow.getVerticesData('normal')),world.contactShadow.computeWorldMatrix(true)).y>.99,'the shadow surface must face the camera above the floor');
const counts=()=>({meshes:world.scene.meshes.length,materials:world.scene.materials.length,textures:world.scene.textures.length,geometries:world.scene.geometries.length});
let warm;
for(let cycle=0;cycle<2;cycle++)for(const shape of Object.keys(C.VESSEL_SHAPES))for(const size of Object.keys(C.VESSEL_SIZES)){
 const state=C.generate('vessel-geometry','woodland','sandbox','self',{vesselShape:shape,vesselSize:size,baseStyle:cycle?'none':'slate'}),spec=C.vesselSpec(state);
 assert.deepEqual(C.generate('vessel-geometry','woodland','sandbox','self',{vesselShape:shape,vesselSize:size,baseStyle:cycle?'none':'slate'}),state);
 state.entities=[];state.heights.fill(.8);state.water=-.6;state.wildGrowth=false;state.motion='reduced';
 assert(C.placement(state,'rock',C.RADIUS*.9*spec.x,0).ok);
 assert(!C.placement(state,'rock',(C.RADIUS+.02)*spec.x,0).ok);
 assert(!C.placement(state,'rock',0,(C.RADIUS+.02)*spec.z).ok);
 assert(C.sculpt(state,2.7*spec.x,-.9*spec.z,'raise',.7,.4));
 let id=1;
 for(const [index,type]of [...C.PLANTS,'rock','log','crystal'].entries()){
  const angle=index/12*Math.PI*2;
  state.entities.push({id:id++,type,x:Math.cos(angle)*4.2*spec.x,z:Math.sin(angle)*4.2*spec.z,scale:1.8,growth:1.18,health:1,rotation:.7,variant:index%3,phase:.9,origin:'player',paid:0,harvest:.2});
 }
 state.nextId=id;C.validate(copy(state));
 const saved=JSON.stringify(state);world.rebuild(state);world.animate();
 assert(!world.canPlacePlant({type:'tree',x:C.RADIUS*.97*spec.x,z:0,scale:1.4,rotation:.4,variant:0}).ok,'new placement must reserve mature canopy space inside the selected glass');
 assert(!world.canPlaceObject({type:'rock',x:C.RADIUS*.99*spec.x,z:0,scale:3,rotation:.4,variant:0}).ok,'new decorations must reserve their complete volume');
 assert(world.canPlaceObject({type:'crystal',x:0,z:0,scale:.6,rotation:0,variant:0}).ok);
 assert.equal(world.vessel.scaling.x,spec.x);assert.equal(world.vessel.scaling.z,spec.z);
 assert.equal(world.water.scaling.x,spec.x);assert.equal(world.water.scaling.y,spec.z);
 assert.equal(world.waterMaterial._vectors2.terrainSpan.x,10.08*spec.x);assert.equal(world.waterMaterial._vectors2.terrainSpan.y,10.08*spec.z);
 assert.equal(world.base.isEnabled(),!cycle);assert.equal(world.baseLip.isEnabled(),!cycle);
 assert.equal(world.floor.position.y,cycle?-1.32:-1.51);
 assert.equal(world.contactShadow.scaling.x,spec.x);assert.equal(world.contactShadow.scaling.y,spec.z);
 for(const visual of world.visuals.values()){
  const mesh=visual.root,vertices=mesh.getVerticesData('position'),matrix=mesh.computeWorldMatrix(true);
  for(let i=0;i<vertices.length;i+=3){
   const p=B.Vector3.TransformCoordinates(new B.Vector3(vertices[i],vertices[i+1],vertices[i+2]),matrix);
   assert(Number.isFinite(p.x+p.y+p.z));
   assert(p.y<=spec.top-.055,'all plant and decoration vertices must stay beneath the selected rim');
   assert(Math.hypot(p.x/spec.x,p.z/spec.z)<=C.vesselRadius(p.y,state)-.02/Math.min(spec.x,spec.z),'every actual vertex must stay inside the selected glass');
  }
 }
 // Picking, local heights and sculpting must all use the same physical ellipse.
 for(const [u,v]of [[0,0],[2.7,-.9],[-3,1.1],[1,-3.2]]){
  const x=u*spec.x,z=v*spec.z,hit=world.scene.pickWithRay(new B.Ray(new B.Vector3(x,10,z),new B.Vector3(0,-1,0),20),mesh=>mesh===world.terrain);
  assert(hit.hit);assert(Math.abs(hit.pickedPoint.y-C.heightAt(x,z,state))<1e-5);
 }
 for(const [width,height]of [[390,844],[320,667],[844,390],[1363,936]]){
  window.innerWidth=width;window.innerHeight=height;world.resize();world.resetCamera();
  const matrix=world.camera.getViewMatrix(true).multiply(world.camera.getProjectionMatrix(true));
  for(const [y,r]of [[-1.5,5.4],...spec.profile])for(let step=0;step<24;step++){
   const angle=step/24*Math.PI*2,point=new B.Vector3(Math.cos(angle)*r*spec.x,y,Math.sin(angle)*r*spec.z),screen=B.Vector3.Project(point,B.Matrix.IdentityReadOnly,matrix,new B.Viewport(0,0,1,1));
   assert(screen.x>=.025&&screen.x<=.975&&screen.y>=.025&&screen.y<=.975,'the selected vessel must fit portrait, landscape and desktop cameras');
  }
 }
 world.setGlassVisible(false);assert(world.glassMeshes.every(mesh=>!mesh.isEnabled()));world.setGlassVisible(true);
 assert.equal(JSON.stringify(state),saved,'vessel rendering must not change terrain, plants or progress');
 if(shape==='oval'&&size==='roomy'){if(cycle)assert.deepEqual(counts(),warm,'switching every vessel repeatedly must not accumulate scene resources');else warm=counts();}
}
world.dispose();
console.log('Passed: legacy and new vessel saves, safe explicit resizing, frozen archived wildlife, transparent circular base shadow, all 12 vessel footprints, real glass clearance, sculpt/picking agreement, camera framing, finish choices, and bounded resources.');
