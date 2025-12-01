import { useRef, useCallback } from "react";

/**
 * Хук для throttle функции
 * @param callback - функция для throttle
 * @param delay - задержка в миллисекундах (по умолчанию 300ms)
 * @returns throttled функция
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRun = useRef<number>(Date.now());

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        return callback(...args);
      }
    }) as T,
    [callback, delay]
  );
}

