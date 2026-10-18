/* ============================================
   Pantalla 1 — Plazas de trabajo
   ============================================ */
import api from '../api.js';
import store from '../store.js';
import { escapeHtml } from '../utils/sanitize.js';
import { iconos } from '../utils/iconos.js';
import { formatGs, minutosDesde, textoMinutos } from '../utils/formato.js';
import { ejecutar, cobrar, ordenDeBoton } from '../acciones.js';
import { elegirVehiculo } from '../components/elegirVehiculoModal.js';
import { pedirConfirmacion } from '../components/modal.js';
import { chipPago, detalleVehiculo, etiquetasServicios } from './comun.js';

export function renderPlazas(container) {
  function render() {
    const e = store.estado;
    if (!e) {
      container.innerHTML = '<p class="vacio">Cargando…</p>';
      return;
    }
    const ahora = Date.now();
    container.innerHTML = `
      <section class="vista">
        <div class="plazas-grid">
          ${e.plazas.map(p => (p.orden ? _ocupada(p, ahora) : _libre(p, e.espera[0]))).join('')}
        </div>
        <div class="resumen-fuera">
          <span>Fuera: <strong>${e.espera.length}</strong> en espera · <strong>${e.listos.length}</strong> listos para retirar</span>
          <a class="btn btn--fantasma" href="#/fuera">Ver la lista</a>
        </div>
      </section>`;
  }

  // Un solo listener, delegado en el contenedor: sobrevive a los re-render
  // (en el comandero cada render tenía que volver a enganchar sus listeners).
  function onClick(ev) {
    const btn = ev.target.closest('[data-accion]');
    if (!btn || btn.disabled) return;
    const orden = ordenDeBoton(btn);
    // Las acciones de una plaza libre no llevan orden; las demás sí.
    const dePlazaLibre = btn.dataset.accion === 'siguiente' || btn.dataset.accion === 'elegir';
    if (!orden && !dePlazaLibre) return;

    switch (btn.dataset.accion) {
      case 'siguiente': {
        const primero = store.estado?.espera[0];
        const plaza = store.estado?.plazas.find(p => p.id === Number(btn.dataset.plaza));
        ejecutar(btn, () => api.siguiente(Number(btn.dataset.plaza)),
          primero && plaza ? `${primero.matricula} entra en ${plaza.nombre}` : null);
        break;
      }
      case 'elegir': {
        const plaza = store.estado?.plazas.find(p => p.id === Number(btn.dataset.plaza));
        if (!plaza) return;
        elegirVehiculo({ plaza, espera: store.estado.espera }).then((elegida) => {
          if (elegida) ejecutar(null, () => api.iniciar(elegida.id, plaza.id), `${elegida.matricula} entra en ${plaza.nombre}`);
        });
        break;
      }
      case 'terminar':
        // Pasar a "listo" avisa al cliente de que puede retirarlo: mejor
        // confirmar que no fue un toque sin querer.
        pedirConfirmacion({
          titulo: `¿Terminaste ${orden.matricula}?`,
          mensaje: `${orden.servicios.join(', ')}. El vehículo pasa a «Listos para retirar» y la plaza queda libre.`,
          textoConfirmar: 'Sí, terminado'
        }).then(({ confirmado }) => {
          if (confirmado) ejecutar(btn, () => api.terminar(orden.id), `${orden.matricula} listo para retirar`);
        });
        break;
      case 'devolver':
        pedirConfirmacion({
          titulo: `¿Devolver ${orden.matricula} a la cola?`,
          mensaje: 'Sale de la plaza sin terminar y vuelve a la lista de espera en su turno de llegada. La plaza queda libre.',
          textoConfirmar: 'Sí, devolver a la cola'
        }).then(({ confirmado }) => {
          if (confirmado) ejecutar(btn, () => api.devolver(orden.id), `${orden.matricula} vuelve a la cola`);
        });
        break;
      case 'cobrar':
        if (orden) cobrar(orden);
        break;
    }
  }

  container.addEventListener('click', onClick);
  const unsub = store.on(render);
  render();

  return () => {
    container.removeEventListener('click', onClick);
    unsub();
  };
}

function _ocupada(plaza, ahora) {
  const o = plaza.orden;
  const min = minutosDesde(o.inicioAt, ahora);
  const previsto = Math.max(1, o.duracionMin);
  const pasado = min > previsto;
  const pct = Math.min(100, Math.round((min / previsto) * 100));

  return `
    <article class="plaza-card plaza-card--ocupada ${pasado ? 'plaza-card--pasada' : ''}">
      <header class="plaza-card__cabecera">
        <h2 class="plaza-card__nombre">${escapeHtml(plaza.nombre)}</h2>
        <span class="chip chip--estado ${pasado ? 'chip--pasado' : 'chip--lavando'}">${iconos.auto(18)}${pasado ? 'Lavando · pasado de tiempo' : 'Lavando'}</span>
      </header>
      <div class="plaza-card__matricula">${escapeHtml(o.matricula)}</div>
      <div class="plaza-card__vehiculo">${detalleVehiculo(o)}</div>
      <ul class="plaza-card__servicios">${etiquetasServicios(o)}</ul>
      ${o.notas ? `<p class="plaza-card__notas">${escapeHtml(o.notas)}</p>` : ''}
      <div class="plaza-card__pie">
        <div class="progreso ${pasado ? 'progreso--pasado' : ''}"><div class="progreso__barra" style="width:${pct}%"></div></div>
        <div class="tiempo ${pasado ? 'tiempo--pasado' : ''}">
          ${pasado
            ? `${textoMinutos(min)} · ${textoMinutos(min - previsto)} más de lo previsto`
            : `${textoMinutos(min)} de ${textoMinutos(previsto)} previstos`}
        </div>
        <div class="fila-pago">${chipPago(o)}<span class="importe">${formatGs(o.total)}</span></div>
        <div class="plaza-card__acciones">
          <button class="btn btn--exito btn--grande" data-accion="terminar" data-id="${o.id}">Terminado</button>
          ${o.pagada ? '' : `<button class="btn btn--neutro" data-accion="cobrar" data-id="${o.id}">Cobrar</button>`}
          <button class="btn btn--fantasma" data-accion="devolver" data-id="${o.id}">Devolver a la cola</button>
        </div>
      </div>
    </article>`;
}

function _libre(plaza, siguiente) {
  return `
    <article class="plaza-card plaza-card--libre">
      <header class="plaza-card__cabecera">
        <h2 class="plaza-card__nombre">${escapeHtml(plaza.nombre)}</h2>
        <span class="chip chip--estado chip--libre">${iconos.auto(18)}Libre</span>
      </header>
      ${siguiente
        ? `<p class="plaza-card__siguiente">Siguiente en la cola:<br>
             <strong>${escapeHtml(siguiente.matricula)}</strong> · ${escapeHtml(siguiente.servicios.join(', '))}</p>
           <div class="plaza-card__botones">
             <button class="btn btn--primario btn--grande" data-accion="siguiente" data-plaza="${plaza.id}">Meter siguiente</button>
             <button class="btn btn--neutro btn--grande" data-accion="elegir" data-plaza="${plaza.id}">Elegir vehículo</button>
           </div>`
        : `<p class="plaza-card__vacia">No hay vehículos esperando.</p>
           <a class="btn btn--fantasma" href="#/nuevo">Registrar vehículo</a>`}
    </article>`;
}
