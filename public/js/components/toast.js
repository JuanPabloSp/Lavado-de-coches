/* ============================================
   Avisos (toasts) — del comandero (js/components/toast.js)
   ============================================ */
import { iconos } from '../utils/iconos.js';

/** Máximo de avisos simultáneos: una ráfaga de errores no tapa la pantalla. */
const MAX_VISIBLES = 3;

const ICONOS = { success: iconos.check, error: iconos.x, warning: iconos.alerta, info: iconos.info };

/**
 * El contenedor se crea bajo demanda. En el comandero lo creaba solo uno de
 * los arranques y en el TPV todos los avisos se perdían en silencio (registro,
 * entrada 119).
 */
function _getContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration en ms
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = _getContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icono = document.createElement('span');
  icono.className = 'toast__icono';
  icono.innerHTML = (ICONOS[type] || ICONOS.info)(20);
  // El texto va con textContent: los mensajes de error pueden llevar datos
  // escritos por el usuario (una matrícula) y el original los metía en innerHTML.
  const texto = document.createElement('span');
  texto.textContent = message;
  toast.append(icono, texto);

  container.appendChild(toast);
  while (container.children.length > MAX_VISIBLES) container.removeChild(container.firstElementChild);

  setTimeout(() => {
    toast.classList.add('toast--saliendo');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
