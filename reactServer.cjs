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


// DELETE grading company → CALL sp_delete_grading_company(?)
app.delete('/api/grading-companies/:id', async (req, res) => {
  const id = Number(req.params.id);

  // invalid input check
  if (!Number.isInteger(id))
    return res.status(400).json({ error: 'Invalid companyID' });

  try {
    await db.query('CALL sp_delete_grading_company(?)', [id]);
    res.status(204).send();
  }

  catch (err) {
    console.error('DELETE grading company failed:', err);
    res.status(500).json({ error: 'Delete failed' });
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

// DELETE customer → CALL sp_delete_customer(?)
app.delete('/api/customers/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id))
    return res.status(400).json({ error: 'Invalid customerID' });

  try {
    await db.query('CALL sp_delete_customer(?)', [id]);
    res.status(204).send();
  }

  catch (err) {
    console.error('DELETE customer failed:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
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

// DELETE /api/cards/:id → delete card
app.delete('/api/cards/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid cardID' });
  }

  try {
    await db.query('DELETE FROM Cards WHERE cardID = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/cards/:id failed:', err);
    res.status(500).json({ error: 'Failed to delete card' });
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
