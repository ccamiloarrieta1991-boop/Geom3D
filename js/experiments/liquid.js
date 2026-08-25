/* ============================================================
   experiments/liquid.js
   MÉTODO 1 — LLENADO CON LÍQUIDO
   The liquid is a translucent clone of the solid's own geometry,
   revealed bottom-to-top via a THREE.Plane clipping plane. This
   means the liquid genuinely takes the shape of whatever solid
   is selected (cylinder, pyramid, sphere...), not a stand-in box.
   ============================================================ */

function createLiquidFill(viewport) {
  viewport.renderer.localClippingEnabled = true;
  const geometry = viewport.mesh.geometry.clone();
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;

  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), bb.min.y); // keeps y <= constant
  const material = new THREE.MeshStandardMaterial({
    color: 0x2fb7ff,
    transparent: true,
    opacity: 0.55,
    metalness: 0.1,
    roughness: 0.15,
    side: THREE.DoubleSide,
    clippingPlanes: [plane],
  });
  const mesh = new THREE.Mesh(geometry, material);
  viewport.scene.add(mesh);

  return { mesh, plane, minY: bb.min.y, maxY: bb.max.y, filled: 0 };
}

function disposeLiquidFill(viewport, fillState) {
  if (!fillState) return;
  viewport.scene.remove(fillState.mesh);
  fillState.mesh.geometry.dispose();
  fillState.mesh.material.dispose();
}

/**
 * Anima el plano de recorte hacia arriba durante `durationMs`.
 * @param {Function} onDone   se llama al terminar
 * @param {Function} onUpdate se llama en cada cuadro con la fracción llena (0-1)
 */
function animateLiquidFill(fillState, targetFraction, durationMs, onDone, onUpdate) {
  const startFrac = fillState.filled;
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const frac = startFrac + (targetFraction - startFrac) * eased;
    const y = fillState.minY + frac * (fillState.maxY - fillState.minY);
    fillState.plane.constant = y;
    fillState.filled = frac;
    if (onUpdate) onUpdate(frac);
    if (t < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  requestAnimationFrame(step);
}

/* ============================================================
   Probeta (graduated cylinder) SVG — shared by liquid transfer
   and the displacement method.
   ============================================================ */
function niceScaleMax(value) {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  for (const c of [1, 2, 2.5, 5, 10]) {
    const cand = c * magnitude;
    if (cand >= value * 1.15) return cand;
  }
  return Math.ceil((value * 1.3) / magnitude) * magnitude;
}

/** Builds SVG markup for one graduated cylinder with a fill level. */
function probetaSVG(id, fillML, maxML) {
  const W = 90, H = 200, tubeTop = 20, tubeBottom = 190, tubeLeft = 22, tubeRight = 68;
  const tubeH = tubeBottom - tubeTop;
  const fillFrac = Math.max(0, Math.min(1, fillML / maxML));
  const fillY = tubeBottom - fillFrac * tubeH;
  const fillH = fillFrac * tubeH;
  const ticks = 5;
  let tickMarks = '';
  for (let i = 0; i <= ticks; i++) {
    const y = tubeTop + (tubeH / ticks) * i;
    const val = Math.round(maxML - (maxML / ticks) * i);
    tickMarks += `<line x1="${tubeRight}" y1="${y}" x2="${tubeRight + 6}" y2="${y}" stroke="#5E7191" stroke-width="1"/>
      <text x="${tubeRight + 9}" y="${y + 3}" font-family="JetBrains Mono, monospace" font-size="8" fill="#5E7191">${val}</text>`;
  }
  return `
  <svg id="${id}" viewBox="0 0 ${W + 40} ${H + 20}" width="120" height="240">
    <rect x="${tubeLeft}" y="${tubeTop}" width="${tubeRight - tubeLeft}" height="${tubeH}" fill="rgba(255,255,255,0.03)" stroke="#23334D" stroke-width="1.5" rx="2"/>
    <rect class="probeta-fill" x="${tubeLeft + 1}" y="${fillY}" width="${tubeRight - tubeLeft - 2}" height="${fillH}" fill="#2FB7FF" opacity="0.65"/>
    <rect x="${tubeLeft - 6}" y="${tubeBottom}" width="${tubeRight - tubeLeft + 12}" height="8" fill="#16273F" stroke="#23334D"/>
    ${tickMarks}
  </svg>`;
}

window.createLiquidFill = createLiquidFill;
window.disposeLiquidFill = disposeLiquidFill;
window.animateLiquidFill = animateLiquidFill;
window.niceScaleMax = niceScaleMax;
window.probetaSVG = probetaSVG;
