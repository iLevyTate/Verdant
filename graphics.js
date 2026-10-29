(function(root){
  'use strict';
  const B=BABYLON,cache=new WeakMap;
  const col=s=>B.Color3.FromHexString(s);
  function materials(scene){if(!cache.has(scene))cache.set(scene,new Map);return cache.get(scene);}
  function detailMaterial(scene,name,hex,roughness=.6,alpha=1){
    const key=name+hex+roughness+alpha,m=materials(scene);if(m.has(key))return m.get(key);
    const p=new B.PBRMaterial(name,scene);p.albedoColor=col(hex);p.metallic=0;p.roughness=roughness;p.alpha=alpha;p.backFaceCulling=false;if(alpha<1){p.disableDepthWrite=true;p.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHABLEND;}m.set(key,p);return p;
  }
  function creatureMaterial(scene,type){
    const m=materials(scene),key='creature '+type;if(m.has(key))return m.get(key);const p=new B.PBRMaterial(key,scene);p.albedoColor=B.Color3.White();p.metallic=0;p.roughness=type==='frog'?.38:.85;p.backFaceCulling=false;p.environmentIntensity=.55;
    if(type==='frog'){p.clearCoat.isEnabled=true;p.clearCoat.intensity=.35;p.clearCoat.roughness=.19;}else{p.sheen.isEnabled=true;p.sheen.intensity=.28;p.sheen.color=col('#dfcfac');p.sheen.roughness=.8;}
    m.set(key,p);return p;
  }
  function configure(world,quality='auto'){
    const engine=world.engine,s=world.scene,headless=engine instanceof B.NullEngine;
    if(world.pipeline){world.pipeline.dispose();world.pipeline=null;}if(world.ambientOcclusion){world.ambientOcclusion.dispose();world.ambientOcclusion=null;}
    world.graphicsMode=quality;world.renderTier=quality==='performance'?'performance':quality==='cinematic'?'cinematic':'balanced';
    if(headless)return;
    const phone=window.innerWidth<900,pixelRatio=window.devicePixelRatio||1,cap=quality==='performance'?1:quality==='cinematic'?2:phone?1.55:1.8;world.baseHardwareScale=1/Math.max(1,Math.min(pixelRatio,cap));world.performanceState=null;engine.setHardwareScalingLevel(world.baseHardwareScale);
    if(!s.environmentTexture){const env=B.CubeTexture.CreateFromPrefilteredData('assets/studio.env',s);env.name='bundled studio light';env.rotationY=.8;s.environmentTexture=env;s.environmentIntensity=.65;}
    s.imageProcessingConfiguration.toneMappingEnabled=true;s.imageProcessingConfiguration.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;s.imageProcessingConfiguration.exposure=1.02;s.imageProcessingConfiguration.contrast=1.12;
    let p;try{p=new B.DefaultRenderingPipeline('verdant rendering',true,s,[world.camera]);p.fxaaEnabled=true;p.samples=quality==='cinematic'&&engine.webGLVersion>1?4:1;p.bloomEnabled=false;p.bloomThreshold=.94;p.bloomWeight=.10;p.bloomKernel=32;p.bloomScale=.4;p.sharpenEnabled=quality==='cinematic';if(p.sharpenEnabled){p.sharpen.edgeAmount=.12;p.sharpen.colorAmount=1;}world.pipeline=p;}catch(error){p?.dispose();world.pipeline=null;console.info('Post-processing is unavailable; keeping the base renderer.');}
    if(quality==='cinematic'&&engine.webGLVersion>1&&B.SSAO2RenderingPipeline.IsSupported){try{const ao=new B.SSAO2RenderingPipeline('soft habitat occlusion',s,{ssaoRatio:.5,blurRatio:.5},[world.camera]);ao.radius=.45;ao.totalStrength=.85;ao.expensiveBlur=false;ao.samples=8;world.ambientOcclusion=ao;}catch(error){console.info('Ambient occlusion is unavailable; keeping the main renderer.');}}
    world.shadow.getShadowMap().resize(quality==='cinematic'?2048:quality==='performance'?512:1024);world.shadow.blurKernel=quality==='performance'?12:24;if(engine.webGLVersion>1){world.shadow.usePercentageCloserFiltering=true;world.shadow.filteringQuality=quality==='cinematic'?B.ShadowGenerator.QUALITY_HIGH:B.ShadowGenerator.QUALITY_MEDIUM;}engine.resize();
  }
  function adapt(world,dt){
    if(world.state.graphics!=='auto'||world.engine instanceof B.NullEngine||!Number.isFinite(dt)||dt<=0||dt>.25||document.hidden)return;
    const p=world.performanceState||(world.performanceState={average:1/60,warmup:0,slow:0,fast:0}),engine=world.engine,base=world.baseHardwareScale||1;
    p.average+=(dt-p.average)*.07;p.warmup+=dt;if(p.warmup<2)return;
    p.slow=p.average>.034?p.slow+dt:0;p.fast=p.average<.020?p.fast+dt:0;
    const current=engine.getHardwareScalingLevel();
    if(p.slow>=3){const next=Math.min(Math.max(base,1.35),current*1.12);if(next>current+.005)engine.setHardwareScalingLevel(next);p.slow=p.fast=0;}
    else if(p.fast>=10){const next=Math.max(base,current/1.08);if(next<current-.005)engine.setHardwareScalingLevel(next);p.slow=p.fast=0;}
  }
  const canvases={};
  function surfaceTexture(scene,mode,normal=false){
    const key=mode+(normal?' normal':' color'),m=materials(scene);if(m.has(key))return m.get(key);
    if(!canvases[key]){const size=512,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d'),data=ctx.createImageData(size,size),height=(x,y)=>{const u=x/size,v=y/size,n=(Math.sin(x*91.7+y*37.3)*43758.54)%1,vein=mode==='leaf'?Math.exp(-Math.abs(u-.5)*280)*.13+Math.exp(-Math.abs(((v*10+Math.abs(u-.5)*4)%1)-.5)*80)*.035:mode==='wood'?.10*Math.sin(Math.hypot(u-.5,v-.5)*210+Math.sin(u*30)*.6):0;return .55+vein+n*.035;};
      for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,h=height(x,y);if(normal){let dx=(height(x+1,y)-height(x-1,y))*3,dy=(height(x,y+1)-height(x,y-1))*3,d=Math.hypot(dx,dy,1);data.data[i]=128-dx/d*127;data.data[i+1]=128-dy/d*127;data.data[i+2]=128+127/d;}else{const q=185+h*55;data.data[i]=q;data.data[i+1]=q+(mode==='leaf'?4:0);data.data[i+2]=q-6;}data.data[i+3]=255;}ctx.putImageData(data,0,0);canvases[key]=canvas;
    }
    const texture=new B.DynamicTexture(key,canvases[key],scene,true);texture.gammaSpace=!normal;texture.update(false);m.set(key,texture);return texture;
  }
  function scannedTexture(scene,asset,kind,scale=1){
    const key=asset+kind+scale,m=materials(scene);if(m.has(key))return m.get(key);const file='assets/textures/'+asset+'_'+kind+'.jpg';let texture;
    if(scene.getEngine() instanceof B.NullEngine){texture=B.RawTexture.CreateRGBATexture(new Uint8Array([128,128,255,255]),1,1,scene);texture.metadata={offlineSource:file};}
    else texture=new B.Texture(file,scene,false,false,B.Texture.TRILINEAR_SAMPLINGMODE);
    texture.name=file;texture.gammaSpace=kind==='diff';texture.uScale=texture.vScale=scale;texture.anisotropicFilteringLevel=8;m.set(key,texture);return texture;
  }
  function scannedMaterial(scene,name,asset,scale=1){
    const m=materials(scene);if(m.has(name))return m.get(name);const p=new B.PBRMaterial(name,scene);p.albedoColor=B.Color3.White();p.metallic=0;p.roughness=.92;p.albedoTexture=scannedTexture(scene,asset,'diff',scale);p.bumpTexture=scannedTexture(scene,asset,'nor_gl',scale);p.bumpTexture.level=.65;p.metallicTexture=scannedTexture(scene,asset,'arm',scale);p.useRoughnessFromMetallicTextureAlpha=false;p.useRoughnessFromMetallicTextureGreen=true;p.useMetallnessFromMetallicTextureBlue=true;p.useAmbientOcclusionFromMetallicTextureRed=true;p.environmentIntensity=.55;p.metadata={retained:true};m.set(name,p);return p;
  }
  function botanicalMaterial(scene,type){
    const m=materials(scene),key='botanical material '+type;if(m.has(key))return m.get(key);const leaf=new B.PBRMaterial(type+' botanical surface',scene);leaf.albedoColor=B.Color3.White();leaf.metallic=0;leaf.roughness=type==='moss'?.86:type==='succulent'?.39:.58;leaf.backFaceCulling=false;leaf.twoSidedLighting=true;leaf.environmentIntensity=.65;
    const woody=['tree','log'].includes(type),green=!['rock','crystal','log','mushroom'].includes(type),mode=['cactus','succulent','moss'].includes(type)?'skin':'leaf';
    if(green){leaf.albedoTexture=surfaceTexture(scene,mode);leaf.bumpTexture=surfaceTexture(scene,mode,true);leaf.bumpTexture.level=.22;leaf.subSurface.isTranslucencyEnabled=mode==='leaf';leaf.subSurface.translucencyIntensity=type==='moss'?.12:.28;leaf.subSurface.useAlbedoToTintTranslucency=true;leaf.subSurface.minimumThickness=.01;leaf.subSurface.maximumThickness=.04;}
    if(type==='succulent'||type==='cactus'){leaf.clearCoat.isEnabled=true;leaf.clearCoat.intensity=.16;leaf.clearCoat.roughness=.25;}
    const structure=woody?scannedMaterial(scene,'weathered bark','bark_brown_01',1):detailMaterial(scene,type+' stem','#ffffff',.76),detail=detailMaterial(scene,type+' details','#ffffff',type==='flower'?.62:.78);
    if(type==='flower'){detail.subSurface.isTranslucencyEnabled=true;detail.subSurface.translucencyIntensity=.22;detail.backFaceCulling=false;detail.twoSidedLighting=true;}
    if(type==='log')detail.albedoTexture=surfaceTexture(scene,'wood');
    const multi=new B.MultiMaterial(key,scene);multi.subMaterials=[type==='rock'?scannedMaterial(scene,'weathered mineral','rock_01',1):leaf,structure,detail];if(type==='crystal'){leaf.roughness=.17;leaf.indexOfRefraction=1.48;leaf.clearCoat.isEnabled=true;leaf.clearCoat.intensity=.8;}m.set(key,multi);return multi;
  }
  function terrainMaterial(scene,biome){const p=scannedMaterial(scene,'living '+biome+' soil',biome==='desert'?'sand_01':'forest_ground_04',4);p.albedoColor=col(biome==='desert'?'#f0e5cf':biome==='tropical'?'#b1b4a1':'#c4c2ac');p.roughness=biome==='tropical'?.76:.96;return p;}
  function glass(scene){const p=new B.PBRMaterial('polished clear glass',scene);p.albedoColor=col('#e3eee4');p.metallic=0;p.roughness=.035;p.alpha=.065;p.indexOfRefraction=1.45;p.backFaceCulling=false;p.disableDepthWrite=true;p.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHABLEND;p.clearCoat.isEnabled=true;p.clearCoat.intensity=1;p.clearCoat.roughness=.025;p.environmentIntensity=.8;return p;}
  root.VerdantGraphics={configure,creatureMaterial,detailMaterial,glass,adapt,botanicalMaterial,terrainMaterial,scannedMaterial};
})(window);
