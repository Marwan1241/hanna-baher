"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { book, chapters, END, type Page } from "@/app/archive/content";

const { pages, starts } = book;
// Spreads on wide screens and on landscape phones; single pages on portrait phones/tablets.
const WIDE = "(min-width: 900px), (orientation: landscape) and (min-width: 640px)";
const pad = (n: number) => String(n).padStart(2, "0");

function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(WIDE);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(WIDE).matches,
    () => true,
  );
}

// Spread: leaf i = pages [2i, 2i+1]. Single: leaf i = page i (its back is a plain lining).
const leavesFor = (wide: boolean) =>
  wide ? Array.from({ length: pages.length / 2 }, (_, i) => [2 * i, 2 * i + 1]) : pages.map((_, i) => [i, -1]);
const maxFor = (wide: boolean) => (wide ? pages.length / 2 : pages.length - 1);
const leafFor = (page: number, wide: boolean) => (wide ? Math.ceil(page / 2) : page);

export default function Book() {
  const router = useRouter();
  const wide = useWide();
  const root = useRef<HTMLDivElement>(null);
  const bookEl = useRef<HTMLDivElement>(null);
  const curRef = useRef(0);
  const wideRef = useRef(wide);
  const reduce = useRef(false);
  const [cur, setCur] = useState(0);
  const leaves = leavesFor(wide);

  const leafEls = () => gsap.utils.toArray<HTMLElement>(".leaf", bookEl.current);

  // z-order: resting leaves stack right (n-i) or left (i); flying leaves sit above all of them.
  const paint = (el: HTMLElement, i: number, flying: boolean) => {
    const n = el.parentElement?.childElementCount;
    if (!n) return; // leaf from the previous layout mode, already unmounted
    const rot = gsap.getProperty(el, "rotationY") as number;
    el.style.zIndex = String((flying ? 2 * n : 0) + (rot < -90 ? i + 1 : n - i));
    el.style.setProperty("--shade", String(Math.sin((-rot * Math.PI) / 180) * 0.35));
    // Leaves are flat and show one face at a time: Safari mis-draws preserve-3d + backface-visibility (blank pages on iPhone).
    el.toggleAttribute("data-turned", rot < -90);
    // Only leaves near the open page or in flight are drawn; ~80 full-page layers stall iOS Safari.
    el.style.display = flying || Math.abs(i - curRef.current) <= 2 ? "" : "none";
    if (!wideRef.current) el.style.opacity = String(gsap.utils.clamp(0, 1, (180 + rot) / 60));
  };

  const shift = (c: number) => (wideRef.current ? (c === 0 ? -25 : c === maxFor(true) ? 25 : 0) : 0);

  const layout = () => {
    leafEls().forEach((el, i) => {
      gsap.set(el, { rotationY: i < curRef.current ? -180 : 0, transformPerspective: 2400, transformOrigin: "left center" });
      paint(el, i, false);
    });
    gsap.set(bookEl.current, { xPercent: shift(curRef.current) });
  };

  // Re-stack whenever the layout mode changes, keeping the same page open.
  const prevWide = useRef(wide);
  useGSAP(
    () => {
      wideRef.current = wide;
      if (prevWide.current !== wide) {
        const page = prevWide.current ? curRef.current * 2 : curRef.current;
        curRef.current = Math.min(leafFor(page, wide), maxFor(wide));
        prevWide.current = wide;
        setCur(curRef.current);
      }
      layout();
    },
    { dependencies: [wide], scope: root },
  );

  // Turning and closing live inside the GSAP context (so Activity/unmount reverts them); handlers reach them via this ref.
  const api = useRef<{ flipTo: (n: number) => void; close: () => void }>({ flipTo: () => {}, close: () => {} });
  const flipTo = (n: number) => api.current.flipTo(n);

  useGSAP(
    (_, contextSafe) => {
      const flipTo = contextSafe!((target: number) => {
        const to = gsap.utils.clamp(0, maxFor(wideRef.current), target);
        const from = curRef.current;
        if (to === from) return;
        const fwd = to > from;
        const els = leafEls();
        // Leaves to turn, in the order they lift off the stack.
        const list = fwd ? Array.from({ length: to - from }, (_, k) => from + k) : Array.from({ length: from - to }, (_, k) => from - 1 - k);
        const stagger = Math.min(0.08, 0.6 / list.length);
        list.forEach((i, k) => {
          const el = els[i];
          gsap.to(el, {
            rotationY: fwd ? -180 : 0,
            duration: reduce.current ? 0 : list.length > 1 ? 0.8 : 1,
            delay: reduce.current ? 0 : k * stagger,
            ease: "power2.inOut",
            overwrite: "auto",
            onUpdate: () => paint(el, i, true),
            onComplete: () => paint(el, i, false),
          });
        });
        curRef.current = to;
        els.forEach((el, i) => paint(el, i, list.includes(i) || gsap.isTweening(el))); // reveal the target, lift the leaves about to turn
        setCur(to);
        gsap.to(bookEl.current, { xPercent: shift(to), duration: reduce.current ? 0 : 1, ease: "power2.inOut", overwrite: "auto" });
      });

      const close = contextSafe!(() => {
        const wait = curRef.current > 0 && !reduce.current ? 1.1 : 0;
        flipTo(0);
        gsap.to(bookEl.current, {
          y: 160,
          rotationX: 40,
          autoAlpha: 0,
          duration: reduce.current ? 0.01 : 0.7,
          delay: wait,
          ease: "power3.in",
          onComplete: () => router.push("/"),
        });
      });
      api.current = { flipTo, close };

      // Intro: the closed book rises off the table, then opens to the index (or riffles to #chapter).
      reduce.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
      curRef.current = 0;
      setCur(0);
      layout();
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(
        bookEl.current,
        { autoAlpha: 0, y: 140, rotationX: 55, scale: 0.92 },
        { autoAlpha: 1, y: 0, rotationX: 0, scale: 1, duration: reduce.current ? 0.01 : 1.3, ease: "expo.out" },
        0.2,
      )
        .from(".rail", { autoAlpha: 0, y: 20, duration: 0.6, ease: "power2.out" }, "-=0.6")
        .call(() => flipTo(leafFor(1, wideRef.current)), [], "-=0.2"); // open on the PDF's first spread
      const toHash = () => {
        const slug = location.hash.slice(1);
        if (starts[slug] !== undefined) flipTo(leafFor(starts[slug], wideRef.current));
      };
      if (starts[location.hash.slice(1)] !== undefined) tl.call(toHash, [], "+=1");

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight") flipTo(curRef.current + 1);
        else if (e.key === "ArrowLeft") flipTo(curRef.current - 1);
        else if (e.key === "Escape") close();
      };
      window.addEventListener("keydown", onKey);
      window.addEventListener("hashchange", toHash);

      // On a hard load, wait for the loader to clear before the book rises.
      const play = () => tl.play();
      if (document.documentElement.dataset.loaded) play();
      else window.addEventListener("the-h:loaded", play, { once: true });
      return () => {
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("hashchange", toHash);
        window.removeEventListener("the-h:loaded", play);
      };
    },
    { scope: root },
  );

  // Pointer: click a half to turn, swipe to turn.
  const down = useRef<number | null>(null);
  const swiped = useRef(false);
  const edge = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return r.left + r.width * (wide ? 0.5 : 0.3);
  };

  const jump = (slug: string) => flipTo(leafFor(starts[slug], wide));

  const pageNow = wide ? Math.max(0, 2 * cur - 1) : cur;
  const active = pageNow < END ? [...chapters].reverse().find((c) => starts[c.slug] <= pageNow) : undefined;
  const max = maxFor(wide);
  const label = wide
    ? cur === 0
      ? "Cover"
      : cur === max
        ? "Back cover"
        : `${pad(2 * cur - 1)}–${pad(2 * cur)} / ${pages.length - 1}`
    : cur === 0
      ? "Cover"
      : `${pad(cur)} / ${pages.length - 1}`;

  return (
    <div className="archive" ref={root}>
      <h1 className="sr-only">The Archive — Hanna Baher</h1>
      <div
        className="book-stage"
        onPointerDown={(e) => {
          down.current = e.clientX;
          swiped.current = false;
        }}
        onPointerUp={(e) => {
          if (down.current === null) return;
          const dx = e.clientX - down.current;
          down.current = null;
          if (Math.abs(dx) > 40) {
            swiped.current = true;
            flipTo(curRef.current + (dx < 0 ? 1 : -1));
          }
        }}
        onPointerMove={(e) => {
          e.currentTarget.dataset.side = e.clientX < edge(e.currentTarget) ? "prev" : "next";
        }}
        onClick={(e) => {
          if (swiped.current || (e.target as HTMLElement).closest("button, a")) return;
          flipTo(curRef.current + (e.clientX < edge(e.currentTarget) ? -1 : 1));
        }}
      >
        <div className="book" ref={bookEl} data-mode={wide ? "spread" : "single"}>
          {leaves.map(([front, back], i) => {
            const near = wide ? i >= cur - 3 && i <= cur + 2 : Math.abs(i - cur) <= 2;
            return (
              <div className="leaf" key={`${wide}-${i}`}>
                <div className="face front">
                  <Face page={pages[front]} near={near} />
                  <i className="shade" />
                </div>
                <div className="face back">
                  {back < 0 ? <div className="pg" /> : <Face page={pages[back]} near={near} />}
                  <i className="shade" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <nav className="rail" aria-label="Archive">
        <button type="button" className="rail-arrow prev" onClick={() => flipTo(cur - 1)} disabled={cur === 0} aria-label="Previous page">
          ←
        </button>
        <ol className="rail-chapters">
          {chapters.map((c) => (
            <li key={c.slug}>
              <button type="button" onClick={() => jump(c.slug)} aria-current={active?.slug === c.slug ? "true" : undefined}>
                <span>{c.no}</span>
                <span className="rail-title">{c.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="rail-count" aria-live="polite">
          {label}
          {active && <span className="sr-only"> — {active.title}</span>}
        </p>
        <button type="button" className="rail-arrow next" onClick={() => flipTo(cur + 1)} disabled={cur === max} aria-label="Next page">
          →
        </button>
        <button type="button" className="rail-close" onClick={() => api.current.close()}>
          Close ✕
        </button>
      </nav>
    </div>
  );
}

function Face({ page, near }: { page: Page; near: boolean }) {
  switch (page.kind) {
    case "cover":
    case "back":
      return (
        <div className={`pg pg-denim ${page.kind === "back" ? "is-back" : ""}`}>
          {page.kind === "cover" && <span className="pg-denim-top">The Archive</span>}
          <span className="emboss">
            <span className="mono-h" />
          </span>
          <span className="pg-denim-foot">{page.kind === "cover" ? "Vol. 01 — Hanna Baher" : "THE H"}</span>
        </div>
      );
    case "pdf":
      return (
        <div className="pg">
          {near && <Image src={page.src} alt={page.alt} fill sizes="(min-width: 900px) 36vw, 90vw" className="object-cover" />}
        </div>
      );
    default:
      return (
        <div className="pg">
          <span className="mono-h pg-watermark" />
        </div>
      );
  }
}
