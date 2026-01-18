import { env } from './env.js';

const BASE = 'https://payment-api.khipu.com';

export type KhipuCreatePaymentReq = {
  amount: number;
  currency: 'CLP';
  subject: string;
  transaction_id: string;
  return_url: string;
  notify_url: string;
  notify_api_version: '3.0';
  body?: string;
  payer_email?: string;
  payer_name?: string;
};

export type KhipuCreatePaymentRes = {
  payment_id: string;
  payment_url: string;
  simplified_transfer_url: string;
  transfer_url: string;
  app_url: string;
  ready_for_terminal: boolean;
};

export async function khipuCreatePayment(payload: KhipuCreatePaymentReq): Promise<KhipuCreatePaymentRes> {
  if (!env.khipuApiKey) throw new Error('Missing KHIPU_API_KEY');
  const res = await fetch(`${BASE}/v3/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.khipuApiKey
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Khipu create payment failed: ${res.status} ${text}`);
  }
  return (await res.json()) as KhipuCreatePaymentRes;
}

export async function khipuGetPayment(payment_id: string): Promise<any> {
  if (!env.khipuApiKey) throw new Error('Missing KHIPU_API_KEY');
  const res = await fetch(`${BASE}/v3/payments/${encodeURIComponent(payment_id)}`, {
    method: 'GET',
    headers: { 'x-api-key': env.khipuApiKey }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Khipu get payment failed: ${res.status} ${text}`);
  }
  return await res.json();
}
