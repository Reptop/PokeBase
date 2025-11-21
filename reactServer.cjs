const express = require('express');
const path = require('path');
const db = require('./db.cjs');
const app = express();

const PORT = 23325;

app.use(express.json());

// RESET
app.post('/api/reset', async (req, res) => {
  try {
    await db.query('CALL sp_pokebase_reset()');
    res.status(200).json({ ok: true });
  } catch (err) {
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
  } catch (err) {
    console.error('GET grading companies failed:', err);
    res.status(500).json({ error: 'Failed to load grading companies' });
  }
});

// DELETE grading company
app.delete('/api/grading-companies/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.query('CALL sp_delete_grading_company(?)', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE grading company failed:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// static React build
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_, res) =>
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'))
);

app.listen(PORT, () => {
  console.log(`React static + API server: http://classwork.engr.oregonstate.edu:${PORT}`);
});

