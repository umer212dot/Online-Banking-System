import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const CustomerNavbar = () => {
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
      {/* Left: Logo / Home */}
      <div className="text-xl font-bold">
        <Link to="/">Banking System</Link>
      </div>

      {/* Center: Tabs (add more later) */}
      <div className="flex space-x-6">
        <Link to="/" className="hover:text-gray-300">Home</Link>
        <Link to="/services" className="hover:text-gray-300">Services</Link>
        <Link to="/transactions" className="hover:text-gray-300">Transactions</Link>
        <Link to="/currency-converter" className="hover:text-gray-300">Currency Converter</Link>
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

export default CustomerNavbar;
