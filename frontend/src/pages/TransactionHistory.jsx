import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import CustomerNavbar from '../components/CustomerNavbar';
import { AuthContext } from '../context/AuthContext';
import Receipt from '../components/Receipt';

const TransactionHistory = () => {
  const { user, loadUser } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState({});

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

  // Fetch transactions
  useEffect(() => {
    fetchTransactions(1, true);
  }, []);

  const fetchTransactions = async (page, reset = false) => {
    if (reset) {
      setLoading(true);
      setTransactions([]);
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const response = await axios.get(`/api/transfer/history?page=${page}&limit=15`);
      
      if (response.data.transactions) {
        if (reset) {
          setTransactions(response.data.transactions);
        } else {
          setTransactions(prev => [...prev, ...response.data.transactions]);
        }
        setHasMore(response.data.hasMore);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    fetchTransactions(currentPage + 1, false);
  };

  const handleTransactionClick = async (transaction) => {
    setSelectedTransaction(transaction);
    
    // Fetch detailed information based on transaction type
    try {
      const detailsResponse = await axios.get(`/api/transfer/transaction/${transaction.transaction_id}`);
      setTransactionDetails(detailsResponse.data);
      setShowDetails(true);
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      setError('Failed to load transaction details');
    }
  };

  const handlePrintReceipt = async (transactionId) => {
    try {
      const response = await axios.get(`/api/transfer/transaction/${transactionId}`);
      setReceiptData(response.data);
      setShowReceipt(true);
    } catch (err) {
      console.error('Error fetching receipt data:', err);
      setError('Failed to load receipt');
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

  const getTransactionTypeLabel = (type) => {
    const labels = {
      'internal_transfer': 'Internal Transfer',
      'external_transfer': 'External Transfer',
      'bill_payment': 'Bill Payment'
    };
    return labels[type] || type;
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'internal_transfer':
        return '↔️';
      case 'external_transfer':
        return '➡️';
      case 'bill_payment':
        return '💳';
      default:
        return '📄';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <main className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Transaction History</h1>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center text-sm">
            {error}
          </div>
        )}

        {loading && transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.transaction_id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl">{getTransactionIcon(transaction.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">
                              {getTransactionTypeLabel(transaction.type)}
                            </h3>
                            {transaction.direction === 'incoming' && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                INCOMING
                              </span>
                            )}
                            {transaction.direction === 'outgoing' && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                OUTGOING
                              </span>
                            )}
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                transaction.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {transaction.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(transaction.created_at)}
                          </p>
                          {transaction.description && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {transaction.direction === 'incoming' && (
                            <p className="text-xs text-green-600 font-medium mb-1">INCOMING</p>
                          )}
                          {transaction.direction === 'outgoing' && (
                            <p className="text-xs text-red-600 font-medium mb-1">OUTGOING</p>
                          )}
                          <p className={`font-bold text-lg ${
                            transaction.direction === 'incoming' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.direction === 'incoming' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintReceipt(transaction.transaction_id);
                          }}
                          className="px-3 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-semibold"
                        >
                          Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loadingMore ? 'Loading...' : 'Load More (15 transactions)'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Transaction Details Modal */}
        {showDetails && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedTransaction(null);
                      setTransactionDetails({});
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                    <p className="font-semibold text-gray-900">#{selectedTransaction.transaction_id}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Type</p>
                    <p className="font-semibold text-gray-900">{getTransactionTypeLabel(selectedTransaction.type)}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Amount</p>
                    <p className="font-semibold text-gray-900 text-xl">
                      ${parseFloat(selectedTransaction.amount).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        selectedTransaction.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedTransaction.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedTransaction.created_at)}</p>
                  </div>

                  {selectedTransaction.description && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Description</p>
                      <p className="text-gray-900">{selectedTransaction.description}</p>
                    </div>
                  )}

                  {/* Type-specific details */}
                  {selectedTransaction.type === 'internal_transfer' && transactionDetails.direction === 'incoming' && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Sender Details</h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">From Account Number:</p>
                          <p className="font-semibold text-gray-900">{transactionDetails.from_account_number}</p>
                        </div>
                        {transactionDetails.from_account_holder && (
                          <div>
                            <p className="text-sm text-gray-600">From Account Holder:</p>
                            <p className="font-semibold text-gray-900">{transactionDetails.from_account_holder}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedTransaction.type === 'internal_transfer' && transactionDetails.direction === 'outgoing' && transactionDetails.to_account_number && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Recipient Details</h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Account Number:</p>
                          <p className="font-semibold text-gray-900">{transactionDetails.to_account_number}</p>
                        </div>
                        {transactionDetails.to_account_holder && (
                          <div>
                            <p className="text-sm text-gray-600">Account Holder:</p>
                            <p className="font-semibold text-gray-900">{transactionDetails.to_account_holder}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedTransaction.type === 'external_transfer' && transactionDetails.target_bank && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Recipient Details</h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Bank Name:</p>
                          <p className="font-semibold text-gray-900">{transactionDetails.target_bank}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Account Number:</p>
                          <p className="font-semibold text-gray-900">{transactionDetails.target_account_no}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTransaction.type === 'bill_payment' && transactionDetails.biller_name && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Biller Details</h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Biller Name:</p>
                          <p className="font-semibold text-gray-900">{transactionDetails.biller_name}</p>
                        </div>
                        {transactionDetails.category && (
                          <div>
                            <p className="text-sm text-gray-600">Category:</p>
                            <p className="font-semibold text-gray-900 capitalize">{transactionDetails.category}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">Consumer Number:</p>
                          <p className="font-semibold text-gray-900">{transactionDetails.consumer_number}</p>
                        </div>
                        {transactionDetails.billing_month_formatted && (
                          <div>
                            <p className="text-sm text-gray-600">Billing Month:</p>
                            <p className="font-semibold text-gray-900">{transactionDetails.billing_month_formatted}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {transactionDetails.direction === 'outgoing' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">From Account</p>
                      <p className="font-semibold text-gray-900">{transactionDetails.from_account_number}</p>
                      {transactionDetails.from_account_holder && (
                        <p className="text-sm text-gray-600 mt-1">{transactionDetails.from_account_holder}</p>
                      )}
                    </div>
                  )}
                  
                  {transactionDetails.direction === 'incoming' && transactionDetails.to_account_number && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">To Account (Your Account)</p>
                      <p className="font-semibold text-gray-900">{transactionDetails.to_account_number}</p>
                      {transactionDetails.to_account_holder && (
                        <p className="text-sm text-gray-600 mt-1">{transactionDetails.to_account_holder}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedTransaction(null);
                      setTransactionDetails({});
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handlePrintReceipt(selectedTransaction.transaction_id);
                      setShowDetails(false);
                    }}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold"
                  >
                    Print Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        <Receipt
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          receiptData={receiptData}
        />
      </main>
    </div>
  );
};

export default TransactionHistory;

