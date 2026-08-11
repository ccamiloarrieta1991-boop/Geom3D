/* ============================================================
   activities/predictions.js
   PREDICCIÓN — proportionality questions shown before the
   student calculates volume, to surface intuitions about how
   volume scales when a dimension is doubled.
   ============================================================ */

const PREDICTIONS = {
  cilindro: {
    dimKey: 'radio', factor: 2,
    question: 'Si duplicamos el radio de este cilindro y mantenemos la altura, ¿qué ocurrirá con el volumen?',
    options: ['Se duplica', 'Se triplica', 'Se cuadruplica', 'No cambia'],
    correctIndex: 2,
    explanation: 'El volumen depende de r², así que al duplicar el radio el volumen se multiplica por 2² = 4.',
  },
  cono: {
    dimKey: 'radio', factor: 2,
    question: 'Si duplicamos el radio de este cono y mantenemos la altura, ¿qué ocurrirá con el volumen?',
    options: ['Se duplica', 'Se triplica', 'Se cuadruplica', 'No cambia'],
    correctIndex: 2,
    explanation: 'Igual que en el cilindro, el radio aparece al cuadrado en la fórmula V = (1/3)πr²h, así que el volumen se multiplica por 4.',
  },
  esfera: {
    dimKey: 'radio', factor: 2,
    question: 'Si duplicamos el radio de esta esfera, ¿qué ocurrirá con el volumen?',
    options: ['Se duplica', 'Se cuadruplica', 'Se multiplica por 8', 'No cambia'],
    correctIndex: 2,
    explanation: 'El volumen de la esfera depende de r³. Al duplicar el radio, el volumen se multiplica por 2³ = 8.',
  },
  cubo: {
    dimKey: 'lado', factor: 2,
    question: 'Si duplicamos el lado de este cubo, ¿qué ocurrirá con el volumen?',
    options: ['Se duplica', 'Se cuadruplica', 'Se multiplica por 8', 'No cambia'],
    correctIndex: 2,
    explanation: 'El volumen del cubo es lado³. Al duplicar el lado, el volumen se multiplica por 2³ = 8.',
  },
  prisma_rectangular: {
    dimKey: 'largo', factor: 2,
    question: 'Si duplicamos solo el largo de este prisma y dejamos ancho y alto igual, ¿qué ocurrirá con el volumen?',
    options: ['Se duplica', 'Se cuadruplica', 'Se multiplica por 8', 'No cambia'],
    correctIndex: 0,
    explanation: 'El volumen es largo × ancho × alto. Si solo el largo se duplica, el volumen también se duplica (relación lineal en esa dimensión).',
  },
  tetraedro: {
    dimKey: 'arista', factor: 2,
    question: 'Si duplicamos la arista de este tetraedro, ¿qué ocurrirá con el volumen?',
    options: ['Se duplica', 'Se cuadruplica', 'Se multiplica por 8', 'No cambia'],
    correctIndex: 2,
    explanation: 'El volumen depende de arista³ (como en cualquier sólido donde todas las dimensiones lineales escalan igual), así que se multiplica por 2³ = 8.',
  },
};

function getPrediction(solidId) {
  return PREDICTIONS[solidId] || null;
}

window.getPrediction = getPrediction;
