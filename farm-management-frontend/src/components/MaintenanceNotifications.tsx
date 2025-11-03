import React, { useState, useEffect } from 'react';
import { Bell, X, AlertCircle } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { checkUpcomingTasks, MaintenanceNotification } from '../utils/notificationChecker';

const MaintenanceNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<MaintenanceNotification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [crops, setCrops] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'crops'), (snapshot) => {
      const cropsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCrops(cropsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (crops.length > 0) {
      const upcomingTasks = checkUpcomingTasks(crops);
      setNotifications(upcomingTasks);
    }
  }, [crops]);

  return (
    <>
      <button 
        onClick={() => setShowPanel(!showPanel)} 
        className="relative p-2 text-gray-400 hover:text-gray-500"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Maintenance Reminders</h3>
            <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No upcoming tasks</p>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start">
                    <AlertCircle className={`h-5 w-5 mr-3 ${notif.daysUntil === 0 ? 'text-red-500' : 'text-yellow-500'}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {notif.taskType} - {notif.cropVariety}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Farm: {notif.farmName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {notif.daysUntil === 0 ? 'Today' : 'Tomorrow'} - {new Date(notif.taskDate).toLocaleDateString()}
                      </p>
                      {notif.pesticides && notif.pesticides.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Pesticides:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {notif.pesticides.map((p, i) => (
                              <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MaintenanceNotifications;
