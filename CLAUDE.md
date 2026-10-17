# CLAUDE.md

# Lavadero — gestión de un lavadero de autos (Paraguay)

Programa local para un lavadero con **un solo dispositivo**: plazas de trabajo, vehículos fuera (en espera y listos para retirar) y cobro. Nace copiando de forma selectiva el comandero (`../comandero`) y evitando sus errores conocidos.

> Verificar siempre contra el código: este archivo recoge principios, no contratos exhaustivos.

## Comandos

```bash
npm start          # servidor en http://localhost:3100 (BD en data/lavadero.db)
npm test           # unitarios + API con supertest, BD en memoria
```

Sin paso de build. El frontend se sirve desde `public/`.

## Stack y estructura

- **Backend**: Express + better-sqlite3 + zod + helmet (Node `>=20 <23`).
  - `server/app.js` → `createApp(db)`; `server/index.js` solo arranca.
  - `server/db/` → `abrirBaseDatos(ruta)`, migraciones (`PRAGMA user_version`), seed idempotente.
  - `server/domain/estados.js` → ciclo de vida de la orden (funciones puras).
  - `server/services/` → toda la lógica de negocio; las rutas (`server/routes/`) solo validan y llaman.
- **Frontend**: vanilla JS con ES modules, router por hash (`public/js/app.js`), `store.js` relee `/api/estado` tras cada acción y cada 20 s.
- **Estética**: tokens copiados del comandero (`public/css/variables.css`), tema oscuro por defecto + claro. La pantalla de cobro (`public/js/components/cobroModal.js` + `public/css/cobro.css`) es el modal de cobro del TPV del comandero adaptado a guaraníes.

## Reglas que no se rompen

- **Guaraníes ENTEROS** en BD, API y cálculos (`CHECK(typeof(x)='integer')`). Nunca `REAL`, nunca decimales.
- **El precio lo calcula el servidor** desde la BD; el cliente solo manda ids.
- **El estado de una plaza se deriva** de `ordenes` (`estado='lavando'`), no se guarda.
- **Cambios de esquema = migración nueva al final** de `server/db/migrations.js`. Nunca editar una ya aplicada. Si la BD es más nueva que el código, el servidor no arranca (a propósito).
- **Las ventas no se borran.** Anular un cobro será un registro aparte con rastro (pendiente).
- **Numeraciones con `siguienteContador(db, …)` dentro de la transacción** que consume el número.
- **Todo dato de usuario interpolado en HTML pasa por `escapeHtml()`.** Los avisos usan `textContent`.
- **Nada de colores escritos en el JS**: clases y tokens CSS.
- **Toda vista devuelve su cleanup** y usa un único listener delegado en el contenedor.
- Campos opcionales en zod: `.nullish()` (un `null` no debe tumbar la petición).
- Los tests usan `abrirBaseDatos(':memory:')`; nunca la BD real.

## Pendiente

- Login por PIN y empleados (tabla `empleados` ya creada).
- Cierre de caja, anulación de cobros con rastro, gestión del catálogo desde la UI.
- Facturación electrónica SIFEN (hoy la factura se hace aparte en e-Kuatia'i).
- Impresora térmica y copias de seguridad (reutilizar los servicios del comandero).

## Flujo de trabajo

- Documentar cambios en `docs/registro_cambios.md` (formato numerado).
