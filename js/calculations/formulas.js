/* ============================================================
   calculations/formulas.js
   Human-readable formula strings and step-by-step procedure
   builders, used by "VER PROCEDIMIENTO" in Fase 2.
   Values are formatted with Colombian decimal convention (coma).
   ============================================================ */

function fmt(n, decimals = 2) {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Builds the ordered list of procedure steps (fórmula, sustitución,
 * operación, resultado, unidad) for a given solid + quantity.
 * quantity: 'areaBase' | 'areaLateral' | 'areaTotal' | 'volumen'
 */
function buildProcedure(solidId, dims, quantity) {
  const steps = [];
  const push = (text) => steps.push(text);

  switch (solidId) {
    case 'cubo': {
      const a = dims.lado;
      if (quantity === 'areaBase') {
        push(`Fórmula: A_base = lado²`);
        push(`Sustitución: A_base = (${fmt(a)})²`);
        push(`Resultado: A_base = ${fmt(a * a)} cm²`);
      } else if (quantity === 'areaTotal') {
        push(`Fórmula: A_total = 6 · lado²`);
        push(`Sustitución: A_total = 6 · (${fmt(a)})²`);
        push(`Resultado: A_total = ${fmt(6 * a * a)} cm²`);
      } else if (quantity === 'volumen') {
        push(`Fórmula: V = lado³`);
        push(`Sustitución: V = (${fmt(a)})³`);
        push(`Resultado: V = ${fmt(a ** 3)} cm³`);
      }
      break;
    }
    case 'prisma_rectangular': {
      const { largo, ancho, alto } = dims;
      if (quantity === 'areaBase') {
        push(`Fórmula: A_base = largo · ancho`);
        push(`Sustitución: A_base = ${fmt(largo)} · ${fmt(ancho)}`);
        push(`Resultado: A_base = ${fmt(largo * ancho)} cm²`);
      } else if (quantity === 'areaTotal') {
        push(`Fórmula: A_total = 2(largo·ancho + largo·alto + ancho·alto)`);
        push(`Sustitución: A_total = 2(${fmt(largo)}·${fmt(ancho)} + ${fmt(largo)}·${fmt(alto)} + ${fmt(ancho)}·${fmt(alto)})`);
        push(`Resultado: A_total = ${fmt(2 * (largo * ancho + largo * alto + ancho * alto))} cm²`);
      } else if (quantity === 'volumen') {
        push(`Fórmula: V = largo · ancho · alto`);
        push(`Sustitución: V = ${fmt(largo)} · ${fmt(ancho)} · ${fmt(alto)}`);
        push(`Resultado: V = ${fmt(largo * ancho * alto)} cm³`);
      }
      break;
    }
    case 'prisma_triangular': {
      const { base, alturaBase, alto } = dims;
      const areaBase = (base * alturaBase) / 2;
      if (quantity === 'areaBase') {
        push(`Fórmula: A_base = (base · altura_triángulo) / 2`);
        push(`Sustitución: A_base = (${fmt(base)} · ${fmt(alturaBase)}) / 2`);
        push(`Resultado: A_base = ${fmt(areaBase)} cm²`);
      } else if (quantity === 'volumen') {
        push(`Fórmula: V = A_base · alto`);
        push(`Sustitución: V = ${fmt(areaBase)} · ${fmt(alto)}`);
        push(`Resultado: V = ${fmt(areaBase * alto)} cm³`);
      }
      break;
    }
    case 'cilindro': {
      const { radio, altura } = dims;
      if (quantity === 'areaBase') {
        push(`Fórmula: A_base = πr²`);
        push(`Sustitución: A_base = π(${fmt(radio)})²`);
        push(`Resultado: A_base = ${fmt(radio * radio)}π ≈ ${fmt(Math.PI * radio * radio)} cm²`);
      } else if (quantity === 'areaLateral') {
        push(`Fórmula: A_lateral = 2πr·h`);
        push(`Sustitución: A_lateral = 2π(${fmt(radio)})(${fmt(altura)})`);
        push(`Resultado: A_lateral = ${fmt(2 * radio * altura)}π ≈ ${fmt(2 * Math.PI * radio * altura)} cm²`);
      } else if (quantity === 'areaTotal') {
        push(`Fórmula: A_total = 2πr² + 2πr·h`);
        push(`Sustitución: A_total = 2π(${fmt(radio)})² + 2π(${fmt(radio)})(${fmt(altura)})`);
        const total = 2 * Math.PI * radio * radio + 2 * Math.PI * radio * altura;
        push(`Resultado: A_total ≈ ${fmt(total)} cm²`);
      } else if (quantity === 'volumen') {
        push(`Fórmula: V = πr²h`);
        push(`Sustitución: V = π(${fmt(radio)})²(${fmt(altura)})`);
        push(`Operación: V = ${fmt(radio * radio * altura)}π`);
        push(`Resultado: V ≈ ${fmt(Math.PI * radio * radio * altura)} cm³`);
      }
      break;
    }
    case 'cono': {
      const { radio, altura } = dims;
      const generatriz = Math.sqrt(radio * radio + altura * altura);
      if (quantity === 'areaBase') {
        push(`Fórmula: A_base = πr²`);
        push(`Sustitución: A_base = π(${fmt(radio)})²`);
        push(`Resultado: A_base ≈ ${fmt(Math.PI * radio * radio)} cm²`);
      } else if (quantity === 'areaLateral') {
        push(`Generatriz: g = √(r² + h²) = √(${fmt(radio * radio)} + ${fmt(altura * altura)}) ≈ ${fmt(generatriz)} cm`);
        push(`Fórmula: A_lateral = πr·g`);
        push(`Sustitución: A_lateral = π(${fmt(radio)})(${fmt(generatriz)})`);
        push(`Resultado: A_lateral ≈ ${fmt(Math.PI * radio * generatriz)} cm²`);
      } else if (quantity === 'areaTotal') {
        const total = Math.PI * radio * radio + Math.PI * radio * generatriz;
        push(`Fórmula: A_total = πr² + πr·g   (g ≈ ${fmt(generatriz)} cm)`);
        push(`Resultado: A_total ≈ ${fmt(total)} cm²`);
      } else if (quantity === 'volumen') {
        push(`Fórmula: V = (1/3)πr²h`);
        push(`Sustitución: V = (1/3)π(${fmt(radio)})²(${fmt(altura)})`);
        push(`Operación: V = ${fmt((radio * radio * altura) / 3)}π`);
        push(`Resultado: V ≈ ${fmt((1 / 3) * Math.PI * radio * radio * altura)} cm³`);
      }
      break;
    }
    case 'esfera': {
      const { radio } = dims;
      if (quantity === 'areaTotal') {
        push(`Fórmula: A = 4πr²`);
        push(`Sustitución: A = 4π(${fmt(radio)})²`);
        push(`Resultado: A ≈ ${fmt(4 * Math.PI * radio * radio)} cm²`);
      } else if (quantity === 'volumen') {
        push(`Fórmula: V = (4/3)πr³`);
        push(`Sustitución: V = (4/3)π(${fmt(radio)})³`);
        push(`Operación: V = ${fmt((4 / 3) * radio ** 3)}π`);
        push(`Resultado: V ≈ ${fmt((4 / 3) * Math.PI * radio ** 3)} cm³`);
      }
      break;
    }
    case 'prisma_pentagonal': {
      const { lado, alto } = dims;
      const apotema = lado / (2 * Math.tan(Math.PI / 5));
      const areaBase = (5 * lado * apotema) / 2;
      if (quantity === 'areaBase') {
        push(`Apotema: a = lado / (2·tan(36°)) ≈ ${fmt(apotema)} cm`);
        push(`Fórmula: A_base = (5 · lado · apotema) / 2`);
        push(`Sustitución: A_base = (5 · ${fmt(lado)} · ${fmt(apotema)}) / 2`);
        push(`Resultado: A_base ≈ ${fmt(areaBase)} cm²`);
      } else if (quantity === 'areaLateral') {
        push(`Fórmula: A_lateral = 5 · lado · altura   (5 caras rectangulares)`);
        push(`Sustitución: A_lateral = 5 · ${fmt(lado)} · ${fmt(alto)}`);
        push(`Resultado: A_lateral ≈ ${fmt(5 * lado * alto)} cm²`);
      } else if (quantity === 'areaTotal') {
        const total = 5 * lado * alto + 2 * areaBase;
        push(`Fórmula: A_total = A_lateral + 2·A_base`);
        push(`Resultado: A_total ≈ ${fmt(total)} cm²`);
      } else if (quantity === 'volumen') {
        push(`Fórmula: V = A_base · altura`);
        push(`Sustitución: V = ${fmt(areaBase)} · ${fmt(alto)}`);
        push(`Resultado: V ≈ ${fmt(areaBase * alto)} cm³`);
      }
      break;
    }
    case 'piramide_triangular':
    case 'piramide_cuadrangular':
    case 'piramide_pentagonal': {
      const { lado, altura } = dims;
      const sides = solidId === 'piramide_triangular' ? 3 : solidId === 'piramide_cuadrangular' ? 4 : 5;
      const areaBase = Areas[solidId](dims).areaBase;
      const apotemaBase = sides === 3 ? lado / (2 * Math.sqrt(3)) : sides === 4 ? lado / 2 : lado / (2 * Math.tan(Math.PI / 5));
      const apotemaLateral = Math.sqrt(altura * altura + apotemaBase * apotemaBase);
      if (quantity === 'areaBase') {
        push(`Fórmula: A_base = área del polígono regular de ${sides} lados`);
        push(`Sustitución: A_base con lado = ${fmt(lado)} cm`);
        push(`Resultado: A_base ≈ ${fmt(areaBase)} cm²`);
      } else if (quantity === 'areaLateral') {
        push(`Apotema lateral: aL = √(altura² + apotema_base²) ≈ ${fmt(apotemaLateral)} cm`);
        push(`Fórmula: A_lateral = (perímetro_base · apotema_lateral) / 2`);
        push(`Sustitución: A_lateral = (${sides}·${fmt(lado)} · ${fmt(apotemaLateral)}) / 2`);
        push(`Resultado: A_lateral ≈ ${fmt((sides * lado * apotemaLateral) / 2)} cm²`);
      } else if (quantity === 'areaTotal') {
        const total = Areas[solidId](dims).areaTotal;
        push(`Fórmula: A_total = A_base + A_lateral`);
        push(`Resultado: A_total ≈ ${fmt(total)} cm²`);
      } else if (quantity === 'volumen') {
        push(`Fórmula: V = (1/3) · A_base · altura`);
        push(`Sustitución: V = (1/3) · ${fmt(areaBase)} · ${fmt(altura)}`);
        push(`Resultado: V ≈ ${fmt((1 / 3) * areaBase * altura)} cm³`);
      }
      break;
    }
    case 'tetraedro': {
      const { arista: a } = dims;
      if (quantity === 'areaTotal') {
        push(`Fórmula: A = √3 · arista²   (4 caras triangulares equiláteras)`);
        push(`Sustitución: A = √3 · (${fmt(a)})²`);
        push(`Resultado: A ≈ ${fmt(Math.sqrt(3) * a * a)} cm²`);
      } else if (quantity === 'volumen') {
        push(`Fórmula: V = arista³ / (6√2)`);
        push(`Sustitución: V = (${fmt(a)})³ / (6√2)`);
        push(`Resultado: V ≈ ${fmt(a ** 3 / (6 * Math.SQRT2))} cm³`);
      }
      break;
    }
    case 'octaedro': {
      const { arista: a } = dims;
      if (quantity === 'areaTotal') {
        push(`Fórmula: A = 2√3 · arista²   (8 caras triangulares equiláteras)`);
        push(`Sustitución: A = 2√3 · (${fmt(a)})²`);
        push(`Resultado: A ≈ ${fmt(2 * Math.sqrt(3) * a * a)} cm²`);
      } else if (quantity === 'volumen') {
        push(`Fórmula: V = (√2/3) · arista³`);
        push(`Sustitución: V = (√2/3) · (${fmt(a)})³`);
        push(`Resultado: V ≈ ${fmt((Math.sqrt(2) / 3) * a ** 3)} cm³`);
      }
      break;
    }
    case 'tronco_cono': {
      const { radioSuperior: r, radioInferior: R, altura: h } = dims;
      const g = Math.sqrt(h * h + (R - r) ** 2);
      if (quantity === 'areaBase') {
        push(`Fórmula: suma de las bases = πr² + πR²`);
        push(`Sustitución: = π(${fmt(r)})² + π(${fmt(R)})²`);
        push(`Resultado ≈ ${fmt(Math.PI * (r * r + R * R))} cm²`);
      } else if (quantity === 'areaLateral') {
        push(`Generatriz: g = √(h² + (R−r)²) ≈ ${fmt(g)} cm`);
        push(`Fórmula: A_lateral = π(R + r)·g`);
        push(`Sustitución: A_lateral = π(${fmt(R)} + ${fmt(r)})(${fmt(g)})`);
        push(`Resultado: A_lateral ≈ ${fmt(Math.PI * (R + r) * g)} cm²`);
      } else if (quantity === 'areaTotal') {
        const total = Areas.tronco_cono(dims).areaTotal;
        push(`Fórmula: A_total = A_lateral + πr² + πR²`);
        push(`Resultado: A_total ≈ ${fmt(total)} cm²`);
      } else if (quantity === 'volumen') {
        push(`Fórmula: V = (1/3)πh(R² + Rr + r²)`);
        push(`Sustitución: V = (1/3)π(${fmt(h)})[(${fmt(R)})² + (${fmt(R)})(${fmt(r)}) + (${fmt(r)})²]`);
        push(`Resultado: V ≈ ${fmt((1 / 3) * Math.PI * h * (R * R + R * r + r * r))} cm³`);
      }
      break;
    }
  }
  return steps;
}

window.fmt = fmt;
window.buildProcedure = buildProcedure;
