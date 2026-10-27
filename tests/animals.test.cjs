const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const APP=fs.existsSync(path.join(__dirname,'../dist/core.js'))?'../dist/':'../',C=require(APP+'core.js');
const flying=new Set(['bee','butterfly','firefly']);
function vector(x=0,y=0,z=0){return{x,y,z,set(x,y,z){Object.assign(this,{x,y,z});},setAll(n){this.set(n,n,n);}};}
function part(){return{position:vector(),rotation:vector(),scaling:vector(1,1,1)};}
function signedDistance(x,y,z,o){const ds=[Math.max(o.minX-x,x-o.maxX),Math.max(o.minY-y,y-o.maxY),Math.max(o.minZ-z,z-o.maxZ)];return ds.some(d=>d>0)?Math.hypot(...ds.map(d=>Math.max(d,0))):Math.max(...ds);}
function scenario(type,animalObstacle=false){
 const s=C.generate('all-animal-clearance');s.entities=[];s.water=.4;s.speed=1;s.paused=false;const e={id:1,type,x:-1.5,z:0,scale:.9,phase:.7,rotation:0};
 const box=animalObstacle?{minX:-.2574,maxX:.2574,minZ:-.2574,maxZ:.2574,minY:1,maxY:1+.82*.495}:{minX:-.25,maxX:.25,minZ:-.65,maxZ:.65,minY:1,maxY:2.3};
 const barrier=animalObstacle?{id:100,type:'bunny',x:0,z:0,scale:.9,growth:1}:{id:100,type:'fern',x:0,z:0,scale:1,growth:1};s.entities.push(e,barrier);
 const foodType=type==='bunny'?'clover':type==='frog'?'moss':type==='snail'?'log':'flower';s.entities.push({id:101,type:foodType,x:1.7,z:0,scale:.3,growth:1});
 const world={night:0,visuals:new Map()},barrierRoot={position:vector(0,1,0),computeWorldMatrix(){},getBoundingInfo(){return{boundingBox:{minimumWorld:{x:box.minX,y:box.minY,z:box.minZ},maximumWorld:{x:box.maxX,y:box.maxY,z:box.maxZ}}};}};world.visuals.set(100,{root:barrierRoot});
 const core={...C,heightAt(){return 1;}},sandbox={BABYLON:{},TerrariumCore:core,window:{},Math};vm.runInNewContext(fs.readFileSync(require.resolve(APP+'creatures.js'),'utf8'),sandbox);
 const v={entity:e,root:part(),parts:{head:part(),body:part(),ears:[part(),part()],feet:[part(),part(),part(),part()],wings:[part(),part()]},x:e.x,z:e.z,y:flying.has(type)?1.8:1.007,time:e.phase};v.parts.head.position.y=.49;v.root.position.set(v.x,v.y,v.z);world.visuals.set(1,v);
 const inside=sandbox.window.VerdantCreatures.canPlace({...e,x:0,z:0},s,world);if(!flying.has(type))assert(!inside.ok,type+' cannot be placed through the obstacle');else if(inside.ok)assert(inside.y>=box.maxY+.1,type+' spawns above the obstacle rather than inside it');assert(!sandbox.window.VerdantCreatures.canPlace({...e,x:4.8,z:0},s,world).ok,type+' placement must leave room at the glass');
 const baseScale=.9*(type==='bunny'?.55:type==='snail'?.95:['butterfly','ladybug','firefly'].includes(type)?1.15:1),radius={bunny:.52,frog:.47,snail:.38,ladybug:.25,bee:.46,butterfly:.38,firefly:.12}[type]*baseScale;
 let moved=0,highest=0;
 for(let i=0;i<3600;i++){
  const before={x:v.x,y:v.root.position.y,z:v.z};sandbox.window.VerdantCreatures.animate(v,1/60,s,world);moved+=Math.hypot(v.x-before.x,v.z-before.z);highest=Math.max(highest,v.root.position.y-1);
  assert([v.x,v.root.position.y,v.z,v.root.rotation.x,v.root.rotation.y,v.root.scaling.y].every(Number.isFinite),type+' must stay finite');
  assert(Math.hypot(v.x,v.z)+radius<4.71,type+' stays inside the glass');
  if(flying.has(type)){assert(signedDistance(v.x,v.root.position.y,v.z,box)>=radius-1e-6,type+' avoids 3D obstacle volume');assert(v.root.position.y>1+radius,type+' stays above terrain');assert(v.root.position.y+radius<3.91,type+' stays below the rim');}
  else{const dx=Math.max(box.minX-v.x,v.x-box.maxX,0),dz=Math.max(box.minZ-v.z,v.z-box.maxZ,0);assert(Math.hypot(dx,dz)>=radius-1e-6,type+' avoids obstacle footprint');}
  assert(Math.hypot(v.x-before.x,v.root.position.y-before.y,v.z-before.z)<.08,type+' must not teleport');
 }
 assert(moved>.1,type+' should move, not remain frozen to avoid collisions');if(type==='frog')assert(highest<.3,'frogs must not climb or perch on trees');
 const before=JSON.stringify(v);s.paused=true;sandbox.window.VerdantCreatures.animate(v,.03,s,world);assert.equal(JSON.stringify(v),before,type+' freezes when paused');s.paused=false;s.careMode='pet';s.careState.alive=false;sandbox.window.VerdantCreatures.animate(v,.03,s,world);assert.equal(JSON.stringify(v),before,type+' freezes in a lost pet world');
 s.careMode='self';s.speed=20;for(let i=0;i<120;i++)sandbox.window.VerdantCreatures.animate(v,1/30,s,world);assert(Number.isFinite(v.root.position.y));
 e.x=-2;e.z=1;sandbox.window.VerdantCreatures.reset(v,s);assert.equal(v.x,-2);assert.equal(v.z,1);assert(!v.flight&&!v.motion&&!v.bunny,'moving '+type+' resets all paths');
}
for(const type of C.CREATURES){scenario(type);scenario(type,true);}
const wet=C.generate('frog-shore');wet.entities=[{id:1,type:'frog',x:0,z:0,scale:.9}];wet.heights.fill(wet.water+.16);const target=C.habitatTarget(wet.entities[0],wet);assert.equal(target.type,'shore');assert(!C.ELEMENTS.frog.description.includes('branches'));assert.equal(C.validate(JSON.parse(JSON.stringify(C.generate()))).entities.find(e=>e.type==='frog').type,'frog','saved frogs remain compatible');
console.log('Passed: all seven animals avoid plants and other animals, ground routes and 3D flight corridors, species movement, grounded frogs, pause, pet loss, 20x stability, relocation, and saved frog compatibility.');
