/* ============================================================
   geometry/pyramids.js
   Regular pyramids (equilateral/regular polygon base + apex
   centered above it) built as a THREE.ConeGeometry with N
   radial segments — a cone with 3/4/5 segments IS a pyramid
   with a triangular/square/pentagonal base. `radius` there is
   the base's circumradius, so we convert from the side length
   ("lado") the student edits, which is the pedagogically
   meaningful quantity.
   ============================================================ */

const PyramidBuilders = {
  piramide_triangular(dims) {
    const { lado, altura } = dims;
    const R = lado / Math.sqrt(3); // circumradius of an equilateral triangle
    return new THREE.ConeGeometry(R, altura, 3);
  },

  piramide_cuadrangular(dims) {
    const { lado, altura } = dims;
    const R = (lado * Math.SQRT2) / 2; // circumradius of a square = half diagonal
    const geo = new THREE.ConeGeometry(R, altura, 4);
    geo.rotateY(Math.PI / 4); // align square faces with the viewer instead of a diamond orientation
    return geo;
  },

  piramide_pentagonal(dims) {
    const { lado, altura } = dims;
    const R = lado / (2 * Math.sin(Math.PI / 5)); // circumradius of a regular pentagon
    return new THREE.ConeGeometry(R, altura, 5);
  },
};

window.PyramidBuilders = PyramidBuilders;
