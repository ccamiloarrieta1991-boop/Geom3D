/* ============================================================
   geometry/solids.js
   CATÁLOGO PARAMÉTRICO — organizado por clasificación:

     CUERPO REDONDO ─ cilindro / cono / esfera / tronco de cono
     POLIEDRO ─┬─ PRISMA   ─ forma de la base (3,4,5,6 lados…)
               ├─ PIRÁMIDE ─ forma de la base (3,4,5,6 lados…)
               └─ REGULAR  ─ tetraedro / octaedro

   Los prismas y pirámides de base regular se generan con una
   sola familia de fórmulas parametrizada por n (número de lados
   de la base), en vez de repetir un caso por sólido. Así,
   añadir un heptágono en el futuro es una línea, no un módulo.
   ============================================================ */

/* ---------- Helpers de polígono regular ---------- */
function apotemaRegular(lado, n) { return lado / (2 * Math.tan(Math.PI / n)); }
function circunradioRegular(lado, n) { return lado / (2 * Math.sin(Math.PI / n)); }
function areaPoligonoRegular(lado, n) { return (n * lado * apotemaRegular(lado, n)) / 2; }

/* ---------- Formas de base disponibles ---------- */
const BASE_SHAPES = [
  { key: 'triangular', n: 3, name: 'Triangular', regular: true },
  { key: 'cuadrada',   n: 4, name: 'Cuadrada',   regular: true },
  { key: 'rectangular', n: 4, name: 'Rectangular', regular: false },
  { key: 'pentagonal', n: 5, name: 'Pentagonal', regular: true },
  { key: 'hexagonal',  n: 6, name: 'Hexagonal',  regular: true },
];

/* ============================================================
   Constructores de definición
   ============================================================ */

function makePrismaRegular(shape) {
  const n = shape.n;
  return {
    id: `prisma_${shape.key}`,
    name: `Prisma de base ${shape.name.toLowerCase()}`,
    shortName: `Prisma ${shape.name.toLowerCase()}`,
    group: 'poliedro', kind: 'prisma', baseShape: shape.key, n,
    glyph: n === 3 ? 'triprism' : n === 4 ? 'cube' : 'pentaprism',
    dims: [
      { key: 'lado', label: 'Lado de la base', min: 1, max: 10, step: 0.5, default: 4, unit: 'cm' },
      { key: 'alto', label: 'Altura del prisma', min: 1, max: 16, step: 0.5, default: 8, unit: 'cm' },
    ],
    builder: ({ lado, alto }) => new THREE.CylinderGeometry(
      circunradioRegular(lado, n), circunradioRegular(lado, n), alto, n
    ),
    areas: ({ lado, alto }) => {
      const areaBase = areaPoligonoRegular(lado, n);
      const areaLateral = n * lado * alto;
      return { areaBase, areaLateral, areaTotal: areaLateral + 2 * areaBase };
    },
    volume: ({ lado, alto }) => areaPoligonoRegular(lado, n) * alto,
    topology: { V: 2 * n, E: 3 * n, F: n + 2 },
    facesText: `${n + 2} caras: 2 bases de ${n} lados y ${n} caras laterales rectangulares`,
  };
}

function makePrismaRectangular() {
  return {
    id: 'prisma_rectangular',
    name: 'Prisma de base rectangular',
    shortName: 'Prisma rectangular',
    group: 'poliedro', kind: 'prisma', baseShape: 'rectangular', n: 4,
    glyph: 'box',
    dims: [
      { key: 'largo', label: 'Largo de la base', min: 1, max: 14, step: 0.5, default: 8, unit: 'cm' },
      { key: 'ancho', label: 'Ancho de la base', min: 1, max: 14, step: 0.5, default: 5, unit: 'cm' },
      { key: 'alto',  label: 'Altura del prisma', min: 1, max: 16, step: 0.5, default: 6, unit: 'cm' },
    ],
    builder: ({ largo, ancho, alto }) => new THREE.BoxGeometry(largo, alto, ancho),
    areas: ({ largo, ancho, alto }) => {
      const areaBase = largo * ancho;
      const areaLateral = 2 * alto * (largo + ancho);
      return { areaBase, areaLateral, areaTotal: areaLateral + 2 * areaBase };
    },
    volume: ({ largo, ancho, alto }) => largo * ancho * alto,
    topology: { V: 8, E: 12, F: 6 },
    facesText: '6 caras rectangulares (si largo = ancho = alto, es un cubo)',
  };
}

function makePiramideRegular(shape) {
  const n = shape.n;
  return {
    id: `piramide_${shape.key}`,
    name: `Pirámide de base ${shape.name.toLowerCase()}`,
    shortName: `Pirámide ${shape.name.toLowerCase()}`,
    group: 'poliedro', kind: 'piramide', baseShape: shape.key, n,
    glyph: n === 3 ? 'tetra' : 'pyramid',
    dims: [
      { key: 'lado', label: 'Lado de la base', min: 1, max: 10, step: 0.5, default: 5, unit: 'cm' },
      { key: 'altura', label: 'Altura de la pirámide', min: 1, max: 16, step: 0.5, default: 8, unit: 'cm' },
    ],
    builder: ({ lado, altura }) => new THREE.ConeGeometry(circunradioRegular(lado, n), altura, n),
    areas: ({ lado, altura }) => {
      const a = apotemaRegular(lado, n);
      const apotemaLateral = Math.sqrt(altura * altura + a * a);
      const areaBase = areaPoligonoRegular(lado, n);
      const areaLateral = (n * lado * apotemaLateral) / 2;
      return { areaBase, areaLateral, areaTotal: areaBase + areaLateral };
    },
    volume: ({ lado, altura }) => (areaPoligonoRegular(lado, n) * altura) / 3,
    topology: { V: n + 1, E: 2 * n, F: n + 1 },
    facesText: `${n + 1} caras: 1 base de ${n} lados y ${n} caras laterales triangulares`,
  };
}

/* ---------- Poliedros regulares ---------- */
const TETRAEDRO = {
  id: 'tetraedro', name: 'Tetraedro', shortName: 'Tetraedro',
  group: 'poliedro', kind: 'regular', n: 3, glyph: 'tetra',
  dims: [{ key: 'arista', label: 'Arista', min: 2, max: 12, step: 0.5, default: 7, unit: 'cm' }],
  builder: ({ arista }) => new THREE.ConeGeometry(arista / Math.sqrt(3), arista * Math.sqrt(2 / 3), 3),
  areas: ({ arista }) => {
    const cara = (Math.sqrt(3) / 4) * arista * arista;
    return { areaBase: cara, areaLateral: 3 * cara, areaTotal: 4 * cara };
  },
  volume: ({ arista }) => arista ** 3 / (6 * Math.SQRT2),
  topology: { V: 4, E: 6, F: 4 },
  facesText: '4 caras triangulares equiláteras (es una pirámide triangular con todas sus aristas iguales)',
};

const OCTAEDRO = {
  id: 'octaedro', name: 'Octaedro', shortName: 'Octaedro',
  group: 'poliedro', kind: 'regular', n: 4, glyph: 'octa',
  dims: [{ key: 'arista', label: 'Arista', min: 2, max: 12, step: 0.5, default: 6, unit: 'cm' }],
  builder: ({ arista }) => new THREE.OctahedronGeometry(arista / Math.SQRT2),
  areas: ({ arista }) => {
    const cara = (Math.sqrt(3) / 4) * arista * arista;
    return { areaTotal: 8 * cara };
  },
  volume: ({ arista }) => (Math.sqrt(2) / 3) * arista ** 3,
  topology: { V: 6, E: 12, F: 8 },
  facesText: '8 caras triangulares equiláteras (equivale a dos pirámides cuadrangulares unidas por su base)',
};

/* ---------- Cuerpos redondos ---------- */
const CILINDRO = {
  id: 'cilindro', name: 'Cilindro', shortName: 'Cilindro',
  group: 'redondo', kind: 'cilindro', glyph: 'cylinder',
  revolutionPreset: 'rectangulo_cilindro',
  dims: [
    { key: 'radio', label: 'Radio', min: 1, max: 10, step: 0.5, default: 4, unit: 'cm' },
    { key: 'altura', label: 'Altura', min: 1, max: 16, step: 0.5, default: 10, unit: 'cm' },
  ],
  builder: ({ radio, altura }) => new THREE.CylinderGeometry(radio, radio, altura, 48),
  areas: ({ radio, altura }) => {
    const areaBase = Math.PI * radio * radio;
    const areaLateral = 2 * Math.PI * radio * altura;
    return { areaBase, areaLateral, areaTotal: areaLateral + 2 * areaBase };
  },
  volume: ({ radio, altura }) => Math.PI * radio * radio * altura,
  topology: null,
  facesText: '2 bases circulares y una superficie lateral curva',
};

const CONO = {
  id: 'cono', name: 'Cono', shortName: 'Cono',
  group: 'redondo', kind: 'cono', glyph: 'cone',
  revolutionPreset: 'triangulo_cono',
  dims: [
    { key: 'radio', label: 'Radio', min: 1, max: 10, step: 0.5, default: 5, unit: 'cm' },
    { key: 'altura', label: 'Altura', min: 1, max: 16, step: 0.5, default: 12, unit: 'cm' },
  ],
  builder: ({ radio, altura }) => new THREE.ConeGeometry(radio, altura, 48),
  areas: ({ radio, altura }) => {
    const g = Math.sqrt(radio * radio + altura * altura);
    const areaBase = Math.PI * radio * radio;
    return { areaBase, areaLateral: Math.PI * radio * g, areaTotal: areaBase + Math.PI * radio * g };
  },
  volume: ({ radio, altura }) => (Math.PI * radio * radio * altura) / 3,
  topology: null,
  facesText: '1 base circular y una superficie lateral curva generada por la generatriz',
};

const ESFERA = {
  id: 'esfera', name: 'Esfera', shortName: 'Esfera',
  group: 'redondo', kind: 'esfera', glyph: 'sphere',
  revolutionPreset: 'semicirculo_esfera',
  dims: [{ key: 'radio', label: 'Radio', min: 1, max: 10, step: 0.5, default: 5, unit: 'cm' }],
  builder: ({ radio }) => new THREE.SphereGeometry(radio, 40, 28),
  areas: ({ radio }) => ({ areaTotal: 4 * Math.PI * radio * radio }),
  volume: ({ radio }) => (4 / 3) * Math.PI * radio ** 3,
  topology: null,
  facesText: 'una única superficie curva cerrada, sin caras planas ni aristas',
};

const TRONCO = {
  id: 'tronco_cono', name: 'Tronco de cono', shortName: 'Tronco de cono',
  group: 'redondo', kind: 'tronco', glyph: 'frustum',
  revolutionPreset: null,
  dims: [
    { key: 'radioInferior', label: 'Radio inferior', min: 2, max: 10, step: 0.5, default: 6, unit: 'cm' },
    { key: 'radioSuperior', label: 'Radio superior', min: 1, max: 9, step: 0.5, default: 3, unit: 'cm' },
    { key: 'altura', label: 'Altura', min: 2, max: 16, step: 0.5, default: 8, unit: 'cm' },
  ],
  builder: ({ radioSuperior, radioInferior, altura }) =>
    new THREE.CylinderGeometry(radioSuperior, radioInferior, altura, 48),
  areas: ({ radioSuperior: r, radioInferior: R, altura: h }) => {
    const g = Math.sqrt(h * h + (R - r) ** 2);
    return { areaBase: Math.PI * (r * r + R * R), areaLateral: Math.PI * (R + r) * g, areaTotal: Math.PI * (R + r) * g + Math.PI * (r * r + R * R) };
  },
  volume: ({ radioSuperior: r, radioInferior: R, altura: h }) =>
    (Math.PI * h * (R * R + R * r + r * r)) / 3,
  topology: null,
  facesText: '2 bases circulares de distinto radio y una superficie lateral curva',
};

/* ============================================================
   Catálogo completo
   ============================================================ */
const SOLIDS_CATALOG = [
  makePrismaRegular(BASE_SHAPES[0]),   // triangular
  makePrismaRegular(BASE_SHAPES[1]),   // cuadrada
  makePrismaRectangular(),             // rectangular (junto a la cuadrada)
  makePrismaRegular(BASE_SHAPES[3]),   // pentagonal
  makePrismaRegular(BASE_SHAPES[4]),   // hexagonal
  ...BASE_SHAPES.filter((s) => s.regular).map(makePiramideRegular),
  TETRAEDRO, OCTAEDRO,
  CILINDRO, CONO, ESFERA, TRONCO,
];

function getSolidDef(id) { return SOLIDS_CATALOG.find((s) => s.id === id); }
function getDefaultDims(solidDef) {
  const out = {};
  (solidDef.dims || []).forEach((d) => { out[d.key] = d.default; });
  return out;
}
function getCurrentDims(solidId) {
  const solidDef = getSolidDef(solidId);
  const stored = State.get(`dimensions.${solidId}`);
  if (stored && solidDef.dims.every((d) => stored[d.key] !== undefined)) return stored;
  const defaults = getDefaultDims(solidDef);
  State.set(`dimensions.${solidId}`, defaults);
  return defaults;
}

/** Solids reachable from a given wizard path, used to build each step's options. */
function solidsByGroup(group) { return SOLIDS_CATALOG.filter((s) => s.group === group); }
function solidsByKind(kind) { return SOLIDS_CATALOG.filter((s) => s.kind === kind); }

window.SOLIDS_CATALOG = SOLIDS_CATALOG;
window.BASE_SHAPES = BASE_SHAPES;
window.getSolidDef = getSolidDef;
window.getDefaultDims = getDefaultDims;
window.getCurrentDims = getCurrentDims;
window.solidsByGroup = solidsByGroup;
window.solidsByKind = solidsByKind;
window.apotemaRegular = apotemaRegular;
window.circunradioRegular = circunradioRegular;
window.areaPoligonoRegular = areaPoligonoRegular;
