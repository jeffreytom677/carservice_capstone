import { Settings } from 'lucide-react';

export default function AdminServiceTypesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Service Types</h2>
        <p className="text-text-secondary mt-1">Manage the shared service catalogue</p>
      </div>
      <div className="card p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-12 h-12 bg-accent/10 rounded-card flex items-center justify-center">
          <Settings className="w-6 h-6 text-accent" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-text-primary font-semibold">Service type catalogue — Milestone 5</p>
          <p className="text-text-muted text-sm mt-1">Full CRUD implementation coming in Milestone 5.</p>
        </div>
      </div>
    </div>
  );
}
