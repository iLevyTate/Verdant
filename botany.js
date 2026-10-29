/* Procedural botanical geometry. Saved species/variants/positions stay unchanged. */
(function(root){
'use strict';
const C=TerrariumCore,B=BABYLON,V=B.Vector3,TAU=Math.PI*2;
const rgb=h=>{const c=B.Color3.FromHexString(h);return[c.r,c.g,c.b];},mix=(c,f)=>c.map(x=>Math.min(1,x*f));
class MeshBuilder{
 constructor(detail=1){this.detail=detail;this.p=[];this.c=[];this.uv=[];this.indices=[[],[],[]];this.part=0;this.roots=[];}
 vertex(p,c,uv=[0,0]){const id=this.p.length/3;this.p.push(...p);this.c.push(...c,1);this.uv.push(...uv);return id;}
 // Helpers describe outward surfaces in right-handed order; Babylon stores
 // left-handed triangles. Convert winding before generating normals/culling.
 tri(a,b,c){this.indices[this.part].push(a,c,b);}
 tube(a,b,r1,r2,c,segments=8){segments=Math.max(4,Math.round(segments*this.detail));const d=new V(b[0]-a[0],b[1]-a[1],b[2]-a[2]),length=d.length(),axis=d.normalize(),u=V.Cross(axis,Math.abs(axis.y)<.9?V.Up():V.Right()).normalize(),v=V.Cross(axis,u).normalize(),first=this.p.length/3;for(let k=0;k<2;k++)for(let j=0;j<=segments;j++){const t=j/segments*TAU,r=k?r2:r1,p=k?b:a;this.vertex([p[0]+(u.x*Math.cos(t)+v.x*Math.sin(t))*r,p[1]+(u.y*Math.cos(t)+v.y*Math.sin(t))*r,p[2]+(u.z*Math.cos(t)+v.z*Math.sin(t))*r],c,[j/segments,(k?length:0)*2]);}for(let j=0;j<segments;j++){const q=first+j;this.tri(q,q+1,q+segments+1);this.tri(q+1,q+segments+2,q+segments+1);}}
 curve(points,r1,r2,c,segments=8,caps=null){
  segments=Math.max(4,Math.round(segments*this.detail));const start=this.p.length/3,lengths=[0],frames=[];
  for(let i=1;i<points.length;i++)lengths[i]=lengths[i-1]+V.Distance(V.FromArray(points[i-1]),V.FromArray(points[i]));
  let previous=null;for(let i=0;i<points.length;i++){
   const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)],axis=V.FromArray(after).subtract(V.FromArray(before)).normalize();let u=previous?.subtract(axis.scale(V.Dot(previous,axis)));
   if(!u||u.lengthSquared()<.00001)u=V.Cross(axis,Math.abs(axis.y)<.9?V.Up():V.Right());u.normalize();const v=V.Cross(axis,u).normalize(),radius=r1+(r2-r1)*lengths[i]/Math.max(.00001,lengths.at(-1)),point=V.FromArray(points[i]);previous=u;frames.push({point,u,v,radius});
   for(let j=0;j<=segments;j++){const angle=j/segments*TAU,offset=u.scale(Math.cos(angle)*radius).add(v.scale(Math.sin(angle)*radius));this.vertex(point.add(offset).asArray(),c,[j/segments,lengths[i]*2]);}
   if(i)for(let j=0;j<segments;j++){const a=start+(i-1)*(segments+1)+j,b=start+i*(segments+1)+j;this.tri(a,a+1,b);this.tri(a+1,b+1,b);}
  }
  if(caps){const part=this.part;this.part=caps.part;for(const end of[0,frames.length-1]){const {point,u,v,radius}=frames[end],center=this.vertex(point.asArray(),caps.color,[.5,.5]),ring=this.p.length/3;for(let j=0;j<=segments;j++){const angle=j/segments*TAU,offset=u.scale(Math.cos(angle)*radius).add(v.scale(Math.sin(angle)*radius));this.vertex(point.add(offset).asArray(),caps.color,[.5+Math.cos(angle)*.5,.5+Math.sin(angle)*.5]);}for(let j=0;j<segments;j++)end?this.tri(center,ring+j,ring+j+1):this.tri(center,ring+j+1,ring+j);}this.part=part;}
 }
 ellipsoid(p,r,c,seg=14,rings=8,irregular=0,seed=11){seg=Math.max(6,Math.round(seg*this.detail));rings=Math.max(3,Math.round(rings*this.detail));const start=this.p.length/3;for(let j=0;j<=rings;j++)for(let k=0;k<=seg;k++){const ph=j/rings*Math.PI,a=k/seg*TAU,x=Math.sin(ph)*Math.cos(a),y=Math.cos(ph),z=Math.sin(ph)*Math.sin(a),n=1+irregular*(C.noise(x*3.1+y,z*3.1+y,seed)-.5);this.vertex([p[0]+x*r[0]*n,p[1]+y*r[1]*n,p[2]+z*r[2]*n],mix(c,.93+.07*y),[k/seg,j/rings]);}for(let j=0;j<rings;j++)for(let k=0;k<seg;k++){const q=start+j*(seg+1)+k;this.tri(q,q+1,q+seg+1);this.tri(q+1,q+seg+2,q+seg+1);}}
 blade(a,b,width,c,{rows=7,curl=.04,fold=.008,shape='lance',thickness=0,edge=null}={}){
  rows=Math.max(3,Math.round(rows*this.detail));const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),sx=length>1e-6?-dz/length:1,sz=length>1e-6?dx/length:0,sides=thickness?[1,-1]:[1],starts=[];
  for(const back of sides){const start=this.p.length/3;starts.push(start);for(let j=0;j<=rows;j++){const t=j/rows,w=shape==='heart'?Math.sin(Math.PI*Math.pow(t,.64))**.6:shape==='grass'?Math.max(.015,(1-t)**.7):Math.sin(Math.PI*t)**.75,serration=shape==='fern'?1+.10*Math.sin(t*TAU*5):1;for(let k=0;k<5;k++){const across=(k-2)/2,q=across*width*w*serration,spine=Math.sin(t*Math.PI),height=a[1]+(b[1]-a[1])*t+spine*curl+fold*(1-Math.abs(across))*spine+back*thickness*Math.sin(t*Math.PI)*(1-across*across);const pigment=edge&&Math.abs(across)>.9?edge:mix(c,.92+.08*(1-Math.abs(across)));this.vertex([a[0]+dx*t+sx*q,height,a[2]+dz*t+sz*q],pigment,[k/4,t]);}}for(let j=0;j<rows;j++)for(let k=0;k<4;k++){const q=start+j*5+k;if(back===1){this.tri(q,q+1,q+5);this.tri(q+1,q+6,q+5);}else{this.tri(q,q+5,q+1);this.tri(q+1,q+5,q+6);}}}
  if(thickness)for(let j=0;j<rows;j++)for(const k of[0,4]){const a=starts[0]+j*5+k,b=starts[1]+j*5+k;this.tri(a,b,a+5);this.tri(a+5,b,b+5);}
 }
 rootGroup(start,x,z){const bounds=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];for(let i=start*3;i<this.p.length;i+=3)for(let j=0;j<3;j++){bounds[j]=Math.min(bounds[j],this.p[i+j]);bounds[j+3]=Math.max(bounds[j+3],this.p[i+j]);}this.roots.push({start,count:this.p.length/3-start,x,z,bounds});}
 mesh(name,scene,material,updatable=false){const mesh=new B.Mesh(name,scene),data=new B.VertexData,indices=this.indices.flat(),normals=[];B.VertexData.ComputeNormals(this.p,indices,normals);Object.assign(data,{positions:this.p,indices,normals,colors:this.c,uvs:this.uv});data.applyToMesh(mesh,updatable);mesh.material=material;mesh.isPickable=false;mesh.subMeshes=[];let offset=0;for(let i=0;i<3;i++){const count=this.indices[i].length;if(count)new B.SubMesh(i,0,this.p.length/3,offset,count,mesh);offset+=count;}return mesh;}
}
function build(type,variant,scene,quality='auto'){
 const detail=quality==='performance'?.5:quality==='cinematic'?1:window.innerWidth<900?.72:.86;const g=new MeshBuilder(detail),r=C.rng('botanical-v1 '+type+' '+variant),leaf=rgb(['#416331','#596b3c','#315d38'][variant]),young=rgb(['#81925a','#a0a364','#608653'][variant]),stem=rgb('#4e5e32'),bark=rgb('#a08b6e');
 if(type==='fern')for(let j=0;j<8;j++){
  const angle=j/8*TAU+r()*.35,L=.75+r()*.5,H=.50+r()*.45,point=t=>[Math.cos(angle)*L*t,.05+H*Math.sin(t*1.9)-.06*t*t,Math.sin(angle)*L*t];g.part=1;g.curve(Array.from({length:13},(_,i)=>point(i/12)),.012,.003,stem,6);g.part=0;
  for(let k=2;k<12;k++){const t=k/12,p=point(t),reach=(Math.sin(t*Math.PI)*.20+.025)*(1+.15*r());for(const side of[-1,1]){const a=angle+side*1.05,tip=[p[0]+Math.cos(a)*reach,p[1]+.02-reach*.08,p[2]+Math.sin(a)*reach];g.blade(p,tip,reach*.22,k%3?leaf:young,{shape:'fern',rows:9,curl:.02,fold:.009});}}
 }
 else if(type==='moss'){
  g.part=0;const center=g.vertex([0,.11,0],mix(leaf,.72),[.5,.5]),seg=32,rings=6;for(let j=1;j<=rings;j++)for(let k=0;k<=seg;k++){const a=k/seg*TAU,d=j/rings*.6,h=Math.max(.004,.10*(1-(d/.6)**2)+C.noise(Math.cos(a)*d*8,Math.sin(a)*d*8,17+variant)*.018);g.vertex([Math.cos(a)*d,h,Math.sin(a)*d],mix(leaf,.76),[.5+Math.cos(a)*d,.5+Math.sin(a)*d]);}for(let k=0;k<seg;k++)g.tri(center,1+k+1,1+k);for(let j=0;j<rings-1;j++)for(let k=0;k<seg;k++){const n=1+j*(seg+1)+k;g.tri(n,n+1,n+seg+1);g.tri(n+1,n+seg+2,n+seg+1);}
  for(let j=0;j<Math.round(210*detail);j++){const a=r()*TAU,d=Math.sqrt(r())*.58,x=Math.cos(a)*d,z=Math.sin(a)*d,base=.10*(1-(d/.6)**2),h=.035+r()*.045;g.part=1;g.tube([x,base,z],[x+.005,base+h,z-.005],.002,.001,stem,4);g.part=0;for(let k=1;k<5;k++)for(const side of[-1,1]){const th=a+k*1.7+side,p=[x,base+h*k/5,z],L=.018+r()*.016;g.blade(p,[x+Math.cos(th)*L,p[1]+L*.3,z+Math.sin(th)*L],.007,k%2?leaf:young,{rows:3,curl:.003,fold:.002});}}
 }
 else if(type==='clover')for(let j=0;j<11;j++){
  const rootStart=g.p.length/3,angle=r()*TAU,d=Math.sqrt(r())*.52,x=Math.cos(angle)*d,z=Math.sin(angle)*d,h=.18+r()*.25,p=[x+.035,h,z-.03];g.part=1;g.curve([[x,0,z],[x+.02,h*.6,z-.01],p],.005,.003,stem,5);g.part=0;for(let k=0;k<3;k++){const a=angle+k/3*TAU;g.blade(p,[p[0]+Math.cos(a)*.21,p[1]+.015,p[2]+Math.sin(a)*.21],.095,j%2?leaf:young,{shape:'heart',rows:10,curl:.016,fold:.008});}
  g.rootGroup(rootStart,x,z);
 }
 else if(type==='flower')for(let j=0;j<5;j++){
  const rootStart=g.p.length/3,a=r()*TAU,d=Math.sqrt(r())*.5,x=Math.cos(a)*d,z=Math.sin(a)*d,h=.45+r()*.55,p=[x+.05,h,z+.02];g.part=1;g.curve([[x,0,z],[x-.025,h*.4,z],p],.009,.004,stem,7);g.part=0;for(let k=0;k<3;k++){const y=h*(.18+k*.19),th=a+k*2.3;g.blade([x,y,z],[x+Math.cos(th)*.22,y+.08,z+Math.sin(th)*.22],.045,leaf,{rows:7,curl:.025});}
  g.part=2;const petal=rgb(['#e8e5ce','#d8c28d','#d2b8b0'][variant]);for(let k=0;k<12;k++){const th=k/12*TAU,L=.12+r()*.055;g.blade(p,[p[0]+Math.cos(th)*L,p[1]-.015+r()*.018,p[2]+Math.sin(th)*L],.028,petal,{shape:'heart',rows:7,curl:.025,fold:.002});}g.ellipsoid([p[0],p[1]+.018,p[2]],[.05,.026,.05],rgb('#9b7c32'),12,6);for(let k=0;k<20;k++){const th=k*2.4,dd=Math.sqrt(k/20)*.043;g.ellipsoid([p[0]+Math.cos(th)*dd,p[1]+.038,p[2]+Math.sin(th)*dd],[.007,.008,.007],rgb('#d2b25a'),5,3);}
  g.rootGroup(rootStart,x,z);
 }
 else if(type==='tree'){
  g.part=1;const path=Array.from({length:11},(_,i)=>{const t=i/10;return[Math.sin(t*8)*.075,t*2.15,Math.sin(t*5)*.05];});g.curve(path,.115,.012,bark,14);for(let k=0;k<7;k++){const a=k/7*TAU;g.curve([[0,.11,0],[Math.cos(a)*.17,.04,Math.sin(a)*.17],[Math.cos(a)*.36,.009,Math.sin(a)*.36]],.045,.004,bark,8);}
  for(let j=0;j<11;j++){const a=j*2.4,h=.85+j*.11,L=.65*(1-j/16),base=[Math.sin(h/2.15*8)*.075,h,0],tip=[Math.cos(a)*L,h+.18,Math.sin(a)*L],mid=[tip[0]*.55,h+.06,tip[2]*.55];g.part=1;g.curve([base,mid,tip],.036*(1-j/18),.004,bark,8);
   for(let k=0;k<7;k++){const t=.34+k*.1,center=[mid[0]+(tip[0]-mid[0])*t,mid[1]+(tip[1]-mid[1])*t,mid[2]+(tip[2]-mid[2])*t],th=a+(k%2?1:-1)*.8,end=[center[0]+Math.cos(th)*.22,center[1]+.08,center[2]+Math.sin(th)*.22];g.part=1;g.tube(center,end,.007,.002,bark,5);g.part=0;for(let n=0;n<Math.round(14*detail);n++){const phi=r()*TAU,rad=Math.sqrt(r())*.13,base=[end[0]+Math.cos(phi)*rad,end[1]+(r()-.5)*.08,end[2]+Math.sin(phi)*rad],L=.07+r()*.055,th=phi+(r()-.5)*.7;g.blade(base,[base[0]+Math.cos(th)*L,base[1]+.015+r()*.06,base[2]+Math.sin(th)*L],.012,n%4?leaf:young,{rows:3,curl:.009,fold:.004});}for(let q=0;q<Math.max(4,Math.round(9*detail));q++){const f=q/Math.max(4,Math.round(9*detail)),p=center.map((n,i)=>n+(end[i]-n)*f);for(const side of[-1,1]){const phi=th+side*1.2+q*.2,len=.06+r()*.04;g.blade(p,[p[0]+Math.cos(phi)*len,p[1]+.02,p[2]+Math.sin(phi)*len],.012,q%3?leaf:young,{rows:3,curl:.006,fold:.003});}}}
  }
 }
 else if(type==='grass'){
  const c=rgb(['#68744a','#a29668','#6b7d5d'][variant]);for(let j=0;j<48;j++){const rootStart=g.p.length/3,a=r()*TAU,d=r()*.28,h=.30+r()*.62,p=[Math.cos(a)*d,.005,Math.sin(a)*d];g.blade(p,[p[0]+Math.cos(a)*.25,h,p[2]+Math.sin(a)*.25],.013,c,{rows:9,shape:'grass',curl:h*.15,fold:.007});g.rootGroup(rootStart,p[0],p[2]);}
 }
 else if(type==='succulent'){
  const base=rgb(['#7d947c','#93a28a','#658879'][variant]),edge=rgb('#a58f83');for(let ring=0;ring<4;ring++)for(let j=0;j<9-ring;j++){const a=j/(9-ring)*TAU+ring*.43,L=.53-ring*.105;g.blade([0,.05+ring*.035,0],[Math.cos(a)*L,.18+ring*.14,Math.sin(a)*L],.17-ring*.018,base,{rows:13,curl:.07,fold:.018,thickness:.045,edge});}
 }
 else if(type==='cactus'){
  const skin=rgb(['#728d69','#8e9e76','#587f66'][variant]);function column(x,y,z,H,R){const start=g.p.length/3,seg=Math.max(24,Math.round(40*detail)),rings=Math.max(12,Math.round(20*detail));g.part=0;for(let j=0;j<=rings;j++){const t=j/rings,cap=Math.sqrt(Math.max(0,1-Math.max(0,(t-.83)/.17)**2));for(let k=0;k<=seg;k++){const a=k/seg*TAU,rad=R*(1+.065*Math.cos(a*10))*cap;g.vertex([x+Math.cos(a)*rad,y+t*H,z+Math.sin(a)*rad],skin,[k/seg,t]);}}for(let j=0;j<rings;j++)for(let k=0;k<seg;k++){const q=start+j*(seg+1)+k;g.tri(q,q+seg+1,q+1);g.tri(q+1,q+seg+1,q+seg+2);}g.part=2;for(let k=0;k<10;k++)for(let j=1;j<9;j++){const a=k/10*TAU,p=[x+Math.cos(a)*R*1.07,y+j/10*H,z+Math.sin(a)*R*1.07];g.ellipsoid(p,[.009,.009,.009],rgb('#c2bba0'),5,3);for(let n=0;n<3;n++){const th=a+(n-1)*.5;g.tube(p,[p[0]+Math.cos(th)*.025,p[1]+(n-1)*.018,p[2]+Math.sin(th)*.025],.0013,.0002,rgb('#d3cbb4'),3);}}}
  column(0,0,0,1.5,.21);g.part=0;g.tube([0,.60,0],[-.37,.60,0],.10,.10,skin,12);column(-.37,.60,0,.5,.10);g.part=0;g.tube([0,.86,0],[.34,.86,0],.085,.085,skin,12);column(.34,.86,0,.35,.085);
 }
 else if(type==='mushroom')for(let j=0;j<5;j++){
  const rootStart=g.p.length/3,a=r()*TAU,d=r()*.45,h=.22+r()*.38,R=.12+r()*.13,p=[Math.cos(a)*d,h,Math.sin(a)*d];g.part=1;g.curve([[p[0]-.025,0,p[2]],[p[0],h*.6,p[2]+.012],p],.024,.016,rgb('#c9bc9c'),10);g.part=0;const first=g.p.length/3,seg=28,rings=10,cap=rgb(['#a88b59','#947047','#b29c6c'][variant]);for(let q=0;q<=rings;q++){const t=q/rings*Math.PI*.55;for(let k=0;k<=seg;k++){const th=k/seg*TAU,rr=Math.sin(t)*R;g.vertex([p[0]+Math.cos(th)*rr,h+Math.cos(t)*R*.46,p[2]+Math.sin(th)*rr],mix(cap,.95+.07*Math.cos(th*5+t*3)),[.5+Math.cos(th)*rr/(R*2),.5+Math.sin(th)*rr/(R*2)]);}}for(let q=0;q<rings;q++)for(let k=0;k<seg;k++){const n=first+q*(seg+1)+k;g.tri(n,n+1,n+seg+1);g.tri(n+1,n+seg+2,n+seg+1);}g.part=2;for(let k=0;k<22;k++){const th=k/22*TAU;g.tube([p[0]+Math.cos(th)*.02,h-.012,p[2]+Math.sin(th)*.02],[p[0]+Math.cos(th)*R*.96,h-R*.07,p[2]+Math.sin(th)*R*.96],.002,.001,rgb('#b9ab8a'),3);}
  g.rootGroup(rootStart,p[0]-.025,p[2]);
 }
 else if(type==='rock')for(let j=0;j<3;j++){const R=j?.16+r()*.12:.42;g.ellipsoid([j?(r()-.5)*.8:0,R*.32,j?(r()-.5)*.7:0],[R*1.15,R*.67,R*.85],rgb(['#a9aaa0','#9b9e91','#b4b1a1'][variant]),24,14,.34,variant+7+j);}
 else if(type==='log'){
  g.part=1;g.curve([[-.70,.13,0],[-.2,.20,.05],[.35,.24,-.01],[.80,.31,.09]],.14,.095,bark,16,{part:2,color:rgb('#bea983')});g.curve([[-.04,.21,.03],[.04,.42,.18],[.13,.55,.35]],.047,.009,bark,9);g.curve([[.36,.25,0],[.49,.43,-.15],[.62,.5,-.3]],.035,.006,bark,7);
 }
 else if(type==='crystal')for(let j=0;j<6;j++){const a=r()*TAU,d=r()*.3,h=.28+r()*.55,R=.07+r()*.08,x=Math.cos(a)*d,z=Math.sin(a)*d;g.tube([x,0,z],[x,h,z],R,R,rgb('#c4c6b9'),6);g.tube([x,h,z],[x,h+R*1.8,z],R,0,rgb('#e4e4d7'),6);}
 else return null;
 const material=root.VerdantGraphics.botanicalMaterial(scene,type),mesh=g.mesh('botanical-'+type+'-'+variant,scene,material);mesh.isVisible=false;mesh.metadata={botanical:true,type,variant,roots:g.roots};return mesh;
}
function groundScatter(scene,state){
 const g=new MeshBuilder,r=C.rng(state.seed+' natural ground litter'),anchors=[];
 for(let j=0;j<560;j++){const a=r()*TAU,d=Math.sqrt(r())*(C.RADIUS-.08),x=Math.cos(a)*d,z=Math.sin(a)*d,y=C.heightAt(x,z,state),start=g.p.length/3,stone=state.biome==='desert'||r()<.72,R=.012+r()*.03;
  if(stone){g.part=0;g.ellipsoid([x,y+R*.15,z],[R,R*.48,R*.75],rgb(['#b5b1a0','#91978b','#c3b69e'][j%3]),7,4,.28,j%37);}
  else{g.part=1;const angle=r()*TAU,L=.045+r()*.065;g.blade([x,y+.006,z],[x+Math.cos(angle)*L,y+.008,z+Math.sin(angle)*L],L*.24,rgb(j%2?'#85734d':'#a28c60'),{rows:5,curl:.012,fold:.003});}
  anchors.push({start,count:g.p.length/3-start,x,z,y});
 }
 const material=new B.MultiMaterial('natural floor details',scene);material.subMaterials=[root.VerdantGraphics.scannedMaterial(scene,'weathered mineral','rock_01',1),root.VerdantGraphics.botanicalMaterial(scene,'clover').subMaterials[0]];
 const mesh=g.mesh('mineral grit and fallen leaves',scene,material,true);mesh.receiveShadows=true;mesh.isPickable=false;return{mesh,anchors,base:g.p.slice(),positions:g.p.slice()};
}
root.VerdantBotany={build,MeshBuilder,groundScatter};
})(window);
