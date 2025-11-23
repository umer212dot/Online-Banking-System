import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import CustomerNavbar from '../components/CustomerNavbar';
import { AuthContext } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import Receipt from '../components/Receipt';

const BillPayment = () => {
  const { user, loadUser } = useContext(AuthContext);
  const [billers, setBillers] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingAmount, setFetchingAmount] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [formData, setFormData] = useState({
    biller_id: '',
    consumer_number: '',
    amount: '',
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

  // Fetch account, billers and payment history
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountResponse, billersResponse, historyResponse] = await Promise.all([
          axios.get('/api/transfer/account'),
          axios.get('/api/bill/billers'),
          axios.get('/api/bill/history')
        ]);

        if (accountResponse.data.account) {
          setAccount(accountResponse.data.account);
        }

        if (billersResponse.data.billers) {
          setBillers(billersResponse.data.billers);
        }

        if (historyResponse.data.payments) {
          setPaymentHistory(historyResponse.data.payments);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status !== 404) {
          setError('Failed to load data');
        }
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    setSuccess('');
    
    // Clear amount when biller or consumer number changes
    if (name === 'biller_id' || name === 'consumer_number') {
      setFormData(prev => ({ ...prev, amount: '' }));
    }
  };

  const handleFetchAmount = async () => {
    if (!formData.biller_id || !formData.consumer_number) {
      setError('Please select a biller and enter consumer number');
      return;
    }

    setFetchingAmount(true);
    setError('');
    try {
      const response = await axios.post('/api/bill/bill-amount', {
        biller_id: formData.biller_id,
        consumer_number: formData.consumer_number
      });

      if (response.data.amount) {
        setFormData(prev => ({ ...prev, amount: response.data.amount.toString() }));
        setSuccess(`Bill amount retrieved: $${response.data.amount.toFixed(2)}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bill amount');
    } finally {
      setFetchingAmount(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Find selected biller details
    const biller = billers.find(b => b.biller_id === parseInt(formData.biller_id));
    if (biller) {
      setSelectedBiller(biller);
      setShowConfirm(true);
    } else {
      setError('Please select a valid biller');
    }
  };

  const confirmBillPayment = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/bill/pay', formData);
      
      // Fetch transaction details for receipt
      try {
        const transactionResponse = await axios.get(`/api/transfer/transaction/${response.data.transaction_id}`);
        setReceiptData(transactionResponse.data);
        setShowReceipt(true);
      } catch (err) {
        console.error('Error fetching transaction details:', err);
      }

      setSuccess(response.data.message || 'Bill payment completed successfully!');

      // Reset form
      setFormData({
        biller_id: '',
        consumer_number: '',
        amount: '',
      });

      // Refresh account and payment history
      const [accountResponse, historyResponse] = await Promise.all([
        axios.get('/api/transfer/account'),
        axios.get('/api/bill/history')
      ]);
      
      if (accountResponse.data.account) {
        setAccount(accountResponse.data.account);
      }
      
      if (historyResponse.data.payments) {
        setPaymentHistory(historyResponse.data.payments);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bill Payment</h1>
          {account && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(account.balance).toFixed(2)}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Form */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Pay Bill</h2>

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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Biller
                </label>
                <select
                  name="biller_id"
                  value={formData.biller_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Select a biller</option>
                  {billers.map((biller) => (
                    <option key={biller.biller_id} value={biller.biller_id}>
                      {biller.biller_name} ({biller.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consumer Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="consumer_number"
                    value={formData.consumer_number}
                    onChange={handleChange}
                    placeholder="Enter consumer number"
                    required
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                  <button
                    type="button"
                    onClick={handleFetchAmount}
                    disabled={fetchingAmount || !formData.biller_id || !formData.consumer_number}
                    className="px-6 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {fetchingAmount ? 'Fetching...' : 'Get Amount'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                  readOnly={!!formData.amount}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 bg-gray-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Click "Get Amount" to retrieve the bill amount
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.amount}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Pay Bill'}
              </button>
            </form>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment History</h2>

            {paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No payment history found</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.transaction_id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{payment.biller_name}</h3>
                        <p className="text-sm text-gray-600">{payment.category}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>Consumer #: {payment.consumer_number}</p>
                      <p className="font-semibold text-gray-900">
                        Amount: ${parseFloat(payment.amount).toFixed(2)}
                      </p>
                      <p className="text-xs font-medium text-blue-600">
                        Billing Month: {payment.billing_month_formatted || 
                          new Date(payment.created_at).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        Paid: {formatDate(payment.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bill Payment Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmBillPayment}
        title="Confirm Bill Payment"
      >
        {selectedBiller && (
          <div className="space-y-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Biller Name:</p>
              <p className="font-semibold text-gray-900">{selectedBiller.biller_name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Consumer Number:</p>
              <p className="font-semibold text-gray-900">{formData.consumer_number}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Amount:</p>
              <p className="font-semibold text-gray-900 text-xl">${parseFloat(formData.amount || 0).toFixed(2)}</p>
            </div>
          </div>
        )}
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

export default BillPayment;

