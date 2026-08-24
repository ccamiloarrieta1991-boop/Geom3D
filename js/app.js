/* ============================================================
   app.js — GEOM3D
   Flujo:
     FASE 1 CONSTRUIR  → asistente de clasificación
                       → plegado del desarrollo (o revolución)
                       → elementos + relación de Euler
     FASE 2 CALCULAR   → predicción → área / volumen → retos
     FASE 3 COMPROBAR  → líquido / desplazamiento / cubos unitarios
   ============================================================ */

/* ============================================================
   Visor 3D reutilizable
   ============================================================ */
class Lab3DViewport {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(8, 14, 10);
    const fill = new THREE.DirectionalLight(0x6fd8c8, 0.35);
    fill.position.set(-8, -4, -6);
    this.scene.add(key, fill, new THREE.AmbientLight(0x8fa5c4, 0.6));

    this.material = new THREE.MeshStandardMaterial({ color: 0x17bfa8, metalness: 0.15, roughness: 0.45 });

    this.mesh = null; this.edges = null; this.customGroup = null;

    this.controls = new SimpleOrbitControls(this.camera, canvas);
    this.controls.reset(22, Math.PI / 4, Math.PI / 2.6);

    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(canvas.parentElement);
    this.resize();
  }

  resize() {
    const el = this.canvas.parentElement;
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  clearAll() {
    [this.mesh, this.edges, this.customGroup].forEach((o) => {
      if (!o) return;
      this.scene.remove(o);
      if (o.traverse) o.traverse((c) => { if (c.geometry) c.geometry.dispose(); });
      else if (o.geometry) o.geometry.dispose();
    });
    this.mesh = this.edges = this.customGroup = null;
  }

  setGeometry(geometry) {
    this.clearAll();
    geometry.center();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
    this.edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x0a121f }));
    this.scene.add(this.edges);
    this._fit(geometry);
  }

  setGroup(group, approxRadius) {
    this.clearAll();
    this.customGroup = group;
    this.scene.add(group);
    const dist = Math.max(14, approxRadius * 3.2);
    this.controls.minRadius = dist * 0.35;
    this.controls.maxRadius = dist * 3;
    this.controls.reset(dist, this.controls.theta, this.controls.phi);
  }

  _fit(geometry) {
    geometry.computeBoundingSphere();
    const r = geometry.boundingSphere ? geometry.boundingSphere.radius : 6;
    const dist = Math.max(12, r * 3.2);
    this.controls.minRadius = dist * 0.35;
    this.controls.maxRadius = dist * 2.6;
    this.controls.reset(dist, this.controls.theta, this.controls.phi);
  }

  resetView() { this.controls.reset(this.controls.radius, Math.PI / 4, Math.PI / 2.6); }
  render() { this.resize(); this.renderer.render(this.scene, this.camera); }
}

const activeViewports = new Set();
(function loop() { activeViewports.forEach((v) => v.render()); requestAnimationFrame(loop); })();

/* ============================================================
   Sesión de trabajo (el sólido activo atraviesa las 3 fases)
   ============================================================ */
const Session = { solidDef: null, dims: null };

function setActiveSolid(solidDef) {
  Session.solidDef = solidDef;
  Session.dims = getCurrentDims(solidDef.id);
  State.set('currentSolidId', solidDef.id);
  State.markExplored(solidDef.id);
  document.getElementById('status-right').textContent = `Sólido activo: ${solidDef.name}`;
}

/* ============================================================
   FASE 1 · Asistente de clasificación
   ============================================================ */
const Wizard = { path: [] };

const WIZARD_STEPS = {
  root: {
    question: '¿Qué tipo de cuerpo geométrico quieres estudiar?',
    hint: 'Los poliedros están formados únicamente por caras planas. Los cuerpos redondos tienen al menos una superficie curva.',
    choices: () => ([
      { id: 'poliedro', title: 'Poliedro', glyph: 'cube', desc: 'Caras planas, aristas y vértices. Incluye prismas, pirámides y poliedros regulares.' },
      { id: 'redondo', title: 'Cuerpo redondo', glyph: 'cylinder', desc: 'Superficies curvas. Se generan girando una figura plana alrededor de un eje.' },
    ]),
  },
  poliedro: {
    question: '¿Qué clase de poliedro?',
    hint: 'Un prisma tiene dos bases iguales y paralelas. Una pirámide tiene una sola base, y sus caras laterales se encuentran en un mismo vértice.',
    choices: () => ([
      { id: 'prisma', title: 'Prisma', glyph: 'pentaprism', desc: 'Dos bases iguales unidas por caras laterales rectangulares.' },
      { id: 'piramide', title: 'Pirámide', glyph: 'pyramid', desc: 'Una base y caras laterales triangulares que convergen en el ápice.' },
      { id: 'regular', title: 'Poliedro regular', glyph: 'octa', desc: 'Todas sus caras son polígonos regulares idénticos: tetraedro, octaedro.' },
    ]),
  },
  prisma: {
    question: '¿Cuál es la forma de la base?',
    hint: 'La base determina cuántas caras laterales tendrá el prisma y qué fórmula usarás para calcular su área.',
    choices: () => solidsByKind('prisma').map((s) => ({
      id: s.id, title: BASE_SHAPES.find((b) => b.key === s.baseShape).name,
      glyph: s.glyph, desc: s.facesText, terminal: true,
    })),
  },
  piramide: {
    question: '¿Cuál es la forma de la base?',
    hint: 'El número de lados de la base es también el número de caras triangulares que tendrá la pirámide.',
    choices: () => solidsByKind('piramide').map((s) => ({
      id: s.id, title: BASE_SHAPES.find((b) => b.key === s.baseShape).name,
      glyph: s.glyph, desc: s.facesText, terminal: true,
    })),
  },
  regular: {
    question: '¿Cuál poliedro regular?',
    hint: 'En un poliedro regular todas las caras son polígonos regulares iguales, y en cada vértice concurre el mismo número de caras.',
    choices: () => solidsByKind('regular').map((s) => ({
      id: s.id, title: s.name, glyph: s.glyph, desc: s.facesText, terminal: true,
    })),
  },
  redondo: {
    question: '¿Qué cuerpo redondo?',
    hint: 'Cada uno se puede generar girando una figura plana alrededor de un eje — lo verás en el siguiente paso.',
    choices: () => solidsByGroup('redondo').map((s) => ({
      id: s.id, title: s.name, glyph: s.glyph, desc: s.facesText, terminal: true,
    })),
  },
};

const STEP_LABELS = {
  root: 'Inicio', poliedro: 'Poliedro', redondo: 'Cuerpo redondo',
  prisma: 'Prisma', piramide: 'Pirámide', regular: 'Poliedro regular',
};

function renderWizard(stepId) {
  const step = WIZARD_STEPS[stepId];
  document.getElementById('wizard').hidden = false;
  document.getElementById('workspace').hidden = true;
  document.getElementById('explore-title').textContent = '¿Qué cuerpo vamos a estudiar?';
  document.getElementById('wizard-question').textContent = step.question;
  document.getElementById('wizard-hint').textContent = step.hint;

  const bc = document.getElementById('wizard-breadcrumb');
  bc.innerHTML = '';
  Wizard.path.forEach((p, i) => {
    const crumb = document.createElement('span');
    crumb.className = 'crumb';
    crumb.textContent = STEP_LABELS[p] || p;
    crumb.addEventListener('click', () => { Wizard.path = Wizard.path.slice(0, i); renderWizard(p); });
    bc.appendChild(crumb);
    const sep = document.createElement('span');
    sep.className = 'sep'; sep.textContent = '›';
    bc.appendChild(sep);
  });

  const grid = document.getElementById('wizard-choices');
  grid.innerHTML = '';
  step.choices().forEach((c) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'choice-card';
    card.innerHTML = `<div class="c-glyph">${glyphSVG(c.glyph)}</div><div class="c-title">${c.title}</div><div class="c-desc">${c.desc}</div>`;
    card.addEventListener('click', () => {
      Wizard.path.push(stepId);
      if (c.terminal) openWorkspace(getSolidDef(c.id));
      else renderWizard(c.id);
    });
    grid.appendChild(card);
  });
}

/* ============================================================
   FASE 1 · Espacio de trabajo (Construir / Elementos)
   ============================================================ */
const Build = { viewport: null, net: null, foldT: 0, playing: false };
const Elements = { viewport: null, helpers: null };
let currentWsTab = 'build';

function openWorkspace(solidDef) {
  setActiveSolid(solidDef);
  document.getElementById('wizard').hidden = true;
  document.getElementById('workspace').hidden = false;
  document.getElementById('explore-title').textContent = solidDef.name;
  currentWsTab = 'build';
  renderWsTabs();
  setupBuildPanel();
  switchWsTab('build');
}

function renderWsTabs() {
  const isRound = Session.solidDef.group === 'redondo';
  const tabs = [
    { id: 'build', label: isRound ? '① Generar por revolución' : '① Plegar el desarrollo' },
    { id: 'elements', label: '② Caras, vértices y aristas' },
  ];
  const c = document.getElementById('ws-tabs');
  c.innerHTML = '';
  const back = document.createElement('button');
  back.type = 'button';
  back.textContent = '← Cambiar de sólido';
  back.addEventListener('click', () => { Wizard.path = []; renderWizard('root'); });
  c.appendChild(back);
  tabs.forEach((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t.label;
    b.setAttribute('aria-current', String(currentWsTab === t.id));
    b.addEventListener('click', () => switchWsTab(t.id));
    c.appendChild(b);
  });
}

function switchWsTab(id) {
  currentWsTab = id;
  document.getElementById('ws-build').setAttribute('data-active', String(id === 'build'));
  document.getElementById('ws-elements').setAttribute('data-active', String(id === 'elements'));
  renderWsTabs();
  if (id === 'elements') setupElementsPanel();
  requestAnimationFrame(() => {
    if (Build.viewport) Build.viewport.resize();
    if (Elements.viewport) Elements.viewport.resize();
  });
}

/* ---------- Construir: plegado o revolución ---------- */
function setupBuildPanel() {
  if (!Build.viewport) {
    Build.viewport = new Lab3DViewport(document.getElementById('canvas-build'));
    activeViewports.add(Build.viewport);
    renderToolButtons(document.getElementById('build-tools'), Build.viewport);
  }
  const def = Session.solidDef;
  document.getElementById('build-solid-name').textContent = def.name;

  const isRound = def.group === 'redondo';
  document.getElementById('fold-title').textContent = isRound ? 'Generar por revolución' : 'Plegar el desarrollo';
  document.getElementById('fold-desc').textContent = isRound
    ? (def.revolutionPreset
        ? 'Mueve el control para girar la figura plana alrededor del eje y observa cómo se genera el sólido.'
        : 'Este cuerpo se obtiene al cortar un cono con un plano paralelo a la base. Ajusta sus dimensiones para explorarlo.')
    : 'Mueve el control para cerrar el desarrollo plano y formar el sólido. Observa en qué se convierte cada cara.';
  document.getElementById('fold-label-a').textContent = isRound ? '0°' : 'Plano';
  document.getElementById('fold-label-b').textContent = isRound ? '360°' : 'Sólido';

  const slider = document.getElementById('fold-slider');
  const canAnimate = !isRound || !!def.revolutionPreset;
  slider.disabled = !canAnimate;
  document.getElementById('btn-fold-play').disabled = !canAnimate;
  slider.value = canAnimate ? 0 : 100;
  Build.foldT = canAnimate ? 0 : 1;

  renderDimensionPanel(document.getElementById('build-dims'), def, Session.dims, () => {
    rebuildBuild(); updateBuildHud();
  });
  document.getElementById('build-faces').innerHTML =
    `<h3>De qué está formado</h3><p style="font-size:12.5px; margin:0;">${def.facesText}.</p>`;
  rebuildBuild();
  updateBuildHud();
  updateFoldReadout(Build.foldT);
}

function rebuildBuild() {
  const def = Session.solidDef;
  if (def.group === 'redondo') {
    if (def.revolutionPreset) {
      Build.viewport.setGeometry(buildRevolutionGeometry(def.revolutionPreset, Build.foldT * Math.PI * 2, Session.dims));
    } else {
      Build.viewport.setGeometry(def.builder(Session.dims));
    }
    return;
  }
  const net = buildFoldableNet(def, Session.dims);
  Build.net = net;
  const maxDim = Math.max(...Object.values(Session.dims));
  Build.viewport.setGroup(net.group, maxDim * 1.8);
  net.setFold(Build.foldT);
}

function updateFoldReadout(t) {
  const isRound = Session.solidDef.group === 'redondo';
  document.getElementById('fold-readout').textContent =
    isRound ? `${Math.round(t * 360)}°` : `${Math.round(t * 100)}%`;
  const label = document.getElementById('fold-stage-label');
  if (isRound) label.textContent = t === 0 ? 'Figura plana' : t >= 0.999 ? 'Sólido completo' : 'Generando…';
  else label.textContent = t === 0 ? 'Desarrollo plano' : t >= 0.999 ? 'Sólido formado' : 'Plegando…';
}

function updateBuildHud() {
  document.getElementById('build-hud').innerHTML = Session.solidDef.dims.map((d) =>
    `<div><span class="hud-label">${d.label}:</span> ${fmt(Session.dims[d.key], 1)} ${d.unit}</div>`).join('');
}

function renderToolButtons(container, viewport) {
  container.innerHTML = '';
  const mk = (txt, title, fn) => {
    const b = document.createElement('button');
    b.className = 'icon-btn'; b.textContent = txt; b.title = title;
    b.addEventListener('click', fn); container.appendChild(b);
  };
  mk('−', 'Alejar', () => { viewport.controls.radius = Math.min(viewport.controls.maxRadius, viewport.controls.radius + 2); viewport.controls.update(); });
  mk('⟲', 'Reiniciar vista', () => viewport.resetView());
  mk('+', 'Acercar', () => { viewport.controls.radius = Math.max(viewport.controls.minRadius, viewport.controls.radius - 2); viewport.controls.update(); });
}

/* ---------- Elementos + Euler ---------- */
function setupElementsPanel() {
  if (!Elements.viewport) {
    Elements.viewport = new Lab3DViewport(document.getElementById('canvas-elements'));
    activeViewports.add(Elements.viewport);
    renderToolButtons(document.getElementById('elements-tools'), Elements.viewport);
  }
  const def = Session.solidDef;
  document.getElementById('elements-solid-name').textContent = def.name;

  Elements.viewport.setGeometry(def.builder(Session.dims));
  Elements.viewport.material.transparent = true;
  Elements.viewport.material.opacity = 0.55;

  const helpers = buildTopologyHelpers(Elements.viewport.mesh.geometry);
  helpers.edges.visible = false;
  helpers.vertices.visible = false;
  Elements.viewport.scene.add(helpers.edges, helpers.vertices);
  Elements.helpers = helpers;

  const topo = getTopology(def);
  const grid = document.getElementById('element-grid');
  grid.innerHTML = '';
  const items = topo
    ? [
        { key: 'faces', name: 'Caras (C)', count: topo.F },
        { key: 'vertices', name: 'Vértices (V)', count: topo.V },
        { key: 'edges', name: 'Aristas (A)', count: topo.E },
      ]
    : [
        { key: 'faces', name: 'Superficies', count: def.id === 'esfera' ? 1 : def.id === 'cono' ? 2 : 3 },
        { key: 'vertices', name: 'Vértices', count: def.id === 'cono' ? 1 : 0 },
        { key: 'edges', name: 'Aristas', count: 0 },
      ];

  items.forEach((it) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'element-item';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<div class="el-count">${it.count}</div><div class="el-name">${it.name}</div>`;
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      grid.querySelectorAll('.element-item').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', String(on));
      Elements.helpers.edges.visible = on && it.key === 'edges';
      Elements.helpers.vertices.visible = on && it.key === 'vertices';
      Elements.viewport.material.opacity = on && it.key === 'faces' ? 0.95 : 0.5;
    });
    grid.appendChild(b);
  });

  renderEulerBlock(topo);
}

function renderEulerBlock(topo) {
  const el = document.getElementById('euler-block');
  if (!topo) {
    el.innerHTML = `<h3>Relación de Euler</h3>
      <p style="font-size:12.5px; margin:0;">La relación <strong>C + V = A + 2</strong> se cumple en los <em>poliedros</em>: cuerpos formados únicamente por caras planas. Este es un cuerpo redondo, con superficies curvas, así que no tiene caras ni aristas en ese sentido y la fórmula no se le aplica. Construye un prisma o una pirámide para comprobarla.</p>`;
    return;
  }
  const e = eulerCheck(topo);
  el.innerHTML = `<h3>Relación de Euler</h3>
    <div class="euler-box">
      <div class="euler-formula">
        C + V = A + 2<br>
        <span class="cv">${topo.F} + ${topo.V}</span> = <span class="ar">${topo.E} + 2</span><br>
        <span class="cv">${e.left}</span> = <span class="ar">${e.right}</span>
      </div>
      <div class="euler-verdict" style="color:${e.holds ? 'var(--c-green)' : 'var(--c-red)'}">
        ${e.holds ? '✓ Se cumple la relación de Euler' : '✗ No se cumple'}
      </div>
    </div>
    <p style="font-size:11.5px; margin-top:10px;">Cambia de sólido y verás que la igualdad se mantiene en todos los poliedros, sin importar cuántas caras tengan.</p>`;
}

/* ============================================================
   FASE 2 · Predicción y cálculo
   ============================================================ */
const CalcState = { viewport: null, solidDef: null, dims: null, quantity: 'volumen' };
const CalcMode = { mode: 'free' };
const RetoState = { level: 1, current: null };

function ensureCalcViewport() {
  if (!CalcState.viewport) {
    CalcState.viewport = new Lab3DViewport(document.getElementById('canvas-calculate'));
    activeViewports.add(CalcState.viewport);
  }
}

function syncCalculateWithSession() {
  if (CalcMode.mode === 'reto') { document.getElementById('calc-no-solid').hidden = true; return; }
  if (!Session.solidDef) {
    document.getElementById('calc-no-solid').hidden = false;
    document.getElementById('calculate-lab').hidden = true;
    return;
  }
  document.getElementById('calc-no-solid').hidden = true;
  selectCalculateSolid(Session.solidDef);
}

function selectCalculateSolid(solidDef) {
  CalcState.solidDef = solidDef;
  CalcState.dims = Session.dims;
  document.getElementById('calculate-lab').hidden = false;
  document.getElementById('calc-solid-name').textContent = solidDef.name;
  ensureCalcViewport();
  rebuildCalcGeometry();
  renderDimensionPanel(document.getElementById('calc-dims'), solidDef, CalcState.dims, () => {
    rebuildCalcGeometry(); updateCalcHud(); resetCalcAnswerUI();
  });
  renderQuantityChips();
  resetCalcAnswerUI();
  updateCalcHud();
}

function renderQuantityChips() {
  const quantities = availableQuantities(CalcState.solidDef.id);
  if (!quantities.find((q) => q.key === CalcState.quantity)) CalcState.quantity = 'volumen';
  renderChipRow(document.getElementById('calc-quantity-chips'), quantities.map((q) => ({
    label: q.label,
    active: () => CalcState.quantity === q.key,
    onToggle: () => { CalcState.quantity = q.key; renderQuantityChips(); resetCalcAnswerUI(); },
  })));
  const u = quantities.find((q) => q.key === CalcState.quantity);
  if (u) document.getElementById('calc-unit-suffix').textContent = u.unit;
}

function rebuildCalcGeometry() {
  CalcState.viewport.setGeometry(CalcState.solidDef.builder(CalcState.dims));
}

function updateCalcHud() {
  document.getElementById('calc-hud').innerHTML = CalcState.solidDef.dims.map((d) =>
    `<div><span class="hud-label">${d.label}:</span> ${fmt(CalcState.dims[d.key], 1)} ${d.unit}</div>`).join('');
}

function resetCalcAnswerUI() {
  document.getElementById('calc-answer').value = '';
  const fb = document.getElementById('calc-feedback');
  fb.className = 'feedback'; fb.textContent = '';
  document.getElementById('calc-procedure').innerHTML = '';

  const inReto = CalcMode.mode === 'reto' && RetoState.current;
  const isInverse = inReto && RetoState.current.inverse;
  const procBtn = document.getElementById('btn-ver-procedimiento');

  if (isInverse) {
    const t = getSolidDef(RetoState.current.solidId).dims.find((d) => d.key === RetoState.current.targetDimKey);
    document.getElementById('calc-answer-label').textContent = `${t.label} (${t.unit})`;
    document.getElementById('calc-instruction').textContent = 'Este reto pide hallar una dimensión, no un área ni un volumen.';
    document.getElementById('calc-unit-suffix').textContent = t.unit;
    document.getElementById('calc-quantity-block').hidden = true;
    procBtn.disabled = true;
  } else {
    document.getElementById('calc-answer-label').textContent = 'Resultado';
    document.getElementById('calc-instruction').textContent = 'Calcula tú el resultado antes de comprobar.';
    document.getElementById('calc-quantity-block').hidden = false;
    procBtn.disabled = false;
    const q = availableQuantities(CalcState.solidDef.id).find((x) => x.key === CalcState.quantity);
    if (q) document.getElementById('calc-unit-suffix').textContent = q.unit;
  }
  updatePredictPanel();
}

function updatePredictPanel() {
  const panel = document.getElementById('predict-panel');
  if (!CalcState.solidDef || CalcState.quantity !== 'volumen') { panel.hidden = true; return; }
  const pred = getPrediction(CalcState.solidDef.id);
  if (!pred) { panel.hidden = true; return; }
  panel.hidden = false;
  document.getElementById('predict-question').textContent = pred.question;
  const opts = document.getElementById('predict-options');
  opts.innerHTML = '';
  const fb = document.getElementById('predict-feedback');
  fb.style.display = 'none';
  pred.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = opt;
    btn.addEventListener('click', () => {
      opts.querySelectorAll('button').forEach((b) => {
        b.removeAttribute('data-chosen'); b.removeAttribute('data-correct'); b.removeAttribute('data-wrong');
      });
      btn.setAttribute('data-chosen', 'true');
      const ok = i === pred.correctIndex;
      btn.setAttribute(ok ? 'data-correct' : 'data-wrong', 'true');
      fb.style.display = 'block';
      fb.style.color = ok ? 'var(--c-green)' : 'var(--c-red)';
      fb.textContent = pred.explanation;
    });
    opts.appendChild(btn);
  });
}

function initCalcModeSwitch() {
  renderChipRow(document.getElementById('calc-mode-switch'), [
    { label: 'Mi sólido', active: () => CalcMode.mode === 'free', onToggle: () => setCalcMode('free') },
    { label: 'Retos', active: () => CalcMode.mode === 'reto', onToggle: () => setCalcMode('reto') },
  ]);
}

function setCalcMode(mode) {
  CalcMode.mode = mode;
  document.getElementById('reto-panel').hidden = mode !== 'reto';
  initCalcModeSwitch();
  if (mode === 'free') { RetoState.current = null; syncCalculateWithSession(); }
  else document.getElementById('calc-no-solid').hidden = true;
}

function initRetoUI() {
  renderChipRow(document.getElementById('reto-level-chips'), [1, 2, 3, 4].map((l) => ({
    label: `Nivel ${l}`, active: () => RetoState.level === l,
    onToggle: () => { RetoState.level = l; initRetoUI(); },
  })));
}

/* ============================================================
   FASE 3 · Comprobar
   ============================================================ */
const CheckState = {
  solidDef: null, dims: null, currentMethod: 'liquid',
  liquidViewport: null, liquidFillState: null,
  cubesViewport: null, unitCubesInst: null,
};

function syncCheckWithSession() {
  if (!Session.solidDef) {
    document.getElementById('check-no-solid').hidden = false;
    document.getElementById('check-lab').hidden = true;
    return;
  }
  document.getElementById('check-no-solid').hidden = true;
  CheckState.solidDef = Session.solidDef;
  CheckState.dims = Session.dims;
  document.getElementById('check-lab').hidden = false;
  document.getElementById('comparison-block').hidden = true;
  document.getElementById('reflection-block').hidden = true;
  document.getElementById('displacement-wrap').innerHTML = '';
  initMethodTabs();
  setupLiquidMethod();
  setupCubesMethod();
  switchMethod(CheckState.currentMethod);
}

function initMethodTabs() {
  const methods = [
    { id: 'liquid', label: '💧 Líquido' },
    { id: 'displacement', label: '🧪 Desplazamiento' },
    { id: 'cubes', label: '🧊 Cubos unitarios' },
  ];
  const c = document.getElementById('method-tabs');
  c.innerHTML = '';
  methods.forEach((m) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = m.label;
    b.setAttribute('aria-current', String(CheckState.currentMethod === m.id));
    b.addEventListener('click', () => switchMethod(m.id));
    c.appendChild(b);
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
  CheckState.liquidViewport.setGeometry(CheckState.solidDef.builder(CheckState.dims));
  CheckState.liquidViewport.material.transparent = true;
  CheckState.liquidViewport.material.opacity = 0.28;
  document.getElementById('liquid-solid-name').textContent = CheckState.solidDef.name;
  document.getElementById('liquid-target-volume').textContent = fmt(CheckState.solidDef.volume(CheckState.dims));
  document.getElementById('btn-transferir').disabled = true;
  const wrap = document.getElementById('liquid-probeta-wrap');
  wrap.style.display = 'none'; wrap.innerHTML = '';
}

function setupCubesMethod() {
  if (!CheckState.cubesViewport) {
    CheckState.cubesViewport = new Lab3DViewport(document.getElementById('canvas-cubes'));
    activeViewports.add(CheckState.cubesViewport);
  }
  if (CheckState.unitCubesInst) { disposeUnitCubes(CheckState.cubesViewport, CheckState.unitCubesInst); CheckState.unitCubesInst = null; }
  CheckState.cubesViewport.setGeometry(CheckState.solidDef.builder(CheckState.dims));
  CheckState.cubesViewport.material.transparent = true;
  CheckState.cubesViewport.material.opacity = 0.22;
  document.getElementById('cubes-solid-name').textContent = CheckState.solidDef.name;
  document.getElementById('cubes-count').textContent = 'Cantidad de cubos: —';
}

function showComparisonAndReflection(mathVol, expVol) {
  const block = document.getElementById('comparison-block');
  block.hidden = false;
  renderComparison(block, computeExperimentComparison(mathVol, expVol));
  const r = document.getElementById('reflection-block');
  r.hidden = false;
  renderReflection(r, CheckState.solidDef.id);
}

/* ============================================================
   Modales: Progreso / Docente
   ============================================================ */
function renderProgressModalBody(body) {
  const p = computeProgress();
  body.innerHTML = `
    <div class="progress-row"><div class="p-label"><span>Exploración</span><span>${p.exploredPct}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${p.exploredPct}%"></div></div></div>
    <div class="progress-row"><div class="p-label"><span>Cálculo</span><span>${p.calcPct}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${p.calcPct}%"></div></div></div>
    <div class="progress-row"><div class="p-label"><span>Experimentación</span><span>${p.expPct}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${p.expPct}%"></div></div></div>
    <p style="font-size:12.5px;">Retos completados: <strong style="color:var(--c-amber)">${p.retosCompleted}</strong></p>`;
  const grid = document.createElement('div');
  grid.className = 'badge-grid';
  p.badges.forEach((b) => {
    const i = document.createElement('div');
    i.className = `badge-item${b.earned ? ' earned' : ''}`;
    i.innerHTML = `<div class="badge-icon">${b.icon}</div><div class="badge-name">${b.name}</div>`;
    grid.appendChild(i);
  });
  body.appendChild(grid);
}

function renderTeacherModalBody(body) {
  const teacher = State.data.teacher || (State.data.teacher = { showFormulas: true, hintsEnabled: true });
  body.innerHTML = `
    <div class="teacher-toggle-row"><span>Mostrar botón "Ver procedimiento"</span>
      <label class="switch"><input type="checkbox" id="teach-formulas" ${teacher.showFormulas ? 'checked' : ''}/><span class="slider"></span></label></div>
    <div class="teacher-toggle-row"><span>Retroalimentación específica (pistas de error)</span>
      <label class="switch"><input type="checkbox" id="teach-hints" ${teacher.hintsEnabled ? 'checked' : ''}/><span class="slider"></span></label></div>
    <h3 style="margin-top:16px; font-size:12px; text-transform:uppercase; color:var(--c-text-dim);">Resultados por sólido</h3>
    <table class="teacher-table"><thead><tr><th>Sólido</th><th>Intentos</th><th>Aciertos</th><th>%</th></tr></thead>
    <tbody id="teacher-stats-body"></tbody></table>
    <button class="btn btn--ghost btn--sm" id="btn-reset-progress" style="margin-top:14px;">↺ Reiniciar todas las actividades</button>`;
  const tbody = body.querySelector('#teacher-stats-body');
  const calc = State.data.progress.calculate || {};
  const ids = Object.keys(calc);
  if (!ids.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--c-text-faint);">Aún no hay intentos registrados.</td></tr>';
  } else ids.forEach((id) => {
    const def = getSolidDef(id); const e = calc[id];
    const pct = e.attempts ? Math.round((e.correct / e.attempts) * 100) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${def ? def.shortName : id}</td><td>${e.attempts}</td><td>${e.correct}</td><td>${pct}%</td>`;
    tbody.appendChild(tr);
  });
  body.querySelector('#teach-formulas').addEventListener('change', (e) => {
    State.set('teacher.showFormulas', e.target.checked);
    document.getElementById('btn-ver-procedimiento').hidden = !e.target.checked;
  });
  body.querySelector('#teach-hints').addEventListener('change', (e) => State.set('teacher.hintsEnabled', e.target.checked));
  body.querySelector('#btn-reset-progress').addEventListener('click', () => {
    if (confirm('¿Reiniciar todo el progreso guardado? Esta acción no se puede deshacer.')) {
      State.reset(); closeModal(); location.reload();
    }
  });
}

/* ============================================================
   Arranque y cableado de eventos
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  Navigation.init();
  renderWizard('root');
  initCalcModeSwitch();
  initRetoUI();
  syncCalculateWithSession();
  syncCheckWithSession();

  if (State.get('teacher.showFormulas') === false) {
    document.getElementById('btn-ver-procedimiento').hidden = true;
  }

  /* --- Plegado / revolución --- */
  const foldSlider = document.getElementById('fold-slider');
  const applyFold = () => {
    if (Session.solidDef.group === 'redondo') rebuildBuild();
    else if (Build.net) Build.net.setFold(Build.foldT);
    updateFoldReadout(Build.foldT);
  };
  foldSlider.addEventListener('input', (e) => {
    Build.foldT = parseFloat(e.target.value) / 100;
    applyFold();
  });
  document.getElementById('btn-fold-reset').addEventListener('click', () => {
    Build.foldT = 0; foldSlider.value = 0; applyFold();
  });
  document.getElementById('btn-fold-play').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (Build.playing) { Build.playing = false; btn.textContent = '▶'; return; }
    Build.playing = true; btn.textContent = '⏸';
    const from = Build.foldT >= 0.999 ? 0 : Build.foldT;
    const start = performance.now(), duration = 2200;
    (function step(now) {
      if (!Build.playing) { btn.textContent = '▶'; return; }
      const t = Math.min(1, (now - start) / duration);
      Build.foldT = from + t * (1 - from);
      foldSlider.value = Build.foldT * 100;
      applyFold();
      if (t < 1) requestAnimationFrame(step);
      else { Build.playing = false; btn.textContent = '▶'; }
    })(performance.now());
  });

  document.getElementById('btn-go-elements').addEventListener('click', () => switchWsTab('elements'));
  document.getElementById('btn-go-calculate').addEventListener('click', () => {
    setCalcMode('free');
    Navigation.goTo('calculate');
  });

  /* --- Fase 2 --- */
  document.getElementById('btn-comprobar').addEventListener('click', () => {
    const raw = document.getElementById('calc-answer').value.trim().replace(',', '.');
    const studentValue = parseFloat(raw);
    const inReto = CalcMode.mode === 'reto' && RetoState.current;
    const isInverse = inReto && RetoState.current.inverse;
    let result;
    if (isInverse) {
      result = checkAnswer(studentValue, RetoState.current.answerValue,
        { solidId: RetoState.current.solidId, dims: RetoState.current.dims, quantity: 'dimension' });
    } else {
      const correct = trueValueFor(CalcState.solidDef.id, CalcState.dims, CalcState.quantity);
      result = checkAnswer(studentValue, correct,
        { solidId: CalcState.solidDef.id, dims: CalcState.dims, quantity: CalcState.quantity });
    }
    const fb = document.getElementById('calc-feedback');
    fb.className = `feedback show feedback--${result.status === 'correct' ? 'correct' : result.status === 'approx' ? 'approx' : 'incorrect'}`;
    fb.textContent = result.message;
    if (inReto) { if (result.status === 'correct') State.set('retosCompleted', (State.get('retosCompleted') || 0) + 1); }
    else State.recordAttempt(CalcState.solidDef.id, result.status === 'correct');
  });

  document.getElementById('btn-ver-procedimiento').addEventListener('click', (e) => {
    if (e.currentTarget.disabled) return;
    const steps = buildProcedure(CalcState.solidDef.id, CalcState.dims, CalcState.quantity);
    const c = document.getElementById('calc-procedure');
    c.innerHTML = '';
    steps.forEach((text, i) => {
      const d = document.createElement('div');
      d.className = 'step'; d.style.animationDelay = `${i * 0.12}s`; d.textContent = text;
      c.appendChild(d);
    });
  });

  document.getElementById('btn-new-reto').addEventListener('click', () => {
    const ch = generateChallenge(RetoState.level);
    RetoState.current = ch;
    document.getElementById('reto-prompt-text').textContent = ch.promptText;
    const def = getSolidDef(ch.solidId);
    CalcState.solidDef = def;
    CalcState.dims = { ...ch.dims };
    document.getElementById('calculate-lab').hidden = false;
    document.getElementById('calc-solid-name').textContent = def.name;
    ensureCalcViewport();
    rebuildCalcGeometry();
    renderDimensionPanel(document.getElementById('calc-dims'), def, CalcState.dims, () => {
      rebuildCalcGeometry(); updateCalcHud(); resetCalcAnswerUI();
    });
    updateCalcHud();
    if (!ch.inverse) { CalcState.quantity = ch.quantity; renderQuantityChips(); }
    resetCalcAnswerUI();
  });

  /* --- Fase 3 --- */
  document.getElementById('btn-llenar').addEventListener('click', () => {
    if (CheckState.liquidFillState) disposeLiquidFill(CheckState.liquidViewport, CheckState.liquidFillState);
    CheckState.liquidFillState = createLiquidFill(CheckState.liquidViewport);
    document.getElementById('btn-transferir').disabled = true;
    animateLiquidFill(CheckState.liquidFillState, 1, 1400, () => {
      document.getElementById('btn-transferir').disabled = false;
    });
  });

  document.getElementById('btn-transferir').addEventListener('click', () => {
    const vol = CheckState.solidDef.volume(CheckState.dims);
    const expML = Math.round(vol);
    const maxML = niceScaleMax(expML);
    const wrap = document.getElementById('liquid-probeta-wrap');
    wrap.style.display = 'flex';
    wrap.innerHTML = `<div class="probeta-box">${probetaSVG('probeta-liquid', 0, maxML)}<div class="probeta-caption">Volumen experimental</div><div class="probeta-value" id="liquid-probeta-value">0 ml</div></div>`;
    requestAnimationFrame(() => {
      const rect = document.querySelector('#probeta-liquid .probeta-fill');
      const top = 20, bottom = 190, H = bottom - top;
      const start = performance.now(), dur = 1000;
      (function step(now) {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        const cur = eased * expML, frac = cur / maxML;
        rect.setAttribute('y', bottom - frac * H);
        rect.setAttribute('height', frac * H);
        document.getElementById('liquid-probeta-value').textContent = `${fmt(cur, 0)} ml`;
        if (t < 1) requestAnimationFrame(step);
        else { State.markExperiment(CheckState.solidDef.id, 'liquid'); showComparisonAndReflection(vol, expML); }
      })(performance.now());
    });
  });

  document.getElementById('btn-desplazar').addEventListener('click', () => {
    const vol = CheckState.solidDef.volume(CheckState.dims);
    const objML = Math.round(vol);
    const { maxML } = renderDisplacementSetup(document.getElementById('displacement-wrap'), objML);
    requestAnimationFrame(() => animateDisplacement(objML, maxML, () => {
      State.markExperiment(CheckState.solidDef.id, 'displacement');
      showComparisonAndReflection(vol, objML);
    }));
  });

  document.getElementById('btn-llenar-cubos').addEventListener('click', () => {
    if (CheckState.unitCubesInst) { disposeUnitCubes(CheckState.cubesViewport, CheckState.unitCubesInst); CheckState.unitCubesInst = null; }
    document.getElementById('cubes-count').textContent = 'Calculando...';
    requestAnimationFrame(() => {
      const { positions, cubeSize } = computeUnitCubePositions(CheckState.cubesViewport);
      CheckState.unitCubesInst = renderUnitCubes(CheckState.cubesViewport, positions, cubeSize);
      const expVol = positions.length * cubeSize ** 3;
      document.getElementById('cubes-count').textContent =
        `Cantidad de cubos: ${positions.length} → Volumen ≈ ${fmt(expVol, 0)} cm³`;
      State.markExperiment(CheckState.solidDef.id, 'cubes');
      showComparisonAndReflection(CheckState.solidDef.volume(CheckState.dims), expVol);
    });
  });

  /* --- Modales --- */
  document.getElementById('btn-open-progress').addEventListener('click', () => openModal('Mi progreso', renderProgressModalBody));
  document.getElementById('btn-open-teacher').addEventListener('click', () => openModal('Panel del docente', renderTeacherModalBody));

  /* --- Cambio de fase --- */
  document.addEventListener('geom3d:phasechange', (e) => {
    if (e.detail.phase === 'calculate') syncCalculateWithSession();
    if (e.detail.phase === 'check') syncCheckWithSession();
    requestAnimationFrame(() => activeViewports.forEach((v) => v.resize()));
  });
});
