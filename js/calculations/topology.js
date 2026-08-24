/* ============================================================
   calculations/topology.js
   ELEMENTOS DEL POLIEDRO y RELACIÓN DE EULER: C + V = A + 2

   Los cuerpos redondos no son poliedros: no tienen caras planas
   ni aristas en el sentido de la fórmula, así que Euler no se
   les aplica. Eso no es una carencia de la aplicación sino una
   distinción conceptual que conviene que el estudiante vea
   explícitamente, y por eso se informa en lugar de ocultarse.
   ============================================================ */

function getTopology(solidDef) {
  return solidDef.topology || null;
}

function eulerCheck(topology) {
  if (!topology) return null;
  const { V, E, F } = topology;
  return { left: F + V, right: E + 2, holds: F + V === E + 2 };
}

/** Marca visual de aristas y vértices sobre una geometría ya construida. */
function buildTopologyHelpers(geometry) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xf5a524, linewidth: 2 })
  );
  const uniqueVerts = dedupeVertices(geometry);
  const vertGeo = new THREE.BufferGeometry();
  vertGeo.setAttribute('position', new THREE.Float32BufferAttribute(uniqueVerts, 3));
  const vertices = new THREE.Points(
    vertGeo,
    new THREE.PointsMaterial({ color: 0x2fb7ff, size: 0.6, sizeAttenuation: true })
  );
  return { edges, vertices };
}

/** Collapses duplicated positions so the vertex markers match the real vertex count. */
function dedupeVertices(geometry) {
  const pos = geometry.attributes.position;
  const seen = new Set();
  const out = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const key = `${x.toFixed(3)}|${y.toFixed(3)}|${z.toFixed(3)}`;
    if (!seen.has(key)) { seen.add(key); out.push(x, y, z); }
  }
  return out;
}

window.getTopology = getTopology;
window.eulerCheck = eulerCheck;
window.buildTopologyHelpers = buildTopologyHelpers;
