const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {B,C,createWorld}=require('./headless.cjs');
const state=C.generate('graphics-guru','woodland','sandbox'),world=createWorld(state),G=window.VerdantGraphics;
// The optimization must preserve the previous production texture pixels.
const textures=[
 ['fern','albedoTexture',0,'6a3cb741abff9d1568df04dc0e70ab20daaa1e3b4ef46d84d8d2033c27e2a6ec'],
 ['fern','bumpTexture',0,'08f4800578022206ad929b8888cbd841fa5453e007b93eb8f9697f2e7d126804'],
 ['moss','albedoTexture',0,'94d88927eacebbc8f48e629db61ce5eca8a00945eae037a4aba78eb8e3d83909'],
 ['moss','bumpTexture',0,'62d800dadf53f832a2e4fb29b6e336d7d532ed9a8f0cdf9fa7c0a7c0469ba8d3'],
 ['log','albedoTexture',2,'0475d40dd1a5d8599715e41c7e375979089dd17ffa52f5e820baaf69cce5765b']
];
for(const [type,property,part,digest]of textures){const texture=G.botanicalMaterial(world.scene,type).subMaterials[part][property],data=texture.getContext().getImageData(0,0,512,512).data;assert.equal(crypto.createHash('sha256').update(data).digest('hex'),digest,type+' '+property+' must keep its original pixels');}
assert.equal(world.scene.skipPointerDownPicking,true);assert.equal(world.scene.skipPointerUpPicking,true);assert.equal(world.scene.skipPointerMovePicking,true);
const hit=world.scene.pickWithRay(new B.Ray(new B.Vector3(0,10,0),new B.Vector3(0,-1,0),20),mesh=>mesh===world.terrain);
assert(hit.hit,'explicit editing rays must work with automatic picking disabled');
assert(Math.abs(hit.pickedPoint.y-C.heightAt(0,0,state))<1e-6);
assert.equal(world.floating.length,0,'disabled pollen must not allocate instances');
assert.equal(world.scene.effectLayers.length,0,'a disabled glow pass must not allocate render targets');
assert(world.rain.every(drop=>drop instanceof B.InstancedMesh&&drop.sourceMesh===world.rainSource),'rain must share one source mesh');
const bounds=world.navigationBounds,original=JSON.stringify(state);world.engine.getDeltaTime=()=>1000/60;
for(let frame=0;frame<12;frame++){world.time+=1/60;world.animate();}
assert.equal(world.navigationBounds,bounds,'a garden with suspended wildlife must not create navigation maps each frame');
assert.equal(JSON.stringify(state),original,'render optimizations must leave saved data intact');

// Moisture must update color without rebuilding geometry or pond bed textures.
let geometryUpdates=0;const fullRefresh=world.refreshTerrain.bind(world);world.refreshTerrain=()=>{geometryUpdates++;return fullRefresh();};const skirt=world.skirt,tones=world.terrainTones,beforeColor=[...world.terrain.getVerticesData('color')];
C.care(state,'mist');const misted=JSON.stringify(state);world.time+=1;world.animate();assert.equal(geometryUpdates,0);assert.equal(world.skirt,skirt);assert.equal(world.terrainTones,tones);assert(world.terrain.getVerticesData('color').some((x,i)=>Math.abs(x-beforeColor[i])>1e-5));assert.equal(JSON.stringify(state),misted);
C.sculpt(state,0,0,'raise',.8);world.time+=.1;world.animate();assert.equal(geometryUpdates,1,'sculpting still rebuilds the exact terrain once');assert.notEqual(world.terrainTones,tones);world.time+=1;world.animate();assert.equal(geometryUpdates,1,'the same edit must not rebuild geometry twice');

// DOM rectangles stand in for actual layout: the camera must respect measured
// panels and safe areas rather than relying on a fixed tray-height guess.
const layoutSave=JSON.stringify(state),rectangles=new Map;let hidden=false;
document.querySelector=selector=>rectangles.has(selector)?{hidden:false,getBoundingClientRect:()=>rectangles.get(selector)}:null;
window.getComputedStyle=()=>({display:'block'});
document.body.classList.contains=name=>name==='ui-hidden'?hidden:name==='tray-collapsed';
world.engine.getRenderWidth=()=>window.innerWidth;world.engine.getRenderHeight=()=>window.innerHeight;
function rect(name,left,top,width,height){rectangles.set(name,{left,top,right:left+width,bottom:top+height,width,height});}
function framed(){const matrix=world.camera.getViewMatrix(true).multiply(world.camera.getProjectionMatrix(true));for(const [y,r]of [[-1.5,5.4],[.7,5.5],[4.2,5]])for(let k=0;k<24;k++){const p=B.Vector3.Project(new B.Vector3(Math.cos(k/24*Math.PI*2)*r,y,Math.sin(k/24*Math.PI*2)*r),B.Matrix.IdentityReadOnly,matrix,new B.Viewport(0,0,1,1));assert(p.x>=.03&&p.x<=.97&&p.y>=.03&&p.y<=.97,'the whole terrarium must fit the measured free rectangle');}}
window.innerWidth=390;window.innerHeight=844;
rect('.safe-viewport',0,44,390,766);rect('.topbar',0,44,390,62);rect('.world-heading',14,112,362,78);rect('.kit',12,618,366,112);rect('.scene-actions',14,562,362,44);rect('.bottom-bar',14,744,362,56);
assert.deepEqual(world.viewBounds(),{left:0,top:202,width:390,height:348});world.resize();world.resetCamera();framed();
rectangles.clear();window.innerWidth=844;window.innerHeight=390;
rect('.safe-viewport',44,0,800,369);rect('.topbar',44,0,800,62);rect('.world-heading',150,67,420,58);rect('.kit',590,140,242,112);rect('.scene-actions',44,108,94,144);rect('.bottom-bar',44,307,526,54);
assert.deepEqual(world.viewBounds(),{left:150,top:137,width:428,height:158});world.resize();world.resetCamera();framed();
hidden=true;assert.deepEqual(world.viewBounds(),{left:44,top:0,width:800,height:369});world.resize();world.resetCamera();framed();
hidden=false;rectangles.clear();window.innerWidth=1363;window.innerHeight=936;
rect('.safe-viewport',0,0,1363,936);rect('.topbar',0,0,1363,90);rect('.world-heading',520,122,323,100);rect('.kit',30,121,250,600);rect('.vitals',1105,121,228,500);rect('.scene-actions',995,650,338,44);rect('.journal',1105,700,228,150);rect('.bottom-bar',30,863,1303,45);
assert.deepEqual(world.viewBounds(),{left:298,top:234,width:679,height:617});world.resize();world.resetCamera();framed();assert.equal(JSON.stringify(state),layoutSave);
world.dispose();
console.log('Passed: identical procedural texture pixels, explicit picking, shared rain geometry, no dormant effect/navigation work, measured safe-area/UI framing, full photo viewport, and save preservation.');
