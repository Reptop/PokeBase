import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import { api } from '../lib/api.mock';

type Row = Awaited<ReturnType<typeof api.listListings>>[number];

export default function Listings() {
  const [rows, setRows] = useState<Row[]>([]);
  const cols = useMemo(() => [
    { key: 'listingID', header: 'ID' },
    { key: 'type', header: 'Type' },
    { key: 'price', header: 'Price' },
    { key: 'cardCondition', header: 'Cond.' },
    { key: 'quantityAvailable', header: 'Qty' },
    { key: 'status', header: 'Status' },
    { key: 'card', header: 'Card', render: (r: Row) => r.card ? `${r.card.name} (${r.card.setName})` : '-' },
  ], []);

  useEffect(() => { api.listListings().then(setRows); }, []);
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Listings</h1>
      <Table<Row> keyField="listingID" columns={cols as any} rows={rows} />
    </section>
  );
}

