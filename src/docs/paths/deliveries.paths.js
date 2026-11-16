import { ref, param, listOf, body, multipartBody, success, errorResponse, internalError, EXAMPLES } from '../helpers.js';

const notFound = errorResponse('No existe la entrega', [EXAMPLES.DELIVERY_NOT_FOUND]);

export const deliveriesPaths = {
  '/api/deliveries': {
    get: {
      tags: ['Deliveries'],
      summary: 'Listar entregas',
      description: 'Devuelve las entregas de la más nueva a la más vieja, con su pedido y su repartidor.',
      responses: {
        200: success('Lista de entregas', listOf('Delivery')),
        500: internalError,
      },
    },
  },
  '/api/deliveries/{id}': {
    get: {
      tags: ['Deliveries'],
      summary: 'Obtener una entrega',
      parameters: [param('IdParam')],
      responses: {
        200: success('Entrega encontrada', ref('Delivery')),
        400: errorResponse('Id inválido', [EXAMPLES.INVALID_ID]),
        404: notFound,
        500: internalError,
      },
    },
  },
  '/api/deliveries/{id}/status': {
    patch: {
      tags: ['Deliveries'],
      summary: 'Cambiar el estado de una entrega o asignar repartidor',
      description:
        'Solo se permiten estos cambios: PENDING_ASSIGNMENT → ASSIGNED o CANCELLED; ASSIGNED → IN_TRANSIT o CANCELLED; ' +
        'IN_TRANSIT → DELIVERED. Para pasar a ASSIGNED hay que enviar driver, el id de un usuario con rol DRIVER. ' +
        'Al pasar a DELIVERED se guarda la fecha de entrega.',
      parameters: [param('IdParam')],
      requestBody: body('DeliveryStatusInput'),
      responses: {
        200: success('Estado actualizado', ref('Delivery')),
        400: errorResponse('Estado, repartidor o id inválido', [
          EXAMPLES.INVALID_DELIVERY_STATUS,
          EXAMPLES.INVALID_DELIVERY_DRIVER,
          EXAMPLES.INVALID_ID,
          EXAMPLES.INVALID_JSON,
        ]),
        404: notFound,
        500: internalError,
      },
    },
  },
  '/api/deliveries/{id}/receipts': {
    post: {
      tags: ['Deliveries'],
      summary: 'Subir un comprobante de una entrega',
      description:
        'Recibe un archivo en el campo file, como multipart/form-data. Se guarda en uploads/receipts y sus metadatos ' +
        'quedan en la entrega con tipo DELIVERY_RECEIPT. Si la entrega no existe, el archivo se borra del servidor.',
      parameters: [param('IdParam')],
      requestBody: multipartBody('DeliveryReceiptUpload'),
      responses: {
        201: success('Comprobante cargado. Devuelve la entrega con sus comprobantes', ref('Delivery')),
        400: errorResponse('Archivo o id inválido', [
          EXAMPLES.FILE_REQUIRED,
          EXAMPLES.INVALID_FILE_FIELD,
          EXAMPLES.INVALID_FILE_TYPE,
          EXAMPLES.FILE_UPLOAD_ERROR,
          EXAMPLES.INVALID_ID,
        ]),
        404: notFound,
        413: errorResponse('El archivo supera el tamaño máximo', [EXAMPLES.FILE_TOO_LARGE]),
        500: errorResponse('No se pudo guardar el archivo o error inesperado', [
          EXAMPLES.FILE_SAVE_ERROR,
          EXAMPLES.INTERNAL_ERROR,
        ]),
      },
    },
  },
};
