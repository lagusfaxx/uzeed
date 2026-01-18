import type { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ error: 'Unauthenticated' });
  (req as any).user = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    const user = (req as any).user as { role: string };
    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    next();
  });
}
