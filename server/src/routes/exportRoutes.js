import { Router } from 'express';
import { param } from 'express-validator';
import { uploadReceipt, exportPdf, exportCsv } from '../controllers/exportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { upload } from '../config/multer.js';

const router = Router();
router.use(protect);

const vehicleId = [param('vehicleId').isMongoId()];
const serviceId = [param('id').isMongoId()];

// Receipt upload
router.post(
  '/:vehicleId/services/:id/receipt',
  [...vehicleId, ...serviceId], validate,
  upload.single('receipt'),
  uploadReceipt
);

// Export
router.get('/:vehicleId/export/pdf', vehicleId, validate, exportPdf);
router.get('/:vehicleId/export/csv', vehicleId, validate, exportCsv);

export default router;
