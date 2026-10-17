const { ZodError } = require('zod');

/**
 * Middleware de validación con Zod (adaptado del comandero).
 *
 * Diferencia: solo reasigna las partes que el esquema declara. El original
 * asignaba `req.query = parsed.query` aunque el esquema no tuviera `query`,
 * dejándola en undefined.
 *
 * @param {import('zod').AnyZodObject} schema con claves body / query / params
 */
const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
    for (const parte of ['body', 'query', 'params']) {
      if (parsed[parte] !== undefined) req[parte] = parsed[parte];
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const primero = error.errors[0];
      const campo = primero?.path.slice(1).join('.') || 'petición';
      return res.status(400).json({
        error: `Dato no válido en "${campo}": ${primero?.message || 'revisa los datos'}.`,
        details: error.errors
      });
    }
    next(error);
  }
};

module.exports = { validate };
