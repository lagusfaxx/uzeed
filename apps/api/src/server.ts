import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import argon2 from 'argon2';
import cron from 'node-cron';

import { env } from './lib/env.js';
import { prisma } from './lib/prisma.js';
import { sessionMiddleware } from './lib/session.js';
import { requireAuth, requireAdmin } from './lib/authz.js';
import { RegisterSchema, LoginSchema, CreatePostSchema } from '@uzeed/shared';
import { khipuCreatePayment, khipuGetPayment } from './lib/khipu.js';
import { khipuCreateSubscription, khipuGetSubscription, khipuCreateChargeIntent } from './lib/khipuAutomatic.js';
import { verifyKhipuSignature } from './lib/khipuWebhookVerify.js';
import { sendEmail } from './lib/mailer.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.appUrl,
    credentials: true
  })
);

app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(sessionMiddleware);
app.use(express.json());

// uploads
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      const name = `${crypto.randomUUID()}${ext}`;
      cb(null, name);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function membershipActive(user: { membership_expires_at: Date | null }) {
  return !!user.membership_expires_at && user.membership_expires_at.getTime() > Date.now();
}

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// AUTH
app.post('/auth/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password, name } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const password_hash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), name: name ?? null, password_hash }
  });

  req.session.userId = user.id;
  res.json({ ok: true });
});

app.post('/auth/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await argon2.verify(user.password_hash, password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.userId = user.id;
  res.json({ ok: true });
});

app.post('/auth/logout', async (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.clearCookie('uzeed.sid');
    res.json({ ok: true });
  });
});

app.get('/me', requireAuth, async (req, res) => {
  const user = (req as any).user as any;
  const sub = await prisma.subscription.findFirst({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' }
  });
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    membership_expires_at: user.membership_expires_at,
    membership_active: membershipActive(user)
    ,
    subscription: sub
      ? {
          id: sub.id,
          provider_subscription_id: sub.provider_subscription_id,
          status: sub.status,
          next_charge_at: sub.next_charge_at
        }
      : null
  });
});

// POSTS
app.get('/posts', async (req, res) => {
  const userId = req.session.userId;
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const canView = user ? membershipActive(user) : false;

  const posts = await prisma.post.findMany({
    orderBy: { created_at: 'desc' },
    include: { author: { select: { id: true, name: true } } }
  });

  // If cannot view, keep title but hide body and image_url
  const sanitized = posts.map((p) => ({
    id: p.id,
    title: p.title,
    body: canView ? p.body : '',
    image_url: canView ? p.image_url : null,
    created_at: p.created_at,
    author: p.author
  }));

  res.json({ can_view: canView, posts: sanitized });
});

app.post('/posts', requireAdmin, upload.single('image'), async (req, res) => {
  const parsed = CreatePostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = (req as any).user as any;

  const file = (req as any).file as { filename: string } | undefined;
  const image_url = file ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}` : null;

  const post = await prisma.post.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      image_url,
      author_id: user.id
    }
  });

  res.json({ ok: true, post });
});

// BILLING - create payment
app.post('/billing/khipu/create-payment', requireAuth, async (req, res) => {
  const user = (req as any).user as any;

  const transaction_id = crypto.randomUUID();

  const payload = {
    amount: env.membershipPriceClp,
    currency: 'CLP' as const,
    subject: 'Acceso mensual',
    body: `Acceso por ${env.membershipDays} días`,
    transaction_id,
    return_url: `${env.khipuReturnUrl}?transaction_id=${encodeURIComponent(transaction_id)}`,
    notify_url: env.khipuNotifyUrl,
    notify_api_version: '3.0' as const,
    payer_email: user.email
  };

  const khipu = await khipuCreatePayment(payload);

  await prisma.payment.create({
    data: {
      user_id: user.id,
      provider_payment_id: khipu.payment_id,
      status: 'PENDING',
      amount: env.membershipPriceClp,
      currency: 'CLP',
      transaction_id
    }
  });

  res.json({ payment_id: khipu.payment_id, payment_url: khipu.payment_url, transaction_id });
});

// BILLING - create automatic subscription (PAC mandate)
app.post('/billing/khipu/create-subscription', requireAuth, async (req, res) => {
  const user = (req as any).user as any;

  // If user already has an enabled subscription, return it.
  const existing = await prisma.subscription.findFirst({
    where: { user_id: user.id, status: 'ENABLED' },
    orderBy: { created_at: 'desc' }
  });
  if (existing) {
    return res.json({ ok: true, already: true, subscription_id: existing.provider_subscription_id });
  }

  const payload = {
    name: `UZEED Membership ${user.id}`,
    email: user.email,
    max_amount: env.membershipMaxAmountClp,
    currency: 'CLP' as const,
    notify_url: env.khipuSubscriptionNotifyUrl,
    return_url: env.khipuSubscriptionReturnUrl,
    cancel_url: env.khipuSubscriptionCancelUrl
  };

  const r = await khipuCreateSubscription(payload);

  await prisma.subscription.create({
    data: {
      user_id: user.id,
      provider_subscription_id: r.subscription_id,
      status: 'PENDING',
      max_amount: env.membershipMaxAmountClp,
      currency: 'CLP'
    }
  });

  return res.json({ ok: true, subscription_id: r.subscription_id, redirect_url: r.redirect_url });
});

// BILLING status
app.get('/billing/status', requireAuth, async (req, res) => {
  const user = (req as any).user as any;
  const payment_id = (req.query.payment_id as string | undefined) ?? undefined;
  const transaction_id = (req.query.transaction_id as string | undefined) ?? undefined;

  if (!payment_id && !transaction_id) return res.status(400).json({ error: 'payment_id or transaction_id required' });

  const payment = await prisma.payment.findFirst({
    where: {
      user_id: user.id,
      ...(payment_id ? { provider_payment_id: payment_id } : {}),
      ...(transaction_id ? { transaction_id } : {})
    }
  });

  if (!payment) return res.status(404).json({ error: 'Not found' });

  const freshUser = await prisma.user.findUnique({ where: { id: user.id } });

  res.json({
    payment: {
      provider_payment_id: payment.provider_payment_id,
      transaction_id: payment.transaction_id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paid_at: payment.paid_at
    },
    membership_expires_at: freshUser?.membership_expires_at,
    membership_active: freshUser ? membershipActive(freshUser) : false
  });
});

// KHIPU webhook (raw body)
app.post(
  '/billing/khipu/notify',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const rawBody = req.body as Buffer;
      verifyKhipuSignature(rawBody, req.header('x-khipu-signature') ?? undefined);

      const event = JSON.parse(rawBody.toString('utf8')) as any;
      const payment_id = event.payment_id as string | undefined;
      const transaction_id = event.transaction_id as string | undefined;

      if (!payment_id) return res.status(400).json({ error: 'Missing payment_id' });

      const payment = await prisma.payment.findUnique({ where: { provider_payment_id: payment_id } });
      if (!payment) {
        // Not ours (or DB not ready). Still ack to avoid retries.
        return res.status(200).json({ ok: true });
      }

      if (payment.status === 'PAID') return res.status(200).json({ ok: true });

      // Server-to-server validation (required): query payment
      await khipuGetPayment(payment_id);

      const paidAt = new Date();
      const expires = new Date(Date.now() + env.membershipDays * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.payment.update({
          where: { provider_payment_id: payment_id },
          data: { status: 'PAID', paid_at: paidAt }
        }),
        prisma.user.update({
          where: { id: payment.user_id },
          data: { membership_expires_at: expires }
        })
      ]);

      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error('notify error:', err?.message ?? err);
      // Respond 200 only if you don't want retries. Here we use 400 to encourage retry on transient issues.
      return res.status(400).json({ error: 'Invalid notification' });
    }
  }
);

// KHIPU Automatic Payments: subscription notify (PAC mandate result)
// Docs: notify_url receives { subscription_id, status } where status can be "enabled" or "disabled".
app.post(
  '/billing/khipu/subscription-notify',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const rawBody = req.body as Buffer;
      // Khipu webhooks may include x-khipu-signature; we require it when configured.
      verifyKhipuSignature(rawBody, req.header('x-khipu-signature') ?? undefined);

      const payload = JSON.parse(rawBody.toString('utf8')) as any;
      const subscription_id = payload.subscription_id as string | undefined;
      const status = payload.status as string | undefined;

      if (!subscription_id || !status) return res.status(400).json({ error: 'Missing subscription_id/status' });

      const sub = await prisma.subscription.findUnique({ where: { provider_subscription_id: subscription_id } });
      if (!sub) return res.status(200).json({ ok: true });

      // Server-to-server validation: confirm current status from Khipu.
      const remote = await khipuGetSubscription(subscription_id);
      const remoteStatus = (remote?.status ?? status) as string;

      if (remoteStatus === 'enabled') {
        const now = new Date();

        // Enable subscription + grant membership immediately.
        const expires = new Date(now.getTime() + env.membershipDays * 24 * 60 * 60 * 1000);

        await prisma.$transaction([
          prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'ENABLED', enabled_at: now, disabled_at: null, next_charge_at: now }
          }),
          prisma.user.update({
            where: { id: sub.user_id },
            data: { membership_expires_at: expires }
          })
        ]);

        // Create the first charge intent immediately (optional but recommended for "auto mensual").
        const transaction_id = `AUTO-${crypto.randomUUID()}`;
        const charge = await khipuCreateChargeIntent({
          subscription_id,
          amount: env.membershipPriceClp,
          subject: 'Membresía mensual UZEED',
          body: `Cobro automático membresía por ${env.membershipDays} días`,
          error_response_url: `${env.apiUrl}/billing/khipu/charge-error`,
          custom: sub.user_id,
          transaction_id,
          notify_url: env.khipuChargeNotifyUrl,
          notify_api_version: '3.0'
        });

        await prisma.payment.create({
          data: {
            user_id: sub.user_id,
            subscription_id: sub.id,
            kind: 'AUTO_CHARGE',
            provider_payment_id: charge.payment_id,
            status: 'PENDING',
            amount: env.membershipPriceClp,
            currency: 'CLP',
            transaction_id
          }
        });
      } else {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'DISABLED', disabled_at: new Date(), next_charge_at: null }
        });
      }

      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error('subscription-notify error:', err?.message ?? err);
      return res.status(400).json({ error: 'Invalid notification' });
    }
  }
);

// Optional: charge error callback
app.post('/billing/khipu/charge-error', express.json(), async (req, res) => {
  console.warn('khipu charge error callback', req.body);
  return res.status(200).json({ ok: true });
});

// KHIPU Automatic Payments: charge notify
app.post(
  '/billing/khipu/charge-notify',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const rawBody = req.body as Buffer;
      verifyKhipuSignature(rawBody, req.header('x-khipu-signature') ?? undefined);

      const payload = JSON.parse(rawBody.toString('utf8')) as any;
      const payment_id = (payload.payment_id ?? payload.paymentId ?? payload.id) as string | undefined;
      const transaction_id = payload.transaction_id as string | undefined;

      if (!payment_id) return res.status(400).json({ error: 'Missing payment_id' });

      const payment = await prisma.payment.findUnique({ where: { provider_payment_id: payment_id } });
      if (!payment) return res.status(200).json({ ok: true });
      if (payment.status === 'PAID') return res.status(200).json({ ok: true });

      const now = new Date();

      // Extend membership from current expiry (if still active) else from now
      const u = await prisma.user.findUnique({ where: { id: payment.user_id } });
      const base = u?.membership_expires_at && u.membership_expires_at.getTime() > now.getTime() ? u.membership_expires_at : now;
      const expires = new Date(base.getTime() + env.membershipDays * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.payment.update({
          where: { provider_payment_id: payment_id },
          data: { status: 'PAID', paid_at: now, transaction_id: transaction_id ?? payment.transaction_id }
        }),
        prisma.user.update({ where: { id: payment.user_id }, data: { membership_expires_at: expires } }),
        ...(payment.subscription_id
          ? [
              prisma.subscription.update({
                where: { id: payment.subscription_id },
                data: { next_charge_at: new Date(now.getTime() + env.membershipDays * 24 * 60 * 60 * 1000) }
              })
            ]
          : [])
      ]);

      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error('charge-notify error:', err?.message ?? err);
      return res.status(400).json({ error: 'Invalid notification' });
    }
  }
);

// CRON - automatic monthly charges (runs hourly)
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const due = await prisma.subscription.findMany({
      where: {
        status: 'ENABLED',
        next_charge_at: { not: null, lte: now }
      },
      take: 50
    });

    for (const sub of due) {
      // Avoid duplicate charges: if there's a pending payment created recently, skip
      const pending = await prisma.payment.findFirst({
        where: {
          subscription_id: sub.id,
          status: 'PENDING',
          kind: 'AUTO_CHARGE',
          created_at: { gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) }
        }
      });
      if (pending) continue;

      const transaction_id = `AUTO-${crypto.randomUUID()}`;
      const charge = await khipuCreateChargeIntent({
        subscription_id: sub.provider_subscription_id,
        amount: env.membershipPriceClp,
        subject: 'Membresía mensual UZEED',
        body: `Cobro automático membresía por ${env.membershipDays} días`,
        error_response_url: `${env.apiUrl}/billing/khipu/charge-error`,
        custom: sub.user_id,
        transaction_id,
        notify_url: env.khipuChargeNotifyUrl,
        notify_api_version: '3.0'
      });

      await prisma.payment.create({
        data: {
          user_id: sub.user_id,
          subscription_id: sub.id,
          kind: 'AUTO_CHARGE',
          provider_payment_id: charge.payment_id,
          status: 'PENDING',
          amount: env.membershipPriceClp,
          currency: 'CLP',
          transaction_id
        }
      });

      // Move next charge window forward proactively to avoid double charging
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { next_charge_at: new Date(now.getTime() + env.membershipDays * 24 * 60 * 60 * 1000) }
      });
    }
  } catch (e) {
    console.error('auto-charge cron error', e);
  }
});

// CRON - reminders 3 days before expiry
cron.schedule('0 9 * * *', async () => {
  try {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        membership_expires_at: {
          gte: new Date(threeDays.getTime() - 12 * 60 * 60 * 1000),
          lte: new Date(threeDays.getTime() + 12 * 60 * 60 * 1000)
        }
      }
    });

    for (const u of users) {
      const html = `
        <p>Hola${u.name ? ' ' + u.name : ''},</p>
        <p>Tu membresía en UZEED vence pronto (${u.membership_expires_at?.toISOString().slice(0, 10)}).</p>
        <p><a href="${env.appUrl}/dashboard">Renovar ahora</a></p>
      `;
      await sendEmail(u.email, 'Recordatorio: tu membresía vence pronto', html);
    }
  } catch (e) {
    console.error('cron error', e);
  }
});

app.listen(env.port, () => {
  console.log(`API listening on :${env.port}`);
});
