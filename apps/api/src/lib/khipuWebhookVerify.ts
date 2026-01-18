import crypto from 'crypto';
import { env } from './env.js';

export function verifyKhipuSignature(rawBody: Buffer, signatureHeader: string | undefined) {
  if (!env.khipuMerchantSecret) throw new Error('Missing KHIPU_MERCHANT_SECRET');
  if (!signatureHeader) throw new Error('Missing x-khipu-signature');

  // format: t=171...,s=Base64==
  const parts = signatureHeader.split(',').map((p) => p.trim());
  let t: string | null = null;
  let s: string | null = null;
  for (const part of parts) {
    const [k, ...rest] = part.split('=');
    const v = rest.join('=');
    if (k === 't') t = v;
    if (k === 's') s = v;
  }
  if (!t || !s) throw new Error('Invalid x-khipu-signature');

  const toHash = `${t}.${rawBody.toString('utf8')}`;
  const hmac = crypto.createHmac('sha256', env.khipuMerchantSecret);
  hmac.update(toHash, 'utf8');
  const expected = hmac.digest('base64');

  const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s));
  if (!ok) throw new Error('Invalid signature');

  // Optional replay protection (5 min window)
  const now = Date.now();
  const ts = Number(t);
  if (!Number.isFinite(ts)) throw new Error('Invalid timestamp');
  const diff = Math.abs(now - ts);
  if (diff > 5 * 60 * 1000) throw new Error('Stale signature timestamp');

  return true;
}
