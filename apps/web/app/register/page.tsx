'use client';

import { useState } from 'react';
import { apiFetch } from '../_lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name })
      });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Error');
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2 style={{ marginTop: 0 }}>Registro</h2>
      <form onSubmit={onSubmit}>
        <div className="label">Nombre (opcional)</div>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="label">Email</div>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <div className="label">Password (mín 8)</div>
        <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        {error ? <p style={{ color: '#fca5a5' }}>{error}</p> : null}
        <button className="btn" type="submit" style={{ marginTop: 12 }}>
          Crear cuenta
        </button>
      </form>
    </div>
  );
}
