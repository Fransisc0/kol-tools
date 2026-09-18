/** Bounds expensive asynchronous work while preserving FIFO ordering. */
export class AsyncGate {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly concurrency: number) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new Error('concurrency must be a positive integer');
    }
  }

  run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = (): void => {
        this.active += 1;
        task()
          .then(resolve, reject)
          .finally(() => {
            this.active -= 1;
            this.queue.shift()?.();
          });
      };

      if (this.active < this.concurrency) execute();
      else this.queue.push(execute);
    });
  }

  get activeCount(): number {
    return this.active;
  }
}
