import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AdminNavbar from '../components/AdminNavbar';
import { AuthContext } from '../context/AuthContext';

const AdminNotifications = () => {
  const { user, loadUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    user_id: '',
    message: '',
    sendTo: 'all', // 'all' or 'user'
  });

  // Configure axios defaults
  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = 'http://localhost:5000';
  }, []);

  // Load user on mount
  useEffect(() => {
    const ensureUser = async () => {
      if (!user) {
        await loadUser();
      }
    };
    ensureUser();
  }, [user, loadUser]);

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/notifications/users');
        if (response.data.users) {
          setUsers(response.data.users);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        message: formData.message,
        ...(formData.sendTo === 'user' && formData.user_id ? { user_id: parseInt(formData.user_id) } : {})
      };

      const response = await axios.post('/api/notifications/send', payload);
      setSuccess(response.data.message || 'Notification sent successfully!');

      // Reset form
      setFormData({
        user_id: '',
        message: '',
        sendTo: 'all',
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Send System Notification</h1>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-center text-sm">
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send To
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sendTo"
                    value="all"
                    checked={formData.sendTo === 'all'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>All Users</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sendTo"
                    value="user"
                    checked={formData.sendTo === 'user'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Specific User</span>
                </label>
              </div>
            </div>

            {formData.sendTo === 'user' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  required={formData.sendTo === 'user'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Enter notification message"
                required
                rows="4"
                maxLength="255"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.message.length}/255 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;

