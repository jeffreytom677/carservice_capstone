import Vehicle from '../models/Vehicle.js';
import ServiceRecord from '../models/ServiceRecord.js';

// ── GET /api/dashboard ────────────────────────────────────────────────────────
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all active vehicles for this user
    const vehicles = await Vehicle.find({ owner: userId, isArchived: false }).select('_id odometer');
    const vehicleIds = vehicles.map((v) => v._id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          upcomingServices: [],
          overdueServices: [],
          totalSpend: 0,
          vehicleCount: 0,
        },
      });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Build a map of current odometers keyed by vehicle id
    const odometerMap = {};
    vehicles.forEach((v) => { odometerMap[String(v._id)] = v.odometer; });

    // Fetch all service records with future due dates or km
    const allDueRecords = await ServiceRecord.find({
      vehicle: { $in: vehicleIds },
      $or: [
        { nextDueDate: { $exists: true, $ne: null } },
        { nextDueKm: { $exists: true, $ne: null } },
      ],
    })
      .populate('vehicle', 'make model regNumber odometer')
      .populate('serviceType', 'name')
      .sort({ nextDueDate: 1 });

    // Deduplicate: only keep the most recent record per vehicle+serviceType pair
    const seen = new Set();
    const deduped = [];
    for (const record of allDueRecords) {
      const key = `${record.vehicle._id}-${record.serviceType._id}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(record);
      }
    }

    const upcomingServices = [];
    const overdueServices = [];

    for (const record of deduped) {
      const currentOdometer = odometerMap[String(record.vehicle._id)] || 0;
      const kmRemaining = record.nextDueKm ? record.nextDueKm - currentOdometer : Infinity;
      const dateOverdue = record.nextDueDate ? record.nextDueDate < now : false;
      const dateSoon = record.nextDueDate ? record.nextDueDate <= sevenDaysFromNow && !dateOverdue : false;
      const kmSoon = kmRemaining <= 500 && kmRemaining > 0;
      const kmOverdue = kmRemaining <= 0;

      const item = {
        serviceRecordId: record._id,
        vehicle: record.vehicle,
        serviceType: record.serviceType,
        nextDueDate: record.nextDueDate,
        nextDueKm: record.nextDueKm,
        kmRemaining: record.nextDueKm ? kmRemaining : null,
      };

      if (dateOverdue || kmOverdue) {
        overdueServices.push(item);
      } else if (dateSoon || kmSoon) {
        upcomingServices.push(item);
      }
    }

    // Total spend for this user across all vehicles
    const spendAgg = await ServiceRecord.aggregate([
      { $match: { vehicle: { $in: vehicleIds } } },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);
    const totalSpend = spendAgg[0]?.total || 0;

    res.json({
      success: true,
      data: {
        upcomingServices,
        overdueServices,
        totalSpend,
        vehicleCount: vehicleIds.length,
      },
    });
  } catch (err) {
    next(err);
  }
};
