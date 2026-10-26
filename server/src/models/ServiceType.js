import mongoose from 'mongoose';

/**
 * ServiceType — admin-managed catalogue of maintenance categories.
 *
 * Referenced from ServiceRecord (not embedded) because:
 *  1. The catalogue is shared across all users and changes independently.
 *  2. Admins can update or deactivate a type without touching existing records.
 *  3. Querying "all oil-change records" is practical via a simple find({ serviceType: id }).
 */
const serviceTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service type name is required'],
      unique: true,
      trim: true,
    },
    // Optional; if set, the next-due km is auto-calculated when logging a service
    defaultIntervalKm: {
      type: Number,
      min: [0, 'Interval km cannot be negative'],
    },
    // Optional; if set, the next-due date is auto-calculated when logging a service
    defaultIntervalDays: {
      type: Number,
      min: [0, 'Interval days cannot be negative'],
    },
    // Soft-delete: records referencing a deactivated type are preserved
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ServiceType', serviceTypeSchema);
