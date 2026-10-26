import Vehicle from '../models/Vehicle.js';
import ServiceRecord from '../models/ServiceRecord.js';
import { createError } from '../middleware/errorMiddleware.js';
import PDFDocument from 'pdfkit';
import { format } from 'fast-csv';
import path from 'path';
import fs from 'fs';

const requireOwnership = async (vehicleId, userId) => {
  const v = await Vehicle.findOne({ _id: vehicleId, owner: userId });
  if (!v) throw createError(403, 'Vehicle not found or access denied.');
  return v;
};

// POST /api/vehicles/:vehicleId/services/:id/receipt
export const uploadReceipt = async (req, res, next) => {
  try {
    await requireOwnership(req.params.vehicleId, req.user._id);

    if (!req.file) throw createError(400, 'No file uploaded.');

    const record = await ServiceRecord.findOne({
      _id: req.params.id,
      vehicle: req.params.vehicleId,
    });
    if (!record) throw createError(404, 'Service record not found.');

    // Delete old receipt if it exists
    if (record.receiptUrl) {
      const oldPath = path.join(process.env.UPLOAD_DIR || 'uploads', path.basename(record.receiptUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    record.receiptUrl = `/uploads/${req.file.filename}`;
    await record.save();

    res.json({ success: true, data: { receiptUrl: record.receiptUrl } });
  } catch (err) { next(err); }
};

// GET /api/vehicles/:vehicleId/export/pdf
export const exportPdf = async (req, res, next) => {
  try {
    const vehicle = await requireOwnership(req.params.vehicleId, req.user._id);
    const records = await ServiceRecord.find({ vehicle: vehicle._id })
      .populate('serviceType', 'name')
      .sort({ date: -1 });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="servicebook-${vehicle.regNumber}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('ServiceBook — Service History', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(13).text(`${vehicle.make} ${vehicle.model} (${vehicle.year}) — ${vehicle.regNumber}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('grey').text(`Exported on ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.moveDown(1).fillColor('black');
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    if (records.length === 0) {
      doc.fontSize(11).text('No service records found.');
    } else {
      records.forEach((r, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${r.serviceType?.name ?? 'Unknown'} — ${new Date(r.date).toLocaleDateString('en-IN')}`);
        doc.fontSize(10).fillColor('#555');
        doc.text(`  Odometer: ${r.odometerAtService.toLocaleString()} km  |  Cost: ₹${r.cost.toLocaleString()}`);
        if (r.nextDueDate) doc.text(`  Next due: ${new Date(r.nextDueDate).toLocaleDateString('en-IN')}`);
        if (r.nextDueKm) doc.text(`  Next due (km): ${r.nextDueKm.toLocaleString()} km`);
        if (r.notes) doc.text(`  Notes: ${r.notes}`);
        if (r.parts?.length) doc.text(`  Parts: ${r.parts.map((p) => `${p.name} (₹${p.price})`).join(', ')}`);
        doc.moveDown(0.8).fillColor('black');
      });
    }

    doc.end();
  } catch (err) { next(err); }
};

// GET /api/vehicles/:vehicleId/export/csv
export const exportCsv = async (req, res, next) => {
  try {
    const vehicle = await requireOwnership(req.params.vehicleId, req.user._id);
    const records = await ServiceRecord.find({ vehicle: vehicle._id })
      .populate('serviceType', 'name')
      .sort({ date: -1 });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="servicebook-${vehicle.regNumber}.csv"`);

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    records.forEach((r) => {
      csvStream.write({
        Date: new Date(r.date).toLocaleDateString('en-IN'),
        ServiceType: r.serviceType?.name ?? '',
        OdometerKm: r.odometerAtService,
        Cost: r.cost,
        NextDueKm: r.nextDueKm ?? '',
        NextDueDate: r.nextDueDate ? new Date(r.nextDueDate).toLocaleDateString('en-IN') : '',
        Notes: r.notes ?? '',
        Parts: r.parts?.map((p) => `${p.name}:₹${p.price}`).join('; ') ?? '',
      });
    });

    csvStream.end();
  } catch (err) { next(err); }
};
