/* ============================================================
   geometry/spheres.js
   ============================================================ */

const SphereBuilders = {
  esfera(dims) {
    return new THREE.SphereGeometry(dims.radio, 40, 28);
  },
};

window.SphereBuilders = SphereBuilders;
