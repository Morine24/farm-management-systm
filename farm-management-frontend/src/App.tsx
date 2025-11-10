import React, { ErrorInfo, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { SocketProvider } from './contexts/SocketContext';
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
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CropSync...</p>
        </div>
      </div>
    );
  }

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
          <Route path="/livestock" element={<Livestock />} />
        )}
        {!isWorker && !isFinancialManager && (
          <Route path="/users" element={<Users />} />
        )}
        {!isWorker && (
          <Route path="/reports" element={<Reports />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <SocketProvider>
          <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <AppRoutes />
            <InstallPWA />
          </Router>
        </SocketProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;