import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const displayName = user?.full_name || 'Guest';
  const initials = displayName
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      {/* Left: Logo */}
      <div className="text-xl font-bold">
        <Link to="/admin">Admin Panel</Link>
      </div>

      {/* Center: Tabs */}
      <div className="flex space-x-6">
        <Link to="/admin/dashboard" className="hover:text-gray-300">Dashboard</Link>
        <Link to="/admin/billers" className="hover:text-gray-300">Billers</Link>
        <Link to="/admin/users" className="hover:text-gray-300">Users</Link>
        <Link to="/admin/accounts" className="hover:text-gray-300">Accounts</Link>
        <Link to="/admin/notifications" className="hover:text-gray-300">Notifications</Link>
        <Link to="/admin/orders" className="hover:text-gray-300">Orders</Link>
        <Link to="/admin/tickets" className="hover:text-gray-300">Tickets</Link>
      </div>

      {/* Right: User dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-2 hover:text-gray-300 focus:outline-none"
        >
          <span className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium">{initials}</span>
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
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;
