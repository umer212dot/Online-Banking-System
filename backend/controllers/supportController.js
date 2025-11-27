import db from '../config/db.js';
import { getIO } from '../socket.js';

// Create a new support ticket (user)
export const createTicket = async (req, res) => {
  try {
    const userId = req.userId;
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ message: 'Missing fields' });

    const [result] = await db.query(
      'INSERT INTO SupportTickets (user_id, subject, message) VALUES (?, ?, ?)',
      [userId, subject, message]
    );

    const ticketId = result.insertId;
    const [[ticketRows]] = await db.query('SELECT * FROM SupportTickets WHERE ticket_id = ?', [ticketId]);

    // Emit realtime event to all admins
    try {
      const io = getIO();
      io.emit('new_ticket', { ticket: ticketRows });
    } catch (err) {
      console.error('Socket emit error (may be fine if socket not initialized):', err.message);
    }

    res.status(201).json({ ticket_id: ticketId, ticket: ticketRows });
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tickets for current user
export const getUserTickets = async (req, res) => {
  try {
    const userId = req.userId;
    const [tickets] = await db.query('SELECT * FROM SupportTickets WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json({ tickets });
  } catch (err) {
    console.error('Get user tickets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: get all tickets
export const adminGetTickets = async (req, res) => {
  try {
    const [tickets] = await db.query('SELECT * FROM SupportTickets ORDER BY created_at DESC');
    res.json({ tickets });
  } catch (err) {
    console.error('Admin get tickets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get responses for a ticket (either user or admin)
export const getResponses = async (req, res) => {
  try {
    const ticketId = req.params.ticket_id;
    const [responses] = await db.query('SELECT * FROM TicketResponses WHERE ticket_id = ? ORDER BY responded_at ASC', [ticketId]);
    res.json({ responses });
  } catch (err) {
    console.error('Get responses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: add a response to a ticket, create notification, and emit realtime event
export const addResponse = async (req, res) => {
  try {
    const ticketId = req.params.ticket_id;
    const adminId = req.userId; // use authenticated admin id
    const { message, status } = req.body; // status is optional: when provided, update ticket status
    if (!message) return res.status(400).json({ message: 'Message required' });

    // find ticket owner and current ticket
    const [[ticketRows]] = await db.query('SELECT * FROM SupportTickets WHERE ticket_id = ?', [ticketId]);
    if (!ticketRows) return res.status(404).json({ message: 'Ticket not found' });
    const userId = ticketRows.user_id;

    // If admin included a status with the response, update the ticket status
    if (status && status !== ticketRows.status) {
      await db.query('UPDATE SupportTickets SET status = ? WHERE ticket_id = ?', [status, ticketId]);
      // update local copy so we emit the correct status below
      ticketRows.status = status;
    }

    // Insert response after optional status update
    const [result] = await db.query(
      'INSERT INTO TicketResponses (ticket_id, admin_id, message) VALUES (?, ?, ?)',
      [ticketId, adminId, message]
    );

    const responseId = result.insertId;
    const [[responseRows]] = await db.query('SELECT * FROM TicketResponses WHERE response_id = ?', [responseId]);

    // create notification
    const notiMessage = `Admin responded to your ticket #${ticketId}`;
    await db.query('INSERT INTO Notifications (user_id, type, message) VALUES (?, ?, ?)', [userId, 'system_noti', notiMessage]);

    // emit realtime events to the user room (response + latest status)
    try {
      const io = getIO();
      // Emit ticket response event for CustomerSupportTicket component including status
      io.to(`user_${userId}`).emit('ticket_response', {
        ticket_id: ticketId,
        response: responseRows,
        status: ticketRows.status,
        user_id: userId,
      });
      // Emit notification event for NotificationBell component
      io.to(`user_${userId}`).emit('new_notification', { message: notiMessage, type: 'system_noti' });
    } catch (err) {
      console.error('Socket emit error (may be fine if socket not initialized):', err.message);
    }

    res.status(201).json({ response: responseRows });
  } catch (err) {
    console.error('Add response error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: update ticket status
export const updateStatus = async (req, res) => {
  try {
    const ticketId = req.params.ticket_id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status required' });

    // Get ticket to find owner
    const [[ticketRows]] = await db.query('SELECT * FROM SupportTickets WHERE ticket_id = ?', [ticketId]);
    if (!ticketRows) return res.status(404).json({ message: 'Ticket not found' });

    const userId = ticketRows.user_id;
    console.log(`Updating ticket ${ticketId} to status: ${status}, owner: ${userId}`);

    await db.query('UPDATE SupportTickets SET status = ? WHERE ticket_id = ?', [status, ticketId]);

    // Emit realtime status update to admins only (do not notify customer immediately)
    try {
      const io = getIO();
      console.log(`Emitting ticket_status_updated to all admins (ticket ${ticketId})`);
      // Emit to all connected clients (admins will filter by role) — clients currently listen and update admin UI
      io.emit('ticket_status_updated', { ticket_id: ticketId, status });
      console.log('Status update emitted to admins');
    } catch (err) {
      console.error('Socket emit error (may be fine if socket not initialized):', err.message);
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  createTicket,
  getUserTickets,
  adminGetTickets,
  getResponses,
  addResponse,
  updateStatus,
};
