import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../components/CustomerNavbar';
import { AuthContext } from '../context/AuthContext';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, loadUser } = useContext(AuthContext);
  
  // Original values (for cancel functionality)
  const [originalData, setOriginalData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  
  // Current form data
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  
  // Edit states for each field
  const [editingFields, setEditingFields] = useState({
    full_name: false,
    email: false,
    phone: false,
    password: false,
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Refs for auto-focusing inputs
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        const fetchedUser = await loadUser();
        if (fetchedUser) {
          const data = {
            full_name: fetchedUser.full_name || '',
            email: fetchedUser.email || '',
            phone: fetchedUser.phone || '',
          };
          setFormData({
            ...data,
            password: '',
            confirmPassword: '',
          });
          setOriginalData(data);
        }
      } else {
        const data = {
          full_name: user.full_name || '',
          email: user.email || '',
          phone: user.phone || '',
        };
        setFormData({
          ...data,
          password: '',
          confirmPassword: '',
        });
        setOriginalData(data);
      }
    };
    fetchUserData();
  }, [user, loadUser]);

  // Auto-focus when edit mode is enabled
  useEffect(() => {
    if (editingFields.full_name && fullNameRef.current) {
      fullNameRef.current.focus();
    }
  }, [editingFields.full_name]);

  useEffect(() => {
    if (editingFields.email && emailRef.current) {
      emailRef.current.focus();
    }
  }, [editingFields.email]);

  useEffect(() => {
    if (editingFields.phone && phoneRef.current) {
      phoneRef.current.focus();
    }
  }, [editingFields.phone]);

  useEffect(() => {
    if (editingFields.password && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [editingFields.password]);

  const handleEditClick = (field) => {
    setEditingFields(prev => ({ ...prev, [field]: true }));
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    // Reset to original values
    setFormData({
      ...originalData,
      password: '',
      confirmPassword: '',
    });
    setEditingFields({
      full_name: false,
      email: false,
      phone: false,
      password: false,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate password if password editing is enabled
    if (editingFields.password) {
      if (!formData.password || formData.password.trim() === '') {
        setError('Please enter a new password');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    }
    
    setLoading(true);

    try {
      // Only include password if it's provided
      const updateData = { ...formData };
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }
      delete updateData.confirmPassword;

      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Update failed');

      setSuccess(data.message || 'Profile updated successfully!');
      
      // Reload user data to reflect changes
      await loadUser();
      
      setTimeout(() => {
        navigate('/customer/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit icon SVG
  const EditIcon = ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <CustomerNavbar />
      <main className="flex justify-center items-start p-6 md:p-8">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6">
            <h2 className="text-3xl font-bold text-white">Edit Profile</h2>
            <p className="text-gray-300 mt-1">Manage your account information</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fullNameRef}
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    onDoubleClick={() => handleEditClick('full_name')}
                    readOnly={!editingFields.full_name}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      editingFields.full_name
                        ? 'border-blue-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                        : 'border-gray-200 bg-gray-50 cursor-text'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleEditClick('full_name')}
                    className={`p-3 rounded-lg transition-colors ${
                      editingFields.full_name
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={editingFields.full_name}
                  >
                    <EditIcon />
                  </button>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={emailRef}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onDoubleClick={() => handleEditClick('email')}
                    readOnly={!editingFields.email}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      editingFields.email
                        ? 'border-blue-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                        : 'border-gray-200 bg-gray-50 cursor-text'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleEditClick('email')}
                    className={`p-3 rounded-lg transition-colors ${
                      editingFields.email
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={editingFields.email}
                  >
                    <EditIcon />
                  </button>
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={phoneRef}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onDoubleClick={() => handleEditClick('phone')}
                    readOnly={!editingFields.phone}
                    placeholder={formData.phone || "Not set"}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      editingFields.phone
                        ? 'border-blue-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                        : 'border-gray-200 bg-gray-50 cursor-text'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleEditClick('phone')}
                    className={`p-3 rounded-lg transition-colors ${
                      editingFields.phone
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={editingFields.phone}
                  >
                    <EditIcon />
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                {!editingFields.password ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50">
                      <span className="text-gray-600">Change Password</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditClick('password')}
                      className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <EditIcon />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        ref={passwordRef}
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        className="flex-1 px-4 py-3 rounded-lg border-2 border-blue-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFields(prev => ({ ...prev, password: false }));
                          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                        }}
                        className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your new password"
                      className="w-full px-4 py-3 rounded-lg border-2 border-blue-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3 px-6 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold hover:from-gray-800 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;
