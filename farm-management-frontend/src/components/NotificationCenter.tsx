import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: any;
  data?: any;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
      
      // Show browser notification for new high priority items
      notifs.forEach(n => {
        if (!n.read && n.priority === 'high' && Notification.permission === 'granted') {
          new Notification(n.title, {
            body: n.message,
            icon: '/logo192.png'
          });
        }
      });
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifs.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-500';
      case 'medium': return 'bg-yellow-100 border-yellow-500';
      default: return 'bg-blue-100 border-blue-500';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return '📋';
      case 'task_overdue': return '⏰';
      case 'task_completed': return '✅';
      case 'low_inventory': return '📦';
      case 'payment_due': return '💰';
      case 'weather_alert': return '🌡️';
      case 'equipment_failure': return '⚠️';
      default: return '🔔';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-400 hover:text-gray-500"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />
          <div className="fixed sm:absolute top-16 sm:top-auto right-2 sm:right-0 mt-0 sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 bg-white rounded-lg shadow-xl z-50 max-h-[70vh] sm:max-h-[600px] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 sm:p-4 border-b border-l-4 ${getPriorityColor(notif.priority)} ${
                      !notif.read ? 'bg-blue-50' : 'bg-white'
                    } hover:bg-gray-50`}
                  >
                    <div className="flex items-start">
                      <span className="text-lg sm:text-2xl mr-2 sm:mr-3">{getIcon(notif.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate pr-2">{notif.title}</h4>
                          {!notif.read && (
                            <span className="ml-2 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notif.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <Check className="h-3 w-3 mr-1" />Mark read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
