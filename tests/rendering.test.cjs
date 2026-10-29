// Geometry direction and renderer lifecycle checks use the actual Babylon API.
// They supplement visual device QA; NullEngine does not run a GPU fragment shader.
const assert = require('node:assert/strict');
const {B, C, createWorld} = require('./headless.cjs');
const state = C.generate('rendering-regression', 'woodland', 'sandbox');
state.entities.push({id:state.nextId++, type:'bunny', x:0, z:0, scale:.9,
  growth:1, health:.37, rotation:0, variant:0, phase:0, origin:'wild', paid:8, harvest:0});
const initial = JSON.stringify(state), world = createWorld(state);
const Builder = window.VerdantBotany.MeshBuilder;
function average(mesh, project, accept=()=>true) {
  const p=mesh.getVerticesData(B.VertexBuffer.PositionKind), n=mesh.getVerticesData(B.VertexBuffer.NormalKind);
  let value=0, count=0;
  for(let i=0;i<p.length;i+=3) if(accept(p,i)) { value+=project(p,n,i); count++; }
  assert(count>0); return value/count;
}
for(const primitive of ['tube','ellipsoid','blade','curve']) {
  const g=new Builder;
  if(primitive==='ellipsoid') g.ellipsoid([0,0,0],[1,1,1],[1,1,1]);
  else if(primitive==='blade') g.blade([0,0,0],[0,0,1],.2,[1,1,1],{curl:0,fold:0});
  else if(primitive==='tube') g.tube([0,0,0],[0,1,0],.2,.2,[1,1,1]);
  else g.curve([[0,0,0],[0,.4,0],[0,1,0]],.2,.2,[1,1,1]);
  const mesh=g.mesh(primitive,world.scene,null);
  const dot=average(mesh,(p,n,i)=>primitive==='ellipsoid'?
    p[i]*n[i]+p[i+1]*n[i+1]+p[i+2]*n[i+2]:primitive==='blade'?
      n[i+1]:(p[i]*n[i]+p[i+2]*n[i+2])/.2);
  assert(dot>.9,primitive+' must face outward/upward for lighting and back-face culling');
  mesh.dispose();
}
// A capped bent branch must have a closed surface after joining UV seam positions.
// Independent open tubes leave exposed edge loops and fail this check.
const branch=new Builder;
branch.curve([[0,0,0],[0,.4,0],[.25,.9,0],[.42,1.4,.1]],.2,.1,[1,1,1],12,{part:2,color:[1,1,1]});
const joined=branch.mesh('continuous branch',world.scene,null), p=joined.getVerticesData('position'), uv=joined.getVerticesData('uv'), indices=joined.getIndices();
const position=i=>[p[i*3],p[i*3+1],p[i*3+2]].map(x=>Math.round(x*1e5)).join(','), edges=new Map;
for(let i=0;i<indices.length;i+=3) for(const [a,b]of [[0,1],[1,2],[2,0]]) {
  const key=[position(indices[i+a]),position(indices[i+b])].sort().join('|');
  edges.set(key,(edges.get(key)||0)+1);
}
assert([...edges.values()].every(n=>n===2),'curved bark and cut ends must join without holes');
const side=joined.subMeshes.find(s=>s.materialIndex===0), ids=[...new Set(indices.slice(side.indexStart,side.indexStart+side.indexCount))].sort((a,b)=>a-b);
assert(ids.every((id,i)=>!i||uv[id*2+1]>=uv[ids[i-1]*2+1]),'bark UV distance must continue across each bend');
assert(uv[ids.at(-1)*2+1]>2,'bark must not restart its texture at every segment');
joined.dispose();
assert.equal(JSON.stringify(state),initial,'creating geometry must leave the saved world intact');
for(const mesh of [world.vessel,...world.glassMeshes.filter(m=>m.name==='soft glass reflection')]) {
  const positions=mesh.getVerticesData('position'), triangles=mesh.getIndices(), seen=new Set;
  const vertex=i=>B.Vector3.FromArray(positions,i*3);
  for(let j=0;j<triangles.length;j+=3) {
    const vertices=triangles.slice(j,j+3).map(vertex);
    if(B.Vector3.Cross(vertices[1].subtract(vertices[0]),vertices[2].subtract(vertices[0])).lengthSquared()<1e-12) continue;
    const key=vertices.map(p=>p.asArray().map(x=>Math.round(x*1e5)).join(',')).sort().join('|');
    assert(!seen.has(key),'glass must not blend duplicated triangles on top of the same surface'); seen.add(key);
  }
}
function inspectSurfaces() {
  assert(average(world.terrain,(p,n,i)=>n[i+1])>.5,'soil must light and render from above');
  assert(average(world.skirt,(p,n,i)=>(p[i]*n[i]+p[i+2]*n[i+2])/Math.hypot(p[i],p[i+2]))>.95,'the soil cross-section must face outside the glass');
  for(const variant of [0,1,2]) {
    const cactus=world.template('cactus',variant);
    const skin=cactus.subMeshes.find(s=>s.materialIndex===0), skinIds=new Set(cactus.getIndices().slice(skin.indexStart,skin.indexStart+skin.indexCount));
    assert(average(cactus,(p,n,i)=>(p[i]*n[i]+p[i+2]*n[i+2])/Math.hypot(p[i],p[i+2]),(p,i)=>skinIds.has(i/3)&&p[i+1]>.05&&p[i+1]<.5&&Math.hypot(p[i],p[i+2])<.25)>.85,'rising cactus rings must retain outward normals');
    const mushroom=world.template('mushroom',variant), cap=mushroom.subMeshes.find(s=>s.materialIndex===0), capIds=new Set(mushroom.getIndices().slice(cap.indexStart,cap.indexStart+cap.indexCount));
    assert(average(mushroom,(p,n,i)=>n[i+1],(p,i)=>capIds.has(i/3))>.4,'mushroom caps must face their lit upper surface');
    const log=world.template('log',variant), lp=log.getVerticesData('position'), ln=log.getVerticesData('normal'), li=log.getIndices(), ends=log.subMeshes.find(s=>s.materialIndex===2), cutIds=[...new Set(li.slice(ends.indexStart,ends.indexStart+ends.indexCount))];
    for(const sign of [-1,1]) {
      const end=cutIds.filter(i=>Math.sign(lp[i*3])===sign);
      assert(end.reduce((sum,i)=>sum+ln[i*3]*sign,0)/end.length>.9,'both visible driftwood cuts must face outward');
    }
  }
}
// Quality switching must not keep accumulating meshes, textures or materials.
const resources=()=>({meshes:world.scene.meshes.length,materials:world.scene.materials.length,textures:world.scene.textures.length,geometries:world.scene.geometries.length});
let warm;
for(let cycle=0;cycle<2;cycle++) {
  for(const mode of ['performance','cinematic','auto']) {
    state.graphics=mode; const before=JSON.stringify(state); world.setGraphics(mode);
    inspectSurfaces(); world.animate();
    assert.equal(JSON.stringify(state),before,'render detail changes must preserve plants, terrain and archived animals');
    assert.equal(world.animals.length,0);
  }
  if(!cycle) warm=resources(); else assert.deepEqual(resources(),warm,'quality changes must release superseded scene resources');
}
// Water and the clear background must cross the display gamma boundary once.
// This also exercises changing the pipeline without changing time or weather.
for(const post of [false,true,false]) {
  world.scene.imageProcessingConfiguration.applyByPostProcess=post; world.animate();
  assert.equal(world.waterMaterial._floats.outputGamma,post?0:1);
  const expected=B.Color3.FromHexString('#e6e7df');
  assert(Math.abs(world.scene.clearColor.r-(post?expected.toLinearSpace().r:expected.r))<1e-6);
}
const dim=world.sun.intensity; state.sun=.95; world.animate();
assert(world.sun.intensity>dim,'sunlight changes must refresh the renderer even under locked daylight');
C.sculpt(state,1,0,'raise',1); world.refreshTerrain(); inspectSurfaces();
assert(world.terrain.getVerticesData('normal').filter((_,i)=>i%3===1).every(y=>y>0),'sculpting must retain upward terrain normals');
world.dispose();
console.log('Passed: outward botanical/soil surfaces, continuous closed branches and bark UVs, correct cactus/cut-face orientation, bounded quality-switch resources, single-pass water/background gamma, sunlight refresh, sculpted normals, and exact render-only save preservation.');
