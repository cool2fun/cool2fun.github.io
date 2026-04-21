import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '.5rem 0', color: '#333' }}>Page Not Found</h2>
      <p>The game or page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="play-btn" style={{ maxWidth: '200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
        <i className="fas fa-home"></i> Back to Games
      </Link>
    </div>
  );
}
