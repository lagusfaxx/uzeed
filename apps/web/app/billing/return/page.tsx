'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../_lib/api';

export default function ReturnPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const tx = typeof searchParams.transaction_id === 'string' ? searchParams.transaction_id : '';
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tx) return;
    apiFetch(`/billing/status?transaction_id=${encodeURIComponent(tx)}`)
      .then(setStatus)
      .catch((e) => setError(e.message));
  }, [tx]);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Resultado de pago</h2>
      {!tx ? <p>Falta transaction_id en la URL.</p> : null}
      {error ? <p style={{ color: '#fca5a5' }}>Error: {error}</p> : null}
      {status ? (
        <>
          <p><b>Pago:</b> {status.payment.status}</p>
          <p><b>Membresía activa:</b> {status.membership_active ? 'Sí ✅' : 'No ❌'}</p>
          <p className="small">Si el pago está PENDING, espera 1-2 minutos y refresca. La activación ocurre cuando llega el webhook/conciliación.</p>
          <div className="row">
            <a className="btn" href="/feed">Ir al feed</a>
            <a className="btn secondary" href="/dashboard">Dashboard</a>
          </div>
        </>
      ) : tx ? (
        <p>Cargando estado...</p>
      ) : null}
    </div>
  );
}
