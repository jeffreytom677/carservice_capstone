import { Router } from 'express';
import { body, param } from 'express-validator';
import { getGarages, createGarage, getGarage, updateGarage, deleteGarage } from '../controllers/garageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, paginate } from '../middleware/validationMiddleware.js';

const router = Router();
router.use(protect);

const id = [param('id').isMongoId().withMessage('Invalid garage ID.')];

const rules = [
  body('name').trim().notEmpty().withMessage('Garage name is required.'),
  body('phone').optional().isString(),
  body('location').optional().isString(),
  body('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
  body('notes').optional().isString(),
];

router.get('/', paginate, getGarages);
router.post('/', rules, validate, createGarage);
router.get('/:id', id, validate, getGarage);
router.put('/:id', [...id, ...rules], validate, updateGarage);
router.delete('/:id', id, validate, deleteGarage);

export default router;
