const assert=require('node:assert/strict');
const {B,C,createWorld}=require('./headless.cjs');
function sameBuffer(actual,expected,message){assert.equal(actual.length,expected.length,message);for(let i=0;i<actual.length;i++)if(Math.abs(actual[i]-expected[i])>1e-6)assert.fail(message+' at coordinate '+i+': '+actual[i]+' vs '+expected[i]);}
function flat() {
  const s=C.generate('placement-refinement','woodland','sandbox');
  s.entities=[];s.water=s.baseWater=-.6;s.heights.fill(.6);s.soil.fill(.6);s.wildGrowth=false;
  return s;
}
// Previewing must neither reserve IDs nor spend seeds, and must identify the
// complete deterministic specimen that a subsequent placement will create.
for(const mode of ['journey','sandbox']) for(const type of [...C.PLANTS,'rock','log','crystal']) for(const size of [.6,1,1.5]) {
  const s=flat();s.mode=mode;s.seeds=100;const before=JSON.stringify(s),options={size,rotation:.71};
  const expected=C.previewEntity(s,type,0,0,options);
  assert.equal(JSON.stringify(s),before,'previews must be read-only');
  assert.deepEqual(C.previewEntity(s,type,0,0,options),expected);
  assert.deepEqual(C.place(s,type,0,0,options).entity,expected,'preview and placement must agree on size, variant, orientation and ID');
}
const state=flat(),world=createWorld(state);world.engine.getDeltaTime=()=>1000/60;
// Compare actual Babylon meshes, rather than repeating scale formulas.
for(const type of [...C.PLANTS,'rock','log','crystal']) for(const size of [.6,1.5]) {
  const before=JSON.stringify(state),point={x:0,y:.6,z:0};
  world.showPreview(point,type,.4,size,true);
  assert.equal(JSON.stringify(state),before,'render previews must leave saved state unchanged');
  const preview=world.preview,expected=preview.getVerticesData('position').slice(),scale=preview.scaling.clone();
  const placed=C.place(state,type,0,0,{rotation:.4,size}),visual=world.addEntity(placed.entity);
  assert(B.Vector3.Distance(visual.root.scaling,scale)<1e-8,type+' preview must match its placed size');
  assert(B.Vector3.Distance(visual.root.position,preview.position)<1e-8,type+' preview must match its ground anchor');
  assert.equal(visual.root.rotation.y,preview.rotation.y);
  sameBuffer(visual.root.getVerticesData('position'),expected,type+' preview must show the same specimen geometry');
  world.removeEntity(placed.entity.id);state.entities=[];
}
// Multiple stems must sample their own roots rather than a cluster's center.
function terrain(edited=false) {
  state.heights=state.heights.map((h,i)=>{const p=C.vertexPoint(i);return C.clamp(1+p.x*.15+p.z*.10+(edited?.12*Math.sin(p.x*2.3)*Math.cos(p.z*1.7):0),.2,2.8);});
  state.terrainRevision++;world.refreshTerrain();
}
for(const edited of [false,true]) {
  terrain(edited);
  for(const type of ['clover','flower','grass','mushroom']) for(const rotation of [0,.8]) for(const growth of [.4,1]) {
    const e={id:state.nextId++,type,x:.3,z:-.2,rotation,scale:1,growth,health:1,variant:0,phase:0};state.entities.push(e);
    const original=JSON.stringify(state),source=world.template(type,0),v=world.addEntity(e),base=source.getVerticesData('position'),positions=v.root.getVerticesData('position'),roots=source.metadata.roots;
    assert.equal(roots.reduce((count,r)=>count+r.count,0),source.getTotalVertices(),'every vertex must belong to its whole stem cluster');
    sameBuffer(v.root.getVerticesData('normal'),source.getVerticesData('normal'),'root height changes must preserve rigid cluster normals');
    const matrix=v.root.computeWorldMatrix(true);
    for(const root of roots) {
      const dy=positions[root.start*3+1]-base[root.start*3+1],point=B.Vector3.TransformCoordinates(new B.Vector3(root.x,dy,root.z),matrix);
      assert(Math.abs(point.y-C.heightAt(point.x,point.z,state))<1e-5,type+' roots must meet actual rendered terrain');
      for(let i=root.start;i<root.start+root.count;i++) {
        assert(Math.abs(positions[i*3]-base[i*3])<1e-7&&Math.abs(positions[i*3+2]-base[i*3+2])<1e-7);
        assert(Math.abs((positions[i*3+1]-base[i*3+1])-dy)<2e-7,'each stem must retain its shape');
      }
    }
    world.showPreview({x:e.x,y:C.heightAt(e.x,e.z,state),z:e.z},type,rotation,1,true,e);
    sameBuffer(world.preview.getVerticesData('position'),positions,'moving previews must include local root adjustments');
    assert.equal(JSON.stringify(state),original,'ground contact must not move saved anchors or edit terrain');
    world.removeEntity(e.id);state.entities=[];
  }
}
// A changed world can reuse a preview type/variant/revision; its terrain must
// still invalidate the preview's old root offsets.
const specimen={id:state.nextId,type:'flower',x:0,z:0,rotation:0,scale:1,growth:1,health:1,variant:0,phase:0};
world.showPreview({x:0,y:1,z:0},'flower',0,1,true,specimen);const priorKey=world.previewKey;
const copy=C.validate(JSON.parse(JSON.stringify(state)));copy.heights.fill(1);world.rebuild(copy);
world.showPreview({x:0,y:1,z:0},'flower',0,1,true,specimen);const uniform=world.preview.getVerticesData('position');
assert.equal(world.previewKey,priorKey,'the invalidation fixture must reuse the same specimen');
sameBuffer(uniform,world.template('flower',0).getVerticesData('position'),'a flat world must clear the old root offsets');
// Emulate actual render-buffer resizing while using Babylon's real projection.
world.engine.getRenderWidth=()=>window.innerWidth;world.engine.getRenderHeight=()=>window.innerHeight;
const tree={id:copy.nextId++,type:'tree',x:0,z:0,rotation:0,scale:.8,growth:.4,health:1,variant:0,phase:0};copy.entities.push(tree);world.addEntity(tree);world.animate();world.lookCloser(tree.id);
function framed() {
  const mesh=world.visuals.get(tree.id).root;mesh.computeWorldMatrix(true);
  const matrix=world.camera.getViewMatrix(true).multiply(world.camera.getProjectionMatrix(true));
  for(const p of mesh.getBoundingInfo().boundingBox.vectorsWorld) {
    const q=B.Vector3.Project(p,B.Matrix.IdentityReadOnly,matrix,new B.Viewport(0,0,1,1));
    assert(q.x>=.05&&q.x<=.95&&q.y>=.05&&q.y<=.95,'the full growing model must fit in its close-up');
  }
}
const seedlingRadius=world.camera.radius;tree.growth=1.1;
for(let i=0;i<55;i++){world.animate();if(i%5===0)framed();}
assert(world.camera.radius>seedlingRadius*2,'close-up distance must follow rapid growth');framed();
assert(C.trimBonsai(copy,tree.id).ok);world.refreshPlant(tree);world.animate();framed();
for(const [width,height]of [[844,390],[320,667],[430,932],[390,844]]) {
  window.innerWidth=width;window.innerHeight=height;const before=JSON.stringify(copy);world.resize();
  assert.equal(world.closeupId,tree.id);assert.equal(world.camera.lowerRadiusLimit,.7);framed();
  assert.equal(JSON.stringify(copy),before,'phone rotation must preserve the entire saved world');
}
copy.graphics='performance';world.setGraphics('performance');assert.equal(world.closeupId,tree.id);framed();
world.resetCamera();assert.equal(world.closeupId,null);assert.equal(world.camera.radius,world.baseRadius);assert(B.Vector3.Distance(world.camera.target,world.baseTarget)<1e-8);
const home=world.camera.getViewMatrix(true).multiply(world.camera.getProjectionMatrix(true));
for(const [y,r]of [[-1.5,5.4],[.7,5.5],[4.2,5]])for(let j=0;j<24;j++) {
  const p=B.Vector3.Project(new B.Vector3(Math.cos(j/24*Math.PI*2)*r,y,Math.sin(j/24*Math.PI*2)*r),B.Matrix.IdentityReadOnly,home,new B.Viewport(0,0,1,1));
  assert(p.x>=.03&&p.x<=.97&&p.y>=.03&&p.y<=.97,'Reset must frame the full terrarium after rotating a phone');
}
const saved=JSON.stringify(copy),beforeUndo=world.baseRadius;world.lookCloser(tree.id);world.rebuild(copy);assert(!world.closeup&&world.closeupId===null);assert.equal(world.camera.radius,beforeUndo);assert.equal(JSON.stringify(copy),saved);
world.dispose();
console.log('Passed: read-only deterministic previews, exact placed meshes, per-stem terrain contact and preserved normals, preview invalidation, growing/pruned close-ups, rotation/quality continuity, camera reset, and saved-world preservation.');
