import { Router } from 'express';
import { body, param } from 'express-validator';
import { getFuelLogs, createFuelLog, updateFuelLog, deleteFuelLog } from '../controllers/fuelController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, paginate } from '../middleware/validationMiddleware.js';

const router = Router();
router.use(protect);

const vehicleId = [param('vehicleId').isMongoId()];
const id = [param('id').isMongoId()];

const rules = [
  body('date').isISO8601().withMessage('Valid date required.'),
  body('litres').isFloat({ min: 0.1 }).withMessage('Litres must be > 0.'),
  body('pricePerLitre').isFloat({ min: 0 }).withMessage('Price must be non-negative.'),
  body('odometer').isFloat({ min: 0 }).withMessage('Odometer must be non-negative.'),
  body('fullTank').optional().isBoolean(),
];

router.get('/:vehicleId/fuel', vehicleId, validate, paginate, getFuelLogs);
router.post('/:vehicleId/fuel', [...vehicleId, ...rules], validate, createFuelLog);
router.put('/:vehicleId/fuel/:id', [...vehicleId, ...id, ...rules], validate, updateFuelLog);
router.delete('/:vehicleId/fuel/:id', [...vehicleId, ...id], validate, deleteFuelLog);

export default router;
