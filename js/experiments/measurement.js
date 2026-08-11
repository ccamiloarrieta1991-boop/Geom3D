/* ============================================================
   experiments/measurement.js
   Shared across the three experimental methods: the final
   comparison (matemático vs experimental, error %) and the
   open reflection questions.
   ============================================================ */

function computeExperimentComparison(mathVolume, experimentalVolume) {
  const diff = Math.abs(mathVolume - experimentalVolume);
  const errorPct = mathVolume !== 0 ? (diff / mathVolume) * 100 : 0;
  return { mathVolume, experimentalVolume, diff, errorPct };
}

function renderComparison(container, comp) {
  container.innerHTML = `
    <h3>Resultados</h3>
    <div class="compare-grid">
      <div class="compare-item"><span class="compare-label">Volumen matemático</span><span class="compare-value">${fmt(comp.mathVolume)} cm³</span></div>
      <div class="compare-item"><span class="compare-label">Volumen experimental</span><span class="compare-value">${fmt(comp.experimentalVolume, 0)} cm³</span></div>
      <div class="compare-item"><span class="compare-label">Diferencia</span><span class="compare-value">${fmt(comp.diff)} cm³</span></div>
      <div class="compare-item"><span class="compare-label">Error porcentual</span><span class="compare-value" style="color:var(--c-amber)">${fmt(comp.errorPct)} %</span></div>
    </div>
    <p style="margin-top:10px; font-size:12.5px;">Las diferencias pueden deberse a aproximaciones, redondeos, la resolución de la escala (el tamaño de los cubos o las marcas de la probeta) o pequeñas imprecisiones de medición. No es un error tuyo — es parte natural de medir.</p>
  `;
}

const REFLECTION_QUESTIONS = [
  '¿Qué representa físicamente el volumen?',
  '¿Por qué 1 ml equivale a 1 cm³?',
  '¿Qué dimensión tuvo mayor efecto sobre el volumen al modificarla?',
  '¿El resultado experimental coincidió exactamente con el matemático? ¿Por qué pueden existir diferencias?',
  '¿Qué significa, en términos concretos, que un objeto tenga determinado volumen en cm³?',
];

function renderReflection(container, solidId) {
  container.innerHTML = '<h3>Reflexión final</h3>';
  REFLECTION_QUESTIONS.forEach((q, i) => {
    const key = `reflect_${solidId}_${i}`;
    const wrap = document.createElement('div');
    wrap.className = 'calc-field';
    const label = document.createElement('label');
    label.textContent = q;
    const ta = document.createElement('textarea');
    ta.rows = 2;
    ta.className = 'reflect-input';
    ta.value = State.get(`reflections.${key}`) || '';
    ta.addEventListener('change', () => State.set(`reflections.${key}`, ta.value));
    wrap.appendChild(label);
    wrap.appendChild(ta);
    container.appendChild(wrap);
  });
}

window.computeExperimentComparison = computeExperimentComparison;
window.renderComparison = renderComparison;
window.renderReflection = renderReflection;
