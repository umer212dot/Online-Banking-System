import db from '../config/db.js';

const STATUS_TRANSITIONS = {
  pending: ['approved', 'rejected'],
  approved: ['deleted'],
  rejected: [],
  deleted: [],
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

    res.json({ message: `User status updated to ${status}` });
  } catch (err) {
    console.error('Failed to update user status:', err);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};


