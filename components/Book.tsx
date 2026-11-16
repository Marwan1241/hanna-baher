"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { book, chapters, END, type Page } from "@/app/archive/content";

const { pages, starts } = book;
const pad = (n: number) => String(n).padStart(2, "0");

// Always two-page spreads: leaf i = pages [2i, 2i+1]. MAX = every leaf turned (back cover).
const MAX = pages.length / 2;
const leaves = Array.from({ length: MAX }, (_, i) => [2 * i, 2 * i + 1]);
const leafFor = (page: number) => Math.ceil(page / 2);

export default function Book() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const bookEl = useRef<HTMLDivElement>(null);
  const curRef = useRef(0);
  const reduce = useRef(false);
  const [cur, setCur] = useState(0);
  const [zoom, setZoom] = useState<{ idx: number; from: DOMRect } | null>(null);

  const leafEls = () => gsap.utils.toArray<HTMLElement>(".leaf", bookEl.current);

  // z-order: resting leaves stack right (n-i) or left (i); flying leaves sit above all of them.
  const paint = (el: HTMLElement, i: number, flying: boolean) => {
    const rot = gsap.getProperty(el, "rotationY") as number;
    el.style.zIndex = String((flying ? 2 * MAX : 0) + (rot < -90 ? i + 1 : MAX - i));
    el.style.setProperty("--shade", String(Math.sin((-rot * Math.PI) / 180) * 0.35));
    // Leaves are flat and show one face at a time: Safari mis-draws preserve-3d + backface-visibility (blank pages on iPhone).
    el.toggleAttribute("data-turned", rot < -90);
    // Only the two pages under each side and leaves in flight are drawn; dozens of full-page layers stall iOS Safari.
    el.style.display = flying || (i >= curRef.current - 2 && i <= curRef.current + 1) ? "" : "none";
  };

  // The closed book (cover or back) is one page wide, so centre it.
  const shift = (c: number) => (c === 0 ? -25 : c === MAX ? 25 : 0);

  const layout = () => {
    leafEls().forEach((el, i) => {
      gsap.set(el, { rotationY: i < curRef.current ? -180 : 0, z: 0, transformPerspective: 2400, transformOrigin: "left center" });
      paint(el, i, false);
    });
    gsap.set(bookEl.current, { xPercent: shift(curRef.current) });
  };

  // Turning and closing live inside the GSAP context (so Activity/unmount reverts them); handlers reach them via this ref.
  const api = useRef<{ flipTo: (n: number) => void; close: () => void }>({ flipTo: () => {}, close: () => {} });
  const flipTo = (n: number) => api.current.flipTo(n);

  useGSAP(
    (_, contextSafe) => {
      const flipTo = contextSafe!((target: number) => {
        const to = gsap.utils.clamp(0, MAX, target);
        const from = curRef.current;
        if (to === from) return;
        const fwd = to > from;
        const els = leafEls();
        // Leaves to turn, in the order they lift off the stack.
        const list = fwd ? Array.from({ length: to - from }, (_, k) => from + k) : Array.from({ length: from - to }, (_, k) => from - 1 - k);
        const stagger = Math.min(0.08, 0.6 / list.length);
        const duration = reduce.current ? 0 : list.length > 1 ? 0.8 : 1.15;
        list.forEach((i, k) => {
          const el = els[i];
          const delay = reduce.current ? 0 : k * stagger;
          // Slow lift, quick pass edge-on, slow settle; the page rises off the stack mid-turn.
          gsap.to(el, {
            rotationY: fwd ? -180 : 0,
            duration,
            delay,
            ease: "power3.inOut",
            overwrite: "auto",
            onUpdate: () => paint(el, i, true),
            onComplete: () => paint(el, i, false),
          });
          if (duration) gsap.to(el, { z: 60, duration: duration / 2, delay, ease: "sine.out", yoyo: true, yoyoEase: "sine.in", repeat: 1, overwrite: "auto" });
        });
        curRef.current = to;
        els.forEach((el, i) => paint(el, i, list.includes(i) || gsap.isTweening(el))); // reveal the target, lift the leaves about to turn
        setCur(to);
        gsap.to(bookEl.current, { xPercent: shift(to), duration: duration || 0, ease: "power3.inOut", overwrite: "auto" });
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

      // Intro: the closed book rises off the table, then opens onto the PDF's first spread (or riffles to #chapter).
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
        .call(() => flipTo(leafFor(1)), [], "-=0.2");
      const toHash = () => {
        const slug = location.hash.slice(1);
        if (starts[slug] !== undefined) flipTo(leafFor(starts[slug]));
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

  // Pointer: swipe to turn; tap a page to zoom into it on touch screens, or to turn it with a mouse.
  const down = useRef<number | null>(null);
  const swiped = useRef(false);
  const isLeft = (x: number) => {
    const r = bookEl.current!.getBoundingClientRect();
    return x < r.left + r.width / 2;
  };

  const jump = (slug: string) => flipTo(leafFor(starts[slug]));

  const pageNow = Math.max(0, 2 * cur - 1);
  const active = pageNow < END ? [...chapters].reverse().find((c) => starts[c.slug] <= pageNow) : undefined;
  const label = cur === 0 ? "Cover" : cur === MAX ? "Back cover" : `${pad(2 * cur - 1)}–${pad(2 * cur)} / ${pages.length - 1}`;

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
          e.currentTarget.dataset.side = isLeft(e.clientX) ? "prev" : "next";
        }}
        onClick={(e) => {
          if (swiped.current || (e.target as HTMLElement).closest("button, a")) return;
          const left = isLeft(e.clientX);
          const idx = left ? 2 * curRef.current - 1 : 2 * curRef.current;
          if (matchMedia("(pointer: coarse)").matches && pages[idx]?.kind === "pdf") {
            const r = bookEl.current!.getBoundingClientRect();
            setZoom({ idx, from: new DOMRect(left ? r.left : r.left + r.width / 2, r.top, r.width / 2, r.height) });
          } else flipTo(curRef.current + (left ? -1 : 1));
        }}
      >
        <div className="book" ref={bookEl}>
          {leaves.map(([front, back], i) => {
            const near = i >= cur - 3 && i <= cur + 2;
            return (
              <div className="leaf" key={i}>
                <div className="face front">
                  <Face page={pages[front]} near={near} />
                  <i className="shade" />
                </div>
                <div className="face back">
                  <Face page={pages[back]} near={near} />
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
        <button type="button" className="rail-arrow next" onClick={() => flipTo(cur + 1)} disabled={cur === MAX} aria-label="Next page">
          →
        </button>
        <button type="button" className="rail-close" onClick={() => api.current.close()}>
          Close ✕
        </button>
      </nav>

      {zoom && <Zoom page={pages[zoom.idx]} from={zoom.from} onClose={() => setZoom(null)} />}
    </div>
  );
}

/** One page blown up to fill the screen, growing out of where it sits in the book. Tap, ✕ or Esc closes it. */
function Zoom({ page, from, onClose }: { page: Page; from: DOMRect; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const to = root.current!.querySelector(".zoom-page")!.getBoundingClientRect();
      gsap.from(".zoom-page", {
        x: from.left + from.width / 2 - (to.left + to.width / 2),
        y: from.top + from.height / 2 - (to.top + to.height / 2),
        scale: from.width / to.width,
        duration: 0.6,
        ease: "expo.out",
      });
      gsap.from(root.current, { backgroundColor: "rgb(245 244 240 / 0)", duration: 0.4 });
      gsap.from(".zoom-close", { autoAlpha: 0, duration: 0.3, delay: 0.3 });
    },
    { scope: root },
  );
  const close = () => gsap.to(root.current, { autoAlpha: 0, duration: 0.25, onComplete: onClose });

  useGSAP(() => {
    // Capture phase, so Esc closes the zoom and not the whole book.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  return (
    <div className="zoom" ref={root} role="dialog" aria-modal="true" aria-label="Zoomed page" onClick={close}>
      <div className="zoom-page">
        {page.kind === "pdf" && <Image src={page.src} alt={page.alt} fill sizes="100vw" className="object-contain" />}
      </div>
      <button type="button" className="zoom-close" autoFocus>
        Close ✕
      </button>
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
          {near && <Image src={page.src} alt={page.alt} fill sizes="(min-width: 900px) 36vw, 50vw" className="object-cover" />}
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
