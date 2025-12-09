import { useEffect, useMemo, useState } from 'react';

type DropdownSlab = {
  slabID: number;
  grade: number;
  companyName: string;
  companyScale: '10' | '100';
};

export default function GradeSlab() {
  const [listingID, setListingID] = useState<number | ''>(3);
  const [allSlabs, setAllSlabs] = useState<DropdownSlab[]>([]);

  // Find the selected slab from the `allSlabs` array
  const selectedSlab = useMemo(() => {
    if (listingID === '') return null;
    return allSlabs.find(s => s.slabID === listingID) ?? null;
  }, [listingID, allSlabs]);

  useEffect(() => {
    // Load all graded listings for the dropdown
    fetch('/api/grade-slabs/for-dropdown')
      .then(res => res.json())
      .then(setAllSlabs)
      .catch(err => console.error('Failed to load slabs for dropdown', err));
  }, []);

  return (
    <section className="space-y-6">
      <h1 className="section-title">Grade Slab (by Listing)</h1>

      <div className="card space-y-3">
        <label className="field">
          <div className="field-label">Select a Graded Listing</div>
          <select
            className="input"
            value={listingID}
            onChange={e =>
              setListingID(e.target.value === '' ? '' : Number(e.target.value))
            }
          >
            <option value="">Select a slab...</option>
            {allSlabs.map(s => (
              <option key={s.slabID} value={s.slabID}>
                Listing #{s.slabID} ({s.companyName} {s.grade})
              </option>
            ))}
          </select>
        </label>
      </div>

      {!selectedSlab ? (
        <div className="card">
          <p className="text-neutral-300">
            {listingID ? `No slab found for listing #${listingID}.` : 'Select a listing to see details.'}
          </p>
        </div>
      ) : (
        <div className="card space-y-1">
          <p><b>Slab ID (Listing ID):</b> {selectedSlab.slabID}</p>
          <p><b>Company:</b> {selectedSlab.companyName} (scale {selectedSlab.companyScale})</p>
          <p><b>Grade:</b> {selectedSlab.grade}</p>
        </div>
      )}
    </section>
  );
}
