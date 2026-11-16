import multer from 'multer';
import { upload, FILE_FIELD, MAX_FILE_SIZE_MB } from '../config/multer.config.js';
import { logger } from '../config/logger.config.js';
import {
  AppError,
  InvalidFileFieldError,
  FileTooLargeError,
  FileUploadError,
  FileSaveError,
} from '../errors/custom-errors.js';

// Convierte los errores de Multer en errores del diccionario
const toUploadError = (error) => {
  if (error instanceof AppError) return error;

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return new FileTooLargeError(MAX_FILE_SIZE_MB);
    if (error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT') {
      return new InvalidFileFieldError(FILE_FIELD, error.field ?? null);
    }
    return new FileUploadError(error.code, error);
  }

  // Errores del sistema de archivos al guardar (sin permisos, disco lleno, etc.)
  if (error.syscall) {
    logger.error(`Error al guardar un archivo en el servidor: ${error.message}`);
    return new FileSaveError(error.code, error);
  }

  // Formulario mal armado
  return new FileUploadError(error.message, error);
};

// Recibe un archivo en el campo "file" y lo guarda en la subcarpeta indicada
export const uploadFile = (folder) => (req, res, next) => {
  req.uploadFolder = folder;

  upload.single(FILE_FIELD)(req, res, (error) => {
    if (error) {
      next(toUploadError(error));
      return;
    }
    next();
  });
};
