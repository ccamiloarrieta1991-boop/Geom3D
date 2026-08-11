/* ============================================================
   app.js
   Bootstraps the whole application:
   - Lab3DViewport: a reusable Three.js scene/camera/renderer
     wrapper (one instance per phase that needs a 3D canvas).
   - Catalog rendering for Fase 1 and Fase 2.
   - Event wiring for dimensions, view options, "Descomponer",
     and the Fase 2 calculate/check/procedure flow.
   ============================================================ */

/* ---------- Reusable 3D viewport ---------- */
class Lab3DViewport {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(8, 12, 10);
    const fill = new THREE.DirectionalLight(0x6fd8c8, 0.35);
    fill.position.set(-8, -4, -6);
    const ambient = new THREE.AmbientLight(0x8fa5c4, 0.55);
    this.scene.add(key, fill, ambient);

    this.material = new THREE.MeshStandardMaterial({
      color: 0x17bfa8,
      metalness: 0.15,
      roughness: 0.45,
      transparent: false,
      opacity: 1,
    });

    this.mesh = null;
    this.edges = null;
    this.vertices = null;

    this.controls = new SimpleOrbitControls(this.camera, canvas);
    this.controls.reset(18, Math.PI / 4, Math.PI / 2.6);

    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(canvas.parentElement);
    this.resize();
  }

  resize() {
    const el = this.canvas.parentElement;
    const w = el.clientWidth, h = el.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setGeometry(geometry) {
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); }
    if (this.edges) { this.scene.remove(this.edges); this.edges.geometry.dispose(); }
    if (this.vertices) { this.scene.remove(this.vertices); this.vertices.geometry.dispose(); }

    geometry.center();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    const edgeGeo = new THREE.EdgesGeometry(geometry);
    this.edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x0a121f, linewidth: 1 }));
    this.scene.add(this.edges);

    const vertGeo = new THREE.BufferGeometry();
    vertGeo.setAttribute('position', geometry.attributes.position.clone());
    this.vertices = new THREE.Points(vertGeo, new THREE.PointsMaterial({ color: 0xf5a524, size: 0.35, sizeAttenuation: true }));
    this.scene.add(this.vertices);

    this.applyViewOptions();
    this._fitCameraDistance(geometry);
  }

  _fitCameraDistance(geometry) {
    geometry.computeBoundingSphere();
    const r = geometry.boundingSphere ? geometry.boundingSphere.radius : 6;
    const dist = Math.max(10, r * 3.2);
    this.controls.minRadius = dist * 0.4;
    this.controls.maxRadius = dist * 2.5;
    this.controls.reset(dist, this.controls.theta, this.controls.phi);
  }

  applyViewOptions() {
    const opts = State.get('viewOptions');
    if (this.edges) this.edges.visible = !!opts.edges;
    if (this.vertices) this.vertices.visible = !!opts.vertices;
    if (this.material) {
      this.material.transparent = !!opts.transparency;
      this.material.opacity = opts.transparency ? 0.38 : 1;
    }
  }

  resetView() {
    this.controls.reset(this.controls.radius, Math.PI / 4, Math.PI / 2.6);
  }

  render() {
    this.resize();
    this.renderer.render(this.scene, this.camera);
  }
}

/* ---------- Shared render loop ---------- */
const activeViewports = new Set();
function rafLoop() {
  activeViewports.forEach((vp) => vp.render());
  requestAnimationFrame(rafLoop);
}
requestAnimationFrame(rafLoop);

/* ============================================================
   Catalog rendering (shared between Explorar / Calcular)
   ============================================================ */
function renderCatalog(container, onSelect) {
  container.innerHTML = '';
  SOLIDS_CATALOG.forEach((s) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'solid-card' + (s.locked ? ' locked' : '');
    card.setAttribute('aria-current', 'false');
    if (s.locked) {
      card.disabled = true;
      card.innerHTML = `<span class="soon-tag">próx.</span><div class="glyph">${glyphSVG(s.glyph)}</div><div class="name">${s.name}</div><div class="family">${s.family}</div>`;
    } else {
      card.innerHTML = `<div class="glyph">${glyphSVG(s.glyph)}</div><div class="name">${s.name}</div><div class="family">${s.family}</div>`;
      card.addEventListener('click', () => {
        container.querySelectorAll('.solid-card').forEach((c) => c.setAttribute('aria-current', 'false'));
        card.setAttribute('aria-current', 'true');
        onSelect(s);
      });
    }
    container.appendChild(card);
  });
}

/* ============================================================
   FASE 1 — Explorar
   ============================================================ */
const ExploreState = { viewport: null, solidDef: null, dims: null };

function initExplorePhase() {
  renderCatalog(document.getElementById('catalog-explore'), selectExploreSolid);
}

function selectExploreSolid(solidDef) {
  ExploreState.solidDef = solidDef;
  ExploreState.dims = getCurrentDims(solidDef.id);

  document.getElementById('explore-lab').hidden = false;
  document.getElementById('explore-solid-name').textContent = solidDef.name;
  document.getElementById('status-right').textContent = `Sólido activo: ${solidDef.name}`;

  if (!ExploreState.viewport) {
    ExploreState.viewport = new Lab3DViewport(document.getElementById('canvas-explore'));
    activeViewports.add(ExploreState.viewport);
  }
  rebuildExploreGeometry();

  renderDimensionPanel(document.getElementById('explore-dims'), solidDef, ExploreState.dims, () => {
    rebuildExploreGeometry();
    updateExploreHud();
  });
  renderViewOptionsPanel(document.getElementById('explore-viewopts'),
    (key) => { State.set(`viewOptions.${key}`, !State.get(`viewOptions.${key}`)); ExploreState.viewport.applyViewOptions(); },
    () => ExploreState.viewport.resetView()
  );
  renderToolButtons(document.getElementById('explore-tools'), ExploreState.viewport);

  document.getElementById('explore-components').hidden = true;
  updateExploreHud();
  State.markExplored(solidDef.id);
}

function rebuildExploreGeometry() {
  const geo = ExploreState.solidDef.builder(ExploreState.dims);
  ExploreState.viewport.setGeometry(geo);
}

function updateExploreHud() {
  const hud = document.getElementById('explore-hud');
  const d = ExploreState.dims;
  hud.innerHTML = Object.entries(d).map(([k, v]) => {
    const dimDef = ExploreState.solidDef.dims.find((x) => x.key === k);
    return `<div><span class="hud-label">${dimDef.label}:</span> ${fmt(v, 1)} ${dimDef.unit}</div>`;
  }).join('');
}

function renderToolButtons(container, viewport) {
  container.innerHTML = '';
  const zoomIn = document.createElement('button');
  zoomIn.className = 'icon-btn'; zoomIn.textContent = '+'; zoomIn.title = 'Acercar';
  zoomIn.addEventListener('click', () => { viewport.controls.radius = Math.max(viewport.controls.minRadius, viewport.controls.radius - 2); viewport.controls.update(); });
  const zoomOut = document.createElement('button');
  zoomOut.className = 'icon-btn'; zoomOut.textContent = '−'; zoomOut.title = 'Alejar';
  zoomOut.addEventListener('click', () => { viewport.controls.radius = Math.min(viewport.controls.maxRadius, viewport.controls.radius + 2); viewport.controls.update(); });
  const resetBtn = document.createElement('button');
  resetBtn.className = 'icon-btn'; resetBtn.textContent = '⟲'; resetBtn.title = 'Reiniciar vista';
  resetBtn.addEventListener('click', () => viewport.resetView());
  container.appendChild(zoomOut); container.appendChild(resetBtn); container.appendChild(zoomIn);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-descomponer').addEventListener('click', () => {
    const panel = document.getElementById('explore-components');
    const willShow = panel.hidden;
    panel.hidden = !willShow;
    if (willShow) renderComponentsPanel(panel, ExploreState.solidDef, ExploreState.dims);
  });

  document.getElementById('btn-go-calculate').addEventListener('click', () => {
    Navigation.goTo('calculate');
    selectCalculateSolid(ExploreState.solidDef, true);
  });
});

/* ============================================================
   FASE 2 — Calcular
   ============================================================ */
const CalcState = { viewport: null, solidDef: null, dims: null, quantity: 'volumen' };

function initCalculatePhase() {
  renderCatalog(document.getElementById('catalog-calculate'), (s) => selectCalculateSolid(s, false));
}

function selectCalculateSolid(solidDef, fromExplore) {
  CalcState.solidDef = solidDef;
  CalcState.dims = getCurrentDims(solidDef.id);
  CalcState.quantity = availableQuantities(solidDef.id)[0].key === 'areaBase' ? 'volumen' : 'volumen';

  document.getElementById('calculate-lab').hidden = false;
  document.getElementById('calc-solid-name').textContent = solidDef.name;

  if (fromExplore) {
    document.getElementById('catalog-calculate').querySelectorAll('.solid-card').forEach((c) => {
      c.setAttribute('aria-current', c.querySelector('.name').textContent === solidDef.name ? 'true' : 'false');
    });
  }

  if (!CalcState.viewport) {
    CalcState.viewport = new Lab3DViewport(document.getElementById('canvas-calculate'));
    activeViewports.add(CalcState.viewport);
  }
  rebuildCalcGeometry();

  renderDimensionPanel(document.getElementById('calc-dims'), solidDef, CalcState.dims, () => {
    rebuildCalcGeometry();
    updateCalcHud();
    resetCalcAnswerUI();
  });

  renderQuantityChips();
  resetCalcAnswerUI();
  updateCalcHud();
}

function renderQuantityChips() {
  const chipContainer = document.getElementById('calc-quantity-chips');
  const quantities = availableQuantities(CalcState.solidDef.id);
  if (!quantities.find((q) => q.key === CalcState.quantity)) CalcState.quantity = quantities[quantities.length - 1].key;
  renderChipRow(chipContainer, quantities.map((q) => ({
    label: q.label,
    active: () => CalcState.quantity === q.key,
    onToggle: () => {
      CalcState.quantity = q.key;
      renderQuantityChips();
      resetCalcAnswerUI();
    },
  })));
  const unitSuffix = quantities.find((q) => q.key === CalcState.quantity);
  document.getElementById('calc-unit-suffix').textContent = unitSuffix.unit;
}

function rebuildCalcGeometry() {
  const geo = CalcState.solidDef.builder(CalcState.dims);
  CalcState.viewport.setGeometry(geo);
}

function updateCalcHud() {
  const hud = document.getElementById('calc-hud');
  const d = CalcState.dims;
  hud.innerHTML = Object.entries(d).map(([k, v]) => {
    const dimDef = CalcState.solidDef.dims.find((x) => x.key === k);
    return `<div><span class="hud-label">${dimDef.label}:</span> ${fmt(v, 1)} ${dimDef.unit}</div>`;
  }).join('');
}

function resetCalcAnswerUI() {
  document.getElementById('calc-answer').value = '';
  const fb = document.getElementById('calc-feedback');
  fb.className = 'feedback';
  fb.textContent = '';
  document.getElementById('calc-procedure').innerHTML = '';

  const inReto = CalcMode.mode === 'reto' && RetoState.current;
  const isInverse = inReto && RetoState.current.inverse;

  if (isInverse) {
    const targetDef = getSolidDef(RetoState.current.solidId).dims.find((d) => d.key === RetoState.current.targetDimKey);
    document.getElementById('calc-answer-label').textContent = `${targetDef.label} (${targetDef.unit})`;
    document.getElementById('calc-instruction').textContent = 'Este reto pide hallar una dimensión, no un área o volumen.';
    document.getElementById('calc-unit-suffix').textContent = targetDef.unit;
    document.getElementById('calc-quantity-block').hidden = true;
    document.getElementById('btn-ver-procedimiento').disabled = true;
    document.getElementById('btn-ver-procedimiento').title = 'No disponible para retos de nivel 4';
  } else {
    document.getElementById('calc-answer-label').textContent = 'Resultado';
    document.getElementById('calc-instruction').textContent = 'Calcula tú el resultado antes de comprobar.';
    document.getElementById('calc-quantity-block').hidden = false;
    document.getElementById('btn-ver-procedimiento').disabled = false;
    document.getElementById('btn-ver-procedimiento').title = '';
    const q = availableQuantities(CalcState.solidDef.id).find((x) => x.key === CalcState.quantity);
    if (q) document.getElementById('calc-unit-suffix').textContent = q.unit;
  }
  updatePredictPanel();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-comprobar').addEventListener('click', () => {
    const raw = document.getElementById('calc-answer').value.trim().replace(',', '.');
    const studentValue = parseFloat(raw);
    const inReto = CalcMode.mode === 'reto' && RetoState.current;
    const isInverse = inReto && RetoState.current.inverse;
    const fb = document.getElementById('calc-feedback');

    let result;
    if (isInverse) {
      const correctValue = RetoState.current.answerValue;
      result = checkAnswer(studentValue, correctValue, { solidId: RetoState.current.solidId, dims: RetoState.current.dims, quantity: 'dimension' });
    } else {
      const correctValue = trueValueFor(CalcState.solidDef.id, CalcState.dims, CalcState.quantity);
      result = checkAnswer(studentValue, correctValue, {
        solidId: CalcState.solidDef.id, dims: CalcState.dims, quantity: CalcState.quantity,
      });
    }

    fb.className = `feedback show feedback--${result.status === 'correct' ? 'correct' : result.status === 'approx' ? 'approx' : 'incorrect'}`;
    fb.textContent = result.message;

    if (inReto) {
      if (result.status === 'correct') State.set('retosCompleted', (State.get('retosCompleted') || 0) + 1);
    } else {
      State.recordAttempt(CalcState.solidDef.id, result.status === 'correct');
    }
  });

  document.getElementById('btn-ver-procedimiento').addEventListener('click', () => {
    if (document.getElementById('btn-ver-procedimiento').disabled) return;
    const steps = buildProcedure(CalcState.solidDef.id, CalcState.dims, CalcState.quantity);
    const container = document.getElementById('calc-procedure');
    container.innerHTML = '';
    steps.forEach((text, i) => {
      const div = document.createElement('div');
      div.className = 'step';
      div.style.animationDelay = `${i * 0.12}s`;
      div.textContent = text;
      container.appendChild(div);
    });
  });
});

/* ============================================================
   Bootstrap
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  Navigation.init();
  initExplorePhase();
  initCalculatePhase();
  initCheckPhase();
  initExploreModeSwitch();
  initCalcModeSwitch();
  initRetoUI();
  wireTopbarModals();

  if (State.get('teacher.showFormulas') === false) {
    document.getElementById('btn-ver-procedimiento').hidden = true;
  }

  document.addEventListener('geom3d:phasechange', (e) => {
    // Trigger a resize pass once a view becomes visible again
    // (canvases sized 0x0 while hidden need a re-measure).
    requestAnimationFrame(() => {
      if (ExploreState.viewport) ExploreState.viewport.resize();
      if (CalcState.viewport) CalcState.viewport.resize();
      if (RevolutionState.viewport) RevolutionState.viewport.resize();
      if (CheckState.liquidViewport) CheckState.liquidViewport.resize();
      if (CheckState.cubesViewport) CheckState.cubesViewport.resize();
    });
  });
});

/* ============================================================
   FASE 1 (extra) — Modo "Sólidos de revolución"
   ============================================================ */
ExploreState.mode = 'catalog';
const RevolutionState = { viewport: null, presetId: 'rectangulo_cilindro', angleDeg: 0, playing: false };

function initExploreModeSwitch() {
  const container = document.getElementById('explore-mode-switch');
  renderChipRow(container, [
    { label: 'Catálogo', active: () => ExploreState.mode !== 'revolution', onToggle: () => setExploreMode('catalog') },
    { label: 'Sólidos de revolución', active: () => ExploreState.mode === 'revolution', onToggle: () => setExploreMode('revolution') },
  ]);
}

function setExploreMode(mode) {
  ExploreState.mode = mode;
  document.getElementById('catalog-explore').hidden = mode !== 'catalog';
  document.getElementById('explore-lab').hidden = mode !== 'catalog' || !ExploreState.solidDef;
  document.getElementById('revolution-lab').hidden = mode !== 'revolution';
  initExploreModeSwitch();
  if (mode === 'revolution') initRevolutionLab();
}

function initRevolutionLab() {
  if (!RevolutionState.viewport) {
    RevolutionState.viewport = new Lab3DViewport(document.getElementById('canvas-revolution'));
    activeViewports.add(RevolutionState.viewport);
    RevolutionState.viewport.material.color.set(0x2fb7ff);
  }
  renderRevolutionPresetChips();
  rebuildRevolutionGeometry();
}

function renderRevolutionPresetChips() {
  const container = document.getElementById('revolution-presets');
  renderChipRow(container, Object.keys(REVOLUTION_PRESETS).map((id) => ({
    label: `${REVOLUTION_PRESETS[id].flatName} → ${REVOLUTION_PRESETS[id].solidName}`,
    active: () => RevolutionState.presetId === id,
    onToggle: () => { RevolutionState.presetId = id; RevolutionState.angleDeg = 0; document.getElementById('revolution-angle').value = 0; rebuildRevolutionGeometry(); },
  })));
}

function rebuildRevolutionGeometry() {
  const angleRad = RevolutionState.angleDeg * (Math.PI / 180);
  const geo = buildRevolutionGeometry(RevolutionState.presetId, angleRad);
  RevolutionState.viewport.setGeometry(geo);
  const preset = REVOLUTION_PRESETS[RevolutionState.presetId];
  document.getElementById('revolution-name').textContent = `${preset.flatName} → ${preset.solidName}`;
  document.getElementById('revolution-angle-readout').textContent = `${Math.round(RevolutionState.angleDeg)}°`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('revolution-angle').addEventListener('input', (e) => {
    RevolutionState.angleDeg = parseFloat(e.target.value);
    rebuildRevolutionGeometry();
  });
  document.getElementById('btn-rev-reset').addEventListener('click', () => {
    RevolutionState.angleDeg = 0;
    document.getElementById('revolution-angle').value = 0;
    rebuildRevolutionGeometry();
  });
  document.getElementById('btn-rev-play').addEventListener('click', (e) => {
    if (RevolutionState.playing) return;
    RevolutionState.playing = true;
    const btn = e.currentTarget;
    btn.textContent = '⏸';
    const startDeg = RevolutionState.angleDeg >= 359 ? 0 : RevolutionState.angleDeg;
    RevolutionState.angleDeg = startDeg;
    const start = performance.now();
    const duration = 2600;
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      RevolutionState.angleDeg = startDeg + t * (360 - startDeg);
      document.getElementById('revolution-angle').value = RevolutionState.angleDeg;
      rebuildRevolutionGeometry();
      if (t < 1 && RevolutionState.playing) requestAnimationFrame(step);
      else { RevolutionState.playing = false; btn.textContent = '▶'; }
    }
    requestAnimationFrame(step);
  });

  document.getElementById('btn-desarrollo').addEventListener('click', () => {
    if (!ExploreState.solidDef) return;
    openModal(`Desarrollo plano — ${ExploreState.solidDef.name}`, (body) => {
      renderDevelopment(body, ExploreState.solidDef, ExploreState.dims);
    });
  });
});

/* ============================================================
   FASE 2 (extra) — Modo Reto y Predicción
   ============================================================ */
const CalcMode = { mode: 'free' };
const RetoState = { level: 1, current: null };

function initCalcModeSwitch() {
  const container = document.getElementById('calc-mode-switch');
  renderChipRow(container, [
    { label: 'Libre', active: () => CalcMode.mode === 'free', onToggle: () => setCalcMode('free') },
    { label: 'Retos', active: () => CalcMode.mode === 'reto', onToggle: () => setCalcMode('reto') },
  ]);
}

function setCalcMode(mode) {
  CalcMode.mode = mode;
  document.getElementById('catalog-calculate').hidden = mode === 'reto';
  document.getElementById('reto-panel').hidden = mode !== 'reto';
  document.getElementById('calculate-lab').hidden = mode === 'reto' ? !RetoState.current : !CalcState.solidDef;
  initCalcModeSwitch();
}

function initRetoUI() {
  const container = document.getElementById('reto-level-chips');
  renderChipRow(container, [1, 2, 3, 4].map((l) => ({
    label: `Nivel ${l}`,
    active: () => RetoState.level === l,
    onToggle: () => { RetoState.level = l; initRetoUI(); },
  })));
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-new-reto').addEventListener('click', () => {
    const challenge = generateChallenge(RetoState.level);
    RetoState.current = challenge;
    document.getElementById('reto-prompt-text').textContent = challenge.promptText;

    const solidDef = getSolidDef(challenge.solidId);
    selectCalculateSolid(solidDef, false);
    CalcState.dims = { ...challenge.dims };
    rebuildCalcGeometry();
    renderDimensionPanel(document.getElementById('calc-dims'), solidDef, CalcState.dims, () => {
      rebuildCalcGeometry();
      updateCalcHud();
      resetCalcAnswerUI();
    });
    updateCalcHud();

    if (!challenge.inverse) {
      CalcState.quantity = challenge.quantity;
      renderQuantityChips();
    }
    document.getElementById('calculate-lab').hidden = false;
    resetCalcAnswerUI();
  });
});

/** Shows/hides and populates the proportionality prediction panel for the current solid+quantity. */
function updatePredictPanel() {
  const panel = document.getElementById('predict-panel');
  if (!CalcState.solidDef || CalcState.quantity !== 'volumen') { panel.hidden = true; return; }
  const pred = getPrediction(CalcState.solidDef.id);
  if (!pred) { panel.hidden = true; return; }
  panel.hidden = false;
  document.getElementById('predict-question').textContent = pred.question;
  const optsContainer = document.getElementById('predict-options');
  optsContainer.innerHTML = '';
  const fb = document.getElementById('predict-feedback');
  fb.style.display = 'none';
  pred.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      optsContainer.querySelectorAll('button').forEach((b) => {
        b.removeAttribute('data-chosen'); b.removeAttribute('data-correct'); b.removeAttribute('data-wrong');
      });
      btn.setAttribute('data-chosen', 'true');
      const correct = i === pred.correctIndex;
      btn.setAttribute(correct ? 'data-correct' : 'data-wrong', 'true');
      fb.style.display = 'block';
      fb.style.color = correct ? 'var(--c-green)' : 'var(--c-red)';
      fb.textContent = pred.explanation;
    });
    optsContainer.appendChild(btn);
  });
}

/* ============================================================
   FASE 3 — Comprobar (laboratorio experimental)
   ============================================================ */
const CheckState = {
  solidDef: null, dims: null, currentMethod: 'liquid',
  liquidViewport: null, liquidFillState: null,
  cubesViewport: null, unitCubesInst: null,
};

function initCheckPhase() {
  renderCatalog(document.getElementById('catalog-check'), selectCheckSolid);
}

function selectCheckSolid(solidDef) {
  CheckState.solidDef = solidDef;
  CheckState.dims = getCurrentDims(solidDef.id);
  document.getElementById('check-lab').hidden = false;
  document.getElementById('comparison-block').hidden = true;
  document.getElementById('reflection-block').hidden = true;
  document.getElementById('displacement-wrap').innerHTML = '';
  initMethodTabs();
  setupLiquidMethod();
  setupCubesMethod();
  switchMethod('liquid');
}

function initMethodTabs() {
  const container = document.getElementById('method-tabs');
  const methods = [
    { id: 'liquid', label: '💧 Líquido' },
    { id: 'displacement', label: '🧪 Desplazamiento' },
    { id: 'cubes', label: '🧊 Cubos unitarios' },
  ];
  container.innerHTML = '';
  methods.forEach((m) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = m.label;
    btn.setAttribute('aria-current', String(CheckState.currentMethod === m.id));
    btn.addEventListener('click', () => switchMethod(m.id));
    container.appendChild(btn);
  });
}

function switchMethod(id) {
  CheckState.currentMethod = id;
  ['liquid', 'displacement', 'cubes'].forEach((m) => {
    document.getElementById(`method-${m}`).setAttribute('data-active', String(m === id));
  });
  initMethodTabs();
  requestAnimationFrame(() => {
    if (CheckState.liquidViewport) CheckState.liquidViewport.resize();
    if (CheckState.cubesViewport) CheckState.cubesViewport.resize();
  });
}

function setupLiquidMethod() {
  if (!CheckState.liquidViewport) {
    CheckState.liquidViewport = new Lab3DViewport(document.getElementById('canvas-liquid'));
    activeViewports.add(CheckState.liquidViewport);
  }
  if (CheckState.liquidFillState) { disposeLiquidFill(CheckState.liquidViewport, CheckState.liquidFillState); CheckState.liquidFillState = null; }
  const geo = CheckState.solidDef.builder(CheckState.dims);
  CheckState.liquidViewport.setGeometry(geo);
  document.getElementById('liquid-solid-name').textContent = CheckState.solidDef.name;
  const vol = Volumes[CheckState.solidDef.id](CheckState.dims);
  document.getElementById('liquid-target-volume').textContent = fmt(vol);
  document.getElementById('btn-transferir').disabled = true;
  document.getElementById('liquid-probeta-wrap').style.display = 'none';
  document.getElementById('liquid-probeta-wrap').innerHTML = '';
}

function setupCubesMethod() {
  if (!CheckState.cubesViewport) {
    CheckState.cubesViewport = new Lab3DViewport(document.getElementById('canvas-cubes'));
    activeViewports.add(CheckState.cubesViewport);
  }
  if (CheckState.unitCubesInst) { disposeUnitCubes(CheckState.cubesViewport, CheckState.unitCubesInst); CheckState.unitCubesInst = null; }
  const geo = CheckState.solidDef.builder(CheckState.dims);
  CheckState.cubesViewport.setGeometry(geo);
  CheckState.cubesViewport.material.transparent = true;
  CheckState.cubesViewport.material.opacity = 0.22;
  document.getElementById('cubes-solid-name').textContent = CheckState.solidDef.name;
  document.getElementById('cubes-count').textContent = 'Cantidad de cubos: —';
}

function showComparisonAndReflection(mathVol, experimentalVol) {
  const block = document.getElementById('comparison-block');
  block.hidden = false;
  renderComparison(block, computeExperimentComparison(mathVol, experimentalVol));
  const reflectBlock = document.getElementById('reflection-block');
  reflectBlock.hidden = false;
  renderReflection(reflectBlock, CheckState.solidDef.id);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-llenar').addEventListener('click', () => {
    if (CheckState.liquidFillState) disposeLiquidFill(CheckState.liquidViewport, CheckState.liquidFillState);
    CheckState.liquidFillState = createLiquidFill(CheckState.liquidViewport);
    document.getElementById('btn-transferir').disabled = true;
    animateLiquidFill(CheckState.liquidFillState, 1, 1400, () => {
      document.getElementById('btn-transferir').disabled = false;
    });
  });

  document.getElementById('btn-transferir').addEventListener('click', () => {
    const vol = Volumes[CheckState.solidDef.id](CheckState.dims);
    const experimentalML = Math.round(vol);
    const maxML = niceScaleMax(experimentalML);
    const wrap = document.getElementById('liquid-probeta-wrap');
    wrap.style.display = 'flex';
    wrap.innerHTML = `<div class="probeta-box">${probetaSVG('probeta-liquid', 0, maxML)}<div class="probeta-caption">Volumen experimental</div><div class="probeta-value" id="liquid-probeta-value">0 ml</div></div>`;

    requestAnimationFrame(() => {
      const fillRect = document.querySelector('#probeta-liquid .probeta-fill');
      const tubeTop = 20, tubeBottom = 190, tubeH = tubeBottom - tubeTop;
      const start = performance.now(); const duration = 1000;
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const currentML = eased * experimentalML;
        const frac = currentML / maxML;
        fillRect.setAttribute('y', tubeBottom - frac * tubeH);
        fillRect.setAttribute('height', frac * tubeH);
        document.getElementById('liquid-probeta-value').textContent = `${fmt(currentML, 0)} ml`;
        if (t < 1) requestAnimationFrame(step);
        else {
          State.markExperiment(CheckState.solidDef.id, 'liquid');
          showComparisonAndReflection(vol, experimentalML);
        }
      }
      requestAnimationFrame(step);
    });
  });

  document.getElementById('btn-desplazar').addEventListener('click', () => {
    const vol = Volumes[CheckState.solidDef.id](CheckState.dims);
    const objML = Math.round(vol);
    const wrap = document.getElementById('displacement-wrap');
    const { maxML } = renderDisplacementSetup(wrap, objML);
    requestAnimationFrame(() => {
      animateDisplacement(objML, maxML, () => {
        State.markExperiment(CheckState.solidDef.id, 'displacement');
        showComparisonAndReflection(vol, objML);
      });
    });
  });

  document.getElementById('btn-llenar-cubos').addEventListener('click', () => {
    if (CheckState.unitCubesInst) { disposeUnitCubes(CheckState.cubesViewport, CheckState.unitCubesInst); CheckState.unitCubesInst = null; }
    document.getElementById('cubes-count').textContent = 'Calculando...';
    requestAnimationFrame(() => {
      const { positions, cubeSize } = computeUnitCubePositions(CheckState.cubesViewport);
      CheckState.unitCubesInst = renderUnitCubes(CheckState.cubesViewport, positions, cubeSize);
      const experimentalVol = positions.length * cubeSize ** 3;
      document.getElementById('cubes-count').textContent = `Cantidad de cubos: ${positions.length}  →  Volumen ≈ ${fmt(experimentalVol, 0)} cm³`;
      const mathVol = Volumes[CheckState.solidDef.id](CheckState.dims);
      State.markExperiment(CheckState.solidDef.id, 'cubes');
      showComparisonAndReflection(mathVol, experimentalVol);
    });
  });
});

/* ============================================================
   Topbar modals — Progreso / Docente
   ============================================================ */
function wireTopbarModals() {
  document.getElementById('btn-open-progress').addEventListener('click', () => {
    openModal('Mi progreso', renderProgressModalBody);
  });
  document.getElementById('btn-open-teacher').addEventListener('click', () => {
    openModal('Panel del docente', renderTeacherModalBody);
  });
}

function renderProgressModalBody(body) {
  const p = computeProgress();
  body.innerHTML = `
    <div class="progress-row"><div class="p-label"><span>Exploración</span><span>${p.exploredPct}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${p.exploredPct}%"></div></div></div>
    <div class="progress-row"><div class="p-label"><span>Cálculo</span><span>${p.calcPct}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${p.calcPct}%"></div></div></div>
    <div class="progress-row"><div class="p-label"><span>Experimentación</span><span>${p.expPct}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${p.expPct}%"></div></div></div>
    <p style="font-size:12.5px;">Retos completados: <strong style="color:var(--c-amber)">${p.retosCompleted}</strong></p>
  `;
  const grid = document.createElement('div');
  grid.className = 'badge-grid';
  p.badges.forEach((b) => {
    const item = document.createElement('div');
    item.className = `badge-item${b.earned ? ' earned' : ''}`;
    item.innerHTML = `<div class="badge-icon">${b.icon}</div><div class="badge-name">${b.name}</div>`;
    grid.appendChild(item);
  });
  body.appendChild(grid);
}

function renderTeacherModalBody(body) {
  const teacher = State.data.teacher || (State.data.teacher = { showFormulas: true, hintsEnabled: true });
  body.innerHTML = `
    <div class="teacher-toggle-row">
      <span>Mostrar botón "Ver procedimiento"</span>
      <label class="switch"><input type="checkbox" id="teach-formulas" ${teacher.showFormulas ? 'checked' : ''}/><span class="slider"></span></label>
    </div>
    <div class="teacher-toggle-row">
      <span>Retroalimentación específica (pistas de error)</span>
      <label class="switch"><input type="checkbox" id="teach-hints" ${teacher.hintsEnabled ? 'checked' : ''}/><span class="slider"></span></label>
    </div>
    <h3 style="margin-top:16px; font-size:12px; text-transform:uppercase; color:var(--c-text-dim);">Resultados por sólido</h3>
    <table class="teacher-table">
      <thead><tr><th>Sólido</th><th>Intentos</th><th>Aciertos</th><th>% aciertos</th></tr></thead>
      <tbody id="teacher-stats-body"></tbody>
    </table>
    <button class="btn btn--ghost btn--sm" id="btn-reset-progress" style="margin-top:14px;">↺ Reiniciar todas las actividades</button>
  `;
  const tbody = body.querySelector('#teacher-stats-body');
  const calc = State.data.progress.calculate || {};
  const ids = Object.keys(calc);
  if (ids.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--c-text-faint);">Aún no hay intentos registrados.</td></tr>';
  } else {
    ids.forEach((id) => {
      const solidDef = getSolidDef(id);
      const entry = calc[id];
      const pct = entry.attempts ? Math.round((entry.correct / entry.attempts) * 100) : 0;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${solidDef ? solidDef.name : id}</td><td>${entry.attempts}</td><td>${entry.correct}</td><td>${pct}%</td>`;
      tbody.appendChild(tr);
    });
  }
  body.querySelector('#teach-formulas').addEventListener('change', (e) => {
    State.set('teacher.showFormulas', e.target.checked);
    document.getElementById('btn-ver-procedimiento').hidden = !e.target.checked;
  });
  body.querySelector('#teach-hints').addEventListener('change', (e) => {
    State.set('teacher.hintsEnabled', e.target.checked);
  });
  body.querySelector('#btn-reset-progress').addEventListener('click', () => {
    if (confirm('¿Reiniciar todo el progreso guardado? Esta acción no se puede deshacer.')) {
      State.reset();
      closeModal();
      location.reload();
    }
  });
}
