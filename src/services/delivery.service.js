import { deliveryRepository } from '../repositories/delivery.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { DELIVERY_STATUS, DELIVERY_STATUS_TRANSITIONS, USER_ROLES, DOCUMENT_TYPES } from '../constants/index.js';
import {
  InvalidIdError,
  DeliveryNotFoundError,
  InvalidDeliveryStatusError,
  InvalidDeliveryDriverError,
} from '../errors/custom-errors.js';
import { logger } from '../config/logger.config.js';
import { buildFileMetadata, ensureFile, withFileCleanup } from './file.service.js';

const ensureValidId = (id) => {
  if (!deliveryRepository.isValidId(id)) {
    throw new InvalidIdError(id);
  }
};

// Para asignar una entrega, el repartidor tiene que existir y tener rol DRIVER
const ensureDriver = async (driverId) => {
  if (!userRepository.isValidId(driverId)) {
    throw new InvalidDeliveryDriverError(driverId);
  }

  const driver = await userRepository.getById(driverId);

  if (!driver || driver.role !== USER_ROLES.DRIVER) {
    throw new InvalidDeliveryDriverError(driverId, driver?.role ?? null);
  }
};

class DeliveryService {
  async getAll() {
    return deliveryRepository.getAll();
  }

  async getById(id) {
    ensureValidId(id);
    const delivery = await deliveryRepository.getById(id);

    if (!delivery) {
      throw new DeliveryNotFoundError(id);
    }

    return delivery;
  }

  async updateStatus(id, data = {}) {
    const { status, driver } = data;
    const delivery = await this.getById(id);
    const allowed = DELIVERY_STATUS_TRANSITIONS[delivery.status];

    if (!allowed.includes(status)) {
      throw new InvalidDeliveryStatusError(delivery.status, status, allowed);
    }

    const changes = { status };

    if (status === DELIVERY_STATUS.ASSIGNED) {
      await ensureDriver(driver);
      changes.driver = driver;
    }

    if (status === DELIVERY_STATUS.DELIVERED) {
      changes.deliveredAt = new Date();
    }

    const updatedDelivery = await deliveryRepository.update(id, changes);
    logger.info(`Entrega ${id} pasó de ${delivery.status} a ${status}`);
    return updatedDelivery;
  }

  async uploadReceipt(id, file) {
    ensureFile(file);

    return withFileCleanup(file, async () => {
      await this.getById(id);

      const metadata = buildFileMetadata(file, DOCUMENT_TYPES.DELIVERY_RECEIPT);
      const updatedDelivery = await deliveryRepository.addReceipt(id, metadata);
      logger.info(`Comprobante ${file.filename} asociado a la entrega ${id}`);
      return updatedDelivery;
    });
  }
}

export const deliveryService = new DeliveryService();
