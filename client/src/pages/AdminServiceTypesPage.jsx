import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/services.js';
import { Plus, Pencil, Settings, AlertTriangle, Loader2, X, Power, PowerOff } from 'lucide-react';

function ServiceTypeModal({ item, onClose, onSave }) {
  const isEdit = !!item?._id;
  const [form, setForm] = useState({ name: item?.name || '', defaultIntervalKm: item?.defaultIntervalKm || '', defaultIntervalDays: item?.defaultIntervalDays || '', isActive: item?.isActive ?? true });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const f = (name) => ({ value: form[name], onChange: (e) => { setForm(p => ({ ...p, [name]: e.target.value })); setErrors(p => ({ ...p, [name]: '' })); } });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Save failed.' });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">{isEdit ? 'Edit Service Type' : 'Add Service Type'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        {errors.form && <div className="bg-danger/10 border border-danger/30 text-danger rounded-input px-3 py-2 text-sm mb-4">{errors.form}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className={`input ${errors.name ? 'border-danger' : ''}`} placeholder="Oil Change" {...f('name')} />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Interval (km)</label><input type="number" className="input" placeholder="5000" {...f('defaultIntervalKm')} /></div>
            <div><label className="label">Interval (days)</label><input type="number" className="input" placeholder="90" {...f('defaultIntervalDays')} /></div>
          </div>
          {isEdit && (
            <label className="flex items-center gap-2 text-text-secondary text-sm cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded border-border bg-elevated text-accent focus:ring-accent" />
              Active
            </label>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminServiceTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminService.getServiceTypes({ showInactive: true, limit: 100 });
      setTypes(res.data.data);
    } catch { setError('Failed to load service types.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    if (modal?._id) await adminService.updateServiceType(modal._id, form);
    else await adminService.createServiceType(form);
    load();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Deactivate "${item.name}"? This hides it from new records.`)) return;
    setToggling(item._id);
    try { await adminService.deleteServiceType(item._id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Failed.'); }
    finally { setToggling(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">Service Types</h2><p className="text-text-secondary mt-1">Shared service catalogue</p></div>
        <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Type
        </button>
      </div>

      {loading && <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="card p-4 h-16 skeleton" />)}</div>}

      {error && <div className="card p-12 flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="w-8 h-8 text-danger" strokeWidth={1.5} />
        <p className="text-text-primary font-semibold">{error}</p>
        <button onClick={load} className="btn-secondary">Retry</button>
      </div>}

      {!loading && !error && (
        <div className="card overflow-hidden">
          {types.length === 0 ? (
            <div className="p-16 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-card flex items-center justify-center">
                <Settings className="w-6 h-6 text-accent" strokeWidth={1.5} />
              </div>
              <p className="text-text-primary font-semibold">No service types yet</p>
              <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add First Type</button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-elevated border-b border-border">
                  <th className="table-header text-left px-5 py-3">Name</th>
                  <th className="table-header text-right px-5 py-3 hidden sm:table-cell">Interval (km)</th>
                  <th className="table-header text-right px-5 py-3 hidden sm:table-cell">Interval (days)</th>
                  <th className="table-header text-center px-5 py-3">Status</th>
                  <th className="table-header px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {types.map(t => (
                  <tr key={t._id} className={`table-row ${!t.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3 text-text-primary font-medium">{t.name}</td>
                    <td className="px-5 py-3 text-right text-text-secondary tabular-nums hidden sm:table-cell">{t.defaultIntervalKm ? `${t.defaultIntervalKm.toLocaleString()} km` : '—'}</td>
                    <td className="px-5 py-3 text-right text-text-secondary tabular-nums hidden sm:table-cell">{t.defaultIntervalDays ? `${t.defaultIntervalDays} days` : '—'}</td>
                    <td className="px-5 py-3 text-center">
                      {t.isActive ? <span className="badge-success">Active</span> : <span className="badge-muted">Inactive</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setModal(t)} className="text-text-muted hover:text-accent transition-colors p-1" title="Edit">
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => handleDelete(t)} disabled={toggling === t._id || !t.isActive} className="text-text-muted hover:text-danger transition-colors p-1" title="Deactivate">
                          {toggling === t._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PowerOff className="w-4 h-4" strokeWidth={1.5} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(modal === 'add' || modal?._id) && (
        <ServiceTypeModal item={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}
