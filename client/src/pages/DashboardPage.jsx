import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Dashboard</h2>
        <p className="text-text-secondary mt-1">Your fleet at a glance</p>
      </div>

      {/* Placeholder — full implementation in Milestone 5 */}
      <div className="card p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-12 h-12 bg-accent/10 rounded-card flex items-center justify-center">
          <LayoutDashboard className="w-6 h-6 text-accent" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-text-primary font-semibold">Dashboard coming in Milestone 5</p>
          <p className="text-text-muted text-sm mt-1">Connect your vehicles and service records to see insights here.</p>
        </div>
      </div>
    </div>
  );
}
