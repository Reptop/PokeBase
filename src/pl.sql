-- PokéBase PL/SQL Procedures
-- Group 120
-- Date: 2025-12-02
-- If AI tools were used, cite them here per course policy.

DROP PROCEDURE IF EXISTS sp_delete_grading_company;
DELIMITER //

CREATE PROCEDURE sp_delete_grading_company (
    IN p_companyID INT
)

BEGIN
    DELETE FROM GradingCompanies
    WHERE companyID = p_companyID;
END//
DELIMITER ;

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
