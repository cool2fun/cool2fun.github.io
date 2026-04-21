import styles from './AdFrame.module.css';

interface AdFrameProps {
  slot: 'autu' | '970-90';
  width?: string;
  height?: string;
}

const frameConfig: Record<string, { src: string; width: string; height: string }> = {
  autu: { src: '/ads/autu.html', width: '970px', height: '250px' },
  '970-90': { src: '/ads/970-90.html', width: '728px', height: '90px' },
};

export default function AdFrame({ slot, width, height }: AdFrameProps) {
  const cfg = frameConfig[slot] || { src: '/ads/autu.html', width: '970px', height: '250px' };
  return (
    <div className={`ad-slot ${styles.frameWrapper}`} style={{ width: width || cfg.width, height: height || cfg.height }}>
      <iframe
        src={cfg.src}
        width={cfg.width.replace('px', '')}
        height={cfg.height.replace('px', '')}
        style={{ border: 'none', display: 'block', margin: '0 auto' }}
        scrolling="no"
        title="Advertisement"
      />
    </div>
  );
}
