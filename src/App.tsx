import React, { ErrorInfo, Component, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './contexts/ToastContext';
import { smartAlertService } from './services/smartAlertService';
import { financialAutomation } from './services/financialAutomation';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkerDashboard from './pages/WorkerDashboard';

// Lazy load heavy pages
const Farms = lazy(() => import('./pages/Farms'));
const AddSection = lazy(() => import('./pages/AddSection'));
const Crops = lazy(() => import('./pages/Crops'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Financial = lazy(() => import('./pages/Financial'));
const Weather = lazy(() => import('./pages/Weather'));
const Users = lazy(() => import('./pages/Users'));
const Labour = lazy(() => import('./pages/Labour'));
const Reports = lazy(() => import('./pages/Reports'));
const Livestock = lazy(() => import('./pages/Livestock'));
const LivestockInventory = lazy(() => import('./pages/LivestockInventory'));
const Analytics = lazy(() => import('./pages/Analytics'));
import InstallPWA from './components/InstallPWA';
import OfflineIndicator from './components/OfflineIndicator';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): {hasError: boolean} {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppRoutes: React.FC = () => {
  const { user, isAdmin, isManager, isWorker } = useUser();

  useEffect(() => {
    if (user) {
      smartAlertService.startMonitoring();
      financialAutomation.startAutomation();
      return () => {
        smartAlertService.stopMonitoring();
        financialAutomation.stopAutomation();
      };
    }
  }, [user]);

  if (!user) {
    return <Login />;
  }

  const getDashboard = () => {
    if (isWorker) return <WorkerDashboard />;
    return <Dashboard />;
  };

  return (
    <Layout>
      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-500">Loading...</div></div>}>
        <Routes>
        <Route path="/" element={getDashboard()} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/livestock" element={<Livestock />} />
        <Route path="/livestock-inventory" element={<LivestockInventory />} />
        {(isManager || isAdmin) && (
          <>
            <Route path="/farms" element={<Farms />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/financial" element={<Financial />} />
            <Route path="/labour" element={<Labour />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/analytics" element={<Analytics />} />
          </>
        )}
        {isAdmin && (
          <>
            <Route path="/add-section" element={<AddSection />} />
            <Route path="/users" element={<Users />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <UserProvider>
          <SocketProvider>
            <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
              <OfflineIndicator />
              <AppRoutes />
              <InstallPWA />
            </Router>
          </SocketProvider>
        </UserProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;