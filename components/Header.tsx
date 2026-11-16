import Link from "next/link";

export const EMAIL = "hannabaherr@gmail.com";

export default function Header() {
  return (
    <header className="site-header">
      <span className="label">Hanna Baher</span>
      <Link href="/" aria-label="THE H — home" className="header-mark">
        <span className="mono-h" data-mark />
      </Link>
      <a className="label justify-self-end" href={`mailto:${EMAIL}`}>
        Contact
      </a>
    </header>
  );
}
