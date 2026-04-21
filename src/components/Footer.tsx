import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-links">
          <Link href="/about-us">About Us</Link>
          <Link href="/terms-of-use">Terms of Use</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div className="copyright">&copy; 2025 Cool2Fun.github.io &mdash; All games free to play.</div>
      </div>
    </footer>
  );
}