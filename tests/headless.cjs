const fs=require('node:fs'),vm=require('node:vm'),B=require('babylonjs'),{Canvas}=require('@napi-rs/canvas'),C=require('../core.js');
global.OffscreenCanvas=Canvas;
class HeadlessEngine extends B.NullEngine{constructor(){super({renderWidth:390,renderHeight:844,textureSize:1024});}setHardwareScalingLevel(){}runRenderLoop(){}resize(){}}
global.window={innerWidth:390,innerHeight:844,devicePixelRatio:1,addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false})};global.document={hidden:false,addEventListener(){},removeEventListener(){},createElement(){return new Canvas(256,256)},body:{classList:{toggle(){},contains(){return true;}}}};global.BABYLON={...B,Engine:HeadlessEngine};global.TerrariumCore=C;
for(const file of['graphics.js','creatures.js','world.js'])vm.runInThisContext(fs.readFileSync(require.resolve('../'+file),'utf8'),{filename:file});
const createWorld=state=>new window.TerrariumWorld({getBoundingClientRect(){return{left:0,top:0,width:390,height:844}}},state);
module.exports={B,C,createWorld};
