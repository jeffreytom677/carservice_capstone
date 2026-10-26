import { Router } from 'express';
import { body, param } from 'express-validator';
import { getDocuments, createDocument, updateDocument, deleteDocument } from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = Router();
router.use(protect);

const vehicleId = [param('vehicleId').isMongoId()];
const id = [param('id').isMongoId()];

const rules = [
  body('type').isIn(['insurance', 'PUC', 'licence', 'other']).withMessage('Invalid document type.'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date required.'),
];

router.get('/:vehicleId/documents', vehicleId, validate, getDocuments);
router.post('/:vehicleId/documents', [...vehicleId, ...rules], validate, createDocument);
router.put('/:vehicleId/documents/:id', [...vehicleId, ...id, ...rules], validate, updateDocument);
router.delete('/:vehicleId/documents/:id', [...vehicleId, ...id], validate, deleteDocument);

export default router;
