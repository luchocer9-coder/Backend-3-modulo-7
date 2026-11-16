import { ref, param, listOf, body, multipartBody, success, errorResponse, internalError, EXAMPLES } from '../helpers.js';

const notFound = errorResponse('No existe el usuario', [EXAMPLES.USER_NOT_FOUND]);

export const usersPaths = {
  '/api/users': {
    get: {
      tags: ['Users'],
      summary: 'Listar usuarios',
      description: 'Devuelve todos los usuarios ordenados por nombre, sin contraseña.',
      responses: {
        200: success('Lista de usuarios', listOf('User')),
        500: internalError,
      },
    },
    post: {
      tags: ['Users'],
      summary: 'Crear un usuario',
      description: 'Crea un usuario con rol USER. La contraseña se guarda encriptada y no se devuelve.',
      requestBody: body('UserInput'),
      responses: {
        201: success('Usuario creado', ref('User')),
        400: errorResponse('Datos inválidos', [EXAMPLES.INVALID_PASSWORD, EXAMPLES.VALIDATION_ERROR, EXAMPLES.INVALID_JSON]),
        409: errorResponse('El email ya está registrado', [EXAMPLES.DUPLICATE_KEY]),
        500: internalError,
      },
    },
  },
  '/api/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Obtener un usuario',
      parameters: [param('IdParam')],
      responses: {
        200: success('Usuario encontrado', ref('User')),
        400: errorResponse('Id inválido', [EXAMPLES.INVALID_ID]),
        404: notFound,
        500: internalError,
      },
    },
    put: {
      tags: ['Users'],
      summary: 'Actualizar un usuario',
      description: 'Actualiza nombre, email o contraseña. El rol no se puede cambiar.',
      parameters: [param('IdParam')],
      requestBody: body('UserUpdateInput'),
      responses: {
        200: success('Usuario actualizado', ref('User')),
        400: errorResponse('Datos inválidos', [
          EXAMPLES.INVALID_ID,
          EXAMPLES.INVALID_PASSWORD,
          EXAMPLES.VALIDATION_ERROR,
          EXAMPLES.INVALID_JSON,
        ]),
        404: notFound,
        409: errorResponse('El email ya está registrado', [EXAMPLES.DUPLICATE_KEY]),
        500: internalError,
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Eliminar un usuario',
      parameters: [param('IdParam')],
      responses: {
        204: { description: 'Usuario eliminado. No devuelve contenido' },
        400: errorResponse('Id inválido', [EXAMPLES.INVALID_ID]),
        404: notFound,
        500: internalError,
      },
    },
  },
  '/api/users/{id}/documents': {
    post: {
      tags: ['Users'],
      summary: 'Subir un documento de un usuario',
      description:
        'Recibe un archivo en el campo file y el tipo de documento en documentType, como multipart/form-data. ' +
        'El archivo se guarda en uploads/documents (o uploads/licenses si es DRIVER_LICENSE) y sus metadatos quedan en el usuario. ' +
        'DRIVER_LICENSE solo se acepta para repartidores. Si algo falla, el archivo se borra del servidor.',
      parameters: [param('IdParam')],
      requestBody: multipartBody('UserDocumentUpload'),
      responses: {
        201: success('Documento cargado. Devuelve el usuario con sus documentos', ref('User')),
        400: errorResponse('Archivo, tipo de documento o id inválido', [
          EXAMPLES.FILE_REQUIRED,
          EXAMPLES.INVALID_FILE_FIELD,
          EXAMPLES.INVALID_FILE_TYPE,
          EXAMPLES.FILE_UPLOAD_ERROR,
          EXAMPLES.INVALID_ID,
          EXAMPLES.INVALID_DOCUMENT_TYPE,
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
