import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getServiceRecords,
  createServiceRecord,
  getServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
} from '../controllers/serviceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, paginate } from '../middleware/validationMiddleware.js';

const router = Router();

router.use(protect);

const vehicleIdParam = [param('vehicleId').isMongoId().withMessage('Invalid vehicle ID.')];
const recordIdParam = [param('id').isMongoId().withMessage('Invalid service record ID.')];

const createRules = [
  body('serviceType').isMongoId().withMessage('Valid service type ID is required.'),
  body('date').isISO8601().withMessage('Valid date is required.'),
  body('odometerAtService').isFloat({ min: 0 }).withMessage('Odometer must be a non-negative number.'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be a non-negative number.'),
  body('notes').optional().isString(),
  body('parts').optional().isArray(),
  body('parts.*.name').optional().notEmpty().withMessage('Part name cannot be empty.'),
  body('parts.*.price').optional().isFloat({ min: 0 }).withMessage('Part price must be non-negative.'),
];

router.get('/:vehicleId/services', vehicleIdParam, validate, paginate, getServiceRecords);
router.post('/:vehicleId/services', vehicleIdParam, createRules, validate, createServiceRecord);
router.get('/:vehicleId/services/:id', [...vehicleIdParam, ...recordIdParam], validate, getServiceRecord);
router.put('/:vehicleId/services/:id', [...vehicleIdParam, ...recordIdParam], validate, updateServiceRecord);
router.delete('/:vehicleId/services/:id', [...vehicleIdParam, ...recordIdParam], validate, deleteServiceRecord);

export default router;
