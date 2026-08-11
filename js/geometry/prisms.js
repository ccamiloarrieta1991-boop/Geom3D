/* ============================================================
   geometry/prisms.js
   Builders for prism-family solids. Each builder returns a
   THREE.BufferGeometry sized in centimeters (1 unit = 1 cm)
   from the current dimension values.
   ============================================================ */

/** Vertices (x,y) of a regular polygon with `sides` sides and given circumradius, point-up. */
function regularPolygonPoints(sides, circumradius) {
  const pts = [];
  const start = -Math.PI / 2; // first vertex points "up"
  for (let i = 0; i < sides; i++) {
    const angle = start + i * ((2 * Math.PI) / sides);
    pts.push([circumradius * Math.cos(angle), circumradius * Math.sin(angle)]);
  }
  return pts;
}

const PrismBuilders = {
  cubo(dims) {
    const a = dims.lado;
    return new THREE.BoxGeometry(a, a, a);
  },

  prisma_rectangular(dims) {
    return new THREE.BoxGeometry(dims.largo, dims.alto, dims.ancho);
  },

  prisma_triangular(dims) {
    // Right-triangle base extruded along height (an accessible, easy-to-read case)
    const { base, alturaBase, alto } = dims;
    const shape = new THREE.Shape();
    shape.moveTo(-base / 2, -alturaBase / 2);
    shape.lineTo(base / 2, -alturaBase / 2);
    shape.lineTo(-base / 2, alturaBase / 2);
    shape.lineTo(-base / 2, -alturaBase / 2);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: alto, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, -alto / 2, 0);
    geo.computeVertexNormals();
    return geo;
  },

  prisma_pentagonal(dims) {
    const { lado, alto } = dims;
    const R = lado / (2 * Math.sin(Math.PI / 5));
    const pts = regularPolygonPoints(5, R);
    const shape = new THREE.Shape();
    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
    shape.lineTo(pts[0][0], pts[0][1]);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: alto, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, -alto / 2, 0);
    geo.computeVertexNormals();
    return geo;
  },
};

window.PrismBuilders = PrismBuilders;
