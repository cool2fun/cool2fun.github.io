import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Cool2Fun',
  description: 'Learn more about Cool2Fun Games - Your favorite destination for free online games.',
};

export default function AboutUsPage() {
  return (
    <div className="about-container">
      <div className="about-content">
        <div className="about-section">
          <h2>About Cool2Fun Games</h2>
          <p>Welcome to Cool2Fun Games, your premier destination for free online gaming entertainment. Since our establishment, we&apos;ve been dedicated to providing high-quality, accessible gaming experiences to players around the world.</p>
        </div>

        <div className="about-section">
          <h3>Our Mission</h3>
          <p>Our mission is to make gaming accessible to everyone by providing a wide variety of free, high-quality games that can be played directly in your browser. We believe that great gaming experiences should be available to all, regardless of their device or location.</p>
        </div>

        <div className="about-section">
          <h3>What Makes Us Special</h3>
          <div className="features-grid">
            <div className="feature-card">
              <i className="fas fa-globe"></i>
              <h4>Free Access</h4>
              <p>All our games are completely free to play, with no hidden costs or subscriptions required.</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-gamepad"></i>
              <h4>Diverse Collection</h4>
              <p>From action to puzzle games, we offer something for every type of player.</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-bolt"></i>
              <h4>Instant Play</h4>
              <p>No downloads needed - play immediately in your browser.</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-shield-alt"></i>
              <h4>Safe Gaming</h4>
              <p>All games are thoroughly tested for safety and appropriate content.</p>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h3>Our Impact</h3>
          <div className="stats">
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Games Available</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1M+</div>
              <div className="stat-label">Monthly Players</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">Countries Reached</div>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h3>Looking Forward</h3>
          <p>We&apos;re constantly working to expand our game library and improve our platform. Our team is dedicated to bringing you the latest and greatest in online gaming entertainment, while maintaining our commitment to providing free, accessible content to all our users.</p>
        </div>
      </div>
    </div>
  );
}
