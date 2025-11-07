import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import { api } from '../lib/api.mock';

type Row = Awaited<ReturnType<typeof api.listOrderItems>>[number];

export default function OrderItems() {
  const [orderID, setOrderID] = useState<number>(1001);
  const [rows, setRows] = useState<Row[]>([]);

  const cols = useMemo(() => [
    { key: 'listingID', header: 'Listing' },
    { key: 'quantity', header: 'Qty' },
    { key: 'unitPrice', header: 'Unit Price' },
    { key: 'listing', header: 'Listing Info', render: (r: Row) => r.listing ? `${r.listing.type} $${r.listing.price}` : '-' },
  ], []);

  async function load() { setRows(await api.listOrderItems(orderID)); }
  useEffect(() => { load(); }, [orderID]);

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Order Items</h1>
      <div className="bg-white border rounded p-3 space-y-2">
        <label className="block">
          <div className="text-xs font-medium mb-1">Order ID</div>
          <input className="border rounded px-3 py-2" value={orderID}
            onChange={e => setOrderID(Number(e.target.value) || 0)} />
        </label>
        <button onClick={load} className="px-3 py-2 rounded bg-neutral-900 text-white">Refresh</button>
      </div>
      <Table<Row> keyField="listingID" columns={cols as any} rows={rows} />
    </section>
  );
}

