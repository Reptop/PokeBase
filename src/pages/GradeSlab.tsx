import { useCallback, useEffect, useMemo, useState } from 'react';

type DropdownSlab = {
  listingID: number;                    // 👈 comes from SQL: l.listingID
  slabID: number;
  grade: number;
  companyName: string;
  companyScale: '10' | '100';
};

export default function GradeSlab() {
  const [listingID, setListingID] = useState<number | ''>('');
  const [allSlabs, setAllSlabs] = useState<DropdownSlab[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlabs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/grade-slabs/for-dropdown');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: DropdownSlab[] = await res.json();
      setAllSlabs(data);

      // auto select first listing if none selected
      setListingID(prev => {
        if (prev !== '') return prev;
        return data.length > 0 ? data[0].listingID : '';
      });
    } catch (err) {
      console.error('Failed to load slabs for dropdown', err);
      setError('Failed to load graded listings. Try reloading.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlabs();
  }, [loadSlabs]);

  const selectedSlab = useMemo(() => {
    if (typeof listingID !== 'number') return null;
    return allSlabs.find(s => s.listingID === listingID) ?? null;
  }, [listingID, allSlabs]);

  return (
    <section className="space-y-6">
      {/* Header + reload */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Grade Slab (by Listing)</h1>
          <p className="text-sm text-neutral-400">
            Browse the grade slab details for each graded listing
            (M:N relationship between Listings and Grading Companies).
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={loadSlabs}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Reload Slabs'}
        </button>
      </header>

      {/* Selector card */}
      <div className="card space-y-3">
        <label className="field">
          <div className="field-label">Select a Graded Listing</div>
          <select
            className="input"
            value={listingID}
            onChange={e =>
              setListingID(
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
          >
            <option value="">Select a graded listing…</option>
            {allSlabs.map(s => (
              <option key={s.slabID} value={s.listingID}>
                Listing #{s.listingID} (Slab #{s.slabID} – {s.companyName} {s.grade})
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}

        {!error && allSlabs.length === 0 && !loading && (
          <p className="text-sm text-neutral-300">
            No graded listings found. Create a graded listing first, then click
            <span className="font-semibold"> Reload Slabs</span>.
          </p>
        )}
      </div>

      {/* Details card */}
      {!selectedSlab ? (
        <div className="card">
          <p className="text-neutral-300">
            {listingID
              ? `No slab details found for listing #${listingID}.`
              : 'Select a graded listing above to view its slab details.'}
          </p>
        </div>
      ) : (
        <div className="card space-y-1">
          <p>
            <b>Listing ID:</b> {selectedSlab.listingID}
          </p>
          <p>
            <b>Slab ID:</b> {selectedSlab.slabID}
          </p>
          <p>
            <b>Company:</b> {selectedSlab.companyName} (scale{' '}
            {selectedSlab.companyScale})
          </p>
          <p>
            <b>Grade:</b> {selectedSlab.grade}
          </p>
        </div>
      )}
    </section>
  );
}

