
import { makeToken, setCookieHeader, safeEqual } from '../_auth.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) {
    return new Response('Server not configured: set the ADMIN_PASSWORD secret.', { status: 500 });
  }
  let body;
  try { body = await request.json(); } catch { return new Response('Invalid request', { status: 400 }); }
  const password = body && typeof body.password === 'string' ? body.password : '';
  if (!safeEqual(password, env.ADMIN_PASSWORD)) {
    return new Response('Wrong password', { status: 401 });
  }
  const token = await makeToken(env.ADMIN_PASSWORD);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'Set-Cookie': setCookieHeader(token, 60 * 60 * 24 * 7) },
  });
}
