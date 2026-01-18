'use client';

import { useEffect, useState } from 'react';
import type { PostDto } from '@uzeed/shared';
import { apiFetch } from '../_lib/api';

type PostsResp = { can_view: boolean; posts: PostDto[] };

function PostCard({ post, locked }: { post: PostDto; locked: boolean }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{post.title}</h3>
      <div className={locked ? 'blur' : ''}>
        <p style={{ whiteSpace: 'pre-wrap' }}>{post.body || '—'}</p>
        {post.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_url} alt={post.title} style={{ width: '100%', borderRadius: 12 }} />
        ) : null}
      </div>
      {locked ? (
        <p className="small">
          Contenido bloqueado. <a href="/dashboard">Pagar / Renovar</a>
        </p>
      ) : (
        <p className="small">Publicado: {new Date(post.created_at).toLocaleString()}</p>
      )}
    </div>
  );
}

export default function FeedPage() {
  const [data, setData] = useState<PostsResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PostsResp>('/posts')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="card">Error: {error}</div>;
  if (!data) return <div className="card">Cargando feed...</div>;

  return (
    <div>
      {!data.can_view ? (
        <div className="card" style={{ marginBottom: 14 }}>
          <b>Paywall activo:</b> necesitas membresía para ver el contenido.
          <div style={{ marginTop: 10 }}>
            <a className="btn" href="/dashboard">Comprar acceso</a>
          </div>
        </div>
      ) : null}

      <div className="grid">
        {data.posts.map((p) => (
          <PostCard key={p.id} post={p} locked={!data.can_view} />
        ))}
      </div>
    </div>
  );
}
