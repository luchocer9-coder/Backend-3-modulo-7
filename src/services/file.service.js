import path from 'node:path';
import { fileStorageRepository } from '../repositories/file-storage.repository.js';
import { FileRequiredError } from '../errors/custom-errors.js';
import { FILE_FIELD, UPLOADS_ROOT } from '../config/multer.config.js';

// Lo que se guarda en la base: solo los metadatos, nunca el archivo
export const buildFileMetadata = (file, documentType) => ({
  originalName: file.originalname,
  fileName: file.filename,
  path: file.path.split(path.sep).join('/'),
  mimeType: file.mimetype,
  size: file.size,
  documentType,
  uploadedAt: new Date(),
});

export const ensureFile = (file) => {
  if (!file) {
    throw new FileRequiredError(FILE_FIELD);
  }
};

export const moveFile = async (file, folder) => {
  file.path = await fileStorageRepository.move(file.path, path.join(UPLOADS_ROOT, folder));
};

// Si algo falla después de recibir el archivo, se borra del disco
// para que no quede un archivo suelto sin entidad asociada
export const withFileCleanup = async (file, action) => {
  try {
    return await action();
  } catch (error) {
    await fileStorageRepository.remove(file?.path);
    throw error;
  }
};
