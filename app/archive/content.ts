// The archive is Hanna's portfolio PDF, page for page (scripts/extract-portfolio.py renders the pages),
// bound in THE H denim covers. Book page n is PDF half-page n. Alt text carries the copy, with typos corrected.

export type Page = { kind: "cover" | "back" | "blank" } | { kind: "pdf"; src: string; alt: string };

export const bio =
  "I’m Hanna Baher, a designer based in Cairo working across fashion design and creative direction. I experiment with different styles and visual languages, drawn to the space between chaos and calm and to how an idea changes as it takes on a new form. I started The H as an experimental creative house to share that process: the things I notice, the things I make, and the work I keep coming back to.";

// Home About copy, as Hanna worded it for the site. `bio` must keep matching the PDF's biography page.
export const about =
  "Designer based in Cairo working across fashion design and creative direction. I experiment with different styles and visual languages, drawn to the space between chaos and calm and to how an idea changes as it takes on a new form. I started The H as an experimental creative house to share that process: the things I notice, the things I make, and the work I keep coming back to.";

// Chapters as numbered on the PDF's contents page; `start` is the left page each one opens on.
export const chapters = [
  { slug: "biography", no: "01", title: "Biography", start: 3 },
  { slug: "identity", no: "02", title: "Immersing Identity", start: 5 },
  { slug: "play", no: "03", title: "Play", start: 15 },
  { slug: "cairona", no: "04", title: "Cairona", start: 27 },
  { slug: "barraserb", no: "05", title: "Barraserb", start: 33 },
];
/** First page after the last chapter (the closing pages): no chapter is active from here. */
export const END = 35;

const lookbook = "Lookbook — model ";
const ALTS: (string | null)[] = [
  "Table of contents: 01 Biography, 02 Immersing Identity, 03 Play",
  "Table of contents: 04 Cairona, 05 Barraserb",
  `Biography. ${bio}`,
  "Tailor’s scissors and a spool of thread in the studio",
  "Immersing Identity — Sade. This project is built on identity: choosing a person to be the focal point of my designs, researching and delving into that personality, and turning it into a concept. I chose Sade Adu for her unique identity. My concept, “Quiet Fire”, represents a person whose strength comes from staying calm and controlled. Their rebellion isn’t loud or messy — it’s smart, intentional and full of emotion. It is about being strong without needing to show off: soft, confident and powerful in a quiet way, blending the formal, bold side of Sade’s identity with her soft, sleek side.",
  "Black and white reference portrait of Sade Adu holding a shard of mirror",
  "Mood board of Sade Adu performing, with three early dress illustrations",
  "Sketches of a corseted white shirt look and a black tailored look",
  "Final executed garment: front and back of a long black dress. Inspired by Sade Adu’s timeless, understated style — a sleek fitted silhouette, an open back and soft draped ruching at the waist. Elegance, confidence and subtle sensuality.",
  `${lookbook}in the long black dress against a green panelled wall beneath an ornate clock`,
  `${lookbook}in the black dress showing the open back, an ornate clock behind her`,
  `${lookbook}in the black dress under a crystal chandelier, hand resting on the draped waist`,
  `${lookbook}crouching on a wooden floor, the open back and drape of the dress in view`,
  `${lookbook}in the black dress lit by warm lamplight beside a vintage radio`,
  "Play — printed garments and an orange fringed bag on a rooftop washing line. A youthful extension of Carina with a playful identity: everyday basics transformed through bold patterns and expressive design. Play encourages individuality, with experimental styling and evolving collections.",
  "Mood board: colourful shoes, patterned fabrics and playful portraits",
  "Colour palette: lime, blue, butter yellow, velvet cherry, baby pink, deep red",
  "Fabric board: circle-print gabardine, striped lightweight poplin, polka-dot linen blend and blue chiffon",
  "Collection: five illustrated looks in stripes, circles and polka dots",
  "Final executed garment: the circle-print shirt and trousers beside technical flats and print swatches — a bold geometric print I designed and developed myself, with layered circular forms in contrasting tones, digitally printed onto chiffon.",
  `${lookbook}reclining on a gilded sofa in the circle-print chiffon set, holding an embroidered parasol`,
  `${lookbook}standing on a rooftop in the circle-print set, with an embroidered parasol`,
  `${lookbook}standing on a gilded sofa in the circle-print kimono and trousers`,
  `${lookbook}leaning back on the sofa, one arm raised, wearing the circle-print set`,
  `${lookbook}in an orange halter top and print trousers posing in a wooden doorway`,
  `${lookbook}crouching on a blue patterned rug in the orange top and print trousers`,
  "Cairona poster: the pyramids through an arch beside the Sagrada Família, with the logotype in Latin and Arabic. Cairona is a fashion brand born between Egypt and Spain, where heritage meets modern expression — blending Cairo’s rich cultural depth with Barcelona’s effortless street elegance. Est. 2026.",
  "Cairona colour palette: navy, pale blue, butter yellow, dark brown, olive and sage",
  "Capsule 1 tees in white, butter yellow and brown with Cairona graphics",
  "Capsule 1 hoodies and sweatshirts in black, brown and navy with Cairona graphics",
  "Stickers: round illustrated stickers and Cairona logotype stickers",
  "Packing paper mailer: a kraft envelope covered in Cairona stickers",
  "Barraserb. Barraserb (BRSRB) is an Egyptian/MENA streetwear brand founded in 2023 by Egyptian rapper Marwan Pablo and creative/stylist Xander Ghost, known for oversized silhouettes, graphic prints, Arabic typography, distorted graphics and deconstructed elements. I designed a series of T-shirts for them, following the brand identity.",
  "Designs: three Barraserb T-shirt designs, front and back, with Arabic typography",
  "THE H monogram in purple on a white page",
  "This portfolio is a collection of ideas, experiments, projects and moments of discovery throughout my journey in fashion. Each project reflects a different way of thinking, creating and seeing. As I continue to explore and evolve, I see every design as another step toward defining my own visual language. Thank you for stepping into my world. — Hanna Baher",
];

const pages: Page[] = [
  { kind: "cover" },
  ...ALTS.map((alt, i): Page =>
    alt === null ? { kind: "blank" } : { kind: "pdf", src: `/archive/pages/${String(i + 1).padStart(2, "0")}.webp`, alt },
  ),
  { kind: "back" },
];
const starts: Record<string, number> = Object.fromEntries(chapters.map((c) => [c.slug, c.start]));

// Even index = right-hand page (front of a leaf), odd = left (back).
console.assert(pages.length % 2 === 0, "book needs an even page count");
for (const c of chapters) console.assert(c.start % 2 === 1, `${c.slug} must open on a left page`);

export const book = { pages, starts };
