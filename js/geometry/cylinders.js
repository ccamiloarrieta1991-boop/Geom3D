/* ============================================================
   geometry/cylinders.js
   ============================================================ */

const CylinderBuilders = {
  cilindro(dims) {
    return new THREE.CylinderGeometry(dims.radio, dims.radio, dims.altura, 48);
  },

  tronco_cono(dims) {
    const { radioSuperior, radioInferior, altura } = dims;
    return new THREE.CylinderGeometry(radioSuperior, radioInferior, altura, 48);
  },
};

window.CylinderBuilders = CylinderBuilders;
