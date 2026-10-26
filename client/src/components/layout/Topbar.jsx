import { Menu, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/vehicles': 'My Vehicles',
  '/admin/service-types': 'Service Types',
};

function getTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/vehicles/')) return 'Vehicle Details';
  return 'ServiceBook';
}

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-surface flex-shrink-0">
      {/* Mobile hamburger */}
      <button
        className="lg:hidden text-text-secondary hover:text-text-primary p-2 -ml-2"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {/* Page title */}
      <h1 className="text-text-primary font-semibold text-lg lg:ml-0 ml-2">
        {getTitle(pathname)}
      </h1>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          className="relative text-text-secondary hover:text-text-primary p-2 rounded-input
                     hover:bg-elevated transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" strokeWidth={1.5} />
          {/* Unread badge — will be wired up in Milestone 7 */}
        </button>
      </div>
    </header>
  );
}
