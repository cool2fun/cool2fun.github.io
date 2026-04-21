'use client';

import Link from 'next/link';
import { Game } from '@/data/games';
import GameCard from '@/components/GameCard';
import AdSlot from '@/components/AdSlot';
import AdFrame from '@/components/AdFrame';
import styles from './game.module.css';

interface GameClientProps {
  game: Game;
  related: Game[];
  spinContent: string;
}

export default function GameClient({ game, related, spinContent }: GameClientProps) {
  return (
    <>
      <AdFrame slot="970-90" />
      <div className="game-layout">
        <div>
          <div id="gameWrapper">
            <iframe
              id="gameFrame"
              src={game.src}
              allow="fullscreen"
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
            />
          </div>
          <div className="game-controls-bar">
            <div id="gameCats">
              {game.cat.map(c => (
                <Link key={c} href={`/category?cat=${c}`} className="cat-tag">{c}</Link>
              ))}
            </div>
            <button id="fullscreenBtn" onClick={() => {
              const el = document.getElementById('gameWrapper') as HTMLElement & { webkitRequestFullscreen?: () => void };
              if (!document.fullscreenElement) {
                el?.requestFullscreen?.();
              } else {
                document.exitFullscreen?.();
              }
            }}>
              <i className="fas fa-expand"></i> Fullscreen
            </button>
          </div>
          <AdSlot size="970x250" />
          <div className="game-info-box">
            <h2>{game.name} Unblocked</h2>
            <p>{game.desc}. Play instantly in your browser — no downloads, no installs!</p>
            <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#555' }}>{spinContent}</p>
          </div>
        </div>
        <aside>
          <AdSlot size="300x250" />
          <div className="sidebar-panel">
            <h3>More Games</h3>
            <div id="otherGamesList">
              {related.map(g => <GameCard key={g.slug} game={g} sidebar />)}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
