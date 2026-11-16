import { ERRORS } from '../errors/error-dictionary.js';

const EXAMPLE_ID = '6af38d8e956809dfdcdde832';

export const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
export const param = (name) => ({ $ref: `#/components/parameters/${name}` });
export const listOf = (name) => ({ type: 'array', items: ref(name) });

// Body JSON que espera el endpoint
export const body = (name) => ({
  required: true,
  content: { 'application/json': { schema: ref(name) } },
});

// Body multipart/form-data, para endpoints que reciben archivos
export const multipartBody = (name) => ({
  required: true,
  content: { 'multipart/form-data': { schema: ref(name) } },
});

// Respuesta exitosa: { payload: ... } con el schema que corresponda
export const success = (description, payloadSchema) => ({
  description,
  content: {
    'application/json': {
      schema: {
        allOf: [ref('SuccessResponse'), { type: 'object', properties: { payload: payloadSchema } }],
      },
    },
  },
});

// Respuesta JSON directa, sin { payload }, como las de mocks y logger
export const json = (description, schema) => ({
  description,
  content: { 'application/json': { schema } },
});

// Arma un ejemplo de error usando el diccionario real de errores
const errorExample = (error, details = null, path = '/api/...') => ({
  summary: error.code,
  value: {
    status: 'error',
    statusCode: error.statusCode,
    code: error.code,
    message: error.message,
    details,
    path,
    timestamp: '2026-11-12T16:00:00.000Z',
  },
});

// Respuesta de error con un ejemplo por cada código posible
export const errorResponse = (description, examples) => ({
  description,
  content: {
    'application/json': {
      schema: ref('ErrorResponse'),
      examples: Object.fromEntries(examples.map((example) => [example.summary, example])),
    },
  },
});

export const EXAMPLES = {
  INVALID_ID: errorExample(ERRORS.INVALID_ID, { id: '123' }),
  INVALID_JSON: errorExample(ERRORS.INVALID_JSON),
  VALIDATION_ERROR: errorExample(ERRORS.VALIDATION_ERROR, {
    fields: [{ field: 'name', message: 'Path `name` is required.' }],
  }),
  DUPLICATE_KEY: errorExample(ERRORS.DUPLICATE_KEY, { fields: ['email'] }),
  INTERNAL_ERROR: errorExample(ERRORS.INTERNAL_ERROR),
  USER_NOT_FOUND: errorExample(ERRORS.USER_NOT_FOUND, { id: EXAMPLE_ID }),
  INVALID_PASSWORD: errorExample(ERRORS.INVALID_PASSWORD, { minLength: 8 }),
  PRODUCT_NOT_FOUND: errorExample(ERRORS.PRODUCT_NOT_FOUND, { id: EXAMPLE_ID }),
  INVALID_PRODUCT_STATUS: errorExample(ERRORS.INVALID_PRODUCT_STATUS, { received: 'AVAILABLE' }),
  ORDER_NOT_FOUND: errorExample(ERRORS.ORDER_NOT_FOUND, { id: EXAMPLE_ID }),
  INVALID_ORDER_USER: errorExample(ERRORS.INVALID_ORDER_USER, { userId: EXAMPLE_ID, role: 'DRIVER' }),
  INVALID_ORDER_ITEMS: errorExample(ERRORS.INVALID_ORDER_ITEMS),
  INVALID_ORDER_STATUS: errorExample(ERRORS.INVALID_ORDER_STATUS, {
    current: 'PENDING',
    received: 'DELIVERED',
    allowed: ['PREPARING', 'CANCELLED'],
  }),
  DELIVERY_NOT_FOUND: errorExample(ERRORS.DELIVERY_NOT_FOUND, { id: EXAMPLE_ID }),
  INVALID_DELIVERY_STATUS: errorExample(ERRORS.INVALID_DELIVERY_STATUS, {
    current: 'PENDING_ASSIGNMENT',
    received: 'DELIVERED',
    allowed: ['ASSIGNED', 'CANCELLED'],
  }),
  INVALID_DELIVERY_DRIVER: errorExample(ERRORS.INVALID_DELIVERY_DRIVER, { driver: EXAMPLE_ID, role: 'USER' }),
  FILE_REQUIRED: errorExample(ERRORS.FILE_REQUIRED, { field: 'file' }),
  INVALID_FILE_FIELD: errorExample(ERRORS.INVALID_FILE_FIELD, { expected: 'file', received: 'documento' }),
  INVALID_FILE_TYPE: errorExample(ERRORS.INVALID_FILE_TYPE, {
    received: 'text/plain .txt',
    allowed: ['application/pdf', 'image/jpeg', 'image/png'],
  }),
  FILE_TOO_LARGE: errorExample(ERRORS.FILE_TOO_LARGE, { maxSizeMB: 5 }),
  INVALID_DOCUMENT_TYPE: errorExample(ERRORS.INVALID_DOCUMENT_TYPE, {
    received: 'DRIVER_LICENSE',
    allowed: ['ID_CARD', 'PROOF_OF_ADDRESS'],
  }),
  FILE_UPLOAD_ERROR: errorExample(ERRORS.FILE_UPLOAD_ERROR, { reason: 'Unexpected end of form' }),
  FILE_SAVE_ERROR: errorExample(ERRORS.FILE_SAVE_ERROR, { reason: 'ENOSPC' }),
  INVALID_MOCK_QTY: errorExample(ERRORS.INVALID_MOCK_QTY, { received: 500, min: 1, max: 100 }, '/api/mocks/users?qty=500'),
  NEGATIVE_MOCK_QTY: errorExample(ERRORS.NEGATIVE_MOCK_QTY, { received: -3 }, '/api/mocks/users?qty=-3'),
  MOCK_SEED_FORBIDDEN: errorExample(ERRORS.MOCK_SEED_FORBIDDEN, null, '/api/mocks/seed'),
  MOCK_SEED_FAILED: errorExample(ERRORS.MOCK_SEED_FAILED, { reason: 'MongoNetworkError' }, '/api/mocks/seed'),
};

// Error 500 que puede dar cualquier endpoint
export const internalError = errorResponse('Error inesperado del servidor', [EXAMPLES.INTERNAL_ERROR]);
