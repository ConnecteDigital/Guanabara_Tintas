import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

/* ---------- store open / closed (Bahia time) ---------- */
function storeStatus() {
  const el = $('#store-status');
  if (!el) return;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bahia',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const minutes = (Number(get('hour')) % 24) * 60 + Number(get('minute'));
  const close = day === 0 ? 0 : day === 6 ? 13 * 60 : 18 * 60;
  const open = day !== 0 && minutes >= 8 * 60 && minutes < close;
  el.hidden = false;
  el.classList.toggle('is-open', open);
  $('.store__status-text', el)!.textContent = open
    ? `Aberto agora · fecha às ${close / 60}h`
    : day === 6 && minutes >= close
      ? 'Fechado agora · abre segunda às 8h'
      : day === 0
        ? 'Fechado agora · abre segunda às 8h'
        : minutes < 8 * 60
          ? 'Fechado agora · abre hoje às 8h'
          : `Fechado agora · abre ${day === 5 ? 'sábado' : 'amanhã'} às 8h`;
  $(`.hours tr[data-day="${day}"]`)?.classList.add('is-today');
}
storeStatus();

/* ---------- header: solid after the hero, hidden while scrolling down ---------- */
const header = $('#header');
let lastY = 0;
function onScrollHeader(y: number) {
  if (!header) return;
  header.classList.toggle('is-solid', y > 40);
  header.classList.toggle('is-hidden', y > lastY && y > 300);
  lastY = y;
}

/* ---------- reduced motion: show everything, no smooth scroll ---------- */
if (reduceMotion) {
  $('#intro')?.remove();
  addEventListener('scroll', () => onScrollHeader(scrollY), { passive: true });
} else {
  init();
}

function init() {
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  lenis.on('scroll', ({ scroll }: { scroll: number }) => onScrollHeader(scroll));
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // in-page anchors go through Lenis so they glide like the rest of the scroll
  $$<HTMLAnchorElement>('a[href*="#"]').forEach((a) => {
    const url = new URL(a.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    a.addEventListener('click', (e) => {
      const target = $(url.hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70 });
    });
  });

  heroIntroState();
  const intro = $('#intro');
  if (intro) playIntro(intro, lenis);
  else heroIn();

  sections();
}

/* ---------- intro: paint can → splash → page ---------- */
// not every page has every hero part, so only tween what exists
const heroParts = () => ({ text: $$('[data-hero]'), photo: $$('[data-hero-photo]'), chip: $$('[data-hero-chip]') });

function heroIntroState() {
  const { text, photo, chip } = heroParts();
  if (text.length) gsap.set(text, { y: 60, opacity: 0 });
  if (photo.length || chip.length) gsap.set([...photo, ...chip], { scale: 0.85, opacity: 0 });
}

function heroIn() {
  const { text, photo, chip } = heroParts();
  if (text.length) gsap.to(text, { y: 0, opacity: 1, duration: 1, stagger: 0.09, ease: 'power3.out' });
  if (photo.length) gsap.to(photo, { scale: 1, opacity: 1, duration: 1.3, ease: 'expo.out', delay: 0.15 });
  if (chip.length) gsap.to(chip, { scale: 1, opacity: 1, duration: 1.1, ease: 'back.out(1.7)', delay: 0.45 });
  $('.paint-word')?.classList.add('is-painted');
}

function playIntro(intro: HTMLElement, lenis: Lenis) {
  let seen = false;
  try {
    seen = sessionStorage.getItem('gt-intro') === '1';
  } catch {}
  const finish = () => {
    intro.remove();
    lenis.start();
    ScrollTrigger.refresh();
  };
  if (seen) {
    finish();
    heroIn();
    return;
  }

  lenis.stop();
  scrollTo(0, 0);
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    heroIn();
  };
  $('.intro__skip', intro)?.addEventListener('click', () => intro.dispatchEvent(new Event('intro:skip')));

  import('./intro')
    .then(({ runIntro }) => runIntro(intro, reveal))
    .catch((err) => console.warn('Intro indisponível', err))
    .finally(() => {
      try {
        sessionStorage.setItem('gt-intro', '1');
      } catch {}
      reveal();
      finish();
    });
}

/* ---------- scroll-driven sections ---------- */
function sections() {
  const mm = gsap.matchMedia();

  // hero parallax while it leaves the screen
  if ($('.hero__chip')) {
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } })
      .to('.hero__copy', { y: -120, ease: 'none' }, 0)
      .to('.hero__photo img', { scale: 1.18, ease: 'none' }, 0)
      .to('.hero__chip', { y: -160, rotate: -8, ease: 'none' }, 0)
      .to('.hero__blob', { scale: 1.35, rotate: 25, ease: 'none' }, 0);
  }

  // paint drips stretch as each section edge passes
  $$('.drip').forEach((drip) => {
    gsap.fromTo(
      drip,
      { scaleY: 0.25 },
      { scaleY: 1, ease: 'none', scrollTrigger: { trigger: drip, start: 'top bottom', end: 'top 35%', scrub: 0.4 } },
    );
  });

  // generic reveals
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out' }),
  });

  // categories are painted in like a roller stroke
  ScrollTrigger.batch('[data-cat]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(
        els,
        { clipPath: 'inset(0% 100% 0% 0% round 28px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.1, stagger: 0.12, ease: 'power4.inOut' },
      ),
  });

  // photos uncover top to bottom
  $$('[data-clip]').forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } },
    );
  });

  marquees();
  colorMachine(mm);
  productsRail(mm);
  gallery();

  // pins are created after triggers that sit below them on the page, so refresh in page order
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

/* Brand marquee: loops forever, speeds up and flips with the scroll direction. */
function marquees() {
  const loops = $$('[data-marquee]').map((el) => {
    const dir = Number(el.dataset.marquee);
    const track = $('.marquee__track', el)!;
    gsap.set(track, { xPercent: dir > 0 ? 0 : -50 });
    const loop = gsap.to(track, { xPercent: dir > 0 ? -50 : 0, duration: 38, ease: 'none', repeat: -1 });
    // start deep into the repeats so a negative timeScale never hits time 0 and stalls
    loop.totalTime(loop.duration() * 100);
    return loop;
  });
  if (!loops.length) return;
  let settle: gsap.core.Tween | undefined;
  ScrollTrigger.create({
    trigger: '.brands',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      const sign = self.direction;
      const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 400);
      loops.forEach((t) => gsap.to(t, { timeScale: boost * sign, duration: 0.2, overwrite: true }));
      settle?.kill();
      settle = gsap.delayedCall(0.25, () => loops.forEach((t) => gsap.to(t, { timeScale: sign, duration: 1.2, overwrite: true })));
    },
  });
}

/* Pinned colour machine: scrolling pours one colour over the other. */
function colorMachine(mm: gsap.MatchMedia) {
  const section = $('.colors');
  const json = $('#palette');
  if (!section || !json) return;
  const palette: { name: string; hex: string; ink: string }[] = JSON.parse(json.textContent || '[]');
  const layers = $$('.colors__layer', section);
  const dots = $$('.colors__dots li', section);
  const name = $('.colors__name', section)!;
  const hex = $('.colors__hex', section)!;
  let current = -1;
  const setColor = (i: number) => {
    if (i === current) return;
    current = i;
    const p = palette[i];
    name.textContent = p.name;
    hex.textContent = p.hex.toUpperCase();
    dots.forEach((d, j) => d.classList.toggle('is-active', j === i));
    gsap.to(section, { '--paint': p.hex, '--paint-ink': p.ink, duration: 0.6, ease: 'power2.out' });
  };
  setColor(0);

  mm.add('(min-width: 900px)', () => {
    gsap.set(layers.slice(1), { clipPath: 'circle(0% at 50% 100%)' });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${innerHeight * (palette.length - 1) * 0.7}`,
        pin: '.colors__pin',
        scrub: 0.5,
        onUpdate: (self) => setColor(Math.min(palette.length - 1, Math.round(self.progress * (palette.length - 1)))),
      },
    });
    layers.slice(1).forEach((layer, i) => {
      tl.to(layer, { clipPath: 'circle(75% at 50% 100%)', ease: 'none', duration: 1 }, i);
    });
    tl.to('.colors__swatch', { rotate: 30, ease: 'none', duration: layers.length - 1 }, 0);
  });

  mm.add('(max-width: 899px)', () => {
    gsap.set(layers.slice(1), { clipPath: 'circle(0% at 50% 100%)' });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.colors__stage',
        start: 'top 75%',
        end: 'bottom 25%',
        scrub: 0.5,
        onUpdate: (self) => setColor(Math.min(palette.length - 1, Math.round(self.progress * (palette.length - 1)))),
      },
    });
    layers.slice(1).forEach((layer, i) => tl.to(layer, { clipPath: 'circle(75% at 50% 100%)', ease: 'none', duration: 1 }, i));
  });
}

/* Products slide sideways while the section is pinned (desktop only). */
function productsRail(mm: gsap.MatchMedia) {
  const rail = $('.products__rail');
  if (!rail) return;
  mm.add('(min-width: 900px)', () => {
    const distance = () => Math.max(0, rail.scrollWidth - rail.clientWidth);
    gsap.to(rail, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.products',
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: '.products__pin',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
  });
}

/* Gallery columns drift at different speeds. */
function gallery() {
  $$('.gallery__col').forEach((col) => {
    const speed = Number(col.dataset.speed || 0);
    gsap.fromTo(
      col,
      { y: -speed },
      { y: speed, ease: 'none', scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: 0.5 } },
    );
  });
}
