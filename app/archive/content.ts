// Copy is taken from Hanna's portfolio PDF, with typos corrected.

export type Chapter = {
  slug: string;
  no: string;
  title: string;
  kicker: string;
  body: string[];
  tone: "paper" | "ink";
  pages: Page[];
};

export type Page =
  | { kind: "cover" | "endpaper" | "index" | "closing" | "back" | "blank" }
  | { kind: "opener"; chapter: Chapter }
  | { kind: "photo"; src: string; alt: string; caption?: string }
  | { kind: "plate"; src: string; alt: string; caption?: string; fit: "cover" | "contain"; tone?: "paper" | "ink" }
  | { kind: "palette"; colors: [string, string][]; caption: string };

const look = (slug: string, n: number, alt: string): Page => ({
  kind: "photo",
  src: `/archive/${slug}/look-${n}.webp`,
  alt,
  caption: "Lookbook",
});

export const chapters: Chapter[] = [
  {
    slug: "identity",
    no: "01",
    title: "Immersing Identity",
    kicker: "Sade — “Quiet Fire”",
    tone: "ink",
    body: [
      "This project is built on identity: choosing a person to be the focal point of my designs, researching and delving into that personality, and turning it into a concept. I chose Sade Adu for her unique identity.",
      "My concept, “Quiet Fire”, represents a person whose strength comes from staying calm and controlled. Their rebellion isn’t loud or messy — it’s smart, intentional and full of emotion. It is about being strong without needing to show off: soft, confident and powerful in a quiet way, blending the formal, bold side of Sade’s identity with her soft, sleek side.",
    ],
    pages: [
      { kind: "plate", src: "/archive/identity/reference.webp", alt: "Black and white reference portrait of Sade Adu holding a shard of mirror", caption: "Reference", fit: "cover" },
      { kind: "plate", src: "/archive/identity/moodboard.webp", alt: "Mood board of Sade Adu performing, with three early dress illustrations", caption: "Mood board & sketches", fit: "cover" },
      { kind: "plate", src: "/archive/identity/sketches.webp", alt: "Sketches of a corseted white shirt look and a black tailored look", fit: "cover" },
      {
        kind: "plate",
        src: "/archive/identity/flats.webp",
        alt: "Front and back illustration of a long black dress with an open back and draped waist",
        caption:
          "Final executed garment — inspired by Sade Adu’s timeless, understated style: a long black dress with a sleek fitted silhouette, an open back and soft draped ruching at the waist. Elegance, confidence and subtle sensuality.",
        fit: "contain",
      },
      look("identity", 1, "Model in the long black dress standing against a green panelled wall beneath an ornate clock"),
      look("identity", 2, "Model in the black dress showing the open back, an ornate clock behind her"),
      look("identity", 3, "Model in the black dress under a crystal chandelier, hand resting on the draped velvet waist"),
      look("identity", 4, "Model crouching on a wooden floor, the open back and velvet drape of the dress in view"),
      look("identity", 5, "Model in the black dress lit by warm lamplight beside a vintage radio"),
    ],
  },
  {
    slug: "play",
    no: "02",
    title: "Play",
    kicker: "A youthful extension of Carina",
    tone: "paper",
    body: [
      "A youthful extension of Carina with a playful identity. Everyday basics are transformed through bold patterns and expressive design.",
      "Play encourages individuality, with experimental styling and evolving collections.",
    ],
    pages: [
      { kind: "plate", src: "/archive/play/title.webp", alt: "Printed garments and an orange fringed bag hanging on a rooftop washing line, with the PLAY logotype", fit: "cover" },
      { kind: "plate", src: "/archive/play/moodboard.webp", alt: "Mood board strip of colourful shoes, patterned fabrics and playful portraits", caption: "Mood board", fit: "contain" },
      {
        kind: "palette",
        caption: "Colour palette",
        colors: [["Lime", "#e3ff37"], ["Blue", "#150094"], ["Butter yellow", "#fffa7d"], ["Velvet cherry", "#8b133f"], ["Baby pink", "#ffbed4"], ["Deep red", "#d80000"]],
      },
      { kind: "plate", src: "/archive/play/fabrics.webp", alt: "Fabric board: circle-print gabardine, striped lightweight poplin, polka-dot linen blend and blue chiffon", caption: "Fabric board — gabardine, lightweight poplin, chiffon, linen blend", fit: "contain" },
      { kind: "plate", src: "/archive/play/collection.webp", alt: "Five illustrated looks in stripes, circles and polka dots", caption: "Collection", fit: "contain" },
      {
        kind: "plate",
        src: "/archive/play/final.webp",
        alt: "Illustration of the circle-print shirt and trousers, beside technical flats and print swatches",
        caption:
          "Final executed garment — a bold geometric print I designed and developed myself, with layered circular forms in contrasting tones, digitally printed onto chiffon.",
        fit: "contain",
      },
      look("play", 1, "Model reclining on a gilded sofa in the circle-print chiffon set, holding an embroidered parasol"),
      look("play", 2, "Model standing on a rooftop in the circle-print set, with an embroidered parasol"),
      look("play", 3, "Model standing on a gilded sofa in the circle-print kimono and trousers"),
      look("play", 4, "Model leaning back on the sofa, one arm raised, wearing the circle-print set"),
      look("play", 5, "Model in an orange halter top and print trousers posing in a wooden doorway"),
      look("play", 6, "Model crouching on a blue patterned rug in the orange top and print trousers"),
    ],
  },
  {
    slug: "cairona",
    no: "03",
    title: "Cairona",
    kicker: "Made between Egypt and Spain · Est. 2026",
    tone: "paper",
    body: [
      "Cairona is a fashion brand born between Egypt and Spain, where heritage meets modern expression — blending Cairo’s rich cultural depth with Barcelona’s effortless street elegance.",
      "Capsule 1: tees, hoodies, stickers and a packing-paper mailer.",
    ],
    pages: [
      { kind: "plate", src: "/archive/cairona/poster.webp", alt: "Cairona poster: the pyramids through an arch beside the Sagrada Família, with the logotype in Latin and Arabic", fit: "cover" },
      { kind: "palette", caption: "Colour palette", colors: [["", "#011559"], ["", "#b9d3ff"], ["", "#fff4a6"], ["", "#332323"], ["", "#869469"], ["", "#d0d8bf"]] },
      { kind: "plate", src: "/archive/cairona/tees.webp", alt: "Capsule 1 tees in white, butter yellow and brown with Cairona graphics", fit: "cover" },
      { kind: "plate", src: "/archive/cairona/hoodies.webp", alt: "Capsule 1 hoodies and sweatshirts in black, brown and navy with Cairona graphics", fit: "cover" },
      { kind: "plate", src: "/archive/cairona/stickers.webp", alt: "Round illustrated stickers and Cairona logotype stickers", caption: "Stickers", fit: "contain" },
      { kind: "plate", src: "/archive/cairona/mailer.webp", alt: "Kraft packing-paper mailer covered in Cairona stickers", caption: "Packing paper mailer", fit: "contain" },
    ],
  },
  {
    slug: "barraserb",
    no: "04",
    title: "Barraserb",
    kicker: "T-shirt designs",
    tone: "ink",
    body: [
      "Barraserb (BRSRB) is an Egyptian/MENA streetwear brand founded in 2023 by Egyptian rapper Marwan Pablo and creative/stylist Xander Ghost, known for oversized silhouettes, graphic prints, Arabic typography, distorted graphics and deconstructed elements.",
      "I designed a series of T-shirts for them, following the brand identity.",
    ],
    pages: [{ kind: "plate", src: "/archive/barraserb/designs.webp", alt: "Three Barraserb T-shirt designs, front and back, with Arabic typography", fit: "cover", tone: "ink" }],
  },
  {
    slug: "autovroom",
    no: "05",
    title: "Autovroom",
    kicker: "Working uniform",
    tone: "ink",
    body: ["A working uniform for Autovroom: a white tee with red shoulder panels, logo and race-track graphics, shown front, back and in profile."],
    pages: [{ kind: "plate", src: "/archive/autovroom/uniform.webp", alt: "Autovroom working uniform tee, front, back and sleeves", fit: "cover", tone: "ink" }],
  },
];

export const closing =
  "This portfolio is a collection of ideas, experiments, projects and moments of discovery throughout my journey in fashion. Each project reflects a different way of thinking, creating and seeing. As I continue to explore and evolve, I see every design as another step toward defining my own visual language. Thank you for stepping into my world.";

export const bio =
  "I’m a 21-year-old fashion designer and student at the German International University, exploring fashion through experimentation with different concepts, styles and visual languages. My design identity lies in the balance between chaos and calm — combining bold, unexpected elements with a sense of simplicity and control.";

/** Flatten chapters into book pages. Even index = right-hand page (front of a leaf), odd = left (back). */
function buildBook() {
  const pages: Page[] = [{ kind: "cover" }, { kind: "endpaper" }, { kind: "index" }];
  const starts: Record<string, number> = {};
  for (const c of chapters) {
    starts[c.slug] = pages.length;
    pages.push({ kind: "opener", chapter: c }, ...c.pages);
    if ((pages.length - starts[c.slug]) % 2) pages.push({ kind: "blank" }); // next chapter opens on a left page too
  }
  pages.push({ kind: "closing" }, { kind: "endpaper" });
  if (pages.length % 2 === 0) pages.push({ kind: "blank" }); // back cover must be the back of the last leaf
  pages.push({ kind: "back" });

  console.assert(pages.length % 2 === 0, "book needs an even page count");
  for (const c of chapters) console.assert(starts[c.slug] % 2 === 1, `${c.slug} must open on a left page`);
  return { pages, starts };
}

export const book = buildBook();
