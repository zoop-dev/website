

import { isAuthed } from '../_auth.js';

const KEY = 'site';
const MAX_BYTES = 200_000;

export async function onRequestGet({ env }) {
  const cfg = await env.CONFIG.get(KEY, 'json');
  return Response.json(cfg || {}, {
    headers: { 'cache-control': 'public, max-age=30, s-maxage=30' },
  });
}

export async function onRequestPut({ request, env }) {
  if (!(await isAuthed(request, env))) return new Response('Unauthorized', { status: 401 });
  let body;
  try { body = await request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return new Response('Expected an object', { status: 400 });
  const str = JSON.stringify(body);
  if (str.length > MAX_BYTES) return new Response('Config too large', { status: 413 });
  await env.CONFIG.put(KEY, str);
  return Response.json({ ok: true });
}
