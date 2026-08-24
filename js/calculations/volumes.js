/* ============================================================
   calculations/volumes.js
   Adaptador: expone Volumes[solidId](dims) desde el catálogo.
   ============================================================ */

const Volumes = {};
SOLIDS_CATALOG.forEach((s) => { Volumes[s.id] = s.volume; });

window.Volumes = Volumes;
