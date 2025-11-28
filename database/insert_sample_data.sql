-- ============================================
-- TO DELETE ALL DATA
-- set foreign_key_checks = 0;
-- truncate table online_banking_system.users;
-- truncate table online_banking_system.accounts;
-- truncate table online_banking_system.biller;
-- truncate table online_banking_system.billpayments;
-- truncate table online_banking_system.externaltransfers;
-- truncate table online_banking_system.internaltransfers;
-- truncate table online_banking_system.notifications;
-- truncate table online_banking_system.supporttickets;
-- truncate table online_banking_system.ticketresponses;
-- truncate table online_banking_system.transactions;
-- set foreign_key_checks = 1;
-- ============================================
-- SAMPLE DATA INSERT SCRIPT
-- Online Banking System
-- ============================================
-- This script inserts sample data into all tables
-- Make sure to run create_tables_script.sql first
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
-- Password hash for all users: "123123123" (bcrypt hash)
-- In production, use actual bcrypt hashes
INSERT INTO Users (full_name, email, phone, cnic, password_hash, role, status) VALUES
('John Smith', 'user1@email.com', '03001234567', '12345-1234567-1', '$2b$10$09qxrLcD8zt3TisDh.AaZ.juJ9Hau47uFmkE8FQ3pAZJWtWVJtueG', 'customer', 'approved'),
('Sarah Johnson', 'user2@email.com', '03001234568', '12345-1234567-2', '$2b$10$09qxrLcD8zt3TisDh.AaZ.juJ9Hau47uFmkE8FQ3pAZJWtWVJtueG', 'customer', 'approved'),
('Michael Brown', 'rejected@email.com', '03001234569', '12345-1234567-3', '$2b$10$09qxrLcD8zt3TisDh.AaZ.juJ9Hau47uFmkE8FQ3pAZJWtWVJtueG', 'customer', 'rejected'),
('Emily Davis', 'deleted@email.com', '03001234570', '12345-1234567-4', '$2b$10$09qxrLcD8zt3TisDh.AaZ.juJ9Hau47uFmkE8FQ3pAZJWtWVJtueG', 'customer', 'deleted'),
('David Wilson', 'pending@email.com', '03001234571', '12345-1234567-5', '$2b$10$09qxrLcD8zt3TisDh.AaZ.juJ9Hau47uFmkE8FQ3pAZJWtWVJtueG', 'customer', 'pending'),
('frozen Johnson', 'frozen@email.com', '03000004568', '12345-0004567-2', '$2b$10$09qxrLcD8zt3TisDh.AaZ.juJ9Hau47uFmkE8FQ3pAZJWtWVJtueG', 'customer', 'approved'),
('Admin User', 'admin@bank.com', '03001234572', '12345-1234567-6', '$2b$10$09qxrLcD8zt3TisDh.AaZ.juJ9Hau47uFmkE8FQ3pAZJWtWVJtueG', 'admin', 'approved');

-- ============================================
-- 2. ACCOUNTS TABLE
-- ============================================
-- One account per customer user (users 1-5)
INSERT INTO Accounts (user_id, account_number, balance, status) VALUES
(1, 'ACC-2024-0001', 50000.00, 'active'),
(2, 'ACC-2024-0002', 75000.50, 'active'),
-- (3, 'ACC-2024-0003', 25000.75, 'closed'), 
(4, 'ACC-2024-0004', 100000.00, 'closed'),
(6, 'ACC-2024-0005', 15000.25, 'frozen');

-- ============================================
-- 3. BILLER TABLE
-- ============================================
INSERT INTO Biller (biller_name, category, status) VALUES
('K-Electric', 'electricity', 'active'),
('Sui Southern Gas Company', 'gas', 'active'),
('Karachi Water & Sewerage Board', 'water', 'active'),
('PTCL', 'internet', 'active'),
('Jazz', 'internet', 'active'),
('Zong', 'internet', 'deactivated'),
('Ufone', 'internet', 'active');

-- ============================================
-- 4. TRANSACTIONS TABLE
-- ============================================
-- Mix of internal transfers, external transfers, and bill payments
INSERT INTO Transactions (from_account_id, type, amount, status, description) VALUES
-- Internal transfers
(1, 'internal_transfer', 5000.00, 'completed', 'Payment for services'),
(2, 'internal_transfer', 10000.00, 'completed', 'Loan repayment'),
(3, 'internal_transfer', 2500.50, 'completed', 'Monthly allowance'),
(4, 'internal_transfer', 15000.00, 'completed', 'Business payment'),
(1, 'internal_transfer', 3000.00, 'completed', 'Family support'),
-- External transfers
(2, 'external_transfer', 20000.00, 'completed', 'External bank transfer'),
(3, 'external_transfer', 5000.00, 'completed', 'Payment to vendor'),
(4, 'external_transfer', 12000.00, 'completed', 'International transfer'),
(1, 'external_transfer', 8000.00, 'completed', 'Online purchase'),
(2, 'external_transfer', 15000.00, 'completed', 'Investment payment'),
-- Bill payments
(1, 'bill_payment', 5000.00, 'completed', 'Electricity bill payment'),
(2, 'bill_payment', 3000.00, 'completed', 'Gas bill payment'),
(3, 'bill_payment', 2000.00, 'completed', 'Water bill payment'),
(4, 'bill_payment', 4000.00, 'completed', 'Internet bill payment'),
(1, 'bill_payment', 2500.00, 'completed', 'Mobile bill payment');

-- ============================================
-- 5. INTERNAL TRANSFERS TABLE
-- ============================================
-- Links to transactions 1-5 (internal_transfer type)
INSERT INTO InternalTransfers (transaction_id, to_account_id) VALUES
(1, 2),  -- From account 1 to account 2
(2, 3),  -- From account 2 to account 3
(3, 4);  -- From account 3 to account 4


-- ============================================
-- 6. EXTERNAL TRANSFERS TABLE
-- ============================================
-- Links to transactions 6-10 (external_transfer type)
INSERT INTO ExternalTransfers (transaction_id, target_bank, target_account_no) VALUES
(6, 'HBL', 'HBL-1234567890'),
(7, 'UBL', 'UBL-9876543210'),
(8, 'MCB', 'MCB-5555555555'),
(9, 'Allied Bank', 'ABL-1111111111'),
(10, 'Standard Chartered', 'SCB-2222222222');

-- ============================================
-- 7. BILL PAYMENTS TABLE
-- ============================================
-- Links to transactions 11-15 (bill_payment type)
INSERT INTO BillPayments (transaction_id, biller_id, consumer_number) VALUES
(11, 1, 'KE-123456789'),      -- K-Electric
(12, 2, 'SSGC-987654321'),    -- Sui Southern Gas
(13, 3, 'KWSB-555555555'),    -- Karachi Water Board
(14, 4, 'PTCL-111111111'),    -- PTCL
(15, 5, 'JAZZ-222222222');    -- Jazz

-- ============================================
-- 8. NOTIFICATIONS TABLE
-- ============================================
INSERT INTO Notifications (user_id, type, message, is_read) VALUES
(1, 'transfer', 'Your transfer of $5,000.00 to ACC-2024-0002 has been completed', FALSE),
(2, 'transfer', 'You received $5,000.00 from ACC-2024-0001', FALSE),
(2, 'transfer', 'Your external transfer of $20,000.00 to HBL has been completed', FALSE),
(3, 'account_activity', 'Your account balance has been updated', TRUE),
(3, 'transfer', 'You received $10,000.00 from ACC-2024-0002', FALSE),
(5, 'transfer', 'You received $15,000.00 from ACC-2024-0004', FALSE),
(1, 'account_activity', 'Your account statement is ready for download', FALSE);

-- ============================================
-- 9. SUPPORT TICKETS TABLE
-- ============================================
INSERT INTO SupportTickets (user_id, subject, message, status) VALUES
(1, 'Account Access Issue', 'I am unable to access my online banking account. Please help me reset my password.', 'open'),
(2, 'Transaction Inquiry', 'I need clarification about a recent transaction. Transaction ID: 6', 'in_progress'),
(3, 'Balance Discrepancy', 'My account balance does not match my records. Please investigate.', 'open'),
(4, 'Card Replacement Request', 'I lost my debit card and need a replacement urgently.', 'closed'),
(5, 'Account Upgrade', 'I would like to upgrade my account to a premium account. What are the requirements?', 'open'),
(1, 'Bill Payment Failed', 'My bill payment transaction failed but the amount was deducted. Please refund.', 'in_progress'),
(2, 'Transfer Limit Increase', 'I need to increase my daily transfer limit for business purposes.', 'open'),
(3, 'Mobile App Issue', 'The mobile banking app is crashing on my device. Device: iPhone 14', 'closed'),
(4, 'Interest Rate Inquiry', 'What is the current interest rate for savings accounts?', 'closed'),
(5, 'Account Statement Request', 'I need a detailed account statement for the last 6 months.', 'open');

-- ============================================
-- 10. TICKET RESPONSES TABLE
-- ============================================
-- Admin (user_id 6) responds to tickets
INSERT INTO TicketResponses (ticket_id, admin_id, message) VALUES
(2, 6, 'Thank you for contacting us. We have reviewed your transaction and found it to be legitimate. The transfer was completed successfully to HBL account HBL-1234567890. If you need further assistance, please let us know.'),
(4, 6, 'Your card replacement request has been processed. A new card will be delivered to your registered address within 5-7 business days. Your old card has been blocked for security purposes.'),
(6, 6, 'We apologize for the inconvenience. We have investigated the issue and found that the transaction was actually successful. The amount was correctly deducted and the bill was paid. Please check your account statement for confirmation.'),
(8, 6, 'We have identified the issue with the mobile app. Please update to the latest version (v2.5.0) which includes bug fixes. If the problem persists, please contact our technical support team.'),
(9, 6, 'The current interest rate for savings accounts is 5.5% per annum, calculated on a monthly basis. Interest is credited to your account at the end of each month. For premium accounts, the rate is 7% per annum.');



