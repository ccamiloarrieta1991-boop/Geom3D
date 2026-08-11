/* ============================================================
   geometry/polyhedra.js
   Regular polyhedra. Three.js ships exact builders for these,
   parameterized by circumradius — we convert from edge length
   ("arista"), the quantity students actually reason about.
   ============================================================ */

const PolyhedraBuilders = {
  tetraedro(dims) {
    const { arista } = dims;
    const R = (arista * Math.sqrt(6)) / 4; // circumradius of a regular tetrahedron
    return new THREE.TetrahedronGeometry(R);
  },

  octaedro(dims) {
    const { arista } = dims;
    const R = arista / Math.SQRT2; // circumradius of a regular octahedron
    return new THREE.OctahedronGeometry(R);
  },
};

window.PolyhedraBuilders = PolyhedraBuilders;
