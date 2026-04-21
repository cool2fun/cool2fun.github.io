import { Game } from '@/data/games';

interface JsonLdProps {
  game: Game;
}

export default function JsonLd({ game }: JsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.name,
    description: `${game.desc}. Play ${game.name} unblocked for free on Cool2Fun!`,
    url: `https://cool2fun.github.io/${game.slug}/`,
    genre: game.cat,
    gamePlatform: 'Web Browser',
    applicationCategory: 'Game',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: '1500',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}