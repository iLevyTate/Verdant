// CPU-only diagnostic. NullEngine cannot measure phone GPU, touch, heat or battery.
const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks'),{B,C,createWorld}=require('../tests/headless.cjs');
const percentile=(values,p)=>{const a=values.slice().sort((a,b)=>a-b);return Math.round(a[Math.min(a.length-1,Math.floor(a.length*p))]*100)/100;},results=[];
for(const count of[50,120,220])for(const speed of count===220?[1,20]:[1]){
 const s=C.generate('density-benchmark','woodland','sandbox');s.heights.fill(.6);s.soil.fill(.6);s.water=-.6;s.weather='clear';s.wildGrowth=false;s.speed=speed;s.motion='full';s.entities=[];
 for(let i=0;i<count;i++){const angle=i*2.3999632297,r=Math.sqrt((i+.5)/count)*4.15,type=C.PLANTS[i%C.PLANTS.length];s.entities.push({id:i+1,type,x:Math.cos(angle)*r,z:Math.sin(angle)*r,rotation:angle,scale:.55,growth:1,health:1,phase:i*.7,variant:i%3,origin:'wild',paid:0,harvest:0});}s.nextId=count+1;
 const fixtureIndex=process.argv.indexOf('--fixtures');if(fixtureIndex>=0&&speed===1){const folder=path.resolve(process.argv[fixtureIndex+1]||'test-artifacts');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'verdant-density-'+count+'.json'),JSON.stringify(s,null,2));}
 const world=createWorld(s),animation=[],render=[],simulation=[];world.engine.getDeltaTime=()=>1000/60;
 for(let frame=0;frame<50;frame++){world.time+=1/60;if(frame%6===0){const t=performance.now();C.advance(s,.1);if(frame>=10)simulation.push(performance.now()-t);}let t=performance.now();world.animate();if(frame>=10)animation.push(performance.now()-t);t=performance.now();world.scene.render();if(frame>=10)render.push(performance.now()-t);}
 results.push({elements:count,speed,animals:world.animals.length,meshes:world.scene.meshes.length,animationMs:{median:percentile(animation,.5),p95:percentile(animation,.95)},simulationTickMs:{median:percentile(simulation,.5),p95:percentile(simulation,.95)},nullRenderMs:{median:percentile(render,.5),p95:percentile(render,.95)}});world.dispose();
}
console.log('BENCHMARK_JSON '+JSON.stringify({engine:B.Engine.Version,node:process.version,kind:'Babylon NullEngine CPU only; not a phone or GPU benchmark',results}));
