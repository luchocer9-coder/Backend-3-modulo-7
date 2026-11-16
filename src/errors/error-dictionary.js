export const ERRORS = Object.freeze({
  // Generales
  INVALID_ID: { code: 'INVALID_ID', statusCode: 400, message: 'El id enviado no es válido' },
  INVALID_JSON: { code: 'INVALID_JSON', statusCode: 400, message: 'El cuerpo de la petición no es un JSON válido' },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', statusCode: 400, message: 'Los datos enviados no son válidos' },
  DUPLICATE_KEY: { code: 'DUPLICATE_KEY', statusCode: 409, message: 'Ya existe un registro con esos datos' },
  ROUTE_NOT_FOUND: { code: 'ROUTE_NOT_FOUND', statusCode: 404, message: 'La ruta solicitada no existe' },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', statusCode: 500, message: 'Error interno del servidor' },

  // Usuarios
  USER_NOT_FOUND: { code: 'USER_NOT_FOUND', statusCode: 404, message: 'Usuario no encontrado' },
  INVALID_PASSWORD: { code: 'INVALID_PASSWORD', statusCode: 400, message: 'La contraseña no cumple los requisitos' },

  // Productos
  PRODUCT_NOT_FOUND: { code: 'PRODUCT_NOT_FOUND', statusCode: 404, message: 'Producto no encontrado' },
  INVALID_PRODUCT_STATUS: {
    code: 'INVALID_PRODUCT_STATUS',
    statusCode: 400,
    message: 'El estado del producto se calcula según el stock y no puede enviarse',
  },

  // Pedidos
  ORDER_NOT_FOUND: { code: 'ORDER_NOT_FOUND', statusCode: 404, message: 'Pedido no encontrado' },
  INVALID_ORDER_USER: {
    code: 'INVALID_ORDER_USER',
    statusCode: 400,
    message: 'Los pedidos solo pueden pertenecer a usuarios con rol USER',
  },
  INVALID_ORDER_ITEMS: {
    code: 'INVALID_ORDER_ITEMS',
    statusCode: 400,
    message: 'El pedido debe tener al menos un item',
  },
  INVALID_ORDER_STATUS: {
    code: 'INVALID_ORDER_STATUS',
    statusCode: 400,
    message: 'El estado del pedido no es válido o no se puede aplicar desde el estado actual',
  },

  // Entregas
  DELIVERY_NOT_FOUND: { code: 'DELIVERY_NOT_FOUND', statusCode: 404, message: 'Entrega no encontrada' },
  INVALID_DELIVERY_STATUS: {
    code: 'INVALID_DELIVERY_STATUS',
    statusCode: 400,
    message: 'El estado de la entrega no es válido o no se puede aplicar desde el estado actual',
  },
  INVALID_DELIVERY_DRIVER: {
    code: 'INVALID_DELIVERY_DRIVER',
    statusCode: 400,
    message: 'Para asignar una entrega hay que enviar el id de un usuario con rol DRIVER',
  },

  // Archivos
  FILE_REQUIRED: { code: 'FILE_REQUIRED', statusCode: 400, message: 'Hay que enviar un archivo en el campo "file"' },
  INVALID_FILE_FIELD: {
    code: 'INVALID_FILE_FIELD',
    statusCode: 400,
    message: 'El archivo tiene que enviarse en un único campo llamado "file"',
  },
  INVALID_FILE_TYPE: {
    code: 'INVALID_FILE_TYPE',
    statusCode: 400,
    message: 'Tipo de archivo no permitido. Solo se aceptan PDF, JPG y PNG',
  },
  FILE_TOO_LARGE: { code: 'FILE_TOO_LARGE', statusCode: 413, message: 'El archivo supera el tamaño máximo permitido' },
  INVALID_DOCUMENT_TYPE: {
    code: 'INVALID_DOCUMENT_TYPE',
    statusCode: 400,
    message: 'El tipo de documento no es válido para este usuario',
  },
  FILE_UPLOAD_ERROR: { code: 'FILE_UPLOAD_ERROR', statusCode: 400, message: 'No se pudo procesar la carga del archivo' },
  FILE_SAVE_ERROR: { code: 'FILE_SAVE_ERROR', statusCode: 500, message: 'No se pudo guardar el archivo en el servidor' },

  // Mocks
  INVALID_MOCK_QTY: { code: 'INVALID_MOCK_QTY', statusCode: 400, message: 'La cantidad de datos a generar no es válida' },
  NEGATIVE_MOCK_QTY: { code: 'NEGATIVE_MOCK_QTY', statusCode: 400, message: 'La cantidad de datos a generar no puede ser negativa' },
  MOCK_SEED_FORBIDDEN: {
    code: 'MOCK_SEED_FORBIDDEN',
    statusCode: 403,
    message: 'La carga de datos de prueba no está permitida en producción',
  },
  MOCK_SEED_FAILED: {
    code: 'MOCK_SEED_FAILED',
    statusCode: 500,
    message: 'No se pudieron guardar los datos de prueba. No quedó ningún registro a medias',
  },
});