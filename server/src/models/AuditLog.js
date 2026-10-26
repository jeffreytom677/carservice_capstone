import mongoose from 'mongoose';

/**
 * AuditLog — immutable record of admin actions.
 *
 * actor is referenced (not embedded) so the log entry survives even if
 * the admin account is deactivated or deleted.
 * AuditLog documents are never updated or deleted — only appended.
 */
const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Human-readable constant, e.g. 'USER_DEACTIVATED', 'SERVICE_TYPE_CREATED'
  action: {
    type: String,
    required: true,
  },
  // The Mongoose model name that was affected, e.g. 'User', 'ServiceType'
  entity: String,
  // The _id of the affected document
  entityId: mongoose.Schema.Types.ObjectId,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export default mongoose.model('AuditLog', auditLogSchema);
