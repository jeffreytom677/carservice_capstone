import { Router } from 'express';
import { spendByMonth, spendByType, costPerKm } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/spend-by-month', spendByMonth);
router.get('/spend-by-type', spendByType);
router.get('/cost-per-km', costPerKm);

export default router;
