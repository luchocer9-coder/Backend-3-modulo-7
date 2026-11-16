import {
  USER_ROLES,
  PRODUCT_STATUS,
  ORDER_STATUS,
  ORDER_PRIORITY,
  DELIVERY_STATUS,
  DOCUMENT_TYPES,
  USER_DOCUMENT_TYPES_BY_ROLE,
} from '../../constants/index.js';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB } from '../../config/multer.config.js';

const ALLOWED_TYPES_TEXT = `Formatos permitidos: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}. Tamaño máximo: ${MAX_FILE_SIZE_MB} MB`;

const objectId = { type: 'string', example: '6af38d8e956809dfdcdde832' };
const date = { type: 'string', format: 'date-time' };

export const schemas = {
  // Respuestas generales
  SuccessResponse: {
    type: 'object',
    description: 'Formato de las respuestas exitosas de usuarios, productos, pedidos y entregas',
    properties: { payload: { description: 'Datos pedidos' } },
  },
  ErrorResponse: {
    type: 'object',
    description: 'Formato único de todos los errores, generado por el middleware global',
    properties: {
      status: { type: 'string', example: 'error' },
      statusCode: { type: 'integer', example: 404 },
      code: { type: 'string', example: 'USER_NOT_FOUND' },
      message: { type: 'string', example: 'Usuario no encontrado' },
      details: { type: 'object', nullable: true, description: 'Datos extra del error, o null' },
      path: { type: 'string', example: '/api/users/6af38d8e956809dfdcdde832' },
      timestamp: date,
    },
  },

  // Usuarios
  User: {
    type: 'object',
    description: 'Usuario. La contraseña nunca se devuelve',
    properties: {
      _id: objectId,
      name: { type: 'string', example: 'Ana Pérez' },
      email: { type: 'string', example: 'ana@test.com' },
      role: { type: 'string', enum: Object.values(USER_ROLES) },
      documents: { type: 'array', items: { $ref: '#/components/schemas/FileMetadata' } },
    },
  },
  UserInput: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', example: 'Ana Pérez' },
      email: { type: 'string', example: 'ana@test.com' },
      password: { type: 'string', minLength: 8, example: '12345678' },
    },
  },
  UserUpdateInput: {
    type: 'object',
    description: 'Todos los campos son opcionales. El rol no se puede cambiar y se ignora',
    properties: {
      name: { type: 'string', example: 'Ana P.' },
      email: { type: 'string', example: 'ana.p@test.com' },
      password: { type: 'string', minLength: 8, example: 'nueva1234' },
    },
  },
  UserSummary: {
    type: 'object',
    properties: { _id: objectId, name: { type: 'string' }, email: { type: 'string' } },
  },

  // Productos
  Product: {
    type: 'object',
    properties: {
      _id: objectId,
      name: { type: 'string', example: 'Caja' },
      price: { type: 'number', example: 1500 },
      stock: { type: 'integer', example: 10 },
      status: { type: 'string', enum: Object.values(PRODUCT_STATUS), description: 'Se calcula según el stock' },
    },
  },
  ProductInput: {
    type: 'object',
    required: ['name', 'price'],
    description: 'No se puede enviar status: se calcula según el stock',
    properties: {
      name: { type: 'string', example: 'Caja' },
      price: { type: 'number', minimum: 0, example: 1500 },
      stock: { type: 'integer', minimum: 0, default: 0, example: 10 },
    },
  },

  ProductUpdateInput: {
    type: 'object',
    description: 'Todos los campos son opcionales. No se puede enviar status: se recalcula si cambia el stock',
    properties: {
      name: { type: 'string', example: 'Caja grande' },
      price: { type: 'number', minimum: 0, example: 2000 },
      stock: { type: 'integer', minimum: 0, example: 0 },
    },
  },

  // Pedidos
  OrderItem: {
    type: 'object',
    required: ['description', 'quantity', 'unitPrice'],
    properties: {
      description: { type: 'string', example: 'Caja mediana' },
      quantity: { type: 'integer', minimum: 1, example: 2 },
      unitPrice: { type: 'number', minimum: 0, example: 1500 },
    },
  },
  Order: {
    type: 'object',
    properties: {
      _id: objectId,
      user: {
        description: 'Id del cliente, o sus datos cuando se consulta el pedido',
        oneOf: [objectId, { $ref: '#/components/schemas/UserSummary' }],
      },
      address: { type: 'string', example: 'Av. Siempre Viva 742, Buenos Aires' },
      items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
      total: { type: 'number', example: 3300, description: 'Suma de cantidad por precio de cada item' },
      status: { type: 'string', enum: Object.values(ORDER_STATUS) },
      priority: { type: 'string', enum: Object.values(ORDER_PRIORITY) },
      createdAt: date,
    },
  },
  OrderInput: {
    type: 'object',
    required: ['user', 'address', 'items'],
    description: 'El total no se envía: lo calcula la API. Todo pedido nuevo empieza en PENDING',
    properties: {
      user: { ...objectId, description: 'Id de un usuario con rol USER' },
      address: { type: 'string', example: 'Av. Siempre Viva 742, Buenos Aires' },
      items: {
        type: 'array',
        minItems: 1,
        items: { $ref: '#/components/schemas/OrderItem' },
      },
      priority: { type: 'string', enum: Object.values(ORDER_PRIORITY), default: ORDER_PRIORITY.MEDIUM },
    },
  },
  OrderStatusInput: {
    type: 'object',
    required: ['status'],
    description:
      'Cambios permitidos: PENDING → PREPARING o CANCELLED; PREPARING → SHIPPED o CANCELLED; SHIPPED → DELIVERED',
    properties: { status: { type: 'string', enum: Object.values(ORDER_STATUS), example: ORDER_STATUS.PREPARING } },
  },

  // Entregas
  Delivery: {
    type: 'object',
    properties: {
      _id: objectId,
      order: {
        type: 'object',
        description: 'Pedido asociado',
        properties: {
          _id: objectId,
          address: { type: 'string' },
          total: { type: 'number' },
          status: { type: 'string', enum: Object.values(ORDER_STATUS) },
          priority: { type: 'string', enum: Object.values(ORDER_PRIORITY) },
        },
      },
      driver: {
        description: 'Repartidor asignado, o null si todavía no tiene',
        nullable: true,
        allOf: [{ $ref: '#/components/schemas/UserSummary' }],
      },
      status: { type: 'string', enum: Object.values(DELIVERY_STATUS) },
      deliveredAt: { ...date, nullable: true, description: 'Fecha de entrega, solo cuando está DELIVERED' },
      receipts: { type: 'array', items: { $ref: '#/components/schemas/FileMetadata' } },
      createdAt: date,
    },
  },
  DeliveryStatusInput: {
    type: 'object',
    required: ['status'],
    description:
      'Cambios permitidos: PENDING_ASSIGNMENT → ASSIGNED o CANCELLED; ASSIGNED → IN_TRANSIT o CANCELLED; IN_TRANSIT → DELIVERED. Para pasar a ASSIGNED hay que enviar driver',
    properties: {
      status: { type: 'string', enum: Object.values(DELIVERY_STATUS), example: DELIVERY_STATUS.ASSIGNED },
      driver: { ...objectId, description: 'Id de un usuario con rol DRIVER. Obligatorio solo para ASSIGNED' },
    },
  },

  // Archivos
  FileMetadata: {
    type: 'object',
    description: 'Metadatos de un archivo subido. El archivo se guarda en el servidor, no en la base',
    properties: {
      originalName: { type: 'string', example: 'dni-frente.pdf' },
      fileName: { type: 'string', example: '1763251200000-a1b2c3d4e5f6.pdf' },
      path: { type: 'string', example: 'uploads/documents/1763251200000-a1b2c3d4e5f6.pdf' },
      mimeType: { type: 'string', example: 'application/pdf' },
      size: { type: 'integer', description: 'Tamaño en bytes', example: 245810 },
      documentType: { type: 'string', enum: Object.values(DOCUMENT_TYPES) },
      uploadedAt: date,
    },
  },
  UserDocumentUpload: {
    type: 'object',
    required: ['file', 'documentType'],
    properties: {
      file: { type: 'string', format: 'binary', description: ALLOWED_TYPES_TEXT },
      documentType: {
        type: 'string',
        enum: USER_DOCUMENT_TYPES_BY_ROLE[USER_ROLES.DRIVER],
        description: 'DRIVER_LICENSE solo se acepta para usuarios con rol DRIVER',
      },
    },
  },
  DeliveryReceiptUpload: {
    type: 'object',
    required: ['file'],
    properties: {
      file: { type: 'string', format: 'binary', description: ALLOWED_TYPES_TEXT },
    },
  },

  // Mocks
  MockUser: {
    type: 'object',
    properties: {
      _id: objectId,
      name: { type: 'string', example: 'Ana Pérez' },
      email: { type: 'string', example: 'ana.perez.x7k2p@test.com' },
      role: { type: 'string', enum: [USER_ROLES.USER, USER_ROLES.DRIVER] },
    },
  },
  MockDataset: {
    type: 'object',
    properties: {
      users: { type: 'array', items: { $ref: '#/components/schemas/MockUser' } },
      orders: {
        type: 'array',
        items: { allOf: [{ $ref: '#/components/schemas/Order' }], description: 'user es el id de un usuario de la lista' },
      },
      deliveries: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            _id: objectId,
            order: objectId,
            driver: { ...objectId, nullable: true },
            status: { type: 'string', enum: Object.values(DELIVERY_STATUS) },
            deliveredAt: { ...date, nullable: true },
          },
        },
      },
    },
  },
  SeedUsersResult: {
    type: 'object',
    properties: {
      insertados: { type: 'integer', example: 10 },
      coleccion: { type: 'string', example: 'users' },
    },
  },
  SeedDatasetResult: {
    type: 'object',
    properties: {
      insertados: {
        type: 'object',
        properties: {
          users: { type: 'integer', example: 5 },
          orders: { type: 'integer', example: 6 },
          deliveries: { type: 'integer', example: 6 },
        },
      },
    },
  },

  // Logger
  LoggerTestResult: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Se generó un log de prueba en cada nivel' },
      levels: { type: 'array', items: { type: 'string' }, example: ['fatal', 'error', 'warning', 'info', 'http', 'debug'] },
      minLevel: { type: 'string', example: 'debug' },
      visibleLevels: { type: 'array', items: { type: 'string' } },
      files: {
        type: 'object',
        properties: { error: { type: 'string' }, combined: { type: 'string' } },
      },
    },
  },
};
