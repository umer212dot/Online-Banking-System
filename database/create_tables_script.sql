-- ============================================
-- TO DELETE ALL Tables
-- set foreign_key_checks = 0;
-- drop table online_banking_system.users;
-- drop table online_banking_system.accounts;
-- drop table online_banking_system.biller;
-- drop table online_banking_system.billpayments;
-- drop table online_banking_system.externaltransfers;
-- drop table online_banking_system.internaltransfers;
-- drop table online_banking_system.notifications;
-- drop table online_banking_system.supporttickets;
-- drop table online_banking_system.ticketresponses;
-- drop table online_banking_system.transactions;
-- set foreign_key_checks = 1;
-- ============================================
-- Users table
CREATE TABLE Users (
    user_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name        VARCHAR(150) NOT NULL,
    email            VARCHAR(150) NOT NULL UNIQUE,
    phone            VARCHAR(20),
    cnic             VARCHAR(20) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    role             ENUM('customer','admin') NOT NULL DEFAULT 'customer',
    status           ENUM('pending','approved','rejected','deleted') NOT NULL DEFAULT 'pending',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE Accounts (
    account_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    account_number   VARCHAR(30) NOT NULL UNIQUE,
    balance          DECIMAL(15,2) NOT NULL DEFAULT 0,
    status           ENUM('active','frozen','closed') NOT NULL DEFAULT 'active',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Master Transactions table
CREATE TABLE Transactions (
    transaction_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_account_id  BIGINT NOT NULL,
    type             ENUM('internal_transfer','external_transfer','bill_payment') NOT NULL,
    amount           DECIMAL(15,2) NOT NULL,
    status           ENUM('completed','failed') NOT NULL,
    description      VARCHAR(255),
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_account_id) REFERENCES Accounts(account_id)
);

-- Internal transfer details
CREATE TABLE InternalTransfers (
    transaction_id   BIGINT PRIMARY KEY,
    to_account_id    BIGINT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id),
    FOREIGN KEY (to_account_id) REFERENCES Accounts(account_id)
);

-- External transfer details
CREATE TABLE ExternalTransfers (
    transaction_id   BIGINT PRIMARY KEY,
    target_bank      VARCHAR(150) NOT NULL,
    target_account_no VARCHAR(50) NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id)
);

-- Biller companies
CREATE TABLE Biller (
    biller_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    biller_name      VARCHAR(150) NOT NULL,
    category         ENUM('electricity','gas','water','internet','other') NOT NULL,
    status           ENUM('active','deactivated') NOT NULL DEFAULT 'active'
);

-- Bill payments
CREATE TABLE BillPayments (
    transaction_id   BIGINT PRIMARY KEY,
    biller_id        BIGINT NOT NULL,
    consumer_number  VARCHAR(100) NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id),
    FOREIGN KEY (biller_id) REFERENCES Biller(biller_id)
);

-- Notifications
CREATE TABLE Notifications (
    notification_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    type             ENUM('transfer','payment','account_activity') NOT NULL,
    message          VARCHAR(255) NOT NULL,
    is_read          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- Support tickets
CREATE TABLE SupportTickets (
    ticket_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    subject          VARCHAR(255) NOT NULL,
    message          TEXT NOT NULL,
    status           ENUM('open','in_progress','closed') NOT NULL DEFAULT 'open',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- Ticket responses
CREATE TABLE TicketResponses (
    response_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id        BIGINT NOT NULL,
    admin_id         BIGINT NOT NULL,
    message          TEXT NOT NULL,
    responded_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES SupportTickets(ticket_id),
    FOREIGN KEY (admin_id) REFERENCES Users(user_id)
);
