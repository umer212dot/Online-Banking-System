import db from '../config/db.js';
import { getIO } from '../socket.js';

// GET USER NOTIFICATIONS
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const [notifications] = await db.query(
      `SELECT 
        notification_id,
        type,
        message,
        is_read,
        created_at
      FROM Notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50`,
      [userId]
    );

    // Count unread notifications
    const [unreadCount] = await db.query(
      'SELECT COUNT(*) as count FROM Notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ 
      notifications,
      unreadCount: unreadCount[0].count 
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// MARK NOTIFICATION AS READ
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { notification_id } = req.params;

    // Verify notification belongs to user
    const [notifications] = await db.query(
      'SELECT notification_id FROM Notifications WHERE notification_id = ? AND user_id = ?',
      [notification_id, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Mark as read
    await db.query(
      'UPDATE Notifications SET is_read = TRUE WHERE notification_id = ?',
      [notification_id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification as read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// MARK ALL NOTIFICATIONS AS READ
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await db.query(
      'UPDATE Notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all notifications as read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN: SEND SYSTEM NOTIFICATION
export const sendSystemNotification = async (req, res) => {
  try {
    const { user_id, message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // If user_id is provided, send to specific user
    // If user_id is null/undefined, send to all users
    const io = getIO();
    
    if (user_id) {
      // Send to specific user
      await db.query(
        'INSERT INTO Notifications (user_id, type, message) VALUES (?, ?, ?)',
        [user_id, 'system_noti', message]
      );

      // Emit socket event to specific user
      io.to(`user_${user_id}`).emit('new_notification', {
        message,
        type: 'system_noti'
      });

      res.json({ 
        message: 'Notification sent successfully',
        target: 'user',
        user_id 
      });
    } else {
      // Send to all users
      const [allUsers] = await db.query(
        'SELECT user_id FROM Users WHERE role = "customer" AND status = "approved"'
      );

      if (allUsers.length > 0) {
        const values = allUsers.map(user => [user.user_id, 'system_noti', message]);
        await db.query(
          'INSERT INTO Notifications (user_id, type, message) VALUES ?',
          [values]
        );

        // Emit socket event to all users
        allUsers.forEach(user => {
          io.to(`user_${user.user_id}`).emit('new_notification', {
            message,
            type: 'system_noti'
          });
        });
      }

      res.json({ 
        message: `Notification sent to ${allUsers.length} users`,
        target: 'all',
        userCount: allUsers.length
      });
    }
  } catch (err) {
    console.error('Send system notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN: GET ALL USERS (for dropdown)
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT user_id, full_name, email FROM Users WHERE role = "customer" AND status = "approved" ORDER BY full_name ASC'
    );
    res.json({ users });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

