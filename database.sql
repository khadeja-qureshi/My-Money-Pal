
-- DATABASE CREATION

DROP DATABASE IF EXISTS MyMoneyPal;
CREATE DATABASE MyMoneyPal;
USE MyMoneyPal;


-- 1. USERS TABLE

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    security_question ENUM('favorite_color', 'favorite_subject', 'favorite_movie') NOT NULL,
    security_answer VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. CATEGORIES TABLE

CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
);


-- 3. TRANSACTIONS TABLE

CREATE TABLE Transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    note VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
        ON DELETE SET NULL
);


-- 4. BUDGETS TABLE

CREATE TABLE Budgets (
    budget_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NULL,
    amount_limit DECIMAL(10,2) NOT NULL CHECK (amount_limit > 0),
    month INT CHECK (month BETWEEN 1 AND 12),
    year INT CHECK (year >= 2000),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
        ON DELETE SET NULL
);


-- 5. SAVINGS GOALS TABLE

CREATE TABLE SavingsGoals (
    goal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NULL,
    goal_name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL CHECK (target_amount > 0),
    current_saved DECIMAL(10,2) DEFAULT 0.00,
    deadline DATE,
    progress DECIMAL(5,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
        ON DELETE SET NULL
);


-- 6. NOTIFICATIONS TABLE

CREATE TABLE Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_id INT NULL,
    message VARCHAR(255),
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    type ENUM('budget_alert', 'savings_milestone') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES SavingsGoals(goal_id)
        ON DELETE SET NULL
);


-- 7. REPORTS TABLE

CREATE TABLE Reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    time_period ENUM('monthly', 'weekly') NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
);


-- 8. INDEXES (Performance Optimization)

CREATE INDEX idx_user_id ON Transactions(user_id);
CREATE INDEX idx_category_id ON Transactions(category_id);
CREATE INDEX idx_user_month_year ON Budgets(user_id, month, year);
CREATE INDEX idx_goal_user ON SavingsGoals(user_id);


-- 9. SAMPLE USERS 

INSERT INTO Users (username, email, password, security_question, security_answer)
VALUES
('Areesha', 'areesha@email.com', 'hashedpassword1', 'favorite_color', 'Blue'),
('Khadeja', 'khadeja@email.com', 'hashedpassword2', 'favorite_subject', 'Math'),
('Marium', 'marium@email.com', 'hashedpassword3', 'favorite_movie', 'Inception'),
('Fatima', 'fatima@email.com', 'hashedpassword4', 'favorite_subject', 'Science'),
('Raviha', 'raviha@email.com', 'hashedpassword5', 'favorite_color', 'Purple');


-- 10. PREDEFINED CATEGORIES 

INSERT INTO Categories (user_id, name, type) VALUES
(1, 'Salary', 'income'),
(1, 'Rent', 'expense'),
(1, 'Groceries', 'expense'),
(1, 'Education', 'expense'),
(1, 'Travel', 'expense'),
(1, 'Shopping', 'expense'),
(1, 'Investments', 'income');
ALTER TABLE Users 
MODIFY security_question VARCHAR(255) NOT NULL;

ALTER TABLE savingsgoals
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Pending';

ALTER TABLE savingsgoals
ADD COLUMN notify_enabled TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN last_reminder_sent DATE NULL;

ALTER TABLE Budgets
ADD COLUMN near_limit_sent TINYINT(1) NOT NULL DEFAULT 0;

