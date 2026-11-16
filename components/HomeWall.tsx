"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type CSSProperties } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { bio, chapters } from "@/app/archive/content";
import { INSTAGRAM } from "@/components/Header";

type Tile = { src: string; w: number; h: number; slug: string; alt: string; x: number; y: number; size: number; speed: number; over?: boolean };

// Desktop placement: x in % of width, y in vh, size in vw. Phones fall back to a two-column stagger.
const TILES: Tile[] = [
  { src: "identity/look-1", w: 896, h: 1344, slug: "identity", alt: "Long black dress against a green panelled wall", x: 5, y: 12, size: 15, speed: 0.15 },
  { src: "play/look-1", w: 934, h: 1400, slug: "play", alt: "Circle-print chiffon set on a gilded sofa", x: 66, y: 18, size: 17, speed: -0.1 },
  { src: "play/cover", w: 853, h: 1280, slug: "play", alt: "Printed garments on a rooftop washing line", x: 89, y: 2, size: 13, speed: 0.3, over: true },
  { src: "identity/look-2", w: 853, h: 1280, slug: "identity", alt: "Open back of the black dress", x: 21, y: 58, size: 13, speed: 0.35, over: true },
  { src: "play/fabrics", w: 979, h: 693, slug: "play", alt: "Fabric board of prints and stripes", x: 42, y: 84, size: 18, speed: 0.05 },
  { src: "play/look-3", w: 934, h: 1400, slug: "play", alt: "Circle-print kimono and trousers", x: 73, y: 70, size: 14, speed: 0.3, over: true },
  { src: "identity/flats", w: 880, h: 1094, slug: "identity", alt: "Illustration of the black dress, front and back", x: 2, y: 104, size: 13, speed: 0.2 },
  { src: "play/look-2", w: 934, h: 1400, slug: "play", alt: "Circle-print set on a rooftop with a parasol", x: 30, y: 132, size: 15, speed: -0.05 },
  { src: "cairona/tees", w: 1130, h: 1600, slug: "cairona", alt: "Cairona capsule tees", x: 60, y: 126, size: 15, speed: 0.25, over: true },
  { src: "identity/look-4", w: 896, h: 1344, slug: "identity", alt: "Crouching in the draped black dress", x: 85, y: 116, size: 12, speed: 0.1 },
  { src: "play/collection", w: 1166, h: 1375, slug: "play", alt: "Illustrated Play collection line-up", x: 9, y: 170, size: 16, speed: 0.3, over: true },
  { src: "play/look-5", w: 934, h: 1400, slug: "play", alt: "Orange halter top in a wooden doorway", x: 45, y: 190, size: 14, speed: 0.15 },
  { src: "identity/look-5", w: 896, h: 1344, slug: "identity", alt: "Black dress in warm lamplight", x: 22, y: 230, size: 14, speed: 0.2, over: true },
  { src: "play/look-6", w: 934, h: 1400, slug: "play", alt: "Crouching on a blue patterned rug", x: 58, y: 244, size: 16, speed: 0.1 },
  { src: "barraserb/designs", w: 1130, h: 1600, slug: "barraserb", alt: "Barraserb T-shirt designs", x: 84, y: 232, size: 13, speed: 0.25, over: true },
];

// Phones: two staggered columns, with the middle of the first screen left clear for the nav.
const phoneY = (i: number) => (i < 2 ? [9, 62][i] : 100 + Math.floor((i - 2) / 2) * 40 + (i % 2) * 18);

const chapterName = Object.fromEntries(chapters.map((c) => [c.slug, `${c.no} — ${c.title}`]));

const roll = (text: string) =>
  text.split("").map((ch, i) => (
    <span className="char" key={i} style={{ "--i": i } as CSSProperties}>
      <span className="ch">{ch === " " ? <>&nbsp;</> : ch}</span>
    </span>
  ));

export default function HomeWall() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", fine: "(pointer: fine)" }, (ctx) => {
        const { motion, fine } = ctx.conditions!;
        const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
        intro
          .from(".roll-a .ch", { yPercent: 110, duration: motion ? 1.1 : 0.01, stagger: 0.03, clearProps: "transform" })
          .from(".archive-line", { scaleX: 0, transformOrigin: "left", duration: motion ? 1 : 0.01, ease: "expo.inOut" }, "-=0.8")
          .from(".house", { autoAlpha: 0, y: 16, duration: 0.8 }, "-=0.7")
          .from(".tile-inner", { autoAlpha: 0, scale: motion ? 0.9 : 1, duration: 1.2, stagger: { each: 0.05, from: "random" } }, 0.1);

        const play = () => intro.play();
        if (document.documentElement.dataset.loaded) play();
        else window.addEventListener("the-h:loaded", play, { once: true });

        if (motion) {
          // Each tile drifts at its own speed, so photos slide over and under the nav.
          gsap.utils.toArray<HTMLElement>(".tile").forEach((el) => {
            gsap.to(el, {
              y: () => -Number(el.dataset.speed) * innerHeight * 1.6,
              ease: "none",
              scrollTrigger: { trigger: ".wall", start: "top top", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true },
            });
          });
        }
        gsap.to(".home-nav", {
          autoAlpha: 0,
          yPercent: -12,
          ease: "none",
          scrollTrigger: { trigger: ".home-about", start: "top 85%", end: "top 40%", scrub: true },
        });

        // Subtle depth on desktop: the layer above the nav drifts more than the one below.
        const layers = gsap.utils.toArray<HTMLElement>(".wall-layer");
        const movers = layers.map((l) => ({ x: gsap.quickTo(l, "x", { duration: 1.2, ease: "power3" }), y: gsap.quickTo(l, "y", { duration: 1.2, ease: "power3" }) }));
        const onMove = (e: PointerEvent) => {
          const dx = e.clientX / innerWidth - 0.5;
          const dy = e.clientY / innerHeight - 0.5;
          movers.forEach((m, i) => {
            m.x(dx * (i ? -28 : -12));
            m.y(dy * (i ? -20 : -8));
          });
        };
        if (motion && fine) window.addEventListener("pointermove", onMove);
        return () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("the-h:loaded", play);
        };
      });
    },
    { scope: root },
  );

  // Play the exit, then navigate. Activity reverts this when Home is hidden, so it never comes back half-gone.
  const go = contextSafe((href: string) => {
    gsap
      .timeline({ defaults: { ease: "power3.in" }, onComplete: () => router.push(href) })
      .to(".roll .ch", { yPercent: -110, duration: 0.5, stagger: 0.015 }, 0)
      .to(".house", { autoAlpha: 0, duration: 0.3 }, 0)
      .to(".archive-line", { scaleX: 0, transformOrigin: "right", duration: 0.45 }, 0)
      .to(
        ".tile-inner",
        {
          x: (_, el: HTMLElement) => {
            const r = el.getBoundingClientRect();
            return (innerWidth / 2 - (r.left + r.width / 2)) * 0.5;
          },
          y: (_, el: HTMLElement) => {
            const r = el.getBoundingClientRect();
            return (innerHeight / 2 - (r.top + r.height / 2)) * 0.5;
          },
          scale: 0.6,
          autoAlpha: 0,
          duration: 0.7,
          stagger: { each: 0.015, from: "random" },
        },
        0,
      );
  });

  const tile = (t: Tile, i: number) => (
    <Link
      key={t.src}
      href={`/archive#${t.slug}`}
      onNavigate={(e) => {
        e.preventDefault();
        go(`/archive#${t.slug}`);
      }}
      className="tile"
      data-speed={t.speed}
      style={
        {
          "--x": `${t.x}%`,
          "--y": `${t.y}vh`,
          "--w": `${t.size}vw`,
          "--mx": `${i % 2 ? 50 : 6}%`,
          "--my": `${phoneY(i)}vh`,
        } as CSSProperties
      }
    >
      <span className="tile-inner">
        <Image src={`/archive/${t.src}.webp`} alt={t.alt} width={t.w} height={t.h} sizes="(min-width: 768px) 18vw, 44vw" />
        <span className="tile-cap">{chapterName[t.slug]}</span>
      </span>
    </Link>
  );

  return (
    <div ref={root}>
      <h1 className="sr-only">THE H — Hanna Baher, fashion designer</h1>

      <nav className="home-nav" aria-label="Main">
        <Link
          href="/archive"
          className="archive-link"
          onNavigate={(e) => {
            e.preventDefault();
            go("/archive");
          }}
        >
          <span className="roll" aria-hidden>
            <span className="roll-a">{roll("THE ARCHIVE")}</span>
            <span className="roll-b">{roll("THE ARCHIVE")}</span>
          </span>
          <span className="sr-only">The Archive</span>
          <span className="archive-line" aria-hidden />
        </Link>
        <p className="house">
          <span className="house-name">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M3.5 10.5 12 3.5l8.5 7M6.5 8.6v11.9M17.5 8.6v11.9M6.5 14.5h11" />
            </svg>
            The House
          </span>
          <span className="house-soon">Coming soon</span>
        </p>
      </nav>

      <div className="wall">
        <div className="wall-layer under">{TILES.map((t, i) => !t.over && tile(t, i))}</div>
        <div className="wall-layer over">{TILES.map((t, i) => t.over && tile(t, i))}</div>
      </div>

      <section className="home-about">
        <p className="label">(Welcome)</p>
        <div className="about-grid">
          <Image className="about-img" src="/archive/bio/studio.webp" alt="Tailor’s scissors and a spool of thread in the studio" width={600} height={840} sizes="(min-width: 768px) 16vw, 40vw" />
          <h2 className="about-text">{bio}</h2>
        </div>
        <footer className="home-foot">
          <a className="foot-big" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
            Send Me A Direct Message
          </a>
          <span className="label">© 2026 Hanna Baher — THE H</span>
          <Link className="foot-big" href="/archive">
            The Archive →
          </Link>
        </footer>
      </section>
    </div>
  );
}
