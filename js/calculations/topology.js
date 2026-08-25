/* ============================================================
   calculations/topology.js
   ELEMENTOS DEL POLIEDRO y RELACIÓN DE EULER: C + V = A + 2

   La relación de Euler es una propiedad de los POLIEDROS: cuerpos
   limitados únicamente por caras planas. Los cuerpos redondos no
   tienen caras ni aristas en ese sentido, así que aquí no se les
   asignan conteos ni se les aplica la fórmula.
   ============================================================ */

function getTopology(solidDef) {
  return solidDef.topology || null;
}

function isPolyhedron(solidDef) {
  return solidDef.group === 'poliedro' && !!solidDef.topology;
}

function eulerCheck(topology) {
  if (!topology) return null;
  const { V, E, F } = topology;
  return { left: F + V, right: E + 2, holds: F + V === E + 2 };
}

/**
 * Marcadores de aristas y vértices.
 * Los vértices se toman de las coordenadas exactas del sólido
 * (solidDef.vertices), NO de la malla: la malla de un prisma o
 * pirámide incluye un vértice auxiliar en el centro de cada tapa
 * que no es un vértice del poliedro y produciría marcas falsas.
 */
function buildTopologyHelpers(geometry, solidDef, dims) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 1),
    new THREE.LineBasicMaterial({ color: 0xf5a524 })
  );

  const coords = (solidDef.vertices ? solidDef.vertices(dims) : []).flat();
  const vertGeo = new THREE.BufferGeometry();
  vertGeo.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));
  const vertices = new THREE.Points(
    vertGeo,
    new THREE.PointsMaterial({ color: 0x2fb7ff, size: 0.7, sizeAttenuation: true })
  );

  return { edges, vertices, vertexCount: coords.length / 3 };
}

window.getTopology = getTopology;
window.isPolyhedron = isPolyhedron;
window.eulerCheck = eulerCheck;
window.buildTopologyHelpers = buildTopologyHelpers;
