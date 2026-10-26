import mongoose from 'mongoose';

/**
 * Garage — a workshop or service centre saved by a user.
 *
 * Referenced from ServiceRecord (not embedded) because:
 *  - A user may visit the same garage many times; referencing avoids duplication.
 *  - Garage details (phone, rating) may be updated independently.
 */
const garageSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Garage name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Garage', garageSchema);
