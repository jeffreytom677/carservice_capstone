import { Router } from 'express';
import { param } from 'express-validator';
import { getNotifications, markOneRead, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, paginate } from '../middleware/validationMiddleware.js';

const router = Router();
router.use(protect);

router.get('/', paginate, getNotifications);
router.patch('/read-all', markAllRead);                              // must be before /:id
router.patch('/:id/read', [param('id').isMongoId()], validate, markOneRead);

export default router;
