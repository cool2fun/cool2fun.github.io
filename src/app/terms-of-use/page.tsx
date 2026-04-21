import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use - Cool2Fun',
};

export default function TermsPage() {
  return (
    <div className="about-container">
      <div className="about-content">
        <h2>Terms of Use</h2>
        <p>By using Cool2Fun.github.io, you agree to the following terms:</p>
        <p>All games on this site are provided for entertainment purposes only. We do not host game files ourselves — all games are loaded from third-party sources. We are not responsible for the content or availability of external game providers.</p>
        <p>You may not use our website for any illegal purposes. All game content remains the property of their respective creators.</p>
        <p>Last updated: 2025</p>
      </div>
    </div>
  );
}
