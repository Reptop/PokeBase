-- PokéBase PL/SQL Procedures
-- Group 120
-- Date: 2025-11-20
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

