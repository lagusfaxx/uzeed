'use client';

import { useEffect, useState } from 'react';
import type { Me } from '@uzeed/shared';
import { apiFetch } from '../_lib/api';

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Me>('/me')
      .then(setMe)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function startAutoSubscription() {
    setError(null);
    try {
      const r = await apiFetch<{ ok: true; redirect_url?: string; already?: boolean }>(
        '/billing/khipu/create-subscription',
        { method: 'POST' }
      );
      if (r.redirect_url) window.location.href = r.redirect_url;
      else setError('Ya tienes una suscripción habilitada.');
    } catch (e: any) {
      setError(e.message || 'Error');
    }
  }

  if (loading) return <div className="card">Cargando...</div>;
  if (!me) return <div className="card">Debes iniciar sesión.</div>;

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      <p><b>Email:</b> {me.email}</p>
      <p>
        <b>Membresía:</b> {me.membership_active ? 'Activa ✅' : 'Inactiva ❌'}
        {me.membership_expires_at ? (
          <> — vence: {new Date(me.membership_expires_at).toLocaleString()}</>
        ) : null}
      </p>
      <p>
        <b>Suscripción PAC:</b>{' '}
        {me.subscription ? `${me.subscription.status} (${me.subscription.provider_subscription_id})` : 'No creada'}
        {me.subscription?.next_charge_at ? (
          <> — próximo cobro: {new Date(me.subscription.next_charge_at).toLocaleString()}</>
        ) : null}
      </p>
      <div className="row">
        <button className="btn" type="button" onClick={startAutoSubscription}>
          Activar pago automático mensual (PAC)
        </button>
        <a className="btn secondary" href="/feed">Ir al feed</a>
      </div>
      {error ? <p style={{ color: '#fca5a5' }}>{error}</p> : null}
      <p className="small" style={{ marginTop: 12 }}>
        Flujo: el usuario firma el mandato (PAC) una vez, y luego el sistema genera cobros automáticos mensuales.
      </p>
    </div>
  );
}
