import { useCallback, useContext, useEffect, useState } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import ConfirmationModal from '../components/ConfirmationModal';
import { AuthContext } from '../context/AuthContext';

const STATUS_BADGES = {
  active: 'bg-green-100 text-green-800',
  frozen: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-200 text-gray-700',
};

const AdminAccounts = () => {
  const { user, loadUser, loading } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const [accounts, setAccounts] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [selectionEnabled, setSelectionEnabled] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [processing, setProcessing] = useState({ ids: [], status: null });
  const [confirmState, setConfirmState] = useState({
    open: false,
    ids: [],
    status: null,
    message: '',
  });

  useEffect(() => {
    const ensureAdminUser = async () => {
      if (!user) {
        await loadUser();
      }
    };
    ensureAdminUser();
  }, [user, loadUser]);

  const fetchAccounts = useCallback(async () => {
    if (!isAdmin) return;
    setIsFetching(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/accounts', {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load accounts');
      }
      const data = await res.json();
      setAccounts(data.accounts || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setIsFetching(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const updateStatus = useCallback(
    async (ids, nextStatus) => {
      if (!ids.length) return;
      setProcessing({ ids, status: nextStatus });
      try {
        await Promise.all(
          ids.map((id) =>
            fetch(`http://localhost:5000/api/admin/accounts/${id}/status`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: nextStatus }),
            }).then(async (res) => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to update account');
              }
            })
          )
        );
        await fetchAccounts();
        setSelectedAccounts([]);
        setSelectionEnabled(false);
      } catch (err) {
        setError(err.message || 'Failed to update account');
      } finally {
        setProcessing({ ids: [], status: null });
      }
    },
    [fetchAccounts]
  );

  const openConfirm = (ids, status, message) => {
    setConfirmState({
      open: true,
      ids,
      status,
      message,
    });
  };

  const closeConfirm = () => {
    setConfirmState({
      open: false,
      ids: [],
      status: null,
      message: '',
    });
  };

  const confirmAction = async () => {
    await updateStatus(confirmState.ids, confirmState.status);
    closeConfirm();
  };

  const toggleSelection = (accountId) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const handleRowClick = (accountId) => {
    if (!selectionEnabled) {
      setSelectionEnabled(true);
      setSelectedAccounts([accountId]);
    } else {
      toggleSelection(accountId);
    }
  };

  const clearSelection = () => {
    setSelectionEnabled(false);
    setSelectedAccounts([]);
  };

  const renderAccountRow = (account) => {
    const selected = selectedAccounts.includes(account.account_id);
    const isProcessing =
      processing.ids.includes(account.account_id) && processing.status !== null;

    const status = account.account_status;
    const freezeDisabled = status === 'closed';
    const closeDisabled = status === 'closed';
    const isFrozen = status === 'frozen';

    return (
      <div
        key={account.account_id}
        role="button"
        tabIndex={0}
        onClick={() => handleRowClick(account.account_id)}
        className="flex flex-wrap gap-3 items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-white shadow-sm cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {selectionEnabled && (
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => {
                e.stopPropagation();
                toggleSelection(account.account_id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 text-gray-900 focus:ring-gray-900"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{account.full_name}</p>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGES[status] || 'bg-gray-100 text-gray-600'}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              {account.user_status && (
                <span className="text-xs font-medium text-gray-500">
                  ({account.user_status})
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Account #: {account.account_number}</p>
            <p className="text-sm text-gray-600">{account.email}</p>
            <p className="text-sm text-gray-500">CNIC: {account.cnic}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm(
                [account.account_id],
                isFrozen ? 'active' : 'frozen',
                `${isFrozen ? 'Unfreeze' : 'Freeze'} account ${account.account_number} for ${account.full_name}?`
              );
            }}
            disabled={freezeDisabled || isProcessing}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white transition disabled:opacity-60 disabled:cursor-not-allowed ${
              isFrozen ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing && (processing.status === 'frozen' || processing.status === 'active')
              ? isFrozen
                ? 'Unfreezing...'
                : 'Freezing...'
              : isFrozen
              ? 'Unfreeze'
              : 'Freeze'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm(
                [account.account_id],
                'closed',
                `Close account ${account.account_number} for ${account.full_name}?`
              );
            }}
            disabled={closeDisabled || isProcessing}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing && processing.status === 'closed' ? 'Closing...' : 'Close'}
          </button>
        </div>
      </div>
    );
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main className="p-6">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main className="p-6">
          <p className="text-red-600 font-semibold">You do not have access to this page.</p>
        </main>
      </div>
    );
  }

  const bulkFreezeIds = accounts
    .filter(
      (account) =>
        selectedAccounts.includes(account.account_id) &&
        account.account_status === 'active'
    )
    .map((account) => account.account_id);

  const bulkUnfreezeIds = accounts
    .filter(
      (account) =>
        selectedAccounts.includes(account.account_id) &&
        account.account_status === 'frozen'
    )
    .map((account) => account.account_id);

  const bulkCloseIds = accounts
    .filter(
      (account) =>
        selectedAccounts.includes(account.account_id) &&
        account.account_status !== 'closed'
    )
    .map((account) => account.account_id);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="p-6 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Accounts Management</h1>
            <p className="text-sm text-gray-600">
              View registered customer accounts and freeze or close them when necessary.
            </p>
          </div>
          <button
            onClick={fetchAccounts}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-60"
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {selectionEnabled && (
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() =>
                openConfirm(
                  bulkFreezeIds,
                  'frozen',
                  `Freeze ${bulkFreezeIds.length} selected account(s)?`
                )
              }
              disabled={!bulkFreezeIds.length || processing.status === 'frozen'}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md disabled:opacity-60"
            >
              {processing.status === 'frozen' ? 'Freezing...' : 'Freeze Selected'}
            </button>
            <button
              onClick={() =>
                openConfirm(
                  bulkUnfreezeIds,
                  'active',
                  `Unfreeze ${bulkUnfreezeIds.length} selected account(s)?`
                )
              }
              disabled={!bulkUnfreezeIds.length || processing.status === 'active'}
              className="px-3 py-2 bg-green-600 text-white text-sm rounded-md disabled:opacity-60"
            >
              {processing.status === 'active' ? 'Unfreezing...' : 'Unfreeze Selected'}
            </button>
            <button
              onClick={() =>
                openConfirm(
                  bulkCloseIds,
                  'closed',
                  `Close ${bulkCloseIds.length} selected account(s)?`
                )
              }
              disabled={!bulkCloseIds.length || processing.status === 'closed'}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded-md disabled:opacity-60"
            >
              {processing.status === 'closed' ? 'Closing...' : 'Close Selected'}
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-2 border border-gray-300 text-sm rounded-md"
            >
              Clear Selection
            </button>
          </div>
        )}

        {isFetching && accounts.length === 0 ? (
          <p className="text-gray-500">Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <p className="text-gray-500">No accounts available.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => renderAccountRow(account))}
          </div>
        )}
      </main>
      <ConfirmationModal
        isOpen={confirmState.open}
        onClose={closeConfirm}
        onConfirm={confirmAction}
        title="Confirm Action"
        confirmText={
          confirmState.status === 'closed'
            ? 'Close'
            : confirmState.status === 'active'
            ? 'Unfreeze'
            : 'Freeze'
        }
      >
        <p className="text-gray-700">{confirmState.message}</p>
        <p className="text-sm text-gray-500 mt-2">
          This action will update the account status and notify the customer on their next login attempt.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default AdminAccounts;

