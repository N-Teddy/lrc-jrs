import { useCallback, useEffect, useState } from 'react';

/**
 * Format total seconds into a mm:ss display string.
 */
function formatTimerMinutes(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface UseCountdownTimerOptions {
  initialSeconds: number;
}

export interface UseCountdownTimerReturn {
  secondsRemaining: number;
  formattedTime: string;
  isExpired: boolean;
  resetTimer: (overrideSeconds?: number) => void;
}

export function useCountdownTimer({
  initialSeconds,
}: UseCountdownTimerOptions): UseCountdownTimerReturn {
  const [secondsRemaining, setSecondsRemaining] =
    useState<number>(initialSeconds);

  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const resetTimer = useCallback(
    (overrideSeconds?: number) => {
      setSecondsRemaining(overrideSeconds ?? initialSeconds);
    },
    [initialSeconds],
  );

  return {
    secondsRemaining,
    formattedTime: formatTimerMinutes(secondsRemaining),
    isExpired: secondsRemaining <= 0,
    resetTimer,
  };
}
