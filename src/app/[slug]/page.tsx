import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getGameBySlug, games, getRelatedGames } from '@/data/games';
import { generateSpinContent } from '@/lib/content';
import GameClient from './GameClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return { title: 'Game Not Found' };
  return {
    title: `${game.name} Unblocked - Play Free on Cool2Fun`,
    description: `Play ${game.name} unblocked online for free. ${game.desc}. No downloads needed!`,
    openGraph: {
      title: `${game.name} Unblocked - Cool2Fun`,
      description: game.desc,
    },
  };
}

export async function generateStaticParams() {
  return games.map(g => ({ slug: g.slug }));
}

export default async function GamePage({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const related = getRelatedGames(slug, 8);
  const spinContent = generateSpinContent(game);

  return <GameClient game={game} related={related} spinContent={spinContent} />;
}
