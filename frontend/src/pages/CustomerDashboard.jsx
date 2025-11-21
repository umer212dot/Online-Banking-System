import React, { useContext, useEffect, useState } from 'react';
import CustomerNavbar from '../components/CustomerNavbar';
import { AuthContext } from '../context/AuthContext';

const CustomerDashboard = () => {
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
      <CustomerNavbar />
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>
        {loading ? <p>Loading...</p> : <p>Welcome, {user?.full_name || 'Guest'}!</p>}
      </main>
    </div>
  );
};

export default CustomerDashboard;
