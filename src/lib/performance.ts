
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for debouncing values
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttling function calls
 * @param callback The function to throttle
 * @param delay The delay in milliseconds
 * @returns The throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const lastCall = useRef<number>(0);
  
  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        callback(...args);
        lastCall.current = now;
      }
    },
    [callback, delay]
  );
}

/**
 * Custom hook for intersection observer (lazy loading)
 * @param options IntersectionObserver options
 * @returns [ref, isIntersecting] tuple
 */
export function useIntersectionObserver<T extends Element>(
  options: IntersectionObserverInit = {
    threshold: 0,
    root: null,
    rootMargin: '0px',
  }
): [(node: T | null) => void, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const ref = useCallback(
    (node: T | null) => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }

      if (node) {
        observer.current = new IntersectionObserver(([entry]) => {
          setIsIntersecting(entry.isIntersecting);
        }, options);

        observer.current.observe(node);
      }
    },
    [options.threshold, options.root, options.rootMargin]
  );

  return [ref, isIntersecting];
}
