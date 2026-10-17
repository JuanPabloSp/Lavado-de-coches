const express = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const ordenes = require('../services/ordenes');
const configuracion = require('../services/configuracion');

const conId = { params: z.object({ id: z.coerce.number().int().positive() }) };
const nombre = z.string().trim().min(1, 'escribe un nombre').max(40);

const siguienteSchema = z.object(conId);
const crearSchema = z.object({ body: z.object({ nombre: nombre.nullish() }).default({}) });
const editarSchema = z.object({
  ...conId,
  body: z.object({ nombre: nombre.optional(), activa: z.boolean().optional() })
    .refine(b => b.nombre !== undefined || b.activa !== undefined, 'no hay nada que cambiar')
});

function crearRouterPlazas(db) {
  const router = express.Router();

  router.post('/', validate(crearSchema), (req, res) => {
    res.status(201).json({ id: configuracion.crearPlaza(db, req.body.nombre || null) });
  });

  router.patch('/:id', validate(editarSchema), (req, res) => {
    configuracion.editarPlaza(db, req.params.id, req.body);
    res.json({ ok: true });
  });

  router.post('/:id/siguiente', validate(siguienteSchema), (req, res) => {
    res.json({ ordenId: ordenes.meterSiguiente(db, req.params.id) });
  });

  return router;
}

module.exports = { crearRouterPlazas };
