/* Bounded PBR material extensions. No saved garden data is modified. */
(function(root){'use strict';const B=BABYLON;
class PlantSurface extends B.MaterialPluginBase{
 constructor(material,type){super(material,'VerdantPlantSurface',190,{VERDANT_PLANT:false});this.type=type;this._enable(true);}
 isCompatible(language){return language===B.ShaderLanguage.GLSL;}
 prepareDefines(d,s,m){d.VERDANT_PLANT=m.isVerticesDataPresent('verdantOrgan');}
 getAttributes(a){a.push('verdantOrgan');}
 getUniforms(){return{ubo:[{name:'verdantMotion',size:4,type:'vec4'},{name:'verdantTime',size:1,type:'float'}],vertex:'uniform vec4 verdantMotion; uniform float verdantTime;'};}
 bindForSubMesh(buffer,scene,engine,sub){const data=sub.getRenderingMesh().metadata?.verdantState||[1,0,1],motion=scene.metadata?.verdantMotion||{time:0,wind:0},still=['moss','succulent','cactus','mushroom'].includes(this.type);buffer.updateFloat4('verdantMotion',data[0],data[1],still?0:motion.wind,Math.max(.1,data[2]));buffer.updateFloat('verdantTime',motion.time);}
 getCustomCode(type){return type==='vertex'?{CUSTOM_VERTEX_DEFINITIONS:'#ifdef VERDANT_PLANT\nattribute vec4 verdantOrgan;\n#ifdef INSTANCES\nattribute vec4 verdantState;\n#endif\n#endif',CUSTOM_VERTEX_UPDATE_POSITION:`
#ifdef VERDANT_PLANT
vec3 verdantData=vec3(verdantMotion.x,verdantMotion.y,verdantMotion.w);
#ifdef INSTANCES
verdantData=verdantState.xyz;
#endif
vec3 anchor=verdantOrgan.xyz,offset=positionUpdated-anchor;
if(verdantOrgan.w>=0.0){float unfolded=smoothstep(verdantOrgan.w,min(1.04,verdantOrgan.w+0.45),verdantData.x);positionUpdated.xz=anchor.xz+offset.xz*mix(0.28,1.0,unfolded);positionUpdated.y+=length(offset.xz)*(1.0-unfolded)*0.42;}
float distanceFromRoot=max(0.0,positionUpdated.y-anchor.y),wave=sin(verdantTime*.9+verdantData.y+anchor.x*2.1+anchor.z*1.7)+sin(verdantTime*2.0+verdantData.y+positionUpdated.x*5.3)*.2;
float bend=min(.012,distanceFromRoot*distanceFromRoot*.005)*wave*verdantMotion.z/max(.1,verdantData.z);positionUpdated.x+=bend;positionUpdated.z+=bend*.43;
#endif
`}:null;}
}
class SoilSurface extends B.MaterialPluginBase{
 constructor(material,mineral){super(material,'VerdantSoilSurface',195,{VERDANT_SOIL:false});this.mineral=mineral;this._enable(true);}
 isCompatible(language){return language===B.ShaderLanguage.GLSL;}
 prepareDefines(d,s,m){d.VERDANT_SOIL=m.isVerticesDataPresent('verdantSoil');}
 getAttributes(a){a.push('verdantSoil');}getSamplers(s){s.push('verdantMineralSampler');}
 getUniforms(){return{ubo:[{name:'verdantSurfaceDetail',size:1,type:'float'}],fragment:'uniform float verdantSurfaceDetail;'};}
 bindForSubMesh(buffer,scene){buffer.setTexture('verdantMineralSampler',this.mineral);buffer.updateFloat('verdantSurfaceDetail',scene.metadata?.verdantSurfaceDetail===false?0:1);}
 hasTexture(t){return t===this.mineral;}getActiveTextures(t){t.push(this.mineral);}
 getCustomCode(type){if(type==='vertex')return{CUSTOM_VERTEX_DEFINITIONS:'#ifdef VERDANT_SOIL\nattribute vec4 verdantSoil; varying vec4 vVerdantSoil; varying vec3 vVerdantGround;\n#endif',CUSTOM_VERTEX_MAIN_END:'#ifdef VERDANT_SOIL\nvVerdantSoil=verdantSoil;vVerdantGround=positionUpdated;\n#endif'};if(type!=='fragment')return null;return{
 CUSTOM_FRAGMENT_DEFINITIONS:'#ifdef VERDANT_SOIL\nvarying vec4 vVerdantSoil; varying vec3 vVerdantGround; uniform sampler2D verdantMineralSampler;\n#endif',
 CUSTOM_FRAGMENT_BEFORE_LIGHTS:`
#ifdef VERDANT_SOIL
float mineralWeight=smoothstep(.18,.62,vVerdantSoil.y)*.48;vec3 mineralColor=toLinearSpace(texture2D(verdantMineralSampler,vVerdantGround.xz*.65).rgb);
if(verdantSurfaceDetail>.5&&mineralWeight>.08){vec3 weights=pow(abs(normalW),vec3(4.0));weights/=max(.0001,weights.x+weights.y+weights.z);mineralColor=mineralColor*weights.y+toLinearSpace(texture2D(verdantMineralSampler,vVerdantGround.zy*.65).rgb)*weights.x+toLinearSpace(texture2D(verdantMineralSampler,vVerdantGround.xy*.65).rgb)*weights.z;}
surfaceAlbedo=mix(surfaceAlbedo,mineralColor*.72,mineralWeight);surfaceAlbedo*=1.0-vVerdantSoil.z*.08;
#endif
`,
 '!float roughness=reflectivityOut\\.roughness;':`float roughness=reflectivityOut.roughness;
#ifdef VERDANT_SOIL
roughness=mix(roughness,max(.42,roughness*.57),smoothstep(.52,.96,vVerdantSoil.x));microSurface=1.0-roughness;reflectivityOut.microSurface=microSurface;reflectivityOut.roughness=roughness;
#endif
`};}
}
root.VerdantDynamics={PlantSurface,SoilSurface};})(window);
