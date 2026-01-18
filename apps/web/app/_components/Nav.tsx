'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Me } from '@uzeed/shared';
import { apiFetch } from '../_lib/api';

export function Nav() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    apiFetch<Me>('/me')
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => null);
    setMe(null);
    window.location.href = '/';
  }

  return (
    <div className="nav">
      <Link href="/">UZEED</Link>
      <div className="row">
        <Link href="/feed">Feed</Link>
        {me ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            {me.role === 'ADMIN' ? <Link href="/admin">Admin</Link> : null}
            <button className="btn secondary" onClick={logout} type="button">
              Salir
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Registro</Link>
          </>
        )}
      </div>
    </div>
  );
}
