/**
 * Autocompletado del campo "Vehículo": propone marca, luego modelo y luego
 * color mientras se escribe. Teclado: ↑/↓ para moverse, Enter o Tab para
 * aceptar, Escape para cerrar. Con el ratón o el dedo, tocar la sugerencia.
 *
 * Sigue siendo un campo de texto libre: si la marca o el modelo no están en el
 * catálogo, se escribe a mano y listo.
 */
import { sugerir } from '../utils/sugerencias.js';
import { escapeHtml } from '../utils/sanitize.js';

/**
 * @param {HTMLInputElement} input
 * @param {{ nombresTamano?: Record<string,string>, onModelo?: (tamanoId:string) => void }} opciones
 * @returns {() => void} cleanup
 */
export function adjuntarAutocompletado(input, { nombresTamano = {}, onModelo } = {}) {
  const lista = document.createElement('ul');
  lista.className = 'sugerencias';
  lista.id = `${input.name}-sugerencias`;
  lista.setAttribute('role', 'listbox');
  lista.hidden = true;
  input.parentElement.classList.add('campo--con-sugerencias');
  input.insertAdjacentElement('afterend', lista);

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', lista.id);
  input.setAttribute('aria-expanded', 'false');

  let items = [];
  let activo = 0;

  function pintar() {
    if (!items.length) return cerrar();
    lista.innerHTML = items.map((s, i) => `
      <li class="sugerencias__item ${i === activo ? 'sugerencias__item--activo' : ''}" role="option"
          id="${lista.id}-${i}" aria-selected="${i === activo}" data-indice="${i}">
        <span class="sugerencias__tipo sugerencias__tipo--${s.tipo}">${s.tipo === 'marca' ? 'Marca' : s.tipo === 'modelo' ? 'Modelo' : 'Color'}</span>
        <span class="sugerencias__texto">${escapeHtml(s.texto)}</span>
        <span class="sugerencias__detalle">${escapeHtml(s.detalle || nombresTamano[s.tamano] || '')}</span>
      </li>`).join('');
    lista.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-activedescendant', `${lista.id}-${activo}`);
  }

  function cerrar() {
    lista.hidden = true;
    items = [];
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function actualizar() {
    items = sugerir(input.value);
    activo = 0;
    pintar();
  }

  function aceptar(indice) {
    const s = items[indice];
    if (!s) return;
    // Tras marca o modelo se deja un espacio para seguir escribiendo, y se
    // proponen al momento los modelos (o los colores).
    input.value = s.tipo === 'color' ? s.valor : `${s.valor} `;
    if (s.tipo === 'modelo' && s.tamano) onModelo?.(s.tamano);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (s.tipo === 'color') cerrar();
    input.focus();
  }

  function onKeydown(e) {
    if (lista.hidden) {
      if (e.key === 'ArrowDown') { actualizar(); e.preventDefault(); }
      return;
    }
    if (e.key === 'ArrowDown') { activo = (activo + 1) % items.length; pintar(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { activo = (activo - 1 + items.length) % items.length; pintar(); e.preventDefault(); }
    // Enter acepta la sugerencia en vez de enviar el formulario.
    else if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) { aceptar(activo); e.preventDefault(); }
    else if (e.key === 'Escape') { cerrar(); e.preventDefault(); e.stopPropagation(); }
  }

  // mousedown (no click) + preventDefault: el campo no pierde el foco al tocar.
  function onMousedown(e) {
    const li = e.target.closest('[data-indice]');
    if (!li) return;
    e.preventDefault();
    aceptar(Number(li.dataset.indice));
  }

  const onBlur = () => cerrar();

  input.addEventListener('input', actualizar);
  input.addEventListener('focus', actualizar);
  input.addEventListener('keydown', onKeydown);
  input.addEventListener('blur', onBlur);
  lista.addEventListener('mousedown', onMousedown);

  return () => {
    input.removeEventListener('input', actualizar);
    input.removeEventListener('focus', actualizar);
    input.removeEventListener('keydown', onKeydown);
    input.removeEventListener('blur', onBlur);
    lista.removeEventListener('mousedown', onMousedown);
    lista.remove();
  };
}
