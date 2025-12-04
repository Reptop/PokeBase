import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import { api } from '../lib/api.mock';
import type { OrderItem } from '../types';

type Row = Awaited<ReturnType<typeof api.listOrderItems>>[number];
type ListingRow = Awaited<ReturnType<typeof api.listListings>>[number];
type OrderRow = Awaited<ReturnType<typeof api.listOrders>>[number];

type FormState = {
  listingID: number | '';
  quantity: number | '';
  unitPrice: number | '';
};

export default function OrderItems() {

  // These useStates hook together and manage all data for this page
  const [orderID, setOrderID] = useState<number | ''>('');        // currently selected order
  const [orders, setOrders] = useState<OrderRow[]>([]);           // all orders
  const [rows, setRows] = useState<Row[]>([]);                    // order items for current order
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
          r.listing ? `${r.listing.type} • $${r.listing.price.toFixed(2)}` : '—',
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

  // --- Data loaders -------------------------------------------------------

  async function loadOrderItems(currentOrderID: number) {
    setLoading(true);
    const items = await api.listOrderItems(currentOrderID);
    setRows(items);
    setLoading(false);
  }

  async function loadListings() {
    const listings = await api.listListings();
    setAllListings(listings);
  }

  async function loadOrders() {
    const list = await api.listOrders();
    setOrders(list);

    // If no order is selected yet, or the selected one no longer exists,
    // default to the latest order (last in the array).
    if (list.length > 0) {
      const exists = orderID && list.some(o => o.orderID === orderID);
      if (!exists) {
        const latest = list[list.length - 1];
        setOrderID(latest.orderID);
        await loadOrderItems(latest.orderID);
        return;
      }
    }

    // If we already have a valid selected order, just reload its items
    if (orderID && list.some(o => o.orderID === orderID)) {
      await loadOrderItems(orderID);
    }

    else {
      setRows([]);
      setLoading(false);
    }
  }

  // On mount: load orders & listings
  useEffect(() => {
    (async () => {
      await loadListings();
      await loadOrders();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When orderID changes (via dropdown), load that order's items
  useEffect(() => {
    if (orderID) {
      loadOrderItems(orderID);
    } else {
      setRows([]);
    }
  }, [orderID]);

  // --- Form helpers -------------------------------------------------------

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

  function handleListingChange(value: string) {
    setForm(prev => {
      const listingID = value === '' ? '' : Number(value);
      let unitPrice = prev.unitPrice;

      // Autofill unitPrice from listing.price if it's empty/zero
      if (value !== '' && (unitPrice === '' || Number(unitPrice) === 0)) {
        const listing = allListings.find(l => l.listingID === listingID);
        if (listing) {
          unitPrice = listing.price;
        }
      }

      return { ...prev, listingID, unitPrice };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !orderID ||
      form.listingID === '' ||
      form.quantity === '' ||
      form.unitPrice === ''
    ) {
      return;
    }

    const payload: OrderItem = {
      orderID,
      listingID: Number(form.listingID),
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
    };

    if (editingListingID !== null) {
      await api.updateOrderItem(orderID, editingListingID, payload);
    }

    else {
      await api.createOrderItem(payload);
    }

    resetForm();
    await loadOrderItems(orderID);
  }

  async function onDelete(listingID: number) {
    if (!orderID)
      return;

    if (!confirm(`Remove listing #${listingID} from order #${orderID}?`))
      return;

    await api.deleteOrderItem(orderID, listingID);
    await loadOrderItems(orderID);
  }

  // --- JSX ---------------------------------------------------------------

  return (
    <section className="space-y-6">
      <h1 className="section-title">Order Items</h1>

      {/* Order selector */}
      <div className="card space-y-3">
        <label className="field">
          <div className="field-label">Order</div>
          <select
            className="input"
            value={orderID}
            onChange={e =>
              setOrderID(e.target.value === '' ? '' : Number(e.target.value))
            }
          >
            {orders.length === 0 && <option value="">No orders yet</option>}
            {orders.map(o => (
              <option key={o.orderID} value={o.orderID}>
                #{o.orderID} – {o.customer ? o.customer.name : `Customer ${o.customerID}`} – {o.status}
              </option>
            ))}
          </select>
        </label>
        <button onClick={loadOrders} className="btn btn-neutral">
          Reload Orders
        </button>
      </div>

      {/* Join-table CRUD form */}
      <form onSubmit={onSubmit} className="card space-y-3">
        <h2 className="text-lg font-semibold text-neutral-100">
          {editingListingID !== null && orderID
            ? `Update Item for Order #${orderID}`
            : orderID
              ? `Add Item to Order #${orderID}`
              : 'Select an order to edit items'}
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Listing selector */}
          <label className="field">
            <div className="field-label">Listing</div>
            <select
              className="input"
              value={form.listingID}
              onChange={e => handleListingChange(e.target.value)}
              disabled={editingListingID !== null || !orderID}
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
              disabled={!orderID}
            />
          </label>

          {/* Unit price */}
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
              disabled={!orderID}
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-neutral" disabled={!orderID}>
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

