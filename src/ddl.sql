-- ============================================
-- PokéBase DDL + RESET stored procedure
-- Group 120
-- ============================================

DROP PROCEDURE IF EXISTS sp_pokebase_reset;
DELIMITER //

CREATE PROCEDURE sp_pokebase_reset()
BEGIN
    SET FOREIGN_KEY_CHECKS = 0;

    DROP TABLE IF EXISTS OrderItems;
    DROP TABLE IF EXISTS Orders;
    DROP TABLE IF EXISTS GradeSlabs;
    DROP TABLE IF EXISTS Listings;
    DROP TABLE IF EXISTS GradingCompanies;
    DROP TABLE IF EXISTS Customers;
    DROP TABLE IF EXISTS Cards;

    -- ======================
    -- Tables
    -- ======================

    -- Customers (no FKs)
    CREATE TABLE Customers (
        customerID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        shippingAddress VARCHAR(255) NOT NULL,
    );

    -- Cards (no FKs)
    CREATE TABLE Cards (
        cardID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        setName VARCHAR(255) NOT NULL, 
        cardNumber VARCHAR(32) NOT NULL,
        name VARCHAR(255) NOT NULL,
        variant ENUM('Standard', 'ReverseHolo', 'FullArt', 'AltArt', 'Promo') NOT NULL DEFAULT 'Standard',
        year SMALLINT
    );

    -- GradingCompanies (no FKs)
    CREATE TABLE GradingCompanies (
        companyID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(32) NOT NULL UNIQUE,
        gradeScale ENUM('10', '100') NOT NULL DEFAULT '10',
        url VARCHAR(255)
    );

    -- Listings (FK → Cards)
    CREATE TABLE Listings (
        listingID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        cardID INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        type ENUM('raw', 'graded') NOT NULL,
        cardCondition ENUM('M', 'NM', 'LP', 'MP', 'HP', 'D'),
        quantityAvailable INT NOT NULL DEFAULT 1,
        status ENUM('active', 'sold_out', 'hidden') NOT NULL DEFAULT 'active',
        FOREIGN KEY (cardID) REFERENCES Cards(cardID)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );

    -- GradeSlabs (FK → Listings, GradingCompanies)
    -- slabID is 1:1 with Listings.listingID
    CREATE TABLE GradeSlabs (
        slabID INT NOT NULL PRIMARY KEY,
        companyID INT NOT NULL,
        grade DECIMAL(3, 1) NOT NULL,
        FOREIGN KEY (slabID) REFERENCES Listings(listingID),
        FOREIGN KEY (companyID) REFERENCES GradingCompanies(companyID)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );

    -- Orders (FK → Customers)
    CREATE TABLE Orders (
        orderID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        customerID INT NOT NULL,
        orderDate DATETIME NOT NULL,
        status ENUM('pending', 'paid', 'shipped', 'canceled', 'refunded') NOT NULL DEFAULT 'pending',
        subtotal DECIMAL(10, 2) NOT NULL,
        tax DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (customerID) REFERENCES Customers(customerID)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );

    -- OrderItems (composite PK, FK → Orders, Listings)
    CREATE TABLE OrderItems (
        orderID INT NOT NULL,
        listingID INT NOT NULL,
        quantity INT NOT NULL,
        unitPrice DECIMAL(10, 2) NOT NULL,
        PRIMARY KEY (orderID, listingID),
        FOREIGN KEY (orderID) REFERENCES Orders(orderID),
        FOREIGN KEY (listingID) REFERENCES Listings(listingID)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );

    INSERT INTO Customers (email, name, phone, shippingAddress)
    VALUES
    ('benardo@example.com', 'Bernardo Mendes', '541-555-0101', '33 Pallet Town, Kanto'),
    ('misty@example.com', 'Misty', '541-555-0102', '44 Cerulean Gym, Kanto'),
    ('brock.s@example.com', 'Brock Harrison', '541-555-0103', '77 Pewter City, Kanto');

    INSERT INTO Cards (setName, cardNumber, name, variant, year)
    VALUES
    ('Base Set', '4/102', 'Charizard', 'Standard', 1999),
    ('Neo Genesis', '60/64', 'Pikachu', 'Standard', 1999),
    ('Evolving Skies', '215/203', 'Rayquaza VMAX', 'FullArt', 2021),
    ('Promo', 'SWSH150', 'Umbreon', 'Promo', 2022);

    INSERT INTO GradingCompanies (companyID, name, gradeScale, url) 
    VALUES
    (1, 'PSA', '10', 'https://www.psacard.com'),
    (2, 'BGS', '10', 'https://www.beckett.com/grading'),
    (3, 'CGC', '100', 'https://www.cgccards.com');

    INSERT INTO Listings (listingID, cardID, price, type, cardCondition, quantityAvailable, status)
    VALUES
    (1, 1, 149.99, 'raw', 'NM', 2, 'active'),
    (2, 2, 12.50, 'raw', 'LP', 5, 'active'),
    (3, 1, 289.00, 'graded', NULL, 1, 'active'),
    (4, 3, 340.00, 'graded', NULL, 1, 'active'),
    (5, 4, 24.99, 'raw', 'NM', 3, 'hidden');

    INSERT INTO GradeSlabs (slabID, companyID, grade)
    VALUES
    (3, 1, 9.0),
    (4, 2, 9.5);

    INSERT INTO Orders (orderID, customerID, orderDate, status, subtotal, tax, total)
    VALUES
    (1001, 1, '2025-10-30 10:15:00', 'paid', 438.99, 0.00, 438.99),
    (1002, 2, '2025-10-30 11:02:00', 'pending', 12.50, 0.00, 12.50),
    (1003, 1, '2025-10-30 12:40:00', 'shipped', 340.00, 0.00, 340.00),
    (1004, 3, '2025-10-30 13:05:00', 'paid', 149.99, 0.00, 149.99);

    INSERT INTO OrderItems (orderID, listingID, quantity, unitPrice)
    VALUES
    (1001, 1, 1, 149.99),
    (1001, 3, 1, 289.00),
    (1002, 2, 1, 12.50),
    (1003, 4, 1, 340.00),
    (1004, 1, 1, 149.99);

END//
DELIMITER ;

