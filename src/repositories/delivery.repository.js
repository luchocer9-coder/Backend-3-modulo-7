import mongoose from 'mongoose';
import { DeliveryModel } from '../models/delivery.model.js';

const PUBLIC_FIELDS = 'order driver status deliveredAt receipts createdAt';
const ORDER_FIELDS = 'address total status priority';
const DRIVER_FIELDS = 'name email';

class DeliveryRepository {
  isValidId(id) {
    return mongoose.isObjectIdOrHexString(id);
  }

  async getAll(filters = {}) {
    return DeliveryModel.find(filters)
      .select(PUBLIC_FIELDS)
      .populate('order', ORDER_FIELDS)
      .populate('driver', DRIVER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
  }

  async getById(id) {
    return DeliveryModel.findById(id)
      .select(PUBLIC_FIELDS)
      .populate('order', ORDER_FIELDS)
      .populate('driver', DRIVER_FIELDS)
      .lean();
  }

  async create(data) {
    const delivery = await DeliveryModel.create(data);
    return delivery.toObject();
  }

  async update(id, changes) {
    return DeliveryModel.findByIdAndUpdate(id, changes, { returnDocument: 'after', runValidators: true })
      .select(PUBLIC_FIELDS)
      .populate('order', ORDER_FIELDS)
      .populate('driver', DRIVER_FIELDS)
      .lean();
  }

  // Guarda los metadatos del comprobante en la entrega
  async addReceipt(id, receipt) {
    return DeliveryModel.findByIdAndUpdate(id, { $push: { receipts: receipt } }, { returnDocument: 'after' })
      .select(PUBLIC_FIELDS)
      .populate('order', ORDER_FIELDS)
      .populate('driver', DRIVER_FIELDS)
      .lean();
  }
}

export const deliveryRepository = new DeliveryRepository();
