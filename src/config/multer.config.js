import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { config } from './env.config.js';
import { logger } from './logger.config.js';
import { InvalidFileTypeError } from '../errors/custom-errors.js';

// Durante los tests se usa otra carpeta, que se borra al terminar
export const UPLOADS_ROOT = config.isTest ? 'uploads-test' : 'uploads';

// Una subcarpeta por tipo de archivo
export const UPLOAD_FOLDERS = Object.freeze({
  USER_DOCUMENTS: 'documents',
  DRIVER_LICENSES: 'licenses',
  DELIVERY_RECEIPTS: 'receipts',
});

// Nombre del campo del formulario donde tiene que venir el archivo
export const FILE_FIELD = 'file';

export const MAX_FILE_SIZE_MB = 5;

// Tipos permitidos y sus extensiones válidas
export const ALLOWED_FILE_TYPES = Object.freeze({
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
});

// Dónde se guarda: la carpeta la decide cada endpoint según req.uploadFolder
const destination = async (req, file, cb) => {
  try {
    const folder = path.join(UPLOADS_ROOT, req.uploadFolder);
    await fs.mkdir(folder, { recursive: true });
    cb(null, folder);
  } catch (error) {
    cb(error);
  }
};

// Cómo se nombra: fecha + texto aleatorio + extensión original, para que nunca se repita
const filename = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`);
};

// Qué se acepta: el tipo y la extensión tienen que coincidir con la lista
const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const validExtensions = ALLOWED_FILE_TYPES[file.mimetype];

  if (!validExtensions?.includes(extension)) {
    logger.warning(`Intento de subir un archivo no permitido: ${file.originalname} (${file.mimetype})`);
    cb(new InvalidFileTypeError(`${file.mimetype} ${extension}`.trim(), Object.keys(ALLOWED_FILE_TYPES)));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage: multer.diskStorage({ destination, filename }),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});
