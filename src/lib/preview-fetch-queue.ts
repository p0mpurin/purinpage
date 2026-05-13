/**
 * Limits concurrent /api/link-preview calls so Windows/OS DNS and Node don't get hammered
 * when many cards enter the viewport at once.
 */
const MAX_CONCURRENT = 3;
let active = 0;
const waitQueue: Array<() => void> = [];

function pump(): void {
  while (active < MAX_CONCURRENT && waitQueue.length > 0) {
    const start = waitQueue.shift();
    if (start) start();
  }
}

/** Run `task` when a slot is free; returns when `task` completes. */
export function runLinkPreviewSlot<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    waitQueue.push(() => {
      active++;
      void (async () => {
        try {
          const out = await task();
          resolve(out);
        } catch (e) {
          reject(e);
        } finally {
          active--;
          pump();
        }
      })();
    });
    pump();
  });
}
