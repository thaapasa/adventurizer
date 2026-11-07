import { useEffect } from 'react';

/** Calls `poll` every few seconds while `active` is true. */
export function usePoll(active: boolean, poll: () => void, intervalMs = 3000) {
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(poll, intervalMs);
    return () => clearInterval(timer);
  }, [active, poll, intervalMs]);
}
