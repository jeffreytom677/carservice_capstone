import FuelLog from '../models/FuelLog.js';
import Vehicle from '../models/Vehicle.js';
import { createError } from '../middleware/errorMiddleware.js';

const requireOwnership = async (vehicleId, userId) => {
  const v = await Vehicle.findOne({ _id: vehicleId, owner: userId });
  if (!v) throw createError(403, 'Vehicle not found or access denied.');
  return v;
};

// GET /api/vehicles/:vehicleId/fuel
export const getFuelLogs = async (req, res, next) => {
  try {
    await requireOwnership(req.params.vehicleId, req.user._id);
    const { page, limit, skip } = req.pagination;

    const filter = { vehicle: req.params.vehicleId };
    const [logs, total] = await Promise.all([
      FuelLog.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      FuelLog.countDocuments(filter),
    ]);

    // Compute km/l for full-tank consecutive pairs
    const allLogs = await FuelLog.find({ vehicle: req.params.vehicleId, fullTank: true }).sort({ odometer: 1 });
    const efficiencyMap = {};
    for (let i = 1; i < allLogs.length; i++) {
      const km = allLogs[i].odometer - allLogs[i - 1].odometer;
      const litres = allLogs[i].litres;
      if (km > 0 && litres > 0) {
        efficiencyMap[String(allLogs[i]._id)] = parseFloat((km / litres).toFixed(2));
      }
    }

    const enriched = logs.map((l) => ({
      ...l.toObject(),
      kmPerLitre: efficiencyMap[String(l._id)] ?? null,
      totalCost: parseFloat((l.litres * l.pricePerLitre).toFixed(2)),
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// POST /api/vehicles/:vehicleId/fuel
export const createFuelLog = async (req, res, next) => {
  try {
    const vehicle = await requireOwnership(req.params.vehicleId, req.user._id);
    if (vehicle.isArchived) throw createError(400, 'Cannot add fuel logs to an archived vehicle.');

    const { date, litres, pricePerLitre, odometer, fullTank } = req.body;

    const log = await FuelLog.create({
      vehicle: req.params.vehicleId,
      date, litres, pricePerLitre, odometer,
      fullTank: fullTank !== false,
    });

    if (odometer > vehicle.odometer) {
      vehicle.odometer = odometer;
      await vehicle.save();
    }

    res.status(201).json({ success: true, data: log });
  } catch (err) { next(err); }
};

// PUT /api/vehicles/:vehicleId/fuel/:id
export const updateFuelLog = async (req, res, next) => {
  try {
    await requireOwnership(req.params.vehicleId, req.user._id);
    const log = await FuelLog.findOne({ _id: req.params.id, vehicle: req.params.vehicleId });
    if (!log) throw createError(404, 'Fuel log not found.');

    const { date, litres, pricePerLitre, odometer, fullTank } = req.body;
    Object.assign(log, { date, litres, pricePerLitre, odometer, fullTank });
    await log.save();

    res.json({ success: true, data: log });
  } catch (err) { next(err); }
};

// DELETE /api/vehicles/:vehicleId/fuel/:id
export const deleteFuelLog = async (req, res, next) => {
  try {
    await requireOwnership(req.params.vehicleId, req.user._id);
    const log = await FuelLog.findOneAndDelete({ _id: req.params.id, vehicle: req.params.vehicleId });
    if (!log) throw createError(404, 'Fuel log not found.');
    res.status(204).send();
  } catch (err) { next(err); }
};
