/* ============================================================
   ui/controls.js
   - SVG glyphs for the solid catalog cards.
   - SimpleOrbitControls: a small, dependency-free rotate/zoom/pan
     controller (mouse + touch) so we don't need to pull in the
     full Three.js "examples/jsm" OrbitControls module just for
     three interactions. Keeps the stack lean, per project brief.
   ============================================================ */

const GLYPHS = {
  cube: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 12 20 6l12 6-12 6-12-6Z"/><path d="M8 12v14l12 6 12-6V12"/><path d="M20 18v14"/></svg>`,
  box: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 14 20 8l14 6-14 6-14-6Z"/><path d="M6 14v10l14 6 14-6V14"/><path d="M20 14v16"/></svg>`,
  triprism: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 28 20 8l10 20Z"/><path d="M10 28 6 24l10-20 4 4"/><path d="M20 28 30 24l-10-16"/></svg>`,
  pentaprism: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 6 30 13l-4 12H14l-4-12 10-7Z"/></svg>`,
  cylinder: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="20" cy="10" rx="11" ry="4.5"/><path d="M9 10v18c0 2.5 5 4.5 11 4.5s11-2 11-4.5V10"/></svg>`,
  cone: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="20" cy="30" rx="11" ry="4.5"/><path d="M20 6 9 30M20 6l11 24"/></svg>`,
  sphere: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="20" cy="20" r="13"/><ellipse cx="20" cy="20" rx="13" ry="5"/></svg>`,
  tetra: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 6 33 28H7Z"/><path d="M20 6 20 28M13 17h14"/></svg>`,
  pyramid: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 6 8 26h24Z"/><path d="M8 26 20 30l12-4"/></svg>`,
  octa: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 5 33 20 20 35 7 20Z"/><path d="M7 20h26"/></svg>`,
  frustum: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="20" cy="8" rx="6" ry="3"/><ellipse cx="20" cy="30" rx="12" ry="4.5"/><path d="M14 8 8 30M26 8l6 22"/></svg>`,
};

function glyphSVG(name) {
  return GLYPHS[name] || GLYPHS.cube;
}

/** Renders a row of toggle "chips" (pill buttons) bound to a state getter/setter. */
function renderChipRow(container, chips) {
  container.innerHTML = '';
  chips.forEach((chip) => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.textContent = chip.label;
    btn.setAttribute('aria-pressed', String(chip.active()));
    btn.addEventListener('click', () => {
      chip.onToggle();
      btn.setAttribute('aria-pressed', String(chip.active()));
    });
    container.appendChild(btn);
  });
}

/* ============================================================
   SimpleOrbitControls
   Rotate the camera around a target with drag (mouse/touch),
   zoom with wheel/pinch. No external dependency.
   ============================================================ */
class SimpleOrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;
    this.target = new THREE.Vector3(0, 0, 0);

    this.radius = camera.position.length() || 20;
    this.theta = Math.atan2(camera.position.x, camera.position.z); // azimuth
    this.phi = Math.acos(THREE.MathUtils.clamp(camera.position.y / this.radius, -1, 1)); // polar

    this.minRadius = 6;
    this.maxRadius = 60;
    this.minPhi = 0.15;
    this.maxPhi = Math.PI - 0.15;

    this._dragging = false;
    this._lastX = 0;
    this._lastY = 0;
    this._pinchDist = null;

    this._bind();
    this.update();
  }

  _bind() {
    const dom = this.dom;
    dom.addEventListener('pointerdown', (e) => {
      this._dragging = true;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      dom.setPointerCapture(e.pointerId);
    });
    dom.addEventListener('pointermove', (e) => {
      if (!this._dragging) return;
      const dx = e.clientX - this._lastX;
      const dy = e.clientY - this._lastY;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      this.theta -= dx * 0.008;
      this.phi = THREE.MathUtils.clamp(this.phi - dy * 0.008, this.minPhi, this.maxPhi);
      this.update();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((evt) =>
      dom.addEventListener(evt, () => { this._dragging = false; })
    );
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.radius = THREE.MathUtils.clamp(this.radius + e.deltaY * 0.02, this.minRadius, this.maxRadius);
      this.update();
    }, { passive: false });

    // Basic pinch-to-zoom for touch
    dom.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const [t1, t2] = e.touches;
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (this._pinchDist != null) {
          const delta = this._pinchDist - dist;
          this.radius = THREE.MathUtils.clamp(this.radius + delta * 0.05, this.minRadius, this.maxRadius);
          this.update();
        }
        this._pinchDist = dist;
      }
    }, { passive: false });
    dom.addEventListener('touchend', () => { this._pinchDist = null; });
  }

  reset(radius, theta, phi) {
    this.radius = radius;
    this.theta = theta;
    this.phi = phi;
    this.update();
  }

  update() {
    const { radius, theta, phi, target, camera } = this;
    camera.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(target);
  }
}

window.glyphSVG = glyphSVG;
window.renderChipRow = renderChipRow;
window.SimpleOrbitControls = SimpleOrbitControls;

/* ============================================================
   Generic modal helper (Progreso / Docente / Desarrollo)
   ============================================================ */
function ensureModalRoot() {
  let root = document.getElementById('modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'modal-root';
    root.className = 'modal-overlay';
    root.hidden = true;
    root.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">
      <div class="modal-head"><h2 id="modal-title"></h2><button class="icon-btn" id="modal-close" aria-label="Cerrar">✕</button></div>
      <div id="modal-body"></div>
    </div>`;
    document.body.appendChild(root);
    root.addEventListener('click', (e) => { if (e.target === root) closeModal(); });
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }
  return root;
}

function openModal(title, bodyBuilderFn) {
  const root = ensureModalRoot();
  document.getElementById('modal-title').textContent = title;
  const body = document.getElementById('modal-body');
  body.innerHTML = '';
  bodyBuilderFn(body);
  root.hidden = false;
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.hidden = true;
}

window.openModal = openModal;
window.closeModal = closeModal;
