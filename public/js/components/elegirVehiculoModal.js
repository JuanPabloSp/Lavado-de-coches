import { escapeHtml } from '../utils/sanitize.js';
import { formatGs, minutosDesde, textoMinutos } from '../utils/formato.js';

/**
 * Lista la cola de espera para elegir qué vehículo entra en una plaza (cuando
 * no toca el primero: un cliente con prisa, un lavado corto...). Devuelve una
 * promesa con la orden elegida o null si se cierra sin elegir.
 */
export function elegirVehiculo({ plaza, espera }) {
  return new Promise((resolve) => {
    const ahora = Date.now();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card modal-card--ancho" role="dialog" aria-modal="true" aria-labelledby="elegir-titulo">
        <h2 class="modal-card__titulo" id="elegir-titulo">¿Qué vehículo entra en ${escapeHtml(plaza.nombre)}?</h2>
        <ul class="elegir-lista">
          ${espera.map((o, i) => `
            <li>
              <button class="elegir-opcion" data-id="${o.id}">
                <span class="fila-orden__posicion">${i + 1}</span>
                <span class="elegir-opcion__datos">
                  <span class="fila-orden__matricula">${escapeHtml(o.matricula)}</span>
                  <span class="fila-orden__detalle">${escapeHtml([o.vehiculo, o.tamanoNombre].filter(Boolean).join(' · '))}</span>
                  <span class="fila-orden__detalle">${escapeHtml(o.servicios.join(', '))} · ${textoMinutos(o.duracionMin)}</span>
                </span>
                <span class="fila-orden__lado">
                  <span class="importe">${formatGs(o.total)}</span>
                  <span class="tiempo">espera ${textoMinutos(minutosDesde(o.creadaAt, ahora))}</span>
                </span>
              </button>
            </li>`).join('')}
        </ul>
        <div class="modal-card__acciones">
          <button class="btn btn--fantasma" data-cerrar>Volver</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const cerrar = (orden) => {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve(orden);
    };
    const onKey = (e) => { if (e.key === 'Escape') cerrar(null); };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('[data-cerrar]')) return cerrar(null);
      const opcion = e.target.closest('[data-id]');
      if (opcion) cerrar(espera.find(o => o.id === Number(opcion.dataset.id)) || null);
    });
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => overlay.querySelector('.elegir-opcion')?.focus());
  });
}
