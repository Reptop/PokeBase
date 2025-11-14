import { useEffect, useState } from 'react';
import { api } from '../lib/api.mock';

type Slab = Awaited<ReturnType<typeof api.getSlabForListing>>;

export default function GradeSlab() {
  const [listingID, setListingID] = useState<number>(3);
  const [slab, setSlab] = useState<Slab | null>(null);

  async function load() {
    const data = await api.getSlabForListing(Number(listingID));
    setSlab(data);
  }
  useEffect(() => { load(); }, [listingID]);

  return (
    <section className="space-y-6">
      <h1 className="section-title">Grade Slab (by Listing)</h1>

      <div className="card space-y-3">
        <label className="field">
          <div className="field-label">Listing ID</div>
          <input
            className="input"
            value={listingID}
            onChange={e => setListingID(Number(e.target.value) || 0)}
          />
        </label>
        <button className="btn btn-neutral" onClick={load}>Fetch</button>
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

