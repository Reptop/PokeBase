import { useEffect, useState } from 'react';
import { api } from '../lib/api.mock';

type Slab = Awaited<ReturnType<typeof api.getSlabForListing>>;

export default function GradeSlab() {
  const [listingID, setListingID] = useState<number>(3);
  const [slab, setSlab] = useState<Slab>(null);

  async function load() {
    const data = await api.getSlabForListing(Number(listingID));
    setSlab(data);
  }
  useEffect(() => { load(); }, [listingID]);

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Grade Slab (by Listing)</h1>
      <div className="bg-white border rounded p-3 space-y-2">
        <label className="block">
          <div className="text-xs font-medium mb-1">Listing ID</div>
          <input className="border rounded px-3 py-2" value={listingID}
            onChange={e => setListingID(Number(e.target.value) || 0)} />
        </label>
        <button className="px-3 py-2 rounded bg-neutral-900 text-white" onClick={load}>Fetch</button>
      </div>

      {!slab ? <p className="text-neutral-600">No slab found for listing #{listingID}.</p> : (
        <div className="border rounded p-3 bg-white space-y-1">
          <p><b>slabID:</b> {slab.slabID}</p>
          <p><b>company:</b> {slab.company?.name} (scale {slab.company?.gradeScale})</p>
          <p><b>grade:</b> {slab.grade}</p>
        </div>
      )}
    </section>
  );
}

