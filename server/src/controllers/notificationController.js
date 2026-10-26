import Notification from '../models/Notification.js';
import { createError } from '../middleware/errorMiddleware.js';

// GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const unreadOnly = req.query.unreadOnly === 'true';
    const filter = { user: req.user._id, ...(unreadOnly ? { isRead: false } : {}) };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('relatedVehicle', 'make model regNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/:id/read
export const markOneRead = async (req, res, next) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!n) throw createError(404, 'Notification not found.');
    n.isRead = true;
    await n.save();
    res.json({ success: true, data: n });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
};
