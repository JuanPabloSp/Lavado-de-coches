/* ============================================
   Configuración del local (rueda de la cabecera):
   - Datos del local: nombre comercial, razón social, RUC, dirección...
   - Plazas: añadir, renombrar, activar / desactivar.
   Las plazas no se borran (las órdenes pasadas las siguen nombrando): se
   desactivan y dejan de salir en la pantalla de plazas.
   ============================================ */
import api from '../api.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/sanitize.js';

/**
 * Abre el modal. Devuelve una promesa que se resuelve al cerrarlo, con `true`
 * si se cambió algo (para que la app recargue catálogo y estado).
 */
export async function abrirConfiguracion() {
  let config;
  try {
    config = await api.configuracion();
  } catch (err) {
    showToast(err.message, 'error');
    return false;
  }

  return new Promise((resolve) => {
    let cambios = false;
    const l = config.local;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card modal-card--config" role="dialog" aria-modal="true" aria-labelledby="config-titulo">
        <div class="config__cabecera">
          <h2 class="modal-card__titulo" id="config-titulo">Configuración del local</h2>
          <button class="cobro-cerrar" data-cerrar aria-label="Cerrar">×</button>
        </div>

        <section class="config__seccion">
          <h3 class="config__subtitulo">Datos del local</h3>
          <form class="config__form" data-form-local novalidate>
            <label class="campo config__campo--ancho">
              <span class="campo__etiqueta">Nombre del local</span>
              <input class="input" name="nombreLocal" maxlength="60" required value="${escapeHtml(l.nombreLocal)}">
            </label>
            <label class="campo">
              <span class="campo__etiqueta">Razón social</span>
              <input class="input" name="razonSocial" maxlength="100" value="${escapeHtml(l.razonSocial)}" placeholder="Lavadero Central S.A.">
            </label>
            <label class="campo">
              <span class="campo__etiqueta">RUC</span>
              <input class="input" name="ruc" maxlength="20" value="${escapeHtml(l.ruc)}" placeholder="80012345-6">
            </label>
            <label class="campo config__campo--ancho">
              <span class="campo__etiqueta">Dirección</span>
              <input class="input" name="direccion" maxlength="150" value="${escapeHtml(l.direccion)}" placeholder="Av. Mcal. López 1234">
            </label>
            <label class="campo">
              <span class="campo__etiqueta">Ciudad</span>
              <input class="input" name="ciudad" maxlength="60" value="${escapeHtml(l.ciudad)}" placeholder="Asunción">
            </label>
            <label class="campo">
              <span class="campo__etiqueta">Teléfono</span>
              <input class="input" name="telefono" maxlength="30" inputmode="tel" value="${escapeHtml(l.telefono)}" placeholder="021 123 456">
            </label>
            <p class="campo__error config__campo--ancho" data-error-local></p>
            <div class="config__acciones config__campo--ancho">
              <button type="submit" class="btn btn--primario">Guardar datos del local</button>
            </div>
          </form>
        </section>

        <section class="config__seccion">
          <h3 class="config__subtitulo">Plazas de trabajo</h3>
          <ul class="config__plazas" data-plazas></ul>
          <form class="config__nueva-plaza" data-form-plaza novalidate>
            <input class="input" name="nombre" maxlength="40" placeholder="Nombre de la nueva plaza (opcional)">
            <button type="submit" class="btn btn--neutro">Añadir plaza</button>
          </form>
        </section>
      </div>`;
    document.body.appendChild(overlay);

    const listaPlazas = overlay.querySelector('[data-plazas]');
    const formLocal = overlay.querySelector('[data-form-local]');
    const formPlaza = overlay.querySelector('[data-form-plaza]');

    // Solo se repinta la lista de plazas: el formulario del local conserva lo
    // que se esté escribiendo.
    function pintarPlazas() {
      listaPlazas.innerHTML = config.plazas.map(p => `
        <li class="config__plaza ${p.activa ? '' : 'config__plaza--inactiva'}">
          <input class="input" data-nombre-plaza="${p.id}" maxlength="40" value="${escapeHtml(p.nombre)}" aria-label="Nombre de la plaza">
          <span class="chip ${p.ocupadaPor ? 'chip--lavando' : p.activa ? 'chip--libre' : 'chip--neutro'}">
            ${p.ocupadaPor ? `Lavando ${escapeHtml(p.ocupadaPor)}` : p.activa ? 'Activa' : 'Desactivada'}
          </span>
          <button class="btn btn--fantasma" data-renombrar="${p.id}">Guardar nombre</button>
          <button class="btn ${p.activa ? 'btn--peligro' : 'btn--neutro'}" data-activar="${p.id}" data-valor="${!p.activa}">
            ${p.activa ? 'Desactivar' : 'Activar'}
          </button>
        </li>`).join('');
    }

    async function recargar() {
      config = await api.configuracion();
      pintarPlazas();
    }

    async function accionPlaza(boton, llamada, mensaje) {
      boton.disabled = true;
      try {
        await llamada();
        cambios = true;
        showToast(mensaje, 'success');
        await recargar();
      } catch (err) {
        showToast(err.message, 'error', 5000);
        boton.disabled = false;
      }
    }

    formLocal.addEventListener('submit', async (e) => {
      e.preventDefault();
      const datos = Object.fromEntries(new FormData(formLocal));
      const error = overlay.querySelector('[data-error-local]');
      if (!datos.nombreLocal.trim()) {
        error.textContent = 'El nombre del local no puede quedar vacío.';
        formLocal.elements.nombreLocal.focus();
        return;
      }
      error.textContent = '';
      try {
        config = await api.guardarLocal(datos);
        cambios = true;
        showToast('Datos del local guardados', 'success');
      } catch (err) {
        error.textContent = err.message;
      }
    });

    formPlaza.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = formPlaza.elements.nombre;
      const boton = formPlaza.querySelector('button');
      accionPlaza(boton, async () => {
        await api.crearPlaza(input.value.trim() || null);
        input.value = '';
      }, 'Plaza añadida');
    });

    const cerrar = () => {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve(cambios);
    };
    const onKey = (e) => { if (e.key === 'Escape') cerrar(); };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('[data-cerrar]')) return cerrar();

      const renombrar = e.target.closest('[data-renombrar]');
      if (renombrar) {
        const id = Number(renombrar.dataset.renombrar);
        const nombre = overlay.querySelector(`[data-nombre-plaza="${id}"]`).value.trim();
        if (!nombre) return showToast('Escribe un nombre para la plaza.', 'warning');
        return accionPlaza(renombrar, () => api.editarPlaza(id, { nombre }), `Plaza renombrada: ${nombre}`);
      }

      const activar = e.target.closest('[data-activar]');
      if (activar) {
        const activa = activar.dataset.valor === 'true';
        accionPlaza(activar, () => api.editarPlaza(Number(activar.dataset.activar), { activa }),
          activa ? 'Plaza activada' : 'Plaza desactivada');
      }
    });
    document.addEventListener('keydown', onKey);

    pintarPlazas();
    requestAnimationFrame(() => formLocal.elements.nombreLocal.focus());
  });
}
