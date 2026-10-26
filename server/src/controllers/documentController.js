import Document from '../models/Document.js';
import Vehicle from '../models/Vehicle.js';
import { createError } from '../middleware/errorMiddleware.js';

const requireOwnership = async (vehicleId, userId) => {
  const v = await Vehicle.findOne({ _id: vehicleId, owner: userId });
  if (!v) throw createError(403, 'Vehicle not found or access denied.');
  return v;
};

// GET /api/vehicles/:vehicleId/documents
export const getDocuments = async (req, res, next) => {
  try {
    await requireOwnership(req.params.vehicleId, req.user._id);
    const docs = await Document.find({ vehicle: req.params.vehicleId }).sort({ expiryDate: 1 });
    // expiryStatus virtual is included via toJSON
    res.json({ success: true, data: docs });
  } catch (err) { next(err); }
};

// POST /api/vehicles/:vehicleId/documents
export const createDocument = async (req, res, next) => {
  try {
    await requireOwnership(req.params.vehicleId, req.user._id);
    const { type, expiryDate } = req.body;
    const doc = await Document.create({ vehicle: req.params.vehicleId, type, expiryDate });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

// PUT /api/vehicles/:vehicleId/documents/:id
export const updateDocument = async (req, res, next) => {
  try {
    await requireOwnership(req.params.vehicleId, req.user._id);
    const doc = await Document.findOne({ _id: req.params.id, vehicle: req.params.vehicleId });
    if (!doc) throw createError(404, 'Document not found.');
    const { type, expiryDate } = req.body;
    Object.assign(doc, { type, expiryDate });
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

// DELETE /api/vehicles/:vehicleId/documents/:id
export const deleteDocument = async (req, res, next) => {
  try {
    await requireOwnership(req.params.vehicleId, req.user._id);
    const doc = await Document.findOneAndDelete({ _id: req.params.id, vehicle: req.params.vehicleId });
    if (!doc) throw createError(404, 'Document not found.');
    res.status(204).send();
  } catch (err) { next(err); }
};
