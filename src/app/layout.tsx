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
  openGraph: {
    title: 'Cool2Fun - Free Math Games',
    description: 'Hundreds of free unblocked games. Play instantly - no downloads!',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
