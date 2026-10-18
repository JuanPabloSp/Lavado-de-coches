/* ============================================
   Arranque de la app: router por hash, cabecera, tema y refresco periódico.
   ============================================ */
import store from './store.js';
import { showToast } from './components/toast.js';
import { iconos } from './utils/iconos.js';
import { abrirConfiguracion } from './components/configuracionModal.js';
import { renderPlazas } from './views/plazas.js';
import { renderFuera } from './views/fuera.js';
import { renderNuevaOrden } from './views/nuevaOrden.js';

const RUTAS = {
  plazas: renderPlazas,
  fuera: renderFuera,
  nuevo: renderNuevaOrden
};

// Cada 20 s se relee el estado: mantiene al día los minutos de espera y de
// lavado, y detecta si el servidor se ha caído.
const REFRESCO_MS = 20000;
// Clave nueva al pasar al tema kiosko por defecto: así no manda la preferencia
// guardada cuando el oscuro era el tema por defecto.
const CLAVE_TEMA = 'lavadero_tema';

const vista = document.getElementById('vista');
let cleanup = null;

function rutaActual() {
  const ruta = location.hash.replace(/^#\/?/, '');
  return RUTAS[ruta] ? ruta : 'plazas';
}

function navegar(hash, { forzar = false } = {}) {
  if (location.hash === hash) {
    if (forzar) montar();
  } else {
    location.hash = hash;
  }
}

/** Toda vista devuelve su función de limpieza; se llama SIEMPRE antes de montar otra. */
function montar() {
  if (cleanup) cleanup();
  cleanup = null;
  const ruta = rutaActual();
  document.querySelectorAll('[data-ruta]').forEach(el => {
    el.classList.toggle('app-nav__tab--activa', el.dataset.ruta === ruta && el.classList.contains('app-nav__tab'));
    if (el.classList.contains('app-nav__tab')) el.setAttribute('aria-current', el.dataset.ruta === ruta ? 'page' : 'false');
  });
  vista.innerHTML = '';
  cleanup = RUTAS[ruta](vista, { navigate: navegar }) || null;
  window.scrollTo(0, 0);
}

function pintarCabecera() {
  const e = store.estado;
  document.getElementById('aviso-conexion').hidden = store.online;
  if (!e) return;
  const ocupadas = e.plazas.filter(p => p.orden).length;
  document.getElementById('badge-plazas').textContent = `${ocupadas}/${e.plazas.length}`;
  const fuera = e.espera.length + e.listos.length;
  document.getElementById('badge-fuera').textContent = fuera ? String(fuera) : '';
}

// ---- Tema: kiosko (claro, colores del TPV) por defecto; oscuro opcional ----
// localStorage puede fallar (modo privado, kiosko): nunca debe tumbar la app
// (comandero, entrada 60).
function leerTema() {
  try { return localStorage.getItem(CLAVE_TEMA) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  const boton = document.getElementById('btn-tema');
  boton.innerHTML = tema === 'light' ? iconos.luna(20) : iconos.sol(20);
  boton.setAttribute('aria-label', tema === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
  boton.title = boton.getAttribute('aria-label');
}

function alternarTema() {
  const nuevo = leerTemaActual() === 'light' ? 'dark' : 'light';
  try { localStorage.setItem(CLAVE_TEMA, nuevo); } catch { /* solo se pierde la preferencia */ }
  aplicarTema(nuevo);
}

function leerTemaActual() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

async function refrescar({ conCatalogo = false } = {}) {
  try {
    if (!store.catalogo || conCatalogo) await store.cargarCatalogo();
    await store.recargar();
  } catch {
    // El aviso de conexión ya lo enseña pintarCabecera().
  }
}

async function iniciar() {
  aplicarTema(leerTema());
  document.getElementById('btn-tema').addEventListener('click', alternarTema);
  document.getElementById('icono-nuevo').innerHTML = iconos.mas(20);
  document.getElementById('btn-ajustes').innerHTML = iconos.ajustes(20);
  document.getElementById('btn-ajustes').addEventListener('click', async () => {
    if (await abrirConfiguracion()) {
      // Cambiaron el nombre del local o las plazas: releer y repintar todo.
      await refrescar({ conCatalogo: true });
      if (store.catalogo) {
        document.getElementById('nombre-local').textContent = store.catalogo.nombreLocal;
        document.title = store.catalogo.nombreLocal;
      }
    }
  });

  store.on(pintarCabecera);
  try {
    await store.cargarCatalogo();
    document.getElementById('nombre-local').textContent = store.catalogo.nombreLocal;
    document.title = store.catalogo.nombreLocal;
    document.getElementById('aviso-demo').hidden = !store.catalogo.demo;
  } catch (err) {
    showToast(err.message, 'error', 8000);
  }

  window.addEventListener('hashchange', montar);
  montar();
  await refrescar();
  setInterval(refrescar, REFRESCO_MS);
}

iniciar();
