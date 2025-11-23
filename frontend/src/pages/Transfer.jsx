import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import CustomerNavbar from '../components/CustomerNavbar';
import { AuthContext } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import Receipt from '../components/Receipt';

const Transfer = () => {
  const { user, loadUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('internal');
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [frequentInternalRecipients, setFrequentInternalRecipients] = useState([]);
  const [frequentExternalRecipients, setFrequentExternalRecipients] = useState([]);
  const [showInternalConfirm, setShowInternalConfirm] = useState(false);
  const [showExternalConfirm, setShowExternalConfirm] = useState(false);
  const [recipientDetails, setRecipientDetails] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Internal transfer form state
  const [internalForm, setInternalForm] = useState({
    to_account_number: '',
    amount: '',
    description: '',
  });

  // External transfer form state
  const [externalForm, setExternalForm] = useState({
    target_bank: '',
    target_account_no: '',
    amount: '',
    description: '',
  });

  // Configure axios defaults
  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = 'http://localhost:5000';
  }, []);

  // Load user on mount to fix navbar issue
  useEffect(() => {
    const ensureUser = async () => {
      if (!user) {
        await loadUser();
      }
    };
    ensureUser();
  }, [user, loadUser]);

  // Fetch user account and frequent recipients
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch account first (required)
        const accountResponse = await axios.get('/api/transfer/account');
        if (accountResponse.data.account) {
          setAccount(accountResponse.data.account);
        }
      } catch (err) {
        console.error('Error fetching account:', err);
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        }
      }
      
      // Fetch frequent recipients separately (optional - handle 404s gracefully)
      try {
        const internalResponse = await axios.get('/api/transfer/frequent-internal');
        if (internalResponse.data.recipients) {
          setFrequentInternalRecipients(internalResponse.data.recipients);
        }
      } catch (err) {
        // Silently handle 404 or other errors for frequent recipients
        if (err.response?.status !== 404) {
          console.error('Error fetching frequent internal recipients:', err);
        }
      }
      
      try {
        const externalResponse = await axios.get('/api/transfer/frequent-external');
        if (externalResponse.data.recipients) {
          setFrequentExternalRecipients(externalResponse.data.recipients);
        }
      } catch (err) {
        // Silently handle 404 or other errors for frequent recipients
        if (err.response?.status !== 404) {
          console.error('Error fetching frequent external recipients:', err);
        }
      }
    };
    fetchData();
  }, []);

  const handleInternalChange = (e) => {
    setInternalForm({ ...internalForm, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleExternalChange = (e) => {
    setExternalForm({ ...externalForm, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleInternalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Fetch recipient details for confirmation
    try {
      const recipientResponse = await axios.get(`/api/transfer/recipient/${internalForm.to_account_number}`);
      setRecipientDetails(recipientResponse.data);
      setShowInternalConfirm(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify recipient account');
    }
  };

  const confirmInternalTransfer = async () => {
    setShowInternalConfirm(false);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/transfer/internal', internalForm);
      
      // Fetch transaction details for receipt
      try {
        const transactionResponse = await axios.get(`/api/transfer/transaction/${response.data.transaction_id}`);
        setReceiptData(transactionResponse.data);
        setShowReceipt(true);
      } catch (err) {
        console.error('Error fetching transaction details:', err);
      }

      setSuccess(response.data.message || 'Transfer completed successfully!');
      
      // Reset form
      setInternalForm({
        to_account_number: '',
        amount: '',
        description: '',
      });
      
      // Refresh account to update balance
      const accountResponse = await axios.get('/api/transfer/account');
      if (accountResponse.data.account) {
        setAccount(accountResponse.data.account);
      }
      
      // Try to refresh frequent recipients (handle errors gracefully)
      try {
        const internalResponse = await axios.get('/api/transfer/frequent-internal');
        if (internalResponse.data.recipients) {
          setFrequentInternalRecipients(internalResponse.data.recipients);
        }
      } catch (err) {
        // Silently ignore errors for frequent recipients
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExternalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowExternalConfirm(true);
  };

  const confirmExternalTransfer = async () => {
    setShowExternalConfirm(false);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/transfer/external', externalForm);
      
      // Fetch transaction details for receipt
      try {
        const transactionResponse = await axios.get(`/api/transfer/transaction/${response.data.transaction_id}`);
        setReceiptData(transactionResponse.data);
        setShowReceipt(true);
      } catch (err) {
        console.error('Error fetching transaction details:', err);
      }

      setSuccess(response.data.message || 'Transfer completed successfully!');
      
      // Reset form
      setExternalForm({
        target_bank: '',
        target_account_no: '',
        amount: '',
        description: '',
      });
      
      // Refresh account to update balance
      const accountResponse = await axios.get('/api/transfer/account');
      if (accountResponse.data.account) {
        setAccount(accountResponse.data.account);
      }
      
      // Try to refresh frequent recipients (handle errors gracefully)
      try {
        const externalResponse = await axios.get('/api/transfer/frequent-external');
        if (externalResponse.data.recipients) {
          setFrequentExternalRecipients(externalResponse.data.recipients);
        }
      } catch (err) {
        // Silently ignore errors for frequent recipients
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <main className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Money Transfer</h1>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('internal');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'internal'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Internal Transfer
            </button>
            <button
              onClick={() => {
                setActiveTab('external');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'external'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              External Transfer
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
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

            {/* Internal Transfer Form */}
            {activeTab === 'internal' && (
              <form onSubmit={handleInternalSubmit} className="space-y-5">
                {account && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Account
                    </label>
                    <div className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-700">
                      {account.account_number} - Balance: ${parseFloat(account.balance).toFixed(2)}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Account Number
                  </label>
                  {frequentInternalRecipients.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-2">Frequent Recipients:</p>
                      <div className="flex flex-wrap gap-2">
                        {frequentInternalRecipients.map((recipient, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setInternalForm({ ...internalForm, to_account_number: recipient.account_number });
                            }}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-700 transition-colors"
                          >
                            {recipient.account_number} ({recipient.transfer_count}x)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <input
                    type="text"
                    name="to_account_number"
                    value={internalForm.to_account_number}
                    onChange={handleInternalChange}
                    placeholder="Enter recipient account number"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={internalForm.amount}
                    onChange={handleInternalChange}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={internalForm.description}
                    onChange={handleInternalChange}
                    placeholder="Add a note for this transfer"
                    maxLength="255"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !account}
                  className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Transfer Money'}
                </button>
              </form>
            )}

            {/* External Transfer Form */}
            {activeTab === 'external' && (
              <form onSubmit={handleExternalSubmit} className="space-y-5">
                {account && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Account
                    </label>
                    <div className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-700">
                      {account.account_number} - Balance: ${parseFloat(account.balance).toFixed(2)}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Bank
                  </label>
                  {frequentExternalRecipients.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-2">Frequent Recipients:</p>
                      <div className="flex flex-wrap gap-2">
                        {frequentExternalRecipients.map((recipient, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setExternalForm({ 
                                ...externalForm, 
                                target_bank: recipient.target_bank,
                                target_account_no: recipient.target_account_no
                              });
                            }}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-700 transition-colors"
                          >
                            {recipient.target_bank} - {recipient.target_account_no} ({recipient.transfer_count}x)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <input
                    type="text"
                    name="target_bank"
                    value={externalForm.target_bank}
                    onChange={handleExternalChange}
                    placeholder="Enter bank name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Account Number
                  </label>
                  <input
                    type="text"
                    name="target_account_no"
                    value={externalForm.target_account_no}
                    onChange={handleExternalChange}
                    placeholder="Enter recipient account number"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={externalForm.amount}
                    onChange={handleExternalChange}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={externalForm.description}
                    onChange={handleExternalChange}
                    placeholder="Add a note for this transfer"
                    maxLength="255"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !account}
                  className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Transfer Money'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Internal Transfer Confirmation Modal */}
      <ConfirmationModal
        isOpen={showInternalConfirm}
        onClose={() => setShowInternalConfirm(false)}
        onConfirm={confirmInternalTransfer}
        title="Confirm Internal Transfer"
      >
        {recipientDetails && (
          <div className="space-y-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Recipient Name:</p>
              <p className="font-semibold text-gray-900">{recipientDetails.recipient_name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Account Number:</p>
              <p className="font-semibold text-gray-900">{recipientDetails.account_number}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Amount:</p>
              <p className="font-semibold text-gray-900 text-xl">${parseFloat(internalForm.amount || 0).toFixed(2)}</p>
            </div>
            {internalForm.description && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Description:</p>
                <p className="text-gray-900">{internalForm.description}</p>
              </div>
            )}
          </div>
        )}
      </ConfirmationModal>

      {/* External Transfer Confirmation Modal */}
      <ConfirmationModal
        isOpen={showExternalConfirm}
        onClose={() => setShowExternalConfirm(false)}
        onConfirm={confirmExternalTransfer}
        title="Confirm External Transfer"
      >
        <div className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Bank Name:</p>
            <p className="font-semibold text-gray-900">{externalForm.target_bank}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Account Number:</p>
            <p className="font-semibold text-gray-900">{externalForm.target_account_no}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Amount:</p>
            <p className="font-semibold text-gray-900 text-xl">${parseFloat(externalForm.amount || 0).toFixed(2)}</p>
          </div>
          {externalForm.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Description:</p>
              <p className="text-gray-900">{externalForm.description}</p>
            </div>
          )}
        </div>
      </ConfirmationModal>

      {/* Receipt Modal */}
      <Receipt
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receiptData={receiptData}
      />
    </div>
  );
};

export default Transfer;

