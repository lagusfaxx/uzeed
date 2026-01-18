'use client';

import { useEffect, useState } from 'react';
import type { Me } from '@uzeed/shared';
import { apiFetch } from '../_lib/api';

export default function AdminPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Me>('/me')
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData();
    fd.append('title', title);
    fd.append('body', body);
    if (image) fd.append('image', image);

    try {
      await apiFetch('/posts', { method: 'POST', body: fd });
      setTitle('');
      setBody('');
      setImage(null);
      setMsg('Post creado ✅');
    } catch (err: any) {
      setMsg(err.message || 'Error');
    }
  }

  if (!me) return <div className="card">Debes iniciar sesión.</div>;
  if (me.role !== 'ADMIN') return <div className="card">No autorizado.</div>;

  return (
    <div className="card" style={{ maxWidth: 700 }}>
      <h2 style={{ marginTop: 0 }}>Admin — Crear post</h2>
      <form onSubmit={submit}>
        <div className="label">Título</div>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <div className="label">Texto</div>
        <textarea className="input" value={body} onChange={(e) => setBody(e.target.value)} rows={6} required />
        <div className="label">Imagen (opcional)</div>
        <input className="input" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        <button className="btn" style={{ marginTop: 12 }} type="submit">
          Publicar
        </button>
        {msg ? <p className="small" style={{ marginTop: 12 }}>{msg}</p> : null}
      </form>
    </div>
  );
}
