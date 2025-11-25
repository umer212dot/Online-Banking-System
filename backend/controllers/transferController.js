import db from '../config/db.js';
import { getIO } from '../socket.js';

// GET USER ACCOUNT (single account per user)
export const getUserAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const [accounts] = await db.query(
      'SELECT account_id, account_number, balance, status FROM Accounts WHERE user_id = ? AND status = "active" LIMIT 1',
      [userId]
    );
    if (accounts.length === 0) {
      return res.status(404).json({ message: 'No active account found' });
    }
    res.json({ account: accounts[0] });
  } catch (err) {
    console.error('Get account error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET RECIPIENT ACCOUNT DETAILS (for confirmation)
export const getRecipientAccountDetails = async (req, res) => {
  try {
    const { account_number } = req.params;

    if (!account_number) {
      return res.status(400).json({ message: 'Account number is required' });
    }

    const [accounts] = await db.query(
      `SELECT 
        a.account_id,
        a.account_number,
        a.status,
        u.full_name,
        u.user_id
      FROM Accounts a
      INNER JOIN Users u ON a.user_id = u.user_id
      WHERE a.account_number = ?`,
      [account_number]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({ 
      account_number: accounts[0].account_number,
      account_id: accounts[0].account_id,
      recipient_name: accounts[0].full_name,
      status: accounts[0].status
    });
  } catch (err) {
    console.error('Get recipient account details error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// INTERNAL TRANSFER
export const createInternalTransfer = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { to_account_number, amount, description } = req.body;

    // Validate inputs
    if (!to_account_number || !amount || amount <= 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid transfer details' });
    }

    // Get user's account (single account per user)
    const [fromAccounts] = await connection.query(
      'SELECT account_id, account_number, balance, status FROM Accounts WHERE user_id = ? AND status = "active" LIMIT 1',
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

    // Find to_account
    const [toAccounts] = await connection.query(
      'SELECT account_id, status FROM Accounts WHERE account_number = ?',
      [to_account_number]
    );
    if (toAccounts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Recipient account not found' });
    }
    const toAccount = toAccounts[0];
    if (toAccount.account_id === from_account_id) {
      await connection.rollback();
      return res.status(400).json({ message: 'Cannot transfer to the same account' });
    }
    
    // Check if recipient account is frozen or closed - create failed transaction
    if (toAccount.status !== 'active') {
      // Create failed transaction
      const [failedResult] = await connection.query(
        'INSERT INTO Transactions (from_account_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?)',
        [from_account_id, 'internal_transfer', amount, 'failed', description || `Transfer failed: Recipient account is ${toAccount.status}`]
      );
      const failedTransactionId = failedResult.insertId;
      
      // Create internal transfer record for failed transaction
      await connection.query(
        'INSERT INTO InternalTransfers (transaction_id, to_account_id) VALUES (?, ?)',
        [failedTransactionId, toAccount.account_id]
      );
      
      await connection.commit();
      return res.status(400).json({ 
        message: `Recipient account is ${toAccount.status}. Transfer failed and recorded.`,
        transaction_id: failedTransactionId 
      });
    }

    // Create transaction
    const [result] = await connection.query(
      'INSERT INTO Transactions (from_account_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?)',
      [from_account_id, 'internal_transfer', amount, 'completed', description || null]
    );
    const transactionId = result.insertId;

    // Create internal transfer record
    await connection.query(
      'INSERT INTO InternalTransfers (transaction_id, to_account_id) VALUES (?, ?)',
      [transactionId, toAccount.account_id]
    );

    // Update balances
    await connection.query(
      'UPDATE Accounts SET balance = balance - ? WHERE account_id = ?',
      [amount, from_account_id]
    );
    await connection.query(
      'UPDATE Accounts SET balance = balance + ? WHERE account_id = ?',
      [amount, toAccount.account_id]
    );

    // Get recipient user_id for notification
    const [recipientAccount] = await connection.query(
      'SELECT user_id FROM Accounts WHERE account_id = ?',
      [toAccount.account_id]
    );

    // Create notification for recipient
    if (recipientAccount.length > 0) {
      const recipientUserId = recipientAccount[0].user_id;
      const notificationMessage = `You received $${parseFloat(amount).toFixed(2)} from ${fromAccount.account_number}`;
      
      await connection.query(
        'INSERT INTO Notifications (user_id, type, message) VALUES (?, ?, ?)',
        [recipientUserId, 'transfer', notificationMessage]
      );

      // Emit socket event to recipient
      try {
        const io = getIO();
        io.to(`user_${recipientUserId}`).emit('new_notification', {
          message: notificationMessage,
          type: 'transfer'
        });
      } catch (socketErr) {
        console.error('Socket emit error:', socketErr);
        // Don't fail the transaction if socket fails
      }
    }

    await connection.commit();
    res.status(201).json({ 
      message: 'Transfer completed successfully',
      transaction_id: transactionId 
    });
  } catch (err) {
    await connection.rollback();
    console.error('Internal transfer error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// EXTERNAL TRANSFER
export const createExternalTransfer = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { target_bank, target_account_no, amount, description } = req.body;

    // Validate inputs
    if (!target_bank || !target_account_no || !amount || amount <= 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid transfer details' });
    }

    // Get user's account (single account per user)
    const [fromAccounts] = await connection.query(
      'SELECT account_id, account_number, balance, status FROM Accounts WHERE user_id = ? AND status = "active" LIMIT 1',
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

    // Create transaction
    const [result] = await connection.query(
      'INSERT INTO Transactions (from_account_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?)',
      [from_account_id, 'external_transfer', amount, 'completed', description || null]
    );
    const transactionId = result.insertId;

    // Create external transfer record
    await connection.query(
      'INSERT INTO ExternalTransfers (transaction_id, target_bank, target_account_no) VALUES (?, ?, ?)',
      [transactionId, target_bank, target_account_no]
    );

    // Update balance (deduct from sender)
    await connection.query(
      'UPDATE Accounts SET balance = balance - ? WHERE account_id = ?',
      [amount, from_account_id]
    );

    await connection.commit();
    res.status(201).json({ 
      message: 'Transfer completed successfully',
      transaction_id: transactionId 
    });
  } catch (err) {
    await connection.rollback();
    console.error('External transfer error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// GET MOST FREQUENT INTERNAL RECIPIENTS
export const getFrequentInternalRecipients = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user's account
    const [userAccounts] = await db.query(
      'SELECT account_id FROM Accounts WHERE user_id = ? AND status = "active" LIMIT 1',
      [userId]
    );
    
    if (userAccounts.length === 0) {
      return res.json({ recipients: [] });
    }
    
    const fromAccountId = userAccounts[0].account_id;
    
    // Get most frequent recipients from internal transfers
    const [recipients] = await db.query(
      `SELECT 
        a.account_number,
        a.account_id,
        COUNT(it.transaction_id) as transfer_count
      FROM InternalTransfers it
      INNER JOIN Transactions t ON it.transaction_id = t.transaction_id
      INNER JOIN Accounts a ON it.to_account_id = a.account_id
      WHERE t.from_account_id = ? 
        AND t.status = 'completed'
        AND a.status = 'active'
      GROUP BY a.account_id, a.account_number
      ORDER BY transfer_count DESC, a.account_number ASC
      LIMIT 5`,
      [fromAccountId]
    );
    
    res.json({ recipients });
  } catch (err) {
    console.error('Get frequent internal recipients error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MOST FREQUENT EXTERNAL RECIPIENTS
export const getFrequentExternalRecipients = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user's account
    const [userAccounts] = await db.query(
      'SELECT account_id FROM Accounts WHERE user_id = ? AND status = "active" LIMIT 1',
      [userId]
    );
    
    if (userAccounts.length === 0) {
      return res.json({ recipients: [] });
    }
    
    const fromAccountId = userAccounts[0].account_id;
    
    // Get most frequent external recipients
    const [recipients] = await db.query(
      `SELECT 
        et.target_bank,
        et.target_account_no,
        COUNT(et.transaction_id) as transfer_count
      FROM ExternalTransfers et
      INNER JOIN Transactions t ON et.transaction_id = t.transaction_id
      WHERE t.from_account_id = ? 
        AND t.status = 'completed'
      GROUP BY et.target_bank, et.target_account_no
      ORDER BY transfer_count DESC, et.target_bank ASC, et.target_account_no ASC
      LIMIT 5`,
      [fromAccountId]
    );
    
    res.json({ recipients });
  } catch (err) {
    console.error('Get frequent external recipients error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET TRANSACTION DETAILS FOR RECEIPT
export const getTransactionDetails = async (req, res) => {
  try {
    const { transaction_id } = req.params;
    const userId = req.userId;

    // Get transaction with account and user details
    const [transactions] = await db.query(
      `SELECT 
        t.transaction_id,
        t.from_account_id,
        t.type,
        t.amount,
        t.status,
        t.description,
        t.created_at,
        a_from.account_number as from_account_number,
        u_from.full_name as from_account_holder
      FROM Transactions t
      INNER JOIN Accounts a_from ON t.from_account_id = a_from.account_id
      INNER JOIN Users u_from ON a_from.user_id = u_from.user_id
      WHERE t.transaction_id = ? 
        AND a_from.user_id = ?`,
      [transaction_id, userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const transaction = transactions[0];
    let receiptData = {
      transaction_id: transaction.transaction_id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      created_at: transaction.created_at,
      from_account_number: transaction.from_account_number,
      from_account_holder: transaction.from_account_holder
    };

    // Add type-specific details
    if (transaction.type === 'internal_transfer') {
      const [internalDetails] = await db.query(
        `SELECT 
          a_to.account_number as to_account_number,
          u_to.full_name as to_account_holder
        FROM InternalTransfers it
        INNER JOIN Accounts a_to ON it.to_account_id = a_to.account_id
        INNER JOIN Users u_to ON a_to.user_id = u_to.user_id
        WHERE it.transaction_id = ?`,
        [transaction_id]
      );
      if (internalDetails.length > 0) {
        receiptData.to_account_number = internalDetails[0].to_account_number;
        receiptData.to_account_holder = internalDetails[0].to_account_holder;
      }
    } else if (transaction.type === 'external_transfer') {
      const [externalDetails] = await db.query(
        `SELECT target_bank, target_account_no
        FROM ExternalTransfers
        WHERE transaction_id = ?`,
        [transaction_id]
      );
      if (externalDetails.length > 0) {
        receiptData.target_bank = externalDetails[0].target_bank;
        receiptData.target_account_no = externalDetails[0].target_account_no;
      }
    } else if (transaction.type === 'bill_payment') {
      const [billDetails] = await db.query(
        `SELECT 
          b.biller_name,
          b.category,
          bp.consumer_number,
          DATE_FORMAT(t.created_at, '%M %Y') as billing_month_formatted
        FROM BillPayments bp
        INNER JOIN Biller b ON bp.biller_id = b.biller_id
        INNER JOIN Transactions t ON bp.transaction_id = t.transaction_id
        WHERE bp.transaction_id = ?`,
        [transaction_id]
      );
      if (billDetails.length > 0) {
        receiptData.biller_name = billDetails[0].biller_name;
        receiptData.category = billDetails[0].category;
        receiptData.consumer_number = billDetails[0].consumer_number;
        receiptData.billing_month_formatted = billDetails[0].billing_month_formatted;
      }
    }

    res.json(receiptData);
  } catch (err) {
    console.error('Get transaction details error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET TRANSACTION HISTORY WITH PAGINATION
export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    // Get user's account
    const [userAccounts] = await db.query(
      'SELECT account_id FROM Accounts WHERE user_id = ? AND status = "active" LIMIT 1',
      [userId]
    );

    if (userAccounts.length === 0) {
      return res.json({ transactions: [], hasMore: false });
    }

    const accountId = userAccounts[0].account_id;

    // Get transactions with basic info
    const [transactions] = await db.query(
      `SELECT 
        t.transaction_id,
        t.type,
        t.amount,
        t.status,
        t.description,
        t.created_at
      FROM Transactions t
      WHERE t.from_account_id = ?
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?`,
      [accountId, limit, offset]
    );

    // Check if there are more transactions
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM Transactions WHERE from_account_id = ?',
      [accountId]
    );
    const total = countResult[0].total;
    const hasMore = (offset + limit) < total;

    res.json({ 
      transactions,
      hasMore,
      currentPage: page,
      totalTransactions: total
    });
  } catch (err) {
    console.error('Get transaction history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

