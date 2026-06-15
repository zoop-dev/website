


const KEY = 'boops';
const PER_IP_PER_MIN = 240;   

export async function onRequestGet({ env }) {
  const n = parseInt(await env.CONFIG.get(KEY), 10) || 0;
  return Response.json({ count: n }, { headers: { 'cache-control': 'no-store' } });
}

export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = await request.json(); } catch { try { body = JSON.parse(await request.text()); } catch {} }
  const want = Math.max(1, parseInt(body && body.n, 10) || 1);

  
  const ip = request.headers.get('CF-Connecting-IP') || 'anon';
  const rlKey = `booprl:${ip}`;
  const used = parseInt(await env.CONFIG.get(rlKey), 10) || 0;
  const allowed = Math.max(0, Math.min(want, PER_IP_PER_MIN - used));

  const cur = parseInt(await env.CONFIG.get(KEY), 10) || 0;
  if (allowed > 0) {
    await env.CONFIG.put(KEY, String(cur + allowed));
    await env.CONFIG.put(rlKey, String(used + allowed), { expirationTtl: 60 });
  }
  return Response.json({ count: cur + allowed, limited: allowed < want }, { headers: { 'cache-control': 'no-store' } });
}
