// reactServer.cjs
const express = require('express');
const path = require('path');
const db = require('./db.cjs');

const app = express();
const PORT = 23327;

app.use(express.json());

// ----------------- API ROUTES -----------------

// RESET database → CALL sp_pokebase_reset()
app.post('/api/reset', async (req, res) => {
  try {
    await db.query('CALL sp_pokebase_reset()');
    res.status(200).json({ ok: true });
  }

  catch (err) {
    console.error('RESET failed:', err);
    res.status(500).json({ error: 'Reset failed' });
  }

});

// ================= Helpers =================

async function recalcOrderTotals(orderID) {
  try {
    // Compute subtotal from OrderItems
    const [rows] = await db.query(
      'SELECT COALESCE(SUM(quantity * unitPrice), 0) AS subtotal FROM OrderItems WHERE orderID = ?',
      [orderID]
    );

    const subtotal = Number(rows[0]?.subtotal ?? 0);

    // For now: tax = 0, total = subtotal
    const tax = 0;
    const total = subtotal + tax;

    await db.query(
      'UPDATE Orders SET subtotal = ?, tax = ?, total = ? WHERE orderID = ?',
      [subtotal, tax, total, orderID]
    );

    console.log(
      `Recalculated totals for order ${orderID}: subtotal=${subtotal}, tax=${tax}, total=${total}`
    );
  }

  catch (err) {
    console.error('recalcOrderTotals failed for order', orderID, err);
  }
}

function logDbError(label, err) {
  console.error(label, {
    code: err.code,
    errno: err.errno,
    sqlState: err.sqlState,
    message: err.sqlMessage,
  });
}



// ================= GRADING COMPANIES =================

// READ grading companies
app.get('/api/grading-companies', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT companyID, name, gradeScale, url FROM GradingCompanies ORDER BY companyID'
    );
    res.json(rows);
  }

  catch (err) {
    console.error('GET grading companies failed:', err);
    res.status(500).json({ error: 'Failed to load grading companies' });
  }

});

// UPDATE grading company → CALL sp_update_grading_company(?,?,?)
app.put('/api/grading-companies/:id', async (req, res) => {

  const id = Number(req.params.id);
  const { name, gradeScale, url } = req.body || {};

  // invalid input check
  if (!Number.isInteger(id))
    return res.status(400).json({ error: 'Invalid companyID' });

  if (!name || !gradeScale)
    return res
      .status(400)
      .json({ error: 'name and gradeScale are required to update a grading company' });

  try {
    await db.query('CALL sp_update_grading_company(?,?,?,?)', [
      id,
      name,
      gradeScale,
      url ?? null,
    ]);

    res.status(200).json({ ok: true });
  }

  catch (err) {
    console.error('UPDATE grading company failed:', err);
    res.status(500).json({ error: 'Update failed' });
  }

});

// DELETE /api/grading-companies/:id → delete grading company
app.delete('/api/grading-companies/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: 'Invalid grading company ID' });

  try {
    console.log('DELETE /api/grading-companies/:id → companyID =', id);
    const [result] = await db.query('CALL sp_delete_grading_company(?)', [id]);
    console.log('sp_delete_grading_company result:', JSON.stringify(result));
    return res.status(204).send();
  } catch (err) {
    logDbError('DELETE grading company failed', err);

    // If GradeSlabs (or other tables) still reference this company
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      return res.status(409).json({
        error:
          'Cannot delete grading company because one or more GradeSlabs still reference it. ' +
          'Delete those slabs first or enable ON DELETE CASCADE on GradeSlabs.companyID.',
      });
    }

    return res.status(500).json({ error: 'Failed to delete grading company' });
  }
});



// CREATE grading company → CALL sp_create_grading_company(?,?,?)
app.post('/api/grading-companies', async (req, res) => {
  const { name, gradeScale, url } = req.body || {};

  if (!name || !gradeScale) {
    return res
      .status(400)
      .json({ error: 'name and gradeScale are required to create a grading company' });
  }

  try {
    await db.query('CALL sp_create_grading_company(?,?,?)', [
      name,
      gradeScale,
      url ?? null,
    ]);

    // You can just say "ok" and let the client refetch:
    res.status(201).json({ ok: true });

    // or if you later modify the proc to return LAST_INSERT_ID(),
    // you can send back the new companyID here.
  } catch (err) {
    console.error('CREATE grading company failed:', err);
    res.status(500).json({ error: 'Create failed' });
  }
});


// ================= CUSTOMERS =================

// READ all customers → CALL sp_select_all_customers()
app.get('/api/customers', async (req, res) => {
  try {
    const [resultSets] = await db.query('CALL sp_select_all_customers()');

    // mysql2 returns an array of result sets for CALL:
    // resultSets[0] is the actual row array
    const customers =
      Array.isArray(resultSets) && Array.isArray(resultSets[0])
        ? resultSets[0]
        : resultSets;

    res.json(customers);
  } catch (err) {
    console.error('GET customers failed:', err);
    res.status(500).json({ error: 'Failed to load customers' });
  }
});

// CREATE customer → CALL sp_create_customer(?,?,?,?)
app.post('/api/customers', async (req, res) => {
  const { email, name, phone, shippingAddress } = req.body || {};

  // invalid input check
  if (!email || !name) {
    return res
      .status(400)
      .json({ error: 'email and name are required to create a customer' });
  }

  try {
    await db.query('CALL sp_create_customer(?,?,?,?)', [
      email,
      name,
      phone ?? null,
      shippingAddress ?? null,
    ]);

    // return ok + let the frontend refetch
    res.status(201).json({ ok: true });
  }

  catch (err) {
    console.error('CREATE customer failed:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// UPDATE customer → CALL sp_update_customer(?,?,?,?,?)
app.put('/api/customers/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { email, name, phone, shippingAddress } = req.body || {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid customerID' });
  }

  if (!email || !name) {
    return res
      .status(400)
      .json({ error: 'email and name are required to update a customer' });
  }

  try {
    await db.query('CALL sp_update_customer(?,?,?,?,?)', [
      id,
      email,
      name,
      phone ?? null,
      shippingAddress ?? null,
    ]);

    res.status(200).json({ ok: true });
  }

  catch (err) {
    console.error('UPDATE customer failed:', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id → delete customer
app.delete('/api/customers/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: 'Invalid customer ID' });

  try {
    console.log('DELETE /api/customers/:id → customerID =', id);
    const [result] = await db.query('CALL sp_delete_customer(?)', [id]);
    console.log('sp_delete_customer result:', JSON.stringify(result));
    return res.status(204).send();
  }

  catch (err) {
    logDbError('DELETE customer failed', err);

    // Orders.customerID FK -> Customers.customerID
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      return res.status(409).json({
        error:
          'Cannot delete customer because one or more Orders still reference them. ' +
          'Either delete those orders first or make Orders.customerID ON DELETE CASCADE.',
      });
    }

    return res.status(500).json({ error: 'Failed to delete customer' });
  }
});


// ================= CARDS =================

// GET /api/cards → list all cards
app.get('/api/cards', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT cardID, setName, cardNumber, name, variant, year FROM Cards ORDER BY cardID'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/cards failed:', err);
    res.status(500).json({ error: 'Failed to load cards' });
  }
});

// POST /api/cards → create card
app.post('/api/cards', async (req, res) => {
  const { setName, cardNumber, name, variant, year } = req.body || {};

  // basic validation: required fields
  if (!setName || !cardNumber || !name || !variant) {
    return res.status(400).json({
      error: 'setName, cardNumber, name, and variant are required to create a card',
    });
  }

  // normalize year: allow null
  const yearValue =
    year === null || year === undefined || year === ''
      ? null
      : Number(year);

  try {
    await db.query(
      'INSERT INTO Cards (setName, cardNumber, name, variant, year) VALUES (?,?,?,?,?)',
      [setName, cardNumber, name, variant, yearValue]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /api/cards failed:', err);
    res.status(500).json({ error: 'Failed to create card' });
  }
});

// PUT /api/cards/:id → update card
app.put('/api/cards/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { setName, cardNumber, name, variant, year } = req.body || {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid cardID' });
  }

  if (!setName || !cardNumber || !name || !variant) {
    return res.status(400).json({
      error: 'setName, cardNumber, name, and variant are required to update a card',
    });
  }

  const yearValue =
    year === null || year === undefined || year === ''
      ? null
      : Number(year);

  try {
    await db.query(
      'UPDATE Cards SET setName = ?, cardNumber = ?, name = ?, variant = ?, year = ? WHERE cardID = ?',
      [setName, cardNumber, name, variant, yearValue, id]
    );

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('PUT /api/cards/:id failed:', err);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// DELETE /api/cards/:id → delete a card AND children via CASCADE
app.delete('/api/cards/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid card ID' });
  }

  try {
    console.log('DELETE /api/cards/:id → attempting delete for cardID =', id);

    // Use your stored procedure
    const [result] = await db.query('CALL sp_delete_card(?)', [id]);
    console.log('sp_delete_card result:', JSON.stringify(result));

    // Even if no row matched, 204 is fine (idempotent delete)
    return res.status(204).send();
  }

  catch (err) {
    console.error('DELETE /api/cards/:id failed:', {
      code: err.code,
      errno: err.errno,
      message: err.sqlMessage,
      sqlState: err.sqlState,
    });

    // Common MySQL FK error when a row is still referenced
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      return res.status(409).json({
        error:
          'Cannot delete card because related Listings / OrderItems / GradeSlabs still reference it. ' +
          'Either delete those first or ensure ON DELETE CASCADE is enabled.',
      });
    }

    return res.status(500).json({ error: 'Failed to delete card' });
  }
});

// ================= Listings =================

// GET /api/listings → list all listings
app.get('/api/listings', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT listingID, cardID, price, type, cardCondition, quantityAvailable, status FROM Listings ORDER BY listingID'
    );
    res.json(rows);
  }

  catch (err) {
    console.error('GET /api/listings failed:', err);
    res.status(500).json({ error: 'Failed to load listings' });
  }
});

// POST /api/listings → create listing
app.post('/api/listings', async (req, res) => {
  const {
    cardID,
    price,
    type,
    cardCondition,
    quantityAvailable,
    status,
  } = req.body || {};

  // Normalize / coerce
  const cardIdNum = Number(cardID);
  const priceNum = Number(price);
  const qtyNum = Number(quantityAvailable);
  const statusValue = status ?? 'active'; // default
  const conditionValue = cardCondition ?? null; // allow null

  // Basic validation: required fields
  if (!Number.isInteger(cardIdNum) || cardIdNum <= 0)
    return res.status(400).json({ error: 'Valid cardID is required' });

  if (!Number.isFinite(priceNum) || priceNum <= 0)
    return res.status(400).json({ error: 'Valid price is required' });

  if (type !== 'raw' && type !== 'graded')
    return res.status(400).json({ error: "type must be 'raw' or 'graded'" });

  if (!Number.isInteger(qtyNum) || qtyNum < 0) {
    return res
      .status(400)
      .json({ error: 'quantityAvailable must be a non-negative integer' });
  }

  const validStatuses = ['active', 'sold_out', 'hidden'];
  if (statusValue && !validStatuses.includes(statusValue)) {
    return res.status(400).json({
      error: `status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    await db.query(
      `INSERT INTO Listings
        (cardID, price, type, cardCondition, quantityAvailable, status)
       VALUES (?,?,?,?,?,?)`,
      [cardIdNum, priceNum, type, conditionValue, qtyNum, statusValue]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /api/listings failed:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// PUT /api/listings/:id → update listing
app.put('/api/listings/:id', async (req, res) => {
  const id = Number(req.params.id);
  const {
    cardID,
    price,
    type,
    cardCondition,
    quantityAvailable,
    status,
  } = req.body || {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid listingID' });
  }

  const cardIdNum = Number(cardID);
  const priceNum = Number(price);
  const qtyNum = Number(quantityAvailable);
  const statusValue = status ?? 'active';
  const conditionValue = cardCondition ?? null;

  // ----- validation -----
  if (!Number.isInteger(cardIdNum) || cardIdNum <= 0) {
    return res.status(400).json({ error: 'Valid cardID is required' });
  }

  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return res.status(400).json({ error: 'Valid price is required' });
  }

  if (type !== 'raw' && type !== 'graded') {
    return res.status(400).json({ error: "type must be 'raw' or 'graded'" });
  }

  if (!Number.isInteger(qtyNum) || qtyNum < 0) {
    return res
      .status(400)
      .json({ error: 'quantityAvailable must be a non-negative integer' });
  }

  const validStatuses = ['active', 'sold_out', 'hidden'];
  if (statusValue && !validStatuses.includes(statusValue)) {
    return res.status(400).json({
      error: `status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    await db.query(
      `UPDATE Listings
       SET cardID = ?,
           price = ?,
           type = ?,
           cardCondition = ?,
           quantityAvailable = ?,
           status = ?
       WHERE listingID = ?`,
      [cardIdNum, priceNum, type, conditionValue, qtyNum, statusValue, id]
    );

    res.status(200).json({ ok: true });
  }

  catch (err) {
    console.error('PUT /api/listings/:id failed:', err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});


// DELETE /api/listings/:id → delete listing
app.delete('/api/listings/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid listingID' });
  }

  try {
    console.log('DELETE /api/listings/:id → listingID =', id);
    const [result] = await db.query(
      'DELETE FROM Listings WHERE listingID = ?',
      [id]
    );
    console.log('DELETE FROM Listings result:', JSON.stringify(result));
    return res.status(204).send();
  } catch (err) {
    logDbError('DELETE listing failed', err);

    // If something else references Listings.listingID without CASCADE
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      return res.status(409).json({
        error:
          'Cannot delete listing because other records still reference it (e.g., OrderItems or GradeSlabs). ' +
          'Ensure those FKs use ON DELETE CASCADE or delete children first.',
      });
    }

    return res.status(500).json({ error: 'Failed to delete listing' });
  }
});


// ================= GRADE SLABS =================

// GET /api/grade-slabs/for-dropdown -> list graded listings for dropdown
app.get('/api/grade-slabs/for-dropdown', async (req, res) => {
  try {
    const [resultSets] = await db.query(
      'CALL sp_select_graded_listings_for_dropdown()'
    );
    const rows = unwrapCallResult(resultSets);
    res.json(rows);
  } catch (err) {
    logDbError('GET /api/grade-slabs/for-dropdown failed', err);
    res.status(500).json({ error: 'Failed to load graded listings' });
  }
});

// ================= ORDER ITEMS =================

// helper to unwrap CALL results (since CALL returns [ [rows], extra ])
function unwrapCallResult(resultSets) {
  if (Array.isArray(resultSets) && Array.isArray(resultSets[0])) {
    return resultSets[0];
  }
  return resultSets;
}

// GET /api/order-items → list all order items
app.get('/api/order-items', async (req, res) => {
  try {
    const [resultSets] = await db.query('CALL sp_select_all_order_items()');
    const rows = unwrapCallResult(resultSets);
    res.json(rows);
  }

  catch (err) {
    console.error('GET /api/order-items failed:', err);
    res.status(500).json({ error: 'Failed to load order items' });
  }
});

// GET /api/order-items/:orderID/:listingID → get one order item
app.get('/api/order-items/:orderID/:listingID', async (req, res) => {
  const orderID = Number(req.params.orderID);
  const listingID = Number(req.params.listingID);

  if (!Number.isInteger(orderID) || orderID <= 0 ||
    !Number.isInteger(listingID) || listingID <= 0) {
    return res.status(400).json({ error: 'Invalid orderID or listingID' });
  }

  try {
    const [resultSets] = await db.query(
      'CALL sp_select_order_item(?, ?)',
      [orderID, listingID]
    );
    const rows = unwrapCallResult(resultSets);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/order-items/:orderID/:listingID failed:', err);
    res.status(500).json({ error: 'Failed to load order item' });
  }
});

// POST /api/order-items → create new order item
app.post('/api/order-items', async (req, res) => {
  const { orderID, listingID, quantity, unitPrice } = req.body || {};

  const orderIdNum = Number(orderID);
  const listingIdNum = Number(listingID);
  const qtyNum = Number(quantity);
  const priceNum = Number(unitPrice);

  // Basic validation
  if (!Number.isInteger(orderIdNum) || orderIdNum <= 0) {
    return res.status(400).json({ error: 'Valid orderID is required' });
  }

  if (!Number.isInteger(listingIdNum) || listingIdNum <= 0) {
    return res.status(400).json({ error: 'Valid listingID is required' });
  }

  if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
    return res
      .status(400)
      .json({ error: 'quantity must be a positive integer' });
  }

  if (!Number.isFinite(priceNum) || priceNum < 0) {
    return res
      .status(400)
      .json({ error: 'unitPrice must be a non-negative number' });
  }

  try {
    await db.query(
      'CALL sp_insert_order_item(?, ?, ?, ?)',
      [orderIdNum, listingIdNum, qtyNum, priceNum]
    );

    // Recalculate order totals
    await recalcOrderTotals(orderIdNum);

    res.status(201).json({
      ok: true,
      orderID: orderIdNum,
      listingID: listingIdNum,
    });
  }

  catch (err) {
    console.error('POST /api/order-items failed:', err);

    // FK failures: invalid orderID or listingID
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
      return res.status(409).json({
        error:
          'orderID or listingID does not exist (foreign key constraint).',
      });
    }

    res.status(500).json({ error: 'Failed to create order item' });
  }
});

// PUT /api/order-items/:orderID/:listingID → update existing order item
app.put('/api/order-items/:orderID/:listingID', async (req, res) => {
  const orderID = Number(req.params.orderID);
  const listingID = Number(req.params.listingID);
  const { quantity, unitPrice } = req.body || {};

  if (!Number.isInteger(orderID) || orderID <= 0 ||
    !Number.isInteger(listingID) || listingID <= 0) {
    return res.status(400).json({ error: 'Invalid orderID or listingID' });
  }

  const qtyNum = Number(quantity);
  const priceNum = Number(unitPrice);

  if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
    return res
      .status(400)
      .json({ error: 'quantity must be a positive integer' });
  }

  if (!Number.isFinite(priceNum) || priceNum < 0) {
    return res
      .status(400)
      .json({ error: 'unitPrice must be a non-negative number' });
  }

  try {
    await db.query(
      'CALL sp_update_order_item(?, ?, ?, ?)',
      [orderID, listingID, qtyNum, priceNum]
    );

    // Recalculate order totals
    await recalcOrderTotals(orderID);

    res.status(200).json({ ok: true });
  }

  catch (err) {
    console.error('PUT /api/order-items/:orderID/:listingID failed:', err);
    res.status(500).json({ error: 'Failed to update order item' });
  }
});

// DELETE /api/order-items/:orderID/:listingID → delete order item
app.delete('/api/order-items/:orderID/:listingID', async (req, res) => {
  const orderID = Number(req.params.orderID);
  const listingID = Number(req.params.listingID);

  if (!Number.isInteger(orderID) || orderID <= 0 ||
    !Number.isInteger(listingID) || listingID <= 0) {
    return res.status(400).json({ error: 'Invalid orderID or listingID' });
  }

  try {
    console.log(
      'DELETE /api/order-items/:orderID/:listingID →',
      { orderID, listingID }
    );
    const [result] = await db.query(
      'CALL sp_delete_order_item(?, ?)',
      [orderID, listingID]
    );

    await recalcOrderTotals(orderID);

    console.log('sp_delete_order_item result:', JSON.stringify(result));
    return res.status(204).send();
  }

  catch (err) {
    logDbError('DELETE order item failed', err);
    return res.status(500).json({ error: 'Failed to delete order item' });
  }
});


// ================= ORDERS =================

// GET /api/orders → list all orders
app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         orderID,
         customerID,
         orderDate,
         status,
         subtotal,
         tax,
         total
       FROM Orders
       ORDER BY orderID`
    );
    res.json(rows);
  }

  catch (err) {
    console.error('GET /api/orders failed:', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

// Helper: normalize/validate an order payload
function normalizeOrderBody(body) {
  const {
    customerID,
    orderDate,
    status,
    subtotal,
    tax,
    total,
  } = body || {};

  const customerIdNum = Number(customerID);
  const subtotalNum = Number(subtotal);
  const taxNum = Number(tax);
  const totalNum = Number(total);

  const validStatuses = ['pending', 'paid', 'shipped', 'canceled', 'refunded'];

  if (!Number.isInteger(customerIdNum) || customerIdNum <= 0) {
    return { error: 'Valid customerID is required' };
  }

  if (!validStatuses.includes(status)) {
    return {
      error: `status must be one of: ${validStatuses.join(', ')}`,
    };
  }

  if (!Number.isFinite(subtotalNum) || subtotalNum < 0) {
    return { error: 'subtotal must be a non-negative number' };
  }

  if (!Number.isFinite(taxNum) || taxNum < 0) {
    return { error: 'tax must be a non-negative number' };
  }

  if (!Number.isFinite(totalNum) || totalNum < 0) {
    return { error: 'total must be a non-negative number' };
  }

  // orderDate: if missing, default to "now" in MySQL DATETIME format
  const orderDateValue =
    orderDate && typeof orderDate === 'string'
      ? orderDate
      : new Date().toISOString().slice(0, 19).replace('T', ' ');

  return {
    customerIdNum,
    orderDateValue,
    status,
    subtotalNum,
    taxNum,
    totalNum,
  };
}

// POST /api/orders → create new order (uses sp_insert_order)
app.post('/api/orders', async (req, res) => {
  const normalized = normalizeOrderBody(req.body);

  if ('error' in normalized)
    return res.status(400).json({ error: normalized.error });

  const {
    customerIdNum,
    orderDateValue,
    status,
    subtotalNum,
    taxNum,
    totalNum,
  } = normalized;

  try {
    await db.query('CALL sp_insert_order(?,?,?,?,?,?)', [
      customerIdNum,
      orderDateValue,
      status,
      subtotalNum,
      taxNum,
      totalNum,
    ]);

    // We’re not using insertId here; frontend can just refetch /api/orders
    res.status(201).json({ ok: true });
  }

  catch (err) {
    console.error('POST /api/orders failed:', err);

    // Foreign-key failure for customerID
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
      return res.status(409).json({
        error: 'customerID does not exist (foreign key constraint).',
      });
    }

    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/orders/:id → update existing order (uses sp_update_order)
app.put('/api/orders/:id', async (req, res) => {
  const orderID = Number(req.params.id);

  if (!Number.isInteger(orderID) || orderID <= 0)
    return res.status(400).json({ error: 'Invalid orderID' });

  const normalized = normalizeOrderBody(req.body);

  if ('error' in normalized)
    return res.status(400).json({ error: normalized.error });

  const {
    customerIdNum,
    orderDateValue,
    status,
    subtotalNum,
    taxNum,
    totalNum,
  } = normalized;

  try {
    await db.query('CALL sp_update_order(?,?,?,?,?,?,?)', [
      orderID,
      customerIdNum,
      orderDateValue,
      status,
      subtotalNum,
      taxNum,
      totalNum,
    ]);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('PUT /api/orders/:id failed:', err);

    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
      return res.status(409).json({
        error: 'customerID does not exist (foreign key constraint).',
      });
    }

    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE /api/orders/:id → delete order
app.delete('/api/orders/:id', async (req, res) => {
  const orderID = Number(req.params.id);

  if (!Number.isInteger(orderID) || orderID <= 0)
    return res.status(400).json({ error: 'Invalid orderID' });

  try {
    console.log('DELETE /api/orders/:id → orderID =', orderID);
    const [result] = await db.query('CALL sp_delete_order(?)', [orderID]);
    console.log('sp_delete_order result:', JSON.stringify(result));
    return res.status(204).send();
  } catch (err) {
    logDbError('DELETE order failed', err);

    // If OrderItems.orderID FK isn’t ON DELETE CASCADE
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      return res.status(409).json({
        error:
          'Cannot delete order because one or more OrderItems still reference it. ' +
          'Either delete those order items first or use ON DELETE CASCADE on OrderItems.orderID.',
      });
    }

    return res.status(500).json({ error: 'Failed to delete order' });
  }
});


// ----------------- STATIC REACT BUILD -----------------

const distPath = path.join(__dirname, 'dist');

// Serve static assets (JS, CSS, images)
app.use(express.static(distPath));

app.use((req, res) => {

  // if we somehow reach here, return a 404
  if (req.path.startsWith('/api'))
    return res.status(404).json({ error: 'API route not found' });


  return res.sendFile(path.join(distPath, 'index.html'));
});

// ----------------- START SERVER -----------------

app.listen(PORT, () => {
  console.log(
    `React static + API server: http://classwork.engr.oregonstate.edu:${PORT}`
  );
});
