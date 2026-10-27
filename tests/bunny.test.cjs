const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const APP=fs.existsSync(path.join(__dirname,'../dist/core.js'))?'../dist/':'../',C=require(APP+'core.js');
function vector(x=0,y=0,z=0){return{x,y,z,set(x,y,z){Object.assign(this,{x,y,z});},setAll(n){this.set(n,n,n);}};}
function part(){return{position:vector(0,.49,0),rotation:vector(),scaling:vector(1,1,1)};}
function run({pond=false,obstacle=false}={}){
 const state=C.generate('bunny-regression');state.entities=[];state.paused=false;state.speed=1;state.water=.5;
 const bunny={id:1,type:'bunny',x:-1.5,z:0,scale:.9,phase:0,rotation:0};state.entities.push(bunny,{id:2,type:'clover',x:1,z:0,scale:.65,growth:1});
 if(obstacle)state.entities.push({id:3,type:'fern',x:-.3,z:0,scale:.5,growth:1});
 const core={...C,heightAt(x,z){return pond&&x>-.7&&x<-.25&&Math.abs(z)<.55?.1:1;}};
 const sandbox={BABYLON:{},TerrariumCore:core,window:{},Math};vm.runInNewContext(fs.readFileSync(require.resolve(APP+'creatures.js'),'utf8'),sandbox);
 const v={entity:bunny,root:part(),parts:{head:part(),body:part(),ears:[part(),part()],feet:Array.from({length:4},part)},x:bunny.x,z:bunny.z,time:0},world={night:0,visuals:new Map()},modes=new Set(),styles=new Set();let maxHop=0,maxStep=0;
 for(let i=0;i<7200;i++){
  const before={x:v.x,z:v.z};sandbox.window.VerdantCreatures.animate(v,1/60,state,world);modes.add(v.bunny.mode);styles.add(v.bunny.style);maxHop=Math.max(maxHop,v.root.position.y-core.heightAt(v.x,v.z));maxStep=Math.max(maxStep,Math.hypot(v.x-before.x,v.z-before.z));
  assert(Math.hypot(v.x,v.z)<4.5,'keep the whole bunny inside the glass');assert(core.heightAt(v.x,v.z)>state.water,'never enter a pond');
  if(obstacle){const f=state.entities[2],r=.7,pad=.46*.9*.55+.015;const dx=Math.max(f.x-r-v.x,v.x-f.x-r),dz=Math.max(f.z-r-v.z,v.z-f.z-r);assert(Math.hypot(Math.max(dx,0),Math.max(dz,0))>=pad-1e-6,'avoid the full fern footprint');}
  assert([v.x,v.z,v.root.position.y,...Object.values(v.root.scaling).filter(x=>typeof x==='number')].every(Number.isFinite));
 }
 assert(modes.has('prepare')&&modes.has('hop')&&modes.has('land')&&modes.has('idle'),'use anticipation, hopping, landing, and pauses');assert(maxHop>.04&&maxHop<.14,'keep hops proportional to the micro bunny');assert(maxStep<.06,'avoid sudden position jumps');assert(v.root.scaling.y<.6,'old saved sizes render at the smaller scale');
 const pose=JSON.stringify(v);state.paused=true;for(let i=0;i<60;i++)sandbox.window.VerdantCreatures.animate(v,1/60,state,world);assert.equal(JSON.stringify(v),pose,'pause must freeze all bunny motion');
 state.paused=false;state.careMode='pet';state.careState.alive=false;sandbox.window.VerdantCreatures.animate(v,1/60,state,world);assert.equal(JSON.stringify(v),pose,'lost pet worlds must stop bunny animation');
 return {styles,v,state,sandbox,world};
}
assert(run().styles.has('graze'),'graze beside food without standing inside it');run({pond:true});run({obstacle:true});
const fast=run();fast.state.speed=20;fast.state.careMode='self';for(let i=0;i<600;i++)fast.sandbox.window.VerdantCreatures.animate(fast.v,1/30,fast.state,fast.world);assert(Number.isFinite(fast.v.parts.ears[0].rotation.x),'ear springs remain stable at 20x');
const escape=run();escape.state.careMode='self';escape.state.entities=[escape.v.entity,{id:4,type:'fern',x:escape.v.x,z:escape.v.z,scale:.1,growth:1}];escape.v.bunny.mode='idle';escape.v.bunny.elapsed=0;escape.v.bunny.duration=1;const origin={x:escape.v.x,z:escape.v.z};for(let i=0;i<600;i++)escape.sandbox.window.VerdantCreatures.animate(escape.v,1/60,escape.state,escape.world);assert(Math.hypot(escape.v.x-origin.x,escape.v.z-origin.z)>.40,'escape a newly added plant instead of staying overlapped');
console.log('Passed: smaller saved bunnies, varied hop phases, edge grazing, full-plant clearance, pond avoidance, bounded movement, pause, pet loss, and stable fast-time ear motion.');
