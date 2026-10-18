/* ============================================
   Pantalla 2 — Vehículos fuera: en espera y listos para retirar
   ============================================ */
import { logoVehiculo } from '../utils/marcas.js';
import api from '../api.js';
import { pedirConfirmacion } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import store from '../store.js';
import { escapeHtml } from '../utils/sanitize.js';
import { formatGs, minutosDesde, textoMinutos } from '../utils/formato.js';
import { iconos } from '../utils/iconos.js';
import { ejecutar, cobrar, cancelar, ordenDeBoton } from '../acciones.js';
import { chipPago, detalleVehiculo, vacio } from './comun.js';

export function renderFuera(container) {
  function render() {
    const e = store.estado;
    if (!e) {
      container.innerHTML = '<p class="vacio">Cargando…</p>';
      return;
    }
    const ahora = Date.now();
    const libres = e.plazas.filter(p => !p.orden);

    container.innerHTML = `
      <section class="vista fuera-grid">
        <div class="fuera-panel">
          <h2 class="vista__subtitulo">En espera <span class="vista__contador">(${e.espera.length})</span></h2>
          <div class="lista">
            ${e.espera.length
              ? e.espera.map((o, i) => _filaEspera(o, i, libres, ahora)).join('')
              : vacio('No hay vehículos esperando.', '<a class="btn btn--fantasma" href="#/nuevo">Registrar vehículo</a>')}
          </div>
        </div>
        <div class="fuera-panel fuera-panel--listos">
          <h2 class="vista__subtitulo">Listos para retirar <span class="vista__contador">(${e.listos.length})</span></h2>
          <div class="lista">
            ${e.listos.length
              ? e.listos.map(o => _filaLista(o, ahora)).join('')
              : vacio('Ningún vehículo terminado esperando al cliente.')}
          </div>
        </div>
      </section>`;
  }

  function onClick(ev) {
    const btn = ev.target.closest('[data-accion]');
    if (!btn || btn.disabled) return;
    const orden = ordenDeBoton(btn);
    if (!orden) return;

    switch (btn.dataset.accion) {
      case 'iniciar': {
        const plaza = store.estado.plazas.find(p => p.id === Number(btn.dataset.plaza));
        ejecutar(btn, () => api.iniciar(orden.id, plaza.id), `${orden.matricula} entra en ${plaza.nombre}`);
        break;
      }
      case 'cobrar':
        cobrar(orden);
        break;
      case 'cobrar-entregar':
        cobrar(orden, { entregar: true });
        break;
      case 'entregar':
        ejecutar(btn, () => api.entregar(orden.id), `${orden.matricula} entregado`);
        break;
      case 'cancelar':
        cancelar(orden);
        break;
      case 'reactivar': {
        const plaza = store.estado.plazas.find(p => p.id === orden.plazaId);
        const libre = plaza && !plaza.orden;
        pedirConfirmacion({
          titulo: `¿Volver a lavar ${orden.matricula}?`,
          mensaje: libre
            ? `Vuelve a ${plaza.nombre} como «Lavando», con el tiempo que ya llevaba.`
            : 'Su plaza ya está ocupada: vuelve a la cola de espera en su turno de llegada.',
          textoConfirmar: 'Sí, volver a lavar'
        }).then(({ confirmado }) => {
          if (!confirmado) return;
          ejecutar(btn, async () => {
            const r = await api.reactivar(orden.id);
            showToast(r.estado === 'lavando' ? `${orden.matricula} vuelve a ${r.plazaNombre}` : `${orden.matricula} vuelve a la cola`, 'success');
          });
        });
        break;
      }
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

function _datos(o) {
  return `
    <div>
      <div class="con-logo">${logoVehiculo(o.vehiculo, 32)}<div class="fila-orden__matricula">${escapeHtml(o.matricula)}</div></div>
      <div class="fila-orden__detalle">${detalleVehiculo(o)}</div>
      <div class="fila-orden__detalle">${escapeHtml(o.servicios.join(', '))}</div>
      ${o.clienteNombre || o.clienteTelefono
        ? `<div class="fila-orden__detalle">${escapeHtml([o.clienteNombre, o.clienteTelefono].filter(Boolean).join(' · '))}</div>`
        : ''}
      ${o.notas ? `<div class="fila-orden__detalle plaza-card__notas">${escapeHtml(o.notas)}</div>` : ''}
    </div>`;
}

function _filaEspera(o, i, libres, ahora) {
  return `
    <article class="fila-orden">
      <div class="fila-orden__posicion">${i + 1}</div>
      ${_datos(o)}
      <div class="fila-orden__lado">
        <span class="importe">${formatGs(o.total)}</span>
        ${chipPago(o)}
        <span class="tiempo">espera ${textoMinutos(minutosDesde(o.creadaAt, ahora))}</span>
      </div>
      <div class="fila-orden__acciones">
        ${libres.length
          ? libres.map(p => `<button class="btn btn--primario" data-accion="iniciar" data-id="${o.id}" data-plaza="${p.id}">Meter en ${escapeHtml(p.nombre)}</button>`).join('')
          : '<span class="chip chip--neutro">Plazas ocupadas</span>'}
        ${o.pagada ? '' : `<button class="btn btn--neutro" data-accion="cobrar" data-id="${o.id}">Cobrar</button>`}
        ${o.pagada ? '' : `<button class="btn btn--peligro" data-accion="cancelar" data-id="${o.id}">Cancelar</button>`}
      </div>
    </article>`;
}

function _filaLista(o, ahora) {
  return `
    <article class="fila-orden fila-orden--lista">
      <div class="fila-orden__posicion">${iconos.check(20)}</div>
      ${_datos(o)}
      <div class="fila-orden__lado">
        <span class="importe">${formatGs(o.total)}</span>
        ${chipPago(o)}
        <span class="tiempo">listo hace ${textoMinutos(minutosDesde(o.finAt, ahora))}</span>
      </div>
      <div class="fila-orden__acciones">
        ${o.pagada
          ? `<button class="btn btn--exito btn--grande" data-accion="entregar" data-id="${o.id}">Entregar</button>`
          : `<button class="btn btn--exito btn--grande" data-accion="cobrar-entregar" data-id="${o.id}">Cobrar y entregar</button>
             <button class="btn btn--peligro" data-accion="cancelar" data-id="${o.id}">Cancelar</button>`}
        <button class="btn btn--fantasma" data-accion="reactivar" data-id="${o.id}" title="Por si se pulsó Terminado sin querer">Volver a lavar</button>
      </div>
    </article>`;
}
