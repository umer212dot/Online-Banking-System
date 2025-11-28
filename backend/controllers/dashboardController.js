import db from '../config/db.js';

const buildDateSeries = (days, dataMap) => {
  const series = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  // Build series from oldest to newest (today is last)
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    // Format as YYYY-MM-DD to match database format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    
    // Get data from map or default to 0
    const entry = dataMap.get(key);
    series.push({
      date: key,
      totalAmount: entry ? Number(entry.totalAmount) || 0 : 0,
      totalCount: entry ? Number(entry.totalCount) || 0 : 0,
    });
  }

  return series;
};

export const getDashboardStats = async (_req, res) => {
  try {
    const [usersResult] = await db.query(
      `SELECT COUNT(*) AS totalUsers FROM Users`
    );
    const totalUsers = usersResult[0]?.totalUsers || 0;

    const [accountsResult] = await db.query(
      `SELECT COUNT(*) AS totalAccounts
       FROM Users
       WHERE role = 'customer' AND status = 'approved'`
    );
    const totalAccounts = accountsResult[0]?.totalAccounts || 0;

    const [fundsResult] = await db.query(
      `SELECT COALESCE(SUM(balance), 0) AS totalFunds FROM Accounts`
    );
    const totalFunds = fundsResult[0]?.totalFunds || 0;

    const [dailyResult] = await db.query(
      `SELECT 
         COALESCE(SUM(amount), 0) AS totalAmount,
         COUNT(*) AS totalCount
       FROM Transactions
       WHERE DATE(created_at) = CURDATE()`
    );
    const daily = dailyResult[0] || { totalAmount: 0, totalCount: 0 };

    // Daily data: last 15 days including today
    // Get transactions for the last 15 days (including today)
    const [dailyRows] = await db.query(
      `SELECT 
         DATE(created_at) AS txnDate,
         COALESCE(SUM(amount), 0) AS totalAmount,
         COUNT(*) AS totalCount
       FROM Transactions
       WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
         AND DATE(created_at) <= CURDATE()
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`
    );

    // Create a map with date as key (YYYY-MM-DD format)
    const dailyMap = new Map();
    dailyRows.forEach((row) => {
      // Ensure date is in YYYY-MM-DD format
      const dateValue = row.txnDate instanceof Date ? row.txnDate : new Date(row.txnDate);
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      dailyMap.set(dateStr, {
        totalAmount: Number(row.totalAmount) || 0,
        totalCount: Number(row.totalCount) || 0,
      });
    });

    // Format daily volume data for last 15 days
    const dailyVolume = buildDateSeries(15, dailyMap);

    res.json({
      totals: {
        users: Number(totalUsers) || 0,
        accounts: Number(totalAccounts) || 0,
        funds: Number(totalFunds) || 0,
        dailyTransactions: {
          amount: Number(daily.totalAmount) || 0,
          count: Number(daily.totalCount) || 0,
        },
      },
      volume: {
        daily: dailyVolume || [],
      },
    });
  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
};

