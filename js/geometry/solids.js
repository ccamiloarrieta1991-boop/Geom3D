/* ============================================================
   geometry/solids.js
   The solids CATALOG: single source of truth for what solids
   exist, their metadata, editable dimensions, default values,
   and which builder produces their THREE.BufferGeometry.

   Etapa 1 incluye: cubo, prisma rectangular, prisma triangular,
   cilindro, cono, esfera.
   Marcados como "locked" los que llegan en Etapa 2:
   prisma pentagonal, pirámides, poliedros regulares, tronco de cono.
   ============================================================ */

const SOLIDS_CATALOG = [
  {
    id: 'cubo',
    name: 'Cubo',
    family: 'Prisma',
    builder: (dims) => PrismBuilders.cubo(dims),
    dims: [
      { key: 'lado', label: 'Lado', min: 1, max: 15, step: 0.5, default: 6, unit: 'cm' },
    ],
    glyph: 'cube',
  },
  {
    id: 'prisma_rectangular',
    name: 'Prisma rectangular',
    family: 'Prisma',
    builder: (dims) => PrismBuilders.prisma_rectangular(dims),
    dims: [
      { key: 'largo', label: 'Largo', min: 1, max: 15, step: 0.5, default: 8, unit: 'cm' },
      { key: 'ancho', label: 'Ancho', min: 1, max: 15, step: 0.5, default: 5, unit: 'cm' },
      { key: 'alto', label: 'Alto', min: 1, max: 15, step: 0.5, default: 4, unit: 'cm' },
    ],
    glyph: 'box',
  },
  {
    id: 'prisma_triangular',
    name: 'Prisma triangular',
    family: 'Prisma',
    builder: (dims) => PrismBuilders.prisma_triangular(dims),
    dims: [
      { key: 'base', label: 'Base del triángulo', min: 2, max: 14, step: 0.5, default: 6, unit: 'cm' },
      { key: 'alturaBase', label: 'Altura del triángulo', min: 2, max: 14, step: 0.5, default: 5, unit: 'cm' },
      { key: 'alto', label: 'Altura del prisma', min: 2, max: 16, step: 0.5, default: 9, unit: 'cm' },
    ],
    glyph: 'triprism',
  },
  {
    id: 'cilindro',
    name: 'Cilindro',
    family: 'Cuerpo redondo',
    builder: (dims) => CylinderBuilders.cilindro(dims),
    dims: [
      { key: 'radio', label: 'Radio', min: 1, max: 10, step: 0.5, default: 4, unit: 'cm' },
      { key: 'altura', label: 'Altura', min: 1, max: 16, step: 0.5, default: 10, unit: 'cm' },
    ],
    glyph: 'cylinder',
  },
  {
    id: 'cono',
    name: 'Cono',
    family: 'Cuerpo redondo',
    builder: (dims) => ConeBuilders.cono(dims),
    dims: [
      { key: 'radio', label: 'Radio', min: 1, max: 10, step: 0.5, default: 5, unit: 'cm' },
      { key: 'altura', label: 'Altura', min: 1, max: 16, step: 0.5, default: 12, unit: 'cm' },
    ],
    glyph: 'cone',
  },
  {
    id: 'esfera',
    name: 'Esfera',
    family: 'Cuerpo redondo',
    builder: (dims) => SphereBuilders.esfera(dims),
    dims: [
      { key: 'radio', label: 'Radio', min: 1, max: 10, step: 0.5, default: 5, unit: 'cm' },
    ],
    glyph: 'sphere',
  },

  {
    id: 'prisma_pentagonal',
    name: 'Prisma pentagonal',
    family: 'Prisma',
    builder: (dims) => PrismBuilders.prisma_pentagonal(dims),
    dims: [
      { key: 'lado', label: 'Lado del pentágono', min: 2, max: 10, step: 0.5, default: 4, unit: 'cm' },
      { key: 'alto', label: 'Altura del prisma', min: 2, max: 16, step: 0.5, default: 9, unit: 'cm' },
    ],
    glyph: 'pentaprism',
  },
  {
    id: 'piramide_triangular',
    name: 'Pirámide triangular',
    family: 'Pirámide',
    builder: (dims) => PyramidBuilders.piramide_triangular(dims),
    dims: [
      { key: 'lado', label: 'Lado de la base', min: 2, max: 14, step: 0.5, default: 6, unit: 'cm' },
      { key: 'altura', label: 'Altura de la pirámide', min: 2, max: 16, step: 0.5, default: 8, unit: 'cm' },
    ],
    glyph: 'tetra',
  },
  {
    id: 'piramide_cuadrangular',
    name: 'Pirámide cuadrangular',
    family: 'Pirámide',
    builder: (dims) => PyramidBuilders.piramide_cuadrangular(dims),
    dims: [
      { key: 'lado', label: 'Lado de la base', min: 2, max: 14, step: 0.5, default: 6, unit: 'cm' },
      { key: 'altura', label: 'Altura de la pirámide', min: 2, max: 16, step: 0.5, default: 8, unit: 'cm' },
    ],
    glyph: 'pyramid',
  },
  {
    id: 'piramide_pentagonal',
    name: 'Pirámide pentagonal',
    family: 'Pirámide',
    builder: (dims) => PyramidBuilders.piramide_pentagonal(dims),
    dims: [
      { key: 'lado', label: 'Lado de la base', min: 2, max: 10, step: 0.5, default: 5, unit: 'cm' },
      { key: 'altura', label: 'Altura de la pirámide', min: 2, max: 16, step: 0.5, default: 8, unit: 'cm' },
    ],
    glyph: 'pyramid',
  },
  {
    id: 'tetraedro',
    name: 'Tetraedro',
    family: 'Poliedro',
    builder: (dims) => PolyhedraBuilders.tetraedro(dims),
    dims: [
      { key: 'arista', label: 'Arista', min: 2, max: 14, step: 0.5, default: 7, unit: 'cm' },
    ],
    glyph: 'tetra',
  },
  {
    id: 'octaedro',
    name: 'Octaedro',
    family: 'Poliedro',
    builder: (dims) => PolyhedraBuilders.octaedro(dims),
    dims: [
      { key: 'arista', label: 'Arista', min: 2, max: 12, step: 0.5, default: 6, unit: 'cm' },
    ],
    glyph: 'octa',
  },
  {
    id: 'tronco_cono',
    name: 'Tronco de cono',
    family: 'Cuerpo redondo',
    builder: (dims) => CylinderBuilders.tronco_cono(dims),
    dims: [
      { key: 'radioInferior', label: 'Radio inferior', min: 2, max: 10, step: 0.5, default: 6, unit: 'cm' },
      { key: 'radioSuperior', label: 'Radio superior', min: 1, max: 9, step: 0.5, default: 3, unit: 'cm' },
      { key: 'altura', label: 'Altura', min: 2, max: 16, step: 0.5, default: 8, unit: 'cm' },
    ],
    glyph: 'frustum',
  },
];

function getSolidDef(id) {
  return SOLIDS_CATALOG.find((s) => s.id === id);
}

function getDefaultDims(solidDef) {
  const out = {};
  (solidDef.dims || []).forEach((d) => { out[d.key] = d.default; });
  return out;
}

/** Reads current dims for a solid from State, seeding defaults on first use. */
function getCurrentDims(solidId) {
  const solidDef = getSolidDef(solidId);
  const stored = State.get(`dimensions.${solidId}`);
  if (stored) return stored;
  const defaults = getDefaultDims(solidDef);
  State.set(`dimensions.${solidId}`, defaults);
  return defaults;
}

window.SOLIDS_CATALOG = SOLIDS_CATALOG;
window.getSolidDef = getSolidDef;
window.getDefaultDims = getDefaultDims;
window.getCurrentDims = getCurrentDims;
