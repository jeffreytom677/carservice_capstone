import ServiceType from '../models/ServiceType.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { createError } from '../middleware/errorMiddleware.js';

/** Helper: write an audit log entry */
const audit = (actor, action, entity, entityId) =>
  AuditLog.create({ actor, action, entity, entityId }).catch(console.error);

// ── Service Types ─────────────────────────────────────────────────────────────

export const getServiceTypes = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const showInactive = req.user?.role === 'admin' && req.query.showInactive === 'true';
    const filter = showInactive ? {} : { isActive: true };

    const [types, total] = await Promise.all([
      ServiceType.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      ServiceType.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: types,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

export const createServiceType = async (req, res, next) => {
  try {
    const { name, defaultIntervalKm, defaultIntervalDays } = req.body;
    const existing = await ServiceType.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) throw createError(409, `Service type "${name}" already exists.`);

    const type = await ServiceType.create({ name, defaultIntervalKm, defaultIntervalDays });
    await audit(req.user._id, 'SERVICE_TYPE_CREATED', 'ServiceType', type._id);

    res.status(201).json({ success: true, data: type });
  } catch (err) {
    next(err);
  }
};

export const updateServiceType = async (req, res, next) => {
  try {
    const { name, defaultIntervalKm, defaultIntervalDays, isActive } = req.body;
    const type = await ServiceType.findById(req.params.id);
    if (!type) throw createError(404, 'Service type not found.');

    Object.assign(type, { name, defaultIntervalKm, defaultIntervalDays, isActive });
    await type.save();
    await audit(req.user._id, 'SERVICE_TYPE_UPDATED', 'ServiceType', type._id);

    res.json({ success: true, data: type });
  } catch (err) {
    next(err);
  }
};

export const deleteServiceType = async (req, res, next) => {
  try {
    const type = await ServiceType.findById(req.params.id);
    if (!type) throw createError(404, 'Service type not found.');

    // Soft-delete: preserve referential integrity in existing service records
    type.isActive = false;
    await type.save();
    await audit(req.user._id, 'SERVICE_TYPE_DEACTIVATED', 'ServiceType', type._id);

    res.json({ success: true, message: 'Service type deactivated.' });
  } catch (err) {
    next(err);
  }
};

// ── User Management ───────────────────────────────────────────────────────────

export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);
    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

export const setUserActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req; // set by the route handler
    const user = await User.findById(id);
    if (!user) throw createError(404, 'User not found.');
    if (user.role === 'admin') throw createError(403, 'Cannot deactivate another admin.');

    user.isActive = isActive;
    await user.save();
    await audit(
      req.user._id,
      isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      'User',
      user._id
    );

    res.json({ success: true, data: user, message: `User ${isActive ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    next(err);
  }
};

// ── Admin Stats ───────────────────────────────────────────────────────────────

export const getAdminStats = async (req, res, next) => {
  try {
    const [userCount, vehicleCount, serviceCount, spendAgg] = await Promise.all([
      User.countDocuments(),
      (await import('../models/Vehicle.js')).default.countDocuments(),
      (await import('../models/ServiceRecord.js')).default.countDocuments(),
      (await import('../models/ServiceRecord.js')).default.aggregate([
        { $group: { _id: null, total: { $sum: '$cost' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        userCount,
        vehicleCount,
        serviceCount,
        totalSpend: spendAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Audit Log ─────────────────────────────────────────────────────────────────

export const getAuditLog = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('actor', 'name email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(),
    ]);
    res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};
