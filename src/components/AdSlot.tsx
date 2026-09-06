import React, { useEffect, useState } from 'react';
import { AdSlot as AdSlotType } from '../types';
import { fetchAdSlots } from '../lib/api';

interface AdSlotProps {
  placement: string;
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ placement, className = '' }) => {
  const [ad, setAd] = useState<AdSlotType | null>(null);

  useEffect(() => {
    fetchAdSlots()
      .then((ads: AdSlotType[]) => {
        const found = ads.find((a) => a.placement === placement && a.enabled);
        if (found) {
          setAd(found);
        }
      })
      .catch(() => {});
  }, [placement]);

  if (!ad || !ad.enabled) {
    return null;
  }

  return (
    <aside
      aria-label={`Sponsored placement ${placement}`}
      className={`my-4 p-3 rounded-lg border border-neutral-800 bg-neutral-900/50 text-center text-xs text-neutral-400 ${className}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 font-mono">
        Sponsorship / Advertisement
      </div>
      {ad.code ? (
        <div dangerouslySetInnerHTML={{ __html: ad.code }} />
      ) : (
        <div className="py-4 text-neutral-400">
          <p className="font-medium text-neutral-300">{ad.name}</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Partner integration slot ({ad.provider})</p>
        </div>
      )}
    </aside>
  );
};
