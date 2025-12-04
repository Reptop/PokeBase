-- PokéBase PL/SQL Procedures
-- Group 120
-- Date: 2025-12-02
-- If AI tools were used, cite them here per course policy.

----- Beginning of GradingCompanies CUD -----

--select grading company
DROP PROCEDURE IF EXISTS sp_select_all_grading_company;
DELIMITER //

CREATE PROCEDURE sp_select_all_grading_company ()

BEGIN
    SELECT companyID, name, gradeScale, url
    FROM GradingCompanies
    ORDER BY companyID;
END//

DELIMITER ;

--create grading company
DROP PROCEDURE IF EXISTS sp_create_grading_company;
DELIMITER //

CREATE PROCEDURE sp_create_grading_company (
    IN p_companyID INT,
    IN p_name VARCHAR(32),
    IN p_gradeScale enum('10', '100'),
    IN p_url varchar(255)
)

BEGIN
    INSERT INTO GradingCompanies (name, gradeScale, url)
    VALUES (p_name, p_gradeScale, p_url);
END//

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_delete_grading_company;
DELIMITER //

--delete grading company
CREATE PROCEDURE sp_delete_grading_company (
    IN p_companyID INT
)

BEGIN
    DELETE FROM GradingCompanies
    WHERE companyID = p_companyID;
END//

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_update_grading_company;
DELIMITER //

--update grading company
CREATE PROCEDURE sp_update_grading_company (
    IN p_companyID INT,
    IN p_name VARCHAR(32),
    IN p_gradeScale enum('10', '100'),
    IN p_url varchar(255)
)

BEGIN
    UPDATE GradingCompanies
    SET name = p_name,
        gradeScale = p_gradeScale,
        url = p_url
    WHERE companyID = p_companyID;
END//

DELIMITER ;

----- End of GradingCompanies CUD -----


----- Beginning of Customers CUD -----

--select customers
DROP PROCEDURE IF EXISTS sp_select_all_customers;
DELIMITER //

CREATE PROCEDURE sp_select_all_customers ()

BEGIN
    SELECT customerID, email, name, phone, shippingAddress, totalOrders
    FROM Customers
    ORDER BY customerID;
END//

DELIMITER ;

--create customer
DROP PROCEDURE IF EXISTS sp_create_customer;
DELIMITER //

CREATE PROCEDURE sp_create_customer (
    IN p_email VARCHAR(255),
    IN p_name VARCHAR(200),
    IN p_phone VARCHAR(32),
    IN p_shippingAddress VARCHAR(255)
)

BEGIN
    INSERT INTO Customers (email, name, phone, shippingAddress)
    VALUES (p_email, p_name, p_phone, p_shippingAddress);
END//

DELIMITER ;

--update customer
DROP PROCEDURE IF EXISTS sp_update_customer;
DELIMITER //

CREATE PROCEDURE sp_update_customer (
    IN p_customerID INT,
    IN p_email VARCHAR(255),
    IN p_name VARCHAR(200),
    IN p_phone VARCHAR(32),
    IN p_shippingAddress VARCHAR(255)
)

BEGIN
    UPDATE Customers
    SET email = p_email,
        name = p_name,
        phone = p_phone,
        shippingAddress = p_shippingAddress
    WHERE customerID = p_customerID;
END//

DELIMITER ;

--delete customer
DROP PROCEDURE IF EXISTS sp_delete_customer;
DELIMITER //

CREATE PROCEDURE sp_delete_customer (
    IN p_customerID INT
    )

BEGIN
    DELETE FROM Customers WHERE customerID = p_customerID;
END//

DELIMITER ;

----- End of Customers CUD ----- 



----- Beginning of Cards CUD ----- 

-- insert card
DROP PROCEDURE IF EXISTS sp_insert_card;
DELIMITER //

-- CREATE (INSERT)
CREATE PROCEDURE sp_insert_card (
    IN p_setName    VARCHAR(255),
    IN p_cardNumber VARCHAR(32),
    IN p_name       VARCHAR(255),
    IN p_variant    ENUM('Standard','ReverseHolo','FullArt','AltArt','Promo'),
    IN p_year       SMALLINT
)
BEGIN
    INSERT INTO Cards (setName, cardNumber, name, variant, year)
    VALUES (p_setName, p_cardNumber, p_name, p_variant, p_year);
END//

DELIMITER ;

-- select cards
DROP PROCEDURE IF EXISTS sp_select_all_cards;
DELIMITER //

CREATE PROCEDURE sp_select_all_cards ()
BEGIN
    SELECT cardID, setName, cardNumber, name, variant, year
    FROM Cards
    ORDER BY cardID;
END//

DELIMITER ;

-- select by id
DROP PROCEDURE IF EXISTS sp_select_card_by_id;
DELIMITER //

CREATE PROCEDURE sp_select_card_by_id (
    IN p_cardID INT
)
BEGIN
    SELECT cardID, setName, cardNumber, name, variant, year
    FROM Cards
    WHERE cardID = p_cardID;
END//

DELIMITER ;

-- update card
DROP PROCEDURE IF EXISTS sp_update_card;
DELIMITER //

CREATE PROCEDURE sp_update_card (
    IN p_cardID     INT,
    IN p_setName    VARCHAR(255),
    IN p_cardNumber VARCHAR(32),
    IN p_name       VARCHAR(255),
    IN p_variant    ENUM('Standard','ReverseHolo','FullArt','AltArt','Promo'),
    IN p_year       SMALLINT
)
BEGIN
    UPDATE Cards
    SET setName    = p_setName,
        cardNumber = p_cardNumber,
        name       = p_name,
        variant    = p_variant,
        year       = p_year
    WHERE cardID = p_cardID;
END//

DELIMITER ;

-- delete card
DROP PROCEDURE IF EXISTS sp_delete_card;
DELIMITER //

CREATE PROCEDURE sp_delete_card (
    IN p_cardID INT
)
BEGIN
    DELETE FROM Cards
    WHERE cardID = p_cardID;
END//

DELIMITER ;

----- End of Cards CUD -----  

-- Select graded listings for dropdown

DROP PROCEDURE IF EXISTS sp_select_graded_listings_for_dropdown;
DELIMITER //

CREATE PROCEDURE sp_select_graded_listings_for_dropdown ()
BEGIN
    SELECT
        l.listingID,
        l.cardID,
        gs.slabID,
        gs.grade,
        gc.name       AS companyName,
        gc.gradeScale AS companyScale
    FROM Listings AS l
    JOIN GradeSlabs AS gs
        ON gs.slabID = l.listingID      -- 1-to-1: slabID ↔ listingID
    JOIN GradingCompanies AS gc
        ON gc.companyID = gs.companyID
    WHERE l.type = 'graded'
    ORDER BY l.listingID;
END//

DELIMITER ;


