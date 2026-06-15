


const canHover = () => matchMedia('(hover: hover)').matches;




export function magnetic(root, { gsap, selector, strength = 0.32, onEnter } = {}) {
  if (!gsap || !selector || !canHover()) return;
  (root || document).querySelectorAll(selector).forEach((el) => {
    if (el.dataset.magBound) return;
    el.dataset.magBound = '1';
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    if (onEnter) el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}



export function tilt(el, { max = 9, maxY = 11, lift = 8 } = {}) {
  if (!el || !canHover()) return;
  const glare = el.querySelector('.glare');
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * maxY}deg) translateY(-${lift}px)`;
    if (glare) { glare.style.opacity = '1'; glare.style.setProperty('--gx', `${px * 100}%`); glare.style.setProperty('--gy', `${py * 100}%`); }
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; if (glare) glare.style.opacity = '0'; });
}
