/* ============================================================
   calculations/volumes.js
   Pure functions: dims -> volume (cm³)
   ============================================================ */

const Volumes = {
  cubo({ lado }) { return lado ** 3; },
  prisma_rectangular({ largo, ancho, alto }) { return largo * ancho * alto; },
  prisma_triangular({ base, alturaBase, alto }) { return ((base * alturaBase) / 2) * alto; },
  cilindro({ radio, altura }) { return Math.PI * radio * radio * altura; },
  cono({ radio, altura }) { return (1 / 3) * Math.PI * radio * radio * altura; },
  esfera({ radio }) { return (4 / 3) * Math.PI * radio ** 3; },

  prisma_pentagonal({ lado, alto }) {
    const apotema = lado / (2 * Math.tan(Math.PI / 5));
    const areaBase = (5 * lado * apotema) / 2;
    return areaBase * alto;
  },
  piramide_triangular({ lado, altura }) {
    const areaBase = (Math.sqrt(3) / 4) * lado * lado;
    return (1 / 3) * areaBase * altura;
  },
  piramide_cuadrangular({ lado, altura }) {
    return (1 / 3) * (lado * lado) * altura;
  },
  piramide_pentagonal({ lado, altura }) {
    const apotemaBase = lado / (2 * Math.tan(Math.PI / 5));
    const areaBase = (5 * lado * apotemaBase) / 2;
    return (1 / 3) * areaBase * altura;
  },
  tetraedro({ arista }) { return arista ** 3 / (6 * Math.SQRT2); },
  octaedro({ arista }) { return (Math.sqrt(2) / 3) * arista ** 3; },
  tronco_cono({ radioSuperior, radioInferior, altura }) {
    return (1 / 3) * Math.PI * altura * (radioSuperior ** 2 + radioSuperior * radioInferior + radioInferior ** 2);
  },
};

window.Volumes = Volumes;
