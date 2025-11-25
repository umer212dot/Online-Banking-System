import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import CustomerNavbar from '../components/CustomerNavbar';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/notifications/all', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'account_activity':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div>
        <CustomerNavbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">All Notifications</h1>

          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <p className="mt-4 text-gray-500">No notifications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`p-4 rounded-lg border ${
                    !notification.is_read
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(
                            notification.type
                          )}`}
                        >
                          {notification.type.replace('_', ' ').toUpperCase()}
                        </span>
                        {!notification.is_read && (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900">{notification.message}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.notification_id)}
                        className="ml-4 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;

