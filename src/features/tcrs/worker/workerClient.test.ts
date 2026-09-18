import { describe, expect, it, vi } from 'vitest';

import type { ParseResponse } from './protocol';
import { TCRSWorkerClient } from './workerClient';

class FakeWorker {
  private listener?: (event: MessageEvent<ParseResponse>) => void;
  readonly postMessage = vi.fn();
  readonly terminate = vi.fn();

  addEventListener(_type: string, listener: (event: MessageEvent<ParseResponse>) => void): void {
    this.listener = listener;
  }

  respond(response: ParseResponse): void {
    this.listener?.({ data: response } as MessageEvent<ParseResponse>);
  }
}

describe('TCRS worker client', () => {
  it('cancels stale requests and ignores their later responses', async () => {
    const worker = new FakeWorker();
    const client = new TCRSWorkerClient(worker as unknown as Worker);
    const controller = new AbortController();
    const pending = client.load('Seal_Clubber', 'Mongoose', controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });

    worker.respond({
      type: 'error',
      requestId: 1,
      message: 'This stale response must be ignored.',
    });
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    client.dispose();
  });
});
