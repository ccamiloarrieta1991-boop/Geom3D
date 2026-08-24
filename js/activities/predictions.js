/* ============================================================
   activities/predictions.js
   PREDICCIÓN — se genera a partir del tipo de sólido, de modo
   que todo sólido del catálogo (incluidos los hexagonales)
   tenga su pregunta de proporcionalidad sin escribirla a mano.

   La idea de fondo: si una longitud aparece al cuadrado en la
   fórmula, duplicarla multiplica por 4; si aparece al cubo, por 8;
   si es lineal, por 2. Eso es lo que el estudiante debe descubrir.
   ============================================================ */

const SCALE_OPTIONS = ['Se duplica (×2)', 'Se cuadruplica (×4)', 'Se multiplica por 8', 'No cambia'];
const SCALE_INDEX = { 2: 0, 4: 1, 8: 2 };

function getPrediction(solidId) {
  const def = getSolidDef(solidId);
  if (!def) return null;

  // Cada entrada: qué dimensión se duplica y por cuánto se multiplica el volumen.
  let dimLabel, factor, why;

  if (def.kind === 'prisma' && def.baseShape !== 'rectangular') {
    dimLabel = 'el lado de la base';
    factor = 4;
    why = 'El área de la base depende del lado al cuadrado. Al duplicar el lado, la base se multiplica por 2² = 4, y como la altura no cambia, el volumen también se multiplica por 4.';
  } else if (def.kind === 'piramide') {
    dimLabel = 'el lado de la base';
    factor = 4;
    why = 'El volumen es (1/3)·A_base·altura. El área de la base depende del lado al cuadrado, así que al duplicar el lado el volumen se multiplica por 2² = 4.';
  } else if (def.id === 'prisma_rectangular') {
    dimLabel = 'solo el largo de la base';
    factor = 2;
    why = 'El volumen es largo × ancho × alto. El largo aparece de forma lineal, así que duplicarlo duplica el volumen.';
  } else if (def.id === 'tetraedro' || def.id === 'octaedro') {
    dimLabel = 'la arista';
    factor = 8;
    why = 'Al duplicar la arista, las tres dimensiones del sólido crecen a la vez: el volumen se multiplica por 2³ = 8.';
  } else if (def.id === 'cilindro' || def.id === 'cono') {
    dimLabel = 'el radio (manteniendo la altura)';
    factor = 4;
    why = 'El radio aparece elevado al cuadrado en la fórmula, así que al duplicarlo el volumen se multiplica por 2² = 4.';
  } else if (def.id === 'esfera') {
    dimLabel = 'el radio';
    factor = 8;
    why = 'El volumen de la esfera depende de r³. Al duplicar el radio, el volumen se multiplica por 2³ = 8.';
  } else {
    return null; // tronco de cono: la relación no es una potencia simple
  }

  return {
    question: `Si duplicamos ${dimLabel} de este ${def.shortName.toLowerCase()}, ¿qué ocurrirá con el volumen?`,
    options: SCALE_OPTIONS,
    correctIndex: SCALE_INDEX[factor],
    explanation: why,
    factor,
  };
}

window.getPrediction = getPrediction;
