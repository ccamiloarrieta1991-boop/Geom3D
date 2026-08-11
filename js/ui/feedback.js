/* ============================================================
   ui/feedback.js
   Checks a student's numeric answer against the true value and
   returns a specific, pedagogical diagnosis — never just
   "incorrecto". Detects common, predictable error patterns
   (radius/diameter confusion, forgetting π, using the wrong
   quantity, etc.) so the message names the likely cause.
   ============================================================ */

const FEEDBACK_TOLERANCE_PCT = 1.5; // within this % => "correcto"
const FEEDBACK_APPROX_PCT = 6;      // within this % => "aproximado"

/**
 * @param {number} studentValue
 * @param {number} correctValue
 * @param {object} context { solidId, dims, quantity } used for smarter diagnosis
 * @returns {{status:'correct'|'approx'|'incorrect', message:string}}
 */
function checkAnswer(studentValue, correctValue, context) {
  if (!isFinite(studentValue)) {
    return { status: 'incorrect', message: 'Escribe un valor numérico antes de comprobar.' };
  }

  const diff = Math.abs(studentValue - correctValue);
  const pct = correctValue !== 0 ? (diff / correctValue) * 100 : diff;

  if (pct <= FEEDBACK_TOLERANCE_PCT) {
    return { status: 'correct', message: '¡Correcto! Tu resultado coincide con el valor calculado.' };
  }

  if (pct <= FEEDBACK_APPROX_PCT) {
    return {
      status: 'approx',
      message: 'Muy cerca. Revisa los decimales o el redondeo de π que usaste — el procedimiento va bien encaminado.',
    };
  }

  // --- Try to diagnose a specific, common error before giving up ---
  const hintsEnabled = (typeof State !== 'undefined') ? State.get('teacher.hintsEnabled') !== false : true;
  if (hintsEnabled) {
    const diag = diagnoseCommonError(studentValue, correctValue, context);
    if (diag) return { status: 'incorrect', message: diag };
  }

  return {
    status: 'incorrect',
    message: 'El resultado no coincide. Revisa la fórmula y verifica que sustituiste cada dimensión en el lugar correcto.',
  };
}

function diagnoseCommonError(studentValue, correctValue, context = {}) {
  const { solidId, dims = {}, quantity } = context;

  // Radius/diameter mix-up: common value is off by factor of 2 or 4 (area)
  if (dims.radio) {
    if (isClose(studentValue, correctValue / 4) || isClose(studentValue, correctValue * 4)) {
      return 'Parece que usaste el diámetro en vez del radio (o al revés). Recuerda que r = d/2, y como el radio aparece elevado al cuadrado en el área, ese cambio se multiplica por 4.';
    }
    if (isClose(studentValue, correctValue / 2) || isClose(studentValue, correctValue * 2)) {
      return 'Parece que confundiste el radio con el diámetro. Recuerda que r = d/2.';
    }
  }

  // Forgetting π entirely
  if (isClose(studentValue, correctValue / Math.PI)) {
    return 'Tu resultado coincide con el cálculo sin multiplicar por π. No olvides incluir π en la fórmula.';
  }

  // Mixed up area vs volume magnitude (very rough heuristic by solid)
  if (quantity === 'volumen' && solidId && Volumes[solidId]) {
    const areaTotal = Areas[solidId] ? Areas[solidId](dims).areaTotal : undefined;
    if (areaTotal && isClose(studentValue, areaTotal)) {
      return 'Ese valor corresponde al área total, no al volumen. Recuerda que el volumen se mide en unidades cúbicas (cm³) y el área en unidades cuadradas (cm²).';
    }
  }
  if (quantity === 'areaTotal' && solidId && Areas[solidId]) {
    const vol = Volumes[solidId] ? Volumes[solidId](dims) : undefined;
    if (vol && isClose(studentValue, vol)) {
      return 'Ese valor corresponde al volumen, no al área total. Compara las unidades: cm² para área, cm³ para volumen.';
    }
  }

  // Prism/cylinder: base × height forgotten (used only one dimension)
  if (quantity === 'volumen' && dims.altura && isClose(studentValue, correctValue / dims.altura)) {
    return 'Parece que calculaste solo el área de la base y olvidaste multiplicar por la altura.';
  }

  return null;
}

function isClose(a, b, tolPct = 3) {
  if (b === 0) return Math.abs(a - b) < 0.01;
  return Math.abs(a - b) / Math.abs(b) * 100 <= tolPct;
}

window.checkAnswer = checkAnswer;
