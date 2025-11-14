import { useEffect, useState } from 'react';
import { api } from '../lib/api.mock';
import type { GradeSlab as GradeSlabType, GradingCompany } from '../types';

type SlabDetail = GradeSlabType & { company: GradingCompany | null };

export default function GradeSlab() {
  const [listingID, setListingID] = useState<number | ''>(3);
  const [slab, setSlab] = useState<SlabDetail | null>(null);
  const [allSlabs, setAllSlabs] = useState<SlabDetail[]>([]);

  async function load() {
    if (listingID === '') {
      setSlab(null);
      return;
    }
    const data = await api.getSlabForListing(Number(listingID));
    setSlab(data);
  }

  useEffect(() => {
    api.listGradeSlabs().then(setAllSlabs);
  }, []);

  useEffect(() => {
    load();
  }, [listingID]);

  return (
    <section className="space-y-6">
      <h1 className="section-title">Grade Slab (by Listing)</h1>

      <div className="card space-y-3">
        <label className="field">
          <div className="field-label">Select a Graded Listing</div>
          <select
            className="input"
            value={listingID}
            onChange={e => setListingID(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Select a slab...</option>
            {allSlabs.map(s => (
              <option key={s.slabID} value={s.slabID}>
                Listing #{s.slabID} ({s.company?.name} {s.grade})
              </option>
            ))}
          </select>
        </label>
      </div>

      {!slab ? (
        <div className="card">
          <p className="text-neutral-300">No slab found for listing #{listingID}.</p>
        </div>

      ) : (
        <div className="card space-y-1">
          <p><b>slabID:</b> {slab.slabID}</p>
          <p><b>company:</b> {slab.company?.name} (scale {slab.company?.gradeScale})</p>
          <p><b>grade:</b> {slab.grade}</p>
        </div>
      )}
    </section>
  );
}
