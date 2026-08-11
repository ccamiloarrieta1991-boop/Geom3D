/* ============================================================
   navigation.js
   Top-level phase switching (Explorar / Calcular / Comprobar).
   Dispatches a 'geom3d:phasechange' event so app.js can lazily
   initialize each phase's 3D viewport only when first shown
   (important for performance on mobile).
   ============================================================ */

const Navigation = {
  init() {
    document.querySelectorAll('.phasenav button').forEach((btn) => {
      btn.addEventListener('click', () => this.goTo(btn.dataset.phase));
    });
    this.goTo(State.get('phase') || 'explore', { silent: true });
  },

  goTo(phase, opts = {}) {
    document.querySelectorAll('.phasenav button').forEach((btn) => {
      btn.setAttribute('aria-current', String(btn.dataset.phase === phase));
    });
    document.querySelectorAll('.view').forEach((view) => {
      view.setAttribute('data-active', String(view.id === `view-${phase}`));
    });
    State.set('phase', phase);
    document.dispatchEvent(new CustomEvent('geom3d:phasechange', { detail: { phase, ...opts } }));
  },
};

window.Navigation = Navigation;
