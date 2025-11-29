import { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../components/CustomerNavbar';
import { AuthContext } from '../context/AuthContext';

const AccountDetails = () => {
  const navigate = useNavigate();
  const { user, loadUser, loading } = useContext(AuthContext);
  const [account, setAccount] = useState(null);
  const [financialData, setFinancialData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const ensureUser = async () => {
      if (!user) {
        await loadUser();
      }
    };
    ensureUser();
  }, [user, loadUser]);

  const fetchAccountDetails = useCallback(async () => {
    setIsFetching(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/account/details', {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load account details');
      }
      const data = await res.json();
      setAccount(data.account);
    } catch (err) {
      setError(err.message || 'Failed to load account details');
    } finally {
      setIsFetching(false);
    }
  }, []);

  const fetchFinancialData = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/account/financial-data', {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load financial data');
      }
      const data = await res.json();
      setFinancialData(data.financialData || []);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAccountDetails();
      fetchFinancialData();
    }
  }, [user, fetchAccountDetails, fetchFinancialData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      frozen: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-200 text-gray-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-600';
  };

  // Chart component for financial data
  const FinancialChart = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No financial data available
        </div>
      );
    }

    const maxValue = Math.max(
      ...data.map((d) => Math.max(d.income, d.expense, d.savings)),
      1
    );

    const chartHeight = 300;
    const chartWidth = 800;
    const padding = { top: 20, right: 40, bottom: 40, left: 60 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const getY = (value) => {
      return padding.top + plotHeight - (value / maxValue) * plotHeight;
    };

    const getX = (index) => {
      return padding.left + (index / (data.length - 1 || 1)) * plotWidth;
    };

    return (
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="border border-gray-200 rounded-lg">
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = maxValue * ratio;
            const y = getY(value);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-600"
                >
                  ${(value / 1000).toFixed(1)}k
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {data.map((item, index) => {
            const x = getX(index);
            return (
              <text
                key={index}
                x={x}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {item.month}
              </text>
            );
          })}

          {/* Income line (green) */}
          <polyline
            points={data
              .map((item, index) => `${getX(index)},${getY(item.income)}`)
              .join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
          />
          {data.map((item, index) => (
            <circle
              key={`income-${index}`}
              cx={getX(index)}
              cy={getY(item.income)}
              r="4"
              fill="#10b981"
            />
          ))}

          {/* Expense line (red) */}
          <polyline
            points={data
              .map((item, index) => `${getX(index)},${getY(item.expense)}`)
              .join(' ')}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          />
          {data.map((item, index) => (
            <circle
              key={`expense-${index}`}
              cx={getX(index)}
              cy={getY(item.expense)}
              r="4"
              fill="#ef4444"
            />
          ))}

          {/* Savings line (blue) */}
          <polyline
            points={data
              .map((item, index) => `${getX(index)},${getY(item.savings)}`)
              .join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          {data.map((item, index) => (
            <circle
              key={`savings-${index}`}
              cx={getX(index)}
              cy={getY(item.savings)}
              r="4"
              fill="#3b82f6"
            />
          ))}
        </svg>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-700">Expense</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-700">Savings</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavbar />
        <main className="p-6">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <CustomerNavbar />
      <main className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Details</h1>
            <p className="text-gray-600 mt-1">View your account information and financial overview</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Account Details Card */}
          {isFetching ? (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <p className="text-gray-500">Loading account details...</p>
            </div>
          ) : account ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Account Information</h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-1">
                      Account Number
                    </label>
                    <p className="text-lg font-medium text-gray-900">{account.account_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-1">Balance</label>
                    <p className="text-lg font-medium text-gray-900">
                      ${parseFloat(account.balance).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-1">Status</label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
                        account.status
                      )}`}
                    >
                      {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-1">
                      Account Created on:
                    </label>
                    <p className="text-lg font-medium text-gray-900">{formatDate(account.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Financial Overview Chart */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Financial Overview (Last 6 Months)</h2>
              <p className="text-gray-300 mt-1 text-sm">
                Track your income, expenses, and savings over time
              </p>
            </div>
            <div className="p-8">
              <FinancialChart data={financialData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountDetails;

