const express = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const ordenes = require('../services/ordenes');

const id = z.coerce.number().int().positive();
const conId = { params: z.object({ id }) };

// Texto opcional: acepta ausente, null o cadena, y siempre entrega una cadena
// recortada. En el comandero un `null` en un campo opcional hacía rechazar el
// pedido entero (registro, entrada 63).
const textoOpcional = (max) => z.string().max(max).nullish().transform(v => (v ?? '').trim());

const crearSchema = z.object({
  body: z.object({
    matricula: z.string().trim().min(1, 'escribe la matrícula').max(20),
    vehiculo: textoOpcional(80),
    tamanoId: z.string().min(1),
    servicioIds: z.array(id).min(1, 'elige al menos un servicio').max(20),
    clienteNombre: textoOpcional(80),
    clienteTelefono: textoOpcional(30),
    notas: textoOpcional(300)
  })
});

const iniciarSchema = z.object({ ...conId, body: z.object({ plazaId: id }) });
const cancelarSchema = z.object({ ...conId, body: z.object({ motivo: textoOpcional(200) }).default({}) });
const soloIdSchema = z.object(conId);

const cobrarSchema = z.object({
  ...conId,
  body: z.object({
    metodoPago: z.enum(['efectivo', 'tarjeta', 'qr', 'transferencia']),
    // Guaraníes enteros: no hay céntimos.
    importeRecibido: z.number().int().nonnegative().nullish(),
    clienteRuc: textoOpcional(20),
    clienteNombre: textoOpcional(80),
    entregar: z.boolean().nullish().transform(v => !!v)
  })
});

function crearRouterOrdenes(db) {
  const router = express.Router();

  router.post('/', validate(crearSchema), (req, res) => {
    res.status(201).json({ id: ordenes.crearOrden(db, req.body) });
  });

  router.post('/:id/iniciar', validate(iniciarSchema), (req, res) => {
    ordenes.iniciarLavado(db, req.params.id, req.body.plazaId);
    res.json({ ok: true });
  });

  router.post('/:id/terminar', validate(soloIdSchema), (req, res) => {
    ordenes.terminarLavado(db, req.params.id);
    res.json({ ok: true });
  });

  router.post('/:id/devolver', validate(soloIdSchema), (req, res) => {
    ordenes.devolverAEspera(db, req.params.id);
    res.json({ ok: true });
  });

  router.post('/:id/reactivar', validate(soloIdSchema), (req, res) => {
    res.json(ordenes.reactivarOrden(db, req.params.id));
  });

  router.post('/:id/cancelar', validate(cancelarSchema), (req, res) => {
    ordenes.cancelarOrden(db, req.params.id, req.body.motivo);
    res.json({ ok: true });
  });

  router.post('/:id/entregar', validate(soloIdSchema), (req, res) => {
    ordenes.entregarOrden(db, req.params.id);
    res.json({ ok: true });
  });

  router.post('/:id/cobrar', validate(cobrarSchema), (req, res) => {
    res.status(201).json(ordenes.cobrarOrden(db, req.params.id, req.body));
  });

  return router;
}

module.exports = { crearRouterOrdenes };
