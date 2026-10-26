import Vehicle from '../models/Vehicle.js';
import ServiceRecord from '../models/ServiceRecord.js';
import FuelLog from '../models/FuelLog.js';

// GET /api/analytics/spend-by-month
export const spendByMonth = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const vehicles = await Vehicle.find({ owner: userId }).select('_id');
    const vehicleIds = vehicles.map((v) => v._id);

    // Optional single-vehicle filter
    const vehicleFilter = req.query.vehicleId
      ? [new (await import('mongoose')).default.Types.ObjectId(req.query.vehicleId)]
      : vehicleIds;

    const data = await ServiceRecord.aggregate([
      {
        $match: {
          vehicle: { $in: vehicleFilter },
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$date' } },
          totalSpend: { $sum: '$cost' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          totalSpend: 1,
          count: 1,
        },
      },
    ]);

    // Fill in months with 0 spend
    const filled = Array.from({ length: 12 }, (_, i) => {
      const found = data.find((d) => d.month === i + 1);
      return found ?? { month: i + 1, totalSpend: 0, count: 0 };
    });

    res.json({ success: true, data: filled, year });
  } catch (err) { next(err); }
};

// GET /api/analytics/spend-by-type
export const spendByType = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const vehicles = await Vehicle.find({ owner: userId }).select('_id');
    const vehicleIds = req.query.vehicleId
      ? [(await import('mongoose')).default.Types.ObjectId.createFromHexString(req.query.vehicleId)]
      : vehicles.map((v) => v._id);

    const data = await ServiceRecord.aggregate([
      { $match: { vehicle: { $in: vehicleIds } } },
      {
        $group: {
          _id: '$serviceType',
          totalSpend: { $sum: '$cost' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'servicetypes',
          localField: '_id',
          foreignField: '_id',
          as: 'type',
        },
      },
      { $unwind: '$type' },
      {
        $project: {
          _id: 0,
          serviceTypeId: '$_id',
          name: '$type.name',
          totalSpend: 1,
          count: 1,
        },
      },
      { $sort: { totalSpend: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/analytics/cost-per-km
export const costPerKm = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const vehicles = await Vehicle.find({ owner: userId }).select('_id make model regNumber odometer');

    const results = await Promise.all(
      vehicles.map(async (vehicle) => {
        const records = await ServiceRecord.find({ vehicle: vehicle._id })
          .sort({ odometerAtService: 1 })
          .select('odometerAtService cost');

        if (records.length < 2) {
          return {
            vehicleId: vehicle._id,
            make: vehicle.make,
            model: vehicle.model,
            regNumber: vehicle.regNumber,
            totalSpend: records.reduce((s, r) => s + r.cost, 0),
            totalKm: 0,
            costPerKm: null,
          };
        }

        const totalSpend = records.reduce((s, r) => s + r.cost, 0);
        const totalKm = records[records.length - 1].odometerAtService - records[0].odometerAtService;
        return {
          vehicleId: vehicle._id,
          make: vehicle.make,
          model: vehicle.model,
          regNumber: vehicle.regNumber,
          totalSpend,
          totalKm,
          costPerKm: totalKm > 0 ? parseFloat((totalSpend / totalKm).toFixed(2)) : null,
        };
      })
    );

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};
