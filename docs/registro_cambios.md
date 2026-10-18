# Registro de cambios — Lavadero

## 1. Primera versión: plazas, vehículos fuera y cobro con la estética del comandero (18/10/2026)

* **Qué es:** un programa local para un lavadero de autos en Paraguay que se usa desde un solo dispositivo. Tiene dos pantallas:
  * **Plazas**: las 2 zonas de trabajo, con el vehículo que se está lavando, el tiempo previsto y las acciones *Terminado*, *Cobrar* y *Devolver a la cola*.
  * **Fuera**: la cola de espera y los vehículos listos para retirar.
* **Nuevo vehículo:** matrícula, modelo, tamaño (auto, SUV o camioneta), servicios con su precio según el tamaño, cliente y notas. Se puede guardar en la cola o guardar y cobrar en el momento.
* **Cobro, al dejar el vehículo o al retirarlo:**
  * Se cobra una sola vez.
  * Para entregar un vehículo tiene que estar pagado.
  * «Cobrar y entregar» hace las dos cosas en una sola transacción.
  * Métodos: efectivo, tarjeta, QR y transferencia.
* **Pantalla de cobro** copiada del modal del TPV del comandero (entrada 115 de su registro):
  * Tres cajas de importe (A cobrar / Entregado / Vuelto o **Faltan**).
  * Billetes en guaraníes que **suman**, teclado siempre visible con tecla `000` y **Exacto**.
  * El modal de **vuelto a devolver**.
  * Cambios respecto al original:
    * Todo va en clases CSS, con variante clara.
    * La cifra se ajusta al ancho real de su caja (unidades `cqi`), porque las cifras en guaraníes son el doble de largas.
    * El aviso de cobro sale después del vuelto, para no tapar la cifra.
* **Errores del comandero evitados desde el diseño:**
  * Importes enteros (`CHECK typeof='integer'`).
  * El estado de la plaza se deriva de las órdenes, con índice único parcial.
  * El precio lo pone siempre el servidor.
  * `nullish()` en los campos opcionales.
  * Solo migraciones (sin `schema.sql`) y la guarda «código más viejo que la BD».
  * Fábricas `abrirBaseDatos` / `createApp`, para que los tests usen BD en memoria.
  * Contador de ventas dentro de la transacción y sin borrado de ventas.
  * El contenedor de avisos se crea bajo demanda y el texto va con `textContent`.
  * `escapeHtml` en todo dato interpolado.
  * Listeners delegados.
  * Solo se sirve `public/`.
  * El servidor escucha solo en `127.0.0.1`.
* **Tests:** 31 en verde (estados, migraciones y flujo completo por API).
* **Verificado en el navegador** (tema oscuro y claro), con una BD de prueba que luego se borró:
  * Alta con validación.
  * Nota con `<img onerror>`, que se muestra como texto.
  * Cobro en efectivo con +50.000 +50.000 +10.000, que da un vuelto de 5.000.
  * Meter en plaza, «meter siguiente», terminado, entregar, y cobrar y entregar con tarjeta.
  * Sin errores en consola.
* **Precios de ejemplo** en `server/db/seed.js`: hay que ajustarlos a la lista real.

## 2. Colores de la pantalla de kiosko del TPV (18/10/2026)

* **Qué cambia:** el tema por defecto pasa a ser el **kiosko** del TPV del comandero (`tpv.html`). Usa estos colores:
  * Fondo gris `#eef0f3`.
  * Tarjetas blancas con borde `#d1d5db`.
  * Textos `#111827` / `#374151` / `#6b7280`.
  * Cabecera en pizarra `#1e293b`, como la barra superior y la lateral del TPV.
  * Acento naranja `#E94D1B`.
* **El cobro sigue en cristal oscuro**, como en el TPV, aunque la pantalla de detrás sea clara. Lo consiguen unos tokens oscuros acotados a `.cobro-card`.
* El tema oscuro se mantiene como alternativa con el botón de la cabecera.
* La preferencia se guarda en una clave nueva (`lavadero_tema`), para que una elección anterior del tema oscuro no tape el nuevo tema por defecto.

## 3. Datos de demostración y autocompletado de marca, modelo y color (18/10/2026)

* **`npm run demo`** (`server/scripts/demo.js`): carga 10 vehículos ficticios con matrículas paraguayas y arranca el servidor con ellos.
  * Los vehículos quedan repartidos así: 2 en plazas, 5 en espera y 3 listos para retirar, unos cobrados y otros no, y con tiempos de espera realistas.
  * Usa `data/demo.db`, que se borra y se vuelve a crear en cada ejecución. **Nunca toca `data/lavadero.db`.**
* **Autocompletado en «Vehículo»** (`components/autocompletarVehiculo.js` + `utils/sugerencias.js`):
  * Propone la marca, luego sus modelos y luego el color.
  * También acierta un modelo sin escribir la marca: «corol» propone Toyota Corolla.
  * No distingue mayúsculas ni tildes.
  * Teclado: ↑/↓ para moverse, Enter o Tab para aceptar, Escape para cerrar. Enter no envía el formulario mientras hay sugerencias abiertas.
  * Elegir el modelo **marca el tamaño** que le corresponde (Frontier → Camioneta). Se puede cambiar a mano.
  * El campo sigue siendo texto libre.
* **Catálogo local** en `public/js/datos/vehiculos.js`: 36 marcas habituales en Paraguay, sus modelos con su tamaño, y colores. Se amplía a mano. Es la base para añadir después los logos.

## 4. Catálogo ampliado a los modelos más comunes en Paraguay (18/10/2026)

* **De 36 a 53 marcas y 512 modelos** en `public/js/datos/vehiculos.js`. Ahora incluye:
  * Los **japoneses usados importados**, muy comunes en el país: Allion, Premio, Vitz, Ractis, Spacio, Runx, Platz, Wish, Noah, AD, Wingroad, Demio, Pajero io, Escudo, Airwave…
  * Más modelos del mercado Mercosur.
  * Las marcas chinas de concesionario: JETOUR, Kaiyi, GAC, MG, BAIC, Maxus, Jinbei…
  * Utilitarios como Kia Bongo, Hyundai Porter, Isuzu NPR o Toyota Dyna.
* Dentro de cada marca, los modelos más frecuentes van primero, para que salgan antes en las sugerencias.
* **Arreglo en las sugerencias:**
  * «Toyota Land Cruiser » ya no salta directo a los colores: primero ofrece Prado, Land Cruiser y 70.
  * «land cruiser p» propone Prado antes que el color plata.
* `public/js/package.json` con `"type": "module"`, como en el comandero, para poder probar el frontend con Node.
* Comprobado con Node: no hay marcas ni modelos duplicados, todos los tamaños son válidos y los casos anteriores dan el resultado esperado.

## 5. Plaza libre: «Meter siguiente» y «Elegir vehículo» (18/10/2026)

* La plaza libre tiene ahora **dos botones**:
  * **Meter siguiente**: entra el primero de la cola, como hasta ahora.
  * **Elegir vehículo**: abre la cola completa, con la posición, la matrícula, el modelo, los servicios con su duración, el importe y el tiempo de espera, y se toca el que entra. Sirve para un cliente con prisa, un lavado corto o un vehículo que ya está delante.
* Componente nuevo `components/elegirVehiculoModal.js`. Por detrás usa la ruta `POST /api/ordenes/:id/iniciar`, que ya existía.
* **Arreglo:** la vista de plazas descartaba las acciones sin orden asociada salvo «siguiente». Ahora reconoce también las de plaza libre.
* Verificado en el navegador: se elige el tercero de la cola para la Plaza 2, entra en ella y los otros dos siguen en espera en su orden.

## 6. Configuración del local, confirmaciones en plaza y paneles en «Fuera» (18/10/2026)

* **Rueda de configuración en la cabecera** (`components/configuracionModal.js`):
  * **Datos del local**: nombre (sale en la cabecera y en el título de la pestaña), razón social, RUC, dirección, ciudad y teléfono. Se guardan en la tabla `config`. El RUC se valida con el formato paraguayo `80012345-6`.
  * **Plazas**: añadir (con nombre automático «Plaza N» si se deja vacío), renombrar y activar o desactivar.
    * No se borran: las órdenes pasadas las siguen nombrando.
    * No se desactiva una plaza con un vehículo dentro, y siempre queda al menos una activa.
    * Las desactivadas no salen en la pantalla de plazas.
  * API: `GET /api/configuracion`, `PUT /api/configuracion/local`, `POST /api/plazas`, `PATCH /api/plazas/:id`. Lógica en `services/configuracion.js`.
  * ⚠️ De momento cualquiera puede abrirla: hay que protegerla con el login por PIN cuando exista.
* **Confirmación en las plazas** antes de «Terminado» y de «Devolver a la cola», para evitar toques sin querer.
* **«Fuera» con paneles**: «En espera» y «Listos para retirar» van cada uno sobre un fondo propio con bordes redondeados (`--color-bg-panel`), y el de listos lleva el borde superior verde.
* `npm run demo` explica qué pasa si `data/demo.db` está bloqueada por otro servidor abierto, en vez de fallar con un error críptico.
* **Tests:** 6 nuevos en `tests/api/configuracion.test.js`; 37 en total en verde.
* Verificado en el navegador:
  * Añadir «Box techado».
  * Rechazo del RUC sin dígito verificador.
  * Nombre del local en la cabecera.
  * Tres plazas en pantalla.
  * Las dos confirmaciones.

## 7. Icono de auto con el color del estado de la plaza (18/10/2026)

* El chip de estado de cada plaza lleva un **icono de auto** (`iconos.auto`) que toma el color del estado:
  * **Verde**: libre.
  * **Ámbar**: lavando, dentro del tiempo previsto.
  * **Rojo**: lavando y **pasado del tiempo previsto**. El chip dice «Lavando · pasado de tiempo» y el borde superior de la tarjeta se pone rojo, igual que la barra de progreso.
* Verificado en el navegador con un lavado forzado a 31 min de 20 previstos en la BD de demostración.
* **Cambio posterior:** el icono pasa a ser un **auto de frente relleno** (silueta con parabrisas y faros calados), dibujado para el proyecto a partir de una referencia de Juan. Va a 18 px en el chip.

## 8. Logos de las marcas (18/10/2026)

* **50 logos** en `public/img/marcas/` (424 KB): son las miniaturas de [car-logos-dataset](https://github.com/filippofilip95/car-logos-dataset), solo de las marcas del catálogo.
  * Se sirven en local, sin depender de internet.
  * La licencia MIT cubre la recopilación; **cada logo es propiedad de su marca**.
* **Sin logo en el dataset:** Kaiyi, DFSK y Jinbei. Muestran su inicial en un círculo.
* `LOGOS` en `datos/vehiculos.js` relaciona cada marca con su archivo. GAC y BAIC figuran en el dataset como `gac-group` y `baic-motor`.
* `utils/marcas.js`:
  * `detectarMarca()` reconoce la marca al principio del texto libre del vehículo («Toyota Hilux blanca» → Toyota), sin distinguir mayúsculas ni tildes y probando primero los nombres más largos («Land Rover»).
  * `logoVehiculo()` devuelve el HTML del logo, o nada si la marca no se reconoce.
* **El logo aparece en:**
  * Las sugerencias al escribir.
  * Las tarjetas de las plazas, junto a la matrícula.
  * Las listas de «Fuera».
  * «Elegir vehículo».
  * El panel del cobro.
* Los logos van sobre una pastilla blanca para que se lean también en tema oscuro.
* Verificado en el navegador: las 8 marcas de los datos de demostración cargan su imagen, y las sugerencias muestran el logo.

## 9. «Volver a lavar»: deshacer un «Terminado» pulsado sin querer (18/10/2026)

* Botón **«Volver a lavar»** en cada vehículo de «Listos para retirar», con confirmación. La confirmación dice dónde va a ir el vehículo:
  * **Si su plaza sigue libre**, vuelve a ella como «Lavando», **con el cronómetro que llevaba** (conserva `inicio_at` y borra `fin_at`).
  * **Si la plaza ya la ocupa otro**, vuelve a la cola de espera en su turno de llegada.
* Si ya estaba cobrado, conserva su cobro.
* Servidor:
  * `POST /api/ordenes/:id/reactivar`, con la lógica en `reactivarOrden()`.
  * En `domain/estados.js`, «listo» puede volver a «lavando» o a «en espera».
  * Para que esa apertura no se cuele por otras rutas, `/iniciar` solo acepta órdenes en espera y `/devolver` solo órdenes lavando.
* **Tests:** 4 nuevos (vuelve a su plaza, plaza ocupada → cola, solo desde listo y sin colarse por `/iniciar` ni `/devolver`, conserva el cobro); 41 en total en verde.
* **Cambio posterior:** el botón y la confirmación pasan a decir **«Volver a activar»**.

## 10. Servicios de detailing (18/10/2026)

* **12 servicios de detailing** habituales en Paraguay, con precio por tamaño (auto / SUV / camioneta). Son: limpieza interior completa, lavado de tapizados con extracción, hidratación de cuero, revividor de plásticos, sanitizado con ozono, pulido de faros (par), descontaminado de pintura, pulido de carrocería, corrección de pintura en 2 pasos, sellado acrílico, tratamiento cerámico y lavado de chasis.
* ⚠️ **Precios de EJEMPLO.** No hay listas de precios publicadas por lavaderos paraguayos. Los de referencia salen de anuncios sueltos en redes (pulido de faros 100.000–150.000 Gs el par, limpieza interior completa ~140.000 Gs) y el resto es una estimación proporcional. **Hay que ajustarlos a la lista real del local.**
* **Migración 2:** columna `servicios.categoria` (`lavado` | `detailing`). Los servicios que ya existían quedan como `lavado`.
* `sembrarDetailing()` añade los servicios **una sola vez por base de datos**, también en instalaciones ya existentes, y lo marca en `config.detailing_sembrado`. Si luego el dueño desactiva uno, no vuelve a aparecer.
* En «Nuevo vehículo» los servicios salen agrupados en **Lavado** y **Detailing**.
* **Tests:** 2 nuevos (el detailing se siembra una sola vez, y una BD en versión 1 con datos migra y recibe el detailing); 43 en total en verde.
