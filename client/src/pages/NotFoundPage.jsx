import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-accent text-6xl font-bold mb-4 tabular-nums">404</p>
        <h1 className="text-text-primary text-2xl font-semibold mb-2">Page not found</h1>
        <p className="text-text-secondary mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
