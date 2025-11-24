import { useEffect, useMemo, useState, useCallback } from 'react';
import Table from '../components/Table';
import type { GradingCompany } from '../types';

export default function GradingCompanies() {
  const [rows, setRows] = useState<GradingCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/grading-companies');
      if (!res.ok) {
        console.error('Failed to load grading companies', await res.text());
        return;
      }
      const data: GradingCompany[] = await res.json();
      setRows(data);
    }

    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this grading company?'))
      return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/grading-companies/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        console.error('Delete failed', await res.text());
        alert('Delete failed – check server logs.');
        return;
      }
      await loadRows();
    } finally {
      setDeletingId(null);
    }
  };

  const cols = useMemo(
    () => [
      { key: 'companyID', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'gradeScale', header: 'Scale' },
      { key: 'url', header: 'URL' },
      {
        key: 'actions',
        header: 'Actions',
        // Table<T> should call this when present
        render: (row: GradingCompany) => (
          <button
            type="button"
            className="btn-danger px-2 py-1 text-xs"
            onClick={() => handleDelete(row.companyID)}
            disabled={deletingId === row.companyID}
          >
            {deletingId === row.companyID ? 'Deleting…' : 'Delete'}
          </button>
        ),
      },
    ],
    [deletingId, handleDelete]
  );

  return (
    <section className="space-y-6">
      <h1 className="section-title">Grading Companies</h1>
      <p className="section-subtitle">
        Delete a grading company to change the data, then use the RESET button
        on the home page to restore the original sample rows.
      </p>
      <div className="card">
        {loading && rows.length === 0 ? (
          <p className="p-4 text-sm">Loading…</p>
        ) : (

          <Table<GradingCompany> keyField="companyID" columns={cols} rows={rows} />

        )}
      </div>
    </section>
  );
}

