import { useParams } from 'react-router-dom';

export default function VehicleDetailPage() {
  const { id } = useParams();
  return (
    <div className="card p-12 text-center">
      <p className="text-text-primary font-semibold">Vehicle detail for {id}</p>
      <p className="text-text-muted text-sm mt-1">Full implementation in Milestone 5.</p>
    </div>
  );
}
