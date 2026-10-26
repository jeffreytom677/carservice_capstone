import ServiceRecord from '../models/ServiceRecord.js';
import Vehicle from '../models/Vehicle.js';
import ServiceType from '../models/ServiceType.js';
import { createError } from '../middleware/errorMiddleware.js';

/** Resolve and verify vehicle ownership */
const requireVehicleOwnership = async (vehicleId, userId, userRole) => {
  const filter = userRole === 'admin' ? { _id: vehicleId } : { _id: vehicleId, owner: userId };
  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) throw createError(403, 'Vehicle not found or access denied.');
  return vehicle;
};

// ── GET /api/vehicles/:vehicleId/services ─────────────────────────────────────
export const getServiceRecords = async (req, res, next) => {
  try {
    await requireVehicleOwnership(req.params.vehicleId, req.user._id, req.user.role);

    const { page, limit, skip } = req.pagination;
    const { serviceType, dateFrom, dateTo, costMin, costMax, sortBy = 'date', order = 'desc' } = req.query;

    const filter = { vehicle: req.params.vehicleId };
    if (serviceType) filter.serviceType = serviceType;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }
    if (costMin || costMax) {
      filter.cost = {};
      if (costMin) filter.cost.$gte = parseFloat(costMin);
      if (costMax) filter.cost.$lte = parseFloat(costMax);
    }

    const sortDir = order === 'asc' ? 1 : -1;
    const sortField = ['date', 'cost', 'odometerAtService'].includes(sortBy) ? sortBy : 'date';

    const [records, total] = await Promise.all([
      ServiceRecord.find(filter)
        .populate('serviceType', 'name defaultIntervalKm defaultIntervalDays')
        .populate('garage', 'name phone')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
      ServiceRecord.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/vehicles/:vehicleId/services ────────────────────────────────────
export const createServiceRecord = async (req, res, next) => {
  try {
    const vehicle = await requireVehicleOwnership(req.params.vehicleId, req.user._id, req.user.role);

    if (vehicle.isArchived) {
      throw createError(400, 'Cannot add service records to an archived vehicle.');
    }

    const { serviceType: serviceTypeId, garage, date, odometerAtService, cost, notes, parts } = req.body;

    if (cost < 0) throw createError(400, 'Cost cannot be negative.');

    // Business rule: odometer must not decrease from the previous record
    const lastRecord = await ServiceRecord.findOne({ vehicle: req.params.vehicleId })
      .sort({ odometerAtService: -1 })
      .select('odometerAtService');

    if (lastRecord && odometerAtService < lastRecord.odometerAtService) {
      throw createError(
        400,
        `Odometer (${odometerAtService}) cannot be lower than the previous reading (${lastRecord.odometerAtService}).`
      );
    }

    // Auto-calculate next due dates from service type intervals
    const serviceType = await ServiceType.findById(serviceTypeId);
    if (!serviceType || !serviceType.isActive) {
      throw createError(400, 'Invalid or inactive service type.');
    }

    const serviceDate = new Date(date);
    const nextDueKm = serviceType.defaultIntervalKm
      ? odometerAtService + serviceType.defaultIntervalKm
      : undefined;
    const nextDueDate = serviceType.defaultIntervalDays
      ? new Date(serviceDate.getTime() + serviceType.defaultIntervalDays * 24 * 60 * 60 * 1000)
      : undefined;

    const record = await ServiceRecord.create({
      vehicle: req.params.vehicleId,
      serviceType: serviceTypeId,
      garage: garage || undefined,
      date: serviceDate,
      odometerAtService,
      cost,
      notes,
      parts: parts || [],
      nextDueKm,
      nextDueDate,
    });

    // Update the vehicle's odometer if this is a higher reading
    if (odometerAtService > vehicle.odometer) {
      vehicle.odometer = odometerAtService;
      await vehicle.save();
    }

    const populated = await record.populate('serviceType', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/vehicles/:vehicleId/services/:id ─────────────────────────────────
export const getServiceRecord = async (req, res, next) => {
  try {
    await requireVehicleOwnership(req.params.vehicleId, req.user._id, req.user.role);
    const record = await ServiceRecord.findOne({
      _id: req.params.id,
      vehicle: req.params.vehicleId,
    })
      .populate('serviceType', 'name defaultIntervalKm defaultIntervalDays')
      .populate('garage', 'name phone location');

    if (!record) throw createError(404, 'Service record not found.');
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/vehicles/:vehicleId/services/:id ─────────────────────────────────
export const updateServiceRecord = async (req, res, next) => {
  try {
    await requireVehicleOwnership(req.params.vehicleId, req.user._id, req.user.role);
    const { cost, notes, parts, garage } = req.body;

    if (cost !== undefined && cost < 0) throw createError(400, 'Cost cannot be negative.');

    const record = await ServiceRecord.findOne({ _id: req.params.id, vehicle: req.params.vehicleId });
    if (!record) throw createError(404, 'Service record not found.');

    if (cost !== undefined) record.cost = cost;
    if (notes !== undefined) record.notes = notes;
    if (parts !== undefined) record.parts = parts;
    if (garage !== undefined) record.garage = garage;

    await record.save();
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/vehicles/:vehicleId/services/:id ──────────────────────────────
export const deleteServiceRecord = async (req, res, next) => {
  try {
    await requireVehicleOwnership(req.params.vehicleId, req.user._id, req.user.role);
    const record = await ServiceRecord.findOneAndDelete({
      _id: req.params.id,
      vehicle: req.params.vehicleId,
    });
    if (!record) throw createError(404, 'Service record not found.');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
