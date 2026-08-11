/* ============================================================
   activities/challenges.js
   RETOS MATEMÁTICOS — problem generator with four levels.
   Level 4 (inverse problems: solve for a missing dimension) is
   only algebraically simple for a curated subset of solids, so
   it draws from that subset; levels 1-3 work for any solid in
   the catalog.
   ============================================================ */

const CONTEXT_TEMPLATES = [
  { object: 'un tanque de agua', solidHint: ['cilindro', 'prisma_rectangular'] },
  { object: 'una caja de embalaje', solidHint: ['cubo', 'prisma_rectangular'] },
  { object: 'un cono de tránsito', solidHint: ['cono'] },
  { object: 'una carpa de campamento', solidHint: ['piramide_cuadrangular', 'piramide_triangular'] },
  { object: 'un balón decorativo', solidHint: ['esfera'] },
  { object: 'un vaso o balde', solidHint: ['tronco_cono', 'cilindro'] },
];

const INVERSE_SOLVABLE = ['cubo', 'cilindro', 'prisma_rectangular', 'cono'];

function randomInRange(min, max, step) {
  const steps = Math.round((max - min) / step);
  const n = Math.floor(Math.random() * (steps + 1));
  return Math.round((min + n * step) * 100) / 100;
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomDims(solidDef) {
  const dims = {};
  solidDef.dims.forEach((d) => { dims[d.key] = randomInRange(d.min, d.max, d.step); });
  return dims;
}

/**
 * Generates a challenge for the given level (1-4).
 * Returns { solidId, dims, quantity, promptText, level,
 *           inverse: boolean, targetDimKey?, answerValue }
 */
function generateChallenge(level) {
  if (level === 4) return generateInverseChallenge();

  const pool = SOLIDS_CATALOG.filter((s) => !s.locked);
  const solidDef = pickRandom(pool);
  const dims = randomDims(solidDef);
  const quantities = availableQuantities(solidDef.id);
  const quantity = pickRandom(quantities);
  const answerValue = trueValueFor(solidDef.id, dims, quantity.key);

  let promptText;
  if (level === 1) {
    promptText = buildLevel1Prompt(solidDef, dims, quantity);
  } else if (level === 2) {
    promptText = buildLevel2Prompt(solidDef, dims, quantity);
  } else {
    promptText = buildLevel3Prompt(solidDef, dims, quantity);
  }

  return { solidId: solidDef.id, dims, quantity: quantity.key, promptText, level, inverse: false, answerValue, unit: quantity.unit };
}

function buildLevel1Prompt(solidDef, dims, quantity) {
  const dimText = solidDef.dims.map((d) => `${d.label.toLowerCase()} = ${fmt(dims[d.key], 1)} ${d.unit}`).join(', ');
  return `Construye ${articleFor(solidDef.name)} con ${dimText}. Calcula: ${quantity.label.toLowerCase()}.`;
}

function buildLevel2Prompt(solidDef, dims, quantity) {
  const ctx = pickRandom(CONTEXT_TEMPLATES.filter((c) => c.solidHint.includes(solidDef.id)) .length
    ? CONTEXT_TEMPLATES.filter((c) => c.solidHint.includes(solidDef.id))
    : CONTEXT_TEMPLATES);
  const dimText = solidDef.dims.map((d) => `${d.label.toLowerCase()} de ${fmt(dims[d.key], 1)} ${d.unit}`).join(' y ');
  return `Imagina ${ctx.object} con forma de ${solidDef.name.toLowerCase()}, con ${dimText}. ¿Cuál es ${quantity.label.toLowerCase()}?`;
}

function buildLevel3Prompt(solidDef, dims, quantity) {
  // Reasoning level: express one dimension as a relationship to another
  // instead of giving its raw value, so the student must derive it first.
  if (solidDef.dims.length < 2) return buildLevel1Prompt(solidDef, dims, quantity);
  const [d0, d1] = solidDef.dims;
  // Force a clean relationship: d1 = 2 * d0 (rounded to the slider's step)
  const derived = Math.round((dims[d0.key] * 2) / d1.step) * d1.step;
  const boundedDerived = Math.min(d1.max, Math.max(d1.min, derived));
  dims[d1.key] = boundedDerived;
  const restDims = solidDef.dims.slice(2).map((d) => `${d.label.toLowerCase()} = ${fmt(dims[d.key], 1)} ${d.unit}`).join(', ');
  return `${articleFor(solidDef.name)} tiene ${d0.label.toLowerCase()} = ${fmt(dims[d0.key], 1)} ${d0.unit}, y su ${d1.label.toLowerCase()} es el doble de ${d0.label.toLowerCase().replace('del ', '').replace('de la ', '').replace('de ', '')}.${restDims ? ' Además, ' + restDims + '.' : ''} Calcula: ${quantity.label.toLowerCase()}.`;
}

function generateInverseChallenge() {
  const solidDef = getSolidDef(pickRandom(INVERSE_SOLVABLE));
  const dims = randomDims(solidDef);
  const targetVolume = Volumes[solidDef.id](dims);

  let targetDimKey, promptText, answerValue;

  if (solidDef.id === 'cubo') {
    targetDimKey = 'lado';
    answerValue = dims.lado;
    promptText = `El volumen de un cubo es ${fmt(targetVolume)} cm³. Determina la medida de su lado.`;
  } else if (solidDef.id === 'cilindro') {
    targetDimKey = 'radio';
    answerValue = dims.radio;
    promptText = `El volumen de un cilindro es ${fmt(targetVolume)} cm³ y su altura es ${fmt(dims.altura,1)} cm. Determina aproximadamente el radio.`;
  } else if (solidDef.id === 'cono') {
    targetDimKey = 'radio';
    answerValue = dims.radio;
    promptText = `El volumen de un cono es ${fmt(targetVolume)} cm³ y su altura es ${fmt(dims.altura,1)} cm. Determina aproximadamente el radio.`;
  } else if (solidDef.id === 'prisma_rectangular') {
    targetDimKey = 'alto';
    answerValue = dims.alto;
    promptText = `Un prisma rectangular tiene largo ${fmt(dims.largo,1)} cm, ancho ${fmt(dims.ancho,1)} cm y volumen ${fmt(targetVolume)} cm³. Determina su altura.`;
  }

  return {
    solidId: solidDef.id, dims, quantity: 'volumen', promptText, level: 4,
    inverse: true, targetDimKey, answerValue, unit: solidDef.dims.find((d) => d.key === targetDimKey).unit,
  };
}

const FEMININE_NAMES = ['pirámide', 'esfera'];
function articleFor(name) {
  const lower = name.toLowerCase();
  const isFeminine = FEMININE_NAMES.some((f) => lower.includes(f));
  return `${isFeminine ? 'una' : 'un'} ${lower}`;
}

window.generateChallenge = generateChallenge;
