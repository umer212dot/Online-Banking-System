import db from '../config/db.js';

const buildDateSeries = (days, dataMap) => {
  const series = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const entry = dataMap.get(key) || { totalAmount: 0, totalCount: 0 };
    series.push({
      date: key,
      totalAmount: Number(entry.totalAmount) || 0,
      totalCount: Number(entry.totalCount) || 0,
    });
  }

  return series;
};

export const getDashboardStats = async (_req, res) => {
  try {
    const [[{ totalUsers }]] = await db.query(
      `SELECT COUNT(*) AS totalUsers FROM Users`
    );

    const [[{ totalAccounts }]] = await db.query(
      `SELECT COUNT(*) AS totalAccounts
       FROM Users
       WHERE role = 'customer' AND status = 'approved'`
    );

    const [[{ totalFunds }]] = await db.query(
      `SELECT COALESCE(SUM(balance), 0) AS totalFunds FROM Accounts`
    );

    const [[daily]] = await db.query(
      `SELECT 
         COALESCE(SUM(amount), 0) AS totalAmount,
         COUNT(*) AS totalCount
       FROM Transactions
       WHERE DATE(created_at) = CURDATE()`
    );

    const [transactionRows] = await db.query(
      `SELECT 
         DATE(created_at) AS txnDate,
         COALESCE(SUM(amount), 0) AS totalAmount,
         COUNT(*) AS totalCount
       FROM Transactions
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
       GROUP BY DATE(created_at)`
    );

    const transactionMap = new Map(
      transactionRows.map((row) => [
        row.txnDate,
        {
          totalAmount: Number(row.totalAmount) || 0,
          totalCount: Number(row.totalCount) || 0,
        },
      ])
    );

    const weeklyVolume = buildDateSeries(7, transactionMap);
    const monthlyVolume = buildDateSeries(30, transactionMap);

    res.json({
      totals: {
        users: Number(totalUsers) || 0,
        accounts: Number(totalAccounts) || 0,
        funds: Number(totalFunds) || 0,
        dailyTransactions: {
          amount: Number(daily?.totalAmount) || 0,
          count: Number(daily?.totalCount) || 0,
        },
      },
      volume: {
        weekly: weeklyVolume,
        monthly: monthlyVolume,
      },
    });
  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
};

