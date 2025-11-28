import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { AuthContext } from '../context/AuthContext';

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

const Chart = ({ data, title }) => {
  if (!data?.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-500 text-sm">Not enough data to display.</p>
      </div>
    );
  }

  const width = 800;
  const height = 280;
  const paddingX = 48;
  const paddingY = 32;
  const maxAmount = Math.max(...data.map((d) => d.totalAmount), 1);

  const points = data.map((item, idx) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX + (idx / (data.length - 1)) * (width - paddingX * 2);
    const y =
      height - paddingY - (item.totalAmount / maxAmount) * (height - paddingY * 2);
    return { ...item, x, y };
  });

  const pathD = points.map((point, idx) => `${idx === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <p className="text-xs text-gray-400">Volume represents total transaction amount.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px]">
          <defs>
            <linearGradient id="chartLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          {/* Grid Lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={paddingX}
              x2={width - paddingX}
              y1={paddingY + ratio * (height - paddingY * 2)}
              y2={paddingY + ratio * (height - paddingY * 2)}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
            />
          ))}
          {/* Line */}
          <path d={pathD} fill="none" stroke="url(#chartLine)" strokeWidth="3" strokeLinecap="round" />
          {/* Dots */}
          {points.map((point) => (
            <g key={point.date}>
              <circle cx={point.x} cy={point.y} r="5" fill="#fff" stroke="#6366f1" strokeWidth="2" />
              <text
                x={point.x}
                y={height - 6}
                textAnchor="middle"
                className="text-xs"
                fill="#6b7280"
              >
                {new Date(point.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </text>
            </g>
          ))}
        </svg>
      </div>
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
  const [range, setRange] = useState('weekly');

  useEffect(() => {
    const ensureUser = async () => {
      if (!user) {
        await loadUser();
      }
    };
    ensureUser();
  }, [user, loadUser]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/dashboard', {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load dashboard data');
      }
      const data = await res.json();
      setStats(data);
      setStatsError('');
    } catch (err) {
      setStatsError(err.message || 'Failed to load dashboard data');
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a4 4 0 00-4-4h-1M9 11a4 4 0 100-8 4 4 0 000 8zm0 0v1a6 6 0 01-6 6H2"
              />
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
              />
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12V5m0 16v-3m0 0c-2.21 0-4-1.343-4-3"
              />
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 3v18m-7-7l7 7 7-7"
              />
            </svg>
          </InlineIcon>
        ),
      },
    ];
  }, [stats]);

  const chartData = stats?.volume?.[range] || [];

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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">Daily Transaction Volume</p>
                  <p className="text-sm text-gray-500">
                    Track transaction flow across the last {range === 'weekly' ? '7 days' : '30 days'}.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  {['weekly', 'monthly'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setRange(option)}
                      className={`px-3 py-1 text-sm font-semibold rounded-md transition ${
                        range === option ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {option === 'weekly' ? 'Weekly' : 'Monthly'}
                    </button>
                  ))}
                </div>
              </div>
              <Chart
                data={chartData}
                title={`Daily Transaction Volume (${range === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'})`}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
