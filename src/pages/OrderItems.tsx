import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import { api } from '../lib/api.mock';
import type { Listing, OrderItem } from '../types';

type Row = Awaited<ReturnType<typeof api.listOrderItems>>[number];
type ListingRow = Awaited<ReturnType<typeof api.listListings>>[number];

type FormState = {
  listingID: number | '';
  quantity: number | '';
  unitPrice: number | '';
};

export default function OrderItems() {
  const [orderID, setOrderID] = useState<number>(1001);
  const [rows, setRows] = useState<Row[]>([]);
  const [allListings, setAllListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingListingID, setEditingListingID] = useState<number | null>(null);

  const [form, setForm] = useState<FormState>({
    listingID: '',
    quantity: '',
    unitPrice: '',
  });

  const cols = useMemo(
    () => [
      { key: 'listingID', header: 'Listing' },
      {
        key: 'quantity',
        header: 'Qty',
        className: 'text-right w-[80px]',
        render: (r: Row) => (
          <span className="tabular-nums">{r.quantity}</span>
        ),
      },
      {
        key: 'unitPrice',
        header: 'Unit Price',
        className: 'text-right w-[140px]',
        render: (r: Row) => (
          <span className="tabular-nums">${r.unitPrice.toFixed(2)}</span>
        ),
      },
      {
        key: 'listing',
        header: 'Listing Info',
        render: (r: Row) =>
          r.listing
            ? `${r.listing.type} • $${r.listing.price.toFixed(2)}`
            : '—',
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

  async function loadOrderItems() {
    setLoading(true);
    const items = await api.listOrderItems(orderID);
    setRows(items);
    setLoading(false);
  }

  async function loadListings() {
    const listings = await api.listListings();
    setAllListings(listings);
  }

  // Fetch listings once
  useEffect(() => {
    loadListings();
  }, []);

  // Reload order items when orderID changes
  useEffect(() => {
    loadOrderItems();
  }, [orderID]);

  function resetForm() {
    setEditingListingID(null);
    setForm({
      listingID: '',
      quantity: '',
      unitPrice: '',
    });
  }

  function beginEdit(row: Row) {
    setEditingListingID(row.listingID);
    setForm({
      listingID: row.listingID,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!orderID || form.listingID === '' || form.quantity === '' || form.unitPrice === '') {
      return;
    }

    const payload: OrderItem = {
      orderID,
      listingID: Number(form.listingID),
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
    };

    if (editingListingID !== null) {
      // Update existing join row (orderID + listingID PK)
      await api.updateOrderItem(orderID, editingListingID, payload);
    }

    else {
      // Insert new join row
      await api.createOrderItem(payload);
    }

    resetForm();
    await loadOrderItems();
  }

  async function onDelete(listingID: number) {
    if (!confirm(`Remove listing #${listingID} from order #${orderID}?`))
      return;

    await api.deleteOrderItem(orderID, listingID);
    await loadOrderItems();
  }

  function handleListingChange(value: string) {
    const listingID = value === '' ? '' : Number(value);
    setForm(f => ({ ...f, listingID }));

    // When selecting a listing for the first time, auto-fill unitPrice from listing.price
    if (value !== '' && fIsEmptyOrZero(form.unitPrice)) {
      const selected = allListings.find(l => l.listingID === Number(value));
      if (selected) {
        setForm(f => ({ ...f, unitPrice: selected.price }));
      }
    }
  }

  function fIsEmptyOrZero(v: number | '') {
    return v === '' || Number(v) === 0;
  }

  return (
    <section className="space-y-6">
      <h1 className="section-title">Order Items</h1>

      {/* Order selector */}
      <div className="card space-y-3">
        <label className="field">
          <div className="field-label">Order ID</div>
          <input
            className="input"
            value={orderID}
            onChange={e => setOrderID(Number(e.target.value) || 0)}
          />
        </label>

        <button onClick={loadOrderItems} className="btn btn-neutral">
          Refresh
        </button>

      </div>

      {/* Form: Add / Edit join table row */}
      <form onSubmit={onSubmit} className="card space-y-3">
        <h2 className="text-lg font-semibold text-neutral-100">
          {editingListingID !== null
            ? `Update Item for Order #${orderID}`
            : `Add Item to Order #${orderID}`}
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Listing selector */}
          <label className="field">
            <div className="field-label">Listing</div>
            <select
              className="input"
              value={form.listingID}
              onChange={e => handleListingChange(e.target.value)}
              disabled={editingListingID !== null} // keep PK stable while editing
            >
              <option value="">Select listing…</option>
              {allListings.map(l => (
                <option key={l.listingID} value={l.listingID}>
                  #{l.listingID} – {l.card ? l.card.name : 'Unknown'} (
                  {l.type}, ${l.price.toFixed(2)})
                </option>
              ))}
            </select>
          </label>

          {/* Quantity */}
          <label className="field">
            <div className="field-label">Quantity</div>
            <input
              className="input"
              type="number"
              min={1}
              step={1}
              value={form.quantity}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  quantity:
                    e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
            />
          </label>

          {/* Unit price (copy from listing or override) */}
          <label className="field">
            <div className="field-label">Unit Price</div>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={form.unitPrice}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  unitPrice:
                    e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-neutral">
            {editingListingID !== null ? 'Update Item' : 'Add Item'}
          </button>
          {editingListingID !== null && (
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
      <div className="card">
        {loading ? (
          <p className="text-neutral-300">Loading…</p>
        ) : (
          <Table<Row> keyField="listingID" columns={cols as any} rows={rows} />
        )}
      </div>
    </section>
  );
}

