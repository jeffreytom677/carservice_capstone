import mongoose from 'mongoose';

/**
 * Vehicle — a user's registered vehicle.
 *
 * owner is referenced (not embedded) because:
 *  - Vehicles have their own independent lifecycle (archive, history export).
 *  - The fleet list, analytics, and reminders all query vehicles as top-level documents.
 *  - Embedding vehicles inside the User document would exceed the 16 MB BSON limit
 *    for users with a large service history.
 */
const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    make: {
      type: String,
      required: [true, 'Make is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1900, 'Year must be 1900 or later'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
    regNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
      uppercase: true,
    },
    odometer: {
      type: Number,
      default: 0,
      min: [0, 'Odometer cannot be negative'],
    },
    // Soft-delete: archiving preserves service history while hiding the vehicle from the active fleet
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound unique index: same registration number is allowed for different users
vehicleSchema.index({ owner: 1, regNumber: 1 }, { unique: true });

export default mongoose.model('Vehicle', vehicleSchema);
