/**
 * Seed script — populates the database with safe dummy data for development.
 *
 * Credentials (intentionally weak/obvious for dev only):
 *   admin@servicebook.dev  /  Admin@1234
 *   alice@example.com      /  Alice@1234
 *   bob@example.com        /  Bob@1234
 *
 * Run: npm run seed  (from the server/ directory)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDB } from './db.js';
import User from '../models/User.js';
import ServiceType from '../models/ServiceType.js';
import Vehicle from '../models/Vehicle.js';
import ServiceRecord from '../models/ServiceRecord.js';

async function seed() {
  await connectDB();

  console.log('🌱  Seeding database…');

  // ── Clear existing seed data (by email to avoid accidents in production) ─────
  const seedEmails = ['admin@servicebook.dev', 'alice@example.com', 'bob@example.com'];
  const existingUsers = await User.find({ email: { $in: seedEmails } }).select('_id');
  const existingUserIds = existingUsers.map((u) => u._id);

  await ServiceRecord.deleteMany({});
  await Vehicle.deleteMany({ owner: { $in: existingUserIds } });
  await User.deleteMany({ email: { $in: seedEmails } });
  await ServiceType.deleteMany({});

  console.log('   ✓ Cleared old seed data');

  // ── Users ─────────────────────────────────────────────────────────────────────
  const [admin, alice, bob] = await User.insertMany([
    {
      name: 'ServiceBook Admin',
      email: 'admin@servicebook.dev',
      passwordHash: await bcrypt.hash('Admin@1234', 12),
      role: 'admin',
    },
    {
      name: 'Alice Patel',
      email: 'alice@example.com',
      passwordHash: await bcrypt.hash('Alice@1234', 12),
      role: 'user',
    },
    {
      name: 'Bob Sharma',
      email: 'bob@example.com',
      passwordHash: await bcrypt.hash('Bob@1234', 12),
      role: 'user',
    },
  ]);
  console.log('   ✓ Users created');

  // ── Service Types ─────────────────────────────────────────────────────────────
  const [oilChange, tyreRotation, brakeInspection, airFilter, fullService] =
    await ServiceType.insertMany([
      { name: 'Oil Change', defaultIntervalKm: 5000, defaultIntervalDays: 90 },
      { name: 'Tyre Rotation', defaultIntervalKm: 10000, defaultIntervalDays: 180 },
      { name: 'Brake Inspection', defaultIntervalKm: 15000, defaultIntervalDays: 365 },
      { name: 'Air Filter Replacement', defaultIntervalKm: 20000, defaultIntervalDays: 365 },
      { name: 'Full Service', defaultIntervalKm: 10000, defaultIntervalDays: 365 },
    ]);
  console.log('   ✓ Service types created');

  // ── Vehicles ──────────────────────────────────────────────────────────────────
  const aliceCar = await Vehicle.create({
    owner: alice._id,
    make: 'Maruti Suzuki',
    model: 'Swift',
    year: 2021,
    regNumber: 'MH01AB1234',
    odometer: 32000,
  });

  const aliceBike = await Vehicle.create({
    owner: alice._id,
    make: 'Royal Enfield',
    model: 'Classic 350',
    year: 2022,
    regNumber: 'MH01CD5678',
    odometer: 8500,
  });

  const bobCar = await Vehicle.create({
    owner: bob._id,
    make: 'Hyundai',
    model: 'Creta',
    year: 2020,
    regNumber: 'KA01EF9012',
    odometer: 55000,
  });
  console.log('   ✓ Vehicles created');

  // ── Service Records ───────────────────────────────────────────────────────────
  // Alice's car — past services
  await ServiceRecord.insertMany([
    {
      vehicle: aliceCar._id,
      serviceType: oilChange._id,
      date: new Date('2024-01-15'),
      odometerAtService: 20000,
      cost: 1200,
      notes: 'Used Castrol GTX synthetic 5W-30',
      nextDueKm: 25000,
      nextDueDate: new Date('2024-04-15'),
    },
    {
      vehicle: aliceCar._id,
      serviceType: oilChange._id,
      date: new Date('2024-04-20'),
      odometerAtService: 25000,
      cost: 1200,
      nextDueKm: 30000,
      nextDueDate: new Date('2024-07-20'),
    },
    {
      vehicle: aliceCar._id,
      serviceType: tyreRotation._id,
      date: new Date('2024-04-20'),
      odometerAtService: 25000,
      cost: 400,
      nextDueKm: 35000,
      nextDueDate: new Date('2024-10-20'),
    },
    {
      vehicle: aliceCar._id,
      serviceType: oilChange._id,
      date: new Date('2024-08-10'),
      odometerAtService: 30000,
      cost: 1300,
      notes: 'Switched to Mobil 1 Full Synthetic',
      nextDueKm: 35000,
      nextDueDate: new Date('2024-11-10'), // due soon / overdue depending on system date
    },
    {
      vehicle: aliceCar._id,
      serviceType: brakeInspection._id,
      date: new Date('2024-06-01'),
      odometerAtService: 27500,
      cost: 800,
      nextDueKm: 42500,
      nextDueDate: new Date('2025-06-01'),
    },
  ]);

  // Bob's car — due for overdue oil change
  await ServiceRecord.insertMany([
    {
      vehicle: bobCar._id,
      serviceType: oilChange._id,
      date: new Date('2024-03-01'),
      odometerAtService: 48000,
      cost: 1500,
      nextDueKm: 53000,
      nextDueDate: new Date('2024-06-01'), // overdue
    },
    {
      vehicle: bobCar._id,
      serviceType: fullService._id,
      date: new Date('2023-12-15'),
      odometerAtService: 45000,
      cost: 8500,
      nextDueKm: 55000,
      nextDueDate: new Date('2024-12-15'),
    },
  ]);
  console.log('   ✓ Service records created');

  console.log('\n✅  Seed complete!\n');
  console.log('   admin@servicebook.dev  →  Admin@1234  (role: admin)');
  console.log('   alice@example.com      →  Alice@1234  (role: user)');
  console.log('   bob@example.com        →  Bob@1234    (role: user)\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
