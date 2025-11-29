import { useCallback, useContext, useEffect, useState } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import ConfirmationModal from '../components/ConfirmationModal';
import { AuthContext } from '../context/AuthContext';

const ACTION_LABELS = {
  approved: 'Accept',
  rejected: 'Reject',
  deleted: 'Delete Account',
};

const AdminUsers = () => {
  const { user, loadUser, loading } = useContext(AuthContext);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState({ ids: [], status: null });
  const [pendingSelectEnabled, setPendingSelectEnabled] = useState(false);
  const [approvedSelectEnabled, setApprovedSelectEnabled] = useState(false);
  const [pendingSelection, setPendingSelection] = useState([]);
  const [approvedSelection, setApprovedSelection] = useState([]);
  const [confirmState, setConfirmState] = useState({
    open: false,
    ids: [],
    message: '',
  });

  useEffect(() => {
    const ensureUser = async () => {
      if (!user) {
        await loadUser();
      }
    };
    ensureUser();
  }, [user, loadUser]);

  const isAdmin = user?.role === 'admin';

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setIsFetching(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/users', {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load customers');
      }
      const data = await res.json();
      setPendingUsers(data.pendingUsers || []);
      setApprovedUsers(data.approvedUsers || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setIsFetching(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateStatus = useCallback(
    async (userIds, nextStatus) => {
      if (!userIds.length) return;
      setProcessing({ ids: userIds, status: nextStatus });
      try {
        await Promise.all(
          userIds.map((userId) =>
            fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
              method: 'PATCH',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: nextStatus }),
            }).then(async (res) => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to update status');
              }
            })
          )
        );

        await fetchUsers();
        if (nextStatus === 'approved' || nextStatus === 'rejected') {
          setPendingSelection([]);
          setPendingSelectEnabled(false);
        }
        if (nextStatus === 'deleted') {
          setApprovedSelection([]);
          setApprovedSelectEnabled(false);
        }
      } catch (err) {
        setError(err.message || 'Failed to update status');
      } finally {
        setProcessing({ ids: [], status: null });
      }
    },
    [fetchUsers]
  );

  const openDeleteConfirm = (ids, message) => {
    setConfirmState({ open: true, ids, message });
  };

  const closeDeleteConfirm = () => {
    setConfirmState({ open: false, ids: [], message: '' });
  };

  const confirmDelete = async () => {
    await updateStatus(confirmState.ids, 'deleted');
    closeDeleteConfirm();
  };

  const toggleSelection = (section, userId) => {
    if (section === 'pending') {
      setPendingSelection((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    } else {
      setApprovedSelection((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    }
  };

  const handleRowClick = (section, userId) => {
    if (section === 'pending') {
      if (!pendingSelectEnabled) {
        setPendingSelectEnabled(true);
        setPendingSelection([userId]);
      } else {
        toggleSelection('pending', userId);
      }
    } else {
      if (!approvedSelectEnabled) {
        setApprovedSelectEnabled(true);
        setApprovedSelection([userId]);
      } else {
        toggleSelection('approved', userId);
      }
    }
  };

  const clearSelection = (section) => {
    if (section === 'pending') {
      setPendingSelection([]);
      setPendingSelectEnabled(false);
    } else {
      setApprovedSelection([]);
      setApprovedSelectEnabled(false);
    }
  };

  const renderUserRow = (customer, actions, section) => {
    const isPendingSection = section === 'pending';
    const selectionEnabled = isPendingSection ? pendingSelectEnabled : approvedSelectEnabled;
    const selection = isPendingSection ? pendingSelection : approvedSelection;
    const selected = selection.includes(customer.user_id);
    const isProcessing =
      processing.status &&
      processing.ids.includes(customer.user_id) &&
      actions.includes(processing.status);

    return (
      <div
        key={customer.user_id}
        role="button"
        tabIndex={0}
        onClick={() => handleRowClick(section, customer.user_id)}
        className={`flex flex-wrap gap-3 items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-white shadow-sm ${
          selectionEnabled ? 'cursor-pointer ring-1 ring-transparent focus:ring-gray-400' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {selectionEnabled && (
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => {
                e.stopPropagation();
                toggleSelection(section, customer.user_id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 text-gray-900 focus:ring-gray-900"
            />
          )}
          <div>
            <p className="font-semibold text-gray-900">{customer.full_name}</p>
            <p className="text-sm text-gray-600">{customer.email}</p>
            <p className="text-sm text-gray-500">CNIC: {customer.cnic}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {actions.map((status) => {
            const label = ACTION_LABELS[status];
            const baseStyles =
              status === 'approved'
                ? 'bg-green-600 hover:bg-green-700'
                : status === 'rejected'
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-red-600 hover:bg-red-700';

            const onClick = (e) => {
              e.stopPropagation();
              if (status === 'deleted') {
                openDeleteConfirm([customer.user_id], `Delete account for ${customer.full_name}?`);
              } else {
                updateStatus([customer.user_id], status);
              }
            };

            return (
              <button
                key={status}
                onClick={onClick}
                disabled={isProcessing}
                className={`text-white px-4 py-2 rounded-md text-sm font-medium transition ${baseStyles} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isProcessing ? 'Processing...' : label}
              </button>
            );
          })}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Approvals</h1>
            <p className="text-sm text-gray-600">
              Review new customer registrations and manage approved accounts.
            </p>
          </div>
          <button
            onClick={fetchUsers}
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

        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pending Registrations</h2>
              <p className="text-sm text-gray-600">
                Customers awaiting approval. Click a card to enable multi-select checkboxes.
              </p>
            </div>
            {pendingSelectEnabled && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateStatus(pendingSelection, 'approved')}
                  disabled={!pendingSelection.length || processing.status === 'approved'}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-md disabled:opacity-60"
                >
                  {processing.status === 'approved' ? 'Approving...' : 'Accept Selected'}
                </button>
                <button
                  onClick={() => updateStatus(pendingSelection, 'rejected')}
                  disabled={!pendingSelection.length || processing.status === 'rejected'}
                  className="px-3 py-2 bg-yellow-500 text-white text-sm rounded-md disabled:opacity-60"
                >
                  {processing.status === 'rejected' ? 'Rejecting...' : 'Reject Selected'}
                </button>
                <button
                  onClick={() => clearSelection('pending')}
                  className="px-3 py-2 border border-gray-300 text-sm rounded-md"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
          {isFetching && pendingUsers.length === 0 ? (
            <p className="text-gray-500">Loading pending customers...</p>
          ) : pendingUsers.length === 0 ? (
            <p className="text-gray-500">No pending registrations.</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((customer) =>
                renderUserRow(customer, ['approved', 'rejected'], 'pending')
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Approved Customers</h2>
              <p className="text-sm text-gray-600">
                Active customers. Click a card to enable multi-select checkboxes for bulk deletion.
              </p>
            </div>
            {approvedSelectEnabled && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    openDeleteConfirm(
                      approvedSelection,
                      `Delete ${approvedSelection.length} selected account(s)?`
                    )
                  }
                  disabled={!approvedSelection.length || processing.status === 'deleted'}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-md disabled:opacity-60"
                >
                  {processing.status === 'deleted' ? 'Deleting...' : 'Delete Selected'}
                </button>
                <button
                  onClick={() => clearSelection('approved')}
                  className="px-3 py-2 border border-gray-300 text-sm rounded-md"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
          {isFetching && approvedUsers.length === 0 ? (
            <p className="text-gray-500">Loading approved customers...</p>
          ) : approvedUsers.length === 0 ? (
            <p className="text-gray-500">No approved customers yet.</p>
          ) : (
            <div className="space-y-3">
              {approvedUsers.map((customer) =>
                renderUserRow(customer, ['deleted'], 'approved')
              )}
            </div>
          )}
        </section>
      </main>
      <ConfirmationModal
        isOpen={confirmState.open}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        confirmText="Delete"
      >
        <p className="text-gray-700">{confirmState.message || 'Delete selected account(s)?'}</p>
        <p className="text-sm text-gray-500 mt-2">
          This action marks the account(s) as deleted and prevents future logins.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default AdminUsers;


