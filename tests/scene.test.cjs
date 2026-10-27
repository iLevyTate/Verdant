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
 for(const type of Object.keys(C.ELEMENTS).filter(x=>!C.ELEMENTS[x].tool)){
  const entity={id:state.nextId++,type,x:-2,z:-1,scale:.9,growth:.6,health:.8,rotation:0,variant:1,phase:0};state.entities.push(entity);renderer.addEntity(entity);assert(renderer.visuals.has(entity.id));if(['bee','frog','bunny'].includes(type))assert(renderer.visuals.get(entity.id).custom,'new wildlife must use its detailed model, not the legacy fallback');
 }
 renderer.showPreview({x:2,y:C.heightAt(2,2,state),z:2},'fern',.7,1.2,true);assert(renderer.preview.isVisible);assert.equal(renderer.preview.rotation.y,.7);renderer.showBrush(null);assert(!renderer.preview.isVisible);const plant=state.entities.find(e=>C.ELEMENTS[e.type].category==='plants');plant.growth=1;plant.health=.9;plant.harvest=1;renderer.animate();assert(renderer.readyMarkers.has(plant.id));C.harvest(state,plant.id);renderer.animate();assert(!renderer.readyMarkers.has(plant.id));renderer.focusEntity(plant.id);renderer.animate();assert(renderer.focus.isVisible);renderer.scene.render();C.sculpt(state,0,0,'raise',1);renderer.refreshTerrain();renderer.mist();renderer.animate();state.clock=21;renderer.updateClimate(true);renderer.scene.render();
 for(const mesh of renderer.scene.meshes){const positions=mesh.getVerticesData(B.VertexBuffer.PositionKind);if(positions){assert(positions.length>0,'visible mesh geometry must contain positions');assert([...positions].every(Number.isFinite),'mesh geometry must be finite');const indices=mesh.getIndices();assert(!indices||[...indices].every(i=>i>=0&&i<positions.length/3),'mesh indices must reference existing vertices');const normals=mesh.getVerticesData(B.VertexBuffer.NormalKind);assert(!normals||[...normals].every(Number.isFinite),'mesh normals must be finite');}}
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
 const target=mobile.camera.target.clone();mobile.lookCloser(mobile.state.entities[0].id);assert.equal(mobile.camera.radius,4.8);mobile.resetCamera();assert(B.Vector3.Distance(mobile.camera.target,target)<.001,'reset must return to the fitted phone target');mobile.dispose();
}
console.log('Passed: all three biome scenes, all element models, finite geometry, terrain and lighting, plus fitted glass and close-up/reset cameras on four phone layouts with Babylon NullEngine.');
