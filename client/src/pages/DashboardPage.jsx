import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/services.js';
import { Car, AlertTriangle, CheckCircle, DollarSign, TrendingUp, Clock, ArrowRight } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color = 'accent' }) {
  const colors = { accent: 'text-accent bg-accent/10', danger: 'text-danger bg-danger/10', success: 'text-success bg-success/10', info: 'text-info bg-info/10' };
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-card flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-text-primary text-2xl font-bold tabular-nums mt-0.5">{value}</p>
        {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ServiceItem({ item, type }) {
  const color = type === 'overdue' ? 'danger' : 'warning';
  const badge = type === 'overdue' ? 'badge-danger' : 'badge-warning';
  const label = type === 'overdue' ? 'OVERDUE' : 'DUE SOON';
  return (
    <div className="flex items-center justify-between py-3 border-t border-border first:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 bg-${color}`} />
        <div className="min-w-0">
          <p className="text-text-primary text-sm font-medium truncate">
            {item.vehicle?.make} {item.vehicle?.model}
            <span className="text-text-muted font-normal ml-1">· {item.vehicle?.regNumber}</span>
          </p>
          <p className="text-text-secondary text-xs mt-0.5">{item.serviceType?.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {item.nextDueDate && (
          <span className="text-text-muted text-xs tabular-nums">
            {new Date(item.nextDueDate).toLocaleDateString('en-IN')}
          </span>
        )}
        <span className={badge}>{label}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await dashboardService.get();
      setData(res.data.data);
    } catch { setError('Failed to load dashboard.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card p-5 h-24 skeleton" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5 h-64 skeleton" />
        <div className="card p-5 h-64 skeleton" />
      </div>
    </div>
  );

  if (error) return (
    <div className="card p-12 flex flex-col items-center text-center gap-4">
      <AlertTriangle className="w-10 h-10 text-danger" strokeWidth={1.5} />
      <p className="text-text-primary font-semibold">{error}</p>
      <button onClick={load} className="btn-secondary">Retry</button>
    </div>
  );

  const { upcomingServices = [], overdueServices = [], totalSpend = 0, vehicleCount = 0 } = data || {};
  const alertCount = upcomingServices.length + overdueServices.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Dashboard</h2>
        <p className="text-text-secondary mt-1">Your fleet at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Car} label="Vehicles" value={vehicleCount} sub="Active in fleet" color="info" />
        <StatCard icon={DollarSign} label="Total Spend" value={`₹${totalSpend.toLocaleString('en-IN')}`} sub="All time" color="accent" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdueServices.length} sub="Need attention" color="danger" />
        <StatCard icon={Clock} label="Due Soon" value={upcomingServices.length} sub="Within 7 days / 500 km" color="warning" />
      </div>

      {/* Alerts panel */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Overdue */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-danger" strokeWidth={1.5} /> Overdue Services
            </h3>
            {overdueServices.length > 0 && <span className="badge-danger">{overdueServices.length}</span>}
          </div>
          {overdueServices.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <CheckCircle className="w-8 h-8 text-success" strokeWidth={1.5} />
              <p className="text-text-secondary text-sm">All services are up to date!</p>
            </div>
          ) : (
            <div>{overdueServices.map((s) => <ServiceItem key={s.serviceRecordId} item={s} type="overdue" />)}</div>
          )}
        </div>

        {/* Upcoming */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" strokeWidth={1.5} /> Upcoming Services
            </h3>
            {upcomingServices.length > 0 && <span className="badge-warning">{upcomingServices.length}</span>}
          </div>
          {upcomingServices.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <TrendingUp className="w-8 h-8 text-success" strokeWidth={1.5} />
              <p className="text-text-secondary text-sm">Nothing due in the next 7 days.</p>
            </div>
          ) : (
            <div>{upcomingServices.map((s) => <ServiceItem key={s.serviceRecordId} item={s} type="upcoming" />)}</div>
          )}
        </div>
      </div>

      {/* Quick link */}
      <Link to="/vehicles" className="card p-4 flex items-center justify-between hover:bg-elevated transition-colors group">
        <div className="flex items-center gap-3">
          <Car className="w-5 h-5 text-accent" strokeWidth={1.5} />
          <span className="text-text-primary font-medium">Manage your vehicles</span>
        </div>
        <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" strokeWidth={1.5} />
      </Link>
    </div>
  );
}
