import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import { api } from '../lib/api.mock';
import type { Customer } from '../types';

type Row = Awaited<ReturnType<typeof api.listOrders>>[number];

export default function Orders() {
  const [rows, setRows] = useState<Row[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [form, setForm] = useState({
    customerID: '' as number | '',
    status: 'pending' as Row['status'],
    orderDate: new Date().toISOString().slice(0, 16), // "YYYY-MM-DDTHH:MM" for datetime-local
  });

  const cols = useMemo(
    () => [
      { key: 'orderID', header: 'Order' },
      { key: 'orderDate', header: 'Date' },
      { key: 'status', header: 'Status' },
      { key: 'total', header: 'Total' },
      {
        key: 'customer',
        header: 'Customer',
        render: (r: Row) => (r.customer ? r.customer.name : '-'),
      },
    ],
    []
  );

  async function refresh() {
    const [orders, customers] = await Promise.all([
      api.listOrders(),
      api.listCustomers(),
    ]);
    setRows(orders);
    setCustomers(customers);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.customerID === '') return;

    // convert datetime-local to your DATETIME string
    const dateIso = new Date(form.orderDate);
    const pad = (n: number) => String(n).padStart(2, '0');
    const orderDate = `${dateIso.getFullYear()}-${pad(
      dateIso.getMonth() + 1
    )}-${pad(dateIso.getDate())} ${pad(dateIso.getHours())}:${pad(
      dateIso.getMinutes()
    )}:00`;

    await api.createOrder({
      customerID: Number(form.customerID),
      orderDate,
      status: form.status,
      subtotal: 0,
      tax: 0,
      total: 0,
    });

    // reset customer + status; keep date at "now"
    setForm(f => ({
      ...f,
      customerID: '',
      status: 'pending',
      orderDate: new Date().toISOString().slice(0, 16),
    }));

    await refresh();
  }

  return (
    <section className="space-y-6">
      <h1 className="section-title">Orders</h1>

      {/* New Order Form */}
      <form onSubmit={onSubmit} className="card space-y-3">
        <h2 className="text-lg font-semibold text-neutral-100">Add New Order</h2>
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
                  status: e.target.value as Row['status'],
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

        <button className="btn btn-neutral">Create Order</button>
      </form>

      {/* Orders table */}
      <section className="space-y-3">
        <Table<Row> keyField="orderID" columns={cols as any} rows={rows} />
      </section>
    </section>
  );
}

