"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const SHOTS = [
  "identity-look-1", "play-look-1", "identity-look-2", "play-look-3", "play-cover", "identity-look-4",
  "play-look-2", "identity-look-3", "play-look-5", "identity-look-5", "play-look-4", "play-look-6",
];
const FRAME_MS = 0.09; // one image every 90ms
const LOAD_CAP = 4000; // never wait longer than this for slow images

export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    (_, contextSafe) => {
      let alive = true; // dev StrictMode runs this twice; the first run must not start a timeline later
      const html = document.documentElement;
      const shots = gsap.utils.toArray<HTMLImageElement>(".loader-shot", root.current);
      const progress = { load: 0, flash: 0 };
      const render = () => {
        if (count.current) count.current.textContent = String(Math.round(50 * progress.load + 50 * progress.flash)).padStart(3, "0");
      };

      const finish = () => {
        html.classList.remove("is-loading");
        html.dataset.loaded = "1";
        window.dispatchEvent(new Event("the-h:loaded"));
        setDone(true);
      };

      // Fly the big centred mark onto the header's mark, then hand over.
      const handOff = (tl: gsap.core.Timeline) => {
        const target = document.querySelector<HTMLElement>("[data-mark]")?.getBoundingClientRect();
        const from = mark.current!.getBoundingClientRect();
        tl.to(".loader-panel.top", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "split")
          .to(".loader-panel.bottom", { yPercent: 100, duration: 1.1, ease: "expo.inOut" }, "split")
          .to(".loader-meta", { autoAlpha: 0, duration: 0.3 }, "split");
        if (target) {
          tl.to(
            mark.current,
            {
              x: target.left + target.width / 2 - (from.left + from.width / 2),
              y: target.top + target.height / 2 - (from.top + from.height / 2),
              scale: target.width / from.width,
              duration: 1.1,
              ease: "expo.inOut",
            },
            "split",
          );
        }
        tl.add(finish); // unmounting swaps this mark for the identical header mark in place
      };

      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
        const reduce = ctx.conditions?.reduce;
        gsap.set(shots, { autoAlpha: 0 });
        gsap.set(mark.current, { clipPath: "inset(0 100% 0 0)" });

        const decoded = shots.map((img) =>
          img.decode().catch(() => undefined).then(
            contextSafe!(() => gsap.to(progress, { load: "+=" + 1 / shots.length, duration: 0.4, onUpdate: render })),
          ),
        );
        const ready = Promise.race([Promise.all(decoded), new Promise((r) => setTimeout(r, LOAD_CAP))]);

        ready.then(
          contextSafe!(() => {
            if (!alive) return;
            gsap.to(progress, { load: 1, duration: 0.3, onUpdate: render });
            const tl = gsap.timeline({ defaults: { ease: "none" } });
            if (reduce) {
              tl.to(shots[0], { autoAlpha: 1, duration: 0.6 }).to(progress, { flash: 1, duration: 0.6, onUpdate: render }, 0);
            } else {
              // The flashing: hard cuts, slight jitter, frame never larger than ~26vh.
              const frames = shots.length * 2;
              for (let i = 0; i < frames; i++) {
                const img = shots[i % shots.length];
                tl.set(shots, { autoAlpha: 0 }, i * FRAME_MS).set(
                  img,
                  { autoAlpha: 1, x: gsap.utils.random(-14, 14), y: gsap.utils.random(-10, 10), scale: gsap.utils.random(0.94, 1.04) },
                  i * FRAME_MS,
                );
              }
              tl.to(progress, { flash: 1, duration: frames * FRAME_MS, onUpdate: render }, 0);
            }
            tl.to(".loader-frame", { clipPath: "inset(50% 0 50% 0)", duration: 0.45, ease: "power3.in" }, "+=0.15")
              .to(mark.current, { clipPath: "inset(0 0% 0 0)", duration: reduce ? 0.4 : 0.8, ease: "power2.inOut" })
              .add(() => undefined, "+=0.35");
            handOff(tl);
          }),
        );
      });
      return () => {
        alive = false;
      };
    },
    { scope: root },
  );

  if (done) return null;

  return (
    <>
      <div className="loader" ref={root} role="status" aria-label="Loading THE H">
        <div className="loader-panel top" />
        <div className="loader-panel bottom" />
        <div className="loader-frame">
          {SHOTS.map((s) => (
            <Image key={s} className="loader-shot" src={`/loader/${s}.webp`} alt="" width={400} height={600} unoptimized loading="eager" />
          ))}
        </div>
        <div className="loader-meta">
          <span>THE H</span>
          <span ref={count}>000</span>
        </div>
      </div>
      <div className="loader-mark mono-h" ref={mark} aria-hidden />
    </>
  );
}
