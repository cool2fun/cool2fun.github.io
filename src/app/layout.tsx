import type { Metadata } from 'next';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Cool2Fun - Free Unblocked Games | Play Online',
    template: '%s | Cool2Fun',
  },
  description: 'Hundreds of free unblocked games. Play action, racing, puzzle, adventure games instantly in your browser. No downloads needed!',
  keywords: ['unblocked games', 'free games', 'online games', 'HTML5 games', 'action games', 'racing games', 'puzzle games'],
  openGraph: {
    title: 'Cool2Fun - Free Unblocked Games',
    description: 'Hundreds of free unblocked games. Play instantly - no downloads!',
    type: 'website',
    siteName: 'Cool2Fun',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://cool2fun.github.io/',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cool2Fun',
    url: 'https://cool2fun.github.io/',
    description: 'Free unblocked games playable in any browser.',
    inLanguage: 'en',
    isAccessibleForFree: true,
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script
          src="https://www.googletagmanager.com/gtag/js?id=G-EKC7L9377Q"
          async
        />
        <Script id="ga-config" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-EKC7L9377Q');`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
