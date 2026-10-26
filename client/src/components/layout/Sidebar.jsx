import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Settings,
  LogOut,
  BookOpen,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vehicles', icon: Car, label: 'My Vehicles' },
];

const ADMIN_ITEMS = [
  { to: '/admin/service-types', icon: Settings, label: 'Service Types' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-input text-sm font-medium transition-all duration-fast
     ${isActive
       ? 'text-accent bg-accent/10 border-l-2 border-accent pl-[10px]'
       : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
     }`;

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 flex flex-col
        w-sidebar bg-surface border-r border-border
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      aria-label="Sidebar navigation"
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-button flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-background" strokeWidth={2} />
          </div>
          <span className="text-text-primary font-semibold text-base tracking-tight">ServiceBook</span>
        </div>
        <button
          className="lg:hidden text-text-muted hover:text-text-primary p-1"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider px-3 mb-2">
          Navigation
        </p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={navLinkClass} onClick={onClose}>
            <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider px-3 mt-5 mb-2">
              Admin
            </p>
            {ADMIN_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={navLinkClass} onClick={onClose}>
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* ── User menu ─────────────────────────────────────────────────────── */}
      <div className="border-t border-border p-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-input hover:bg-elevated transition-colors">
          <div
            className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center
                       text-accent text-xs font-semibold flex-shrink-0"
            aria-hidden="true"
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-sm font-medium truncate">{user?.name}</p>
            <p className="text-text-muted text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-text-muted hover:text-danger transition-colors p-1"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
