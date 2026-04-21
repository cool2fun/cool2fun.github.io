import { games } from '@/data/games';
import GameGrid from '@/components/GameGrid';
import AdSlot from '@/components/AdSlot';
import styles from './home.module.css';

export default function HomePage() {
  return (
    <>
      <div className={styles.adTop}>
        <AdSlot size="970x250" />
      </div>
      <GameGrid games={games} title="Unblocked" />
      <div className={styles.adBottom}>
        <AdSlot size="728x90" />
      </div>
      <div className="site-desc">
        <p>
          Cool2Fun.github.io is your #1 destination for free unblocked games that work at school or work.
          Hundreds of HTML5 browser games — action, adventure, puzzle, racing, sports and more.
          School-friendly, instant play, no downloads. New games added weekly!
        </p>
      </div>
    </>
  );
}