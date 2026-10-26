import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vehicleService, serviceRecordService, adminService } from '../services/services.js';
import { ArrowLeft, Plus, Trash2, AlertTriangle, Loader2, X, FileText, Download } from 'lucide-react';

function ServiceModal({ vehicleId, serviceTypes, onClose, onSave }) {
  const [form, setForm] = useState({ serviceType: '', date: '', odometerAtService: '', cost: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const f = (name) => ({ value: form[name], onChange: (e) => { setForm(p => ({ ...p, [name]: e.target.value })); setErrors(p => ({ ...p, [name]: '' })); } });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.serviceType) errs.serviceType = 'Required';
    if (!form.date) errs.date = 'Required';
    if (!form.odometerAtService) errs.odometerAtService = 'Required';
    if (form.cost === '') errs.cost = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave({ ...form, odometerAtService: Number(form.odometerAtService), cost: Number(form.cost) });
      onClose();
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Save failed.' });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Log Service</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        {errors.form && <div className="bg-danger/10 border border-danger/30 text-danger rounded-input px-3 py-2 text-sm mb-4">{errors.form}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Service Type</label>
            <select className={`input ${errors.serviceType ? 'border-danger' : ''}`} {...f('serviceType')}>
              <option value="">Select type…</option>
              {serviceTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            {errors.serviceType && <p className="text-danger text-xs mt-1">{errors.serviceType}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className={`input ${errors.date ? 'border-danger' : ''}`} {...f('date')} />
              {errors.date && <p className="text-danger text-xs mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="label">Odometer (km)</label>
              <input type="number" className={`input ${errors.odometerAtService ? 'border-danger' : ''}`} placeholder="30000" {...f('odometerAtService')} />
              {errors.odometerAtService && <p className="text-danger text-xs mt-1">{errors.odometerAtService}</p>}
            </div>
          </div>
          <div>
            <label className="label">Cost (₹)</label>
            <input type="number" className={`input ${errors.cost ? 'border-danger' : ''}`} placeholder="1200" {...f('cost')} />
            {errors.cost && <p className="text-danger text-xs mt-1">{errors.cost}</p>}
          </div>
          <div>
            <label className="label">Notes <span className="text-text-muted">(optional)</span></label>
            <textarea className="input min-h-[60px] resize-none" placeholder="Any notes…" {...f('notes')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving…' : 'Log Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Badge({ value, className }) {
  return <span className={`badge ${className}`}>{value}</span>;
}

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [records, setRecords] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [exporting, setExporting] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [vRes, sRes, stRes] = await Promise.all([
        vehicleService.get(id),
        serviceRecordService.list(id, { page, limit: 10 }),
        adminService.getServiceTypes({ showInactive: false, limit: 50 }),
      ]);
      setVehicle(vRes.data.data);
      setRecords(sRes.data.data);
      setPagination(sRes.data.pagination);
      setServiceTypes(stRes.data.data);
    } catch { setError('Failed to load vehicle details.'); }
    finally { setLoading(false); }
  }, [id, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (recordId) => {
    if (!window.confirm('Delete this service record? This cannot be undone.')) return;
    setDeleting(recordId);
    try { await serviceRecordService.remove(id, recordId); load(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
    finally { setDeleting(null); }
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const res = type === 'pdf' ? await serviceRecordService.exportPdf(id) : await serviceRecordService.exportCsv(id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `${vehicle?.regNumber}-history.${type}`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Export failed.'); }
    finally { setExporting(null); }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-6 w-32 rounded" />
      <div className="card p-5 skeleton h-24" />
      <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card p-4 skeleton h-16" />)}</div>
    </div>
  );

  if (error) return (
    <div className="card p-12 flex flex-col items-center gap-4 text-center">
      <AlertTriangle className="w-8 h-8 text-danger" strokeWidth={1.5} />
      <p className="text-text-primary font-semibold">{error}</p>
      <button onClick={load} className="btn-secondary">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/vehicles" className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Link>
        <div>
          <h2 className="page-title">{vehicle?.make} {vehicle?.model}</h2>
          <p className="text-text-secondary text-sm">{vehicle?.year} · {vehicle?.regNumber} · <span className="tabular-nums">{vehicle?.odometer?.toLocaleString('en-IN')} km</span></p>
        </div>
        {vehicle?.isArchived && <span className="badge-muted ml-2">Archived</span>}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!vehicle?.isArchived && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Log Service
          </button>
        )}
        <button onClick={() => handleExport('pdf')} disabled={exporting === 'pdf'} className="btn-secondary flex items-center gap-2">
          {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Export PDF
        </button>
        <button onClick={() => handleExport('csv')} disabled={exporting === 'csv'} className="btn-secondary flex items-center gap-2">
          {exporting === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export CSV
        </button>
      </div>

      {/* Service records */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="section-title">Service History</h3>
          {pagination && <span className="text-text-muted text-sm">{pagination.total} records</span>}
        </div>

        {records.length === 0 ? (
          <div className="p-16 flex flex-col items-center gap-4 text-center">
            <FileText className="w-8 h-8 text-text-muted" strokeWidth={1.5} />
            <div><p className="text-text-primary font-semibold">No service records yet</p><p className="text-text-muted text-sm mt-1">Log your first service to start tracking history.</p></div>
            {!vehicle?.isArchived && <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Log Service</button>}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-elevated">
                    <th className="table-header text-left px-5 py-3">Date</th>
                    <th className="table-header text-left px-5 py-3">Service Type</th>
                    <th className="table-header text-right px-5 py-3">Odometer</th>
                    <th className="table-header text-right px-5 py-3">Cost</th>
                    <th className="table-header text-left px-5 py-3">Next Due</th>
                    <th className="table-header px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r._id} className="table-row">
                      <td className="px-5 py-3 text-text-secondary text-sm">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3 text-text-primary text-sm font-medium">{r.serviceType?.name}</td>
                      <td className="px-5 py-3 text-right text-text-secondary text-sm tabular-nums">{r.odometerAtService?.toLocaleString('en-IN')} km</td>
                      <td className="px-5 py-3 text-right text-text-primary text-sm font-medium tabular-nums">₹{r.cost?.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-text-muted text-xs">
                        {r.nextDueDate ? new Date(r.nextDueDate).toLocaleDateString('en-IN') : '—'}
                        {r.nextDueKm ? <span className="block tabular-nums">{r.nextDueKm?.toLocaleString('en-IN')} km</span> : null}
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleDelete(r._id)} disabled={deleting === r._id} className="text-text-muted hover:text-danger transition-colors p-1">
                          {deleting === r._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" strokeWidth={1.5} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {records.map(r => (
                <div key={r._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-text-primary font-medium">{r.serviceType?.name}</p>
                      <p className="text-text-muted text-xs">{new Date(r.date).toLocaleDateString('en-IN')}</p>
                    </div>
                    <p className="text-text-primary font-semibold tabular-nums">₹{r.cost?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm tabular-nums">{r.odometerAtService?.toLocaleString('en-IN')} km</span>
                    <button onClick={() => handleDelete(r._id)} className="text-text-muted hover:text-danger transition-colors p-1">
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination?.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                <p className="text-text-muted text-sm">Page {pagination.page} of {pagination.pages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary text-sm py-1.5 px-3">Previous</button>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn-secondary text-sm py-1.5 px-3">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && <ServiceModal vehicleId={id} serviceTypes={serviceTypes} onClose={() => setShowModal(false)} onSave={(data) => serviceRecordService.create(id, data).then(() => load())} />}
    </div>
  );
}
