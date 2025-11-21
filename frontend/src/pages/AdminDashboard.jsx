import React, { useContext, useEffect, useState } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, loadUser, loading } = useContext(AuthContext);

  useEffect(() => {
    let mounted = true;
    const ensureUser = async () => {
      if (!user) {
        await loadUser();
      }
    };
    ensureUser();
    return () => (mounted = false);
  }, [user, loadUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        {loading ? <p>Loading...</p> : <p>Welcome, {user?.full_name || 'Guest'}!</p>}
      </main>
    </div>
  );
};

export default AdminDashboard;
