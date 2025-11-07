import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import { api } from '../lib/api.mock';

type Row = Awaited<ReturnType<typeof api.listListings>>[number];

export default function Listings() {
  const [rows, setRows] = useState<Row[]>([]);

  const cols = useMemo(() => [
    { key: 'listingID', header: 'ID' },
    { key: 'type', header: 'Type' },
    {
      key: 'price',
      header: 'Price',
      className: 'text-right w-[120px]',
      render: (r: Row) => <span className="tabular-nums">${r.price.toFixed(2)}</span>,
    },
    { key: 'cardCondition', header: 'Cond.' },
    {
      key: 'quantityAvailable',
      header: 'Qty',
      className: 'text-right w-[80px]',
      render: (r: Row) => <span className="tabular-nums">{r.quantityAvailable}</span>,
    },
    { key: 'status', header: 'Status' },
    {
      key: 'card',
      header: 'Card',
      render: (r: Row) => (r.card ? `${r.card.name} (${r.card.setName})` : '—'),
    },
  ], []);

  useEffect(() => { api.listListings().then(setRows); }, []);

  return (
    <section className="space-y-6">
      <h1 className="section-title">Listings</h1>
      <div className="card">
        <Table<Row> keyField="listingID" columns={cols as any} rows={rows} />
      </div>
    </section>
  );
}
