/* ============================================================
   ui/panels.js
   DOM builders for the side/bottom control panel content.
   Kept framework-free: small functions that (re)build a
   container's innerHTML/children from current state.
   ============================================================ */

/** Fase 1 & 2 shared: sliders + numeric steppers for each dimension. */
function renderDimensionPanel(container, solidDef, dims, onChange) {
  container.innerHTML = '<h3>Dimensiones</h3>';
  solidDef.dims.forEach((d) => {
    const wrap = document.createElement('div');
    wrap.className = 'dim-control';

    const row = document.createElement('div');
    row.className = 'dim-row';
    const label = document.createElement('label');
    label.textContent = d.label;
    label.setAttribute('for', `dim-${d.key}`);
    const val = document.createElement('span');
    val.className = 'val';
    val.id = `dim-val-${d.key}`;
    val.textContent = `${fmt(dims[d.key], 1)} ${d.unit}`;
    row.appendChild(label);
    row.appendChild(val);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = `dim-${d.key}`;
    slider.min = d.min;
    slider.max = d.max;
    slider.step = d.step;
    slider.value = dims[d.key];
    slider.setAttribute('aria-label', `${d.label} en ${d.unit}`);

    const stepper = document.createElement('div');
    stepper.className = 'dim-stepper';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', `Disminuir ${d.label}`);
    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.min = d.min; numInput.max = d.max; numInput.step = d.step;
    numInput.value = dims[d.key];
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', `Aumentar ${d.label}`);
    const unitTag = document.createElement('span');
    unitTag.className = 'unit';
    unitTag.textContent = d.unit;

    function commit(v) {
      const clamped = Math.min(d.max, Math.max(d.min, v));
      dims[d.key] = clamped;
      slider.value = clamped;
      numInput.value = clamped;
      val.textContent = `${fmt(clamped, 1)} ${d.unit}`;
      onChange(dims);
    }

    slider.addEventListener('input', () => commit(parseFloat(slider.value)));
    numInput.addEventListener('change', () => commit(parseFloat(numInput.value) || d.default));
    minus.addEventListener('click', () => commit(parseFloat(numInput.value) - d.step));
    plus.addEventListener('click', () => commit(parseFloat(numInput.value) + d.step));

    stepper.appendChild(minus);
    stepper.appendChild(numInput);
    stepper.appendChild(unitTag);
    stepper.appendChild(plus);

    wrap.appendChild(row);
    wrap.appendChild(slider);
    wrap.appendChild(stepper);
    container.appendChild(wrap);
  });
}

/** View-option toggle chips: aristas / vértices / transparencia + reset. */
function renderViewOptionsPanel(container, onToggle, onReset) {
  container.innerHTML = '<h3>Visualización</h3>';
  const chipRow = document.createElement('div');
  chipRow.className = 'chip-row';
  container.appendChild(chipRow);

  renderChipRow(chipRow, [
    { label: 'Aristas', active: () => State.get('viewOptions.edges'), onToggle: () => onToggle('edges') },
    { label: 'Vértices', active: () => State.get('viewOptions.vertices'), onToggle: () => onToggle('vertices') },
    { label: 'Transparencia', active: () => State.get('viewOptions.transparency'), onToggle: () => onToggle('transparency') },
  ]);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn--ghost btn--sm';
  resetBtn.style.marginTop = '10px';
  resetBtn.textContent = '⟲ Reiniciar posición';
  resetBtn.addEventListener('click', onReset);
  container.appendChild(resetBtn);
}

/** "DESCOMPONER" — lists the solid's geometric components with live values. */
function renderComponentsPanel(container, solidDef, dims) {
  const parts = componentsFor(solidDef.id, dims);
  container.innerHTML = '<h3>Componentes del sólido</h3>';
  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '6px';
  parts.forEach((p) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.fontSize = '13px';
    row.innerHTML = `<span style="color:var(--c-text-dim)">${p.label}</span><span style="font-family:var(--f-mono);color:var(--c-amber)">${p.value}</span>`;
    list.appendChild(row);
  });
  container.appendChild(list);
}

function componentsFor(solidId, d) {
  switch (solidId) {
    case 'cubo':
      return [
        { label: 'Caras (bases + laterales)', value: '6 cuadradas' },
        { label: 'Lado', value: `${fmt(d.lado, 1)} cm` },
        { label: 'Aristas', value: '12' },
        { label: 'Vértices', value: '8' },
      ];
    case 'prisma_rectangular':
      return [
        { label: '2 bases rectangulares', value: `${fmt(d.largo,1)} × ${fmt(d.ancho,1)} cm` },
        { label: '4 caras laterales', value: 'rectángulos' },
        { label: 'Altura', value: `${fmt(d.alto,1)} cm` },
      ];
    case 'prisma_triangular':
      return [
        { label: '2 bases triangulares', value: `b=${fmt(d.base,1)}, h=${fmt(d.alturaBase,1)} cm` },
        { label: '3 caras laterales', value: 'rectángulos' },
        { label: 'Altura del prisma', value: `${fmt(d.alto,1)} cm` },
      ];
    case 'cilindro':
      return [
        { label: '2 bases circulares', value: `radio ${fmt(d.radio,1)} cm` },
        { label: 'Superficie lateral', value: 'rectángulo enrollado' },
        { label: 'Altura', value: `${fmt(d.altura,1)} cm` },
      ];
    case 'cono':
      return [
        { label: 'Base circular', value: `radio ${fmt(d.radio,1)} cm` },
        { label: 'Altura', value: `${fmt(d.altura,1)} cm` },
        { label: 'Generatriz', value: `${fmt(Math.sqrt(d.radio**2 + d.altura**2),1)} cm` },
      ];
    case 'esfera':
      return [
        { label: 'Radio', value: `${fmt(d.radio,1)} cm` },
        { label: 'Diámetro', value: `${fmt(d.radio*2,1)} cm` },
      ];
    case 'prisma_pentagonal':
      return [
        { label: '2 bases pentagonales', value: `lado ${fmt(d.lado,1)} cm` },
        { label: '5 caras laterales', value: 'rectángulos' },
        { label: 'Altura del prisma', value: `${fmt(d.alto,1)} cm` },
      ];
    case 'piramide_triangular':
      return [
        { label: 'Base triangular', value: `lado ${fmt(d.lado,1)} cm` },
        { label: '3 caras triangulares', value: 'laterales' },
        { label: 'Altura', value: `${fmt(d.altura,1)} cm` },
      ];
    case 'piramide_cuadrangular':
      return [
        { label: 'Base cuadrada', value: `lado ${fmt(d.lado,1)} cm` },
        { label: '4 caras triangulares', value: 'laterales' },
        { label: 'Altura', value: `${fmt(d.altura,1)} cm` },
      ];
    case 'piramide_pentagonal':
      return [
        { label: 'Base pentagonal', value: `lado ${fmt(d.lado,1)} cm` },
        { label: '5 caras triangulares', value: 'laterales' },
        { label: 'Altura', value: `${fmt(d.altura,1)} cm` },
      ];
    case 'tetraedro':
      return [
        { label: '4 caras triangulares', value: 'equiláteras' },
        { label: 'Arista', value: `${fmt(d.arista,1)} cm` },
        { label: 'Vértices', value: '4' },
      ];
    case 'octaedro':
      return [
        { label: '8 caras triangulares', value: 'equiláteras' },
        { label: 'Arista', value: `${fmt(d.arista,1)} cm` },
        { label: 'Vértices', value: '6' },
      ];
    case 'tronco_cono':
      return [
        { label: 'Base inferior', value: `radio ${fmt(d.radioInferior,1)} cm` },
        { label: 'Base superior', value: `radio ${fmt(d.radioSuperior,1)} cm` },
        { label: 'Altura', value: `${fmt(d.altura,1)} cm` },
        { label: 'Generatriz', value: `${fmt(Math.sqrt(d.altura**2 + (d.radioInferior-d.radioSuperior)**2),1)} cm` },
      ];
    default:
      return [];
  }
}

/* ============================================================
   Fase 2 — Calculation panel
   ============================================================ */
function availableQuantities(solidId) {
  const sample = {
    lado: 1, largo: 1, ancho: 1, alto: 1, base: 1, alturaBase: 1, radio: 1, altura: 1,
    arista: 1, radioSuperior: 0.6, radioInferior: 1,
  };
  const areas = Areas[solidId] ? Areas[solidId](sample) : {};
  const q = [];
  const areaBaseLabel = solidId === 'tronco_cono' ? 'Suma de las áreas de las bases' : 'Área de la base';
  if (areas.areaBase !== undefined) q.push({ key: 'areaBase', label: areaBaseLabel, unit: 'cm²' });
  if (areas.areaLateral !== undefined) q.push({ key: 'areaLateral', label: 'Área lateral', unit: 'cm²' });
  if (areas.areaTotal !== undefined) q.push({ key: 'areaTotal', label: 'Área total', unit: 'cm²' });
  q.push({ key: 'volumen', label: 'Volumen', unit: 'cm³' });
  return q;
}

function trueValueFor(solidId, dims, quantity) {
  if (quantity === 'volumen') return Volumes[solidId](dims);
  const areas = Areas[solidId](dims);
  return areas[quantity];
}

window.renderDimensionPanel = renderDimensionPanel;
window.renderViewOptionsPanel = renderViewOptionsPanel;
window.renderComponentsPanel = renderComponentsPanel;
window.availableQuantities = availableQuantities;
window.trueValueFor = trueValueFor;
