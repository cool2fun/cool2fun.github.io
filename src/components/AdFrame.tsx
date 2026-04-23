import styles from './AdFrame.module.css';

interface AdFrameProps {
  slot: 'autu' | '970-90';
  width?: string;
  height?: string;
}

const frameConfig: Record<string, { src: string; width: string; height: string }> = {
  autu: { src: '/autu.html', width: '970px', height: '250px' },
  '970-90': { src: '/970-90.html', width: '728px', height: '90px' },
  'ads-g-3-6': { src: '/ads-g-3-6.html', width: '300px', height: '250px' },
  'ads-970-9': { src: '/ads-970-9.html', width: '970px', height: '90px' },
};

export default function AdFrame({ slot, width, height }: AdFrameProps) {
  const cfg = frameConfig[slot] || { src: '/autu.html', width: '970px', height: '250px' };
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
