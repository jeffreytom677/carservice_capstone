import mongoose from 'mongoose';

/**
 * Document — an expiry-tracked document attached to a vehicle (e.g. insurance, PUC).
 *
 * expiryStatus (valid / expiring-soon / expired) is derived at read time so we
 * never need to run a migration when the current date changes.
 */
const documentSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['insurance', 'PUC', 'licence', 'other'],
      required: [true, 'Document type is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
  },
  { timestamps: true }
);

/**
 * Virtual: compute expiry status on the fly.
 * 'expiring-soon' = within the next 30 days.
 */
documentSchema.virtual('expiryStatus').get(function () {
  const now = new Date();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (this.expiryDate < now) return 'expired';
  if (this.expiryDate - now <= thirtyDays) return 'expiring-soon';
  return 'valid';
});

documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Document', documentSchema);
