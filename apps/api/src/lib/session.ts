import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import { env } from './env.js';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const PgSession = connectPgSimple(session);

const pgPool = new pg.Pool({ connectionString: env.databaseUrl });

export const sessionMiddleware = session({
  name: 'uzeed.sid',
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    domain: env.cookieDomain || undefined,
    maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
  },
  store: new PgSession({
    pool: pgPool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  })
});
