import { useEffect, useMemo, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import Table from '../components/Table';
import FormField from '../components/FormField';
import type { GradingCompany } from '../types';

type GradingCompanyForm = Omit<GradingCompany, 'companyID'>;

const emptyForm: GradingCompanyForm = {
  name: '',
  gradeScale: '10',
  url: '',
};

export default function GradingCompanies() {
  const [rows, setRows] = useState<GradingCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<GradingCompanyForm>(emptyForm);
  const [saving, setSaving] = useState(false);

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

  // ----- CREATE / UPDATE -----

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setEditing(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!form.name || !form.gradeScale) {
        alert('Name and grade scale are required.');
        return;
      }

      setSaving(true);
      try {
        const isEdit = editing !== null;
        const url = isEdit
          ? `/api/grading-companies/${editing}`
          : '/api/grading-companies';

        const res = await fetch(url, {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            gradeScale: form.gradeScale,
            url: form.url || null,
          }),
        });

        if (!res.ok) {
          console.error(
            isEdit ? 'Update failed' : 'Create failed',
            await res.text()
          );
          alert(
            `${isEdit ? 'Update' : 'Create'} failed – check server logs.`
          );
          return;
        }

        await loadRows();
        resetForm();
      } catch (err) {
        console.error('Save grading company failed:', err);
        alert('Save failed – check server logs.');
      } finally {
        setSaving(false);
      }
    },
    [editing, form, loadRows, resetForm]
  );

  const handleEdit = useCallback((row: GradingCompany) => {
    setEditing(row.companyID);
    setForm({
      name: row.name,
      gradeScale: row.gradeScale,
      url: row.url ?? '',
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    resetForm();
  }, [resetForm]);

  // ----- DELETE -----

  const handleDelete = useCallback(
    async (id: number) => {
      if (!window.confirm('Delete this grading company?')) return;

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
        if (editing === id) resetForm();
      } finally {
        setDeletingId(null);
      }
    },
    [editing, loadRows, resetForm]
  );

  // ----- TABLE COLUMNS -----

  const cols = useMemo(
    () => [
      { key: 'companyID', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'gradeScale', header: 'Scale' },
      { key: 'url', header: 'URL' },
      {
        key: 'actions',
        header: 'Actions',
        render: (row: GradingCompany) => (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary px-2 py-1 text-xs"
              onClick={() => handleEdit(row)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn-danger px-2 py-1 text-xs"
              onClick={() => handleDelete(row.companyID)}
              disabled={deletingId === row.companyID}
            >
              {deletingId === row.companyID ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ),
      },
    ],
    [deletingId, handleDelete, handleEdit]
  );

  // ----- RENDER -----

  return (
    <section className="space-y-6">
      <h1 className="section-title">Grading Companies</h1>
      <p className="section-subtitle">
        Create, update, or delete a grading company. Use the RESET button on the
        home page to restore the original sample rows.
      </p>

      {/* Create / Edit form */}
      {/* Create / Edit form */}
      <div className="card">
        <form className="p-6 space-y-8" onSubmit={handleSubmit}>
          <FormField label="Name">
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              maxLength={32}
              required
            />
          </FormField>

          <FormField label="Grade Scale">
            <select
              className="input"
              value={form.gradeScale}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  gradeScale: e.target.value as GradingCompany['gradeScale'],
                }))
              }
            >
              <option value="10">10</option>
              <option value="100">100</option>
            </select>
          </FormField>

          <FormField label="Website URL (optional)">
            <input
              type="url"
              className="input"
              value={form.url ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, url: e.target.value }))
              }
            />
          </FormField>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="btn btn-neutral"
              disabled={saving}
            >
              {editing === null
                ? saving
                  ? 'Creating…'
                  : 'Create Grading Company'
                : saving
                  ? 'Updating…'
                  : 'Update Grading Company'}
            </button>
            {editing !== null && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card">
        {loading && rows.length === 0 ? (
          <p className="p-4 text-sm">Loading…</p>
        ) : (
          <Table<GradingCompany>
            keyField="companyID"
            columns={cols}
            rows={rows}
          />
        )}
      </div>
    </section>
  );
}

