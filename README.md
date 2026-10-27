# ServiceBook 🚗📋

> **Vehicle Service History & Reminder App** — Never miss a service, never lose a receipt.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Roles & Permissions](#2-roles--permissions)
3. [MVP Feature List](#3-mvp-feature-list)
4. [User Stories & Acceptance Criteria](#4-user-stories--acceptance-criteria)
5. [Data Model](#5-data-model)
6. [API Contract](#6-api-contract)
7. [Tech Stack](#7-tech-stack)
8. [Project Structure](#8-project-structure)
9. [Setup & Running Locally](#9-setup--running-locally)
10. [Environment Variables](#10-environment-variables)
11. [Screenshots](#11-screenshots)
12. [Known Limitations & Future Improvements](#12-known-limitations--future-improvements)

---

## 1. Problem Statement

Vehicle owners typically manage maintenance through a combination of paper receipts, workshop stickers on windscreens, and unreliable memory. This leads to:

- **Missed service intervals** — accelerated wear and potential breakdowns
- **Lost paper trails** — no history to show when selling the vehicle
- **No spending visibility** — inability to budget or compare garages
- **Forgotten document renewals** — lapsed insurance or PUC certificates

**ServiceBook** solves all of these by giving each user a single, persistent digital record of every vehicle they own. It logs services with costs and parts, tracks fuel, stores document expiry dates, and proactively reminds users before anything falls due — all inside a clean, dark-themed web application.

---

## 2. Roles & Permissions

| Capability | User | Admin |
|---|---|---|
| Register / Login | YES | YES |
| Manage own vehicles (CRUD + archive) | YES | — |
| Log service records & fuel for own vehicles | YES | — |
| Upload receipts / manage documents | YES | — |
| View own notifications | YES | — |
| Export own vehicle history (PDF / CSV) | YES | — |
| Manage service-type catalogue | — | YES |
| Activate / deactivate user accounts | — | YES |
| View app-wide analytics & audit log | — | YES |

A deactivated user receives HTTP 403 on every authenticated request.

---

## 3. MVP Feature List

### Phase 1 — Core (build first)
1. **Auth** — Register, Login, JWT-protected routes, role-based guards
2. **Vehicle CRUD** — Create, read, update, archive (soft delete) vehicles
3. **Service Records CRUD** — Per vehicle; auto-calculates next due km / date from service type intervals
4. **Dashboard** — Upcoming services, overdue services, total spend stat cards, spend-by-month chart
5. **Admin: Service Type Catalogue** — CRUD for shared service types (oil change, tyre rotation, etc.)

### Phase 2 — Extras (after MVP is end-to-end)
6. Fuel log with automatic km/l calculation
7. Document vault (insurance, PUC, licence) with expiry status badges
8. Reminder engine (node-cron) — in-app notifications 7 days / 500 km before service due; 30 days before document expiry
9. Notification centre — bell icon with unread count, mark-as-read
10. Analytics — monthly spend chart, spend by service type, cost per km
11. Receipt upload (jpg / png / pdf 2 MB max) via multer
12. Export vehicle history as PDF and CSV
13. Search, filter, sort and paginate service history
14. Admin: user management, app-wide stats, audit log

---

## 4. User Stories & Acceptance Criteria

### AUTH

**US-01 — Register**
As a new user I want to create an account so that I can start tracking my vehicles.

Acceptance Criteria:
- POST /api/auth/register with name, email, password returns 201 and a JWT on success
- Duplicate email returns 409 with { success: false, message: "Email already in use" }
- Missing or invalid fields return 400 with per-field error messages
- Password is stored as a bcrypt hash; the hash is never returned

**US-02 — Login**
As a registered user I want to log in so that I can access my data.

Acceptance Criteria:
- POST /api/auth/login with correct credentials returns 200 and a JWT
- Wrong password returns 401
- Deactivated account returns 403 with "Account deactivated" message
- Successful login never returns the password hash

---

### VEHICLES

**US-03 — Add a vehicle**
As a user I want to add a vehicle so that I can log services against it.

Acceptance Criteria:
- POST /api/vehicles with make, model, year, regNumber creates a vehicle owned by the authenticated user
- Duplicate regNumber for the same owner returns 409
- Response includes the created vehicle object with _id

**US-04 — View my vehicles**
As a user I want to see all my vehicles so that I can pick one to view its history.

Acceptance Criteria:
- GET /api/vehicles returns only the requesting user's vehicles (never another user's)
- Archived vehicles are excluded by default; ?includeArchived=true includes them
- Response is paginated

**US-05 — Archive a vehicle**
As a user I want to archive an old vehicle instead of deleting it so that I keep its service history.

Acceptance Criteria:
- PATCH /api/vehicles/:id/archive sets isArchived: true and returns 200
- Attempting to log a new service record against an archived vehicle returns 400
- Archived vehicle still appears in service history when explicitly requested

---

### SERVICE RECORDS

**US-06 — Log a service**
As a user I want to record a completed service so that I have a full maintenance history.

Acceptance Criteria:
- POST /api/vehicles/:vehicleId/services with serviceType, date, odometerAtService, cost creates a record
- If odometerAtService < the last record's odometer for that vehicle, returns 400 with "Odometer cannot decrease"
- If cost < 0, returns 400 with "Cost cannot be negative"
- nextDueKm = odometerAtService + serviceType.defaultIntervalKm (if interval exists)
- nextDueDate = date + serviceType.defaultIntervalDays (if interval exists)
- Response includes the newly created record

**US-07 — View service history**
As a user I want to see all services for a vehicle, filtered and sorted, so that I can review my history.

Acceptance Criteria:
- GET /api/vehicles/:vehicleId/services returns paginated results with paging metadata
- Supports ?serviceType=, ?dateFrom=, ?dateTo=, ?costMin=, ?costMax=, ?sortBy=date&order=desc
- Returns 403 if the vehicle does not belong to the requesting user

---

### DASHBOARD

**US-08 — Dashboard**
As a user I want a dashboard that shows upcoming services, overdue services, and total spend so that I always know the health of my fleet.

Acceptance Criteria:
- GET /api/dashboard returns upcomingServices (due within 7 days or 500 km), overdueServices, totalSpend
- All figures are scoped to the authenticated user's vehicles only

---

### ADMIN — SERVICE TYPES

**US-09 — Manage service types**
As an admin I want to create and edit the shared catalogue of service types so that users can pick from a consistent list.

Acceptance Criteria:
- GET/POST/PUT/DELETE /api/admin/service-types are accessible only with role=admin; otherwise 403
- DELETE soft-deactivates (sets isActive: false); records already referencing the type are unaffected
- POST with duplicate name returns 409

---

### NOTIFICATIONS

**US-10 — Receive reminders**
As a user I want to receive in-app notifications before a service is due so that I can book in advance.

Acceptance Criteria:
- A cron job runs daily and creates Notification documents for services due within 7 days or within 500 km
- A cron job runs daily and creates Notification documents for documents expiring within 30 days
- GET /api/notifications returns only the authenticated user's notifications, newest first
- PATCH /api/notifications/:id/read marks one as read; PATCH /api/notifications/read-all marks all

---

### ANALYTICS

**US-11 — Spend analytics**
As a user I want to see charts of my spending by month and by service type so that I can understand my maintenance costs.

Acceptance Criteria:
- GET /api/analytics/spend-by-month returns aggregated monthly spend for a given vehicleId (or all vehicles)
- GET /api/analytics/spend-by-type returns spend grouped by service type
- GET /api/analytics/cost-per-km returns total spend / total distance travelled per vehicle

---

## 5. Data Model

All models use Mongoose with timestamps: true.

### User
```js
{
  name:         { type: String, required, trim },
  email:        { type: String, required, unique, lowercase },
  passwordHash: { type: String, required },  // bcrypt; never returned
  role:         { type: String, enum: ['user','admin'], default: 'user' },
  isActive:     { type: Boolean, default: true }
}
// Index: email (unique, built-in)
```

### ServiceType (admin-managed shared catalogue)
```js
{
  name:                { type: String, required, unique },
  defaultIntervalKm:   { type: Number, min: 0 },   // optional
  defaultIntervalDays: { type: Number, min: 0 },   // optional
  isActive:            { type: Boolean, default: true }
}
```

### Vehicle
```js
{
  // Referenced (not embedded) because a vehicle has a long, independent lifecycle
  // and is queried standalone (fleet list, archive, etc.)
  owner:      { type: ObjectId, ref: 'User', required, index },
  make:       { type: String, required },
  model:      { type: String, required },
  year:       { type: Number, required, min: 1900 },
  regNumber:  { type: String, required },
  odometer:   { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false }
}
// Compound index: { owner, regNumber } unique — same reg allowed for different users
```

### ServiceRecord
```js
{
  // vehicle is referenced; a single vehicle has many records queried as a list
  vehicle:          { type: ObjectId, ref: 'Vehicle', required, index },
  // serviceType is referenced; the shared catalogue changes independently
  serviceType:      { type: ObjectId, ref: 'ServiceType', required },
  // garage is referenced (optional); garages are managed separately
  garage:           { type: ObjectId, ref: 'Garage' },
  date:             { type: Date, required },
  odometerAtService:{ type: Number, required, min: 0 },
  cost:             { type: Number, required, min: 0 },
  notes:            String,
  // parts[] embedded — they belong entirely to this record and are never queried alone
  parts:            [{ name: String, price: { type: Number, min: 0 } }],
  receiptUrl:       String,
  nextDueKm:        Number,
  nextDueDate:      Date
}
// Compound index: { vehicle, date } — most queries filter by vehicle then sort by date
```

### FuelLog
```js
{
  vehicle:       { type: ObjectId, ref: 'Vehicle', required, index },
  date:          { type: Date, required },
  litres:        { type: Number, required, min: 0.1 },
  pricePerLitre: { type: Number, required, min: 0 },
  odometer:      { type: Number, required, min: 0 },
  fullTank:      { type: Boolean, default: true }
  // kmPerLitre computed on read from consecutive odometer readings
}
// Index: { vehicle, date }
```

### Document
```js
{
  vehicle:    { type: ObjectId, ref: 'Vehicle', required, index },
  type:       { type: String, enum: ['insurance','PUC','licence','other'] },
  expiryDate: { type: Date, required }
  // Status (valid/expiring-soon/expired) derived at read time, not stored
}
```

### Garage
```js
{
  // Referenced because garages can be reused across many service records
  owner:    { type: ObjectId, ref: 'User', required, index },
  name:     { type: String, required },
  phone:    String,
  location: String,
  rating:   { type: Number, min: 1, max: 5 },
  notes:    String
}
```

### Notification
```js
{
  user:           { type: ObjectId, ref: 'User', required, index },
  message:        { type: String, required },
  type:           { type: String, enum: ['service_due','document_expiry','system'] },
  isRead:         { type: Boolean, default: false },
  relatedVehicle: { type: ObjectId, ref: 'Vehicle' }
}
// Index: { user, isRead } — bell icon queries unread count frequently
```

### AuditLog
```js
{
  // actor referenced — logs must survive even if user is deactivated
  actor:     { type: ObjectId, ref: 'User', required },
  action:    { type: String, required },   // e.g. 'USER_DEACTIVATED', 'SERVICE_TYPE_CREATED'
  entity:    String,
  entityId:  ObjectId,
  timestamp: { type: Date, default: Date.now, index }
}
```

---

## 6. API Contract

Base URL: /api
Auth header: Authorization: Bearer <token>
Error shape: { success, message, errors?: [{ field, message }] }
Success shape: { success: true, data: ..., pagination?: { page, limit, total, pages } }

### Auth
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | /auth/register | — | name, email, password | 201 { token, user } |
| POST | /auth/login | — | email, password | 200 { token, user } |
| GET | /auth/me | YES | — | 200 { user } |

### Vehicles
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /vehicles | YES user | Paginated; ?includeArchived |
| POST | /vehicles | YES user | Creates vehicle |
| GET | /vehicles/:id | YES user | Ownership enforced |
| PUT | /vehicles/:id | YES user | Full update |
| PATCH | /vehicles/:id/archive | YES user | Soft delete |

### Service Records
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /vehicles/:vehicleId/services | YES user | Filtered, sorted, paginated |
| POST | /vehicles/:vehicleId/services | YES user | Validates odometer, cost; auto-fills next due |
| GET | /vehicles/:vehicleId/services/:id | YES user | |
| PUT | /vehicles/:vehicleId/services/:id | YES user | |
| DELETE | /vehicles/:vehicleId/services/:id | YES user | Hard delete (receipt also removed) |

### Fuel Logs
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /vehicles/:vehicleId/fuel | YES user | Paginated |
| POST | /vehicles/:vehicleId/fuel | YES user | |
| PUT | /vehicles/:vehicleId/fuel/:id | YES user | |
| DELETE | /vehicles/:vehicleId/fuel/:id | YES user | |

### Documents
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /vehicles/:vehicleId/documents | YES user | Includes computed status |
| POST | /vehicles/:vehicleId/documents | YES user | |
| PUT | /vehicles/:vehicleId/documents/:id | YES user | |
| DELETE | /vehicles/:vehicleId/documents/:id | YES user | |

### Notifications
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /notifications | YES user | Paginated; ?unreadOnly |
| PATCH | /notifications/:id/read | YES user | |
| PATCH | /notifications/read-all | YES user | |

### Analytics
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /analytics/spend-by-month | YES user | ?vehicleId, ?year |
| GET | /analytics/spend-by-type | YES user | ?vehicleId |
| GET | /analytics/cost-per-km | YES user | Per vehicle |

### Dashboard
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /dashboard | YES user | Upcoming, overdue, totalSpend |

### Admin — Service Types
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /admin/service-types | YES admin | All (incl inactive) |
| POST | /admin/service-types | YES admin | |
| PUT | /admin/service-types/:id | YES admin | |
| DELETE | /admin/service-types/:id | YES admin | Soft deactivate |

### Admin — Users
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /admin/users | YES admin | Paginated |
| PATCH | /admin/users/:id/activate | YES admin | Sets isActive true |
| PATCH | /admin/users/:id/deactivate | YES admin | Sets isActive false |

### Admin — Analytics & Audit
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /admin/stats | YES admin | Total users, vehicles, services, spend |
| GET | /admin/audit-log | YES admin | Paginated |

### Receipt Upload
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /vehicles/:vehicleId/services/:id/receipt | YES user | multipart/form-data; jpg/png/pdf 2 MB max |

### Export
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /vehicles/:vehicleId/export/pdf | YES user | Returns PDF blob |
| GET | /vehicles/:vehicleId/export/csv | YES user | Returns CSV text |

---

## 7. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite), React Router v6, Tailwind CSS v3, Recharts, lucide-react, axios |
| Backend | Node.js 20, Express 4, Mongoose 8, MongoDB Atlas |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit, express-mongo-sanitize |
| Jobs | node-cron |
| Upload | multer |
| Export | pdfkit, fast-csv |
| Logging | morgan |
| Dev Tools | nodemon, concurrently, ESLint, Prettier |

---

## 8. Project Structure

```
servicebook/
  client/
    src/
      components/     # Reusable UI components
      pages/          # Route-level page components
      services/       # Axios API client (all HTTP calls live here)
      hooks/          # Custom React hooks
      context/        # Auth context, notification context
    .env.example
    package.json
  server/
    src/
      config/         # DB connection, env loader
      models/         # Mongoose schemas
      routes/         # Path to controller mapping only
      controllers/    # Business logic
      middleware/     # Auth, validation, error handling
    uploads/          # multer upload destination (gitignored)
    .env.example
    package.json
  .gitignore
  README.md
```

---

## 9. Setup & Running Locally

### Prerequisites
- Node.js >= 20
- MongoDB Atlas account (or local MongoDB 7)
- Git

### Steps
```bash
# 1. Clone
git clone <repo-url>
cd servicebook

# 2. Install server dependencies
cd server && npm install

# 3. Install client dependencies
cd ../client && npm install

# 4. Configure environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# 5. Seed the database (1 admin, 2 users, sample data)
cd server && npm run seed

# 6. Start development servers
npm run dev
```

Client: http://localhost:5173
API: http://localhost:5000

---

## 10. Environment Variables

### server/.env.example
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/servicebook
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=2
```

### client/.env.example
```
VITE_API_URL=https://carservice-capstone-1.onrender.com
```

---

## 11. Screenshots

Screenshots will be added after the UI is built in Milestone 5.

---

## 12. Known Limitations & Future Improvements

### Current Limitations
- Receipt files are stored on the server filesystem; in production these should move to S3 / Cloudinary
- Reminders are in-app only; email / push notifications are not yet implemented
- No offline / PWA support

### Future Improvements
- Email notifications via SendGrid or Resend
- Mobile app (React Native)
- Multi-currency support
- OCR receipt scanning to auto-fill service records
- Shared vehicle access (family fleet)
- Integration with car OBD-II data
