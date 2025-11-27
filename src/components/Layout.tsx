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
  Download,
  FileText,
  Beef,
  BarChart3,
  Upload
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import NotificationCenter from './NotificationCenter';
import ProfileModal from './ProfileModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('/loosian-logo.jpg');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, isSuperAdmin, isAdmin, isManager, isWorker, canManageUsers } = useUser();
  
  console.log('Current user:', user);
  console.log('User role:', user?.role);
  console.log('isAdmin:', isAdmin);
  console.log('isSuperAdmin:', isSuperAdmin);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isSuperAdmin) {
      e.preventDefault();
      setShowLogoModal(true);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveLogo = () => {
    if (logoFile) {
      // Save to localStorage for now (in production, upload to server/Firebase Storage)
      localStorage.setItem('farmLogo', logoPreview);
      alert('Logo updated successfully!');
    }
    setShowLogoModal(false);
  };

  useEffect(() => {
    const savedLogo = localStorage.getItem('farmLogo');
    if (savedLogo) {
      setLogoPreview(savedLogo);
    }
  }, []);



  const getNavigation = () => {
    const nav = [{ name: 'Dashboard', href: '/', icon: Home }];
    
    if (isWorker) {
      nav.push(
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
        { name: 'Crops', href: '/crops', icon: Wheat },
        { name: 'Livestock', href: '/livestock', icon: Beef },
        { name: 'Weather', href: '/weather', icon: Cloud }
      );
    } else if (isAdmin) {
      // Admin and Super Admin navigation
      nav.push(
        { name: 'Farms', href: '/farms', icon: Map },
        { name: 'Crops', href: '/crops', icon: Wheat },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
        { name: 'Livestock', href: '/livestock', icon: Beef },
        { name: 'Inventory', href: '/inventory', icon: Package },
        { name: 'Finance', href: '/financial', icon: DollarSign },
        { name: 'Labour', href: '/labour', icon: Briefcase },
        { name: 'Weather', href: '/weather', icon: Cloud },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Staffing', href: '/users', icon: Users },
        { name: 'Reports', href: '/reports', icon: FileText }
      );
    } else if (isManager) {
      nav.push(
        { name: 'Farms', href: '/farms', icon: Map },
        { name: 'Crops', href: '/crops', icon: Wheat },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
        { name: 'Livestock', href: '/livestock', icon: Beef },
        { name: 'Inventory', href: '/inventory', icon: Package },
        { name: 'Finance', href: '/financial', icon: DollarSign },
        { name: 'Labour', href: '/labour', icon: Briefcase },
        { name: 'Weather', href: '/weather', icon: Cloud },
        { name: 'Reports', href: '/reports', icon: FileText }
      );
    }
    
    return nav;
  };
  
  const navigation = getNavigation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { handleLogoClick(e); setSidebarOpen(false); }}>
              <img src={logoPreview} alt="Loosian Farm" className="h-8 w-8 rounded" />
              <h1 className="text-xl font-bold text-primary-600">Loosian Farm</h1>
            </div>
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
            <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleLogoClick}>
              <img src={logoPreview} alt="Loosian Farm" className="h-8 w-8 rounded" />
              <h1 className="text-xl font-bold text-primary-600">Loosian Farm</h1>
            </div>
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

              <NotificationCenter />
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div 
                  onClick={() => setShowProfileModal(true)}
                  className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center cursor-pointer hover:opacity-80"
                >
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-sm text-gray-700 cursor-pointer hover:text-primary-600" onClick={() => setShowProfileModal(true)}>{user?.name}</span>
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

      {/* Logo Edit Modal */}
      {showLogoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Farm Logo</h3>
              <button onClick={() => setShowLogoModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <img src={logoPreview} alt="Farm Logo" className="h-32 w-32 rounded-lg object-cover border" />
              
              <label className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700">
                <Upload className="h-4 w-4" />
                <span>Upload New Logo</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              
              {logoFile && (
                <button onClick={saveLogo} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Save Logo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
    </div>
  );
};

export default Layout;