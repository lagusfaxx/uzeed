'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../_lib/api';
import type { Me } from '@uzeed/shared';

export default function SubscriptionReturnPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Me>('/me')
      .then(setMe)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Suscripción: retorno</h2>
      <p>
        Si completaste la firma PAC en tu banco, Khipu notificará al backend y tu suscripción quedará{' '}
        <b>ENABLED</b>.
      </p>
      {error ? <p style={{ color: '#fca5a5' }}>{error}</p> : null}
      {me ? (
        <>
          <p>
            <b>Estado:</b> {me.subscription ? me.subscription.status : 'Sin suscripción'}
          </p>
          <p>
            <b>Membresía:</b> {me.membership_active ? 'Activa ✅' : 'Inactiva ❌'}
          </p>
        </>
      ) : null}
      <div className="row">
        <a className="btn" href="/dashboard">Volver al dashboard</a>
        <a className="btn secondary" href="/feed">Ir al feed</a>
      </div>
      <p className="small" style={{ marginTop: 12 }}>
        Si el estado aún está en PENDING, espera unos segundos y refresca.
      </p>
    </div>
  );
}
