import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(80).optional()
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const CreatePostSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(5000)
});

export type Role = 'USER' | 'ADMIN';

export type Me = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  membership_expires_at: string | null;
  membership_active: boolean;
  subscription: null | {
    id: string;
    provider_subscription_id: string;
    status: 'PENDING' | 'ENABLED' | 'DISABLED';
    next_charge_at: string | null;
  };
};

export type PostDto = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
  author: { id: string; name: string | null };
};

export type BillingCreateResponse = {
  payment_id: string;
  payment_url: string;
};
