/**
 * Async utility functions for handling promises, delays, and retries
 */

/**
 * Sleep for a specified number of milliseconds
 * @param ms - Number of milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry an async operation with exponential backoff
 * @param fn - The async function to retry
 * @param options - Retry configuration
 * @returns Promise that resolves with the function result or rejects after max attempts
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        break;
      }

      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
};

/**
 * Execute multiple async operations with a concurrency limit
 * @param items - Array of items to process
 * @param asyncFn - Async function to apply to each item
 * @param concurrency - Maximum number of concurrent operations
 * @returns Promise that resolves with array of results
 */
export const asyncPool = async <T, R>(
  items: T[],
  asyncFn: (item: T) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> => {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const [index, item] of items.entries()) {
    const promise = asyncFn(item).then(result => {
      results[index] = result;
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      for (let i = executing.length - 1; i >= 0; i--) {
        const p = executing[i];
        if (await Promise.race([p, Promise.resolve('pending')]) !== 'pending') {
          executing.splice(i, 1);
        }
      }
    }
  }

  await Promise.all(executing);
  return results;
};

/**
 * Race multiple promises with a timeout
 * @param promises - Array of promises to race
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that resolves with the first successful result or rejects on timeout
 */
export const raceWithTimeout = async <T>(
  promises: Promise<T>[],
  timeoutMs: number
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([...promises, timeoutPromise]);
};

/**
 * Debounce an async function
 * @param fn - The async function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounceAsync = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  delay: number
): ((...args: T) => Promise<R>) => {
  let timeoutId: NodeJS.Timeout;
  let latestResolve: (value: R) => void;
  let latestReject: (error: Error) => void;

  return (...args: T): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      latestResolve = resolve;
      latestReject = reject;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          latestResolve(result);
        } catch (error) {
          latestReject(error as Error);
        }
      }, delay);
    });
  };
};