import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import type {
  OrderItem,
  Listing,
  Order,
  Card,
  Customer,
} from '../types';

type ListingRow = Listing & {
  card?: Card | null;
};

type OrderRow = Order & {
  customer?: Customer | null;
};

type Row = OrderItem & {
  listing?: ListingRow | null;
};

type FormState = {
  listingID: number | '';
  quantity: number | '';
  unitPrice: number | '';
};

export default function OrderItems() {
  const [orderID, setOrderID] = useState<number | ''>('');        // selected order
  const [orders, setOrders] = useState<OrderRow[]>([]);           // all orders (+ customer)
  const [rows, setRows] = useState<Row[]>([]);                    // order items for current order
  const [allListings, setAllListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingListingID, setEditingListingID] = useState<number | null>(null);

  const [form, setForm] = useState<FormState>({
    listingID: '',
    quantity: '',
    unitPrice: '',
  });

  // ---------- Table columns ----------

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
          <span className="tabular-nums">
            ${Number(r.unitPrice)}
          </span>
        ),
      },
      {
        key: 'listing',
        header: 'Listing Info',
        render: (r: Row) =>
          r.listing
            ? `${r.listing.type} • $${Number(r.listing.price)}`
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

  // ---------- Data loaders ----------

  async function loadOrderItemsForOrder(currentOrderID: number) {
    setLoading(true);
    try {
      const res = await fetch('/api/order-items');
      if (!res.ok) {
        console.error('Failed to load order items', await res.text());
        setRows([]);
        return;
      }
      const allItems: OrderItem[] = await res.json();

      // Filter to current orderID
      const itemsForOrder = allItems.filter(
        oi => oi.orderID === currentOrderID
      );

      // Attach listing info
      const joined: Row[] = itemsForOrder.map(oi => ({
        ...oi,
        listing:
          allListings.find(l => l.listingID === oi.listingID) ?? null,
      }));

      setRows(joined);
    }

    catch (err) {
      console.error('Error loading order items', err);
      setRows([]);
    }

    finally {
      setLoading(false);
    }
  }

  async function loadListings() {
    try {
      const [listingsRes, cardsRes] = await Promise.all([
        fetch('/api/listings'),
        fetch('/api/cards'),
      ]);

      if (!listingsRes.ok) {
        console.error('Failed to load listings', await listingsRes.text());
        return;
      }
      if (!cardsRes.ok) {
        console.error('Failed to load cards', await cardsRes.text());
        return;
      }

      const listings: Listing[] = await listingsRes.json();
      const cards: Card[] = await cardsRes.json();

      const listingsWithCards: ListingRow[] = listings.map(l => ({
        ...l,
        card: cards.find(c => c.cardID === l.cardID) ?? null,
      }));

      setAllListings(listingsWithCards);
    } catch (err) {
      console.error('Error loading listings/cards', err);
    }
  }

  async function loadOrders() {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
      ]);

      if (!ordersRes.ok) {
        console.error('Failed to load orders', await ordersRes.text());
        return;
      }
      if (!customersRes.ok) {
        console.error('Failed to load customers', await customersRes.text());
        return;
      }

      const ordersRaw: Order[] = await ordersRes.json();
      const customers: Customer[] = await customersRes.json();

      const ordersWithCustomers: OrderRow[] = ordersRaw.map(o => ({
        ...o,
        customer:
          customers.find(c => c.customerID === o.customerID) ?? null,
      }));

      setOrders(ordersWithCustomers);

      // choose default order if needed
      if (ordersWithCustomers.length > 0) {
        const exists =
          orderID &&
          ordersWithCustomers.some(o => o.orderID === orderID);
        if (!exists) {
          const latest = ordersWithCustomers[ordersWithCustomers.length - 1];
          setOrderID(latest.orderID);
          await loadOrderItemsForOrder(latest.orderID);
          return;
        }
      }

      if (orderID && ordersWithCustomers.some(o => o.orderID === orderID)) {
        await loadOrderItemsForOrder(orderID as number);
      } else {
        setRows([]);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading orders/customers', err);
      setLoading(false);
    }
  }

  // On mount: load listings first, then orders (which may load items)
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
      loadOrderItemsForOrder(orderID as number);
    } else {
      setRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderID]);

  // ---------- Form helpers ----------

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
      unitPrice: Number(row.unitPrice),
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
          unitPrice = Number(listing.price);
        }
      }

      return { ...prev, listingID, unitPrice };
    });
  }

  // ---------- Submit (create/update) ----------

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
      orderID: orderID as number,
      listingID: Number(form.listingID),
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
    };

    try {
      if (editingListingID !== null) {
        // UPDATE: PUT /api/order-items/:orderID/:listingID
        const res = await fetch(
          `/api/order-items/${orderID}/${editingListingID}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quantity: payload.quantity,
              unitPrice: payload.unitPrice,
            }),
          }
        );

        if (!res.ok) {
          console.error('Update order item failed', await res.text());
          alert('Update failed – check server logs.');
          return;
        }
      } else {
        // CREATE: POST /api/order-items
        const res = await fetch('/api/order-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error('Create order item failed', await res.text());
          alert('Create failed – check server logs.');
          return;
        }
      }

      resetForm();
      await loadOrderItemsForOrder(orderID as number);
    } catch (err) {
      console.error('Submit error (order items)', err);
      alert('Unexpected error – check console/server logs.');
    }
  }

  // ---------- Delete ----------

  async function onDelete(listingID: number) {
    if (!orderID) return;

    if (
      !confirm(
        `Remove listing #${listingID} from order #${orderID}?`
      )
    )
      return;

    try {
      const res = await fetch(
        `/api/order-items/${orderID}/${listingID}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        console.error('Delete order item failed', await res.text());
        alert('Delete failed – check server logs.');
        return;
      }

      await loadOrderItemsForOrder(orderID as number);
    } catch (err) {
      console.error('Delete error (order items)', err);
      alert('Unexpected error – check console/server logs.');
    }
  }

  // ---------- JSX ----------

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
              setOrderID(
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
          >
            {orders.length === 0 && <option value="">No orders yet</option>}
            {orders.map(o => (
              <option key={o.orderID} value={o.orderID}>
                #{o.orderID} –{' '}
                {o.customer
                  ? o.customer.name
                  : `Customer ${o.customerID}`}{' '}
                – {o.status}
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
                  #{l.listingID} –{' '}
                  {l.card ? l.card.name : 'Unknown'} (
                  {l.type}, ${Number(l.price)})
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

