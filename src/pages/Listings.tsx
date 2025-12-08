import { useEffect, useMemo, useState, useCallback } from 'react';
import Table from '../components/Table';
import FormField from '../components/FormField';
import type { Card, Listing, GradingCompany, GradeSlab } from '../types';

// Listing row with joined Card info
type Row = Listing & {
  card?: Card | null;
};

// Form values
type FormState = {
  cardID: number | '';
  price: number | '';
  type: Listing['type'];
  cardCondition: Listing['cardCondition'];
  quantityAvailable: number | '';
  status: Listing['status'];
  companyID: number | '';
  grade: number | '';
};

export default function Listings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [companies, setCompanies] = useState<GradingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);

  const [form, setForm] = useState<FormState>({
    cardID: '',
    price: '',
    type: 'raw',
    cardCondition: 'NM',
    quantityAvailable: 1,
    status: 'active',
    companyID: '',
    grade: '',
  });

  // ---------- LOAD LISTINGS + CARDS + COMPANIES ----------

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [listingsRes, cardsRes, companiesRes] = await Promise.all([
        fetch('/api/listings'),
        fetch('/api/cards'),
        fetch('/api/grading-companies'),
      ]);

      if (!listingsRes.ok) {
        console.error('Failed to load listings', await listingsRes.text());
        return;
      }
      if (!cardsRes.ok) {
        console.error('Failed to load cards', await cardsRes.text());
        return;
      }
      if (!companiesRes.ok) {
        console.error('Failed to load grading companies', await companiesRes.text());
        return;
      }

      const listings: Listing[] = await listingsRes.json();
      const cardsData: Card[] = await cardsRes.json();
      const companiesData: GradingCompany[] = await companiesRes.json();

      // Join card info onto each listing for display
      const joined: Row[] = listings.map(l => ({
        ...l,
        card: cardsData.find(c => c.cardID === l.cardID) ?? null,
      }));

      setRows(joined);
      setCards(cardsData);
      setCompanies(companiesData);
    } catch (err) {
      console.error('Error refreshing listings page', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---------- SLAB HELPERS (graded listings) ----------

  async function loadSlabForListing(listingID: number) {
    try {
      const res = await fetch(`/api/listings/${listingID}/slab`);
      if (res.status === 404) {
        // No slab
        setForm(f => ({ ...f, companyID: '', grade: '' }));
        return;
      }
      if (!res.ok) {
        console.error('Failed to load slab', await res.text());
        return;
      }
      const slab: GradeSlab = await res.json();
      setForm(f => ({
        ...f,
        companyID: slab.companyID,
        grade: slab.grade,
      }));
    } catch (err) {
      console.error('Error loading slab', err);
    }
  }

  async function upsertSlabForListing(listingID: number, companyID: number, grade: number) {
    try {
      const res = await fetch(`/api/listings/${listingID}/slab`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyID, grade }),
      });
      if (!res.ok) {
        console.error('Failed to upsert slab', await res.text());
      }
    } catch (err) {
      console.error('Error upserting slab', err);
    }
  }

  async function deleteSlabForListing(listingID: number) {
    try {
      const res = await fetch(`/api/listings/${listingID}/slab`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 404) {
        console.error('Failed to delete slab', await res.text());
      }
    } catch (err) {
      console.error('Error deleting slab', err);
    }
  }

  // ---------- EDIT / FORM HELPERS ----------

  function beginEdit(row: Row) {
    setEditing(row.listingID);
    setForm(f => ({
      ...f,
      cardID: row.cardID,
      price: row.price,
      type: row.type,
      cardCondition: row.cardCondition,
      quantityAvailable: row.quantityAvailable,
      status: row.status,
      companyID: '',
      grade: '',
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (row.type === 'graded') {
      loadSlabForListing(row.listingID);
    }
  }

  function resetForm() {
    setEditing(null);
    setForm({
      cardID: '',
      price: '',
      type: 'raw',
      cardCondition: 'NM',
      quantityAvailable: 1,
      status: 'active',
      companyID: '',
      grade: '',
    });
  }

  // ---------- CREATE / UPDATE SUBMIT ----------

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.cardID === '' || form.price === '' || form.quantityAvailable === '')
      return;

    const payload: Omit<Listing, 'listingID'> = {
      cardID: Number(form.cardID),
      price: Number(form.price),
      type: form.type,
      cardCondition: form.type === 'graded' ? null : form.cardCondition,
      quantityAvailable: Number(form.quantityAvailable),
      status: form.status,
    };

    if (form.type === 'graded') {
      if (form.companyID === '' || form.grade === '') {
        alert('Please select grading company and grade for graded listings.');
        return;
      }
    }

    let listingID = editing ?? null;

    try {
      if (editing !== null) {
        // UPDATE
        const res = await fetch(`/api/listings/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error('Update listing failed', await res.text());
          alert('Update failed – check server logs.');
          return;
        }
      } else {
        // CREATE
        const res = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error('Create listing failed', await res.text());
          alert('Create failed – check server logs.');
          return;
        }

        // Expect backend to return { listingID: number }
        const created = (await res.json()) as { listingID: number };
        listingID = created.listingID;
      }

      // Handle GradeSlab
      if (listingID !== null) {
        if (form.type === 'graded') {
          await upsertSlabForListing(listingID, Number(form.companyID), Number(form.grade));
        } else {
          await deleteSlabForListing(listingID);
        }
      }

      resetForm();
      await refresh();
    } catch (err) {
      console.error('Submit error (listings)', err);
      alert('Unexpected error – check console/server logs.');
    }
  }

  // ---------- DELETE LISTING ----------

  async function onDelete(listingID: number) {
    if (!confirm(`Delete listing #${listingID}?`)) return;

    try {
      const res = await fetch(`/api/listings/${listingID}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Delete listing failed', await res.text());
        alert('Delete failed – check server logs.');
        return;
      }

      await refresh();
    } catch (err) {
      console.error('Delete error (listings)', err);
      alert('Unexpected error – check console/server logs.');
    }
  }

  // ---------- TABLE COLUMNS ----------

  const cols = useMemo(
    () => [
      { key: 'listingID', header: 'ID' },
      { key: 'type', header: 'Type' },

      {
        key: 'price',
        header: 'Price',
        className: 'text-right w-[120px]',
        render: (r: Row) => (
          <span className="tabular-nums">${r.price}</span>
        ),
      },

      { key: 'cardCondition', header: 'Cond.' },
      {
        key: 'quantityAvailable',
        header: 'Qty',
        className: 'text-right w-[80px]',
        render: (r: Row) => (
          <span className="tabular-nums">{r.quantityAvailable}</span>
        ),
      },
      { key: 'status', header: 'Status' },
      {
        key: 'card',
        header: 'Card',
        render: (r: Row) =>
          r.card ? `${r.card.name} (${r.card.setName})` : '—',
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (r: Row) => (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-invert btn-xs"
              onClick={() => beginEdit(r)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger btn-xs"
              onClick={() => onDelete(r.listingID)}
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
        <h1 className="section-title">Listings</h1>
        <p className="section-subtitle">
          Browse, add, update, and delete listings (real DB).
        </p>
      </header>

      {/* Form */}
      <form onSubmit={onSubmit} className="card space-y-3">
        <h2 className="text-lg font-semibold text-neutral-100">
          {editing ? `Update Listing #${editing}` : 'Add New Listing'}
        </h2>

        {/* Condition legend */}
        <div className="text-xs text-neutral-300 flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-semibold text-neutral-100">
            Condition legend:
          </span>
          <span>
            <span className="font-mono">NM</span> = Near Mint
          </span>
          <span>
            <span className="font-mono">LP</span> = Lightly Played
          </span>
          <span>
            <span className="font-mono">MP</span> = Moderately Played
          </span>
          <span>
            <span className="font-mono">HP</span> = Heavily Played
          </span>
          <span>
            <span className="font-mono">DMG</span> = Damaged
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Card">
            <select
              required
              className="input"
              value={form.cardID}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  cardID: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
            >
              <option value="">Select a card…</option>
              {cards.map(c => (
                <option key={c.cardID} value={c.cardID}>
                  {c.name} ({c.setName})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Type">
            <select
              className="input"
              value={form.type}
              onChange={e => {
                const newType = e.target.value as Listing['type'];
                setForm(f => ({
                  ...f,
                  type: newType,
                  cardCondition:
                    newType === 'graded' ? null : f.cardCondition ?? 'NM',
                }));
              }}
            >
              <option value="raw">raw</option>
              <option value="graded">graded</option>
            </select>
          </FormField>

          <FormField label="Price">
            <input
              required
              type="number"
              min={0}
              step="0.01"
              className="input"
              value={form.price}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  price: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
            />
          </FormField>

          <FormField label="Quantity Available">
            <input
              required
              type="number"
              min={0}
              step={1}
              className="input"
              value={form.quantityAvailable}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  quantityAvailable:
                    e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
            />
          </FormField>

          <FormField label="Card Condition (raw only)">
            <select
              className="input"
              value={form.cardCondition ?? ''}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  cardCondition:
                    e.target.value === ''
                      ? null
                      : (e.target.value as Listing['cardCondition']),
                }))
              }
              disabled={form.type === 'graded'}
            >
              <option value="">(none)</option>
              <option value="M">M</option>
              <option value="NM">NM</option>
              <option value="LP">LP</option>
              <option value="MP">MP</option>
              <option value="HP">HP</option>
              <option value="D">D</option>
            </select>
          </FormField>

          <FormField label="Status">
            <select
              className="input"
              value={form.status}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  status: e.target.value as Listing['status'],
                }))
              }
            >
              <option value="active">active</option>
              <option value="sold_out">sold_out</option>
              <option value="hidden">hidden</option>
            </select>
          </FormField>

          {form.type === 'graded' && (
            <>
              <FormField label="Grading Company">
                <select
                  required
                  className="input"
                  value={form.companyID}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      companyID:
                        e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                >
                  <option value="">Select company…</option>
                  {companies.map(gc => (
                    <option key={gc.companyID} value={gc.companyID}>
                      {gc.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Grade">
                <input
                  required
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  className="input"
                  value={form.grade}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      grade:
                        e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                />
              </FormField>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button className="btn btn-neutral">
            {editing ? 'Update' : 'Add'}
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-100">
          Browse Listings
        </h2>
        {loading ? (
          <div className="card">
            <p className="text-neutral-300">Loading…</p>
          </div>
        ) : (
          <div className="card">
            <Table<Row> keyField="listingID" columns={cols as any} rows={rows} />
          </div>
        )}
      </div>
    </section>
  );
}

