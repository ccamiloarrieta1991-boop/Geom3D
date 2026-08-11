/* ============================================================
   GEOM3D — state.js
   Centralized application state + LocalStorage persistence.
   Every other module reads/writes through this single object
   so state stays predictable and easy to save/restore.
   ============================================================ */

const STORAGE_KEY = 'geom3d_state_v1';

const defaultState = {
  phase: 'explore',          // 'explore' | 'calculate' | 'check'
  currentSolidId: 'cubo',
  dimensions: {},            // per-solid dimension values, keyed by solidId
  viewOptions: {
    edges: true,
    vertices: false,
    transparency: false,
  },
  progress: {
    explore: {},             // solidId -> true once viewed
    calculate: {},           // solidId -> { attempts, correct }
    experiment: {},          // solidId -> { liquid: true, displacement: true, cubes: true }
  },
  reflections: {},
  retosCompleted: 0,
  teacher: { showFormulas: true, hintsEnabled: true },
  unit: 'cm',
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    // shallow-merge to survive schema additions between versions
    return { ...structuredClone(defaultState), ...parsed };
  } catch (e) {
    console.warn('GEOM3D: no se pudo leer el estado guardado, usando valores por defecto.', e);
    return structuredClone(defaultState);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(State.data));
  } catch (e) {
    console.warn('GEOM3D: no se pudo guardar el estado (LocalStorage no disponible).', e);
  }
}

const State = {
  data: loadState(),

  get(path) {
    return path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), this.data);
  },

  set(path, value) {
    const keys = path.split('.');
    let obj = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]] == null) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    saveState();
  },

  markExplored(solidId) {
    this.data.progress.explore[solidId] = true;
    saveState();
  },

  recordAttempt(solidId, wasCorrect) {
    const entry = this.data.progress.calculate[solidId] || { attempts: 0, correct: 0 };
    entry.attempts += 1;
    if (wasCorrect) entry.correct += 1;
    this.data.progress.calculate[solidId] = entry;
    saveState();
  },

  markExperiment(solidId, method) {
    if (!this.data.progress.experiment[solidId]) this.data.progress.experiment[solidId] = {};
    this.data.progress.experiment[solidId][method] = true;
    saveState();
  },

  reset() {
    this.data = structuredClone(defaultState);
    saveState();
  },
};

window.State = State;
