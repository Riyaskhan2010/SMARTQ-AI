import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await notificationsAPI.list();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
      const s = getSocket();
      s.on('notificationCreated', (notif) => {
        setNotifications(p => [notif, ...p]);
        setUnreadCount(c => c + 1);
        toast(notif.message, { icon: '🔔', duration: 5000 });
      });
      return () => s.off('notificationCreated');
    }
  }, [user, refresh]);

  const markRead = async (id) => {
    await notificationsAPI.read(id);
    setNotifications(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationsAPI.readAll();
    setNotifications(p => p.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
