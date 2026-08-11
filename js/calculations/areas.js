/* ============================================================
   calculations/areas.js
   Pure functions: dims -> { areaBase, areaLateral, areaTotal }
   Any quantity not defined for a solid is left undefined so the
   UI can hide it (e.g. a sphere has no "areaBase").
   ============================================================ */

const Areas = {
  cubo({ lado: a }) {
    return { areaBase: a * a, areaLateral: 4 * a * a, areaTotal: 6 * a * a };
  },
  prisma_rectangular({ largo, ancho, alto }) {
    const areaBase = largo * ancho;
    const areaLateral = 2 * alto * (largo + ancho);
    return { areaBase, areaLateral, areaTotal: areaLateral + 2 * areaBase };
  },
  prisma_triangular({ base, alturaBase, alto }) {
    const areaBase = (base * alturaBase) / 2;
    // Lateral kept simple: perimeter of the right-triangle base × height
    const hipotenusa = Math.sqrt(base * base + alturaBase * alturaBase);
    const perimetro = base + alturaBase + hipotenusa;
    const areaLateral = perimetro * alto;
    return { areaBase, areaLateral, areaTotal: areaLateral + 2 * areaBase };
  },
  cilindro({ radio, altura }) {
    const areaBase = Math.PI * radio * radio;
    const areaLateral = 2 * Math.PI * radio * altura;
    return { areaBase, areaLateral, areaTotal: areaLateral + 2 * areaBase };
  },
  cono({ radio, altura }) {
    const generatriz = Math.sqrt(radio * radio + altura * altura);
    const areaBase = Math.PI * radio * radio;
    const areaLateral = Math.PI * radio * generatriz;
    return { areaBase, areaLateral, areaTotal: areaLateral + areaBase };
  },
  esfera({ radio }) {
    return { areaTotal: 4 * Math.PI * radio * radio };
  },

  prisma_pentagonal({ lado, alto }) {
    const apotema = lado / (2 * Math.tan(Math.PI / 5));
    const areaBase = (5 * lado * apotema) / 2;
    const areaLateral = 5 * lado * alto;
    return { areaBase, areaLateral, areaTotal: areaLateral + 2 * areaBase };
  },

  piramide_triangular({ lado, altura }) {
    const areaBase = (Math.sqrt(3) / 4) * lado * lado;
    const apotemaBase = lado / (2 * Math.sqrt(3));
    const apotemaLateral = Math.sqrt(altura * altura + apotemaBase * apotemaBase);
    const areaLateral = (3 * lado * apotemaLateral) / 2;
    return { areaBase, areaLateral, areaTotal: areaBase + areaLateral };
  },

  piramide_cuadrangular({ lado, altura }) {
    const areaBase = lado * lado;
    const apotemaBase = lado / 2;
    const apotemaLateral = Math.sqrt(altura * altura + apotemaBase * apotemaBase);
    const areaLateral = (4 * lado * apotemaLateral) / 2;
    return { areaBase, areaLateral, areaTotal: areaBase + areaLateral };
  },

  piramide_pentagonal({ lado, altura }) {
    const apotemaBase = lado / (2 * Math.tan(Math.PI / 5));
    const areaBase = (5 * lado * apotemaBase) / 2;
    const apotemaLateral = Math.sqrt(altura * altura + apotemaBase * apotemaBase);
    const areaLateral = (5 * lado * apotemaLateral) / 2;
    return { areaBase, areaLateral, areaTotal: areaBase + areaLateral };
  },

  tetraedro({ arista }) {
    return { areaTotal: Math.sqrt(3) * arista * arista };
  },

  octaedro({ arista }) {
    return { areaTotal: 2 * Math.sqrt(3) * arista * arista };
  },

  tronco_cono({ radioSuperior, radioInferior, altura }) {
    const generatriz = Math.sqrt(altura * altura + (radioInferior - radioSuperior) ** 2);
    const areaBase = Math.PI * (radioSuperior * radioSuperior + radioInferior * radioInferior); // suma de las dos bases
    const areaLateral = Math.PI * (radioSuperior + radioInferior) * generatriz;
    return { areaBase, areaLateral, areaTotal: areaLateral + areaBase };
  },
};

window.Areas = Areas;
