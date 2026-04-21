import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Cool2Fun',
};

export default function PrivacyPage() {
  return (
    <div className="about-container">
      <div className="about-content">
        <h2>Privacy Policy</h2>
        <p>Cool2Fun.github.io is committed to protecting your privacy. We use Google Analytics and Google AdSense to analyze traffic and display relevant advertisements.</p>
        <p>These services may collect information such as your IP address, browser type, and pages visited. This information is used to improve user experience and deliver targeted advertising.</p>
        <p>We do not collect or store personal information directly on our servers. By using our website, you agree to the data collection practices of Google Analytics and Google AdSense.</p>
        <p>Last updated: 2025</p>
      </div>
    </div>
  );
}
