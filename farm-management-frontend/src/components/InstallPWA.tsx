import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 3000);
    };

    const installHandler = () => setIsInstalled(true);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installHandler);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert('Install not available. Try:\n1. Chrome menu → Install app\n2. iOS: Share → Add to Home Screen');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      {!showBanner && deferredPrompt && (
        <button
          onClick={() => setShowBanner(true)}
          className="fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-all z-50 animate-bounce"
          title="Install App"
        >
          <Download className="h-6 w-6" />
        </button>
      )}

      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 animate-slide-up">
          <button onClick={() => setShowBanner(false)} className="absolute top-2 right-2 text-white hover:bg-green-700 rounded p-1">
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
      )}
    </>
  );
};

export default InstallPWA;
