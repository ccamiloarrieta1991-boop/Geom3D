/* ============================================================
   ui/development.js
   VER DESARROLLO — decomposes a solid into its flat faces
   (each drawn to scale with its own area) so the student can
   see, face by face, how "área de las caras" adds up to
   "área total". Spheres have no true flat net (a fundamental
   geometric fact, not a missing feature) and are reported as such.
   ============================================================ */

function getFaceBreakdown(solidId, dims) {
  const D2 = (a, b) => Math.sqrt(a * a + b * b);
  switch (solidId) {
    case 'cubo': {
      const a = dims.lado;
      return Array.from({ length: 6 }, (_, i) => ({ shape: 'rect', w: a, h: a, label: `Cara ${i + 1}`, area: a * a }));
    }
    case 'prisma_rectangular': {
      const { largo, ancho, alto } = dims;
      return [
        { shape: 'rect', w: largo, h: ancho, label: 'Base', area: largo * ancho },
        { shape: 'rect', w: largo, h: ancho, label: 'Base', area: largo * ancho },
        { shape: 'rect', w: largo, h: alto, label: 'Lateral', area: largo * alto },
        { shape: 'rect', w: largo, h: alto, label: 'Lateral', area: largo * alto },
        { shape: 'rect', w: ancho, h: alto, label: 'Lateral', area: ancho * alto },
        { shape: 'rect', w: ancho, h: alto, label: 'Lateral', area: ancho * alto },
      ];
    }
    case 'prisma_triangular': {
      const { base, alturaBase, alto } = dims;
      const areaBase = (base * alturaBase) / 2;
      const hip = D2(base, alturaBase);
      return [
        { shape: 'triangle', base, height: alturaBase, label: 'Base', area: areaBase },
        { shape: 'triangle', base, height: alturaBase, label: 'Base', area: areaBase },
        { shape: 'rect', w: base, h: alto, label: 'Lateral', area: base * alto },
        { shape: 'rect', w: alturaBase, h: alto, label: 'Lateral', area: alturaBase * alto },
        { shape: 'rect', w: hip, h: alto, label: 'Lateral', area: hip * alto },
      ];
    }
    case 'prisma_pentagonal': {
      const { lado, alto } = dims;
      const apotema = lado / (2 * Math.tan(Math.PI / 5));
      const areaBase = (5 * lado * apotema) / 2;
      const faces = [
        { shape: 'polygon', n: 5, side: lado, label: 'Base', area: areaBase },
        { shape: 'polygon', n: 5, side: lado, label: 'Base', area: areaBase },
      ];
      for (let i = 0; i < 5; i++) faces.push({ shape: 'rect', w: lado, h: alto, label: 'Lateral', area: lado * alto });
      return faces;
    }
    case 'cilindro': {
      const { radio, altura } = dims;
      return [
        { shape: 'circle', r: radio, label: 'Base', area: Math.PI * radio * radio },
        { shape: 'circle', r: radio, label: 'Base', area: Math.PI * radio * radio },
        { shape: 'rect', w: 2 * Math.PI * radio, h: altura, label: 'Superficie lateral (desenrollada)', area: 2 * Math.PI * radio * altura },
      ];
    }
    case 'cono': {
      const { radio, altura } = dims;
      const g = D2(radio, altura);
      return [
        { shape: 'circle', r: radio, label: 'Base', area: Math.PI * radio * radio },
        { shape: 'rect', w: 2 * Math.PI * radio, h: g, label: 'Superficie lateral (sector desenrollado)', area: Math.PI * radio * g },
      ];
    }
    case 'piramide_triangular':
    case 'piramide_cuadrangular':
    case 'piramide_pentagonal': {
      const { lado, altura } = dims;
      const n = solidId === 'piramide_triangular' ? 3 : solidId === 'piramide_cuadrangular' ? 4 : 5;
      const apotemaBase = n === 3 ? lado / (2 * Math.sqrt(3)) : n === 4 ? lado / 2 : lado / (2 * Math.tan(Math.PI / 5));
      const areaBase = Areas[solidId](dims).areaBase;
      const apotemaLateral = D2(altura, apotemaBase);
      const faces = [{ shape: 'polygon', n, side: lado, label: 'Base', area: areaBase }];
      for (let i = 0; i < n; i++) faces.push({ shape: 'triangle', base: lado, height: apotemaLateral, label: 'Cara lateral', area: (lado * apotemaLateral) / 2 });
      return faces;
    }
    case 'tetraedro': {
      const { arista } = dims;
      const h = (arista * Math.sqrt(3)) / 2;
      const area = (Math.sqrt(3) / 4) * arista * arista;
      return Array.from({ length: 4 }, () => ({ shape: 'triangle', base: arista, height: h, label: 'Cara', area }));
    }
    case 'octaedro': {
      const { arista } = dims;
      const h = (arista * Math.sqrt(3)) / 2;
      const area = (Math.sqrt(3) / 4) * arista * arista;
      return Array.from({ length: 8 }, () => ({ shape: 'triangle', base: arista, height: h, label: 'Cara', area }));
    }
    case 'tronco_cono': {
      const { radioSuperior: r, radioInferior: R, altura } = dims;
      const g = D2(altura, R - r);
      return [
        { shape: 'circle', r: R, label: 'Base inferior', area: Math.PI * R * R },
        { shape: 'circle', r, label: 'Base superior', area: Math.PI * r * r },
        { shape: 'rect', w: Math.PI * (R + r), h: g, label: 'Superficie lateral (desenrollada)', area: Math.PI * (R + r) * g },
      ];
    }
    default:
      return null; // esfera: no admite un desarrollo plano exacto
  }
}

function faceSVG(face) {
  const box = 96;
  const pad = 10;
  const avail = box - pad * 2;
  let inner = '';
  if (face.shape === 'rect') {
    const scale = avail / Math.max(face.w, face.h);
    const w = face.w * scale, h = face.h * scale;
    inner = `<rect x="${(box - w) / 2}" y="${(box - h) / 2}" width="${w}" height="${h}" fill="rgba(23,191,168,0.18)" stroke="#17BFA8" stroke-width="1.5"/>`;
  } else if (face.shape === 'triangle') {
    const scale = avail / Math.max(face.base, face.height);
    const b = face.base * scale, h = face.height * scale;
    const x0 = (box - b) / 2, y0 = (box + h) / 2;
    inner = `<polygon points="${x0},${y0} ${x0 + b},${y0} ${x0 + b / 2},${y0 - h}" fill="rgba(245,165,36,0.18)" stroke="#F5A524" stroke-width="1.5"/>`;
  } else if (face.shape === 'circle') {
    const scale = avail / (face.r * 2);
    const rr = face.r * scale;
    inner = `<circle cx="${box / 2}" cy="${box / 2}" r="${rr}" fill="rgba(47,183,255,0.15)" stroke="#2FB7FF" stroke-width="1.5"/>`;
  } else if (face.shape === 'polygon') {
    const R = face.side / (2 * Math.sin(Math.PI / face.n));
    const scale = avail / (R * 2);
    const rr = R * scale;
    const pts = [];
    for (let i = 0; i < face.n; i++) {
      const angle = -Math.PI / 2 + i * ((2 * Math.PI) / face.n);
      pts.push(`${box / 2 + rr * Math.cos(angle)},${box / 2 + rr * Math.sin(angle)}`);
    }
    inner = `<polygon points="${pts.join(' ')}" fill="rgba(53,201,126,0.15)" stroke="#35C97E" stroke-width="1.5"/>`;
  }
  return `<svg viewBox="0 0 ${box} ${box}" width="96" height="96">${inner}</svg>`;
}

function renderDevelopment(container, solidDef, dims) {
  const faces = getFaceBreakdown(solidDef.id, dims);
  if (!faces) {
    container.innerHTML = `<div class="stage-note" style="margin:0;"><strong>Sin desarrollo plano exacto</strong>La esfera no puede desplegarse en un desarrollo plano sin distorsión — es una propiedad geométrica real (por eso los mapas del planeta siempre deforman algo). Puedes explorar su área y volumen igualmente en la fase Calcular.</div>`;
    return;
  }
  const total = faces.reduce((s, f) => s + f.area, 0);
  const grid = document.createElement('div');
  grid.style.display = 'flex';
  grid.style.flexWrap = 'wrap';
  grid.style.gap = '10px';
  faces.forEach((f) => {
    const cell = document.createElement('div');
    cell.style.textAlign = 'center';
    cell.innerHTML = `${faceSVG(f)}<div style="font-size:10.5px; color:var(--c-text-dim); margin-top:2px;">${f.label}</div><div style="font-family:var(--f-mono); font-size:11px; color:var(--c-amber);">${fmt(f.area)} cm²</div>`;
    grid.appendChild(cell);
  });
  container.innerHTML = '';
  const p = document.createElement('p');
  p.style.marginBottom = '10px';
  p.style.fontSize = '12.5px';
  p.textContent = 'Cada cara se despliega por separado. La suma de todas sus áreas es el área total del sólido:';
  container.appendChild(p);
  container.appendChild(grid);
  const totalRow = document.createElement('div');
  totalRow.style.marginTop = '12px';
  totalRow.style.fontFamily = 'var(--f-mono)';
  totalRow.style.fontSize = '13px';
  totalRow.style.color = 'var(--c-text)';
  totalRow.innerHTML = `Área total = ${faces.map((f) => fmt(f.area, 1)).join(' + ')} ≈ <span style="color:var(--c-teal)">${fmt(total)} cm²</span>`;
  container.appendChild(totalRow);
}

window.getFaceBreakdown = getFaceBreakdown;
window.renderDevelopment = renderDevelopment;
