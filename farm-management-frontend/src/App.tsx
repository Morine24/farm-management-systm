import React from 'react';
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
import InstallPWA from './components/InstallPWA';

const AppRoutes: React.FC = () => {
  const { user, isWorker, isFinancialManager } = useUser();

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
        {!isWorker && (
          <>
            <Route path="/farms" element={<Farms />} />
            <Route path="/add-section" element={<AddSection />} />
            <Route path="/crops" element={<Crops />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/weather" element={<Weather />} />
          </>
        )}
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/financial" element={<Financial />} />
        {!isWorker && (
          <Route path="/labour" element={<Labour />} />
        )}
        {!isWorker && !isFinancialManager && (
          <Route path="/users" element={<Users />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <UserProvider>
      <SocketProvider>
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <AppRoutes />
          <InstallPWA />
        </Router>
      </SocketProvider>
    </UserProvider>
  );
}

export default App;