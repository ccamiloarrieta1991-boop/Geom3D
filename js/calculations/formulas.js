/* ============================================================
   calculations/formulas.js
   Procedimiento paso a paso (fórmula → sustitución → operación
   → resultado → unidad). Generado a partir del tipo de sólido
   y de n, en vez de un bloque por cada sólido: así un prisma
   hexagonal y uno pentagonal comparten el mismo razonamiento
   expuesto, que es justamente lo que se quiere que el
   estudiante generalice.
   ============================================================ */

function fmt(n, decimals = 2) {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const POLY_NAME = { 3: 'triángulo', 4: 'cuadrado', 5: 'pentágono', 6: 'hexágono' };

function buildProcedure(solidId, dims, quantity) {
  const def = getSolidDef(solidId);
  if (!def) return [];
  const steps = [];
  const push = (t) => steps.push(t);
  const A = def.areas(dims);

  /* ---------- Prismas y pirámides de base regular ---------- */
  if ((def.kind === 'prisma' || def.kind === 'piramide') && def.baseShape !== 'rectangular') {
    const n = def.n;
    const { lado } = dims;
    const h = def.kind === 'prisma' ? dims.alto : dims.altura;
    const ap = apotemaRegular(lado, n);
    const poly = POLY_NAME[n] || `polígono de ${n} lados`;

    if (quantity === 'areaBase') {
      push(`El ${poly} regular se descompone en ${n} triángulos iguales.`);
      push(`Apotema: a = lado / (2·tan(180°/${n})) = ${fmt(lado)} / (2·tan(${fmt(180 / n, 0)}°)) ≈ ${fmt(ap)} cm`);
      push(`Fórmula: A_base = (perímetro · apotema) / 2 = (${n}·lado · a) / 2`);
      push(`Sustitución: A_base = (${n} · ${fmt(lado)} · ${fmt(ap)}) / 2`);
      push(`Resultado: A_base ≈ ${fmt(A.areaBase)} cm²`);
    } else if (quantity === 'areaLateral') {
      if (def.kind === 'prisma') {
        push(`Las ${n} caras laterales son rectángulos de ${fmt(lado)} cm × ${fmt(h)} cm.`);
        push(`Fórmula: A_lateral = perímetro_base · altura = (${n}·lado) · h`);
        push(`Sustitución: A_lateral = (${n} · ${fmt(lado)}) · ${fmt(h)}`);
      } else {
        const apL = Math.sqrt(h * h + ap * ap);
        push(`Apotema lateral: aL = √(altura² + apotema_base²) = √(${fmt(h * h)} + ${fmt(ap * ap)}) ≈ ${fmt(apL)} cm`);
        push(`Fórmula: A_lateral = (perímetro_base · apotema_lateral) / 2`);
        push(`Sustitución: A_lateral = (${n} · ${fmt(lado)} · ${fmt(apL)}) / 2`);
      }
      push(`Resultado: A_lateral ≈ ${fmt(A.areaLateral)} cm²`);
    } else if (quantity === 'areaTotal') {
      const factor = def.kind === 'prisma' ? '2·A_base' : 'A_base';
      push(`Fórmula: A_total = A_lateral + ${factor}`);
      push(`Sustitución: A_total = ${fmt(A.areaLateral)} + ${def.kind === 'prisma' ? '2·' : ''}${fmt(A.areaBase)}`);
      push(`Resultado: A_total ≈ ${fmt(A.areaTotal)} cm²`);
    } else if (quantity === 'volumen') {
      if (def.kind === 'prisma') {
        push(`Fórmula: V = A_base · altura`);
        push(`Sustitución: V = ${fmt(A.areaBase)} · ${fmt(h)}`);
      } else {
        push(`Fórmula: V = (1/3) · A_base · altura`);
        push(`La pirámide ocupa exactamente un tercio del prisma con la misma base y altura.`);
        push(`Sustitución: V = (1/3) · ${fmt(A.areaBase)} · ${fmt(h)}`);
      }
      push(`Resultado: V ≈ ${fmt(def.volume(dims))} cm³`);
    }
    return steps;
  }

  /* ---------- Prisma rectangular ---------- */
  if (def.id === 'prisma_rectangular') {
    const { largo, ancho, alto } = dims;
    if (quantity === 'areaBase') {
      push(`Fórmula: A_base = largo · ancho`);
      push(`Sustitución: A_base = ${fmt(largo)} · ${fmt(ancho)}`);
      push(`Resultado: A_base = ${fmt(A.areaBase)} cm²`);
    } else if (quantity === 'areaLateral') {
      push(`Fórmula: A_lateral = perímetro_base · altura = 2(largo + ancho) · alto`);
      push(`Sustitución: A_lateral = 2(${fmt(largo)} + ${fmt(ancho)}) · ${fmt(alto)}`);
      push(`Resultado: A_lateral = ${fmt(A.areaLateral)} cm²`);
    } else if (quantity === 'areaTotal') {
      push(`Fórmula: A_total = 2(largo·ancho + largo·alto + ancho·alto)`);
      push(`Sustitución: A_total = 2(${fmt(largo * ancho)} + ${fmt(largo * alto)} + ${fmt(ancho * alto)})`);
      push(`Resultado: A_total = ${fmt(A.areaTotal)} cm²`);
    } else if (quantity === 'volumen') {
      push(`Fórmula: V = largo · ancho · alto`);
      push(`Sustitución: V = ${fmt(largo)} · ${fmt(ancho)} · ${fmt(alto)}`);
      push(`Resultado: V = ${fmt(def.volume(dims))} cm³`);
    }
    return steps;
  }

  /* ---------- Poliedros regulares ---------- */
  if (def.id === 'tetraedro') {
    const a = dims.arista;
    if (quantity === 'volumen') {
      push(`Fórmula: V = arista³ / (6√2)`);
      push(`Sustitución: V = (${fmt(a)})³ / (6√2)`);
      push(`Resultado: V ≈ ${fmt(def.volume(dims))} cm³`);
    } else {
      push(`Cada una de las 4 caras es un triángulo equilátero de área (√3/4)·arista².`);
      push(`Fórmula: A_total = 4 · (√3/4)·arista² = √3 · arista²`);
      push(`Sustitución: A_total = √3 · (${fmt(a)})²`);
      push(`Resultado: A_total ≈ ${fmt(A.areaTotal)} cm²`);
    }
    return steps;
  }
  if (def.id === 'octaedro') {
    const a = dims.arista;
    if (quantity === 'volumen') {
      push(`Fórmula: V = (√2/3) · arista³`);
      push(`Sustitución: V = (√2/3) · (${fmt(a)})³`);
      push(`Resultado: V ≈ ${fmt(def.volume(dims))} cm³`);
    } else {
      push(`Las 8 caras son triángulos equiláteros de área (√3/4)·arista².`);
      push(`Fórmula: A_total = 8 · (√3/4)·arista² = 2√3 · arista²`);
      push(`Sustitución: A_total = 2√3 · (${fmt(a)})²`);
      push(`Resultado: A_total ≈ ${fmt(A.areaTotal)} cm²`);
    }
    return steps;
  }

  /* ---------- Cuerpos redondos ---------- */
  if (def.id === 'cilindro') {
    const { radio: r, altura: h } = dims;
    if (quantity === 'areaBase') {
      push(`Fórmula: A_base = πr²`);
      push(`Sustitución: A_base = π(${fmt(r)})²`);
      push(`Resultado: A_base = ${fmt(r * r)}π ≈ ${fmt(A.areaBase)} cm²`);
    } else if (quantity === 'areaLateral') {
      push(`Al desenrollarla, la superficie lateral es un rectángulo de base 2πr y altura h.`);
      push(`Fórmula: A_lateral = 2πr·h`);
      push(`Sustitución: A_lateral = 2π(${fmt(r)})(${fmt(h)})`);
      push(`Resultado: A_lateral ≈ ${fmt(A.areaLateral)} cm²`);
    } else if (quantity === 'areaTotal') {
      push(`Fórmula: A_total = 2πr² + 2πr·h`);
      push(`Resultado: A_total ≈ ${fmt(A.areaTotal)} cm²`);
    } else if (quantity === 'volumen') {
      push(`Fórmula: V = πr²h`);
      push(`Sustitución: V = π(${fmt(r)})²(${fmt(h)})`);
      push(`Operación: V = ${fmt(r * r * h)}π`);
      push(`Resultado: V ≈ ${fmt(def.volume(dims))} cm³`);
    }
    return steps;
  }
  if (def.id === 'cono') {
    const { radio: r, altura: h } = dims;
    const g = Math.sqrt(r * r + h * h);
    if (quantity === 'areaBase') {
      push(`Fórmula: A_base = πr²`);
      push(`Resultado: A_base ≈ ${fmt(A.areaBase)} cm²`);
    } else if (quantity === 'areaLateral') {
      push(`Generatriz: g = √(r² + h²) = √(${fmt(r * r)} + ${fmt(h * h)}) ≈ ${fmt(g)} cm`);
      push(`Fórmula: A_lateral = πr·g`);
      push(`Sustitución: A_lateral = π(${fmt(r)})(${fmt(g)})`);
      push(`Resultado: A_lateral ≈ ${fmt(A.areaLateral)} cm²`);
    } else if (quantity === 'areaTotal') {
      push(`Fórmula: A_total = πr² + πr·g   (g ≈ ${fmt(g)} cm)`);
      push(`Resultado: A_total ≈ ${fmt(A.areaTotal)} cm²`);
    } else if (quantity === 'volumen') {
      push(`Fórmula: V = (1/3)πr²h`);
      push(`El cono ocupa un tercio del cilindro con la misma base y altura.`);
      push(`Sustitución: V = (1/3)π(${fmt(r)})²(${fmt(h)})`);
      push(`Resultado: V ≈ ${fmt(def.volume(dims))} cm³`);
    }
    return steps;
  }
  if (def.id === 'esfera') {
    const r = dims.radio;
    if (quantity === 'volumen') {
      push(`Fórmula: V = (4/3)πr³`);
      push(`Sustitución: V = (4/3)π(${fmt(r)})³`);
      push(`Operación: V = ${fmt((4 / 3) * r ** 3)}π`);
      push(`Resultado: V ≈ ${fmt(def.volume(dims))} cm³`);
    } else {
      push(`Fórmula: A = 4πr²`);
      push(`Sustitución: A = 4π(${fmt(r)})²`);
      push(`Resultado: A ≈ ${fmt(A.areaTotal)} cm²`);
    }
    return steps;
  }
  if (def.id === 'tronco_cono') {
    const { radioSuperior: r, radioInferior: R, altura: h } = dims;
    const g = Math.sqrt(h * h + (R - r) ** 2);
    if (quantity === 'areaBase') {
      push(`Fórmula: suma de bases = πr² + πR²`);
      push(`Resultado ≈ ${fmt(A.areaBase)} cm²`);
    } else if (quantity === 'areaLateral') {
      push(`Generatriz: g = √(h² + (R−r)²) ≈ ${fmt(g)} cm`);
      push(`Fórmula: A_lateral = π(R + r)·g`);
      push(`Resultado: A_lateral ≈ ${fmt(A.areaLateral)} cm²`);
    } else if (quantity === 'areaTotal') {
      push(`Fórmula: A_total = π(R+r)g + πR² + πr²`);
      push(`Resultado: A_total ≈ ${fmt(A.areaTotal)} cm²`);
    } else if (quantity === 'volumen') {
      push(`Fórmula: V = (1/3)πh(R² + Rr + r²)`);
      push(`Sustitución: V = (1/3)π(${fmt(h)})[(${fmt(R)})² + (${fmt(R)})(${fmt(r)}) + (${fmt(r)})²]`);
      push(`Resultado: V ≈ ${fmt(def.volume(dims))} cm³`);
    }
    return steps;
  }

  return steps;
}

window.fmt = fmt;
window.buildProcedure = buildProcedure;
window.POLY_NAME = POLY_NAME;
