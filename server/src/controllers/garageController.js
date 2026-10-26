import Garage from '../models/Garage.js';
import { createError } from '../middleware/errorMiddleware.js';

// GET /api/garages
export const getGarages = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const [garages, total] = await Promise.all([
      Garage.find({ owner: req.user._id }).sort({ name: 1 }).skip(skip).limit(limit),
      Garage.countDocuments({ owner: req.user._id }),
    ]);
    res.json({
      success: true,
      data: garages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// POST /api/garages
export const createGarage = async (req, res, next) => {
  try {
    const { name, phone, location, rating, notes } = req.body;
    const garage = await Garage.create({ owner: req.user._id, name, phone, location, rating, notes });
    res.status(201).json({ success: true, data: garage });
  } catch (err) { next(err); }
};

// GET /api/garages/:id
export const getGarage = async (req, res, next) => {
  try {
    const garage = await Garage.findOne({ _id: req.params.id, owner: req.user._id });
    if (!garage) throw createError(404, 'Garage not found.');
    res.json({ success: true, data: garage });
  } catch (err) { next(err); }
};

// PUT /api/garages/:id
export const updateGarage = async (req, res, next) => {
  try {
    const garage = await Garage.findOne({ _id: req.params.id, owner: req.user._id });
    if (!garage) throw createError(404, 'Garage not found.');
    const { name, phone, location, rating, notes } = req.body;
    Object.assign(garage, { name, phone, location, rating, notes });
    await garage.save();
    res.json({ success: true, data: garage });
  } catch (err) { next(err); }
};

// DELETE /api/garages/:id
export const deleteGarage = async (req, res, next) => {
  try {
    const garage = await Garage.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!garage) throw createError(404, 'Garage not found.');
    res.status(204).send();
  } catch (err) { next(err); }
};
