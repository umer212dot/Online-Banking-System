import db from '../config/db.js';

// GET ALL BILLERS (only active - for customers)
export const getBillers = async (req, res) => {
  try {
    const [billers] = await db.query(
      'SELECT biller_id, biller_name, category, status FROM Biller WHERE status = "active" ORDER BY biller_name ASC'
    );
    res.json({ billers });
  } catch (err) {
    console.error('Get billers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL BILLERS (for admin - shows all including deactivated)
export const getAllBillers = async (req, res) => {
  try {
    const [billers] = await db.query(
      'SELECT biller_id, biller_name, category, status FROM Biller ORDER BY biller_name ASC'
    );
    res.json({ billers });
  } catch (err) {
    console.error('Get all billers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET BILL AMOUNT (Simulate API call - generate random amount)
export const getBillAmount = async (req, res) => {
  try {
    const { biller_id, consumer_number } = req.body;

    if (!biller_id || !consumer_number) {
      return res.status(400).json({ message: 'Biller ID and consumer number are required' });
    }

    // Verify biller exists and is active
    const [billers] = await db.query(
      'SELECT biller_id, biller_name, status FROM Biller WHERE biller_id = ?',
      [biller_id]
    );

    if (billers.length === 0) {
      return res.status(404).json({ message: 'Biller not found' });
    }

    if (billers[0].status !== 'active') {
      return res.status(400).json({ message: 'Biller is deactivated and cannot receive payments' });
    }

    // Simulate API call by generating a random amount based on consumer number
    // This creates a consistent amount for the same consumer number
    const hash = consumer_number.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseAmount = (hash % 5000) + 1000; // Amount between 1000-6000
    const randomVariation = Math.floor(Math.random() * 500); // Add 0-500 variation
    const amount = (baseAmount + randomVariation).toFixed(2);

    res.json({ 
      amount: parseFloat(amount),
      biller_name: billers[0].biller_name,
      consumer_number 
    });
  } catch (err) {
    console.error('Get bill amount error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE BILL PAYMENT
export const createBillPayment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { biller_id, consumer_number, amount } = req.body;

    // Validate inputs
    if (!biller_id || !consumer_number || !amount || amount <= 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid payment details' });
    }

    // Get user's account (single account per user)
    const [fromAccounts] = await connection.query(
      'SELECT account_id, balance, status FROM Accounts WHERE user_id = ? AND status = "active" LIMIT 1',
      [userId]
    );
    if (fromAccounts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Account not found or inactive' });
    }
    const fromAccount = fromAccounts[0];
    const from_account_id = fromAccount.account_id;
    
    if (parseFloat(fromAccount.balance) < parseFloat(amount)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Verify biller exists and is active
    const [billers] = await connection.query(
      'SELECT biller_id, biller_name, status FROM Biller WHERE biller_id = ?',
      [biller_id]
    );
    if (billers.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Biller not found' });
    }

    if (billers[0].status !== 'active') {
      await connection.rollback();
      return res.status(400).json({ message: 'Biller is deactivated and cannot receive payments' });
    }

    // Check if payment already made for this consumer number in the current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    const [existingPayments] = await connection.query(
      `SELECT bp.transaction_id 
       FROM BillPayments bp
       INNER JOIN Transactions t ON bp.transaction_id = t.transaction_id
       WHERE bp.biller_id = ? 
         AND bp.consumer_number = ?
         AND t.from_account_id = ?
         AND t.status = 'completed'
         AND MONTH(t.created_at) = ?
         AND YEAR(t.created_at) = ?`,
      [biller_id, consumer_number, from_account_id, currentMonth, currentYear]
    );

    if (existingPayments.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        message: `Bill for this consumer number has already been paid for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}` 
      });
    }

    // Create transaction
    const [result] = await connection.query(
      'INSERT INTO Transactions (from_account_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?)',
      [from_account_id, 'bill_payment', amount, 'completed', `Bill payment to ${billers[0].biller_name}`]
    );
    const transactionId = result.insertId;

    // Create bill payment record
    await connection.query(
      'INSERT INTO BillPayments (transaction_id, biller_id, consumer_number) VALUES (?, ?, ?)',
      [transactionId, biller_id, consumer_number]
    );

    // Update balance (deduct from sender)
    await connection.query(
      'UPDATE Accounts SET balance = balance - ? WHERE account_id = ?',
      [amount, from_account_id]
    );

    await connection.commit();
    res.status(201).json({ 
      message: 'Bill payment completed successfully',
      transaction_id: transactionId 
    });
  } catch (err) {
    await connection.rollback();
    console.error('Bill payment error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// GET USER BILL PAYMENT HISTORY
export const getBillPaymentHistory = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's account
    const [userAccounts] = await db.query(
      'SELECT account_id FROM Accounts WHERE user_id = ? AND status = "active" LIMIT 1',
      [userId]
    );

    if (userAccounts.length === 0) {
      return res.json({ payments: [] });
    }

    const accountId = userAccounts[0].account_id;

    // Get bill payment history with billing month
    const [payments] = await db.query(
      `SELECT 
        t.transaction_id,
        t.amount,
        t.status,
        t.description,
        t.created_at,
        b.biller_name,
        b.category,
        bp.consumer_number,
        DATE_FORMAT(t.created_at, '%Y-%m') as billing_month,
        DATE_FORMAT(t.created_at, '%M %Y') as billing_month_formatted
      FROM Transactions t
      INNER JOIN BillPayments bp ON t.transaction_id = bp.transaction_id
      INNER JOIN Biller b ON bp.biller_id = b.biller_id
      WHERE t.from_account_id = ? 
        AND t.type = 'bill_payment'
      ORDER BY t.created_at DESC
      LIMIT 50`,
      [accountId]
    );

    res.json({ payments });
  } catch (err) {
    console.error('Get bill payment history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN: ADD BILLER
export const addBiller = async (req, res) => {
  try {
    const { biller_name, category } = req.body;

    if (!biller_name || !category) {
      return res.status(400).json({ message: 'Biller name and category are required' });
    }

    // Validate category
    const validCategories = ['electricity', 'gas', 'water', 'internet', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Check if biller already exists
    const [existing] = await db.query(
      'SELECT biller_id FROM Biller WHERE biller_name = ?',
      [biller_name]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Biller already exists' });
    }

    // Insert biller (default status is 'active')
    const [result] = await db.query(
      'INSERT INTO Biller (biller_name, category, status) VALUES (?, ?, ?)',
      [biller_name, category, 'active']
    );

    res.status(201).json({ 
      message: 'Biller added successfully',
      biller_id: result.insertId 
    });
  } catch (err) {
    console.error('Add biller error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN: UPDATE BILLER STATUS
export const updateBillerStatus = async (req, res) => {
  try {
    const { biller_id } = req.params;
    const { status } = req.body;

    if (!biller_id || !status) {
      return res.status(400).json({ message: 'Biller ID and status are required' });
    }

    // Validate status
    if (status !== 'active' && status !== 'deactivated') {
      return res.status(400).json({ message: 'Invalid status. Must be "active" or "deactivated"' });
    }

    // Update biller status
    const [result] = await db.query(
      'UPDATE Biller SET status = ? WHERE biller_id = ?',
      [status, biller_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Biller not found' });
    }

    res.json({ 
      message: `Biller ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      status 
    });
  } catch (err) {
    console.error('Update biller status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN: DELETE BILLER
export const deleteBiller = async (req, res) => {
  try {
    const { biller_id } = req.params;

    if (!biller_id) {
      return res.status(400).json({ message: 'Biller ID is required' });
    }

    // Check if biller has any payments
    const [payments] = await db.query(
      'SELECT COUNT(*) as count FROM BillPayments WHERE biller_id = ?',
      [biller_id]
    );

    if (payments[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete biller with existing payments. Consider deactivating instead.' 
      });
    }

    // Delete biller
    const [result] = await db.query(
      'DELETE FROM Biller WHERE biller_id = ?',
      [biller_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Biller not found' });
    }

    res.json({ message: 'Biller deleted successfully' });
  } catch (err) {
    console.error('Delete biller error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

