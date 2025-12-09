import { useEffect, useMemo, useState, useCallback } from 'react';
import Table from '../components/Table';
import type { Order, Customer } from '../types';

type OrderRow = Order & {
  customer?: Customer | null;
};

type FormState = {
  customerID: number | '';
  status: Order['status'];
  orderDate: string; // "YYYY-MM-DDTHH:MM" for datetime-local
  subtotal: number;
  tax: number;
  total: number;
};

export default function Orders() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    customerID: '',
    status: 'pending',
    orderDate: new Date().toISOString().slice(0, 16),
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  // ---- helpers ----

  // Convert datetime-local -> "YYYY-MM-DD HH:MM:SS" for MySQL
  function datetimeLocalToMySql(dtLocal: string): string {
    const date = new Date(dtLocal);
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d} ${h}:${min}:00`;
  }

  // Convert MySQL "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM" for input
  function mySqlToDatetimeLocal(dt: string): string {
    // crude but fine for our format: "2025-12-08 13:45:00" -> "2025-12-08T13:45"
    return dt.replace(' ', 'T').slice(0, 16);
  }

  // ---- columns ----

  const cols = useMemo(
    () => [
      { key: 'orderID', header: 'Order' },
      { key: 'orderDate', header: 'Date' },
      { key: 'status', header: 'Status' },
      {
        key: 'total',
        header: 'Total',
        className: 'text-right',
        render: (r: OrderRow) => (
          <span className="tabular-nums">
            ${Number(r.total).toFixed(2)}
          </span>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (r: OrderRow) => (r.customer ? r.customer.name : '-'),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (r: OrderRow) => (
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
              onClick={() => onDelete(r.orderID)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // ---- data loading ----

  const refresh = useCallback(async () => {
    setLoading(true);
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

      const ordersRaw = (await ordersRes.json()) as Order[];
      const customersList = (await customersRes.json()) as Customer[];

      // Coerce numeric fields (DECIMAL may come as strings)
      const orders: Order[] = ordersRaw.map(o => ({
        ...o,
        subtotal: Number(o.subtotal),
        tax: Number(o.tax),
        total: Number(o.total),
      }));

      const rowsWithCustomers: OrderRow[] = orders.map(o => ({
        ...o,
        customer:
          customersList.find(c => c.customerID === o.customerID) ?? null,
      }));

      setRows(rowsWithCustomers);
      setCustomers(customersList);
    } catch (err) {
      console.error('Error refreshing orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- form helpers ----

  function resetForm() {
    setEditing(null);
    setForm({
      customerID: '',
      status: 'pending',
      orderDate: new Date().toISOString().slice(0, 16),
      subtotal: 0,
      tax: 0,
      total: 0,
    });
  }

  function beginEdit(row: OrderRow) {
    setEditing(row.orderID);
    setForm({
      customerID: row.customerID,
      status: row.status,
      orderDate: mySqlToDatetimeLocal(row.orderDate),
      subtotal: Number(row.subtotal),
      tax: Number(row.tax),
      total: Number(row.total),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---- submit (create / update) ----

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.customerID === '') return;

    const payload = {
      customerID: Number(form.customerID),
      orderDate: datetimeLocalToMySql(form.orderDate),
      status: form.status,
      subtotal: Number(form.subtotal) || 0,
      tax: Number(form.tax) || 0,
      total: Number(form.total) || 0,
    };

    try {
      if (editing !== null) {
        // UPDATE
        const res = await fetch(`/api/orders/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error('Update order failed', await res.text());
          alert('Update failed – check server logs.');
          return;
        }
      } else {
        // CREATE
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error('Create order failed', await res.text());
          alert('Create failed – check server logs.');
          return;
        }
      }

      resetForm();
      await refresh();
    } catch (err) {
      console.error('Submit error (orders)', err);
      alert('Unexpected error – check console/server logs.');
    }
  }

  // ---- delete ----

  async function onDelete(orderID: number) {
    if (!confirm(`Delete order #${orderID}? This will also remove its order items (if ON DELETE CASCADE).`))
      return;

    try {
      const res = await fetch(`/api/orders/${orderID}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Delete order failed', await res.text());
        alert('Delete failed – check server logs.');
        return;
      }

      // If we were editing this order, reset the form
      if (editing === orderID) {
        resetForm();
      }

      await refresh();
    } catch (err) {
      console.error('Delete error (orders)', err);
      alert('Unexpected error – check console/server logs.');
    }
  }

  // ---- JSX ----

  return (
    <section className="space-y-6">
      <h1 className="section-title">Orders</h1>

      {/* New / Edit Order Form */}
      <form onSubmit={onSubmit} className="card space-y-3">
        <h2 className="text-lg font-semibold text-neutral-100">
          {editing ? `Update Order #${editing}` : 'Add New Order'}
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <label className="field">
            <div className="field-label">Customer</div>
            <select
              className="input"
              value={form.customerID}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  customerID:
                    e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              required
            >
              <option value="">Select customer…</option>
              {customers.map(c => (
                <option key={c.customerID} value={c.customerID}>
                  #{c.customerID} – {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <div className="field-label">Status</div>
            <select
              className="input"
              value={form.status}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  status: e.target.value as Order['status'],
                }))
              }
            >
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="shipped">shipped</option>
              <option value="canceled">canceled</option>
              <option value="refunded">refunded</option>
            </select>
          </label>

          <label className="field">
            <div className="field-label">Order Date</div>
            <input
              className="input"
              type="datetime-local"
              value={form.orderDate}
              onChange={e =>
                setForm(f => ({ ...f, orderDate: e.target.value }))
              }
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-neutral">
            {editing ? 'Update Order' : 'Create Order'}
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

      {/* Orders table */}
      <section className="space-y-3">
        {loading ? (
          <div className="card">
            <p className="text-neutral-300">Loading…</p>
          </div>
        ) : (
          <Table<OrderRow> keyField="orderID" columns={cols as any} rows={rows} />
        )}
      </section>
    </section>
  );
}

