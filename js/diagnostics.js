/* GEOM3D — diagnóstico y tolerancia a fallos */
(() => {
  const issues = [];
  const startedAt = performance.now();
  const push = (type, message, detail = '') => {
    const item = { type, message: String(message), detail: String(detail || ''), time: new Date().toISOString() };
    issues.push(item);
    window.GEOM3D_DIAGNOSTICS = issues;
    document.dispatchEvent(new CustomEvent('geom3d:diagnostic', { detail: item }));
  };

  window.GEOM3D_DIAG = {
    issues,
    add: push,
    clear() { issues.length = 0; document.dispatchEvent(new Event('geom3d:diagnostics-cleared')); },
    summary() {
      return {
        version: window.GEOM3D_VERSION || 'dev',
        online: navigator.onLine,
        three: !!window.THREE,
        webgl: (() => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (_) { return false; } })(),
        localStorage: (() => { try { const k='__geom3d_test'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true; } catch (_) { return false; } })(),
        startupMs: Math.round(performance.now() - startedAt),
        errors: issues.length
      };
    }
  };

  window.addEventListener('error', e => push('error', e.message || 'Error JavaScript', `${e.filename || ''}:${e.lineno || ''}`));
  window.addEventListener('unhandledrejection', e => push('error', 'Promesa no controlada', e.reason?.stack || e.reason || ''));
  window.addEventListener('online', () => push('info', 'Conexión recuperada'));
  window.addEventListener('offline', () => push('warning', 'La aplicación quedó sin conexión'));
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.THREE) push('error', 'Three.js no está disponible', 'La vista 3D se mostrará en modo diagnóstico. Revisa la conexión o el CDN de Three.js.');
    if (!window.WebGLRenderingContext) push('warning', 'WebGL no está disponible', 'El dispositivo/navegador no expone WebGL.');
    if (!window.ResizeObserver) push('warning', 'ResizeObserver no está disponible', 'Se utilizará un ajuste de tamaño básico.');
  });
})();
