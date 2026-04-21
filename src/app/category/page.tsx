'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { games, getGamesByCategory } from '@/data/games';
import GameGrid from '@/components/GameGrid';

function CategoryContent() {
  const searchParams = useSearchParams();
  const cat = searchParams.get('cat') || '';
  const filtered = cat ? getGamesByCategory(cat) : games;
  const title = cat ? `${cat} Games` : 'All Unblocked Games';

  return <GameGrid games={filtered} title={title} />;
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <CategoryContent />
    </Suspense>
  );
}