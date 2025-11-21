import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import FormField from '../components/FormField';
import { api } from '../lib/api.mock';
import type { Card, Listing, GradingCompany } from '../types';

type Row = Awaited<ReturnType<typeof api.listListings>>[number];

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

  // Memo for table columns definition
  const cols = useMemo(
    () => [
      { key: 'listingID', header: 'ID' },
      { key: 'type', header: 'Type' },
      {
        key: 'price',
        header: 'Price',
        className: 'text-right w-[120px]',
        render: (r: Row) => (
          <span className="tabular-nums">${r.price.toFixed(2)}</span>
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

  async function refresh() {
    setLoading(true);
    const [listings, cards, companies] = await Promise.all([
      api.listListings(),
      api.listCards(),
      api.listGradingCompanies(),
    ]);
    setRows(listings);
    setCards(cards);
    setCompanies(companies);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function loadSlabForListing(listingID: number) {
    const slab = await api.getSlabForListing(listingID);
    if (!slab) {
      // No slab: clear graded-specific fields
      setForm(f => ({ ...f, companyID: '', grade: '' }));
    } else {
      setForm(f => ({
        ...f,
        companyID: slab.companyID,
        grade: slab.grade,
      }));
    }
  }

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
      // companyID / grade will be filled asynchronously if graded
      companyID: '',
      grade: '',
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Load the slab details if type is graded
    if (row.type === 'graded') {
      loadSlabForListing(row.listingID);
    }
  }

  // Default form state
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Prevent submission if required fields are missing
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

    // Basic validation for graded listing, ensure companyID and grade are provided
    if (form.type === 'graded') {
      if (form.companyID === '' || form.grade === '') {
        alert('Please select grading company and grade for graded listings.');
        return;
      }
    }

    let listingID = editing ?? null;

    if (editing)
      await api.updateListing(editing, payload);

    else {
      const result = await api.createListing(payload);
      listingID = result.listingID;
    }

    // Handle GradeSlab based on type
    if (listingID !== null) {
      if (form.type === 'graded') {
        await api.upsertGradeSlabForListing(listingID, {
          companyID: Number(form.companyID),
          grade: Number(form.grade),
        });
      }

      else
        // If switching from graded -> raw, remove any existing slab
        await api.deleteGradeSlabForListing(listingID);
    }

    resetForm();
    await refresh();
  }

  async function onDelete(listingID: number) {
    if (!confirm(`Delete listing #${listingID}?`))
      return;

    await api.deleteListing(listingID);
    await refresh();
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="section-title">Listings</h1>
        <p className="section-subtitle">
          Browse, add, update, and delete listings (mock API).
        </p>
      </header>

      {/* Form */}
      <form onSubmit={onSubmit} className="card space-y-3">
        <h2 className="text-lg font-semibold text-neutral-100">
          {editing ? `Update Listing #${editing}` : 'Add New Listing'}
        </h2>

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

          {/* Graded-only fields */}
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

