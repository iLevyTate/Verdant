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
    const engine=world.engine,s=world.scene,headless=engine instanceof B.NullEngine;s.metadata??={};s.metadata.verdantSurfaceDetail=quality!=='performance';world.renderDirty=true;
    if(world.pipeline){world.pipeline.dispose();world.pipeline=null;}if(world.ambientOcclusion){world.ambientOcclusion.dispose();world.ambientOcclusion=null;}
    world.setupReflections?.(quality);world.graphicsMode=quality;world.renderTier=quality==='performance'?'performance':quality==='cinematic'?'cinematic':'balanced';
    if(headless)return;if(B.KhronosTextureContainer2&&document.baseURI){const base=new URL('vendor/ktx2/',document.baseURI);Object.assign(B.KhronosTextureContainer2.URLConfig,{jsDecoderModule:new URL('decoder.js',base).href,jsMSCTranscoder:new URL('msc_basis_transcoder.js',base).href,wasmMSCTranscoder:new URL('msc_basis_transcoder.wasm',base).href});}if(!world.sceneInstrumentation&&B.SceneInstrumentation){world.sceneInstrumentation=new B.SceneInstrumentation(s);world.sceneInstrumentation.captureFrameTime=true;world.engineInstrumentation=new B.EngineInstrumentation(engine);world.engineInstrumentation.captureGPUFrameTime=!!engine.getCaps().timerQuery;world.engineInstrumentation.captureShaderCompilationTime=true;}
    const phone=window.innerWidth<900,pixelRatio=window.devicePixelRatio||1,cap=quality==='performance'?1:quality==='cinematic'?2:phone?1.55:1.8;world.baseHardwareScale=1/Math.max(1,Math.min(pixelRatio,cap));world.performanceState=null;engine.setHardwareScalingLevel(world.baseHardwareScale);
    if(!s.environmentTexture){const env=B.CubeTexture.CreateFromPrefilteredData('assets/studio.env',s);env.name='bundled studio light';env.rotationY=.8;s.environmentTexture=env;s.environmentIntensity=.65;}
    s.imageProcessingConfiguration.toneMappingEnabled=true;s.imageProcessingConfiguration.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;s.imageProcessingConfiguration.exposure=1.02;s.imageProcessingConfiguration.contrast=1.12;
    let p;try{p=new B.DefaultRenderingPipeline('verdant rendering',true,s,[world.camera]);p.fxaaEnabled=true;p.samples=quality==='cinematic'&&engine.webGLVersion>1?4:1;p.bloomEnabled=false;p.bloomThreshold=.94;p.bloomWeight=.10;p.bloomKernel=32;p.bloomScale=.4;p.sharpenEnabled=quality==='cinematic';if(p.sharpenEnabled){p.sharpen.edgeAmount=.12;p.sharpen.colorAmount=1;}world.pipeline=p;}catch(error){p?.dispose();world.pipeline=null;s.imageProcessingConfiguration.applyByPostProcess=false;console.info('Post-processing is unavailable; keeping the base renderer.');}
    if(quality==='cinematic'&&engine.webGLVersion>1&&B.SSAO2RenderingPipeline.IsSupported){try{const ao=new B.SSAO2RenderingPipeline('soft habitat occlusion',s,{ssaoRatio:.5,blurRatio:.5},[world.camera]);ao.radius=.45;ao.totalStrength=.85;ao.expensiveBlur=false;ao.samples=8;world.ambientOcclusion=ao;}catch(error){console.info('Ambient occlusion is unavailable; keeping the main renderer.');}}
    world.shadow.getShadowMap().resize(quality==='cinematic'?2048:quality==='performance'?512:1024);world.shadow.blurKernel=quality==='performance'?12:24;if(engine.webGLVersion>1){world.shadow.usePercentageCloserFiltering=true;world.shadow.filteringQuality=quality==='cinematic'?B.ShadowGenerator.QUALITY_HIGH:B.ShadowGenerator.QUALITY_MEDIUM;}engine.resize();
  }
  function adapt(world,dt){
    if(world.state.graphics!=='auto'||world.engine instanceof B.NullEngine||!Number.isFinite(dt)||dt<=0||dt>.25||document.hidden)return;
    const p=world.performanceState||(world.performanceState={average:1/60,warmup:0,slow:0,fast:0}),engine=world.engine,base=world.baseHardwareScale||1;
    p.average+=(dt-p.average)*.07;p.warmup+=dt;if(p.warmup<2)return;
    p.slow=p.average>(world.state.batteryMode?.036:.022)?p.slow+dt:0;p.fast=p.average<.020?p.fast+dt:0;
    const current=engine.getHardwareScalingLevel();
    if(p.slow>=3){if(world.frameStats?.animation>9){world.detailBudget=Math.max(.55,(world.detailBudget||1)*.85);world.refreshDetail?.();}const next=Math.min(Math.max(base,1.35),current*1.12);if(next>current+.005)engine.setHardwareScalingLevel(next);p.slow=p.fast=0;}
    else if(p.fast>=10){const next=Math.max(base,current/1.08);if(next<current-.005)engine.setHardwareScalingLevel(next);p.slow=p.fast=0;}
  }
  // With post-processing, every pixel passes through exposure, tone mapping,
  // display gamma and contrast once. stageColor solves for the scene value that
  // displays as the page color, so the studio has no visible rectangle.
  const ACES_IN=[[.59719,.35458,.04823],[.07600,.90834,.01566],[.02840,.13383,.83777]],ACES_OUT=[[1.60475,-.53108,-.07367],[-.10208,1.10813,-.00605],[-.00327,-.07276,1.07602]];
  const mul=(m,v)=>m.map(r=>r[0]*v[0]+r[1]*v[1]+r[2]*v[2]),unit=x=>Math.min(1,Math.max(0,x));
  function invert3(m){const[[a,b,c],[d,e,f],[g,h,i]]=m,A=e*i-f*h,Bc=f*g-d*i,Cc=d*h-e*g,det=a*A+b*Bc+c*Cc;return[[A,c*h-b*i,b*f-c*e],[Bc,a*i-c*g,c*d-a*f],[Cc,b*g-a*h,a*e-b*d]].map(r=>r.map(x=>x/det));}
  const ACES_IN_INV=invert3(ACES_IN),ACES_OUT_INV=invert3(ACES_OUT),aces=v=>(v*(v+.0245786)-.000090537)/(v*(.983729*v+.4329510)+.238081),acesInverse=y=>{y=Math.min(y,1);const a=y*.983729-1,b=y*.4329510-.0245786,c=y*.238081+.000090537;return(-b-Math.sqrt(b*b-4*a*c))/(2*a);};
  const toneMapping=config=>config.toneMappingEnabled?config.toneMappingType:-1,contrast=(v,k)=>Math.max(0,k<1?.5+(v-.5)*k:v+(v*v*(3-2*v)-v)*(k-1));
  function displayed(config,rgb){
    let c=rgb.map(v=>Math.max(0,v)*(config.exposure??1));const tone=toneMapping(config);
    if(tone===B.ImageProcessingConfiguration.TONEMAPPING_ACES)c=mul(ACES_OUT,mul(ACES_IN,c).map(aces)).map(unit);else if(tone===B.ImageProcessingConfiguration.TONEMAPPING_STANDARD)c=c.map(v=>1-Math.pow(2,-1.590579*v));
    return c.map(v=>contrast(unit(Math.pow(v,1/2.2)),config.contrast??1));
  }
  function sceneValue(config,display){
    const k=config.contrast??1,flat=display.map(y=>{let low=0,high=1;for(let i=0;i<40;i++){const mid=(low+high)/2;if(contrast(mid,k)<y)low=mid;else high=mid;}return Math.pow((low+high)/2,2.2);}),tone=toneMapping(config);
    const linear=tone===B.ImageProcessingConfiguration.TONEMAPPING_ACES?mul(ACES_IN_INV,mul(ACES_OUT_INV,flat).map(acesInverse)):tone===B.ImageProcessingConfiguration.TONEMAPPING_STANDARD?flat.map(v=>-Math.log2(Math.max(1e-6,1-Math.min(v,.999)))/1.590579):flat;
    return linear.map(v=>Math.max(0,v)/(config.exposure||1));
  }
  function stageColor(world,display){
    const config=world.scene.imageProcessingConfiguration,target=[display.r,display.g,display.b];if(!config.applyByPostProcess)return{scene:display.clone(),display:display.clone()};
    // Values above 1 survive only in a floating-point scene target. Otherwise
    // the page adopts the closest color this device can actually display.
    const caps=world.engine.getCaps?.()||{},hdr=!!(world.pipeline&&(caps.textureHalfFloatRender||caps.textureFloatRender));let value=sceneValue(config,target);if(!hdr)value=value.map(v=>Math.min(1,v));
    return{scene:new B.Color3(...value),display:hdr?display.clone():new B.Color3(...displayed(config,value))};
  }
  const canvases={};
  function surfaceTexture(scene,mode,normal=false){
    const key=mode+(normal?' normal':' color'),m=materials(scene);if(m.has(key))return m.get(key);
    if(!canvases[key]){
      const size=512,stride=size+2,heights=new Float64Array(stride*stride),height=(x,y)=>{const u=x/size,v=y/size,n=(Math.sin(x*91.7+y*37.3)*43758.54)%1,cell=(cx,cy)=>{const v=Math.sin(cx*127.1+cy*311.7)*43758.5453;return v-Math.floor(v);},vein=mode==='moss'?.30*cell(Math.floor(x/3),Math.floor(y/3))+.18*cell(Math.floor(x/10)+400,Math.floor(y/10)):mode==='leaf'?Math.exp(-Math.abs(u-.5)*280)*.13+Math.exp(-Math.abs(((v*10+Math.abs(u-.5)*4)%1)-.5)*80)*.035:mode==='wood'?.10*Math.sin(Math.hypot(u-.5,v-.5)*210+Math.sin(u*30)*.6):0;return .55+vein+n*.035;};
      // Padding reproduces the original edge derivatives. Share the expensive
      // height samples between color and normal maps, then release the field.
      for(let y=-1;y<=size;y++)for(let x=-1;x<=size;x++)heights[(y+1)*stride+x+1]=height(x,y);
      for(const bump of mode==='wood'&&!normal?[false]:[false,true]){
        const name=mode+(bump?' normal':' color');if(canvases[name])continue;
        const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d'),data=ctx.createImageData(size,size);
        for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,p=(y+1)*stride+x+1,h=heights[p];if(bump){const dx=(heights[p+1]-heights[p-1])*3,dy=(heights[p+stride]-heights[p-stride])*3,d=Math.hypot(dx,dy,1);data.data[i]=128-dx/d*127;data.data[i+1]=128-dy/d*127;data.data[i+2]=128+127/d;}else{const q=mode==='moss'?92+h*128:185+h*55;data.data[i]=q;data.data[i+1]=q+(mode==='leaf'?4:0);data.data[i+2]=q-6;}data.data[i+3]=255;}
        ctx.putImageData(data,0,0);canvases[name]=canvas;
      }
    }
    const texture=new B.DynamicTexture(key,canvases[key],scene,true);texture.gammaSpace=!normal;texture.update(false);m.set(key,texture);return texture;
  }
  function scannedTexture(scene,asset,kind,scale=1){
    const key=asset+kind+scale,m=materials(scene);if(m.has(key))return m.get(key);const fallback='assets/textures/'+asset+'_'+kind+'.jpg',caps=scene.getEngine().getCaps(),compressed=kind==='diff'&&!!(caps.astc||caps.bptc||caps.etc2),file=compressed?fallback.replace('.jpg','.ktx2'):fallback;let texture;
    if(scene.getEngine() instanceof B.NullEngine){texture=B.RawTexture.CreateRGBATexture(new Uint8Array([128,128,255,255]),1,1,scene);texture.metadata={offlineSource:file};}
    else{let retried=false;texture=new B.Texture(file,scene,false,false,B.Texture.TRILINEAR_SAMPLINGMODE,null,()=>{if(file!==fallback&&!retried){retried=true;texture.updateURL(fallback);}});}
    texture.name=file;texture.gammaSpace=kind==='diff';texture.uScale=texture.vScale=scale;texture.anisotropicFilteringLevel=8;m.set(key,texture);return texture;
  }
  function scannedMaterial(scene,name,asset,scale=1){
    const m=materials(scene);if(m.has(name))return m.get(name);const p=new B.PBRMaterial(name,scene);p.albedoColor=B.Color3.White();p.metallic=0;p.roughness=.92;p.albedoTexture=scannedTexture(scene,asset,'diff',scale);p.bumpTexture=scannedTexture(scene,asset,'nor_gl',scale);p.bumpTexture.level=.65;p.metallicTexture=scannedTexture(scene,asset,'arm',scale);p.useRoughnessFromMetallicTextureAlpha=false;p.useRoughnessFromMetallicTextureGreen=true;p.useMetallnessFromMetallicTextureBlue=true;p.useAmbientOcclusionFromMetallicTextureRed=true;p.environmentIntensity=.55;p.metadata={retained:true};m.set(name,p);return p;
  }
  function botanicalMaterial(scene,type){
    const m=materials(scene),key='botanical material '+type;if(m.has(key))return m.get(key);const leaf=new B.PBRMaterial(type+' botanical surface',scene);leaf.albedoColor=B.Color3.White();leaf.metallic=0;leaf.roughness=type==='moss'?.86:type==='succulent'?.39:.58;leaf.backFaceCulling=false;leaf.twoSidedLighting=true;leaf.environmentIntensity=.65;
    const woody=['tree','log'].includes(type),green=!['rock','crystal','log','mushroom'].includes(type),mode=type==='moss'?'moss':['cactus','succulent'].includes(type)?'skin':'leaf';
    if(green){leaf.albedoTexture=surfaceTexture(scene,mode);leaf.bumpTexture=surfaceTexture(scene,mode,true);leaf.bumpTexture.level=.22;leaf.subSurface.isTranslucencyEnabled=mode==='leaf';leaf.subSurface.translucencyIntensity=type==='moss'?.12:.28;leaf.subSurface.useAlbedoToTintTranslucency=true;leaf.subSurface.minimumThickness=.01;leaf.subSurface.maximumThickness=.04;}
    if(type==='succulent'||type==='cactus'){leaf.clearCoat.isEnabled=true;leaf.clearCoat.intensity=.16;leaf.clearCoat.roughness=.25;}
    const structure=woody?scannedMaterial(scene,'weathered bark','bark_brown_01',1):detailMaterial(scene,type+' stem','#ffffff',.76),detail=detailMaterial(scene,type+' details','#ffffff',type==='flower'?.62:.78);
    if(type==='flower'){detail.subSurface.isTranslucencyEnabled=true;detail.subSurface.translucencyIntensity=.22;detail.backFaceCulling=false;detail.twoSidedLighting=true;}
    if(type==='log')detail.albedoTexture=surfaceTexture(scene,'wood');
    if(root.VerdantDynamics&&!['rock','crystal','log'].includes(type)){new root.VerdantDynamics.PlantSurface(leaf,type);if(!woody)new root.VerdantDynamics.PlantSurface(structure,type);if(['flower','mushroom'].includes(type))new root.VerdantDynamics.PlantSurface(detail,type);}
    const multi=new B.MultiMaterial(key,scene);multi.subMaterials=[type==='rock'?scannedMaterial(scene,'weathered mineral','rock_01',1):leaf,structure,detail];if(type==='crystal'){leaf.roughness=.17;leaf.indexOfRefraction=1.48;leaf.clearCoat.isEnabled=true;leaf.clearCoat.intensity=.8;}m.set(key,multi);return multi;
  }
  function terrainMaterial(scene,biome){const p=scannedMaterial(scene,'living '+biome+' soil',biome==='desert'?'sand_01':'forest_ground_04',4);p.albedoColor=col(biome==='desert'?'#f0e5cf':biome==='tropical'?'#b1b4a1':'#c4c2ac');p.roughness=biome==='tropical'?.76:.96;if(root.VerdantDynamics&&!p.verdantSoil)p.verdantSoil=new root.VerdantDynamics.SoilSurface(p,scannedTexture(scene,'rock_01','diff',1));return p;}
  function glass(scene){const p=new B.PBRMaterial('polished clear glass',scene);p.albedoColor=col('#e3eee4');p.metallic=0;p.roughness=.035;p.alpha=.065;p.indexOfRefraction=1.45;p.backFaceCulling=false;p.twoSidedLighting=true;p.disableDepthWrite=true;p.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHABLEND;p.clearCoat.isEnabled=true;p.clearCoat.intensity=1;p.clearCoat.roughness=.025;p.environmentIntensity=.8;return p;}
  root.VerdantGraphics={stageColor,displayed,configure,creatureMaterial,detailMaterial,glass,adapt,botanicalMaterial,terrainMaterial,scannedMaterial};
})(window);
