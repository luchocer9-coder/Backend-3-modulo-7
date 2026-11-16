import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { uploadFile } from '../middlewares/upload.middleware.js';
import { UPLOAD_FOLDERS } from '../config/multer.config.js';

const router = Router();

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);
router.post('/:id/documents', uploadFile(UPLOAD_FOLDERS.USER_DOCUMENTS), userController.uploadDocument);

export default router;