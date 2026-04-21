import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact - Cool2fun.github.io',
  description: 'Contact Cool2fun Games - Get in touch with us for any questions or support.',
};

export default function ContactPage() {
  return (
    <div className="contact-container">
      <h2 style={{ marginBottom: '1rem', color: 'var(--primary)', fontWeight: 800 }}>Contact Us</h2>
      <div className="contact-form">
        <form id="contactForm">
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input type="text" id="subject" name="subject" required />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" required />
          </div>
          <button type="submit" className="submit-btn">Send Message</button>
        </form>
      </div>

      <div className="contact-info">
        <h3>Other Ways to Reach Us</h3>
        <p><i className="fas fa-envelope"></i> Email: support@cool2fun.com</p>
        <p><i className="fas fa-clock"></i> Response Time: Within 24-48 hours</p>
        <p><i className="fas fa-info-circle"></i> For fastest response, please include:</p>
        <ul>
          <li>Your username (if applicable)</li>
          <li>Game name (if reporting an issue)</li>
          <li>Detailed description of your inquiry</li>
        </ul>
      </div>
    </div>
  );
}
