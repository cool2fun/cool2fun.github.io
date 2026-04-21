'use client';

import { useState } from 'react';
import GameCard from './GameCard';
import { Game } from '@/data/games';

interface GameGridProps {
  games: Game[];
  title?: string;
}

export default function GameGrid({ games, title }: GameGridProps) {
  const [query, setQuery] = useState('');

  const filtered = query
    ? games.filter(g => g.name.toLowerCase().includes(query.toLowerCase()))
    : games;

  return (
    <section aria-labelledby="games-heading">
      <div className="section-head">
        <h1 id="games-heading">
          {title ? title : '🎮 '}<span>{title ? '' : 'Unblocked'}</span> Games
        </h1>
      </div>
      <div className="game-grid" role="list">
        {filtered.length > 0
          ? filtered.map(g => <GameCard key={g.slug} game={g} />)
          : <p className="no-games">No games found.</p>
        }
      </div>
    </section>
  );
}
