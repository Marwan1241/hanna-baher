import Link from "next/link";

// shortcut: Hanna's handle isn't known yet, so this opens Instagram itself; set it to her profile URL when it is.
export const INSTAGRAM = "https://www.instagram.com/";

export default function Header() {
  return (
    <>
      <header className="site-header">
        <span className="label">Hanna Baher</span>
        <a className="label justify-self-end" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
          Contact
        </a>
      </header>
      {/* Outside the header so it stays brand purple instead of joining the header's difference blend. */}
      <Link href="/" aria-label="THE H — home" className="header-mark">
        <span className="mono-h" data-mark />
      </Link>
    </>
  );
}
