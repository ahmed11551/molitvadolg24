// Хук для оптимизации производительности
// Предзагрузка компонентов, мемоизация, debounce

import { useCallback, useRef, useEffect, useState } from "react";

/**
 * Throttle hook для ограничения частоты вызовов
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: any[]) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Preload компонента для быстрой загрузки
 */
export function usePreloadComponent(importFn: () => Promise<any>) {
  const preloadedRef = useRef(false);

  useEffect(() => {
    if (!preloadedRef.current) {
      // Предзагружаем компонент в фоне
      importFn().catch(() => {
        // Игнорируем ошибки предзагрузки
      });
      preloadedRef.current = true;
    }
  }, [importFn]);
}

/**
 * Оптимизированный useEffect с проверкой изменений
 */
export function useOptimizedEffect(
  effect: () => void | (() => void),
  deps: any[],
  options?: { skipFirst?: boolean }
) {
  const isFirstRun = useRef(true);
  const prevDeps = useRef(deps);

  useEffect(() => {
    if (options?.skipFirst && isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    // Проверяем, действительно ли зависимости изменились
    const hasChanged = deps.some(
      (dep, index) => dep !== prevDeps.current[index]
    );

    if (hasChanged || isFirstRun.current) {
      const cleanup = effect();
      prevDeps.current = deps;
      isFirstRun.current = false;
      return cleanup;
    }
  }, deps);
}

