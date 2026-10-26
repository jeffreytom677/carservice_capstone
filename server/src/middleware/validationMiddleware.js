import { validationResult } from 'express-validator';

/**
 * validate — runs after express-validator check() chains.
 * If any validation errors exist it returns 400 immediately;
 * otherwise it calls next() to continue to the controller.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

/**
 * paginate — attaches { page, limit, skip } to req.pagination.
 * Enforces a max limit of 50 to prevent large data dumps.
 */
export const paginate = (req, _res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  req.pagination = { page, limit, skip: (page - 1) * limit };
  next();
};
