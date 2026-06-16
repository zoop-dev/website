











const DEFAULT_SPRING = { stiff: 150, damp: 22 };

export function anima(canvas, { inputs = {}, draw, spring = DEFAULT_SPRING, autoplay = true } = {}) {
  const ctx = canvas.getContext('2d');
  const keys = Object.keys(inputs);
  const v = {}, vel = {}, tgt = {};          
  for (const k of keys) { v[k] = vel[k] = 0; v[k] = tgt[k] = inputs[k]; vel[k] = 0; }

  let dpr = 1, w = 1, h = 1, raf = 0, last = 0, visible = true, running = false;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { threshold: 0 });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden && visible) start(); else stop(); };
  document.addEventListener('visibilitychange', onVis);

  function frame(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    for (const k of keys) {                  
      const a = spring.stiff * (tgt[k] - v[k]) - spring.damp * vel[k];
      vel[k] += a * dt; v[k] += vel[k] * dt;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    draw(ctx, v, now / 1000, w, h);
    raf = (visible && !document.hidden) ? requestAnimationFrame(frame) : (running = false, 0);
  }
  function start() { if (running || document.hidden || !visible) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  if (autoplay) start();

  return {
    set(p) { for (const k in p) if (k in tgt) tgt[k] = p[k]; start(); },          
    snap(p) { for (const k in p) if (k in v) { v[k] = tgt[k] = p[k]; vel[k] = 0; } }, 
    canvas, start, stop,
    destroy() { stop(); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); },
  };
}
