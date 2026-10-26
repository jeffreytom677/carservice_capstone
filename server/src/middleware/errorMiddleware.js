/**
 * notFound — catches requests that did not match any route.
 */
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * errorHandler — central error handling middleware.
 *
 * Rules:
 *  - Never expose the stack trace in the response (it reveals internals).
 *  - Always return the consistent JSON shape: { success, message, errors? }.
 *  - Log the full error server-side for debugging.
 */
export const errorHandler = (err, req, res, _next) => {
  // Log full error internally
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}.`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}.` });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'An internal server error occurred.' : err.message,
  });
};

/**
 * createError — helper for throwing HTTP errors from controllers.
 * Usage: throw createError(404, 'Vehicle not found');
 */
export const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};
