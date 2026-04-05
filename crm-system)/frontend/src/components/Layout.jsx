import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, TrendingUp, Activity,
  LogOut, Menu, X, ChevronDown, Settings, UserCircle, User,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/leads', icon: TrendingUp, label: 'Leads' },
  { to: '/activities', icon: Activity, label: 'Activities' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">AU CRM</span>
          </div>
          <button className="lg:hidden p-1 rounded hover:bg-gray-100" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/users"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
              }
            >
              <Settings size={18} />
              User Management
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <UserCircle size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role === 'ADMIN' ? 'Admin' : 'Employee'}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <NavLink
                  to="/profile"
                  onClick={() => { setProfileOpen(false); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={16} />
                  My Profile
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserCircle size={18} />
            <span className="hidden sm:inline">{user?.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
