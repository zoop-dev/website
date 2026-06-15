
import { setCookieHeader } from '../_auth.js';

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json', 'Set-Cookie': setCookieHeader('', 0) },
  });
}
