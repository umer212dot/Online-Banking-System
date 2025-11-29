// Updated AdminDashboard.jsx with corrected histogram implementation
// (Full file content rewritten based on user request)

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { AuthContext } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const StatCard = ({ label, value, subtitle, icon }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {icon}
  </div>
);

const InlineIcon = ({ bg, children }) => (
  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
    {children}
  </div>
);

// Daily Transactions Volume Bar Chart Component - Last 15 Days
const DailyTransactionsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-500 text-sm">No data to display.</p>
      </div>
    );
  }

  // Calculate max value from data for dynamic Y-axis, with a minimum range
  const maxValue = Math.max(...data.map(d => d.totalAmount || 0), 100000);
  // Round up to nearest 100k for cleaner Y-axis
  const maxY = Math.ceil(maxValue / 100000) * 100000;

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={[0, maxY]}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip
            formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Total Amount']}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
          <Bar dataKey="totalAmount" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

const formatNumber = (value) => (Number(value) || 0).toLocaleString();

const AdminDashboard = () => {
  const { user, loadUser, loading } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    if (!user) loadUser();
  }, [user, loadUser]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/dashboard', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load dashboard data');

      const data = await res.json();

      // Format daily data: last 15 days with formatted date labels
      if (data.volume?.daily) {
        data.volume.daily = data.volume.daily.map((d) => {
          const date = new Date(d.date);
          return {
            ...d,
            dateLabel: date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
          };
        });
      }

      setStats(data);
      setStatsError('');
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: 'Total Users',
        value: formatNumber(stats.totals.users),
        icon: (
          <InlineIcon bg="bg-indigo-50 text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 11a4 4 0 100-8 4 4 0 000 8zm0 0v1a6 6 0 01-6 6H2" />
            </svg>
          </InlineIcon>
        ),
      },
      {
        label: 'Total Accounts',
        value: formatNumber(stats.totals.accounts),
        icon: (
          <InlineIcon bg="bg-emerald-50 text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
            </svg>
          </InlineIcon>
        ),
      },
      {
        label: 'Total Funds',
        value: formatCurrency(stats.totals.funds),
        icon: (
          <InlineIcon bg="bg-yellow-50 text-yellow-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12V5m0 16v-3m0 0c-2.21 0-4-1.343-4-3" />
            </svg>
          </InlineIcon>
        ),
      },
      {
        label: 'Daily Transactions',
        value: formatCurrency(stats.totals.dailyTransactions.amount),
        subtitle: `${formatNumber(stats.totals.dailyTransactions.count)} transactions today`,
        icon: (
          <InlineIcon bg="bg-purple-50 text-purple-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3v18m-7-7l7 7 7-7" />
            </svg>
          </InlineIcon>
        ),
      },
    ];
  }, [stats]);

  const chartData = stats?.volume?.daily || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Overview of platform health and recent activity</p>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
            disabled={statsLoading}
          >
            {statsLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {(loading || statsLoading) && !stats ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-gray-500 text-sm">Loading dashboard data...</p>
          </div>
        ) : statsError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            {statsError}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {cards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Daily Transaction Volume
                </p>
                <p className="text-sm text-gray-500">
                  Total transaction amount for each of the last 15 days
                </p>
              </div>

              <DailyTransactionsChart data={chartData} />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
