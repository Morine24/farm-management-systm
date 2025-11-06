import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Map, 
  Wheat, 
  CheckSquare, 
  Package, 
  DollarSign, 
  Cloud, 
  Users,
  Menu, 
  X,
  LogOut,
  Briefcase,
  Calendar,
  Download
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import MaintenanceNotifications from './MaintenanceNotifications';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, isManager, isWorker, isFinancialManager } = useUser();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const getNavigation = () => {
    const baseNav = [{ name: 'Dashboard', href: '/', icon: Home }];
    
    if (isWorker) {
      return baseNav;
    }
    
    if (isFinancialManager) {
      return [
        ...baseNav,
        { name: 'Finance', href: '/financial', icon: DollarSign },
        { name: 'Inventory', href: '/inventory', icon: Package },
      ];
    }
    
    if (isManager) {
      return [
        ...baseNav,
        { name: 'Farms', href: '/farms', icon: Map },
        { name: 'Crops', href: '/crops', icon: Wheat },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
        { name: 'Inventory', href: '/inventory', icon: Package },
        { name: 'Finance', href: '/financial', icon: DollarSign },
        { name: 'Labour', href: '/labour', icon: Briefcase },
        { name: 'Weather', href: '/weather', icon: Cloud },
        { name: 'Users', href: '/users', icon: Users },
      ];
    }
    
    return baseNav;
  };
  
  const navigation = getNavigation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <h1 className="text-xl font-bold text-primary-600">Farm Manager</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 mb-2 rounded-lg text-sm font-medium ${
                    location.pathname === item.href
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b">
            <h1 className="text-xl font-bold text-primary-600">Farm Manager</h1>
          </div>
          <nav className="flex-1 px-4 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 mb-2 rounded-lg text-sm font-medium ${
                    location.pathname === item.href
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 bg-white border-b border-gray-200">
          <button
            className="px-4 text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-2 sm:px-4">
            <div className="flex items-center">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Install App"
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
              <NotificationCenter />
              <MaintenanceNotifications />
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden sm:inline text-sm text-gray-700">{user?.name}</span>
                <button
                  onClick={() => {
                    setUser(null);
                    navigate('/login');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;