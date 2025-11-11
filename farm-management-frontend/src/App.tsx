import React, { ErrorInfo, Component, useEffect } from 'react';
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
import FinancialDashboard from './pages/FinancialDashboard';
import Farms from './pages/Farms';
import AddSection from './pages/AddSection';
import Crops from './pages/Crops';
import Tasks from './pages/Tasks';
import Inventory from './pages/Inventory';
import Financial from './pages/Financial';
import Weather from './pages/Weather';
import Users from './pages/Users';
import Labour from './pages/Labour';
import Reports from './pages/Reports';
import Livestock from './pages/Livestock';
import LivestockInventory from './pages/LivestockInventory';
import Analytics from './pages/Analytics';
import InstallPWA from './components/InstallPWA';

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
  const { user, isWorker, isFinancialManager } = useUser();

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
    if (isFinancialManager) return <FinancialDashboard />;
    return <Dashboard />;
  };

  return (
    <Layout>
      <Routes>
        <Route path="/" element={getDashboard()} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/livestock" element={<Livestock />} />
        {!isWorker && (
          <>
            <Route path="/farms" element={<Farms />} />
            <Route path="/add-section" element={<AddSection />} />
            <Route path="/weather" element={<Weather />} />
          </>
        )}
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/financial" element={<Financial />} />
        {!isWorker && (
          <Route path="/labour" element={<Labour />} />
        )}
        {!isWorker && (
          <>
            <Route path="/livestock" element={<Livestock />} />
            <Route path="/livestock-inventory" element={<LivestockInventory />} />
          </>
        )}
        {!isWorker && !isFinancialManager && (
          <Route path="/users" element={<Users />} />
        )}
        {!isWorker && (
          <Route path="/reports" element={<Reports />} />
        )}
        {!isWorker && (
          <Route path="/analytics" element={<Analytics />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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