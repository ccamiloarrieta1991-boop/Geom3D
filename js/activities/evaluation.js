/* ============================================================
   activities/evaluation.js
   SISTEMA DE PROGRESO — turns State.data.progress into the
   percentages and badges shown in the Progreso modal.
   ============================================================ */

const BADGES = [
  { id: 'explorador3d', name: 'Explorador 3D', icon: '🏆', test: (p) => Object.keys(p.explore || {}).length >= 6 },
  { id: 'maestro_volumen', name: 'Maestro del volumen', icon: '🏆', test: (p) => {
    const c = p.calculate || {};
    return Object.values(c).filter((x) => x.correct > 0).length >= 6;
  } },
  { id: 'calculista', name: 'Calculista', icon: '🏆', test: (p) => {
    const c = p.calculate || {};
    const totalAttempts = Object.values(c).reduce((s, x) => s + x.attempts, 0);
    return totalAttempts >= 15;
  } },
  { id: 'experimentador', name: 'Experimentador', icon: '🏆', test: (p) => Object.keys(p.experiment || {}).length >= 3 },
  { id: 'geometra', name: 'Geómetra', icon: '🏆', test: (p) => Object.keys(p.explore || {}).length >= SOLIDS_CATALOG.length && Object.keys(p.calculate || {}).length >= SOLIDS_CATALOG.length },
];

function totalSolidsCount() {
  return SOLIDS_CATALOG.length;
}

function computeProgress() {
  const p = State.data.progress;
  const total = totalSolidsCount();
  const exploredPct = Math.round((Object.keys(p.explore || {}).length / total) * 100);
  const calcPct = Math.round((Object.keys(p.calculate || {}).length / total) * 100);
  const expPct = Math.round((Object.keys(p.experiment || {}).length / total) * 100);
  const badges = BADGES.map((b) => ({ ...b, earned: b.test(p) }));
  const retosCompleted = State.get('retosCompleted') || 0;
  return { exploredPct, calcPct, expPct, badges, retosCompleted };
}

window.computeProgress = computeProgress;
window.BADGES = BADGES;
