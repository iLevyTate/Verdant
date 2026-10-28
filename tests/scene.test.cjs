const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const B=require('babylonjs');
let Canvas;try{({Canvas}=require('@napi-rs/canvas'));}catch{({Canvas}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas'));}
const APP=require('node:fs').existsSync(require('node:path').join(__dirname,'../dist/core.js'))?'../dist/':'../';
const C=require(APP+'core.js');
global.OffscreenCanvas=Canvas;
class HeadlessEngine extends B.NullEngine{
 constructor(){super({renderWidth:window.innerWidth,renderHeight:window.innerHeight,textureSize:1024,deterministicLockstep:true,lockstepMaxSteps:4});}
 setHardwareScalingLevel(){}
 runRenderLoop(){}
 resize(){}
}
const sandbox={BABYLON:{...B,Engine:HeadlessEngine},TerrariumCore:C,window:{innerWidth:1363,innerHeight:936,devicePixelRatio:1,addEventListener(){},removeEventListener(){}},document:{addEventListener(){},removeEventListener(){},createElement(){return new Canvas(256,256)},body:{classList:{toggle(){}}}},console,Math};
Object.assign(global,sandbox);for(const file of['graphics.js','creatures.js','world.js'])vm.runInThisContext(fs.readFileSync(require.resolve(APP+file),'utf8'),{filename:file});
const renderer=new sandbox.window.TerrariumWorld({getBoundingClientRect(){return{left:0,top:0,width:1363,height:936}}},C.generate());
assert(renderer.scene.meshes.length>150,'the scene should contain terrain, glass, flora, animals and effects');
assert(renderer.terrain.getTotalVertices()===3073,'the editable landscape should have the expected vertex grid');
for(const biome of ['woodland','tropical','desert']){
 const state=C.generate('scene-test',biome);renderer.rebuild(state);renderer.animate();renderer.scene.render();
 for(const e of state.entities)assert(renderer.visuals.has(e.id),'every generated element should have a 3D visual');
 for(const type of Object.keys(C.ELEMENTS).filter(x=>!C.ELEMENTS[x].tool))for(const variant of[0,1,2]){
  const entity={id:state.nextId++,type,x:-2,z:-1,scale:.9,growth:.6,health:.8,rotation:0,variant,phase:0};state.entities.push(entity);renderer.addEntity(entity);assert(renderer.visuals.has(entity.id));if(C.ELEMENTS[type].creature){const animal=renderer.visuals.get(entity.id);for(let frame=0;frame<30;frame++)window.VerdantCreatures.animate(animal,1/60,state,renderer);assert([animal.root.position.x,animal.root.position.y,animal.root.position.z].every(Number.isFinite),'every rendered animal uses the shared navigator');if(type==='frog')assert(animal.root.position.y-C.heightAt(animal.x,animal.z,state)<.3,'rendered frogs never perch');}if(['bee','frog','bunny'].includes(type))assert(renderer.visuals.get(entity.id).custom,'new wildlife must use its detailed model, not the legacy fallback');if(type==='bunny'){const visual=renderer.visuals.get(entity.id);assert(visual.root.scaling.x<entity.scale*.60,'saved bunny scale must use the smaller render multiplier');visual.x=-3;visual.z=-3;visual.bunny={mode:'hop'};entity.x=2.8;entity.z=2;renderer.moveEntity(entity);assert.equal(visual.x,entity.x);assert.equal(visual.z,entity.z);assert.equal(visual.bunny,undefined,'relocation must discard the old movement path');}
 }
 renderer.showPreview({x:2,y:C.heightAt(2,2,state),z:2},'fern',.7,1.2,true);assert(renderer.preview.isVisible);assert.equal(renderer.preview.rotation.y,.7);renderer.showBrush(null);assert(!renderer.preview.isVisible);const plant=state.entities.find(e=>C.ELEMENTS[e.type].category==='plants');plant.growth=1;plant.health=.9;plant.harvest=1;renderer.animate();assert(renderer.readyMarkers.has(plant.id));C.harvest(state,plant.id);renderer.animate();assert(!renderer.readyMarkers.has(plant.id));renderer.focusEntity(plant.id);renderer.animate();assert(renderer.focus.isVisible);renderer.scene.render();C.sculpt(state,0,0,'raise',1);renderer.refreshTerrain();renderer.mist();renderer.animate();state.clock=21;renderer.updateClimate(true);renderer.scene.render();
 for(const mesh of renderer.scene.meshes){const positions=mesh.getVerticesData(B.VertexBuffer.PositionKind);if(positions){assert(positions.length>0,'visible mesh geometry must contain positions');assert([...positions].every(Number.isFinite),'mesh geometry must be finite');const indices=mesh.getIndices();assert(!indices||[...indices].every(i=>i>=0&&i<positions.length/3),'mesh indices must reference existing vertices');const normals=mesh.getVerticesData(B.VertexBuffer.NormalKind);assert(!normals||[...normals].every(Number.isFinite),'mesh normals must be finite');}}
}
const clearState=C.generate('rendered-clearance');clearState.heights.fill(1);clearState.water=.1;clearState.entities=[
 {id:1,type:'bunny',x:-2,z:0,scale:.9,growth:1,health:1,rotation:0,variant:0,phase:0},
 {id:2,type:'fern',x:0,z:0,scale:.6,growth:1,health:1,rotation:.8,variant:1,phase:0},
 {id:3,type:'clover',x:2,z:0,scale:.4,growth:1,health:1,rotation:0,variant:0,phase:0}
];renderer.rebuild(clearState);const small=renderer.visuals.get(1),fern=renderer.visuals.get(2).root;fern.computeWorldMatrix(true);const box=fern.getBoundingInfo().boundingBox,padding=.46*.9*.55+.015;
for(let frame=0;frame<2400;frame++){
 window.VerdantCreatures.animate(small,1/60,clearState,renderer);
 const dx=Math.max(box.minimumWorld.x-small.x,small.x-box.maximumWorld.x,0),dz=Math.max(box.minimumWorld.z-small.z,small.z-box.maximumWorld.z,0);
 assert(Math.hypot(dx,dz)>=padding-1e-6,'bunny motion must clear the actual rotated fern geometry');
}
// Exercise every actual plant vertex against the curved vessel, including old
// large/edge-placed saves, high soil, full growth, rotation and wind sway.
const fitted=C.generate('glass-clearance','woodland','sandbox');fitted.entities=[];fitted.water=-.6;renderer.rebuild(fitted);
function assertContained(visual){
 const mesh=visual.root,matrix=mesh.computeWorldMatrix(true),positions=mesh.getVerticesData(B.VertexBuffer.PositionKind);
 for(let i=0;i<positions.length;i+=3){const p=B.Vector3.TransformCoordinates(new B.Vector3(positions[i],positions[i+1],positions[i+2]),matrix);assert(p.y<=4.016,'foliage must stay below the glass rim');assert(Math.hypot(p.x,p.z)<C.vesselRadius(p.y)-.03,'every transformed plant vertex must clear the curved glass');}
}
for(const type of C.PLANTS)for(const variant of[0,1,2]){
 const e={id:fitted.nextId++,type,x:0,z:0,scale:1,growth:1,health:1,rotation:0,variant,phase:0};fitted.entities.push(e);const visual=renderer.addEntity(e);
 for(const height of[.2,1.4,3.2])for(const radius of[0,4.88,5.12])for(const scale of[.6,1.5,3])for(const growth of[.4,1.3]){
  fitted.heights.fill(height);const angle=height+scale+variant;e.x=Math.cos(angle)*radius;e.z=Math.sin(angle)*radius;e.scale=scale;e.growth=growth;e.rotation=angle*.7;renderer.moveEntity(e);visual.root.rotation.z=type==='tree'?0:.04;
  const original=JSON.stringify(e);renderer.updatePlant(visual,growth);assertContained(visual);assert.equal(JSON.stringify(e),original,'fitting must not change saved coordinates, scale, maturity or identity');
 }
 renderer.removeEntity(e.id);fitted.entities.pop();
}
fitted.heights.fill(.6);
assert(renderer.canPlacePlant({type:'tree',x:0,z:0,scale:.6,rotation:0}).ok,'a small bonsai has room to mature');
assert(!renderer.canPlacePlant({type:'tree',x:4.85,z:0,scale:1.2,rotation:0}).ok,'trunk-only edge placement must be rejected');
assert(!renderer.canPlacePlant({type:'tree',x:0,z:0,scale:3,rotation:0}).ok,'mature crowns must fit below the rim');
const tree={id:fitted.nextId++,type:'tree',x:0,z:0,scale:.8,growth:1,health:1,rotation:0,variant:1,phase:0};fitted.entities.push(tree);const bonsai=renderer.addEntity(tree),source=renderer.template('tree',1),originalTemplate=[...source.getVerticesData(B.VertexBuffer.PositionKind)],natural=[...bonsai.root.getVerticesData(B.VertexBuffer.PositionKind)];
assert(C.trimBonsai(fitted,tree.id).ok);renderer.refreshPlant(tree);const trimmed=bonsai.root.getVerticesData(B.VertexBuffer.PositionKind);assert(Math.max(...trimmed.filter((_,i)=>i%3===1))<Math.max(...natural.filter((_,i)=>i%3===1)),'trimming must actually shorten upper branches');
for(let i=0;i<natural.length;i+=3)if(natural[i+1]<=.55)assert.deepEqual([...trimmed.slice(i,i+3)],natural.slice(i,i+3),'the lower trunk and roots keep their structure');
assert.deepEqual([...source.getVerticesData(B.VertexBuffer.PositionKind)],originalTemplate,'one bonsai trim must not alter other trees or the shared model');assertContained(bonsai);
tree.x=4.7;tree.scale=1.5;tree.pruning=1;renderer.moveEntity(tree);let matrix=bonsai.root.computeWorldMatrix(true),top=-Infinity;for(let i=0;i<natural.length;i+=3)top=Math.max(top,B.Vector3.TransformCoordinates(new B.Vector3(natural[i],natural[i+1],natural[i+2]),matrix).y);const constrainedScale=bonsai.root.scaling.x;C.trimBonsai(fitted,tree.id);renderer.refreshPlant(tree);assert(bonsai.root.scaling.x<=constrainedScale,'a constrained tree must not enlarge its trunk after pruning');matrix=bonsai.root.computeWorldMatrix(true);let trimmedTop=-Infinity;const pruned=bonsai.root.getVerticesData(B.VertexBuffer.PositionKind);for(let i=0;i<pruned.length;i+=3)trimmedTop=Math.max(trimmedTop,B.Vector3.TransformCoordinates(new B.Vector3(pruned[i],pruned[i+1],pruned[i+2]),matrix).y);assert(trimmedTop<top,'trimming must visibly reduce even a glass-constrained crown');assertContained(bonsai);
const beforeHide=JSON.stringify(fitted.entities);renderer.setGlassVisible(false);assert(renderer.glassMeshes.every(m=>!m.isEnabled()),'glass-free view must hide vessel, all rims and every reflection');assert(renderer.terrain.isEnabled());assert(bonsai.root.isEnabled());assert.equal(JSON.stringify(fitted.entities),beforeHide);fitted.glassVisible=false;renderer.rebuild(fitted);assert(renderer.glassMeshes.every(m=>!m.isEnabled()),'rebuild/history must keep the saved glass view');renderer.setGlassVisible(true);assert(renderer.glassMeshes.every(m=>m.isEnabled()));
// New-world habitats must satisfy the SAME exact model checks used for adding
// animals; validation/rebuild of an old save must never regenerate these homes.
for(const biome of Object.keys(C.BIOMES))for(const seed of['240816','habitat-1','habitat-2','habitat-3']){
 const state=C.generate(seed,biome);renderer.rebuild(state);renderer.navigationBounds=new Map();for(const e of state.entities.filter(e=>C.ELEMENTS[e.type].creature))assert(window.VerdantCreatures.canPlace(e,state,renderer).ok,seed+' '+biome+' starter '+e.type+' must have a clear, dry/gentle or free-air habitat');
}
const ground=C.generate('surface-ray-probe');ground.entities=[];renderer.rebuild(ground);
for(const sculpted of[false,true]){if(sculpted){for(let i=0;i<65;i++)C.sculpt(ground,1.05,-.25,'raise',.45,.095);renderer.refreshTerrain();}renderer.terrain.computeWorldMatrix(true);const random=C.rng('ground samples');for(let i=0;i<1000;i++){const angle=random()*Math.PI*2,r=Math.sqrt(random())*4.85,x=Math.cos(angle)*r,z=Math.sin(angle)*r,ray=new B.Ray(new B.Vector3(x,12,z),new B.Vector3(0,-1,0),20);ray.epsilon=1e-8;const hit=ray.intersectsMesh(renderer.terrain,false);assert(hit.hit);assert(Math.abs(hit.pickedPoint.y-C.heightAt(x,z,ground))<2e-6,'footing must match actual rendered triangles, including sculpted slopes: '+JSON.stringify({sculpted,x,z,rendered:hit.pickedPoint.y,sampled:C.heightAt(x,z,ground)}));}}
ground.heights.fill(.6);ground.weather='rain';ground.paused=true;ground.motion='full';renderer.rebuild(ground);
function rainfall(fps){for(const d of renderer.rain){d.isVisible=true;d.position.set(0,3,0);}renderer.engine.getDeltaTime=()=>1000/fps;for(let i=0;i<fps/10;i++)renderer.animate();return 3-renderer.rain[0].position.y;}
assert(Math.abs(rainfall(30)-rainfall(120))<1e-8,'rain must travel the same distance over the same elapsed time on 30/120 Hz devices');
ground.motion='reduced';renderer.animate();assert(renderer.rain.every(d=>!d.isVisible));assert(renderer.floating.every(p=>!p.mesh.isVisible));
ground.entities=[{id:100,type:'bunny',x:0,z:0,scale:.9,growth:1,health:1,rotation:0,variant:0,phase:0}];renderer.rebuild(ground);const resting=renderer.animals[0],position=resting.root.position.clone();renderer.animate();assert.equal(B.Vector3.Distance(position,resting.root.position),0,'calm view freezes cosmetic wildlife movement');assert(!renderer.canPlaceObject({type:'fern',x:0,z:0,scale:.9,rotation:0}).ok,'objects cannot be placed directly over animals');
renderer.showPreview({x:2,y:.6,z:0},'fern',0,1,true);assert(renderer.matureGhost.isVisible);assert(renderer.matureGhost.scaling.x>renderer.preview.scaling.x);ground.maturePreview=false;renderer.showPreview({x:2,y:.6,z:0},'fern',0,1,true);assert(!renderer.matureGhost.isVisible);renderer.showBrush(null);
for(const startsWet of[true,false]){
 const old=C.generate('old-shore-escape');old.motion='full';old.water=.52;old.heights=old.heights.map((_,i)=>{const p=C.vertexPoint(i);return .4+C.clamp((p.x+1.5)*.4,0,.4);});old.entities=[{id:1,type:'bunny',x:startsWet?-2.1:.1,z:0,scale:.9,growth:1,health:1,rotation:0,variant:0,phase:.7},{id:2,type:'clover',x:startsWet?.8:-2,z:0,scale:.25,growth:1,health:1,rotation:0,variant:0,phase:0}];renderer.rebuild(old);renderer.animate();const bunny=renderer.animals[0],anchor=JSON.stringify(old.entities[0]);let travelled=0;
 for(let i=0;i<3600;i++){const x=bunny.x,z=bunny.z;window.VerdantCreatures.animate(bunny,1/60,old,renderer);travelled+=Math.hypot(bunny.x-x,bunny.z-z);if(!startsWet)assert(C.terrainPenalty(bunny.entity,bunny.x,bunny.z,old)<1e-6,'dry animals must not enter wet ground while seeking food');}
 assert(travelled>.1);if(startsWet)assert(C.terrainPenalty(bunny.entity,bunny.x,bunny.z,old)<1e-6,'an old wet placement must be able to escape onto dry ground');assert.equal(JSON.stringify(old.entities[0]),anchor,'escape must preserve saved anchors and identity');
}
renderer.dispose();
for(const [width,height,collapsed]of[[390,844,false],[320,667,true],[430,932,false],[844,390,true]]){
 window.innerWidth=width;window.innerHeight=height;document.body.classList.contains=name=>name==='tray-collapsed'&&collapsed;
 const mobile=new window.TerrariumWorld({getBoundingClientRect(){return{left:0,top:0,width,height}}},C.generate('phone-test'));
 const viewport=mobile.camera.viewport.toGlobal(width,height),matrix=mobile.camera.getViewMatrix(true).multiply(mobile.camera.getProjectionMatrix(true)),points=[];
 for(const [y,r]of[[-1.5,5.4],[.7,5.5],[4.2,5]])for(let i=0;i<24;i++)points.push(B.Vector3.Project(new B.Vector3(Math.cos(i/24*Math.PI*2)*r,y,Math.sin(i/24*Math.PI*2)*r),B.Matrix.IdentityReadOnly,matrix,new B.Viewport(viewport.x,height-viewport.y-viewport.height,viewport.width,viewport.height)));
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 assert(maxX-minX<=viewport.width*.94,'glass must fit the usable phone width');assert(maxY-minY<=viewport.height*.94,'glass must fit the usable phone height');
 assert(Math.abs((minY+maxY)/2-(height-viewport.y-viewport.height/2))<8,'glass must be centered between phone controls');
 const target=mobile.camera.target.clone();for(const entity of mobile.state.entities){mobile.lookCloser(entity.id);const visual=mobile.visuals.get(entity.id),meshes=visual.root.getChildMeshes();if(visual.root.getBoundingInfo)meshes.push(visual.root);for(const mesh of meshes){mesh.computeWorldMatrix(true);const matrix=mobile.camera.getViewMatrix(true).multiply(mobile.camera.getProjectionMatrix(true));for(const p of mesh.getBoundingInfo().boundingBox.vectorsWorld){const screen=B.Vector3.Project(p,B.Matrix.IdentityReadOnly,matrix,new B.Viewport(0,0,1,1));assert(screen.x>=.05&&screen.x<=.95&&screen.y>=.05&&screen.y<=.95,'close-ups must frame the full selected model on every phone layout');}}}mobile.resetCamera();assert(B.Vector3.Distance(mobile.camera.target,target)<.001,'reset must return to the fitted phone target');mobile.dispose();
}
console.log('Passed: all biome scenes and element models, actual vertex glass clearance at varied soil/scale/growth/rotation, safe mature placement, isolated bonsai geometry, complete glass visibility, and phone cameras with Babylon NullEngine.');
