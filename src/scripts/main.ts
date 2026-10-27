import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion) {
  // Lenis drives the scroll; GSAP's ticker drives Lenis so both share one frame loop
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  gsap.utils.toArray<HTMLElement>('.section h2').forEach((el) => {
    gsap.from(el, {
      y: 120,
      opacity: 0,
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 40%', scrub: 0.5 },
    });
  });
}
