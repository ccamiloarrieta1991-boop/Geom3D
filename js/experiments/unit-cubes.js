/* ============================================================
   experiments/unit-cubes.js
   MÉTODO 3 — CUBOS UNITARIOS
   Rather than hard-coding a point-in-solid test per shape family,
   this samples the solid's bounding box on a 1cm grid and keeps
   only the points that are genuinely inside the mesh — tested
   with a ray cast (odd number of intersections = inside a closed
   surface). That works identically for every solid in the
   catalog, and the resulting cube count is itself the honest
   "experimental" volume estimate: some cubes are necessarily
   left out or included near curved/slanted faces, which is
   exactly the source of measurement error the lesson is about.
   ============================================================ */

const MAX_CANDIDATE_POINTS = 3500;

function computeUnitCubePositions(viewport) {
  const geometry = viewport.mesh.geometry;
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const size = new THREE.Vector3();
  bb.getSize(size);

  let step = 1; // cm
  let approxCount = Math.ceil(size.x / step) * Math.ceil(size.y / step) * Math.ceil(size.z / step);
  while (approxCount > MAX_CANDIDATE_POINTS) {
    step += 0.5;
    approxCount = Math.ceil(size.x / step) * Math.ceil(size.y / step) * Math.ceil(size.z / step);
  }

  const raycaster = new THREE.Raycaster();
  const dir = new THREE.Vector3(0, 1, 0);
  const positions = [];

  for (let x = bb.min.x + step / 2; x < bb.max.x; x += step) {
    for (let y = bb.min.y + step / 2; y < bb.max.y; y += step) {
      for (let z = bb.min.z + step / 2; z < bb.max.z; z += step) {
        const p = new THREE.Vector3(x, y, z);
        raycaster.set(p, dir);
        raycaster.far = (bb.max.y - y) + 0.01;
        const hits = raycaster.intersectObject(viewport.mesh, false);
        if (hits.length % 2 === 1) positions.push({ x, y, z });
      }
    }
  }
  return { positions, cubeSize: step };
}

function renderUnitCubes(viewport, positions, cubeSize) {
  if (positions.length === 0) return null;
  const geo = new THREE.BoxGeometry(cubeSize * 0.92, cubeSize * 0.92, cubeSize * 0.92);
  const mat = new THREE.MeshStandardMaterial({ color: 0xf5a524, transparent: true, opacity: 0.88, metalness: 0.1, roughness: 0.5 });
  const inst = new THREE.InstancedMesh(geo, mat, positions.length);
  const m = new THREE.Matrix4();
  positions.forEach((p, i) => {
    m.makeTranslation(p.x, p.y, p.z);
    inst.setMatrixAt(i, m);
  });
  inst.instanceMatrix.needsUpdate = true;
  viewport.scene.add(inst);
  return inst;
}

function disposeUnitCubes(viewport, inst) {
  if (!inst) return;
  viewport.scene.remove(inst);
  inst.geometry.dispose();
  inst.material.dispose();
}

window.computeUnitCubePositions = computeUnitCubePositions;
window.renderUnitCubes = renderUnitCubes;
window.disposeUnitCubes = disposeUnitCubes;
