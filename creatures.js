(function(root){
  'use strict';
  const B=BABYLON,C=TerrariumCore,TAU=Math.PI*2;
  const rgb=h=>{const c=B.Color3.FromHexString(h);return[c.r,c.g,c.b];};
  const ease=t=>t*t*(3-2*t);
  const FLYERS=new Set(['bee','butterfly','firefly']);
  const {renderScale,animalRadius,animalHeight}=C;
  function create(e,scene,context){
    const G=context.Geometry,node=new B.TransformNode(e.type+'-'+e.id,scene),parts={};
    const material=root.VerdantGraphics?.creatureMaterial(scene,e.type)||context.material;
    function mesh(g,name,parent=node,mat=material){const m=g.mesh(name,scene,mat);m.parent=parent;m.isPickable=true;m.metadata={entityId:e.id};return m;}
    function ball(g,p,r,c,seg=18,rings=12){g.ellipsoid(p,r,rgb(c),seg,rings);}
    function line(g,a,b,r,c){g.tube(a,b,r,r*.75,rgb(c),8);}
    function eyes(parent,positions,size){
      const dark=context.graphics?.detailMaterial(scene,'obsidian','#152019',.10)||context.material;
      for(const p of positions){const g=new G;ball(g,[0,0,0],[size,size,size*.70],'#101b16',18,12);const eye=mesh(g,e.type+' glossy eye',parent,dark);eye.position.set(...p);const shine=new G;ball(shine,[-size*.25,size*.32,-size*.58],[size*.22,size*.22,size*.12],'#fffbed',8,6);mesh(shine,e.type+' eye catchlight',eye);}
    }
    if(e.type==='bee'){
      const g=new G,seg=28,rings=24;
      for(let j=0;j<=rings;j++){const p=j/rings*Math.PI,z=Math.cos(p)*.245,c=rgb((z>.065&&z<.13)||(z>-.12&&z<-.04)?'#3c3830':'#e8bd58');for(let k=0;k<=seg;k++){const a=k/seg*TAU;g.vertex([Math.cos(a)*Math.sin(p)*.157,Math.sin(a)*Math.sin(p)*.145,z+.05],c.map(v=>v*(.94+Math.sin(a)*.06)));}}
      for(let j=0;j<rings;j++)for(let k=0;k<seg;k++){const q=j*(seg+1)+k;g.tri(q,q+1,q+seg+1);g.tri(q+1,q+seg+2,q+seg+1);}
      ball(g,[0,.015,-.215],[.125,.125,.12],'#4b4130',22,14);
      const random=C.rng('bee fuzz '+e.variant);for(let i=0;i<45;i++){const a=random()*TAU,z=-.12+random()*.25;ball(g,[Math.cos(a)*.145,Math.sin(a)*.132,z],[.023,.021,.025],i%5?'#e6c76b':'#e9d79c',6,4);}
      for(const side of[-1,1]){line(g,[side*.045,.10,-.25],[side*.075,.21,-.31],.008,'#54472f');ball(g,[side*.075,.21,-.31],[.013,.014,.012],'#574a32',8,5);for(let j=0;j<3;j++){line(g,[side*.10,-.06,-.11+j*.1],[side*.22,-.18,-.10+j*.1],.010,'#62503b');}ball(g,[side*.19,-.135,.11],[.042,.045,.043],'#d8a34b',12,8);}
      mesh(g,'fuzzy striped bumblebee');eyes(node,[[-.073,.05,-.303],[.073,.05,-.303]],.039);
      const wingMat=context.graphics?.detailMaterial(scene,'bee wing','#d7e8e2',.20,.46)||context.material;parts.wings=[];
      for(const side of[-1,1]){const hinge=new B.TransformNode('bee wing hinge',scene);hinge.parent=node;hinge.position.set(side*.065,.105,-.02);const wg=new G;ball(wg,[side*.145,.015,.035],[.165,.009,.095],'#d7e9e3',24,10);ball(wg,[side*.105,.01,.14],[.12,.007,.068],'#e7eece',20,8);const vein=new G;line(vein,[0,.018,0],[side*.28,.019,.06],.0025,'#adccbd');mesh(wg,'translucent bee wing',hinge,wingMat);mesh(vein,'delicate wing vein',hinge,wingMat);parts.wings.push(hinge);}
    }else if(e.type==='frog'){
      const green=['#798b4b','#8a7753','#687e51'][e.variant],belly='#d8d3a2',g=new G;
      ball(g,[0,.16,.055],[.20,.17,.255],green,24,16);ball(g,[0,.11,-.04],[.165,.10,.215],belly,22,14);ball(g,[0,.265,-.14],[.225,.145,.19],green,26,16);
      for(const side of[-1,1]){ball(g,[side*.18,.105,.17],[.16,.105,.16],green,20,12);line(g,[side*.15,.18,-.12],[side*.26,.065,-.26],.044,green);line(g,[side*.24,.08,.23],[side*.32,.035,.055],.05,green);
        for(let t=0;t<3;t++){const x=side*(.24+t*.045),z=-.31-Math.sin(t/2*Math.PI)*.025;line(g,[side*.26,.05,-.25],[x,.025,z],.012,green);ball(g,[x,.026,z],[.016,.008,.022],'#a7b175',10,6);const zx=.02+t*.04;line(g,[side*.32,.035,.06],[side*(.36+t*.025),.02,zx],.012,green);ball(g,[side*(.36+t*.025),.021,zx],[.024,.008,.030],'#a7b175',10,6);}
        const web=[g.vertex([side*.32,.022,.055],rgb('#a7b175')),g.vertex([side*.36,.022,.02],rgb('#a7b175')),g.vertex([side*.41,.022,.10],rgb('#a7b175'))];g.tri(...web);
        ball(g,[side*.142,.39,-.205],[.088,.084,.065],green,20,14);ball(g,[side*.142,.39,-.252],[.067,.063,.028],'#cabf62',20,12);ball(g,[side*.142,.39,-.277],[.043,.025,.012],'#1f3526',18,12);ball(g,[side*.127,.413,-.285],[.013,.012,.006],'#fff9d7',10,6);ball(g,[side*.065,.29,-.306],[.009,.006,.006],'#4f7c40',8,5);}
      for(let i=0;i<18;i++){const a=i/18*TAU;ball(g,[Math.cos(a)*.14,.30+Math.sin(a)*.022,.09+Math.sin(a)*.14],[.014,.006,.017],i%2?'#b8c884':'#5e914f',8,5);}line(g,[-.11,.222,-.291],[0,.208,-.322],.0045,'#69934f');line(g,[0,.208,-.322],[.11,.222,-.291],.0045,'#69934f');parts.body=mesh(g,'speckled garden frog body');
    }else if(e.type==='bunny'){
      const fur=['#e7d5b6','#c5a482','#aeb6b0'][e.variant],light=e.variant===2?'#eeeadd':'#f3e7ce',pink='#d5b0a1',g=new G;
      ball(g,[0,.245,.10],[.235,.235,.315],fur,28,18);ball(g,[0,.29,-.12],[.19,.205,.205],light,24,16);for(const side of[-1,1])ball(g,[side*.135,.155,.24],[.145,.15,.18],fur,22,14);ball(g,[0,.32,.40],[.095,.095,.09],light,20,14);
      if(e.variant===1){ball(g,[.135,.34,.12],[.12,.085,.17],'#ac825f',20,14);ball(g,[-.12,.29,.25],[.12,.10,.13],'#bb906d',20,12);}parts.body=mesh(g,'plush miniature Holland Lop body');
      const head=new B.TransformNode('bunny head',scene);head.parent=node;head.position.set(0,.49,-.22);parts.head=head;
      const hg=new G;ball(hg,[0,.015,0],[.205,.195,.18],fur,28,18);for(const side of[-1,1])ball(hg,[side*.075,-.065,-.135],[.10,.077,.078],light,20,14);ball(hg,[0,-.032,-.217],[.029,.020,.016],pink,16,10);line(hg,[0,-.05,-.213],[0,-.078,-.212],.0035,'#9d8474');line(hg,[0,-.078,-.212],[-.04,-.09,-.20],.0028,'#a78e7b');line(hg,[0,-.078,-.212],[.04,-.09,-.20],.0028,'#a78e7b');
      for(const side of[-1,1])for(let j=0;j<3;j++)line(hg,[side*.09,-.055,-.185],[side*.29,-.06+(j-1)*.035,-.205+(j-1)*.015],.0019,'#f6edd9');mesh(hg,'soft bunny cheeks and nose',head);eyes(head,[[-.142,.071,-.12],[.142,.071,-.12]],.040);
      parts.ears=[];for(const side of[-1,1]){const ear=new B.TransformNode('floppy lop ear',scene);ear.parent=head;ear.position.set(side*.16,.10,.015);const eg=new G,ig=new G,steps=16,segments=12;
        for(let j=0;j<=steps;j++){const t=j/steps,wide=.025+Math.sin(Math.PI*t)**.6*.070,thick=.018+Math.sin(Math.PI*t)*.014;for(let k=0;k<=segments;k++){const a=k/segments*TAU;eg.vertex([side*(t*.135+Math.sin(Math.PI*t)*.045)+Math.cos(a)*wide,-t*.395,.022*Math.sin(t*Math.PI)+Math.sin(a)*thick],rgb(fur));}}
        for(let j=0;j<steps;j++)for(let k=0;k<segments;k++){const q=j*(segments+1)+k;eg.tri(q,q+1,q+segments+1);eg.tri(q+1,q+segments+2,q+segments+1);}for(let j=2;j<15;j++){const t=j/steps,p=[side*(t*.135+Math.sin(Math.PI*t)*.045),-t*.395,.022*Math.sin(t*Math.PI)-.033];ball(ig,p,[.024+Math.sin(t*Math.PI)*.018,.018,.004],pink,10,6);}mesh(eg,'long velvet lop ear',ear);mesh(ig,'soft pink inner ear',ear);parts.ears.push(ear);}
      parts.feet=[];for(const side of[-1,1])for(const back of[false,true]){const foot=new B.TransformNode('bunny paw',scene);foot.parent=node;foot.position.set(side*(back?.18:.11),.055,back?.23:-.22);const fg=new G;ball(fg,[0,0,0],[back?.10:.068,.049,back?.15:.11],light,18,12);for(let t=0;t<2;t++)line(fg,[(t-.5)*.025,.035,-.07],[(t-.5)*.025,.038,-.10],.0025,'#cebfaa');mesh(fg,'tiny soft bunny paw',foot);parts.feet.push(foot);}
    }
    for(const m of node.getChildMeshes()){m.isPickable=true;m.metadata={entityId:e.id};if(m.name.includes('body')||m.name.includes('frog body')||m.name.includes('bumblebee'))context.shadow.addShadowCaster(m);}
    node.rotation.y=e.rotation||0;node.position.set(e.x,C.heightAt(e.x,e.z,context.state)+(e.type==='bunny'?.005:.05),e.z);node.scaling.setAll(renderScale(e));
    return{root:node,entity:e,parts,custom:true,time:e.phase,anchorX:e.x,anchorZ:e.z,x:e.x,z:e.z,baseY:node.position.y};
  }
  // Use rendered plant bounds so growth, scale, and rotation affect clearance.
  function animalObstacles(v,s,world,flight=false){
    const obstacles=[],floor=C.heightAt(v.x,v.z,s),fallback={fern:1.4,moss:.85,clover:.85,flower:.82,mushroom:.80,tree:1.3,grass:.78,cactus:.58,succulent:.70,rock:.80,log:1.0,crystal:.65};
    for(const e of s.entities){
      if(e.id===v.entity.id)continue;
      const visual=world.visuals?.get(e.id),mesh=visual?.root,position=mesh?.position||e;
      if(C.ELEMENTS[e.type]?.creature){
        const flying=FLYERS.has(e.type),r=animalRadius(e),h=animalHeight(e),y=position.y??C.heightAt(e.x,e.z,s),minY=flying?y-h:y,maxY=y+h;
        if(!flight&&(minY>floor+animalHeight(v.entity)+.35||maxY<floor))continue;
        obstacles.push({id:e.id,minX:position.x-r,maxX:position.x+r,minZ:(position.z??e.z)-r,maxZ:(position.z??e.z)+r,minY,maxY});
      }else if(mesh?.getBoundingInfo){
        let bounds=world.navigationBounds?.get(e.id);
        if(!bounds){mesh.computeWorldMatrix(true);const box=mesh.getBoundingInfo().boundingBox;bounds={id:e.id,minX:box.minimumWorld.x,maxX:box.maximumWorld.x,minZ:box.minimumWorld.z,maxZ:box.maximumWorld.z,minY:box.minimumWorld.y,maxY:box.maximumWorld.y};world.navigationBounds?.set(e.id,bounds);}
        obstacles.push(bounds);
      }else if(fallback[e.type]){
        const r=fallback[e.type]*e.scale*(C.ELEMENTS[e.type]?.category==='plants'?e.growth:1);
        const floor=C.heightAt(e.x,e.z,s),height=({fern:1.2,moss:.32,clover:.65,flower:1.2,mushroom:.9,tree:3,grass:1.1,cactus:1.7,succulent:.7,rock:.9,log:.8,crystal:1.2}[e.type]||1)*e.scale*(C.ELEMENTS[e.type]?.category==='plants'?e.growth:1);obstacles.push({id:e.id,minX:e.x-r,maxX:e.x+r,minZ:e.z-r,maxZ:e.z+r,minY:floor,maxY:floor+height});
      }
    }
    const reach=Math.max(flight?1.5:1.6,renderScale(v.entity)*1.3)+animalRadius(v.entity);
    return obstacles.filter(o=>Math.hypot(Math.max(o.minX-v.x,v.x-o.maxX,0),Math.max(o.minZ-v.z,v.z-o.maxZ,0))<=reach);
  }
  function clearance2D(x,z,o,padding){
    const dx=Math.max(o.minX-x,x-o.maxX),dz=Math.max(o.minZ-z,z-o.maxZ);
    return (dx>0||dz>0?Math.hypot(Math.max(0,dx),Math.max(0,dz)):Math.max(dx,dz))-padding;
  }
  function groundPath(v,x,z,s,obstacles){
    const steps=Math.max(2,Math.ceil(Math.hypot(x-v.x,z-v.z)/.055)),paw=animalRadius(v.entity)+.02;
    let previous=C.heightAt(v.x,v.z,s),previousRadius=Math.hypot(v.x,v.z)+paw,terrainPenalty=C.terrainPenalty(v.entity,v.x,v.z,s);const clearances=obstacles.map(o=>clearance2D(v.x,v.z,o,paw));
    for(let i=1;i<=steps;i++){
      const f=i/steps,px=v.x+(x-v.x)*f,pz=v.z+(z-v.z)*f,h=C.heightAt(px,pz,s);
      const radius=Math.hypot(px,pz)+paw;if((radius>4.7&&(previousRadius<=4.7||radius>previousRadius+1e-8))||Math.abs(h-previous)>.10)return false;previousRadius=radius;
      const penalty=C.terrainPenalty(v.entity,px,pz,s);if(penalty>1e-8&&(terrainPenalty<=1e-8||penalty>terrainPenalty+1e-6))return false;terrainPenalty=penalty;
      for(let j=0;j<obstacles.length;j++){
        const clearance=clearance2D(px,pz,obstacles[j],paw);
        // A newly planted or moved object may enclose an animal: permit escape only.
        if(clearance<0&&(clearances[j]>=0||clearance<clearances[j]-.00001))return false;
        clearances[j]=clearance;
      }
      previous=h;
    }
    return true;
  }
  function animateBunny(v,delta,s,world){
    if(!delta)return;
    const e=v.entity,p=v.parts,scale=e.scale*.55,obstacles=animalObstacles(v,s,world);
    const b=v.bunny||(v.bunny={random:C.rng(s.seed+' bunny behavior '+e.id+' '+e.phase),mode:'idle',style:'sniff',elapsed:0,duration:.8+(C.hash(s.seed+' '+e.id)%1000)/500,remaining:0,earVelocity:[0,0],twitch:0,nextTwitch:v.time+2});
    const rest=()=>{const food=C.habitatTarget({...e,x:v.x,z:v.z},s),edge=obstacles.find(o=>o.id===food.id);b.mode='idle';b.elapsed=0;b.style=edge&&['clover','grass','moss'].includes(food.type)&&clearance2D(v.x,v.z,edge,.52*scale)<.25?'graze':b.random()<.38?'rest':'sniff';b.duration=b.style==='graze'?2+b.random()*3:1.2+b.random()*2.5;if(world.night>.7){b.style='rest';b.duration*=1.6;}};
    const plan=()=>{
      const target=C.habitatTarget({...e,x:v.x,z:v.z},s),toward=Math.atan2(target.z-v.z,target.x-v.x),near=Math.hypot(target.x-v.x,target.z-v.z)<.38;
      for(let attempt=0;attempt<12;attempt++){
        const angle=near||attempt>5?b.random()*TAU:toward+(b.random()-.5)*(attempt<3?1.1:3.8),distance=(.20+b.random()*.28)*Math.max(.6,e.scale/.9),x=v.x+Math.cos(angle)*distance,z=v.z+Math.sin(angle)*distance;
        if(!groundPath(v,x,z,s,obstacles))continue;
        b.fromX=v.x;b.fromZ=v.z;b.toX=x;b.toZ=z;b.yaw=Math.atan2(-(x-v.x),-(z-v.z));b.mode='prepare';b.elapsed=0;b.duration=.16+b.random()*.10;b.hopDuration=.32+b.random()*.12;b.height=(.065+b.random()*.045)*(scale/.495);return true;
      }
      rest();b.style='sniff';b.duration=.8+b.random();return false;
    };
    // Stable small steps keep the ear springs and landings consistent at 20x time.
    if(b.mode==='idle'&&obstacles.some(o=>clearance2D(v.x,v.z,o,.52*scale+.015)<-.005))b.duration=Math.min(b.duration,b.elapsed+.05);
    for(let remaining=delta;remaining>1e-8;){
      const step=Math.min(remaining,1/60);remaining-=step;b.elapsed+=step;
      if(b.elapsed>=b.duration){
        if(b.mode==='idle'){b.remaining=1+Math.floor(b.random()*3);plan();}
        else if(b.mode==='prepare'){b.mode='hop';b.elapsed=0;b.duration=b.hopDuration;}
        else if(b.mode==='hop'){if(groundPath(v,b.toX,b.toZ,s,obstacles)){v.x=b.toX;v.z=b.toZ;b.mode='land';b.elapsed=0;b.duration=.18+b.random()*.10;}else rest();}
        else if(--b.remaining>0)plan();else rest();
      }
      const u=C.clamp(b.elapsed/b.duration),hopping=b.mode==='hop',preparing=b.mode==='prepare',landing=b.mode==='land';
      if(hopping){
        const f=ease(u),x=b.fromX+(b.toX-b.fromX)*f,z=b.fromZ+(b.toZ-b.fromZ)*f;
        // Recheck after pond, terrain, or decoration edits during a hop.
        if(groundPath(v,x,z,s,obstacles)){v.x=x;v.z=z;}else{b.remaining=0;rest();}
      }
      const air=b.mode==='hop'?Math.sin(u*Math.PI):0,crouch=preparing?-.10*ease(u):landing?-.12*Math.sin(u*Math.PI):hopping?-.10*(1-ease(Math.min(1,u/.22)))+.05*air:0;
      if(preparing||hopping){const diff=Math.atan2(Math.sin(b.yaw-v.root.rotation.y),Math.cos(b.yaw-v.root.rotation.y));v.root.rotation.y+=diff*(1-Math.exp(-step*12));}
      v.root.scaling.set(scale*(1-crouch*.35),scale*(1+crouch),scale*(1-crouch*.25));v.root.rotation.x=-air*.10;
      v.baseY=C.heightAt(v.x,v.z,s)+.005;v.root.position.set(v.x,v.baseY+air*(b.height||0),v.z);
      const grazing=b.mode==='idle'&&b.style==='graze',sniffing=b.mode==='idle'&&b.style==='sniff',blend=1-Math.exp(-step*8);
      const headPitch=grazing?-.48+Math.sin(v.time*7.5)*.045:sniffing?-.10+Math.sin(v.time*5.2)*.06:-.02-air*.12;
      p.head.rotation.x+=(headPitch-p.head.rotation.x)*blend;p.head.rotation.y+=((sniffing?Math.sin(v.time*1.7)*.14:0)-p.head.rotation.y)*blend;p.head.position.y+=((grazing?.435:.49)-p.head.position.y)*blend;
      if(p.body)p.body.scaling.y=1+Math.sin(v.time*(b.style==='rest'?2.5:3.3))*.012;
      if(v.time>=b.nextTwitch){b.twitch=1;b.nextTwitch=v.time+3+b.random()*5;}b.twitch*=Math.exp(-step*11);
      for(let i=0;i<p.ears.length;i++){const ear=p.ears[i],goal=-p.head.rotation.x*.5+air*.16;b.earVelocity[i]+=(70*(goal-ear.rotation.x)-13*b.earVelocity[i])*step;ear.rotation.x+=b.earVelocity[i]*step;ear.rotation.z=(i===0?-1:1)*(.045+air*.11+b.twitch*(i===0?.14:.06));}
      for(let i=0;i<p.feet.length;i++){const foot=p.feet[i],hind=i%2===1;foot.rotation.x=air*(hind?-.50:.36);foot.position.y=.055+air*(hind?.025:.055);}
    }
  }
  function canPlace(e,s,world){
    const radius=animalRadius(e)+.025,ground=C.heightAt(e.x,e.z,s),flight=FLYERS.has(e.type),v={entity:e,x:e.x,z:e.z},obstacles=animalObstacles(v,s,world,flight);
    if(Math.hypot(e.x,e.z)+radius>4.7)return{ok:false,reason:'Leave a little room between this animal and the glass.'};
    if(!flight){
      for(const [dx,dz]of[[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]]){const h=C.heightAt(e.x+dx,e.z+dz,s);if(h<s.water+.025||Math.abs(h-ground)>.12*(e.scale/.9))return{ok:false,reason:'Choose a dry, gentler patch for this animal.'};}
      if(obstacles.some(o=>clearance2D(e.x,e.z,o,radius)<0))return{ok:false,reason:'Give this animal space beside plants, objects, and other animals.'};
      return{ok:true,y:ground+.007};
    }
    let y=Math.max(ground,s.water)+Math.max(e.type==='butterfly'?1.15:.75,radius+.08);
    for(let pass=0;pass<obstacles.length+1;pass++){
      let raised=false;for(const o of obstacles)if(clearance3D(e.x,y,e.z,o,radius)<0){y=o.maxY+radius+.08;raised=true;}
      if(!raised)break;
    }
    if(y+radius>3.9)return{ok:false,reason:'Choose a spot with more clear air above the plants.'};
    return{ok:true,y};
  }
  function reset(v,s,world={}){
    const e=v.entity;v.x=v.anchorX=e.x;v.z=v.anchorZ=e.z;v.bunny=v.motion=v.flight=undefined;v.hopIndex=undefined;
    const free=FLYERS.has(e.type)?canPlace(e,s,world):null;v.y=free?.ok?free.y:C.heightAt(e.x,e.z,s)+(FLYERS.has(e.type)?(e.type==='butterfly'?1.15:.75):.007);v.baseY=v.y;
    v.root.position.set(v.x,v.y,v.z);v.root.rotation.set(0,e.rotation||0,0);v.root.scaling.setAll(renderScale(e));
  }
  function animateGround(v,delta,s,world){
    const e=v.entity,p=v.parts||{},frog=e.type==='frog',snail=e.type==='snail',scale=renderScale(e),obstacles=animalObstacles(v,s,world),radius=animalRadius(e)+.02;
    const m=v.motion||(v.motion={random:C.rng(s.seed+' '+e.type+' motion '+e.id),mode:'idle',elapsed:0,duration:.9+(C.hash(e.id+' '+e.phase)%1000)/500});
    const rest=()=>{m.mode='idle';m.elapsed=0;m.duration=(frog?1.5:snail?.8:.7)+m.random()*(frog?3.5:2);if(world.night>.7&&!frog&&!snail)m.duration*=2;};
    const plan=()=>{
      const target=C.habitatTarget({...e,x:v.x,z:v.z},s),toward=Math.atan2(target.z-v.z,target.x-v.x),near=Math.hypot(target.x-v.x,target.z-v.z)<.35;
      for(let attempt=0;attempt<18;attempt++){
        const angle=near||attempt>7?m.random()*TAU:toward+(m.random()-.5)*(attempt<4?1.2:4),length=(frog?.35+m.random()*.34:snail?.12+m.random()*.14:.18+m.random()*.30)*scale,x=v.x+Math.cos(angle)*length,z=v.z+Math.sin(angle)*length;
        if(!groundPath(v,x,z,s,obstacles))continue;
        m.fromX=v.x;m.fromZ=v.z;m.toX=x;m.toZ=z;m.yaw=Math.atan2(-(x-v.x),-(z-v.z));m.mode='turn';m.elapsed=0;m.duration=frog?.18+m.random()*.12:snail?.65+m.random()*.5:.28+m.random()*.25;
        m.travelDuration=frog?.34+m.random()*.12:length/(snail?.035+m.random()*.015:.13+m.random()*.07);m.height=(.16+m.random()*.08)*scale;return;
      }
      rest();m.duration=.6+m.random();
    };
    if(m.mode==='idle'&&obstacles.some(o=>clearance2D(v.x,v.z,o,radius)<-.005))m.duration=Math.min(m.duration,m.elapsed+.05);
    for(let remaining=delta;remaining>1e-8;){
      const step=Math.min(remaining,1/60);remaining-=step;m.elapsed+=step;
      if(m.elapsed>=m.duration){
        if(m.mode==='idle')plan();
        else if(m.mode==='turn'){m.mode=frog?'hop':'crawl';m.elapsed=0;m.duration=m.travelDuration;}
        else if(m.mode==='hop'||m.mode==='crawl'){
          if(groundPath(v,m.toX,m.toZ,s,obstacles)){v.x=m.toX;v.z=m.toZ;}
          if(frog){m.mode='land';m.elapsed=0;m.duration=.20;m.landHeight=0;}else rest();
        }else rest();
      }
      let u=C.clamp(m.elapsed/m.duration),moving=m.mode==='hop'||m.mode==='crawl';
      if(moving){
        const f=ease(u),x=m.fromX+(m.toX-m.fromX)*f,z=m.fromZ+(m.toZ-m.fromZ)*f;
        if(groundPath(v,x,z,s,obstacles)){v.x=x;v.z=z;}
        else if(frog){m.landHeight=Math.max(0,v.root.position.y-C.heightAt(v.x,v.z,s)-.007);m.mode='land';m.elapsed=0;m.duration=.16;u=0;}else rest();
      }
      const hopping=m.mode==='hop',landing=m.mode==='land',turning=m.mode==='turn',air=hopping?Math.sin(u*Math.PI)*m.height:landing?(m.landHeight||0)*(1-ease(u)):0;
      if(turning||moving){const diff=Math.atan2(Math.sin(m.yaw-v.root.rotation.y),Math.cos(m.yaw-v.root.rotation.y));v.root.rotation.y+=diff*(1-Math.exp(-step*(snail?3:9)));}
      const squash=frog?(turning?-.12*ease(u):hopping?-.12*(1-ease(Math.min(u/.2,1)))+.06*Math.sin(u*Math.PI):landing?-.14*Math.sin(u*Math.PI):0):0;
      v.root.scaling.set(scale*(1-squash*.25),scale*(1+squash),scale*(1-squash*.2));v.root.rotation.x=hopping?-.12*Math.sin(u*Math.PI):0;v.root.rotation.z=!frog&&m.mode==='crawl'?Math.sin(v.time*(snail?2:17))*.008:0;
      v.y=C.heightAt(v.x,v.z,s)+.007+air;v.root.position.set(v.x,v.y,v.z);
      if(p.body)p.body.scaling.y=1+Math.sin(v.time*2.8)*.016;
    }
  }
  function clearance3D(x,y,z,o,r){
    const distances=[Math.max(o.minX-x,x-o.maxX),Math.max(o.minY-y,y-o.maxY),Math.max(o.minZ-z,z-o.maxZ)];
    return (distances.some(d=>d>0)?Math.hypot(...distances.map(d=>Math.max(0,d))):Math.max(...distances))-r;
  }
  function airPath(v,x,y,z,s,obstacles){
    const r=animalRadius(v.entity)+.025,steps=Math.max(2,Math.ceil(Math.hypot(x-v.x,y-v.y,z-v.z)/.07));
    const limits=(px,py,pz)=>[4.7-Math.hypot(px,pz)-r,3.9-py-r,py-Math.max(C.heightAt(px,pz,s),s.water)-r-.04];
    let boundaries=limits(v.x,v.y,v.z);const clearances=obstacles.map(o=>clearance3D(v.x,v.y,v.z,o,r));
    for(let i=1;i<=steps;i++){
      const f=i/steps,px=v.x+(x-v.x)*f,py=v.y+(y-v.y)*f,pz=v.z+(z-v.z)*f,next=limits(px,py,pz);
      for(let j=0;j<next.length;j++)if(next[j]<0&&(boundaries[j]>=0||next[j]<boundaries[j]-1e-8))return false;boundaries=next;
      for(let j=0;j<obstacles.length;j++){const clearance=clearance3D(px,py,pz,obstacles[j],r);if(clearance<0&&(clearances[j]>=0||clearance<clearances[j]-1e-8))return false;clearances[j]=clearance;}
    }
    return true;
  }
  function animateFlight(v,delta,s,world){
    const e=v.entity,p=v.parts||{},scale=renderScale(e),radius=animalRadius(e)+.025,obstacles=animalObstacles(v,s,world,true),speed=(e.type==='bee'?.62:e.type==='butterfly'?.45:.26)*Math.max(.65,scale);
    if(!Number.isFinite(v.y))v.y=v.root.position.y;
    const f=v.flight||(v.flight={random:C.rng(s.seed+' '+e.type+' flight '+e.id),elapsed:10,duration:0,vx:0,vy:0,vz:0,goal:{x:v.x,y:v.y,z:v.z}});
    const plan=()=>{
      const target=C.habitatTarget({...e,x:v.x,z:v.z},s),box=obstacles.find(o=>o.id===target.id),flower=target.type==='flower',near=flower&&Math.hypot(target.x-v.x,target.z-v.z)<.75;
      for(let attempt=0;attempt<22;attempt++){
        let x,y,z;
        if(flower&&attempt<5){const jitter=near?.12:.22;x=target.x+(f.random()-.5)*jitter;z=target.z+(f.random()-.5)*jitter;y=(box?.maxY??C.heightAt(x,z,s)+.8)+radius+.10+(f.random()-.5)*.08;}
        else{const angle=f.random()*TAU,length=.25+f.random()*.9;x=v.x+Math.cos(angle)*length;z=v.z+Math.sin(angle)*length;y=v.y+(f.random()-.35)*.9;}
        y=Math.min(3.9-radius,Math.max(Math.max(C.heightAt(x,z,s),s.water)+radius+.08,y));
        const distance=Math.hypot(x-v.x,y-v.y,z-v.z),reach=Math.min(1,1.1/Math.max(distance,.001));x=v.x+(x-v.x)*reach;y=v.y+(y-v.y)*reach;z=v.z+(z-v.z)*reach;
        if(!airPath(v,x,y,z,s,obstacles))continue;
        f.goal={x,y,z};f.elapsed=0;f.duration=near?1+f.random()*1.8:1.5+f.random()*2;f.hover=near;return;
      }
      f.goal={x:v.x,y:v.y,z:v.z};f.elapsed=0;f.duration=.35;f.hover=true;
    };
    for(let remaining=delta;remaining>1e-8;){
      const step=Math.min(remaining,1/60);remaining-=step;f.elapsed+=step;
      const dx=f.goal.x-v.x,dy=f.goal.y-v.y,dz=f.goal.z-v.z,d=Math.hypot(dx,dy,dz);
      if(f.elapsed>=f.duration||d<.045)plan();
      const ax=f.goal.x-v.x,ay=f.goal.y-v.y,az=f.goal.z-v.z,length=Math.hypot(ax,ay,az),magnitude=Math.min(speed,length*2.2),blend=1-Math.exp(-step*3.8),factor=length>.001?magnitude/length:0;
      f.vx+=(ax*factor-f.vx)*blend;f.vy+=(ay*factor-f.vy)*blend;f.vz+=(az*factor-f.vz)*blend;
      const x=v.x+f.vx*step,y=v.y+f.vy*step,z=v.z+f.vz*step;
      if(airPath(v,x,y,z,s,obstacles)){v.x=x;v.y=y;v.z=z;}
      else{f.vx=f.vy=f.vz=0;f.elapsed=f.duration;}
      if(Math.hypot(f.vx,f.vz)>.01){const desired=Math.atan2(-f.vx,-f.vz),diff=Math.atan2(Math.sin(desired-v.root.rotation.y),Math.cos(desired-v.root.rotation.y));v.root.rotation.y+=diff*(1-Math.exp(-step*7));v.root.rotation.z+=(-diff*.12-v.root.rotation.z)*(1-Math.exp(-step*5));}
      v.root.rotation.x+=(-f.vy*.20-v.root.rotation.x)*(1-Math.exp(-step*4));v.root.position.set(v.x,v.y,v.z);
    }
    const wings=p.wings||v.wings||[];
    for(let i=0;i<wings.length;i++)wings[i].rotation.z=(i===0?-1:1)*(e.type==='bee'?.40+Math.sin(v.time*49+e.phase)*.56:.30+Math.sin(v.time*(world.night>.7?5:15)+e.phase)*.75);
    if(v.lantern)v.lantern.material.emissiveColor=B.Color3.FromHexString('#e1d987').scale(.10+world.night*1.4);
  }
  function animate(v,dt,s,world){
    const e=v.entity,delta=s.paused||(s.careMode==='pet'&&!s.careState.alive)?0:Math.min(Math.max(dt,0),.05)*Math.sqrt(s.speed);
    if(!delta||world.motionReduced)return;
    if(!Number.isFinite(v.x)){v.x=e.x;v.z=e.z;}if(!Number.isFinite(v.time))v.time=e.phase||0;v.time+=delta;
    if(e.type==='bunny')animateBunny(v,delta,s,world);
    else if(FLYERS.has(e.type))animateFlight(v,delta,s,world);
    else animateGround(v,delta,s,world);
  }
  root.VerdantCreatures={create,animate,reset,renderScale,canPlace};
})(window);
