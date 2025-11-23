import React, { useRef } from 'react';

const Receipt = ({ isOpen, onClose, receiptData }) => {
  const receiptRef = useRef(null);

  if (!isOpen || !receiptData) return null;

  const downloadReceipt = () => {
    if (!receiptRef.current) return;

    try {
      // Create a printable HTML content
      const printWindow = window.open('', '_blank');
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt #${receiptData.transaction_id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 28px; }
              .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
              .row { display: flex; justify-content: space-between; margin: 10px 0; }
              .label { font-weight: bold; }
              .amount { font-size: 24px; font-weight: bold; text-align: right; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            ${receiptRef.current.innerHTML}
          </body>
        </html>
      `;
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error printing receipt:', error);
      // Fallback: copy receipt content to clipboard or show alert
      alert('Please use your browser\'s print function (Ctrl+P) to save this receipt as PDF.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Transaction Receipt</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Receipt Content - This will be converted to PDF */}
          <div ref={receiptRef} className="bg-white p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Banking System</h1>
              <p className="text-gray-600">Transaction Receipt</p>
            </div>

            <div className="border-t-2 border-b-2 border-gray-300 py-4 my-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Receipt Number:</span>
                <span>#{receiptData.transaction_id}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Date & Time:</span>
                <span>{formatDate(receiptData.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Transaction Type:</span>
                <span className="uppercase">{receiptData.type?.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">From Account:</h3>
                <p className="text-gray-900">{receiptData.from_account_number}</p>
                <p className="text-sm text-gray-600">{receiptData.from_account_holder}</p>
              </div>

              {receiptData.type === 'internal_transfer' && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">To Account:</h3>
                  <p className="text-gray-900">{receiptData.to_account_number}</p>
                  <p className="text-sm text-gray-600">{receiptData.to_account_holder}</p>
                </div>
              )}

              {receiptData.type === 'external_transfer' && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">To External Account:</h3>
                  <p className="text-gray-900">{receiptData.target_bank}</p>
                  <p className="text-sm text-gray-600">Account: {receiptData.target_account_no}</p>
                </div>
              )}

              {receiptData.type === 'bill_payment' && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Biller Details:</h3>
                  <p className="text-gray-900">{receiptData.biller_name}</p>
                  <p className="text-sm text-gray-600">Category: {receiptData.category}</p>
                  <p className="text-sm text-gray-600">Consumer Number: {receiptData.consumer_number}</p>
                  {receiptData.billing_month_formatted && (
                    <p className="text-sm text-gray-600">Billing Month: {receiptData.billing_month_formatted}</p>
                  )}
                </div>
              )}

              <div className="border-t-2 border-gray-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-900">Amount:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${parseFloat(receiptData.amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {receiptData.description && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Description:</h3>
                  <p className="text-gray-600">{receiptData.description}</p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-300">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Status:</span>
                  <span className={`font-semibold ${receiptData.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>
                    {receiptData.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
              <p>This is a computer-generated receipt.</p>
              <p>Please keep this receipt for your records.</p>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold"
            >
              Close
            </button>
            <button
              onClick={downloadReceipt}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold"
            >
              Download Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;

