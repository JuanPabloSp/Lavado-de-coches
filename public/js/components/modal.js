import { escapeHtml } from '../utils/sanitize.js';

/**
 * Confirmación con campo de motivo opcional. Devuelve una promesa con
 * `{ confirmado, motivo }`. Se monta en document.body, fuera del render de la
 * vista, para que un refresco de datos no la cierre por debajo.
 */
export function pedirConfirmacion({ titulo, mensaje, textoConfirmar = 'Confirmar', peligro = false, conMotivo = false }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <h2 class="modal-card__titulo" id="modal-titulo">${escapeHtml(titulo)}</h2>
        <p class="modal-card__mensaje">${escapeHtml(mensaje)}</p>
        ${conMotivo ? `
          <label class="campo">
            <span class="campo__etiqueta">Motivo (opcional)</span>
            <textarea class="input" data-motivo maxlength="200" placeholder="Se fue sin esperar"></textarea>
          </label>` : ''}
        <div class="modal-card__acciones">
          <button class="btn btn--fantasma" data-respuesta="no">Volver</button>
          <button class="btn ${peligro ? 'btn--peligro' : 'btn--primario'}" data-respuesta="si">${escapeHtml(textoConfirmar)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const cerrar = (confirmado) => {
      document.removeEventListener('keydown', onKey);
      const motivo = overlay.querySelector('[data-motivo]')?.value.trim() || '';
      overlay.remove();
      resolve({ confirmado, motivo });
    };
    const onKey = (e) => { if (e.key === 'Escape') cerrar(false); };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) return cerrar(false);
      const boton = e.target.closest('[data-respuesta]');
      if (boton) cerrar(boton.dataset.respuesta === 'si');
    });
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => overlay.querySelector('[data-respuesta="no"]')?.focus());
  });
}
