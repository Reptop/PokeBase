import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import { api } from '../lib/api.mock';
import type { Card } from '../types';

export default function Cards() {
  const [rows, setRows] = useState<Card[]>([]);
  const cols = useMemo(() => [
    { key: 'cardID', header: 'ID' },
    { key: 'setName', header: 'Set' },
    { key: 'cardNumber', header: 'Number' },
    { key: 'name', header: 'Name' },
    { key: 'variant', header: 'Variant' },
    { key: 'year', header: 'Year' },
  ], []);

  useEffect(() => { api.listCards().then(setRows); }, []);

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Cards</h1>
      <Table<Card> keyField="cardID" columns={cols as any} rows={rows} />
    </section>
  );
}

