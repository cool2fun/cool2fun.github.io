'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdSlotProps {
  size: '970x250' | '728x90' | '300x250';
}

const adConfig: Record<string, { client: string; slot: string; width: string; height: string }> = {
  '970x250': {
    client: 'ca-pub-6556788076088846',
    slot: '7979200749',
    width: '970',
    height: '250',
  },
  '300x250': {
    client: 'ca-pub-6556788076088846',
    slot: '9406916186',
    width: '300',
    height: '250',
  },
  '728x90': {
    client: 'ca-pub-6556788076088846',
    slot: '5424355442',
    width: '728',
    height: '90',
  },
};

export default function AdSlot({ size }: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const cfg = adConfig[size];
    if (!cfg) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6556788076088846';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (!ref.current) return;
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.cssText = `display:inline-block;width:${cfg.width}px;height:${cfg.height}px`;
      ins.dataset.adClient = cfg.client;
      ins.dataset.adSlot = cfg.slot;
      ref.current.appendChild(ins);
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // ignore
      }
    };
    document.head.appendChild(script);
  }, [size]);

  return (
    <div className="ad-slot" style={{ width: adConfig[size]?.width + 'px' }} ref={ref}>
    </div>
  );
}
