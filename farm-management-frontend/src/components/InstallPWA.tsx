import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
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
      setShowInstall(false);
    }
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50">
      <button onClick={() => setShowInstall(false)} className="absolute top-2 right-2 text-white hover:bg-green-700 rounded p-1">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start space-x-3">
        <Download className="h-6 w-6 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Install Farm Manager</h3>
          <p className="text-sm text-green-100 mb-3">Install our app for offline access and better experience</p>
          <button onClick={handleInstall} className="bg-white text-green-600 px-4 py-2 rounded font-medium hover:bg-green-50 transition-colors">
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
