import { formatMiles, formatGs } from '../utils/formato.js';

/**
 * Modal grande de "vuelto a devolver" tras un cobro en efectivo. Es el
 * `_showChangeModal` del TPV del comandero: autónomo, montado en document.body,
 * y se cierra con Aceptar, Enter, Escape o espacio. Devuelve una promesa que
 * se resuelve al cerrarlo.
 */
export function mostrarVuelto({ vuelto, total, recibido }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'vuelto-overlay';
    overlay.innerHTML = `
      <div class="vuelto-card" role="dialog" aria-modal="true" aria-label="Vuelto a devolver">
        <div class="vuelto-card__cabecera">Vuelto a devolver</div>
        <div class="vuelto-card__importe"><span>Gs.</span>${formatMiles(vuelto)}</div>
        <div class="vuelto-card__detalle">
          <div><span>Total</span><strong>${formatGs(total)}</strong></div>
          <div><span>Entregado</span><strong>${formatGs(recibido)}</strong></div>
        </div>
        <button class="vuelto-card__btn" data-aceptar>Aceptar</button>
      </div>`;
    document.body.appendChild(overlay);

    const cerrar = () => {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve();
    };
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') { e.preventDefault(); cerrar(); }
    };

    overlay.querySelector('[data-aceptar]').addEventListener('click', cerrar);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => overlay.querySelector('[data-aceptar]')?.focus());
  });
}
