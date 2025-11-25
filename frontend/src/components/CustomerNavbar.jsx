import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const CustomerNavbar = () => {
const navigate = useNavigate();
const [dropdownOpen, setDropdownOpen] = useState(false);
const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
const [notifications, setNotifications] = useState([]);
const { user } = useContext(AuthContext);
const notificationRef = useRef(null);
const userDropdownRef = useRef(null);
const displayName = user?.full_name || 'Guest';
const initials = displayName
.split(' ')
.map((s) => s[0])
.join('')
.slice(0, 2)
.toUpperCase();

// Fetch latest notifications
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications/latest', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  if (user) {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }
}, [user]);

// Close dropdowns when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (notificationRef.current && !notificationRef.current.contains(event.target)) {
      setNotificationDropdownOpen(false);
    }
    if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

const handleLogout = async () => {
try {
await fetch('http://localhost:5000/api/auth/logout', {
method: 'POST',
credentials: 'include',
});
navigate('/login');
} catch (err) {
console.error('Logout failed', err);
}
};

return ( <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
{/* Left: Logo / Home */} <div className="text-xl font-bold"> <Link to="/">Banking System</Link> </div>

  {/* Center: Tabs */}
  <div className="flex space-x-6">
    <Link to="/customer/dashboard" className="hover:text-gray-300">Home</Link>
    <Link to="/transfer" className="hover:text-gray-300">Transfer</Link>
    <Link to="/bill-payment" className="hover:text-gray-300">Bill Payment</Link>
    <Link to="/services" className="hover:text-gray-300">Services</Link>
    <Link to="/transactions" className="hover:text-gray-300">Transactions</Link>
    <Link to="/currency-converter" className="hover:text-gray-300">Currency Converter</Link>
  </div>

  {/* Right: Notifications and User dropdown */}
  <div className="flex items-center space-x-4">
    {/* Notification Bell */}
    <div className="relative" ref={notificationRef}>
      <button
        onClick={() => {
          setNotificationDropdownOpen(!notificationDropdownOpen);
          setDropdownOpen(false);
        }}
        className="relative hover:text-gray-300 focus:outline-none"
      >
        <svg
          className="w-6 h-6"
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
        {notifications.filter(n => !n.is_read).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.filter(n => !n.is_read).length}
          </span>
        )}
      </button>

      {notificationDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white text-gray-900 rounded-lg shadow-lg border z-50">
          <div className="p-3 border-b">
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`p-3 border-b hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t">
            <Link
              to="/notifications"
              onClick={() => setNotificationDropdownOpen(false)}
              className="block w-full text-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Show all notifications
            </Link>
          </div>
        </div>
      )}
    </div>

    {/* User dropdown */}
    <div className="relative" ref={userDropdownRef}>
      <button
        onClick={() => {
          setDropdownOpen(!dropdownOpen);
          setNotificationDropdownOpen(false);
        }}
        className="flex items-center space-x-2 hover:text-gray-300 focus:outline-none"
      >
        <span className="flex items-center space-x-2">
          <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium">
            {initials}
          </span>
          <span>{displayName}</span>
        </span>
        <svg
          className={`w-4 h-4 transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white text-gray-900 rounded-lg shadow-lg border">
          <Link
            to="/edit-profile"
            onClick={() => setDropdownOpen(false)}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
          >
            Edit Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  </div>
</nav>

);
};

export default CustomerNavbar;
