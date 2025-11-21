-- dml.sql

/******************************************************************
 * CUSTOMERS
 ******************************************************************/

-- Browse customers (optional search by email/name)
SELECT customerID, email, name, phone, shippingAddress, totalOrders
FROM Customers
WHERE
    (@emailSearch IS NULL OR email LIKE CONCAT('%', @emailSearch, '%')) AND
    (@nameSearch  IS NULL OR name  LIKE CONCAT('%', @nameSearch,  '%'))
ORDER BY customerID
LIMIT @limit OFFSET @offset;

-- Get one customer
SELECT customerID, email, name, phone, shippingAddress, totalOrders
FROM Customers
WHERE customerID = @customerID;

-- Insert customer
INSERT INTO Customers (email, name, phone, shippingAddress, totalOrders)
VALUES (@email, @name, @phone, @shippingAddress, @totalOrders);

-- Update customer
UPDATE Customers
SET email           = @email,
    name            = @name,
    phone           = @phone,
    shippingAddress = @shippingAddress,
    totalOrders     = @totalOrders
WHERE customerID    = @customerID;

-- Delete customer
DELETE FROM Customers
WHERE customerID = @customerID;


/******************************************************************
 * CARDS
 ******************************************************************/

-- Browse cards
SELECT cardID, setName, cardNumber, name, variant, year
FROM Cards
ORDER BY cardID
LIMIT @limit OFFSET @offset;

-- Get one card
SELECT cardID, setName, cardNumber, name, variant, year
FROM Cards
WHERE cardID = @cardID;

-- Insert card
INSERT INTO Cards (setName, cardNumber, name, variant, year)
VALUES (@setName, @cardNumber, @name, @variant, @year);

-- Update card
UPDATE Cards
SET setName    = @setName,
    cardNumber = @cardNumber,
    name       = @name,
    variant    = @variant,
    year       = @year
WHERE cardID   = @cardID;

-- Delete card
DELETE FROM Cards
WHERE cardID = @cardID;


/******************************************************************
 * GRADING COMPANIES
 ******************************************************************/

-- Browse grading companies
SELECT companyID, name, gradeScale, url
FROM GradingCompanies
ORDER BY companyID
LIMIT @limit OFFSET @offset;

-- Get one grading company
SELECT companyID, name, gradeScale, url
FROM GradingCompanies
WHERE companyID = @companyID;

-- Insert grading company
INSERT INTO GradingCompanies (name, gradeScale, url)
VALUES (@name, @gradeScale, @url);

-- Update grading company
UPDATE GradingCompanies
SET name       = @name,
    gradeScale = @gradeScale,
    url        = @url
WHERE companyID = @companyID;

-- Delete grading company
DELETE FROM GradingCompanies
WHERE companyID = @companyID;


/******************************************************************
 * LISTINGS (raw + graded; graded may have a GradeSlabs row)
 ******************************************************************/

-- Browse listings with card info
SELECT
  L.listingID, L.cardID,
  C.name AS cardName, C.setName, C.cardNumber, C.variant, C.year,
  L.price, L.type, L.cardCondition, L.quantityAvailable, L.status
FROM Listings AS L
JOIN Cards    AS C ON C.cardID = L.cardID
ORDER BY L.listingID
LIMIT @limit OFFSET @offset;

-- Browse graded listings with slab detail
SELECT
  L.listingID, L.cardID,
  C.name AS cardName, C.setName,
  L.price, L.status,
  G.companyID,
  GC.name       AS companyName,
  GC.gradeScale,
  G.grade
FROM Listings         AS L
JOIN GradeSlabs       AS G  ON G.slabID     = L.listingID
JOIN GradingCompanies AS GC ON GC.companyID = G.companyID
JOIN Cards            AS C  ON C.cardID     = L.cardID
WHERE L.type = 'graded'
  AND (@companyID IS NULL OR GC.companyID = @companyID)
ORDER BY L.listingID
LIMIT @limit OFFSET @offset;

-- Get one listing
SELECT listingID, cardID, price, type, cardCondition, quantityAvailable, status
FROM Listings
WHERE listingID = @listingID;

-- Insert listing (RAW)
INSERT INTO Listings (cardID, price, type, cardCondition, quantityAvailable, status)
VALUES (@cardID, @price, 'raw', @cardCondition, @quantityAvailable, @status);

-- Insert listing (GRADED; cardCondition = NULL)
INSERT INTO Listings (cardID, price, type, cardCondition, quantityAvailable, status)
VALUES (@cardID, @price, 'graded', NULL, @quantityAvailable, @status);

-- Update listing (generic)
UPDATE Listings
SET cardID           = @cardID,
    price            = @price,
    type             = @type,           -- 'raw' or 'graded'
    cardCondition    = @cardCondition,  -- pass NULL for graded
    quantityAvailable = @quantityAvailable,
    status           = @status
WHERE listingID      = @listingID;

-- Delete listing
DELETE FROM Listings
WHERE listingID = @listingID;


/******************************************************************
 * GRADE SLABS (1:1 with graded Listing via slabID = listingID)
 ******************************************************************/

-- Get slab by listing
SELECT
  G.slabID,
  G.companyID,
  GC.name       AS companyName,
  GC.gradeScale,
  G.grade
FROM GradeSlabs       AS G
JOIN GradingCompanies AS GC ON GC.companyID = G.companyID
WHERE G.slabID = @listingID;

-- Insert slab for a graded listing
INSERT INTO GradeSlabs (slabID, companyID, grade)
VALUES (@listingID, @companyID, @grade);

-- Update slab
UPDATE GradeSlabs
SET companyID = @companyID,
    grade     = @grade
WHERE slabID  = @listingID;

-- Delete slab
DELETE FROM GradeSlabs
WHERE slabID = @listingID;


/******************************************************************
 * ORDERS
 ******************************************************************/

-- Browse orders with customer name and totals
SELECT
  O.orderID,
  O.customerID,
  C.name AS customerName,
  O.orderDate,
  O.status,
  O.subtotal,
  O.tax,
  O.total
FROM Orders    AS O
JOIN Customers AS C ON C.customerID = O.customerID
ORDER BY O.orderDate DESC, O.orderID DESC
LIMIT @limit OFFSET @offset;

-- Get one order
SELECT orderID, customerID, orderDate, status, subtotal, tax, total
FROM Orders
WHERE orderID = @orderID;

-- Insert order
INSERT INTO Orders (customerID, orderDate, status, subtotal, tax, total)
VALUES (@customerID, @orderDate, @status, @subtotal, @tax, @total);

-- Update order header
UPDATE Orders
SET customerID = @customerID,
    orderDate  = @orderDate,
    status     = @status,
    subtotal   = @subtotal,
    tax        = @tax,
    total      = @total
WHERE orderID  = @orderID;

-- Delete order
DELETE FROM Orders
WHERE orderID = @orderID;


/******************************************************************
 * ORDER ITEMS (composite PK: orderID, listingID)
 ******************************************************************/

-- Browse items in an order (with listing + card info)
SELECT
  OI.orderID,
  OI.listingID,
  OI.quantity,
  OI.unitPrice,
  L.price        AS currentListingPrice,
  L.status       AS listingStatus,
  C.name         AS cardName,
  C.setName,
  C.cardNumber,
  L.type,
  L.cardCondition
FROM OrderItems AS OI
JOIN Listings   AS L ON L.listingID = OI.listingID
JOIN Cards      AS C ON C.cardID    = L.cardID
WHERE OI.orderID = @orderID
ORDER BY OI.listingID;

-- Insert order item
INSERT INTO OrderItems (orderID, listingID, quantity, unitPrice)
VALUES (@orderID, @listingID, @quantity, @unitPrice);

-- Update order item
UPDATE OrderItems
SET quantity  = @quantity,
    unitPrice = @unitPrice
WHERE orderID  = @orderID
  AND listingID = @listingID;

-- Delete one order item
DELETE FROM OrderItems
WHERE orderID  = @orderID
  AND listingID = @listingID;

-- Delete all items for an order
DELETE FROM OrderItems

