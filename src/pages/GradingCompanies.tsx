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
    <section className="space-y-6">
      <h1 className="section-title">Grading Companies</h1>
      <div className="card">
        <Table<GradingCompany> keyField="companyID" columns={cols as any} rows={rows} />
      </div>
    </section>
  );
}
