import mongoose from 'mongoose';

/**
 * FuelLog — tracks fuel fill-ups for a vehicle.
 *
 * km/l efficiency is NOT stored — it is computed at read time from two consecutive
 * full-tank odometer readings to avoid stale data.
 */
const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    litres: {
      type: Number,
      required: [true, 'Litres is required'],
      min: [0.1, 'Litres must be greater than 0'],
    },
    pricePerLitre: {
      type: Number,
      required: [true, 'Price per litre is required'],
      min: [0, 'Price cannot be negative'],
    },
    odometer: {
      type: Number,
      required: [true, 'Odometer reading is required'],
      min: [0, 'Odometer cannot be negative'],
    },
    fullTank: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

fuelLogSchema.index({ vehicle: 1, date: -1 });

export default mongoose.model('FuelLog', fuelLogSchema);
