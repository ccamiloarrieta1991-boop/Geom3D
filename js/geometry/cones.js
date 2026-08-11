/* ============================================================
   geometry/cones.js
   ============================================================ */

const ConeBuilders = {
  cono(dims) {
    return new THREE.ConeGeometry(dims.radio, dims.altura, 48);
  },
};

window.ConeBuilders = ConeBuilders;
