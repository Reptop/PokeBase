import { useEffect, useMemo, useState, useCallback } from 'react';
import Table from '../components/Table';
import FormField from '../components/FormField';
import type { Card } from '../types';

type CardForm = Omit<Card, 'cardID'>;

export default function Cards() {
  const [rows, setRows] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<CardForm>({
    setName: '',
    cardNumber: '',
    name: '',
    variant: 'Standard',
    year: null,
  });

  // ---------- LOAD ROWS FROM /api/cards ----------

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cards');
      if (!res.ok) {
        console.error('Failed to load cards', await res.text());
        return;
      }
      const data: Card[] = await res.json();
      setRows(data);
    } catch (err) {
      console.error('Error fetching cards', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---------- EDIT / FORM HELPERS ----------

  function beginEdit(c: Card) {
    setEditing(c.cardID);
    setForm({
      setName: c.setName,
      cardNumber: c.cardNumber,
      name: c.name,
      variant: c.variant,
      year: c.year,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditing(null);
    setForm({
      setName: '',
      cardNumber: '',
      name: '',
      variant: 'Standard',
      year: null,
    });
  }

  // ---------- CREATE / UPDATE ----------

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: CardForm = {
      ...form,
      year:
        form.year === null || form.year === undefined || form.year === ''
          ? null
          : Number(form.year),
    };

    try {
      if (editing !== null) {
        // UPDATE: PUT /api/cards/:id
        const res = await fetch(`/api/cards/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error('Update card failed', await res.text());
          alert('Update failed – check server logs.');
          return;
        }
      } else {
        // CREATE: POST /api/cards
        const res = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error('Create card failed', await res.text());
          alert('Create failed – check server logs.');
          return;
        }
      }

      resetForm();
      await refresh();
    } catch (err) {
      console.error('Submit error (cards)', err);
      alert('Unexpected error – check console/server logs.');
    }
  }

  // ---------- DELETE ----------

  async function onDelete(cardID: number) {
    if (!confirm(`Delete card #${cardID}?`)) return;

    try {
      const res = await fetch(`/api/cards/${cardID}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Delete card failed', await res.text());
        alert('Delete failed – check server logs.');
        return;
      }

      await refresh();
    }

    catch (err) {
      console.error('Delete error (cards)', err);
      alert('Unexpected error – check console/server logs.');
    }
  }

  // ---------- TABLE COLUMNS ----------

  const cols = useMemo(
    () => [
      { key: 'cardID', header: 'ID' },
      { key: 'setName', header: 'Set' },
      { key: 'cardNumber', header: 'Number' },
      { key: 'name', header: 'Name' },
      { key: 'variant', header: 'Variant' },
      { key: 'year', header: 'Year' },
      {
        key: 'actions',
        header: 'Actions',
        render: (c: Card) => (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-invert btn-xs"
              onClick={() => beginEdit(c)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger btn-xs"
              onClick={() => onDelete(c.cardID)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // ---------- RENDER ----------

  return (
    <section className="space-y-6">
      <header>
        <h1 className="section-title">Cards</h1>
        <p className="section-subtitle">
          Browse, add, update, and delete card records.
        </p>
      </header>

      {/* Form */}
      <form onSubmit={onSubmit} className="card space-y-3">
        <h2 className="text-lg font-semibold text-neutral-100">
          {editing ? `Update Card #${editing}` : 'Add New Card'}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Set Name">
            <input
              required
              type="text"
              value={form.setName}
              onChange={e =>
                setForm(f => ({ ...f, setName: e.target.value }))
              }
              className="input"
            />
          </FormField>

          <FormField label="Card Number">
            <input
              required
              type="text"
              value={form.cardNumber}
              onChange={e =>
                setForm(f => ({ ...f, cardNumber: e.target.value }))
              }
              className="input"
            />
          </FormField>

          <FormField label="Card Name">
            <input
              required
              type="text"
              value={form.name}
              onChange={e =>
                setForm(f => ({ ...f, name: e.target.value }))
              }
              className="input"
            />
          </FormField>

          <FormField label="Variant">
            <select
              value={form.variant}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  variant: e.target.value as Card['variant'],
                }))
              }
              className="input"
            >
              <option value="Standard">Standard</option>
              <option value="ReverseHolo">ReverseHolo</option>
              <option value="FullArt">FullArt</option>
              <option value="AltArt">AltArt</option>
              <option value="Promo">Promo</option>
            </select>
          </FormField>

          <FormField label="Year (optional)">
            <input
              type="number"
              min={1900}
              max={2100}
              value={form.year ?? ''}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  year: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
              className="input"
            />
          </FormField>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-neutral" type="submit">
            {editing ? 'Update' : 'Add'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-outline"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-100">Browse Cards</h2>
        {loading ? (
          <div className="card">
            <p className="text-neutral-300">Loading…</p>
          </div>
        ) : (
          <div className="card">
            <Table<Card> keyField="cardID" columns={cols as any} rows={rows} />
          </div>
        )}
      </div>
    </section>
  );
}

