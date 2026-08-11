/* ============================================================
   experiments/displacement.js
   MÉTODO 2 — DESPLAZAMIENTO DE LÍQUIDO
   Vobjeto = Vfinal − Vinicial
   ============================================================ */

const DISPLACEMENT_INITIAL_ML = 400;

function renderDisplacementSetup(container, objectVolumeML) {
  const maxML = niceScaleMax(DISPLACEMENT_INITIAL_ML + objectVolumeML);
  container.innerHTML = `
    <div class="probeta-row">
      <div class="probeta-box">
        ${probetaSVG('probeta-before', DISPLACEMENT_INITIAL_ML, maxML)}
        <div class="probeta-caption">Antes</div>
        <div class="probeta-value">${fmt(DISPLACEMENT_INITIAL_ML, 0)} ml</div>
      </div>
      <div class="probeta-box">
        ${probetaSVG('probeta-after', DISPLACEMENT_INITIAL_ML, maxML)}
        <div class="probeta-caption">Después de introducir el objeto</div>
        <div class="probeta-value" id="probeta-after-value">— ml</div>
      </div>
    </div>
    <div id="displacement-result" style="text-align:center; font-family:var(--f-mono); font-size:13px; color:var(--c-text-dim); margin-top:6px;"></div>
  `;
  return { maxML };
}

function animateDisplacement(objectVolumeML, maxML, onDone) {
  const finalML = DISPLACEMENT_INITIAL_ML + objectVolumeML;
  const fillRect = document.querySelector('#probeta-after .probeta-fill');
  const valueLabel = document.getElementById('probeta-after-value');
  const tubeTop = 20, tubeBottom = 190;
  const tubeH = tubeBottom - tubeTop;

  const start = performance.now();
  const duration = 1100;
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const currentML = DISPLACEMENT_INITIAL_ML + eased * objectVolumeML;
    const frac = Math.max(0, Math.min(1, currentML / maxML));
    fillRect.setAttribute('y', tubeBottom - frac * tubeH);
    fillRect.setAttribute('height', frac * tubeH);
    valueLabel.textContent = `${fmt(currentML, 0)} ml`;
    if (t < 1) requestAnimationFrame(step);
    else {
      document.getElementById('displacement-result').innerHTML =
        `V<sub>objeto</sub> = V<sub>final</sub> − V<sub>inicial</sub> = ${fmt(finalML,0)} − ${fmt(DISPLACEMENT_INITIAL_ML,0)} = <span style="color:var(--c-amber)">${fmt(objectVolumeML,0)} ml</span>`;
      if (onDone) onDone(objectVolumeML);
    }
  }
  requestAnimationFrame(step);
}

window.DISPLACEMENT_INITIAL_ML = DISPLACEMENT_INITIAL_ML;
window.renderDisplacementSetup = renderDisplacementSetup;
window.animateDisplacement = animateDisplacement;
