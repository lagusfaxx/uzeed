import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  appUrl: required('APP_URL'),
  apiUrl: required('API_URL'),
  sessionSecret: required('SESSION_SECRET'),
  cookieDomain: process.env.COOKIE_DOMAIN ?? '',
  databaseUrl: required('DATABASE_URL'),

  // Khipu Instant / Automatic Payments
  // - Instant Payments v3 uses x-api-key to create payments.
  // - Automatic Payments v1 ALSO uses x-api-key, but it is a separate product
  //   that may need to be enabled by Khipu.
  khipuApiKey: process.env.KHIPU_API_KEY ?? '',
  // Signature verification for webhooks (x-khipu-signature)
  khipuMerchantSecret: process.env.KHIPU_MERCHANT_SECRET ?? '',

  // Automatic subscription (PAC mandate) flow
  khipuSubscriptionReturnUrl: required('KHIPU_SUBSCRIPTION_RETURN_URL'),
  khipuSubscriptionCancelUrl: required('KHIPU_SUBSCRIPTION_CANCEL_URL'),
  khipuSubscriptionNotifyUrl: required('KHIPU_SUBSCRIPTION_NOTIFY_URL'),
  khipuChargeNotifyUrl: required('KHIPU_CHARGE_NOTIFY_URL'),
  membershipPriceClp: Number(process.env.MEMBERSHIP_PRICE_CLP ?? 1990),
  membershipMaxAmountClp: Number(process.env.KHIPU_MAX_AMOUNT_CLP ?? 30000),

  // Manual payments (kept for fallback / testing)
  khipuReturnUrl: process.env.KHIPU_RETURN_URL ?? '',
  khipuNotifyUrl: process.env.KHIPU_NOTIFY_URL ?? '',
  membershipDays: Number(process.env.MEMBERSHIP_DAYS ?? 30),
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'no-reply@uzeed.cl'
};
