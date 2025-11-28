import db from '../config/db.js';

// GET ACCOUNT DETAILS FOR LOGGED-IN USER
export const getAccountDetails = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authorized' });

    const [accounts] = await db.query(
      `SELECT account_id, account_number, balance, status, created_at
       FROM Accounts
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({ account: accounts[0] });
  } catch (err) {
    console.error('Get account details error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET FINANCIAL DATA (INCOME, EXPENSE, SAVINGS) FOR PAST 6 MONTHS
export const getFinancialData = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authorized' });

    // Get user's account_id
    const [accounts] = await db.query(
      'SELECT account_id FROM Accounts WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const accountId = accounts[0].account_id;

    // Get income: Internal transfers where this account is the recipient
    const [incomeData] = await db.query(
      `SELECT 
        DATE_FORMAT(t.created_at, '%Y-%m') AS month,
        SUM(t.amount) AS totalIncome
       FROM Transactions t
       INNER JOIN InternalTransfers it ON t.transaction_id = it.transaction_id
       WHERE it.to_account_id = ?
         AND t.status = 'completed'
         AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(t.created_at, '%Y-%m')
       ORDER BY month ASC`,
      [accountId]
    );

    // Get expenses: All transactions where this account is the sender
    const [expenseData] = await db.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        SUM(amount) AS totalExpense
       FROM Transactions
       WHERE from_account_id = ?
         AND status = 'completed'
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`,
      [accountId]
    );

    // Create a map for quick lookup
    const incomeMap = {};
    incomeData.forEach((row) => {
      incomeMap[row.month] = parseFloat(row.totalIncome) || 0;
    });

    const expenseMap = {};
    expenseData.forEach((row) => {
      expenseMap[row.month] = parseFloat(row.totalExpense) || 0;
    });

    // Generate last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const income = incomeMap[monthKey] || 0;
      const expense = expenseMap[monthKey] || 0;
      const savings = Math.max(0, income - expense);

      months.push({
        month: monthName,
        monthKey,
        income,
        expense,
        savings,
      });
    }

    res.json({ financialData: months });
  } catch (err) {
    console.error('Get financial data error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

