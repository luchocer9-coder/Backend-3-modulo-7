import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { USER_ROLES, DOCUMENT_TYPES, USER_DOCUMENT_TYPES_BY_ROLE } from '../constants/index.js';
import {
  InvalidIdError,
  UserNotFoundError,
  InvalidPasswordError,
  InvalidDocumentTypeError,
} from '../errors/custom-errors.js';
import { buildFileMetadata, ensureFile, moveFile, withFileCleanup } from './file.service.js';
import { UPLOAD_FOLDERS } from '../config/multer.config.js';
import { logger } from '../config/logger.config.js';

const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;

const ensureValidId = (id) => {
  if (!userRepository.isValidId(id)) {
    throw new InvalidIdError(id);
  }
};

const hashPassword = async (password) => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new InvalidPasswordError(MIN_PASSWORD_LENGTH);
  }

  return bcrypt.hash(password, SALT_ROUNDS);
};

class UserService {
  async getAll() {
    return userRepository.getAll();
  }

  async getById(id) {
    ensureValidId(id);
    const user = await userRepository.getById(id);

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  }

  async create(data = {}) {
    const password = await hashPassword(data.password);

    return userRepository.create({
      ...data,
      password,
      role: USER_ROLES.USER,
    });
  }

  async update(id, data = {}) {
    ensureValidId(id);
    const { role, ...changes } = data;

    if (changes.password !== undefined) {
      changes.password = await hashPassword(changes.password);
    }

    const updatedUser = await userRepository.update(id, changes);

    if (!updatedUser) {
      throw new UserNotFoundError(id);
    }

    return updatedUser;
  }

  async delete(id) {
    ensureValidId(id);
    const deletedUser = await userRepository.delete(id);

    if (!deletedUser) {
      throw new UserNotFoundError(id);
    }

    return deletedUser;
  }

  async uploadDocument(id, file, documentType) {
    ensureFile(file);

    return withFileCleanup(file, async () => {
      // Primero se valida que sea un tipo de documento de usuario
      const userDocumentTypes = USER_DOCUMENT_TYPES_BY_ROLE[USER_ROLES.DRIVER];

      if (!userDocumentTypes.includes(documentType)) {
        throw new InvalidDocumentTypeError(documentType ?? null, userDocumentTypes);
      }

      // Después, que ese tipo corresponda al rol del usuario
      const user = await this.getById(id);
      const allowed = USER_DOCUMENT_TYPES_BY_ROLE[user.role];

      if (!allowed.includes(documentType)) {
        throw new InvalidDocumentTypeError(documentType, allowed);
      }

      // Las licencias de conducir van a su propia carpeta
      if (documentType === DOCUMENT_TYPES.DRIVER_LICENSE) {
        await moveFile(file, UPLOAD_FOLDERS.DRIVER_LICENSES);
      }

      const updatedUser = await userRepository.addDocument(id, buildFileMetadata(file, documentType));
      logger.info(`Documento ${documentType} (${file.filename}) cargado para el usuario ${id}`);
      return updatedUser;
    });
  }
}

export const userService = new UserService();