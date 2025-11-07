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
          <button className="px-2 py-1 text-xs rounded bg-neutral-800 text-white" onClick={() => beginEdit(r)}>Edit</button>
          <button className="px-2 py-1 text-xs rounded bg-red-600 text-white" onClick={() => onDelete(r.customerID)}>Delete</button>
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
    } else {
      await api.createCustomer({ ...form, totalOrders: Number(form.totalOrders) || 0 });
    }
    resetForm();
    refresh();
  }

  async function onDelete(customerID: number) {
    if (!confirm(`Delete customer #${customerID}?`)) return;
    await api.deleteCustomer(customerID);
    refresh();
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-neutral-600">Browse, add, update, and delete customers (mock API).</p>
      </header>

      <form onSubmit={onSubmit} className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold">{editing ? `Update Customer #${editing}` : 'Add New Customer'}</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <FormField label="Email">
            <input required type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border rounded px-3 py-2" />
          </FormField>
          <FormField label="Name">
            <input required type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border rounded px-3 py-2" />
          </FormField>
          <FormField label="Phone">
            <input required type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border rounded px-3 py-2" />
          </FormField>
          <FormField label="Shipping Address">
            <input required type="text" value={form.shippingAddress}
              onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))}
              className="w-full border rounded px-3 py-2" />
          </FormField>
          <FormField label="Total Orders">
            <input type="number" min={0} step={1} value={form.totalOrders}
              onChange={e => setForm(f => ({ ...f, totalOrders: Number(e.target.value) }))}
              className="w-full border rounded px-3 py-2" />
          </FormField>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-neutral-900 text-white">{editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" onClick={resetForm} className="px-3 py-2 rounded border">Cancel</button>}
        </div>
      </form>

      <div>
        <h2 className="font-semibold mb-2">Browse Customers</h2>
        {loading ? <p>Loading…</p> : <Table<Customer> keyField="customerID" columns={columns as any} rows={rows} />}
      </div>
    </section>
  );
}

