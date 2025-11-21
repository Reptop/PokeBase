import { useEffect, useMemo, useState, useCallback } from 'react';
import Table from '../components/Table';
import { api } from '../lib/api.mock';
import type { GradingCompany } from '../types';

type GradingCompanyInput = Omit<GradingCompany, 'companyID'>;

const emptyForm: GradingCompanyInput = {
  name: '',
  gradeScale: '10',
  url: '',
};

export default function GradingCompanies() {
  const [rows, setRows] = useState<GradingCompany[]>([]);
  const [form, setForm] = useState<GradingCompanyInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    api.listGradingCompanies().then(setRows);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {

      if (editingId === null) {
        // Create
        await api.createGradingCompany(form);
      }

      else {
        // Update
        await api.updateGradingCompany(editingId, form);
      }

      setForm(emptyForm);
      setEditingId(null);
      refresh();
    }

    finally {
      setLoading(false);
    }
  };

  const handleEdit = (row: GradingCompany) => {
    setEditingId(row.companyID);
    setForm({
      name: row.name,
      gradeScale: row.gradeScale,
      url: row.url,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this grading company?'))
      return;

    setLoading(true);

    try {
      await api.deleteGradingCompany(id);
      refresh();
    }

    finally {
      setLoading(false);
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
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [handleDelete]
  );

  return (
    <section className="space-y-6">
      <h1 className="section-title">Grading Companies</h1>

      {/* Create / Edit form */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">
          {editingId === null ? 'Add Grading Company' : `Edit Grading Company #${editingId}`}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              className="input"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="gradeScale" className="text-sm font-medium">
              Grade Scale
            </label>
            <input
              id="gradeScale"
              name="gradeScale"
              className="input"
              placeholder="e.g., 10, 100"
              value={form.gradeScale}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="url" className="text-sm font-medium">
              Website URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              className="input"
              placeholder="https://example.com"
              value={form.url}
              onChange={handleChange}
              required
            />
          </div>

          <div className="md:col-span-3 flex gap-2 mt-2">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {editingId === null ? 'Create' : 'Save Changes'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card">
        <Table<GradingCompany> keyField="companyID" columns={cols as any} rows={rows} />
      </div>
    </section>
  );
}

