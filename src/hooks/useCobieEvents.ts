import { useEffect, useRef, useState } from 'react';
import { COBIE_LOOP_MAP, COBIE_LOOP_COOLDOWNS_MS, type CobieTrigger } from '@/lib/figurines/cobieLoops';
import type { CobieLoopId } from '@/lib/figurines/cobieManifest';

type CobieEventDetail = {
  trigger: CobieTrigger;
  payload?: unknown;
};

type CobieEvent = CustomEvent<CobieEventDetail>;

export function useCobieEvents() {
  const [currentLoop, setCurrentLoop] = useState<CobieLoopId>(COBIE_LOOP_MAP.idle);
  const lastEventAtRef = useRef<Record<CobieTrigger, number>>({
    idle: 0,
    rug_pull: 0,
    achievement: 0,
    milestone: 0,
    disaster: 0,
    warning: 0,
    trade: 0,
  });

  useEffect(() => {
    const handler = (event: Event) => {
      const cobieEvent = event as CobieEvent;
      const detail = cobieEvent.detail;
      if (!detail?.trigger) return;

      const now = Date.now();
      const cooldown = COBIE_LOOP_COOLDOWNS_MS[detail.trigger] || 0;
      const last = lastEventAtRef.current[detail.trigger] || 0;
      if (now - last < cooldown) return;

      lastEventAtRef.current[detail.trigger] = now;
      setCurrentLoop(COBIE_LOOP_MAP[detail.trigger]);
    };

    window.addEventListener('cobie-event', handler as EventListener);
    return () => window.removeEventListener('cobie-event', handler as EventListener);
  }, []);

  return { currentLoop, setCurrentLoop };
}
