import Link from 'next/link';
import Image from 'next/image';
import { Game } from '@/data/games';

interface GameCardProps {
  game: Game;
  sidebar?: boolean;
}

export default function GameCard({ game, sidebar = false }: GameCardProps) {
  return (
    <article className={`game-card${sidebar ? ' game-card--sidebar' : ''}`}>
      <Link href={`/${game.slug}`} aria-label={`Play ${game.name} unblocked`}>
        <div className="card-thumb">
          <img
            src={`/${game.slug}.png`}
            alt={`${game.name} unblocked`}
            width={sidebar ? 100 : 220}
            height={sidebar ? 70 : 150}
            loading="lazy"
          />
          <span className="card-badge">{game.cat[0]}</span>
        </div>
        <div className="card-body">
          <h3>{game.name}</h3>
          <p>{game.desc}</p>
          <span className="play-btn">
            <i className="fas fa-play"></i> Play Now
          </span>
        </div>
      </Link>
    </article>
  );
}