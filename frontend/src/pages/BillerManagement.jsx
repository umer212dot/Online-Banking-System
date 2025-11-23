import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AdminNavbar from '../components/AdminNavbar';
import { AuthContext } from '../context/AuthContext';

const BillerManagement = () => {
  const { user, loadUser } = useContext(AuthContext);
  const [billers, setBillers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    biller_name: '',
    category: '',
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

  // Fetch billers
  useEffect(() => {
    fetchBillers();
  }, []);

  const fetchBillers = async () => {
    try {
      const response = await axios.get('/api/bill/billers/all');
      if (response.data.billers) {
        setBillers(response.data.billers);
      }
    } catch (err) {
      console.error('Error fetching billers:', err);
      setError('Failed to load billers');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('/api/bill/biller', formData);
      setSuccess(response.data.message || 'Biller added successfully!');
      setFormData({ biller_name: '', category: '' });
      setShowAddForm(false);
      fetchBillers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add biller');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (billerId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.patch(`/api/bill/biller/${billerId}/status`, { status: newStatus });
      setSuccess(response.data.message || `Biller ${newStatus} successfully!`);
      fetchBillers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update biller status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (billerId, billerName) => {
    if (!window.confirm(`Are you sure you want to delete "${billerName}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.delete(`/api/bill/biller/${billerId}`);
      setSuccess(response.data.message || 'Biller deleted successfully!');
      fetchBillers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete biller');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['electricity', 'gas', 'water', 'internet', 'other'];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Biller Management</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold"
          >
            {showAddForm ? 'Cancel' : '+ Add Biller'}
          </button>
        </div>

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

        {/* Add Biller Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Biller</h2>
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biller Name
                </label>
                <input
                  type="text"
                  name="biller_name"
                  value={formData.biller_name}
                  onChange={handleChange}
                  placeholder="Enter biller name"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Biller'}
              </button>
            </form>
          </div>
        )}

        {/* Billers List */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">All Billers</h2>

          {billers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No billers found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {billers.map((biller) => (
                <div
                  key={biller.biller_id}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{biller.biller_name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{biller.category}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                        biller.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {biller.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusToggle(biller.biller_id, biller.status)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                        biller.status === 'active'
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {biller.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(biller.biller_id, biller.biller_name)}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BillerManagement;

