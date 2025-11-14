import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import FormField from '../components/FormField';
import { api } from '../lib/api.mock';
import type { Customer } from '../types';

export default function Customers() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<Customer, 'customerID'>>({
    email: '', name: '', phone: '', shippingAddress: '', totalOrders: 0
  });
  const [editing, setEditing] = useState<number | null>(null);

  const columns = useMemo(() => [
    { key: 'customerID', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'shippingAddress', header: 'Address' },
    { key: 'totalOrders', header: 'Total Orders' },
    {
      key: 'actions', header: 'Actions', render: (r: Customer) => (
        <div className="flex gap-2">
          <button className="btn btn-invert btn-xs" onClick={() => beginEdit(r)}>Edit</button>
          <button className="btn btn-danger btn-xs" onClick={() => onDelete(r.customerID)}>Delete</button>
        </div>
      )
    }
  ], []);

  async function refresh() {
    setLoading(true);
    const data = await api.listCustomers();
    setRows(data);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  function beginEdit(c: Customer) {
    setEditing(c.customerID);
    setForm({ email: c.email, name: c.name, phone: c.phone, shippingAddress: c.shippingAddress, totalOrders: c.totalOrders });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditing(null);
    setForm({ email: '', name: '', phone: '', shippingAddress: '', totalOrders: 0 });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editing) {
      await api.updateCustomer(editing, { ...form, totalOrders: Number(form.totalOrders) || 0 });
    }

    else {
      await api.createCustomer({ ...form, totalOrders: Number(form.totalOrders) || 0 });
    }

    resetForm();
    refresh();
  }

  async function onDelete(customerID: number) {
    if (!confirm(`Delete customer #${customerID}?`))
      return;

    await api.deleteCustomer(customerID);

    refresh();
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="section-title">Customers</h1>
        <p className="section-subtitle">Browse, add, update, and delete customers (mock API).</p>
      </header>

      {/* Form */}
      <form onSubmit={onSubmit} className="card space-y-3">
        <h2 className="text-lg font-semibold text-neutral-100">
          {editing ? `Update Customer #${editing}` : 'Add New Customer'}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Email">
            <input required type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input" />
          </FormField>

          <FormField label="Name">
            <input required type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input" />
          </FormField>

          <FormField label="Phone">
            <input required type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="input" />
          </FormField>

          <FormField label="Shipping Address">
            <input required type="text" value={form.shippingAddress}
              onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))}
              className="input" />
          </FormField>

          <FormField label="Total Orders">
            <input type="number" min={0} step={1} value={form.totalOrders}
              onChange={e => setForm(f => ({ ...f, totalOrders: Number(e.target.value) }))}
              className="input" />
          </FormField>

        </div>

        <div className="flex gap-2">
          <button className="btn btn-neutral">{editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" onClick={resetForm} className="btn btn-outline">Cancel</button>}
        </div>

      </form>

      {/* Table */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-100">Browse Customers</h2>
        {loading ? (
          <div className="card"><p className="text-neutral-300">Loading…</p></div>
        ) : (
          <div className="card">
            <Table<Customer> keyField="customerID" columns={columns as any} rows={rows} />
          </div>
        )}
      </div>
    </section>
  );
}

