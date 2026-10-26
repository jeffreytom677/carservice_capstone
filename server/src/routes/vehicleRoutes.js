import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getVehicles,
  createVehicle,
  getVehicle,
  updateVehicle,
  archiveVehicle,
} from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, paginate } from '../middleware/validationMiddleware.js';

const router = Router();

// All vehicle routes require authentication
router.use(protect);

const vehicleRules = [
  body('make').trim().notEmpty().withMessage('Make is required.'),
  body('model').trim().notEmpty().withMessage('Model is required.'),
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Year must be a valid 4-digit year.'),
  body('regNumber').trim().notEmpty().withMessage('Registration number is required.'),
  body('odometer').optional().isFloat({ min: 0 }).withMessage('Odometer must be a non-negative number.'),
];

const idParam = [param('id').isMongoId().withMessage('Invalid vehicle ID.')];

router.get('/', paginate, getVehicles);
router.post('/', vehicleRules, validate, createVehicle);
router.get('/:id', idParam, validate, getVehicle);
router.put('/:id', idParam, vehicleRules, validate, updateVehicle);
router.patch('/:id/archive', idParam, validate, archiveVehicle);

export default router;
