import cron from 'node-cron';
import Vehicle from '../models/Vehicle.js';
import ServiceRecord from '../models/ServiceRecord.js';
import Document from '../models/Document.js';
import Notification from '../models/Notification.js';

/**
 * Reminder engine — runs daily at 08:00.
 *
 * Creates in-app notifications for:
 *   1. Service records due within 7 days OR within 500 km
 *   2. Documents expiring within 30 days
 *
 * Deduplication: we skip creating a notification if an unread one
 * for the same vehicle+type already exists (prevents spam on re-runs).
 */
export function startReminderCron() {
  // Run at 08:00 every day
  cron.schedule('0 8 * * *', runReminders, { timezone: 'Asia/Kolkata' });

  // Also run once on startup in development so you can test immediately
  if (process.env.NODE_ENV === 'development') {
    console.log('⏰  Running reminder check on startup (dev mode)…');
    runReminders();
  }

  console.log('⏰  Reminder cron scheduled: 08:00 Asia/Kolkata daily');
}

async function runReminders() {
  try {
    await checkServiceReminders();
    await checkDocumentReminders();
    console.log(`✅  Reminder check complete [${new Date().toISOString()}]`);
  } catch (err) {
    console.error('❌  Reminder cron error:', err.message);
  }
}

// ── Service reminders ─────────────────────────────────────────────────────────
async function checkServiceReminders() {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const KM_THRESHOLD = 500;

  // Fetch all active vehicles with their owner
  const vehicles = await Vehicle.find({ isArchived: false }).select('_id owner make model regNumber odometer');

  for (const vehicle of vehicles) {
    // Get the most recent record for each service type for this vehicle
    const latestRecords = await ServiceRecord.aggregate([
      { $match: { vehicle: vehicle._id } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$serviceType',
          record: { $first: '$$ROOT' },
        },
      },
    ]);

    for (const { record } of latestRecords) {
      if (!record.nextDueDate && !record.nextDueKm) continue;

      const dateDueSoon = record.nextDueDate && record.nextDueDate <= sevenDaysLater && record.nextDueDate >= now;
      const dateOverdue = record.nextDueDate && record.nextDueDate < now;
      const kmRemaining = record.nextDueKm ? record.nextDueKm - vehicle.odometer : Infinity;
      const kmDueSoon = kmRemaining <= KM_THRESHOLD && kmRemaining > 0;
      const kmOverdue = record.nextDueKm && kmRemaining <= 0;

      if (!dateDueSoon && !dateOverdue && !kmDueSoon && !kmOverdue) continue;

      // Build message
      let message;
      if (dateOverdue || kmOverdue) {
        message = `⚠️ Service overdue for ${vehicle.make} ${vehicle.model} (${vehicle.regNumber}). Please book soon.`;
      } else if (dateDueSoon && kmDueSoon) {
        message = `🔧 Service due soon for ${vehicle.make} ${vehicle.model} — within ${Math.ceil((record.nextDueDate - now) / 86400000)} days and ${kmRemaining} km.`;
      } else if (dateDueSoon) {
        const days = Math.ceil((record.nextDueDate - now) / 86400000);
        message = `🔧 Service due in ${days} day${days !== 1 ? 's' : ''} for ${vehicle.make} ${vehicle.model} (${vehicle.regNumber}).`;
      } else {
        message = `🔧 Service due in ${kmRemaining} km for ${vehicle.make} ${vehicle.model} (${vehicle.regNumber}).`;
      }

      // Deduplication: skip if an unread notification with same message prefix exists
      const alreadyExists = await Notification.exists({
        user: vehicle.owner,
        relatedVehicle: vehicle._id,
        type: 'service_due',
        isRead: false,
        // Match on vehicle so one per vehicle per service type per run is enough
        message: { $regex: vehicle.regNumber },
      });

      if (!alreadyExists) {
        await Notification.create({
          user: vehicle.owner,
          message,
          type: 'service_due',
          relatedVehicle: vehicle._id,
        });
      }
    }
  }
}

// ── Document reminders ────────────────────────────────────────────────────────
async function checkDocumentReminders() {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Documents expiring within 30 days or already expired
  const docs = await Document.find({
    expiryDate: { $lte: thirtyDaysLater },
  }).populate('vehicle', 'owner make model regNumber');

  for (const doc of docs) {
    if (!doc.vehicle) continue;

    const daysLeft = Math.ceil((doc.expiryDate - now) / 86400000);
    const expired = daysLeft < 0;

    const message = expired
      ? `❗ ${doc.type.toUpperCase()} expired ${Math.abs(daysLeft)} days ago for ${doc.vehicle.make} ${doc.vehicle.model} (${doc.vehicle.regNumber}).`
      : `📄 ${doc.type.toUpperCase()} for ${doc.vehicle.make} ${doc.vehicle.model} (${doc.vehicle.regNumber}) expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`;

    // Deduplication
    const alreadyExists = await Notification.exists({
      user: doc.vehicle.owner,
      relatedVehicle: doc.vehicle._id,
      type: 'document_expiry',
      isRead: false,
      message: { $regex: doc.vehicle.regNumber },
    });

    if (!alreadyExists) {
      await Notification.create({
        user: doc.vehicle.owner,
        message,
        type: 'document_expiry',
        relatedVehicle: doc.vehicle._id,
      });
    }
  }
}
