import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  getUsers,
  setUserActive,
  getAdminStats,
  getAuditLog,
} from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import { validate, paginate } from '../middleware/validationMiddleware.js';

const router = Router();

// ── Service Types ─────────────────────────────────────────────────────────────
const serviceTypeRules = [
  body('name').trim().notEmpty().withMessage('Service type name is required.'),
  body('defaultIntervalKm').optional().isFloat({ min: 0 }).withMessage('Interval km must be non-negative.'),
  body('defaultIntervalDays').optional().isFloat({ min: 0 }).withMessage('Interval days must be non-negative.'),
];

// Any authenticated user can read active service types (needed to log services)
router.get('/service-types', protect, paginate, getServiceTypes);

// All other admin routes require authentication AND admin role
router.use(protect, requireAdmin);

router.post('/service-types', serviceTypeRules, validate, createServiceType);
router.put('/service-types/:id', [param('id').isMongoId()], serviceTypeRules, validate, updateServiceType);
router.delete('/service-types/:id', [param('id').isMongoId()], validate, deleteServiceType);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', paginate, getUsers);

// Activate — attach isActive:true to req so the controller is reusable
router.patch('/users/:id/activate', [param('id').isMongoId()], validate, (req, _res, next) => {
  req.isActive = true;
  next();
}, setUserActive);

// Deactivate
router.patch('/users/:id/deactivate', [param('id').isMongoId()], validate, (req, _res, next) => {
  req.isActive = false;
  next();
}, setUserActive);

// ── Stats & Audit ─────────────────────────────────────────────────────────────
router.get('/stats', getAdminStats);
router.get('/audit-log', paginate, getAuditLog);

export default router;
