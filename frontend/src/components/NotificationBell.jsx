import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newNotificationPulse, setNewNotificationPulse] = useState(false);
  const dropdownRef = useRef(null);

  // Configure axios defaults
  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = 'http://localhost:5000';
  }, []);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const response = await axios.get('/api/notifications');
        if (response.data.notifications) {
          setNotifications(response.data.notifications);
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
  }, [user]);

  // Listen for new notifications via socket
  useEffect(() => {
    if (!user) {
      console.log('User not available');
      return;
    }

    if (!socket) {
      console.log('Socket not available yet, waiting for initialization...');
      return;
    }

    // Set up listener even if not connected yet (will work when connection is established)
    console.log('🔔 Setting up notification listener for socket. Connected:', isConnected, 'Socket ID:', socket.id);

    const handleNewNotification = async (data) => {
      console.log('🔔 New notification received:', data);
      
      // Trigger pulse animation
      setNewNotificationPulse(true);
      setTimeout(() => setNewNotificationPulse(false), 1000);
      
      // Immediately fetch updated notifications
      try {
        const response = await axios.get('/api/notifications');
        if (response.data.notifications) {
          setNotifications(response.data.notifications);
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Error fetching notifications after socket event:', err);
      }
    };

    socket.on('new_notification', handleNewNotification);

    // Also listen for connection events to re-setup if needed
    const handleConnect = () => {
      console.log('Socket connected, notification listener active');
    };

    socket.on('connect', handleConnect);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('connect', handleConnect);
    };
  }, [socket, user, isConnected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.notification_id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'transfer':
        return '💰';
      case 'system_noti':
        return '📢';
      case 'account_activity':
        return '📊';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-2 hover:bg-gray-800 rounded-lg transition-all ${
          newNotificationPulse ? 'animate-pulse' : ''
        }`}
      >
        <svg
          className={`w-6 h-6 ${newNotificationPulse ? 'text-yellow-400' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.notification_id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

