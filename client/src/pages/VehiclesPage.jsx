import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { vehicleService } from '../services/services.js';
import { Car, Plus, Archive, ChevronRight, AlertTriangle, Loader2, X } from 'lucide-react';

function VehicleModal({ vehicle, onClose, onSave }) {
  const isEdit = !!vehicle?._id;
  const [form, setForm] = useState({ make: vehicle?.make || '', model: vehicle?.model || '', year: vehicle?.year || '', regNumber: vehicle?.regNumber || '', odometer: vehicle?.odometer || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const f = (name) => ({ value: form[name], onChange: (e) => { setForm(p => ({ ...p, [name]: e.target.value })); setErrors(p => ({ ...p, [name]: '' })); } });

  const validate = () => {
    const e = {};
    if (!form.make.trim()) e.make = 'Required';
    if (!form.model.trim()) e.model = 'Required';
    if (!form.year || form.year < 1900 || form.year > new Date().getFullYear() + 1) e.year = 'Valid year required';
    if (!form.regNumber.trim()) e.regNumber = 'Required';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed.';
      setErrors({ form: msg });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        {errors.form && <div className="bg-danger/10 border border-danger/30 text-danger rounded-input px-3 py-2 text-sm mb-4">{errors.form}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Make</label><input className={`input ${errors.make ? 'border-danger' : ''}`} placeholder="Maruti Suzuki" {...f('make')} />{errors.make && <p className="text-danger text-xs mt-1">{errors.make}</p>}</div>
            <div><label className="label">Model</label><input className={`input ${errors.model ? 'border-danger' : ''}`} placeholder="Swift" {...f('model')} />{errors.model && <p className="text-danger text-xs mt-1">{errors.model}</p>}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Year</label><input type="number" className={`input ${errors.year ? 'border-danger' : ''}`} placeholder="2021" {...f('year')} />{errors.year && <p className="text-danger text-xs mt-1">{errors.year}</p>}</div>
            <div><label className="label">Reg. Number</label><input className={`input uppercase ${errors.regNumber ? 'border-danger' : ''}`} placeholder="MH01AB1234" {...f('regNumber')} />{errors.regNumber && <p className="text-danger text-xs mt-1">{errors.regNumber}</p>}</div>
          </div>
          <div><label className="label">Odometer (km)</label><input type="number" className="input" placeholder="0" {...f('odometer')} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | vehicle object
  const [archiving, setArchiving] = useState(null);
  const [includeArchived, setIncludeArchived] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await vehicleService.list({ includeArchived });
      setVehicles(res.data.data);
    } catch { setError('Failed to load vehicles.'); }
    finally { setLoading(false); }
  }, [includeArchived]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    if (modal?._id) await vehicleService.update(modal._id, form);
    else await vehicleService.create(form);
    load();
  };

  const handleArchive = async (v) => {
    if (!window.confirm(`Archive ${v.make} ${v.model}? You can still view its history.`)) return;
    setArchiving(v._id);
    try { await vehicleService.archive(v._id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Archive failed.'); }
    finally { setArchiving(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">My Vehicles</h2><p className="text-text-secondary mt-1">Manage your fleet</p></div>
        <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <label className="flex items-center gap-2 text-text-secondary text-sm cursor-pointer">
        <input type="checkbox" checked={includeArchived} onChange={e => setIncludeArchived(e.target.checked)} className="rounded border-border bg-elevated text-accent focus:ring-accent" />
        Show archived vehicles
      </label>

      {loading && <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-5 h-20 skeleton" />)}</div>}

      {error && <div className="card p-12 flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="w-8 h-8 text-danger" strokeWidth={1.5} />
        <p className="text-text-primary font-semibold">{error}</p>
        <button onClick={load} className="btn-secondary">Retry</button>
      </div>}

      {!loading && !error && vehicles.length === 0 && (
        <div className="card p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 bg-accent/10 rounded-card flex items-center justify-center">
            <Car className="w-7 h-7 text-accent" strokeWidth={1.5} />
          </div>
          <div><p className="text-text-primary font-semibold text-lg">No vehicles yet</p><p className="text-text-muted text-sm mt-1">Add your first vehicle to start tracking services.</p></div>
          <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Vehicle</button>
        </div>
      )}

      {!loading && !error && vehicles.length > 0 && (
        <div className="space-y-3">
          {vehicles.map(v => (
            <div key={v._id} className={`card p-5 flex items-center justify-between group hover:bg-elevated transition-colors ${v.isArchived ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-accent/10 rounded-card flex items-center justify-center flex-shrink-0">
                  <Car className="w-5 h-5 text-accent" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-text-primary font-semibold">{v.make} {v.model}</p>
                    {v.isArchived && <span className="badge-muted">Archived</span>}
                  </div>
                  <p className="text-text-muted text-sm">{v.year} · {v.regNumber} · <span className="tabular-nums">{v.odometer.toLocaleString('en-IN')} km</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!v.isArchived && <>
                  <button onClick={() => setModal(v)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                  <button onClick={() => handleArchive(v)} disabled={archiving === v._id} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    {archiving === v._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />} Archive
                  </button>
                </>}
                <Link to={`/vehicles/${v._id}`} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 group-hover:border-accent group-hover:text-accent transition-colors">
                  History <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'add' || modal?._id) && (
        <VehicleModal vehicle={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}
