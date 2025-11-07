import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import { api } from '../lib/api.mock';

type Row = Awaited<ReturnType<typeof api.listOrders>>[number];

export default function Orders() {
  const [rows, setRows] = useState<Row[]>([]);
  const cols = useMemo(() => [
    { key: 'orderID', header: 'Order' },
    { key: 'orderDate', header: 'Date' },
    { key: 'status', header: 'Status' },
    { key: 'total', header: 'Total' },
    { key: 'customer', header: 'Customer', render: (r: Row) => r.customer ? r.customer.name : '-' },
  ], []);
  useEffect(() => { api.listOrders().then(setRows); }, []);
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Orders</h1>
      <Table<Row> keyField="orderID" columns={cols as any} rows={rows} />
    </section>
  );
}

