# ShipNow API

API REST con Node.js, Express y MongoDB para gestionar usuarios, productos, pedidos y entregas, organizada en arquitectura de capas.

## Cómo correr el proyecto

1. Clonar el repositorio y entrar a la carpeta.
2. Instalar las dependencias:

   ```bash
   npm install
   ```

3. Crear un archivo `.env` a partir de `.env.example` y completar `PORT`, `MONGODB_URI` y `NODE_ENV`.
4. Iniciar en modo desarrollo:

   ```bash
   npm run dev
   ```

Si falta una variable obligatoria, la aplicación muestra cuál es y no arranca.

## Arquitectura

El flujo es `Router → Controller → Service → Repository → Model`.

- **Controller:** recibe la petición HTTP y devuelve la respuesta con su status code.
- **Service:** contiene las reglas de negocio.
- **Repository:** es la única capa que usa Mongoose para acceder a MongoDB.

Los roles, estados y prioridades están definidos en `src/constants/index.js`.

## Mocking y datos de prueba

El módulo de mocking usa [Faker](https://fakerjs.dev/) para generar datos simulados con la misma estructura que los modelos reales. Todos los endpoints aceptan `qty`, un número entero entre 1 y 100. Si no se envía, se generan 5 registros.

### Datos que se pueden generar

| Entidad | Datos | Reglas |
|---|---|---|
| Usuarios | `name`, `email`, `role` | Rol `USER` (cliente) o `DRIVER` (repartidor) |
| Repartidores | Usuarios con rol `DRIVER` | No son una colección aparte |
| Pedidos | `user`, `address`, `total`, `status`, `priority` | Pertenecen a un usuario con rol `USER` |
| Entregas | `order`, `driver`, `status`, `deliveredAt` | Pertenecen a un pedido y solo tienen repartidor si están asignadas, en camino o entregadas |

El estado de cada entrega depende del estado de su pedido:

| Pedido | Entrega | ¿Tiene repartidor? |
|---|---|---|
| `PENDING` | `PENDING_ASSIGNMENT` | No |
| `PREPARING` | `ASSIGNED` | Sí |
| `SHIPPED` | `IN_TRANSIT` | Sí |
| `DELIVERED` | `DELIVERED` | Sí |
| `CANCELLED` | `CANCELLED` | No |

### Endpoints que no guardan datos

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/api/mocks/users?qty=2` | Usuarios con rol `USER` o `DRIVER` |
| GET | `/api/mocks/drivers?qty=2` | Repartidores |
| GET | `/api/mocks/dataset?qty=4` | Usuarios, pedidos y entregas relacionados entre sí |

Ejemplo de `GET /api/mocks/users?qty=2`:

```json
[
  { "_id": "6af3...", "name": "Ana Pérez", "email": "ana.perez.x7k2p@test.com", "role": "USER" },
  { "_id": "6af3...", "name": "Luis Gómez", "email": "luis.gomez.9qw3e@test.com", "role": "DRIVER" }
]
```

Las claves están en inglés porque coinciden con los campos de los modelos reales.

### Carga de datos de prueba en MongoDB

| Método | Ruta | Inserta |
|---|---|---|
| POST | `/api/mocks/seed?qty=10` | Usuarios en la colección `users` |
| POST | `/api/mocks/seed/dataset?qty=6` | Usuarios, pedidos y entregas relacionados |

Ejemplos de respuesta:

```json
{ "insertados": 10, "coleccion": "users" }
```

```json
{ "insertados": { "users": 5, "orders": 6, "deliveries": 6 } }
```

En `seed/dataset`, `qty` es la cantidad de pedidos. Se generan además `qty / 2` clientes y `qty / 3` repartidores, redondeando hacia arriba, y una entrega por pedido.

La carga está controlada:

- `qty` tiene que estar entre 1 y 100. Si no, la API responde `400`.
- No se permite cuando `NODE_ENV=production`. En ese caso, la API responde `403`.
- Todos los usuarios cargados tienen la contraseña `mock1234`, guardada encriptada.

### Cómo probarlo en PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/mocks/users?qty=2"
Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/mocks/seed?qty=10"
Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/mocks/seed/dataset?qty=6"
```

## Otros endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Verifica que el servidor esté activo |
| GET, POST | `/api/products` | Lista productos disponibles o crea uno |
| GET, PUT, DELETE | `/api/products/:id` | Obtiene, actualiza o elimina un producto |
| GET, POST | `/api/users` | Lista usuarios o crea uno |
| GET, PUT, DELETE | `/api/users/:id` | Obtiene, actualiza o elimina un usuario |
| GET, POST | `/api/orders` | Lista pedidos o crea uno |
| GET | `/api/orders/:id` | Obtiene un pedido |
| PATCH | `/api/orders/:id/status` | Cambia el estado de un pedido |
| GET | `/api/deliveries` | Lista entregas |
| GET | `/api/deliveries/:id` | Obtiene una entrega |
| PATCH | `/api/deliveries/:id/status` | Cambia el estado de una entrega o le asigna un repartidor |
| POST | `/api/users/:id/documents` | Sube un documento de un usuario (multipart/form-data) |
| POST | `/api/deliveries/:id/receipts` | Sube un comprobante de una entrega (multipart/form-data) |
| GET | `/api/loggerTest` | Genera un log de prueba en cada nivel |
| GET | `/api/docs` | Documentación interactiva con Swagger |

Para crear un pedido se envía `user` (id de un usuario con rol `USER`), `address`, `items` (cada uno con `description`, `quantity` y `unitPrice`) y, opcionalmente, `priority` (`LOW`, `MEDIUM` o `HIGH`). El total lo calcula la API a partir de los items. Todo pedido nuevo empieza con estado `PENDING` y crea su entrega en estado `PENDING_ASSIGNMENT`, sin repartidor.

Los cambios de estado permitidos son:

- **Pedidos:** `PENDING` → `PREPARING` o `CANCELLED`; `PREPARING` → `SHIPPED` o `CANCELLED`; `SHIPPED` → `DELIVERED`.
- **Entregas:** `PENDING_ASSIGNMENT` → `ASSIGNED` o `CANCELLED`; `ASSIGNED` → `IN_TRANSIT` o `CANCELLED`; `IN_TRANSIT` → `DELIVERED`. Para pasar a `ASSIGNED` hay que enviar `driver`, el id de un usuario con rol `DRIVER`.

## Por qué separé Service y Repository

El Service decide qué debe pasar y el Repository resuelve cómo buscarlo o guardarlo.

- **En el Service:** listar solo productos disponibles, calcular estados, encriptar contraseñas, generar los datos de prueba, mantener las relaciones entre entidades y validar cuántos registros se pueden cargar.
- **En el Repository:** consultar e insertar datos, definir qué campos se devuelven y generar los ids de MongoDB.

Así, si cambia la forma de acceder a los datos, las reglas de negocio no deberían cambiar.

## Manejo de errores

Los errores se manejan en una capa centralizada:

- `src/errors/error-dictionary.js`: diccionario con todos los errores posibles, cada uno con su código, status HTTP y mensaje.
- `src/errors/custom-errors.js`: errores personalizados del dominio, como `UserNotFoundError` o `NegativeMockQuantityError`.
- `src/middlewares/error.middleware.js`: middleware global y único lugar que responde errores al cliente.

Los services detectan los errores y los lanzan. Los controllers y las rutas no arman respuestas de error. Los errores de Mongoose y de JSON inválido también se traducen al formato común.

### Estructura de la respuesta

```json
{
  "status": "error",
  "statusCode": 400,
  "code": "NEGATIVE_MOCK_QTY",
  "message": "La cantidad de datos a generar no puede ser negativa",
  "details": { "received": -3 },
  "path": "/api/mocks/users?qty=-3",
  "timestamp": "2026-11-10T21:51:40.814Z"
}
```

- `code`: identificador fijo del error, para que el cliente pueda reconocerlo.
- `details`: información extra sobre el error, o `null` si no hay.

### Errores disponibles

| Código | Status | Cuándo ocurre |
|---|---|---|
| `INVALID_ID` | 400 | El id no tiene formato válido |
| `INVALID_JSON` | 400 | El cuerpo de la petición no es un JSON válido |
| `VALIDATION_ERROR` | 400 | Faltan datos o no cumplen las reglas del modelo |
| `INVALID_PASSWORD` | 400 | La contraseña tiene menos de 8 caracteres |
| `INVALID_ORDER_USER` | 400 | Se intenta crear un pedido para un usuario que no tiene rol `USER` |
| `INVALID_ORDER_ITEMS` | 400 | El pedido no tiene items |
| `INVALID_ORDER_STATUS` | 400 | El estado del pedido no existe o no se puede aplicar desde el estado actual |
| `INVALID_DELIVERY_STATUS` | 400 | El estado de la entrega no existe o no se puede aplicar desde el estado actual |
| `INVALID_DELIVERY_DRIVER` | 400 | Se asigna una entrega sin un usuario con rol `DRIVER` |
| `INVALID_PRODUCT_STATUS` | 400 | Se envía `status` en un producto, aunque se calcula según el stock |
| `INVALID_MOCK_QTY` | 400 | `qty` no es un entero entre 1 y 100 |
| `NEGATIVE_MOCK_QTY` | 400 | `qty` es negativo |
| `MOCK_SEED_FORBIDDEN` | 403 | Se intenta cargar datos con `NODE_ENV=production` |
| `USER_NOT_FOUND` | 404 | No existe el usuario |
| `PRODUCT_NOT_FOUND` | 404 | No existe el producto |
| `ORDER_NOT_FOUND` | 404 | No existe el pedido |
| `DELIVERY_NOT_FOUND` | 404 | No existe la entrega |
| `ROUTE_NOT_FOUND` | 404 | La ruta no existe |
| `DUPLICATE_KEY` | 409 | Ya existe un registro con ese dato único, como el email |
| `FILE_REQUIRED` | 400 | No se envió el archivo |
| `INVALID_FILE_FIELD` | 400 | El archivo vino en un campo distinto de `file` |
| `INVALID_FILE_TYPE` | 400 | El archivo no es PDF, JPG ni PNG, o la extensión no coincide con el tipo |
| `INVALID_DOCUMENT_TYPE` | 400 | El tipo de documento no existe o no corresponde al rol del usuario |
| `FILE_UPLOAD_ERROR` | 400 | El formulario multipart está mal armado |
| `FILE_TOO_LARGE` | 413 | El archivo supera los 5 MB |
| `FILE_SAVE_ERROR` | 500 | No se pudo guardar el archivo en el servidor |
| `MOCK_SEED_FAILED` | 500 | MongoDB falló durante la carga de datos de prueba |
| `INTERNAL_ERROR` | 500 | Error inesperado |

Si la carga de datos de prueba falla a mitad de camino, se borran los registros que se llegaron a guardar, para no dejar datos incompletos.

### Cómo probar los casos inválidos

Con el servidor corriendo, abrir en el navegador:

- `http://localhost:8080/api/mocks/users?qty=-3` → `NEGATIVE_MOCK_QTY`
- `http://localhost:8080/api/mocks/users?qty=abc` → `INVALID_MOCK_QTY`
- `http://localhost:8080/api/mocks/users?qty=500` → `INVALID_MOCK_QTY`
- `http://localhost:8080/api/users/123` → `INVALID_ID`
- `http://localhost:8080/api/users/6af38d8e956809dfdcdde832` → `USER_NOT_FOUND`
- `http://localhost:8080/api/nada` → `ROUTE_NOT_FOUND`

Para probar un POST desde PowerShell:

```powershell
curl.exe -X POST "http://localhost:8080/api/mocks/seed?qty=-1"
```

## Logging

La API usa [Winston](https://github.com/winstonjs/winston) como logger centralizado, con rotación de archivos mediante `winston-daily-rotate-file`. La configuración está en `src/config/logger.config.js` y el resto de los archivos importa el mismo `logger`.

Cada línea tiene fecha y hora, nivel y mensaje:

```text
2026-11-12 12:33:13 [info]    Servidor ShipNow escuchando en el puerto 8080 (development)
2026-11-12 12:33:13 [info]    Conexión a MongoDB establecida
2026-11-12 12:33:13 [warning] ORDER_NOT_FOUND en GET /api/orders/6af3...: Pedido no encontrado {"id":"6af3..."}
2026-11-12 12:33:13 [error]   INTERNAL_ERROR en GET /api/products: Error interno del servidor
```

### Niveles

Ordenados del más grave al menos grave:

| Nivel | Uso en ShipNow |
|---|---|
| `fatal` | Fallas que impiden arrancar: faltan variables de entorno o no se puede conectar a MongoDB |
| `error` | Errores inesperados del servidor y fallas al cargar datos de prueba |
| `warning` | Errores esperados del negocio: datos inválidos, registros inexistentes, rutas que no existen |
| `info` | Servidor iniciado, conexión a MongoDB, pedidos creados, mocks generados e insertados |
| `http` | Cada petición: método, ruta, status y duración |
| `debug` | Detalles útiles solo para desarrollo |

### Comportamiento según el entorno

El entorno se toma de `NODE_ENV`, definida en el `.env`.

| | `development` | `production` |
|---|---|---|
| Consola | Desde `debug`, con colores | Desde `info`, sin colores |
| `combined-AAAA-MM-DD.log` | Desde `debug` | Desde `info` |
| `error-AAAA-MM-DD.log` | Solo `error` y `fatal` | Solo `error` y `fatal` |

### Archivos de logs y rotación

Los archivos se crean automáticamente en la carpeta `logs/`, en la raíz del proyecto:

- `logs/error-AAAA-MM-DD.log`: solo `error` y `fatal`, incluidos los errores que no se atraparon en ningún otro lado.
- `logs/combined-AAAA-MM-DD.log`: todos los logs desde el nivel mínimo del entorno.

Se crea un archivo nuevo por día, o antes si un archivo supera los 10 MB, y se conservan los últimos 14 días. Los más viejos se borran solos.

La carpeta `logs/` está en `.gitignore`, junto con `.env` y `node_modules/`, así que ningún log generado se sube al repositorio.

### Cómo probar el logger

Con el servidor corriendo, abrir en el navegador:

```text
http://localhost:8080/api/loggerTest
```

El endpoint genera un log en cada nivel y responde cuáles se ven según el entorno. Después de probarlo:

- En la consola aparecen los 6 niveles en `development`, o desde `info` en `production`.
- En `logs/error-AAAA-MM-DD.log` aparecen solo los de `error` y `fatal`.
- En `logs/combined-AAAA-MM-DD.log` aparecen todos los que se ven en consola.

Este endpoint es una herramienta interna para revisar la configuración y no forma parte del negocio.

Para ver un `fatal` real, borrar `MONGODB_URI` del `.env` y correr `npm run dev`: el servidor no arranca y el motivo queda en consola y en el archivo de errores.

## Documentación con Swagger

La API está documentada con OpenAPI 3 y se puede consultar y probar desde Swagger UI.

### Cómo abrirla

1. Levantar el servidor con `npm run dev`.
2. Abrir en el navegador:

   ```text
   http://localhost:8080/api/docs
   ```

Cada endpoint tiene el botón **Try it out**, que permite completar los parámetros y el body y ejecutar la petición contra el servidor local.

### Módulos documentados

| Tag | Endpoints |
|---|---|
| Users | Listar, obtener, crear, actualizar y eliminar usuarios |
| Orders | Listar, obtener y crear pedidos, y cambiar su estado |
| Deliveries | Listar y obtener entregas, cambiar su estado y asignar repartidor |
| Mocks | Generar usuarios, repartidores y pedidos simulados, e insertar datos de prueba |
| Logger | Endpoint de prueba del logger. Es una herramienta de validación, no una funcionalidad del negocio |
| Products | Listar, obtener, crear, actualizar y eliminar productos |

Cada endpoint indica método, ruta, descripción, parámetros, body esperado, respuesta exitosa y posibles errores, con un ejemplo de cada código de error.

### Organización de los archivos

La configuración de Swagger está separada de las rutas:

- `src/config/swagger.config.js`: monta Swagger UI en `/api/docs`.
- `src/docs/openapi.js`: información general, servidor, tags y unión de todos los paths.
- `src/docs/components/schemas.js`: schemas reutilizables, como `User`, `Order`, `OrderItem`, `Delivery`, `SuccessResponse` y `ErrorResponse`.
- `src/docs/components/parameters.js`: parámetros reutilizables, como `id` y `qty`.
- `src/docs/paths/`: un archivo por módulo con sus endpoints.
- `src/docs/helpers.js`: funciones para armar respuestas. Los ejemplos de error se generan a partir del diccionario real de errores (`src/errors/error-dictionary.js`), así la documentación coincide con lo que responde la API.

### Aclaraciones para probar

- **La API no tiene autenticación:** todos los endpoints se pueden probar directamente.
- **Para tener datos con qué probar,** primero ejecutar `POST /api/mocks/seed/dataset` y después copiar los ids de `GET /api/users`, `GET /api/orders` o `GET /api/deliveries`.
- **Los endpoints de carga de mocks no llevan body:** la cantidad se envía en el parámetro `qty`. Con `NODE_ENV=production` responden `403`.
- **Para asignar un repartidor,** usar `PATCH /api/deliveries/{id}/status` con `status: ASSIGNED` y el id de un usuario con rol `DRIVER`.
- **Cualquier ruta que no exista** responde `404 ROUTE_NOT_FOUND` con el formato de error común.

## Testing

La API tiene una suite de tests funcionales que prueba los endpoints como lo haría un cliente: hace peticiones HTTP y valida el status, la estructura del body y sus propiedades importantes.

### Herramientas

| Herramienta | Para qué se usa |
|---|---|
| [Mocha](https://mochajs.org/) | Organiza y ejecuta los tests (`describe`, `it` y hooks como `beforeEach`) |
| [Chai](https://www.chaijs.com/) | Valida los resultados con `expect` |
| [Supertest](https://github.com/ladjs/supertest) | Hace peticiones HTTP a la app sin levantar el servidor |
| [cross-env](https://github.com/kentcdodds/cross-env) | Define `NODE_ENV=test` de la misma forma en Windows, Mac y Linux |

La app de Express (`src/app.js`) está separada del arranque del servidor (`src/server.js`), así los tests la importan directamente sin abrir un puerto.

### Base de datos y variables de entorno

Los tests **necesitan una base de datos de testing separada**, porque crean y borran datos.

1. Crear un archivo `.env.test` en la raíz, a partir de `.env.test.example`:

   ```text
   PORT=8081
   MONGODB_URI=mongodb+srv://USUARIO:CONTRASEÑA@cluster0.xxxxx.mongodb.net/shipnow-test?appName=Cluster0
   NODE_ENV=test
   ```

2. El nombre de la base **tiene que terminar en `-test`**. Si no, los tests no arrancan, para evitar borrar datos reales.

| Variable | Valor en testing |
|---|---|
| `PORT` | Cualquier puerto. Los tests no abren el servidor, pero la variable es obligatoria |
| `MONGODB_URI` | URI de una base que termine en `-test`, por ejemplo `shipnow-test` |
| `NODE_ENV` | `test` |

`.env.test` está en `.gitignore`, igual que `.env`.

Con `NODE_ENV=test`:

- La configuración carga `.env.test` en lugar de `.env`.
- El logger no escribe en la consola, para que se lea el resultado de Mocha. Los archivos de `logs/` se siguen escribiendo.

### Cómo ejecutar los tests

```bash
npm test
```

La configuración de Mocha está en `.mocharc.json`: busca los archivos `tests/**/*.test.js` y carga primero `tests/setup.js`.

### Organización

```text
tests/
├── setup.js            # Conecta a la base de testing y la limpia al empezar y al terminar
├── helpers.js          # Datos de prueba, limpieza y validación del formato de error
├── users.test.js
├── orders.test.js
├── deliveries.test.js
├── mocks.test.js
├── logger.test.js
├── uploads.test.js     # Carga de documentos y comprobantes
├── docs.test.js        # Swagger y coherencia entre la documentación y la API
└── general.test.js     # Health check y ruta inexistente
```

### Módulos cubiertos

| Módulo | Casos de éxito | Casos de error |
|---|---|---|
| Users | Listar (vacío y con datos), crear, obtener por id | Datos incompletos, contraseña inválida, email repetido, usuario inexistente, id inválido |
| Orders | Listar, crear con total calculado y su entrega, obtener por id, cambiar estado | Sin items, sin dirección, usuario repartidor o inexistente, JSON inválido, pedido inexistente, id inválido, estado inválido o no permitido |
| Deliveries | Listar, obtener por id, asignar repartidor, llegar a `DELIVERED` | Asignar sin repartidor o con un cliente, estado no permitido, entrega inexistente, id inválido |
| Mocks | Generar usuarios, repartidores y pedidos relacionados; insertar usuarios y datasets | Cantidad negativa, no numérica, decimal, cero o mayor a 100, sin guardar nada |
| Logger | Genera los 6 niveles y responde la estructura esperada | Método no permitido |
| Swagger | La página carga y contiene la documentación de ShipNow | Ruta inexistente |
| Archivos | Subir documentos (incluida la licencia de un repartidor), acumularlos en el usuario, subir comprobantes de una entrega | Falta el archivo, tipo de documento inválido o no permitido para el rol, tipo de archivo no permitido, extensión falsa, tamaño superado, campo incorrecto, usuario o entrega inexistente, id inválido |

Los errores se validan con el formato del módulo de errores: status HTTP, `code` y `message` del diccionario, `details`, `path` y `timestamp`.

**Coherencia con Swagger:** `docs.test.js` recorre todos los endpoints documentados en `src/docs/openapi.js`, comprueba que existen y que responden con alguno de los status documentados.

### Datos de prueba y limpieza

- **Los datos se crean dentro de cada test,** con los helpers (`createClient`, `createDriver`, `createOrder`) o con los endpoints de mocks. No se usan datos cargados a mano.
- **Antes de cada test** (`beforeEach`), se borran usuarios, productos, pedidos y entregas de la base de testing. Así cada test arranca desde cero y no depende del orden ni de lo que hizo otro test.
- **Los archivos de prueba** se generan en memoria y se guardan en `uploads-test/`, una carpeta distinta de `uploads/`. Se borra antes de cada test de archivos y al terminar la suite.
- **Al empezar y al terminar la suite** (`tests/setup.js`), también se limpia la base. Se puede correr `npm test` varias veces seguidas sin borrar nada a mano.

## Carga de archivos

La API permite subir documentos de usuarios y comprobantes de entregas con [Multer](https://github.com/expressjs/multer). Los archivos se guardan en carpetas del servidor y en MongoDB solo se registran sus metadatos.

### Endpoints

| Método | Ruta | Campos del formulario | Dónde se guarda |
|---|---|---|---|
| POST | `/api/users/:id/documents` | `file` (archivo) y `documentType` | `uploads/documents/`, o `uploads/licenses/` si es `DRIVER_LICENSE` |
| POST | `/api/deliveries/:id/receipts` | `file` (archivo) | `uploads/receipts/` |

Los dos se envían como `multipart/form-data` y responden `201` con la entidad actualizada: el usuario con su lista `documents` o la entrega con su lista `receipts`.

### Tipos de documento

| `documentType` | Quién puede subirlo |
|---|---|
| `ID_CARD` | Cualquier usuario |
| `PROOF_OF_ADDRESS` | Cualquier usuario |
| `DRIVER_LICENSE` | Solo usuarios con rol `DRIVER` |

Los comprobantes de entrega se guardan con el tipo `DELIVERY_RECEIPT`, sin necesidad de enviarlo.

### Reglas de los archivos

- **Formatos permitidos:** PDF, JPG y PNG. El tipo y la extensión tienen que coincidir, así que un `.exe` enviado como PDF se rechaza.
- **Tamaño máximo:** 5 MB.
- **Un solo archivo,** en el campo `file`.
- **Nombre generado:** fecha, texto aleatorio y extensión original, por ejemplo `1763251200000-a1b2c3d4e5f6.pdf`, para que dos archivos nunca se pisen.

### Metadatos que se guardan

```json
{
  "originalName": "dni-frente.pdf",
  "fileName": "1763251200000-a1b2c3d4e5f6.pdf",
  "path": "uploads/documents/1763251200000-a1b2c3d4e5f6.pdf",
  "mimeType": "application/pdf",
  "size": 245810,
  "documentType": "ID_CARD",
  "uploadedAt": "2026-11-15T22:00:00.000Z"
}
```

### Organización del código

- `src/config/multer.config.js`: configuración centralizada de Multer, con carpetas, nombre de archivo, tipos permitidos y tamaño máximo.
- `src/middlewares/upload.middleware.js`: recibe el archivo y convierte los errores de Multer en errores del diccionario.
- `src/repositories/file-storage.repository.js`: mueve y borra archivos del disco.
- `src/services/file.service.js`: arma los metadatos y borra el archivo si algo falla después de recibirlo.
- Los services de usuarios y entregas validan la entidad y el tipo de documento, y guardan los metadatos.

**Si algo falla después de recibir el archivo,** por ejemplo porque el usuario no existe, el archivo se borra del servidor. Así no quedan archivos sueltos sin una entidad asociada.

Las carpetas `uploads/` y `uploads-test/` están en `.gitignore`: los archivos subidos no se suben al repositorio.

### Cómo probarlo

Desde Swagger (`http://localhost:8080/api/docs`):

1. En **Users**, abrir `POST /api/users/{id}/documents` y tocar **Try it out**.
2. Pegar el id de un usuario, elegir un archivo PDF, JPG o PNG y un `documentType`.
3. Tocar **Execute**. El archivo queda en `uploads/documents/` y sus datos en el usuario.

Desde PowerShell:

```powershell
curl.exe -X POST "http://localhost:8080/api/users/ID_DEL_USUARIO/documents" -F "documentType=ID_CARD" -F "file=@C:\ruta\al\archivo.pdf"
```

Los eventos de carga quedan en los logs: carga exitosa y comprobante asociado (`info`), intento de tipo no permitido y otros errores esperados (`warning`), y fallas al guardar (`error`).
