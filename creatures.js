(function(root){
  'use strict';
  const B=BABYLON,C=TerrariumCore,TAU=Math.PI*2;
  const rgb=h=>{const c=B.Color3.FromHexString(h);return[c.r,c.g,c.b];};
  const ease=t=>t*t*(3-2*t);
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
      const green=['#81aa55','#72a865','#a0b75f'][e.variant],belly='#e4e0a3',g=new G;
      ball(g,[0,.16,.055],[.20,.17,.255],green,24,16);ball(g,[0,.11,-.04],[.165,.10,.215],belly,22,14);ball(g,[0,.265,-.14],[.225,.145,.19],green,26,16);
      for(const side of[-1,1]){ball(g,[side*.18,.105,.17],[.16,.105,.16],green,20,12);line(g,[side*.15,.18,-.12],[side*.26,.065,-.26],.044,green);line(g,[side*.24,.08,.23],[side*.32,.035,.055],.05,green);
        for(let t=0;t<3;t++){const x=side*(.24+t*.045),z=-.31-Math.sin(t/2*Math.PI)*.025;line(g,[side*.26,.05,-.25],[x,.025,z],.012,green);ball(g,[x,.026,z],[.021,.010,.021],'#b4c275',10,6);const zx=.02+t*.04;line(g,[side*.32,.035,.06],[side*(.36+t*.025),.02,zx],.012,green);ball(g,[side*(.36+t*.025),.021,zx],[.020,.010,.020],'#b2c47b',10,6);}
        ball(g,[side*.142,.39,-.205],[.088,.084,.065],green,20,14);ball(g,[side*.142,.39,-.252],[.067,.063,.028],'#cabf62',20,12);ball(g,[side*.142,.39,-.277],[.043,.025,.012],'#1f3526',18,12);ball(g,[side*.127,.413,-.285],[.013,.012,.006],'#fff9d7',10,6);ball(g,[side*.065,.29,-.306],[.009,.006,.006],'#4f7c40',8,5);}
      for(let i=0;i<18;i++){const a=i/18*TAU;ball(g,[Math.cos(a)*.14,.30+Math.sin(a)*.022,.09+Math.sin(a)*.14],[.014,.006,.017],i%2?'#b8c884':'#5e914f',8,5);}line(g,[-.11,.222,-.291],[0,.208,-.322],.0045,'#69934f');line(g,[0,.208,-.322],[.11,.222,-.291],.0045,'#69934f');mesh(g,'bright little tree frog');
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
    for(const m of node.getChildMeshes()){m.isPickable=true;m.metadata={entityId:e.id};if(m.name.includes('body')||m.name.includes('tree frog')||m.name.includes('bumblebee'))context.shadow.addShadowCaster(m);}
    node.rotation.y=e.rotation||0;node.position.set(e.x,C.heightAt(e.x,e.z,context.state)+(e.type==='bunny'?.005:.05),e.z);node.scaling.setAll(e.scale*(e.type==='bunny'?.55:1));
    return{root:node,entity:e,parts,custom:true,time:e.phase,anchorX:e.x,anchorZ:e.z,x:e.x,z:e.z,baseY:node.position.y};
  }
  // Use rendered plant bounds so growth, scale, and rotation affect clearance.
  function bunnyObstacles(v,s,world){
    const obstacles=[],fallback={fern:1.4,moss:.85,clover:.85,flower:.82,mushroom:.80,tree:1.3,grass:.78,cactus:.58,succulent:.70,rock:.80,log:1.0,crystal:.65};
    for(const e of s.entities){
      if(e.id===v.entity.id||['bee','butterfly','firefly'].includes(e.type))continue;
      const visual=world.visuals?.get(e.id),mesh=visual?.root,position=mesh?.position||e;
      if(C.ELEMENTS[e.type]?.creature){
        if(position.y>C.heightAt(v.x,v.z,s)+.7*v.entity.scale*.55+.1)continue;
        const r=(e.type==='bunny'?.52*.55:e.type==='frog'?.40:.25)*e.scale;
        obstacles.push({id:e.id,minX:position.x-r,maxX:position.x+r,minZ:(position.z??e.z)-r,maxZ:(position.z??e.z)+r});
      }else if(mesh?.getBoundingInfo){
        mesh.computeWorldMatrix(true);const box=mesh.getBoundingInfo().boundingBox;
        obstacles.push({id:e.id,minX:box.minimumWorld.x,maxX:box.maximumWorld.x,minZ:box.minimumWorld.z,maxZ:box.maximumWorld.z});
      }else if(fallback[e.type]){
        const r=fallback[e.type]*e.scale*(C.ELEMENTS[e.type]?.category==='plants'?e.growth:1);
        obstacles.push({id:e.id,minX:e.x-r,maxX:e.x+r,minZ:e.z-r,maxZ:e.z+r});
      }
    }
    return obstacles;
  }
  function bunnyClearance(x,z,o,padding){
    const dx=Math.max(o.minX-x,x-o.maxX),dz=Math.max(o.minZ-z,z-o.maxZ);
    return (dx>0||dz>0?Math.hypot(Math.max(0,dx),Math.max(0,dz)):Math.max(dx,dz))-padding;
  }
  function bunnyPath(v,x,z,s,obstacles){
    const steps=Math.max(2,Math.ceil(Math.hypot(x-v.x,z-v.z)/.055)),paw=.52*v.entity.scale*.55+.02;
    let previous=C.heightAt(v.x,v.z,s);const clearances=obstacles.map(o=>bunnyClearance(v.x,v.z,o,paw));
    for(let i=1;i<=steps;i++){
      const f=i/steps,px=v.x+(x-v.x)*f,pz=v.z+(z-v.z)*f,h=C.heightAt(px,pz,s);
      if(Math.hypot(px,pz)+paw>4.7||Math.abs(h-previous)>.10)return false;
      for(const [dx,dz]of[[0,0],[paw,0],[-paw,0],[0,paw],[0,-paw]]){const ground=C.heightAt(px+dx,pz+dz,s);if(ground<s.water+.025||Math.abs(ground-h)>.12*(v.entity.scale/.9))return false;}
      for(let j=0;j<obstacles.length;j++){
        const clearance=bunnyClearance(px,pz,obstacles[j],paw);
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
    const e=v.entity,p=v.parts,scale=e.scale*.55,obstacles=bunnyObstacles(v,s,world);
    const b=v.bunny||(v.bunny={random:C.rng(s.seed+' bunny behavior '+e.id+' '+e.phase),mode:'idle',style:'sniff',elapsed:0,duration:.8+(C.hash(s.seed+' '+e.id)%1000)/500,remaining:0,earVelocity:[0,0],twitch:0,nextTwitch:v.time+2});
    const rest=()=>{const food=C.habitatTarget({...e,x:v.x,z:v.z},s),edge=obstacles.find(o=>o.id===food.id);b.mode='idle';b.elapsed=0;b.style=edge&&['clover','grass','moss'].includes(food.type)&&bunnyClearance(v.x,v.z,edge,.52*scale)<.25?'graze':b.random()<.38?'rest':'sniff';b.duration=b.style==='graze'?2+b.random()*3:1.2+b.random()*2.5;if(world.night>.7){b.style='rest';b.duration*=1.6;}};
    const plan=()=>{
      const target=C.habitatTarget({...e,x:v.x,z:v.z},s),toward=Math.atan2(target.z-v.z,target.x-v.x),near=Math.hypot(target.x-v.x,target.z-v.z)<.38;
      for(let attempt=0;attempt<12;attempt++){
        const angle=near||attempt>5?b.random()*TAU:toward+(b.random()-.5)*(attempt<3?1.1:3.8),distance=(.20+b.random()*.28)*Math.max(.6,e.scale/.9),x=v.x+Math.cos(angle)*distance,z=v.z+Math.sin(angle)*distance;
        if(!bunnyPath(v,x,z,s,obstacles))continue;
        b.fromX=v.x;b.fromZ=v.z;b.toX=x;b.toZ=z;b.yaw=Math.atan2(-(x-v.x),-(z-v.z));b.mode='prepare';b.elapsed=0;b.duration=.16+b.random()*.10;b.hopDuration=.32+b.random()*.12;b.height=(.065+b.random()*.045)*(scale/.495);return true;
      }
      rest();b.style='sniff';b.duration=.8+b.random();return false;
    };
    // Stable small steps keep the ear springs and landings consistent at 20x time.
    if(b.mode==='idle'&&obstacles.some(o=>bunnyClearance(v.x,v.z,o,.52*scale+.015)<-.005))b.duration=Math.min(b.duration,b.elapsed+.05);
    for(let remaining=delta;remaining>1e-8;){
      const step=Math.min(remaining,1/60);remaining-=step;b.elapsed+=step;
      if(b.elapsed>=b.duration){
        if(b.mode==='idle'){b.remaining=1+Math.floor(b.random()*3);plan();}
        else if(b.mode==='prepare'){b.mode='hop';b.elapsed=0;b.duration=b.hopDuration;}
        else if(b.mode==='hop'){if(bunnyPath(v,b.toX,b.toZ,s,obstacles)){v.x=b.toX;v.z=b.toZ;b.mode='land';b.elapsed=0;b.duration=.18+b.random()*.10;}else rest();}
        else if(--b.remaining>0)plan();else rest();
      }
      const u=C.clamp(b.elapsed/b.duration),hopping=b.mode==='hop',preparing=b.mode==='prepare',landing=b.mode==='land';
      if(hopping){
        const f=ease(u),x=b.fromX+(b.toX-b.fromX)*f,z=b.fromZ+(b.toZ-b.fromZ)*f;
        // Recheck after pond, terrain, or decoration edits during a hop.
        if(bunnyPath(v,x,z,s,obstacles)){v.x=x;v.z=z;}else{b.remaining=0;rest();}
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
  function animate(v,dt,s,world){
    const e=v.entity,p=v.parts,target=C.habitatTarget(e,s),delta=s.paused||(s.careMode==='pet'&&!s.careState.alive)?0:Math.min(dt,.05)*Math.sqrt(s.speed);v.time+=delta;const t=v.time;
    if(e.type==='bunny'){animateBunny(v,delta,s,world);return;}
    v.anchorX+=(target.x-v.anchorX)*Math.min(1,delta*.65);v.anchorZ+=(target.z-v.anchorZ)*Math.min(1,delta*.65);
    let x=v.x,z=v.z,y=C.heightAt(x,z,s),yaw=v.root.rotation.y;
    if(e.type==='bee'){
      x=v.anchorX+Math.sin(t*.75+e.phase)*.43;z=v.anchorZ+Math.cos(t*.61+e.phase)*.40;
      y=target.type==='flower'?C.heightAt(x,z,s)+.70+Math.sin(t*2.2)*.11:C.heightAt(x,z,s)+.95+Math.sin(t*1.8)*.23;
      if(world.night>.75)y=C.heightAt(x,z,s)+.35;for(let i=0;i<p.wings.length;i++)p.wings[i].rotation.z=(i===0?-1:1)*(.40+Math.sin(t*49+e.phase)*.56);v.root.rotation.z=Math.sin(t*.75)*.12;
    }else{
      const period=e.type==='bunny'?4.4:5.5,index=Math.floor(t/period),phase=t/period-index,window=e.type==='bunny'?.23:.19;
      if(v.hopIndex===undefined){v.hopIndex=index;v.startX=v.endX=e.x;v.startZ=v.endZ=e.z;}
      if(index!==v.hopIndex){v.hopIndex=index;v.startX=v.x;v.startZ=v.z;const r=C.rng(e.id+'little hop'+index),tx=v.anchorX+(r()-.5)*.7,tz=v.anchorZ+(r()-.5)*.7,d=Math.hypot(tx-v.x,tz-v.z),step=Math.min(1,d>0?1.05/d:1);v.endX=v.x+(tx-v.x)*step;v.endZ=v.z+(tz-v.z)*step;const rad=Math.hypot(v.endX,v.endZ);if(rad>4.6){v.endX*=4.6/rad;v.endZ*=4.6/rad;}if(C.heightAt(v.endX,v.endZ,s)<s.water+.02){v.endX=v.startX;v.endZ=v.startZ;}}
      const hop=phase<window?phase/window:1,f=ease(hop);x=v.startX+(v.endX-v.startX)*f;z=v.startZ+(v.endZ-v.startZ)*f;
      const perch=e.type==='frog'&&target.type==='tree'&&Math.hypot(x-target.x,z-target.z)<.65?Math.min(1.3,target.growth*1.25):0,baseline=Math.max(s.water+.02,C.heightAt(x,z,s))+perch;
      v.baseY+=(baseline-v.baseY)*Math.min(1,delta*7);y=v.baseY+Math.sin(hop*Math.PI)*(e.type==='bunny'?.25:.43);
      const squash=1-Math.sin(hop*Math.PI)*.10;v.root.scaling.set(e.scale*(2-squash),e.scale*squash,e.scale);
      if(p.head){p.head.rotation.x=phase>window?.08+Math.sin(t*9)*.035:-.08;for(let i=0;i<p.ears.length;i++)p.ears[i].rotation.z=(i===0?-1:1)*(.045+Math.sin(t*2.1)*.025+Math.sin(hop*Math.PI)*.12);for(let i=0;i<p.feet.length;i++)p.feet[i].rotation.x=Math.sin(hop*Math.PI)*(i%2?.4:-.3);}
    }
    const radius=Math.hypot(x,z);if(radius>4.7){x*=4.7/radius;z*=4.7/radius;}
    const moved=Math.hypot(x-v.x,z-v.z);if(moved>.0001){const desired=Math.atan2(-(x-v.x),-(z-v.z)),diff=Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw));yaw+=diff*Math.min(1,delta*7);}
    v.x=x;v.z=z;v.root.rotation.y=yaw;v.root.position.set(x,y,z);
  }
  root.VerdantCreatures={create,animate};
})(window);
