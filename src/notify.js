


class Notify {
  constructor() {
    this.lastAt = 0;
    this.fired = new Set();   
    let saved = 'off';
    try { saved = localStorage.getItem('zoop-notify') || 'off'; } catch {}
    this.wanted = saved === 'on';
  }

  get supported() { return typeof window !== 'undefined' && 'Notification' in window; }
  get permission() { return this.supported ? Notification.permission : 'denied'; }
  get on() { return this.wanted && this.permission === 'granted'; }

  async enable() {
    if (!this.supported) return 'unsupported';
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    this.wanted = perm === 'granted';
    try { localStorage.setItem('zoop-notify', this.wanted ? 'on' : 'off'); } catch {}
    return perm; 
  }

  disable() {
    this.wanted = false;
    try { localStorage.setItem('zoop-notify', 'off'); } catch {}
  }

  
  push(body, opts = {}) {
    if (!this.on) return;
    if (opts.once) { if (this.fired.has(opts.once)) return; this.fired.add(opts.once); }
    const now = Date.now();
    if (!opts.once && now - this.lastAt < (opts.minGap || 8000)) return;
    this.lastAt = now;
    try {
      new Notification(opts.title || 'zoop', {
        body,
        icon: '/icon-192.png',
        badge: '/favicon-48.png',
        silent: opts.silent !== false,
        tag: opts.tag || 'zoop',
      });
    } catch {}
  }
}

export const notify = new Notify();
