import fs from 'node:fs/promises';
import path from 'node:path';

class FileStorageRepository {
  // Mueve un archivo ya subido a otra subcarpeta y devuelve su nueva ruta
  async move(filePath, targetFolder) {
    await fs.mkdir(targetFolder, { recursive: true });
    const newPath = path.join(targetFolder, path.basename(filePath));
    await fs.rename(filePath, newPath);
    return newPath;
  }

  // Borra un archivo del disco. Si no existe, no hace nada
  async remove(filePath) {
    if (!filePath) return;
    await fs.rm(filePath, { force: true });
  }
}

export const fileStorageRepository = new FileStorageRepository();
