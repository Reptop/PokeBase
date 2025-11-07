import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import { api } from '../lib/api.mock';
import type { GradingCompany } from '../types';

export default function GradingCompanies() {
  const [rows, setRows] = useState<GradingCompany[]>([]);
  const cols = useMemo(() => [
    { key: 'companyID', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'gradeScale', header: 'Scale' },
    { key: 'url', header: 'URL' },
  ], []);
  useEffect(() => { api.listGradingCompanies().then(setRows); }, []);
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Grading Companies</h1>
      <Table<GradingCompany> keyField="companyID" columns={cols as any} rows={rows} />
    </section>
  );
}

