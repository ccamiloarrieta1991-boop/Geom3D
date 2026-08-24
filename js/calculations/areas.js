/* ============================================================
   calculations/areas.js
   Adaptador: expone Areas[solidId](dims) construyéndolo desde
   el catálogo paramétrico, para que el resto de módulos sigan
   usando la misma interfaz sin conocer la parametrización.
   ============================================================ */

const Areas = {};
SOLIDS_CATALOG.forEach((s) => { Areas[s.id] = s.areas; });

window.Areas = Areas;
