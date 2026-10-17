const path = require('path');
const express = require('express');
const helmet = require('helmet');
const { leerEstado, leerCatalogo } = require('./services/consultas');
const { crearRouterOrdenes } = require('./routes/ordenes');
const { crearRouterPlazas } = require('./routes/plazas');
const { crearRouterConfiguracion } = require('./routes/configuracion');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

/**
 * Construye la app sobre una BD ya abierta. Separada de index.js para que los
 * tests la monten con una BD en memoria, sin abrir puerto.
 */
function createApp(db) {
  const app = express();
  app.disable('x-powered-by');

  // Sin upgrade-insecure-requests: el servidor es http local y esa directiva
  // haría que el navegador pidiera los recursos por https.
  app.use(helmet({ contentSecurityPolicy: { directives: { 'upgrade-insecure-requests': null } } }));
  app.use(express.json({ limit: '50kb' }));

  app.get('/api/estado', (req, res) => res.json(leerEstado(db)));
  app.get('/api/catalogo', (req, res) => res.json(leerCatalogo(db)));
  app.use('/api/ordenes', crearRouterOrdenes(db));
  app.use('/api/plazas', crearRouterPlazas(db));
  app.use('/api/configuracion', crearRouterConfiguracion(db));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

  // Solo se sirve public/: server/, data/ y .env no son alcanzables. El
  // comandero servía la raíz y necesitaba una lista de bloqueo para eso.
  // no-cache = revalidar siempre, para que una actualización se vea al recargar
  // (en el comandero hubo terminales que seguían con código viejo, entrada 112).
  app.use(express.static(PUBLIC_DIR, { setHeaders: res => res.setHeader('Cache-Control', 'no-cache') }));

  // Manejador de errores: los de negocio (con .status) devuelven su mensaje; el
  // resto, 500 genérico sin detalles internos.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'La petición no es un JSON válido.' });
    }
    if (err.status && err.status < 500) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('[Servidor] Error inesperado:', err);
    res.status(500).json({ error: 'Error interno del servidor. Inténtalo de nuevo.' });
  });

  return app;
}

module.exports = { createApp };
