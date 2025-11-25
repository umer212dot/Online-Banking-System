import db from '../config/db.js';

// Get latest 5 notifications for a user
export const getLatestNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const [notifications] = await db.query(
      `SELECT notification_id, type, message, is_read, created_at 
       FROM Notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    res.json(notifications);
  } catch (err) {
    console.error('Error fetching latest notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all notifications for a user
export const getAllNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const [notifications] = await db.query(
      `SELECT notification_id, type, message, is_read, created_at 
       FROM Notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(notifications);
  } catch (err) {
    console.error('Error fetching all notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    await db.query(
      'UPDATE Notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

