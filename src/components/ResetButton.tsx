import { useState } from 'react';

export default function ResetButton() {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!window.confirm('Reset database to starter sample data?')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) {
        console.error('Reset failed', await res.text());
        alert('Reset failed – check server logs.');
        return;
      }
      // Hard refresh so every page re-reads from DB
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      className="btn-danger"
      disabled={loading}
    >
      {loading ? 'Resetting…' : 'RESET Database'}
    </button>
  );
}

