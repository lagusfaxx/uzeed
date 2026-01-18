'use client';

import { useState } from 'react';
import { apiFetch } from '../_lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Error');
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <form onSubmit={onSubmit}>
        <div className="label">Email</div>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <div className="label">Password</div>
        <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        {error ? <p style={{ color: '#fca5a5' }}>{error}</p> : null}
        <button className="btn" type="submit" style={{ marginTop: 12 }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
