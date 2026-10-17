/* ============================================
   Pantalla de cobro — el modal de cobro del TPV del comandero
   (js/views/tpv.js, "MODAL COBRO"), adaptado a guaraníes y a un lavadero.

   Diferencias con el original:
   - Guaraníes enteros: sin coma, con tecla "000" y billetes de Gs.
   - Cuatro métodos (efectivo, tarjeta, QR, transferencia). Sin Mixto: en el
     comandero quedó con tres fallos conocidos (registro, entrada 115).
   - Tiene campos de texto (RUC y nombre para la factura). Por eso NO se repinta
     entero en cada toque como el original —se perdería el foco y lo tecleado—:
     el esqueleto se pinta una vez y solo se refrescan las zonas que cambian.
   ============================================ */
import api from '../api.js';
import { showToast } from './toast.js';
import { mostrarVuelto } from './vueltoModal.js';
import { escapeHtml } from '../utils/sanitize.js';
import { formatGs, formatMiles, METODOS_PAGO } from '../utils/formato.js';
import { iconos, ICONO_METODO } from '../utils/iconos.js';

const BILLETES = [2000, 5000, 10000, 20000, 50000, 100000];
const MAX_DIGITOS = 10; // hasta 9.999.999.999: más que cualquier cobro real

/**
 * Abre el cobro de una orden. Devuelve una promesa con el resultado del
 * servidor ({ numero, vuelto, ... }) o null si se cerró sin cobrar.
 * @param {object} orden  objeto de /api/estado
 * @param {{ entregar?: boolean }} opciones  cobrar y entregar a la vez
 */
export function abrirCobro(orden, { entregar = false } = {}) {
  return new Promise((resolve) => {
    // Estado del cobro. Vive fuera de cualquier render y se reinicia SOLO al
    // abrir el cobro siguiente, como en el comandero.
    const total = orden.total;
    let metodo = 'efectivo';
    // '' = no se ha tecleado nada (se cobra el importe justo); '0' = se pulsó C.
    let buffer = '';
    // 'billete' o 'digito': los billetes SUMAN y dejan un importe cerrado; el
    // primer dígito después de un billete empieza un importe nuevo. Sin esta
    // marca, en el comandero el teclado dejaba de responder tras un billete.
    let ultimaEntrada = null;
    let procesando = false;

    const overlay = document.createElement('div');
    overlay.className = 'cobro-overlay';
    overlay.innerHTML = `
      <div class="cobro-card" role="dialog" aria-modal="true" aria-labelledby="cobro-titulo">
        <div class="cobro-card__cabecera">
          <h2 id="cobro-titulo">${iconos.cobrar(20)} ${entregar ? 'Cobrar y entregar' : 'Cobrar'}</h2>
          <button class="cobro-cerrar" data-cerrar aria-label="Cerrar sin cobrar">×</button>
        </div>
        <div class="cobro-body">
          <div class="cobro-izq">
            <div class="cobro-cajas" data-zona="cajas"></div>
            <div class="cobro-metodos" data-zona="metodos"></div>
            <div class="cobro-entrada" data-zona="entrada"></div>
          </div>
          <div class="cobro-der">
            <div class="cobro-panel">
              <div class="cobro-panel__fila"><span>Vehículo</span><strong>${escapeHtml(orden.matricula)}</strong></div>
              ${orden.vehiculo ? `<div class="cobro-panel__fila"><span>Modelo</span><strong>${escapeHtml(orden.vehiculo)}</strong></div>` : ''}
              <div class="cobro-panel__fila"><span>Servicios</span><strong>${escapeHtml(orden.servicios.join(', '))}</strong></div>
              <div class="cobro-panel__fila"><span>Estado</span><strong>${escapeHtml(_textoEstado(orden))}</strong></div>
              <div data-zona="devolver"></div>
            </div>
            <div class="cobro-panel">
              <label class="campo">
                <span class="campo__etiqueta">RUC o CI (factura)</span>
                <input class="input" data-campo="ruc" maxlength="20" inputmode="text" autocomplete="off" placeholder="80012345-6">
              </label>
              <label class="campo">
                <span class="campo__etiqueta">Nombre o razón social</span>
                <input class="input" data-campo="nombre" maxlength="80" autocomplete="off" value="${escapeHtml(orden.clienteNombre)}">
              </label>
              <p class="cobro-panel__nota">La factura electrónica se emite aparte, en e-Kuatia'i, hasta conectar el programa con SIFEN.</p>
            </div>
            <div class="cobro-acciones">
              <button class="cobro-btn-volver" data-cerrar>Volver sin cobrar</button>
              <button class="cobro-btn-confirmar" data-confirmar></button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const zona = (nombre) => overlay.querySelector(`[data-zona="${nombre}"]`);
    const btnConfirmar = overlay.querySelector('[data-confirmar]');

    function _calculo() {
      const esEfectivo = metodo === 'efectivo';
      const tecleado = parseInt(buffer, 10) || 0;
      // Con los demás métodos no se teclea nada: se cobra el total clavado.
      const entregado = esEfectivo ? (buffer ? tecleado : total) : total;
      const falta = esEfectivo && buffer !== '' && tecleado < total;
      return { esEfectivo, tecleado, entregado, falta, vuelto: Math.max(0, entregado - total) };
    }

    function _caja(etiqueta, valor, { tono = '', color = '', grande = false } = {}) {
      const cifra = formatMiles(valor);
      // La cifra se encoge sola para caber en su caja (ver .cobro-caja__valor):
      // así no hace falta tope de importe y la caja nunca empuja la columna
      // derecha fuera del modal. En el comandero bastaba una escala por tramos
      // ("14,00€"); con guaraníes la cifra es el doble de larga y se mide
      // contra el ancho real de la caja. El "Gs." va pequeño para dejarle sitio.
      // --chars: los dígitos más ~2 del prefijo a 0,6em.
      return `
        <div class="cobro-caja ${grande ? 'cobro-caja--grande' : ''} ${tono ? `cobro-caja--${tono}` : ''}">
          <div class="cobro-caja__etiqueta">${etiqueta}</div>
          <div class="cobro-caja__valor ${color ? `cobro-caja__valor--${color}` : ''}" style="--tam:${grande ? 1.9 : 1.35}rem; --chars:${cifra.length + 2}"><span class="cobro-caja__moneda">Gs.</span>${cifra}</div>
        </div>`;
    }

    function _pintarEntrada() {
      if (metodo !== 'efectivo') {
        zona('entrada').innerHTML = `
          <div class="cobro-sin-teclear">Cobro íntegro con ${METODOS_PAGO[metodo].toLowerCase()}.<br>No hay que teclear ningún importe.</div>`;
        return;
      }
      zona('entrada').innerHTML = `
        <div class="cobro-billetes">
          ${BILLETES.map(b => `<button class="cobro-tecla cobro-tecla--billete" data-sumar="${b}">+${formatMiles(b)}</button>`).join('')}
        </div>
        <div class="cobro-teclado">
          ${[7, 8, 9].map(n => `<button class="cobro-tecla" data-digito="${n}">${n}</button>`).join('')}
          <button class="cobro-tecla cobro-tecla--accion" data-accion="exacto" title="Importe justo, sin vuelto">Exacto</button>
          ${[4, 5, 6].map(n => `<button class="cobro-tecla" data-digito="${n}">${n}</button>`).join('')}
          <button class="cobro-tecla cobro-tecla--accion" data-accion="borrar" title="Borrar el último dígito" aria-label="Borrar">⌫</button>
          ${[1, 2, 3].map(n => `<button class="cobro-tecla" data-digito="${n}">${n}</button>`).join('')}
          <button class="cobro-tecla cobro-tecla--accion cobro-tecla--peligro cobro-tecla--doble-fila" data-accion="limpiar" title="Vaciar el importe">C</button>
          <button class="cobro-tecla cobro-tecla--doble-col" data-digito="0">0</button>
          <button class="cobro-tecla" data-digito="000">000</button>
        </div>`;
    }

    function _pintar({ conEntrada = false } = {}) {
      const { esEfectivo, entregado, falta, vuelto, tecleado } = _calculo();

      // Falta dinero: la caja del entregado se pone en rojo y la tercera dice
      // CUÁNTO falta, en vez de un "Vuelto Gs. 0" que parece que está todo bien.
      zona('cajas').innerHTML = _caja('A cobrar', total) + (esEfectivo
        ? _caja('Entregado', entregado, falta ? { tono: 'error', color: 'error' } : { tono: 'ok', color: 'ok' })
          + (falta
            ? _caja('Faltan', total - tecleado, { tono: 'error', color: 'error', grande: true })
            : _caja('Vuelto', vuelto, vuelto > 0 ? { tono: 'aviso', color: 'aviso', grande: true } : { color: 'apagado', grande: true }))
        : _caja('Se cobra', total, { color: 'info', grande: true }));

      zona('metodos').innerHTML = Object.entries(METODOS_PAGO).map(([id, nombre]) => `
        <button class="cobro-metodo ${metodo === id ? 'cobro-metodo--activo' : ''}" data-metodo="${id}" aria-pressed="${metodo === id}">
          ${ICONO_METODO[id](24)}${nombre}
        </button>`).join('');

      zona('devolver').innerHTML = esEfectivo && vuelto > 0
        ? `<div class="cobro-panel__fila cobro-panel__devolver"><span>Devolver</span><strong>${formatGs(vuelto)}</strong></div>`
        : '';

      if (conEntrada) _pintarEntrada();

      btnConfirmar.disabled = falta || procesando;
      btnConfirmar.innerHTML = `${iconos.check(22)}<span>${procesando ? 'Cobrando…' : `${entregar ? 'Cobrar y entregar' : 'Cobrar'} ${formatGs(total)}`}</span>`;
    }

    function _tecla({ digito, sumar, accion }) {
      if (sumar) {
        buffer = String((parseInt(buffer, 10) || 0) + Number(sumar));
        ultimaEntrada = 'billete';
      } else if (accion === 'exacto') {
        buffer = String(total);
        ultimaEntrada = 'billete';
      } else if (accion === 'borrar') {
        // Sin dígitos se vuelve a "sin tocar", que cobra el importe justo.
        buffer = buffer.slice(0, -1);
        ultimaEntrada = 'digito';
      } else if (accion === 'limpiar') {
        // '0' y no '': con '' la pantalla volvería a mostrar el total y
        // parecería que C no borra (comandero, entrada 115).
        buffer = '0';
        ultimaEntrada = 'digito';
      } else if (digito != null) {
        if (ultimaEntrada === 'billete') buffer = '';
        ultimaEntrada = 'digito';
        // Tras un C, el primer dígito sustituye al cero en vez de dejar "07".
        const base = buffer === '0' ? '' : buffer;
        const nuevo = base + digito;
        if (/^0+$/.test(nuevo)) buffer = '0';
        else if (nuevo.replace(/^0+/, '').length <= MAX_DIGITOS) buffer = nuevo.replace(/^0+/, '');
      }
      _pintar();
    }

    function cerrar(resultado) {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve(resultado);
    }

    async function confirmar() {
      const { esEfectivo, entregado, falta } = _calculo();
      if (falta || procesando) return;
      procesando = true;
      _pintar();
      try {
        const resultado = await api.cobrar(orden.id, {
          metodoPago: metodo,
          importeRecibido: esEfectivo ? entregado : null,
          clienteRuc: overlay.querySelector('[data-campo="ruc"]').value,
          clienteNombre: overlay.querySelector('[data-campo="nombre"]').value,
          entregar
        });
        cerrar(resultado);
        // Primero el vuelto, y el aviso después: si salen a la vez, el aviso
        // tapa la cifra que hay que devolver.
        if (esEfectivo && resultado.vuelto > 0) await mostrarVuelto(resultado);
        showToast(`Cobrado ${formatGs(resultado.total)} · venta Nº ${resultado.numero}${resultado.entregada ? ' · entregado' : ''}`, 'success');
      } catch (err) {
        // El modal sigue abierto con lo tecleado: se corrige y se reintenta.
        procesando = false;
        _pintar();
        showToast(err.message, 'error', 5000);
      }
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('[data-cerrar]')) {
        if (!procesando) cerrar(null);
        return;
      }
      if (e.target.closest('[data-confirmar]')) return confirmar();

      const btnMetodo = e.target.closest('[data-metodo]');
      if (btnMetodo) {
        // Cambiar de método invalida lo tecleado.
        metodo = btnMetodo.dataset.metodo;
        buffer = '';
        ultimaEntrada = null;
        _pintar({ conEntrada: true });
        return;
      }

      const tecla = e.target.closest('[data-digito], [data-sumar], [data-accion]');
      if (tecla) _tecla(tecla.dataset);
    });

    // Teclado físico (si el dispositivo lo tiene). No interfiere al escribir
    // en los campos de RUC y nombre.
    const onKey = (e) => {
      if (e.key === 'Escape') { if (!procesando) cerrar(null); return; }
      if (e.target.closest?.('input, textarea')) {
        if (e.key === 'Enter') { e.preventDefault(); confirmar(); }
        return;
      }
      if (e.key === 'Enter') { e.preventDefault(); confirmar(); return; }
      if (metodo !== 'efectivo') return;
      if (/^\d$/.test(e.key)) { e.preventDefault(); _tecla({ digito: e.key }); }
      else if (e.key === 'Backspace') { e.preventDefault(); _tecla({ accion: 'borrar' }); }
      else if (e.key === 'Delete') { e.preventDefault(); _tecla({ accion: 'limpiar' }); }
    };
    document.addEventListener('keydown', onKey);

    _pintar({ conEntrada: true });
  });
}

function _textoEstado(orden) {
  if (orden.estado === 'lavando') return `Lavando en ${orden.plazaNombre || 'plaza'}`;
  if (orden.estado === 'listo') return 'Listo para retirar';
  return 'En espera';
}
