



export const defaultConfig = {
  accent: '#2bb8ff',
  email: 'hi@zachy.cc',
  heroStyle: 'glass',   
  meta: {
    title: 'zoop — interactive developer & designer',
    description: 'zoop makes interactive, real-time websites. Sometimes weird, always fast.',
  },
  nav: {
    cta: "Let's talk",
    links: [
      { label: 'Work', href: '#work' },
      { label: 'About', href: '#about' },
      { label: 'Play', href: '#play' },
    ],
  },
  title: {
    enabled: true,
    interludes: true, 
    phrases: ['zoop', 'I make weird websites', 'go on, poke the blob', 'caffeine & shaders', 'real-time everything', 'still here, btw', '{email}'],
  },
  hero: {
    metaL: ['Independent', 'Professional tinkerer'],
    metaR: ['Est. whenever', 'Mostly caffeine'],
    line1: 'I make', em: 'weird', line3: 'websites.',
    
    sub: 'The kind that go *woosh*, *bloop*, and occasionally *whoa*. Real-time, interactive, and running on way too many shaders.',
  },
  marquee: ['WebGL', 'Shaders', 'Three.js', 'Motion', 'Creative Dev'],
  work: { title: 'Selected Work', hint: 'Scroll →' },
  about: {
    lead: "I'm zoop. I got way too into making pixels move, so now I build fast, interactive websites with way too many shaders.",
    columns: [
      { title: 'Things I do', items: ['WebGL / GLSL', 'Three.js / R3F', 'Creative direction', 'Motion design', 'Aggressive console.logging'] },
      { title: 'Bragging rights', items: ['Awwwards · SOTD', 'FWA of the Day', 'CSS Design Awards', 'Mom-approved ✓'] },
      { title: 'The vibe', text: 'Every pixel intentional, every frame at 60fps, every animation slightly unnecessary. I treat the browser as a playground and performance as a personality trait.' },
    ],
  },
  stats: [
    { value: 12, label: 'Shipped experiences', format: 'plain' },
    { value: 60, label: 'Frames per second, always', format: 'plain' },
    { value: 4200000, label: 'Pixels pushed (give or take)', format: 'compact' },
    { value: '∞', label: 'Cups of coffee', format: 'none' },
  ],
  play: {
    heading: 'Move\nyour cursor.',
    copy: 'A real-time ink simulation that reacts to your every move. Drag to shove the fluid around and watch it swirl, curl and dissolve. Weirdly satisfying.',
  },
  contact: { line1: "Let's make", em: 'something', line3: 'together.' },
  footer: { left: '© 2026 zoop · made with caffeine & shaders', mid: 'No designers were harmed' },
  onboarding: {
    hi: 'welcome to',
    title: 'zoop', em: '.',
    sub: 'a couple optional extras. you can change em anytime up top.',
    soundLabel: 'sound', soundDesc: 'blips, bloops & flowing water',
    notifLabel: 'notifs', notifDesc: 'the occasional friendly nudge',
    enter: 'enter →',
  },
  projectsPage: { title: "Everything\nI've made." },
  socials: [
    { label: 'Twitter / X', url: '#' },
    { label: 'GitHub', url: '#' },
    { label: 'Dribbble', url: '#' },
    { label: 'LinkedIn', url: '#' },
  ],
  
  projects: [
    { id: 'aurora', name: 'Aurora Engine', tag: 'Real-time GPU fluid', description: 'A from-scratch GPU fluid solver — millions of particles advected on the graphics card, tuned to stay buttery at 60fps.', year: '2026', stack: 'WebGL, GLSL, TypeScript', accent: '#2bb8ff', url: '#', pinned: true },
    { id: 'monolith', name: 'Monolith', tag: 'Immersive brand site', description: 'A single-page brand experience built around one bold 3D centerpiece and a scroll that actually tells a story.', year: '2025', stack: 'Three.js, GSAP, Lenis', accent: '#7a5cff', url: '#', pinned: true },
    { id: 'drift', name: 'Drift / OS', tag: '3D product configurator', description: 'Spin, customize and price a product in real time, right in the browser — no plugins, no waiting.', year: '2025', stack: 'R3F, Blender, Zustand', accent: '#2bd8ff', url: '#', pinned: true },
    { id: 'halcyon', name: 'Halcyon', tag: 'Generative audio-visual', description: 'A generative piece where sound drives the visuals and no two visits ever look the same.', year: '2024', stack: 'Shaders, Web Audio', accent: '#ff9a4a', url: '#', pinned: false },
    { id: 'vellum', name: 'Vellum', tag: 'Editorial reading engine', description: 'A reading engine that treats long-form text like a designed object — typographic, paginated, quietly animated.', year: '2024', stack: 'Canvas, WebGL', accent: '#4ad6a0', url: '#', pinned: false },
    { id: 'pulse', name: 'Pulse', tag: 'Live data dashboard', description: 'A live dashboard streaming thousands of events a second into a calm, legible interface.', year: '2023', stack: 'D3, Workers, D1', accent: '#ff5c8a', url: '#', pinned: false },
  ],
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const arr = (v, d) => (Array.isArray(v) && v.length ? v : d);
const merge = (base, over) => (isObj(over) ? { ...base, ...over } : base);



export function normalizeConfig(raw) {
  const c = isObj(raw) ? raw : {};
  const d = defaultConfig;
  return {
    accent: c.accent || d.accent,
    email: c.email || d.email,
    heroStyle: c.heroStyle === 'blob' ? 'blob' : 'glass',
    meta: merge(d.meta, c.meta),
    nav: { cta: (c.nav && c.nav.cta) || d.nav.cta, links: arr(c.nav && c.nav.links, d.nav.links) },
    title: {
      enabled: c.title && c.title.enabled === false ? false : true,
      interludes: c.title && c.title.interludes === false ? false : true,
      phrases: arr(c.title && c.title.phrases, d.title.phrases),
    },
    hero: merge(d.hero, {
      ...c.hero,
      metaL: arr(c.hero && c.hero.metaL, d.hero.metaL),
      metaR: arr(c.hero && c.hero.metaR, d.hero.metaR),
    }),
    marquee: arr(c.marquee, d.marquee),
    work: merge(d.work, c.work),
    about: {
      lead: (c.about && c.about.lead) || d.about.lead,
      columns: arr(c.about && c.about.columns, d.about.columns),
    },
    stats: arr(c.stats, d.stats),
    play: merge(d.play, c.play),
    contact: merge(d.contact, c.contact),
    footer: merge(d.footer, c.footer),
    projectsPage: merge(d.projectsPage, c.projectsPage),
    onboarding: merge(d.onboarding, c.onboarding),
    socials: Array.isArray(c.socials) ? c.socials : d.socials,
    projects: arr(c.projects, d.projects),
  };
}
