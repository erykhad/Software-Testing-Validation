import bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'node:crypto';
import type { AppContext } from '../context.js';
import type { RegisterInput, LoginInput } from '../domain/schemas.js';
import { HttpError } from '../errors.js';
import type { SessionUser } from '../repositories/sessions.js';

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const DUMMY_HASH = bcrypt.hashSync('dummy-password-not-used', 10);

function publicUser(user: { id: string; email: string; displayName: string }): SessionUser {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

function issueSession(ctx: AppContext, userId: string, now: Date) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(now.getTime() + SESSION_MS).toISOString();
  ctx.sessions.insert(token, userId, expiresAt);
  return { token, expiresAt };
}

export function createAuthService(ctx: AppContext, bcryptRounds: number) {
  return {
    register(input: RegisterInput) {
      const email = input.email.toLowerCase();
      if (ctx.users.findByEmail(email)) {
        throw new HttpError(409, 'Konto z tym adresem e-mail już istnieje');
      }
      const now = new Date();
      const user = {
        id: randomUUID(),
        email,
        displayName: input.displayName,
        passwordHash: bcrypt.hashSync(input.password, bcryptRounds),
        createdAt: now.toISOString(),
      };
      ctx.users.insert(user);
      const session = issueSession(ctx, user.id, now);
      return { user: publicUser(user), token: session.token };
    },
    login(input: LoginInput) {
      const email = input.email.toLowerCase();
      const user = ctx.users.findByEmail(email);
      const hash = user?.passwordHash ?? DUMMY_HASH;
      const matches = bcrypt.compareSync(input.password, hash);
      if (!user || !matches) {
        throw new HttpError(401, 'Nieprawidłowy e-mail lub hasło');
      }
      const now = new Date();
      ctx.sessions.deleteExpired(now.toISOString());
      const session = issueSession(ctx, user.id, now);
      return { user: publicUser(user), token: session.token };
    },
    logout(token: string | undefined) {
      if (token) ctx.sessions.delete(token);
    },
  };
}
