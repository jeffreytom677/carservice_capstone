import { Car } from 'lucide-react';

export default function VehiclesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">My Vehicles</h2>
          <p className="text-text-secondary mt-1">Manage your fleet</p>
        </div>
      </div>
      <div className="card p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-12 h-12 bg-accent/10 rounded-card flex items-center justify-center">
          <Car className="w-6 h-6 text-accent" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-text-primary font-semibold">Vehicles coming in Milestone 5</p>
          <p className="text-text-muted text-sm mt-1">Add and manage your vehicles here.</p>
        </div>
      </div>
    </div>
  );
}
