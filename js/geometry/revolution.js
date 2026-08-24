/* ============================================================
   geometry/revolution.js
   SÓLIDOS DE REVOLUCIÓN
   THREE.LatheGeometry revolves a 2D profile (in the XY plane)
   around the Y axis and — crucially — takes a `phiLength`
   parameter that IS the revolution angle. That maps directly
   onto the "0°–360°" control the brief asks for: no custom
   animation engine needed, just rebuild the Lathe each time the
   angle changes.
   ============================================================ */

const REVOLUTION_PRESETS = {
  rectangulo_cilindro: {
    name: 'Rectángulo → Cilindro',
    flatName: 'Rectángulo',
    solidName: 'Cilindro',
    profile(r, h) {
      return [
        new THREE.Vector2(0.0001, 0),
        new THREE.Vector2(r, 0),
        new THREE.Vector2(r, h),
        new THREE.Vector2(0.0001, h),
      ];
    },
    dims: { r: 4, h: 9 },
  },
  triangulo_cono: {
    name: 'Triángulo rectángulo → Cono',
    flatName: 'Triángulo rectángulo',
    solidName: 'Cono',
    profile(r, h) {
      return [
        new THREE.Vector2(0.0001, 0),
        new THREE.Vector2(r, 0),
        new THREE.Vector2(0.0001, h),
      ];
    },
    dims: { r: 5, h: 10 },
  },
  semicirculo_esfera: {
    name: 'Semicírculo → Esfera',
    flatName: 'Semicírculo',
    solidName: 'Esfera',
    profile(r) {
      const pts = [];
      const segments = 24;
      for (let i = 0; i <= segments; i++) {
        const theta = -Math.PI / 2 + (i / segments) * Math.PI;
        pts.push(new THREE.Vector2(Math.max(0.0001, r * Math.cos(theta)), r * Math.sin(theta) + r));
      }
      return pts;
    },
    dims: { r: 5 },
  },
};

/**
 * Construye la LatheGeometry del preset, revelada de 0 hasta `angleRad`.
 * `dims` son las dimensiones reales del sólido seleccionado, de modo que
 * la revolución responde a los deslizadores del estudiante.
 */
function buildRevolutionGeometry(presetId, angleRad, dims) {
  const preset = REVOLUTION_PRESETS[presetId];
  const r = (dims && dims.radio !== undefined) ? dims.radio : preset.dims.r;
  const h = (dims && dims.altura !== undefined) ? dims.altura : preset.dims.h;
  const points = preset.profile(r, h);
  const clampedAngle = Math.max(0.001, Math.min(Math.PI * 2, angleRad));
  return new THREE.LatheGeometry(points, 48, 0, clampedAngle);
}

window.REVOLUTION_PRESETS = REVOLUTION_PRESETS;
window.buildRevolutionGeometry = buildRevolutionGeometry;
