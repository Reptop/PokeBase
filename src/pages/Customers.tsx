import { useEffect, useMemo, useState, useCallback } from 'react';
import Table from '../components/Table';
import FormField from '../components/FormField';
import type { Customer } from '../types';

type CustomerForm = {
  email: string;
  name: string;
  phone: string;
  shippingAddress: string;
};

export default function Customers() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CustomerForm>({
    email: '',
    name: '',
    phone: '',
    shippingAddress: '',
  });
  const [editing, setEditing] = useState<number | null>(null);

  // ---------- LOAD ROWS FROM /api/customers ----------

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) {
        console.error('Failed to load customers', await res.text());
        return;
      }
      const data: Customer[] = await res.json();
      setRows(data);
    } catch (err) {
      console.error('Error fetching customers', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---------- EDIT / FORM HELPERS ----------

  function beginEdit(c: Customer) {
    setEditing(c.customerID);
    setForm({
      email: c.email,
      name: c.name,
      phone: c.phone,
      shippingAddress: c.shippingAddress,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditing(null);
    setForm({ email: '', name: '', phone: '', shippingAddress: '' });
  }

  // ---------- CREATE / UPDATE ----------

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editing !== null) {
        // PUT /api/customers/:id
        const res = await fetch(`/api/customers/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        if (!res.ok) {
          console.error('Update failed', await res.text());
          alert('Update failed – check server logs.');
          return;
        }
      } else {
        // POST /api/customers
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        if (!res.ok) {
          console.error('Create failed', await res.text());
          alert('Create failed – check server logs.');
          return;
        }
      }

      resetForm();
      await refresh();
    } catch (err) {
      console.error('Submit error', err);
      alert('Unexpected error – check console/server logs.');
    }
  }

  // ---------- DELETE ----------

  async function onDelete(customerID: number) {
    if (!confirm(`Delete customer #${customerID}?`)) return;

    try {
      const res = await fetch(`/api/customers/${customerID}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Delete failed', await res.text());
        alert('Delete failed – check server logs.');
        return;
      }

      await refresh();
    } catch (err) {
      console.error('Delete error', err);
      alert('Unexpected error – check console/server logs.');
    }
  }

  // ---------- TABLE COLUMNS ----------

  const columns = useMemo(
    () => [
      { key: 'customerID', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone' },
      { key: 'shippingAddress', header: 'Address' },
      { key: 'totalOrders', header: 'Total Orders' },
      {
        key: 'actions',
        header: 'Actions',
        render: (r: Customer) => (
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
              onClick={() => onDelete(r.customerID)}
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
        <h1 className="section-title">Customers</h1>
        <p className="section-subtitle">
          Browse, add, update, and delete customers (real DB via stored procedures).
        </p>
      </header>

      {/* Form */}
      <form onSubmit={onSubmit} className="card space-y-3">
        <h2 className="text-lg font-semibold text-neutral-100">
          {editing ? `Update Customer #${editing}` : 'Add New Customer'}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input"
            />
          </FormField>

          <FormField label="Name">
            <input
              required
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input"
            />
          </FormField>

          <FormField label="Phone">
            <input
              required
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="input"
            />
          </FormField>

          <FormField label="Shipping Address">
            <input
              required
              type="text"
              value={form.shippingAddress}
              onChange={e =>
                setForm(f => ({ ...f, shippingAddress: e.target.value }))
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
        <h2 className="text-lg font-semibold text-neutral-100">
          Browse Customers
        </h2>
        {loading ? (
          <div className="card">
            <p className="text-neutral-300">Loading…</p>
          </div>
        ) : (
          <div className="card">
            <Table<Customer> keyField="customerID" columns={columns as any} rows={rows} />
          </div>
        )}
      </div>
    </section>
  );
}

