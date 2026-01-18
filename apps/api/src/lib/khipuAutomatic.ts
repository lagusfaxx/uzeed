import { env } from './env.js';

const BASE = 'https://payment-api.khipu.com';

export type KhipuCreateSubscriptionReq = {
  name: string;
  email: string;
  max_amount: number;
  currency: 'CLP';
  notify_url: string;
  return_url: string;
  cancel_url: string;
  service_reference?: string;
  image_url?: string;
  description?: string;
};

export type KhipuCreateSubscriptionRes = {
  subscription_id: string;
  redirect_url: string;
};

export async function khipuCreateSubscription(payload: KhipuCreateSubscriptionReq): Promise<KhipuCreateSubscriptionRes> {
  if (!env.khipuApiKey) throw new Error('Missing KHIPU_API_KEY');
  const res = await fetch(`${BASE}/v1/automatic-payment/subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.khipuApiKey
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Khipu create subscription failed: ${res.status} ${text}`);
  }
  return (await res.json()) as KhipuCreateSubscriptionRes;
}

export async function khipuGetSubscription(subscription_id: string): Promise<any> {
  if (!env.khipuApiKey) throw new Error('Missing KHIPU_API_KEY');
  const res = await fetch(`${BASE}/v1/automatic-payment/subscription/${encodeURIComponent(subscription_id)}`, {
    method: 'GET',
    headers: { 'x-api-key': env.khipuApiKey }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Khipu get subscription failed: ${res.status} ${text}`);
  }
  return await res.json();
}

export type KhipuCreateChargeIntentReq = {
  subscription_id: string;
  amount: number;
  subject: string;
  body: string;
  error_response_url: string;
  custom: string;
  transaction_id: string;
  notify_url: string;
  notify_api_version?: string;
};

export type KhipuCreateChargeIntentRes = {
  payment_id: string;
};

export async function khipuCreateChargeIntent(payload: KhipuCreateChargeIntentReq): Promise<KhipuCreateChargeIntentRes> {
  if (!env.khipuApiKey) throw new Error('Missing KHIPU_API_KEY');
  const res = await fetch(`${BASE}/v1/automatic-payment/charge-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.khipuApiKey
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Khipu create charge-intent failed: ${res.status} ${text}`);
  }
  return (await res.json()) as KhipuCreateChargeIntentRes;
}
