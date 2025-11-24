// reactServer.cjs
const express = require('express');
const path = require('path');
const db = require('./db.cjs');

const app = express();
const PORT = 23327;

app.use(express.json());

// The only routes we have now is for resetting the database and managing grading companies
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

// DELETE grading company → CALL sp_delete_grading_company(?)
app.delete('/api/grading-companies/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.query('CALL sp_delete_grading_company(?)', [id]);
    res.status(204).send();
  }

  catch (err) {
    console.error('DELETE grading company failed:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ----------------- STATIC REACT BUILD -----------------

const distPath = path.join(__dirname, 'dist');

// Serve static assets (JS, CSS, images)
app.use(express.static(distPath));

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    // If we somehow reached here for /api, return an API 404, not index.html
    return res.status(404).json({ error: 'API route not found' });
  }
  return res.sendFile(path.join(distPath, 'index.html'));
});

// ----------------- START SERVER -----------------

app.listen(PORT, () => {
  console.log(
    `React static + API server: http://classwork.engr.oregonstate.edu:${PORT}`
  );
});
