const express = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const ordenes = require('../services/ordenes');

const siguienteSchema = z.object({ params: z.object({ id: z.coerce.number().int().positive() }) });

function crearRouterPlazas(db) {
  const router = express.Router();

  router.post('/:id/siguiente', validate(siguienteSchema), (req, res) => {
    res.json({ ordenId: ordenes.meterSiguiente(db, req.params.id) });
  });

  return router;
}

module.exports = { crearRouterPlazas };
