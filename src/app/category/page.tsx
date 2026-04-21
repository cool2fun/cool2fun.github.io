import { Suspense } from 'react';
import type { Metadata } from 'next';
import { games, getGamesByCategory } from '@/data/games';
import GameGrid from '@/components/GameGrid';
import styles from './category.module.css';

interface PageProps {
  searchParams: Promise<{ cat?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { cat } = await searchParams;
  if (cat) {
    return {
      title: `${cat} Games Unblocked - Cool2Fun`,
      description: `Play free ${cat} unblocked games on Cool2Fun. No downloads!`,
    };
  }
  return { title: 'All Games - Cool2Fun' };
}

export default async function CategoryPage({ searchParams }: PageProps) {
  const { cat } = await searchParams;
  const filtered = cat ? getGamesByCategory(cat) : games;
  const title = cat ? `${cat} Games` : 'All Unblocked Games';

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameGrid games={filtered} title={title} />
    </Suspense>
  );
}
