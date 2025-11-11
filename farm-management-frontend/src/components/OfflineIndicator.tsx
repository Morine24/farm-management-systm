import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('api-offline', handleOffline);
    window.addEventListener('api-online', handleOnline);

    return () => {
      window.removeEventListener('api-offline', handleOffline);
      window.removeEventListener('api-online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <WifiOff className="w-5 h-5" />
      <span>Server unavailable - Some features may not work</span>
    </div>
  );
};

export default OfflineIndicator;
