import React, { useState, useEffect } from 'react';
import { Bell, X, AlertCircle } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { checkUpcomingTasks, MaintenanceNotification } from '../utils/notificationChecker';

const MaintenanceNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<MaintenanceNotification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [crops, setCrops] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'crops'), (snapshot) => {
      const cropsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCrops(cropsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const notifData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceNotification));
      setNotifications(notifData.filter(n => !n.read));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (crops.length > 0) {
      const upcomingTasks = checkUpcomingTasks(crops);
      upcomingTasks.forEach(async (task) => {
        const notifId = `${task.cropId}_${task.taskType}_${task.taskDate}`;
        const notifData: any = { ...task, read: false };
        if (!notifData.pesticides) delete notifData.pesticides;
        await setDoc(doc(db, 'notifications', notifId), notifData, { merge: true });
      });
    }
  }, [crops]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    tasks.forEach(async (task) => {
      const dueDate = task.dueDate?.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil >= 0 && daysUntil <= 1 && task.status !== 'completed') {
        const notifId = `task_${task.id}_${task.dueDate}`;
        const notifData: any = {
          taskType: task.type,
          taskDate: dueDate.toISOString(),
          daysUntil,
          read: false
        };
        if (task.farmName) notifData.farmName = task.farmName;
        if (task.assignedTo) notifData.assignedTo = task.assignedTo;
        if (task.priority) notifData.priority = task.priority;
        await setDoc(doc(db, 'notifications', notifId), notifData, { merge: true });
      }
    });
  }, [tasks]);

  const markAsRead = async (notification: MaintenanceNotification) => {
    if (notification.id) {
      await updateDoc(doc(db, 'notifications', notification.id), { read: true });
    }
  };

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
                <div key={idx} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => markAsRead(notif)}>
                  <div className="flex items-start">
                    <AlertCircle className={`h-5 w-5 mr-3 ${notif.daysUntil === 0 ? 'text-red-500' : 'text-yellow-500'}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {notif.taskType}{notif.cropVariety ? ` - ${notif.cropVariety}` : ''}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notif.farmName && `Farm: ${notif.farmName}`}
                        {notif.assignedTo && ` • Assigned to: ${notif.assignedTo}`}
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
