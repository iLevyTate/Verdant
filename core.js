(function(root){
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function rng(seed){let a=typeof seed==='number'?seed:hash(seed);return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function noise(x,z,seed){const xi=Math.floor(x),zi=Math.floor(z),u=x-xi,v=z-zi;const f=t=>t*t*(3-2*t);const r=(a,b)=>{let n=Math.imul(a,374761393)^Math.imul(b,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};return(r(xi,zi)*(1-f(u))+r(xi+1,zi)*f(u))*(1-f(v))+(r(xi,zi+1)*(1-f(u))+r(xi+1,zi+1)*f(u))*f(v);}
  const BIOMES={
    woodland:{name:'Woodland',title:'The quiet woodland',moisture:.68,sun:.65,soil:['#66513a','#88714b','#bda47b'],ground:['#5c8245','#9bb063','#aec079'],pond:true,species:['fern','moss','clover','flower','mushroom','tree']},
    tropical:{name:'Rainforest',title:'Somewhere, it is raining',moisture:.85,sun:.55,soil:['#4b4232','#756242','#ad9566'],ground:['#3e7950','#6f9d54','#91b66b'],pond:true,species:['fern','moss','clover','flower','tree','fern']},
    desert:{name:'Desert',title:'Where the sunlight stays',moisture:.22,sun:.88,soil:['#94704c','#bc986a','#e3c69a'],ground:['#b7a16e','#d2bd87','#e7d3a4'],pond:false,species:['cactus','succulent','grass','flower','cactus','succulent']}
  };
  const ELEMENTS={
    fern:{name:'Maidenhair fern',label:'Fern',category:'plants',description:'Feathery fronds that love a little shade and plenty of moisture.',water:.72,sun:.50,scale:.9},
    moss:{name:'Cushion moss',label:'Moss',category:'plants',description:'A soft green carpet. Grows happily along the edges of a pond.',water:.80,sun:.45,scale:.85},
    clover:{name:'Woodland clover',label:'Clover',category:'plants',description:'Little heart-shaped leaves that spread a bit of quiet good fortune.',water:.62,sun:.65,scale:.8},
    flower:{name:'Meadow flowers',label:'Wildflower',category:'plants',description:'A scattering of delicate blooms. Butterflies will feel right at home.',water:.52,sun:.75,scale:.85},
    mushroom:{name:'Golden mushrooms',label:'Mushroom',category:'plants',description:'Tiny golden umbrellas. A damp, shady corner is their favorite place.',water:.78,sun:.32,scale:.8},
    tree:{name:'Little juniper',label:'Juniper',category:'plants',description:'A miniature tree with a crooked trunk and a wonderfully unruly canopy.',water:.52,sun:.68,scale:1},
    cactus:{name:'Desert cactus',label:'Cactus',category:'plants',description:'A sun-loving soul. Too much water makes this little cactus unhappy.',water:.20,sun:.90,scale:.95},
    succulent:{name:'Rosette succulent',label:'Succulent',category:'plants',description:'Sculptural leaves that store a little water for a sunny day.',water:.28,sun:.82,scale:.8},
    grass:{name:'Golden grass',label:'Grass',category:'plants',description:'Fine golden blades that catch the light and sway in the breeze.',water:.30,sun:.78,scale:.9},
    raise:{name:'Build a little hill',label:'Raise soil',category:'terrain',description:'Drag over the soil to lift a gentle hill. Right-drag to orbit, or use Observe.',tool:true},
    lower:{name:'Find a lower ground',label:'Lower soil',category:'terrain',description:'Carve a hollow into the earth. Low ground may fill with water.',tool:true},
    smooth:{name:'Soften the landscape',label:'Smooth',category:'terrain',description:'Blend peaks and hollows into a softly rolling landscape.',tool:true},
    pond:{name:'A little body of water',label:'Pond',category:'terrain',description:'Carve a basin that fills with water. Ponds slowly replenish soil moisture.',tool:true},
    rock:{name:'River stones',label:'Rocks',category:'terrain',description:'Weathered stones in all shapes and sizes. Every placement is a little different.',decoration:true},
    log:{name:'Fallen branch',label:'Driftwood',category:'terrain',description:'A weathered branch for tiny neighbors to explore.',decoration:true},
    butterfly:{name:'Painted butterfly',label:'Butterfly',category:'life',description:'A small daydream on wings. Flutters among the flowers.',creature:true},
    snail:{name:'Garden snail',label:'Snail',category:'life',description:'A very slow explorer. Happiest when the ground is comfortably damp.',creature:true},
    firefly:{name:'Little firefly',label:'Firefly',category:'life',description:'A wandering spark. Watch your world at night to see it glow.',creature:true},
    bee:{name:'Bumblebee',label:'Bumblebee',category:'life',description:'A round, fuzzy little pollinator. Follows blooms and carries a dusting of golden pollen.',creature:true,scale:.95},
    frog:{name:'Garden frog',label:'Frog',category:'life',description:'A speckled little ground dweller. Takes short hops and rests beside damp moss and pond edges.',creature:true,scale:.9},
    bunny:{name:'Micro Holland Lop',label:'Holland Lop',category:'life',description:'A tiny, soft-footed bunny with floppy ears. Explores clover, grazes, and takes very small hops.',creature:true,scale:.9},
    ladybug:{name:'Spotted ladybug',label:'Ladybug',category:'life',description:'A bright little beetle that wanders through the undergrowth.',creature:true},
    crystal:{name:'Quartz cluster',label:'Crystal',category:'terrain',description:'A little wonder from deep in the earth. Catches the afternoon light.',decoration:true},
    erase:{name:'Make a little space',label:'Remove',category:'terrain',description:'Tap near a plant, creature, or decoration to remove it. Undo brings it back.',tool:true}
  };
  const RADIUS=5.04,GRID_RINGS=32,GRID_SEGMENTS=96,MAX_ENTITIES=220;
  const PLANTS=Object.keys(ELEMENTS).filter(k=>ELEMENTS[k].category==='plants');
  const CREATURES=['bee','frog','bunny','butterfly','snail','firefly','ladybug'];
  const visualHour=s=>s.lighting==='cycle'?s.clock:s.lighting==='night'?21:10.5;
  const COSTS={fern:4,moss:3,clover:3,flower:5,mushroom:4,tree:9,cactus:6,succulent:4,grass:3,rock:2,log:3,crystal:7,bee:8,frog:10,bunny:12,butterfly:8,snail:6,firefly:8,ladybug:6};
  const DISCOVERIES={
    shade:{name:'A secret shade garden',hint:'Plant a fern or moss within 1.5m of a mature tree.',effect:'Tree canopy softens sunlight and slows local drying.',icon:'tree'},
    pollination:{name:'The pollinator patch',hint:'Place a bee or butterfly within 2.4m of a flowering plant.',effect:'Pollinated flowers grow and make seeds faster.',icon:'butterfly'},
    compost:{name:'Life on the forest floor',hint:'Grow mushrooms within 1.4m of driftwood.',effect:'Wood feeds fungi; fungi improve nearby soil.',icon:'mushroom'},
    wetland:{name:'A living shoreline',hint:'Plant moss on dry soil close to the pond waterline.',effect:'Moist shorelines help water-loving plants thrive.',icon:'moss'},
    night:{name:'A lantern in the leaves',hint:'Add a firefly near moss, then choose Moonlight or enable the natural lighting cycle.',effect:'Fireflies gather over moss after dark.',icon:'firefly'}
  };
  const MISSIONS=[
    {id:'roots',title:'Put down roots',text:'Plant three new plants. Your starting plants do not count.',target:3,reward:14,xp:30,unit:'plants'},
    {id:'land',title:'Shape a little possibility',text:'Sculpt the soil, then mist or vent your world.',target:2,reward:16,xp:35,unit:'steps'},
    {id:'neighbors',title:'Good company',text:'Welcome two different kinds of creature.',target:2,reward:20,xp:40,unit:'kinds'},
    {id:'harvest',title:'What you nurture returns',text:'Collect twelve seeds from mature, healthy plants. Try 5× or 20× time.',target:12,reward:20,xp:50,unit:'seeds'},
    {id:'grow',title:'From seedling to sanctuary',text:'Grow two of your own plantings to maturity (80%).',target:2,reward:22,xp:55,unit:'plants'},
    {id:'connections',title:'Better together',text:'Create three habitat discoveries using your own additions. The Field Guide has hints.',target:3,reward:25,xp:60,unit:'discoveries'},
    {id:'diversity',title:'A world of differences',text:'Keep nine different plant and creature species in the same world.',target:9,reward:25,xp:65,unit:'species'},
    {id:'balance',title:'A world that gives back',text:'Keep vitality above 75% for one continuous third of a simulated day.',target:1,reward:40,xp:100,unit:'sanctuary'}
  ];
  const RANKS=[['Seedkeeper',0],['Sprout tender',40],['Garden maker',110],['Habitat keeper',220],['Naturalist',380],['Sanctuary steward',600],['World grower',950]];
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  function profile(seed,biome){
    const r=rng(seed+biome+'landforms-v2'),styles=biome==='desert'?['Dune sea','Rocky oasis','Sunlit ridges']:['Hidden valley','Island garden','Winding creek','Rolling woodland'];
    return{style:styles[Math.floor(r()*styles.length)],angle:r()*Math.PI*2,bend:r()*3+1.4,width:.32+r()*.5,offset:(r()-.5)*1.5,hills:Array.from({length:4},()=>({x:(r()-.5)*7,z:(r()-.5)*7,h:.3+r()*(biome==='tropical'?1.1:.65),r:1.0+r()*2.6}))};
  }
  function terrainHeight(x,z,s){
    const n=hash(s.seed),p=s.landform||profile(s.seed,s.biome),wx=x+(noise(x*.35,z*.35,n+2)-.5)*1.1,wz=z+(noise(x*.35+12,z*.35,n+9)-.5)*1.1;
    let h=.42+noise(wx*.37,wz*.37,n)*.42+noise(wx*.95,wz*.95,n+90)*.15+noise(wx*2.6,wz*2.6,n+789)*.055;
    for(const hill of p.hills)h+=hill.h*Math.exp(-((x-hill.x)**2+(z-hill.z)**2)/hill.r);
    const u=x*Math.cos(p.angle)+z*Math.sin(p.angle),v=-x*Math.sin(p.angle)+z*Math.cos(p.angle),channel=v-Math.sin(u*.62+p.bend)*.72-p.offset;
    if(s.biome==='desert'){h+=Math.sin(u*1.5+noise(x*.45,z*.45,n+4)*2)*.16;if(p.style==='Rocky oasis')h-=.75*Math.exp(-((x-s.pondX)**2+(z-s.pondZ)**2)/1.6);}
    else{
      h-=.94*Math.exp(-((x-s.pondX)**2/2.0+(z-s.pondZ)**2/1.7));
      if(p.style==='Winding creek'||p.style==='Hidden valley')h-=.48*Math.exp(-channel*channel/(p.width*p.width));
      if(p.style==='Island garden')h-=.62*Math.exp(-((x+s.pondX*.75)**2+(z+s.pondZ)**2)/2.4);
    }
    const edge=clamp((Math.hypot(x,z)-4.3)/.74);return clamp(h*(1-edge*.42)+.22*edge,.13,2.7);
  }
  function vertexPoint(index){if(index===0)return{x:0,z:0,ring:0,seg:0};const ring=Math.floor((index-1)/GRID_SEGMENTS)+1,seg=(index-1)%GRID_SEGMENTS,a=seg/GRID_SEGMENTS*Math.PI*2,r=ring/GRID_RINGS*RADIUS;return{x:Math.cos(a)*r,z:Math.sin(a)*r,ring,seg};}
  function sampleGrid(values,x,z){
    const r=clamp(Math.hypot(x,z)/RADIUS)*GRID_RINGS,a=(Math.atan2(z,x)+Math.PI*2)%(Math.PI*2)/(Math.PI*2)*GRID_SEGMENTS,i=Math.floor(r),f=r-i,j=Math.floor(a),t=a-j;
    const get=(ring,seg)=>ring===0?values[0]:values[1+(Math.min(GRID_RINGS,ring)-1)*GRID_SEGMENTS+((seg+GRID_SEGMENTS)%GRID_SEGMENTS)];
    return(get(i,j)*(1-t)+get(i,j+1)*t)*(1-f)+(get(i+1,j)*(1-t)+get(i+1,j+1)*t)*f;
  }
  const heightAt=(x,z,s)=>sampleGrid(s.heights,x,z);
  function initialSoil(s){return s.heights.map((h,i)=>{const p=vertexPoint(i);return clamp(s.moisture+(h<s.water+.3?.16:0)+(noise(p.x,p.z,hash(s.seed)+91)-.5)*.12-(h-1)*.04,.03,.99);});}
  function generate(seed='240816',biome='woodland',mode='journey',careMode='self'){
    if(!Object.hasOwn(BIOMES,biome))biome='woodland';seed=String(seed).slice(0,32)||'240816';const random=rng(seed+biome),bio=BIOMES[biome],landform=profile(seed,biome);
    const water=bio.pond||landform.style==='Rocky oasis'?.52:-.6;
    const s={version:2,seed,biome,day:0,clock:9,moisture:bio.moisture,sun:bio.sun,health:.92,speed:1,paused:false,mode:mode==='sandbox'?'sandbox':'journey',seeds:48,xp:0,mission:0,discoveries:[],seen:[],stats:{planted:0,care:0,sculpted:0,lifeTypes:[],harvested:0,balance:0,bestBalance:0},weather:'auto',lighting:'day',growthRate:12,graphics:'auto',wildGrowth:true,hydroRemainder:0,spreadClock:0,spreadSerial:0,terrainRevision:0,entities:[],heights:[],quests:{plant:false,mist:false,life:false},nextId:1,pondX:1.25+(random()-.5)*1.5,pondZ:-.4+(random()-.5)*1.7,water,baseWater:water,brush:.85,placed:0,landform};
    s.careMode=careMode==='pet'?'pet':'self';s.careState=newCare();s.careUpdatedAt=0;
    for(let i=0;i<=GRID_RINGS*GRID_SEGMENTS;i++){const p=vertexPoint(i);s.heights.push(terrainHeight(p.x,p.z,s));}s.soil=initialSoil(s);
    const add=(type,x,z,scale=1)=>s.entities.push({id:s.nextId++,type,x,z,rotation:random()*Math.PI*2,scale:scale*(.75+random()*.45),growth:.70+random()*.30,health:.85+random()*.15,variant:Math.floor(random()*3),phase:random()*Math.PI*2,origin:'wild',paid:0,harvest:random()*.25});
    for(let i=0;i<38;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*4.5,x=Math.cos(a)*r,z=Math.sin(a)*r;if(heightAt(x,z,s)<s.water+.025)continue;let type=bio.species[Math.floor(random()*bio.species.length)];if(type==='tree'&&s.entities.filter(e=>e.type==='tree').length>3)type='fern';if(type==='tree'&&z<-.6)type='clover';add(type,x,z,ELEMENTS[type].scale);}
    for(let i=0;i<10;i++){const a=random()*Math.PI*2,r=1.8+random()*2.8,x=Math.cos(a)*r,z=Math.sin(a)*r;if(heightAt(x,z,s)>s.water-.05)add('rock',x,z,.55+random()*.8);}
    add('log',-1.2,-1.8,.9);if(biome!=='desert'){add('butterfly',-1,1);add('snail',-.8,-2);add('firefly',2,1);add('bee',1.4,1.6);add('frog',-2,1.8);}else{add('ladybug',-1,1);add('crystal',1.7,.9,.7);}let bunnyX=-2.8,bunnyZ=-1.8;for(let tries=0;tries<20&&heightAt(bunnyX,bunnyZ,s)<s.water+.05;tries++){const a=random()*Math.PI*2;bunnyX=Math.cos(a)*3.8;bunnyZ=Math.sin(a)*3.8;}add('bunny',bunnyX,bunnyZ);s.seen=[...new Set(s.entities.map(e=>e.type))];return s;
  }
  function season(s){if(s.biome==='tropical')return s.day%12<7?{name:'Monsoon',growth:1.1,rain:.16,evap:.8}:{name:'Dry season',growth:1,rain:-.12,evap:1.2};if(s.biome==='desert')return s.day%14<3?{name:'Bloom season',growth:1.15,rain:.05,evap:1}:{name:'Dry season',growth:.85,rain:-.18,evap:1.3};return[{name:'Spring',growth:1.15,rain:.08,evap:.9},{name:'Summer',growth:1.05,rain:-.08,evap:1.2},{name:'Autumn',growth:.95,rain:.12,evap:.85},{name:'Winter',growth:.7,rain:.04,evap:.65}][Math.floor(s.day/6)%4];}
  function weatherAt(s){
    const phase=season(s),stamp=Math.floor((s.day*24+s.clock)/6),roll=rng(s.seed+'weather'+stamp)(),bias=(s.biome==='desert'?-.20:s.biome==='tropical'?.1:0)+phase.rain;
    let kind=roll<.12+bias?'rain':roll<.32+bias?'drizzle':roll<.58+bias?'cloudy':'clear';if(s.weather==='clear'||s.weather==='rain')kind=s.weather;
    const names={clear:'Clear skies',cloudy:'Cloudy',drizzle:'Soft drizzle',rain:'Rain shower'},rain={clear:0,cloudy:0,drizzle:.36,rain:1}[kind],light={clear:1,cloudy:.82,drizzle:.74,rain:.64}[kind];
    return{kind,name:names[kind],rain,light,wind:.35+noise((s.day*24+s.clock)*.12,5,hash(s.seed)+756)*.65,season:phase.name};
  }
  function habitatTarget(e,s){
    if(e.type==='frog'&&s.water>0){
      let shore=null,best=Infinity;
      for(const radius of[0,.5,1,1.8])for(let i=0;i<(radius?16:1);i++){
        const angle=i/16*Math.PI*2,x=e.x+Math.cos(angle)*radius,z=e.z+Math.sin(angle)*radius,h=heightAt(x,z,s);
        if(Math.hypot(x,z)>4.2||h<s.water+.05||h>s.water+.35)continue;
        const score=radius+Math.abs(h-s.water-.16)*2;if(score<best){best=score;shore={type:'shore',x,z,growth:1};}
      }
      if(shore)return shore;
    }
    const preferences=e.type==='bee'||e.type==='butterfly'||e.type==='ladybug'?['flower']:e.type==='bunny'?['clover','grass','moss']:e.type==='frog'?['moss','grass']:e.type==='snail'?['log']:['moss'];
    let target=e,best=e.type==='bee'||e.type==='butterfly'?2.4:3.2;for(const type of preferences){for(const p of s.entities)if(p.type===type){const d=distance(e,p);if(d<best){best=d;target=p;}}if(target!==e)break;}return target;
  }
  function localConditions(x,z,s){
    let shade=0,nutrients=0,pollination=0,wood=0,retention=0;const point={x,z};
    for(const e of s.entities){const d=distance(point,e);if(e.type==='tree'&&d<1.6)shade=Math.max(shade,(1-d/1.6)*.30*Math.min(e.growth,1));if(e.type==='mushroom'&&d<1.4)nutrients+=.10*(1-d/1.4);if(e.type==='log'&&d<1.4)wood=Math.max(wood,(1-d/1.4));if(e.type==='moss'&&d<1)retention+=.035*(1-d);if((e.type==='butterfly'||e.type==='bee')&&d<2.4)pollination=1;}
    const weather=weatherAt(s),h=heightAt(x,z,s),moisture=clamp((s.soil?sampleGrid(s.soil,x,z):s.moisture)+retention+shade*.09),light=clamp(s.sun*weather.light-shade,.04,1);
    return{moisture,light,shade,nutrients:clamp(nutrients+wood*.12,0,.28),wood,pollination,shore:h>=s.water+.015&&h<s.water+.30,submerged:h<s.water+.012};
  }
  function suitability(e,s,conditions){const p=ELEMENTS[e.type];if(!p||p.category!=='plants')return 1;const c=conditions||localConditions(e.x,e.z,s);if(c.submerged)return .12;let fit=1-Math.abs(c.moisture-p.water)*1.25-Math.abs(c.light-p.sun)*.85;if(e.type==='mushroom')fit+=c.wood*.14;return clamp(fit,.05,1);}
  function placement(s,type,x,z,excludeId=null){
    const def=ELEMENTS[type];if(!def||def.tool||!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x,z)>RADIUS-.14)return{ok:false,reason:'Choose a spot inside the glass.'};
    if(excludeId===null&&s.entities.length>=MAX_ENTITIES)return{ok:false,reason:'This world is full. Remove an element to make room.'};
    const conditions=localConditions(x,z,s);if(conditions.submerged&&!['bee','butterfly','firefly','rock','crystal','log'].includes(type))return{ok:false,reason:'Choose dry land or the edge of the pond.',conditions};
    if(!def.creature&&s.entities.some(e=>e.id!==excludeId&&!ELEMENTS[e.type].creature&&Math.hypot(x-e.x,z-e.z)<(type==='tree'?.33:.19)))return{ok:false,reason:'A little more space between roots would help.',conditions};
    const cost=excludeId!==null||s.mode==='sandbox'?0:COSTS[type]||0;if(s.seeds<cost)return{ok:false,reason:'Harvest mature plants for more seeds, or switch to Free build in the Field Guide.',conditions,cost};
    return{ok:true,conditions,cost,fit:suitability({type,x,z},s,conditions)};
  }
  function place(s,type,x,z,options={}){
    const check=placement(s,type,x,z);if(!check.ok)return check;
    const random=rng(s.seed+s.nextId+'placed'),def=ELEMENTS[type],e={id:s.nextId++,type,x,z,rotation:Number.isFinite(options.rotation)?options.rotation:random()*Math.PI*2,scale:(def.scale||1)*clamp(options.size||1,.6,1.5),growth:def.category==='plants'?.40:1,health:.94,variant:Math.floor(random()*3),phase:random()*Math.PI*2,origin:'player',paid:check.cost,harvest:0};
    s.seeds-=check.cost;s.entities.push(e);s.placed++;if(def.category==='plants'){s.stats.planted++;s.quests.plant=true;}if(def.creature){if(!s.stats.lifeTypes.includes(type))s.stats.lifeTypes.push(type);s.quests.life=true;}if(!s.seen.includes(type))s.seen.push(type);return{ok:true,entity:e,events:updateProgress(s)};
  }
  function relocate(s,id,x,z){const e=s.entities.find(e=>e.id===id);if(!e)return{ok:false,reason:'Choose an element to move.'};const check=placement(s,e.type,x,z,id);if(!check.ok)return check;e.x=x;e.z=z;return{ok:true,entity:e,events:updateProgress(s)};}
  function remove(s,id){const i=s.entities.findIndex(e=>e.id===id);if(i<0)return 0;const e=s.entities[i],refund=Math.floor((e.paid||0)*.5);s.seeds=clamp(s.seeds+refund,0,9999);s.entities.splice(i,1);return refund;}
  function sculpt(s,x,z,type,radius,amount=.08){if(!['raise','lower','smooth','pond'].includes(type)||![x,z,radius,amount].every(Number.isFinite)||radius<=0||amount<=0)return false;const source=type==='smooth'?s.heights.slice():null;let changed=false;for(let i=0;i<s.heights.length;i++){const p=vertexPoint(i),r=p.ring/GRID_RINGS*RADIUS,d=Math.hypot(p.x-x,p.z-z);if(d>radius||r>RADIUS-.06)continue;const f=(1-d/radius)**2,old=s.heights[i];if(type==='raise')s.heights[i]=clamp(old+amount*f,.12,2.9);if(type==='lower')s.heights[i]=clamp(old-amount*f,.12,2.9);if(type==='smooth'){const nearby=neighbors(i),average=(source[i]+nearby.reduce((sum,j)=>sum+source[j],0))/(nearby.length+1);s.heights[i]=old+(average-old)*f*.34;}if(type==='pond'){s.water=s.baseWater=Math.max(s.water,.52);s.heights[i]=Math.max(.12,old-(Math.max(.25,old-.19))*f*.5);if(s.soil)s.soil[i]=Math.max(s.soil[i],.80);}if(Math.abs(s.heights[i]-old)>1e-6)changed=true;}if(changed)s.terrainRevision++;return changed;}
  function newCare(){return{food:.95,water:.95,clean:.95,vitality:1,alive:true,ageHours:0};}
  function careStatus(s){const p=s.careState||newCare();if(s.careMode!=='pet')return 'Self-sustaining';if(!p.alive)return 'Life lost';if(p.vitality<.3)return 'Critical';const low=Math.min(p.food,p.water,p.clean);return low<.25?'Needs you':low<.55?'Check in soon':'Content';}
  // Care uses real hours. It is independent of rapid growth, simulation speed, and pause.
  // At most a week needs stepping: an unattended pet has already reached zero by then.
  function advanceCare(s,hours){
    if(!Number.isFinite(hours)||hours<=0)return[];const p=s.careState||(s.careState=newCare());
    if(s.careMode!=='pet'){Object.assign(p,{food:1,water:1,clean:1,vitality:1,alive:true});return[];}
    const wasAlive=p.alive,wasLow=Math.min(p.food,p.water,p.clean)<.25;p.ageHours+=Math.min(hours,87600);
    let remaining=Math.min(hours,168);while(remaining>1e-8&&p.alive){const step=Math.min(.25,remaining);p.food=clamp(p.food-step*.026);p.water=clamp(p.water-step*.032);p.clean=clamp(p.clean-step*.020);const low=Math.min(p.food,p.water,p.clean);p.vitality=clamp(p.vitality+step*(low<.25?-.065*(1-low/.25):low>.35?.045:0));if(p.vitality<=0)p.alive=false;remaining-=step;}
    if(wasAlive&&!p.alive)return[{type:'care',title:'Your little world lost its life. Revive it in Care, or choose Self-sustaining.'}];
    if(!wasLow&&Math.min(p.food,p.water,p.clean)<.25)return[{type:'care',title:'Your little world needs food, water, or a tidy-up.'}];return[];
  }
  function setCareMode(s,mode){if(!['self','pet'].includes(mode))return false;if(s.careMode===mode)return false;s.careMode=mode;s.careState=newCare();s.careUpdatedAt=0;s.health=.9;for(const e of s.entities)e.health=Math.max(e.health,.85);return true;}
  function care(s,type){
    if(type==='revive'){s.careState=newCare();s.careUpdatedAt=0;s.health=.9;for(const e of s.entities)e.health=Math.max(e.health,.85);}
    else if(type==='feed'){s.careState.food=1;}
    else if(type==='tidy'){s.careState.clean=1;}
    else{const change=type==='vent'?-.13:.13;s.soil=s.soil.map(v=>clamp(v+change,.03,.99));s.moisture=s.soil.reduce((a,b)=>a+b,0)/s.soil.length;if(type==='mist')s.careState.water=1;if(type==='vent')s.careState.clean=clamp(s.careState.clean+.2);s.quests.mist=true;}
    if(s.careState.alive&&Math.min(s.careState.food,s.careState.water,s.careState.clean)>.35)s.careState.vitality=clamp(s.careState.vitality+.08);
    s.stats.care++;return updateProgress(s);
  }
  function recordSculpt(s){s.stats.sculpted++;return updateProgress(s);}
  function isReady(e){return ELEMENTS[e.type]?.category==='plants'&&e.growth>=.8&&e.health>=.55&&(e.harvest||0)>=1;}
  function harvest(s,id=null){if(s.careMode==='pet'&&!s.careState.alive)return{seeds:0,count:0,events:[]};let seeds=0,count=0;for(const e of s.entities)if((id===null||e.id===id)&&isReady(e)){e.harvest=0;seeds+=e.type==='tree'?7:e.type==='flower'?5:4;count++;}s.seeds=clamp(s.seeds+seeds,0,9999);s.xp+=count*8;s.stats.harvested+=seeds;return{seeds,count,events:updateProgress(s)};}
  function rank(s){let index=0;for(let i=0;i<RANKS.length;i++)if(s.xp>=RANKS[i][1])index=i;return{level:index+1,name:RANKS[index][0],next:RANKS[index+1]?.[1]||null,progress:RANKS[index+1]?(s.xp-RANKS[index][1])/(RANKS[index+1][1]-RANKS[index][1]):1};}
  function missionProgress(s,index=s.mission){const m=MISSIONS[index];if(!m)return{value:1,target:1,ratio:1};const values={roots:s.stats.planted,land:Math.min(1,s.stats.sculpted)+Math.min(1,s.stats.care),neighbors:s.stats.lifeTypes.length,harvest:s.stats.harvested,grow:s.entities.filter(e=>e.origin==='player'&&ELEMENTS[e.type].category==='plants'&&e.growth>=.8).length,connections:s.discoveries.length,diversity:new Set(s.entities.filter(e=>!ELEMENTS[e.type].decoration).map(e=>e.type)).size,balance:s.stats.bestBalance/(1/3)};const value=clamp(values[m.id]||0,0,m.target);return{value,target:m.target,ratio:clamp(value/m.target)};}
  function updateProgress(s){
    const events=[];for(const e of s.entities){if(!s.seen.includes(e.type))s.seen.push(e.type);if(e.origin!=='player')continue;const c=localConditions(e.x,e.z,s);const checks={shade:['fern','moss'].includes(e.type)&&c.shade>.08,pollination:(e.type==='flower'&&c.pollination)||(['butterfly','bee'].includes(e.type)&&s.entities.some(p=>p.type==='flower'&&distance(p,e)<2.4)),compost:e.type==='mushroom'&&c.wood>.10,wetland:e.type==='moss'&&c.shore,night:e.type==='firefly'&&(visualHour(s)>=19||visualHour(s)<6)&&s.entities.some(p=>p.type==='moss'&&distance(p,e)<2.2)};for(const k of Object.keys(DISCOVERIES))if(checks[k]&&!s.discoveries.includes(k)){s.discoveries.push(k);s.xp+=20;s.seeds=clamp(s.seeds+5,0,9999);events.push({type:'discovery',id:k,title:DISCOVERIES[k].name});}}
    while(s.mission<MISSIONS.length&&missionProgress(s).ratio>=1){const m=MISSIONS[s.mission++];s.xp+=m.xp;s.seeds=clamp(s.seeds+m.reward,0,9999);events.push({type:'mission',title:m.title,reward:m.reward});}return events;
  }
  function neighbors(index){if(index===0)return[1,25,49,73];const {ring,seg}=vertexPoint(index),at=(r,a)=>r===0?0:1+(r-1)*GRID_SEGMENTS+(a+GRID_SEGMENTS)%GRID_SEGMENTS;return[at(ring,seg-1),at(ring,seg+1),at(ring-1,seg),at(Math.min(GRID_RINGS,ring+1),seg)];}
  function hydrology(s,days,weather){
    const old=s.soil,next=old.slice(),phase=season(s),erosion=new Float64Array(s.heights.length),canopies=s.entities.filter(e=>e.type==='tree'),moss=s.entities.filter(e=>e.type==='moss');let altered=false;
    for(let i=0;i<old.length;i++){
      const h=s.heights[i],near=neighbors(i),point=vertexPoint(i);let mean=0,runoff=0,lowest=i,retention=0;for(const tree of canopies){const d=distance(point,tree);if(d<1.6)retention=Math.max(retention,(1-d/1.6)*.35*Math.min(tree.growth,1));}for(const mat of moss){const d=distance(point,mat);if(d<.85)retention=Math.max(retention,(1-d/.85)*.18);}
      for(const j of near){mean+=old[j]/near.length;runoff+=Math.max(0,s.heights[j]-h)*old[j]*.018;if(s.heights[j]<s.heights[lowest])lowest=j;}
      const evaporate=(.035+s.sun*.10)*weather.light*phase.evap*(.7+h*.16)*(1-retention),rain=weather.rain*.36,shore=clamp((s.water+.32-h)/.32)*.42;
      next[i]=clamp(old[i]+days*((mean-old[i])*.42+runoff+rain+shore-evaporate),.03,.99);
      if(h<s.water)next[i]=Math.max(next[i],.94);
      const slope=h-s.heights[lowest];if(s.wildGrowth&&weather.rain>.3&&old[i]>.6&&slope>.10&&i>0&&i<old.length-GRID_SEGMENTS){const amount=Math.min(.004,slope*.06*days*weather.rain);erosion[i]-=amount;erosion[lowest]+=amount;altered=altered||amount>.000001;}
    }
    s.soil=next;if(altered){for(let i=0;i<s.heights.length;i++)s.heights[i]=clamp(s.heights[i]+erosion[i],.12,2.9);s.terrainRevision++;}
    let sum=0,weight=0;for(let i=0;i<next.length;i++){const w=i===0?.5:Math.floor((i-1)/GRID_SEGMENTS)+1;sum+=next[i]*w;weight+=w;}s.moisture=sum/weight;
    if(s.baseWater>0)s.water=clamp(s.water+days*(weather.rain*.022-s.sun*.009),s.baseWater-.045,s.baseWater+.10);
  }
  function spread(s){
    const ticket=s.spreadSerial++,r=rng(s.seed+'spread'+ticket),parents=s.entities.filter(e=>['moss','clover','flower','succulent','grass'].includes(e.type)&&e.growth>.85&&e.health>.72);
    if(!s.wildGrowth||!parents.length||s.entities.length>=MAX_ENTITIES||s.entities.filter(e=>e.origin==='spread').length>=30)return null;
    for(let k=0;k<5;k++){const parent=parents[Math.floor(r()*parents.length)],a=r()*Math.PI*2,d=.5+r()*.65,x=parent.x+Math.cos(a)*d,z=parent.z+Math.sin(a)*d;if(Math.hypot(x,z)>RADIUS-.25||heightAt(x,z,s)<s.water+.03||s.entities.some(e=>Math.hypot(e.x-x,e.z-z)<.38))continue;const candidate={type:parent.type,x,z};if(suitability(candidate,s)<.7)continue;const e={...candidate,id:s.nextId++,rotation:r()*Math.PI*2,scale:parent.scale*(.82+r()*.20),growth:.23,health:.9,variant:parent.variant,phase:r()*Math.PI*2,origin:'spread',paid:0,harvest:0};s.entities.push(e);return e;}
    return null;
  }
  function advance(s,dt){
    if(s.paused||!Number.isFinite(dt)||dt<=0)return[];const days=dt*s.speed/160,events=[];s.clock+=days*24;while(s.clock>=24){s.day++;s.clock-=24;}const weather=weatherAt(s);s.hydroRemainder+=days;
    let steps=0;while(s.hydroRemainder>=.0125&&steps++<400){hydrology(s,.0125,weather);s.hydroRemainder-=.0125;}
    let health=0,n=0;const hour=visualHour(s),daytime=hour>=6&&hour<20?1:.50,growthRate=s.growthRate||12;for(const e of s.entities)if(ELEMENTS[e.type].category==='plants'){
      const c=localConditions(e.x,e.z,s),fit=s.careMode==='self'?Math.max(.82,suitability(e,s,c)):suitability(e,s,c),pollinated=e.type==='flower'?c.pollination:0;
      if(s.careMode!=='pet'||s.careState.alive)e.growth=clamp(e.growth+days*.38*growthRate*fit*(1+c.nutrients+pollinated*.22)*season(s).growth*daytime,.12,1.18);e.health=clamp(fit+(e.health-fit)*Math.exp(-days*.9),s.careMode==='self'?.8:.05,1);
      if(e.growth>=.8&&e.health>=.55)e.harvest=clamp((e.harvest||0)+days*growthRate*(.55+fit*.75)*(1+pollinated*.30),0,1);health+=e.health;n++;
    }
    s.health=(n?health/n:.85)*(s.careMode==='pet'?s.careState.vitality:1);for(const e of s.entities)if(ELEMENTS[e.type].creature)e.health=s.careMode==='pet'?s.careState.vitality:1;s.stats.balance=s.health>=.75?s.stats.balance+days:0;s.stats.bestBalance=Math.max(s.stats.bestBalance,s.stats.balance);if(s.careMode!=='pet'||s.careState.alive)s.spreadClock+=days;
    while(s.spreadClock>=.65){s.spreadClock-=.65;const e=spread(s);if(e)events.push({type:'birth',entity:e,title:ELEMENTS[e.type].label+' has self-seeded'});}
    return events.concat(updateProgress(s));
  }
  function validate(o){
    if(!o||![1,2].includes(o.version)||!Object.hasOwn(BIOMES,o.biome)||!Array.isArray(o.heights)||o.heights.length!==1+GRID_RINGS*GRID_SEGMENTS||o.heights.some(x=>!Number.isFinite(x)||x<.1||x>3.2)||!Array.isArray(o.entities)||o.entities.length>MAX_ENTITIES)throw Error('This file is not a valid Verdant world.');
    const ids=new Set();for(const e of o.entities){if(!Object.hasOwn(ELEMENTS,e.type)||ELEMENTS[e.type].tool||!['x','z','rotation','scale','growth','health','phase','variant','id'].every(k=>Number.isFinite(e[k]))||Math.hypot(e.x,e.z)>RADIUS+.1||e.scale<.1||e.scale>3||e.growth<.1||e.growth>1.3||e.health<0||e.health>1||!Number.isInteger(e.variant)||e.variant<0||e.variant>2||!Number.isSafeInteger(e.id)||e.id<1||e.id>=Number.MAX_SAFE_INTEGER-1||ids.has(e.id))throw Error('This world contains invalid elements.');ids.add(e.id);}
    for(const key of ['clock','day','moisture','sun','speed','water','nextId','pondX','pondZ'])if(!Number.isFinite(o[key]))throw Error('This world is missing its climate data.');
    if(o.moisture<0||o.moisture>1||o.sun<0||o.sun>1||o.clock<0||o.clock>=24||!Number.isSafeInteger(o.day)||o.day<0||!Number.isSafeInteger(o.nextId)||o.nextId<1||o.nextId>=Number.MAX_SAFE_INTEGER||o.water<-.6||o.water>1.1||typeof o.seed!=='string'||o.seed.length>32)throw Error('This world has invalid climate data.');
    const legacy=o.version===1;o.version=2;o.mode=legacy?'sandbox':o.mode==='sandbox'?'sandbox':'journey';o.quests={plant:!!o.quests?.plant,mist:!!o.quests?.mist,life:!!o.quests?.life};
    const finite=(x,defaultValue,min=0,max=99999)=>Number.isFinite(x)?clamp(x,min,max):defaultValue;o.speed=[1,5,20].includes(o.speed)?o.speed:1;o.lighting=['day','cycle','night'].includes(o.lighting)?o.lighting:'day';o.growthRate=[1,6,12,24].includes(o.growthRate)?o.growthRate:12;o.graphics=['auto','performance','cinematic'].includes(o.graphics)?o.graphics:'auto';o.brush=finite(o.brush,.85,.4,1.5);o.health=finite(o.health,.5,0,1);o.nextId=Math.max(Math.floor(o.nextId),1,...o.entities.map(e=>e.id+1));o.paused=!!o.paused;o.placed=finite(o.placed,0);o.seeds=finite(o.seeds,48,0,9999);o.xp=finite(o.xp,0);o.mission=Math.floor(finite(o.mission,0,0,MISSIONS.length));
    o.discoveries=Array.isArray(o.discoveries)?[...new Set(o.discoveries.filter(k=>Object.hasOwn(DISCOVERIES,k)))]:[];o.seen=Array.isArray(o.seen)?[...new Set(o.seen.filter(k=>Object.hasOwn(ELEMENTS,k)&&!ELEMENTS[k].tool))]:[...new Set(o.entities.map(e=>e.type))];
    const stats=o.stats||{};o.stats={planted:finite(stats.planted,o.quests.plant?1:0),care:finite(stats.care,o.quests.mist?1:0),sculpted:finite(stats.sculpted,0),lifeTypes:Array.isArray(stats.lifeTypes)?[...new Set(stats.lifeTypes.filter(k=>Object.hasOwn(ELEMENTS,k)&&ELEMENTS[k].creature))]:[],harvested:finite(stats.harvested,0),balance:finite(stats.balance,0),bestBalance:finite(stats.bestBalance,0)};
    o.careMode=o.careMode==='pet'?'pet':'self';const pet=o.careState||newCare();o.careState={food:finite(pet.food,.95,0,1),water:finite(pet.water,.95,0,1),clean:finite(pet.clean,.95,0,1),vitality:finite(pet.vitality,1,0,1),alive:pet.alive!==false&&pet.vitality!==0,ageHours:finite(pet.ageHours,0,0,87600)};o.careUpdatedAt=finite(o.careUpdatedAt,0,0,Number.MAX_SAFE_INTEGER);
    if(o.soil!==undefined&&(!Array.isArray(o.soil)||o.soil.length!==o.heights.length||o.soil.some(x=>!Number.isFinite(x)||x<0||x>1)))throw Error('This world has invalid soil moisture data.');if(!o.soil)o.soil=initialSoil(o);
    o.landform=profile(o.seed,o.biome);o.weather=['auto','clear','rain'].includes(o.weather)?o.weather:'auto';o.wildGrowth=o.wildGrowth!==false;o.baseWater=finite(o.baseWater,o.water,-.6,.9);o.hydroRemainder=finite(o.hydroRemainder,0,0,5);o.spreadClock=finite(o.spreadClock,0,0,.65);o.spreadSerial=Math.floor(finite(o.spreadSerial,0));o.terrainRevision=Math.floor(finite(o.terrainRevision,0));
    for(const e of o.entities){e.origin=['wild','player','spread'].includes(e.origin)?e.origin:'wild';e.paid=finite(e.paid,0,0,20);e.harvest=finite(e.harvest,0,0,1);}return o;
  }
  const api={clamp,hash,rng,noise,BIOMES,ELEMENTS,RADIUS,GRID_RINGS,GRID_SEGMENTS,MAX_ENTITIES,PLANTS,CREATURES,visualHour,COSTS,DISCOVERIES,MISSIONS,RANKS,generate,profile,heightAt,vertexPoint,localConditions,weatherAt,season,habitatTarget,sculpt,suitability,placement,place,relocate,remove,care,newCare,advanceCare,careStatus,setCareMode,recordSculpt,isReady,harvest,rank,missionProgress,updateProgress,advance,validate};
  if(typeof module!=='undefined')module.exports=api;else root.TerrariumCore=api;
})(typeof window!=='undefined'?window:globalThis);
