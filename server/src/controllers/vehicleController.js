import Vehicle from '../models/Vehicle.js';
import { createError } from '../middleware/errorMiddleware.js';

// ── GET /api/vehicles ─────────────────────────────────────────────────────────
export const getVehicles = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const includeArchived = req.query.includeArchived === 'true';

    const filter = {
      owner: req.user._id,
      ...(includeArchived ? {} : { isArchived: false }),
    };

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Vehicle.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: vehicles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/vehicles ────────────────────────────────────────────────────────
export const createVehicle = async (req, res, next) => {
  try {
    const { make, model, year, regNumber, odometer } = req.body;

    // Check for duplicate reg number for this owner
    const existing = await Vehicle.findOne({
      owner: req.user._id,
      regNumber: regNumber.toUpperCase(),
    });
    if (existing) {
      throw createError(409, `Registration number ${regNumber.toUpperCase()} already exists.`);
    }

    const vehicle = await Vehicle.create({
      owner: req.user._id,
      make,
      model,
      year,
      regNumber,
      odometer: odometer || 0,
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/vehicles/:id ─────────────────────────────────────────────────────
export const getVehicle = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, owner: req.user._id };
    const vehicle = await Vehicle.findOne(filter);
    if (!vehicle) throw createError(404, 'Vehicle not found.');
    res.json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/vehicles/:id ─────────────────────────────────────────────────────
export const updateVehicle = async (req, res, next) => {
  try {
    const { make, model, year, regNumber, odometer } = req.body;
    const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) throw createError(404, 'Vehicle not found.');

    // If reg number is changing, check for conflicts
    if (regNumber && regNumber.toUpperCase() !== vehicle.regNumber) {
      const conflict = await Vehicle.findOne({
        owner: req.user._id,
        regNumber: regNumber.toUpperCase(),
        _id: { $ne: vehicle._id },
      });
      if (conflict) throw createError(409, `Registration number ${regNumber.toUpperCase()} already exists.`);
    }

    Object.assign(vehicle, { make, model, year, regNumber, odometer });
    await vehicle.save();

    res.json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/vehicles/:id/archive ──────────────────────────────────────────
export const archiveVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) throw createError(404, 'Vehicle not found.');
    if (vehicle.isArchived) throw createError(400, 'Vehicle is already archived.');

    vehicle.isArchived = true;
    await vehicle.save();

    res.json({ success: true, data: vehicle, message: 'Vehicle archived successfully.' });
  } catch (err) {
    next(err);
  }
};
