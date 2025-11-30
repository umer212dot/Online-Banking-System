import db from '../config/db.js';

// GET CUSTOMER INFORMATION AND TRANSACTIONS FOR BANK STATEMENT
export const getBankStatement = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authorized' });

    // Get user information
    const [users] = await db.query(
      'SELECT user_id, full_name, email, phone, cnic FROM Users WHERE user_id = ?',
      [userId]
    );
    const user = users[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get account information
    const [accounts] = await db.query(
      'SELECT account_id, account_number, balance FROM Accounts WHERE user_id = ?',
      [userId]
    );
    const account = accounts[0];
    if (!account) return res.status(404).json({ message: 'Account not found' });

    // Get all transactions for this user's account
    const [transactions] = await db.query(
      `SELECT 
        t.transaction_id,
        t.from_account_id,
        t.type,
        t.amount,
        t.status,
        t.description,
        t.created_at,
        CASE 
          WHEN t.from_account_id = ? THEN 'outgoing'
          ELSE 'incoming'
        END as direction
      FROM Transactions t
      WHERE t.from_account_id = ? OR t.transaction_id IN (
        SELECT transaction_id FROM InternalTransfers WHERE to_account_id = ?
      )
      ORDER BY t.created_at DESC
      LIMIT 100`,
      [account.account_id, account.account_id, account.account_id]
    );

    res.json({
      customer: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        cnic: user.cnic,
        account_number: account.account_number,
        current_balance: account.balance,
      },
      transactions: transactions || [],
      statement_date: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Get bank statement error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// EXPORT TRANSACTIONS FOR REPORT
export const getTransactionsSummary = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authorized' });

    // Get account
    const [accounts] = await db.query(
      'SELECT account_id FROM Accounts WHERE user_id = ?',
      [userId]
    );
    const account = accounts[0];
    if (!account) return res.status(404).json({ message: 'Account not found' });

    // Get transactions summary
    const [summary] = await db.query(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN t.from_account_id = ? THEN t.amount ELSE 0 END) as total_outgoing,
        SUM(CASE WHEN t.from_account_id != ? THEN t.amount ELSE 0 END) as total_incoming,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count
      FROM Transactions t
      WHERE t.from_account_id = ? OR t.transaction_id IN (
        SELECT transaction_id FROM InternalTransfers WHERE to_account_id = ?
      )`,
      [account.account_id, account.account_id, account.account_id, account.account_id]
    );

    res.json({
      summary: summary[0],
    });
  } catch (err) {
    console.error('Get transactions summary error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
