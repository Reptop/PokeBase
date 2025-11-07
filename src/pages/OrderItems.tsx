import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import { api } from '../lib/api.mock';

type Row = Awaited<ReturnType<typeof api.listOrderItems>>[number];

export default function OrderItems() {
  const [orderID, setOrderID] = useState<number>(1001);
  const [rows, setRows] = useState<Row[]>([]);

  const cols = useMemo(() => [
    { key: 'listingID', header: 'Listing' },
    { key: 'quantity', header: 'Qty', className: 'text-right w-[80px]', render: (r: Row) => <span className="tabular-nums">{r.quantity}</span> },
    { key: 'unitPrice', header: 'Unit Price', className: 'text-right w-[140px]', render: (r: Row) => <span className="tabular-nums">${r.unitPrice.toFixed(2)}</span> },
    {
      key: 'listing',
      header: 'Listing Info',
      render: (r: Row) =>
        r.listing ? `${r.listing.type} • $${r.listing.price.toFixed(2)}` : '—',
    },
  ], []);

  async function load() { setRows(await api.listOrderItems(orderID)); }
  useEffect(() => { load(); }, [orderID]);

  return (
    <section className="space-y-6">
      <h1 className="section-title">Order Items</h1>

      <div className="card space-y-3">
        <label className="field">
          <div className="field-label">Order ID</div>
          <input
            className="input"
            value={orderID}
            onChange={e => setOrderID(Number(e.target.value) || 0)}
          />
        </label>
        <button onClick={load} className="btn btn-neutral">Refresh</button>
      </div>

      <div className="card">
        <Table<Row> keyField="listingID" columns={cols as any} rows={rows} />
      </div>
    </section>
  );
}

