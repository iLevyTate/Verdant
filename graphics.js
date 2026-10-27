(function(root){
  'use strict';
  const B=BABYLON,cache=new WeakMap;
  const col=s=>B.Color3.FromHexString(s);
  function materials(scene){if(!cache.has(scene))cache.set(scene,new Map);return cache.get(scene);}
  function detailMaterial(scene,name,hex,roughness=.6,alpha=1){
    const key=name+hex+alpha,m=materials(scene);if(m.has(key))return m.get(key);
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
    const phone=window.innerWidth<900,pixelRatio=window.devicePixelRatio||1,cap=quality==='performance'?1:quality==='cinematic'?2:phone?1.55:1.8;engine.setHardwareScalingLevel(1/Math.max(1,Math.min(pixelRatio,cap)));
    if(!s.environmentTexture){const env=B.CubeTexture.CreateFromPrefilteredData('assets/studio.env',s);env.name='bundled studio light';env.rotationY=.8;s.environmentTexture=env;s.environmentIntensity=.65;}
    s.imageProcessingConfiguration.toneMappingEnabled=true;s.imageProcessingConfiguration.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;s.imageProcessingConfiguration.exposure=1.18;s.imageProcessingConfiguration.contrast=1.03;
    const p=new B.DefaultRenderingPipeline('verdant rendering',true,s,[world.camera]);p.fxaaEnabled=true;p.samples=quality==='cinematic'&&engine.webGLVersion>1?4:1;p.bloomEnabled=quality!=='performance';p.bloomThreshold=.94;p.bloomWeight=.10;p.bloomKernel=32;p.bloomScale=.4;p.sharpenEnabled=quality==='cinematic';if(p.sharpenEnabled){p.sharpen.edgeAmount=.12;p.sharpen.colorAmount=1;}world.pipeline=p;
    if(quality==='cinematic'&&engine.webGLVersion>1&&B.SSAO2RenderingPipeline.IsSupported){try{const ao=new B.SSAO2RenderingPipeline('soft habitat occlusion',s,{ssaoRatio:.5,blurRatio:.5},[world.camera]);ao.radius=.45;ao.totalStrength=.60;ao.expensiveBlur=false;ao.samples=8;world.ambientOcclusion=ao;}catch(error){console.info('Ambient occlusion is unavailable; keeping the main renderer.');}}
    world.shadow.getShadowMap().resize(quality==='cinematic'?2048:quality==='performance'?512:1024);world.shadow.blurKernel=quality==='performance'?12:24;engine.resize();
  }
  function glass(scene){const p=new B.PBRMaterial('polished clear glass',scene);p.albedoColor=col('#e3eee4');p.metallic=0;p.roughness=.035;p.alpha=.065;p.indexOfRefraction=1.45;p.backFaceCulling=false;p.disableDepthWrite=true;p.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHABLEND;p.clearCoat.isEnabled=true;p.clearCoat.intensity=1;p.clearCoat.roughness=.025;p.environmentIntensity=.8;return p;}
  root.VerdantGraphics={configure,creatureMaterial,detailMaterial,glass};
})(window);
