import { Router } from 'express';
import { deliveryController } from '../controllers/delivery.controller.js';
import { uploadFile } from '../middlewares/upload.middleware.js';
import { UPLOAD_FOLDERS } from '../config/multer.config.js';

const router = Router();

router.get('/', deliveryController.getAll);
router.get('/:id', deliveryController.getById);
router.patch('/:id/status', deliveryController.updateStatus);
router.post('/:id/receipts', uploadFile(UPLOAD_FOLDERS.DELIVERY_RECEIPTS), deliveryController.uploadReceipt);

export default router;
