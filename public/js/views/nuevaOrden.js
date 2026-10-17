/* ============================================
   Nuevo vehículo — registrar una orden y ponerla en la cola
   ============================================ */
import api from '../api.js';
import store from '../store.js';
import { escapeHtml } from '../utils/sanitize.js';
import { formatGs, textoMinutos } from '../utils/formato.js';
import { showToast } from '../components/toast.js';
import { cobrar } from '../acciones.js';
import { adjuntarAutocompletado } from '../components/autocompletarVehiculo.js';

export function renderNuevaOrden(container, { navigate }) {
  const cat = store.catalogo;
  if (!cat) {
    container.innerHTML = `
      <div class="vacio">
        <p>No se pudo cargar la lista de servicios.</p>
        <button class="btn btn--primario" data-reintentar>Reintentar</button>
      </div>`;
    const onReintentar = async (ev) => {
      if (!ev.target.closest('[data-reintentar]')) return;
      try {
        await store.cargarCatalogo();
        navigate('#/nuevo', { forzar: true });
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
    container.addEventListener('click', onReintentar);
    return () => container.removeEventListener('click', onReintentar);
  }

  // El formulario se pinta UNA vez; tamaño, servicios y total se actualizan en
  // su sitio. Repintarlo entero a cada toque borraría lo escrito y el foco.
  let tamanoId = cat.tamanos[0]?.id;
  const elegidos = new Set();
  let guardando = false;

  container.innerHTML = `
    <section class="vista">
      <h1 class="vista__titulo">Nuevo vehículo</h1>
      <form class="form-orden" novalidate>
        <div class="form-orden__bloque">
          <label class="campo">
            <span class="campo__etiqueta">Matrícula</span>
            <input class="input input--matricula" name="matricula" maxlength="20" autocomplete="off" autocapitalize="characters" placeholder="ABCD 123" required>
            <span class="campo__error" data-error="matricula"></span>
          </label>
          <label class="campo">
            <span class="campo__etiqueta">Vehículo</span>
            <input class="input" name="vehiculo" maxlength="80" autocomplete="off" spellcheck="false" placeholder="Empieza a escribir: Toyota, Hilux, Picanto…">
            <span class="campo__ayuda">Marca, modelo y color. Al elegir el modelo se marca el tamaño (se puede cambiar).</span>
          </label>
          <div class="campo">
            <span class="campo__etiqueta">Tamaño</span>
            <div class="selector" role="radiogroup">
              ${cat.tamanos.map(t => `<button type="button" class="selector__opcion" role="radio" data-tamano="${escapeHtml(t.id)}">${escapeHtml(t.nombre)}</button>`).join('')}
            </div>
          </div>
          <div class="campo">
            <span class="campo__etiqueta">Servicios</span>
            <div class="servicios-grid">
              ${cat.servicios.map(s => `
                <button type="button" class="servicio-opcion" data-servicio="${s.id}" aria-pressed="false">
                  <span class="servicio-opcion__nombre">${escapeHtml(s.nombre)}</span>
                  <span class="servicio-opcion__precio" data-precio="${s.id}"></span>
                  <span class="servicio-opcion__duracion">${textoMinutos(s.duracionMin)}</span>
                </button>`).join('')}
            </div>
            <span class="campo__error" data-error="servicios"></span>
          </div>
        </div>

        <div class="form-orden__bloque">
          <div class="form-orden__fila">
            <label class="campo">
              <span class="campo__etiqueta">Cliente</span>
              <input class="input" name="clienteNombre" maxlength="80" autocomplete="off" placeholder="Opcional">
            </label>
            <label class="campo">
              <span class="campo__etiqueta">Teléfono</span>
              <input class="input" name="clienteTelefono" maxlength="30" inputmode="tel" autocomplete="off" placeholder="0981 123 456">
            </label>
          </div>
          <label class="campo">
            <span class="campo__etiqueta">Notas</span>
            <textarea class="input" name="notas" maxlength="300" placeholder="Tiene silla de bebé, no tocar el interior…"></textarea>
          </label>
          <div class="form-orden__total">
            <span class="campo__etiqueta">Total</span>
            <span class="form-orden__total-importe" data-total></span>
          </div>
          <div class="form-orden__acciones">
            <button type="submit" class="btn btn--primario btn--grande" data-guardar="cola">Guardar en la cola</button>
            <button type="button" class="btn btn--neutro btn--grande" data-guardar="cobrar">Guardar y cobrar ahora</button>
            <a class="btn btn--fantasma" href="#/fuera">Volver sin guardar</a>
          </div>
        </div>
      </form>
    </section>`;

  const form = container.querySelector('form');
  const campo = (nombre) => form.elements[nombre];

  function _actualizar() {
    container.querySelectorAll('[data-tamano]').forEach(b => {
      const activo = b.dataset.tamano === tamanoId;
      b.classList.toggle('selector__opcion--activa', activo);
      b.setAttribute('aria-checked', String(activo));
    });
    let total = 0;
    for (const s of cat.servicios) {
      const precio = s.precios[tamanoId];
      const boton = container.querySelector(`[data-servicio="${s.id}"]`);
      const activo = elegidos.has(s.id);
      boton.classList.toggle('servicio-opcion--activa', activo);
      boton.setAttribute('aria-pressed', String(activo));
      container.querySelector(`[data-precio="${s.id}"]`).textContent = precio != null ? formatGs(precio) : 'Sin precio';
      if (activo && precio != null) total += precio;
    }
    // Total orientativo: el que manda es el que calcula el servidor al guardar.
    container.querySelector('[data-total]').textContent = formatGs(total);
  }

  function _error(nombre, texto) {
    container.querySelector(`[data-error="${nombre}"]`).textContent = texto;
    if (nombre === 'matricula') campo('matricula').classList.toggle('input--invalido', !!texto);
  }

  async function guardar(modo) {
    if (guardando) return;
    const matricula = campo('matricula').value.trim();
    _error('matricula', matricula ? '' : 'Escribe la matrícula.');
    _error('servicios', elegidos.size ? '' : 'Elige al menos un servicio.');
    if (!matricula) return campo('matricula').focus();
    if (!elegidos.size) return;

    guardando = true;
    form.querySelectorAll('[data-guardar]').forEach(b => { b.disabled = true; });
    try {
      const { id } = await api.crearOrden({
        matricula,
        vehiculo: campo('vehiculo').value,
        tamanoId,
        servicioIds: [...elegidos],
        clienteNombre: campo('clienteNombre').value,
        clienteTelefono: campo('clienteTelefono').value,
        notas: campo('notas').value
      });
      await store.recargar().catch(() => {});
      const orden = store.orden(id);
      showToast(`${orden?.matricula || matricula} en la cola de espera`, 'success');
      if (modo === 'cobrar' && orden) await cobrar(orden);
      navigate('#/fuera');
    } catch (err) {
      showToast(err.message, 'error', 5000);
      guardando = false;
      form.querySelectorAll('[data-guardar]').forEach(b => { b.disabled = false; });
    }
  }

  function onClick(ev) {
    const tamano = ev.target.closest('[data-tamano]');
    if (tamano) {
      tamanoId = tamano.dataset.tamano;
      return _actualizar();
    }
    const servicio = ev.target.closest('[data-servicio]');
    if (servicio) {
      const id = Number(servicio.dataset.servicio);
      if (elegidos.has(id)) elegidos.delete(id);
      else elegidos.add(id);
      _error('servicios', '');
      return _actualizar();
    }
    const boton = ev.target.closest('[data-guardar="cobrar"]');
    if (boton) guardar('cobrar');
  }

  function onSubmit(ev) {
    ev.preventDefault();
    guardar('cola');
  }

  function onInput(ev) {
    if (ev.target.name === 'matricula') _error('matricula', '');
  }

  const quitarAutocompletado = adjuntarAutocompletado(campo('vehiculo'), {
    nombresTamano: Object.fromEntries(cat.tamanos.map(t => [t.id, t.nombre])),
    onModelo(tamano) {
      // Solo si ese tamaño existe en el catálogo del lavadero.
      if (cat.tamanos.some(t => t.id === tamano)) {
        tamanoId = tamano;
        _actualizar();
      }
    }
  });

  container.addEventListener('click', onClick);
  form.addEventListener('submit', onSubmit);
  form.addEventListener('input', onInput);
  _actualizar();
  campo('matricula').focus();

  return () => {
    quitarAutocompletado();
    container.removeEventListener('click', onClick);
    form.removeEventListener('submit', onSubmit);
    form.removeEventListener('input', onInput);
  };
}
