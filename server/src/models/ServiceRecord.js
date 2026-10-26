import mongoose from 'mongoose';

/**
 * ServiceRecord — a single maintenance event for a vehicle.
 *
 * Relations:
 *  vehicle     → referenced: one vehicle has many records; queried as a list.
 *  serviceType → referenced: shared catalogue that changes independently of records.
 *  garage      → referenced (optional): garages are managed separately and reused across records.
 *  parts       → EMBEDDED: parts belong entirely to this service event and are never queried alone.
 *                Embedding avoids a join for the most common read (show full service detail).
 */
const partSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: [0, 'Part price cannot be negative'] },
  },
  { _id: false } // Parts are embedded sub-documents; no need for their own ObjectId
);

const serviceRecordSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    serviceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceType',
      required: [true, 'Service type is required'],
    },
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Garage',
    },
    date: {
      type: Date,
      required: [true, 'Service date is required'],
    },
    odometerAtService: {
      type: Number,
      required: [true, 'Odometer reading is required'],
      min: [0, 'Odometer cannot be negative'],
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
    },
    parts: [partSchema],
    // Stored path/URL after multer upload; null if no receipt attached
    receiptUrl: String,
    // Auto-calculated from serviceType.defaultIntervalKm + odometerAtService
    nextDueKm: Number,
    // Auto-calculated from serviceType.defaultIntervalDays + date
    nextDueDate: Date,
  },
  { timestamps: true }
);

// Compound index: most queries filter by vehicle then sort by date
serviceRecordSchema.index({ vehicle: 1, date: -1 });

export default mongoose.model('ServiceRecord', serviceRecordSchema);
