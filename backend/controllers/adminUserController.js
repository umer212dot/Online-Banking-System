import db from '../config/db.js';

const STATUS_TRANSITIONS = {
  pending: ['approved', 'rejected'],
  approved: ['deleted'],
  rejected: [],
  deleted: [],
};

const ACCOUNT_STATUS_TRANSITIONS = {
  active: ['frozen', 'closed'],
  frozen: ['active', 'closed'],
  closed: [],
};

export const getAdminUserLists = async (_req, res) => {
  try {
    const [pendingUsers] = await db.query(
      `SELECT user_id, full_name, email, cnic, status, created_at
       FROM Users
       WHERE role = 'customer' AND status = 'pending'
       ORDER BY created_at DESC`
    );

    const [approvedUsers] = await db.query(
      `SELECT user_id, full_name, email, cnic, status, created_at
       FROM Users
       WHERE role = 'customer' AND status = 'approved'
       ORDER BY updated_at DESC`
    );

    res.json({ pendingUsers, approvedUsers });
  } catch (err) {
    console.error('Failed to load admin user lists:', err);
    res.status(500).json({ message: 'Failed to load user lists' });
  }
};

export const updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const [users] = await db.query(
      `SELECT status
       FROM Users
       WHERE user_id = ? AND role = 'customer'`,
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentStatus = users[0].status;

    if (currentStatus === status) {
      return res.json({ message: `User already ${status}` });
    }

    const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: `Cannot change status from ${currentStatus} to ${status}` });
    }

    await db.query(
      `UPDATE Users
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND role = 'customer'`,
      [status, userId]
    );

    if (status === 'approved' && currentStatus !== 'approved') {
      const [existingAccounts] = await db.query(
        `SELECT account_id FROM Accounts WHERE user_id = ?`,
        [userId]
      );

      if (!existingAccounts.length) {
        const [lastAccountRows] = await db.query(
          `SELECT account_number FROM Accounts ORDER BY account_id DESC LIMIT 1`
        );

        const currentYear = new Date().getFullYear();
        const prefix = `ACC-${currentYear}`;

        let nextSequence = 1;
        if (lastAccountRows.length) {
          const lastAccountNumber = lastAccountRows[0].account_number || '';
          const parts = lastAccountNumber.split('-');
          const numericPart = parseInt(parts[parts.length - 1], 10);
          if (!Number.isNaN(numericPart)) {
            nextSequence = numericPart + 1;
          }
        }

        const paddedSequence = String(nextSequence).padStart(4, '0');
        const accountNumber = `${prefix}-${paddedSequence}`;

        await db.query(
          `INSERT INTO Accounts (user_id, account_number, balance, status)
           VALUES (?, ?, 0, 'active')`,
          [userId, accountNumber]
        );
      }
    }

    res.json({ message: `User status updated to ${status}` });
  } catch (err) {
    console.error('Failed to update user status:', err);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

export const getManagedAccounts = async (_req, res) => {
  try {
    const [accounts] = await db.query(
      `SELECT 
         a.account_id,
         a.account_number,
         a.status AS account_status,
         a.balance,
         a.updated_at AS account_updated_at,
         u.user_id,
         u.full_name,
         u.email,
         u.cnic,
         u.status AS user_status
       FROM Accounts a
       JOIN Users u ON u.user_id = a.user_id
       WHERE u.role = 'customer'
       ORDER BY a.updated_at DESC`
    );

    res.json({ accounts });
  } catch (err) {
    console.error('Failed to load managed accounts:', err);
    res.status(500).json({ message: 'Failed to load accounts' });
  }
};

export const updateAccountStatus = async (req, res) => {
  const { accountId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const [accounts] = await db.query(
      `SELECT status
       FROM Accounts
       WHERE account_id = ?`,
      [accountId]
    );

    if (!accounts.length) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const currentStatus = accounts[0].status;

    if (currentStatus === status) {
      return res.json({ message: `Account already ${status}` });
    }

    const allowedNextStatuses = ACCOUNT_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: `Cannot change status from ${currentStatus} to ${status}` });
    }

    await db.query(
      `UPDATE Accounts
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE account_id = ?`,
      [status, accountId]
    );

    res.json({ message: `Account status updated to ${status}` });
  } catch (err) {
    console.error('Failed to update account status:', err);
    res.status(500).json({ message: 'Failed to update account status' });
  }
};



