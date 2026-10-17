const express = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const configuracion = require('../services/configuracion');

const texto = (max) => z.string().max(max).nullish().transform(v => (v ?? '').trim());

const localSchema = z.object({
  body: z.object({
    nombreLocal: z.string().trim().min(1, 'el nombre del local no puede quedar vacío').max(60),
    razonSocial: texto(100),
    // RUC paraguayo: número, guion y dígito verificador (80012345-6). Opcional.
    ruc: texto(20).refine(v => v === '' || /^\d{1,9}-\d$/.test(v), 'el RUC va con guion y dígito verificador, por ejemplo 80012345-6'),
    direccion: texto(150),
    ciudad: texto(60),
    telefono: texto(30)
  })
});

function crearRouterConfiguracion(db) {
  const router = express.Router();

  router.get('/', (req, res) => res.json(configuracion.leerConfiguracion(db)));

  router.put('/local', validate(localSchema), (req, res) => {
    configuracion.guardarDatosLocal(db, req.body);
    res.json(configuracion.leerConfiguracion(db));
  });

  return router;
}

module.exports = { crearRouterConfiguracion };
