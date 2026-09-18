import type { TCRSDataResponse } from '../../../types';
import type { ParseRequest, ParseResponse } from './protocol';

interface PendingRequest {
  resolve: (data: TCRSDataResponse) => void;
  reject: (error: Error) => void;
}

export class TCRSWorkerClient {
  private readonly worker: Worker;
  private readonly pending = new Map<number, PendingRequest>();
  private nextRequestId = 1;

  constructor(worker?: Worker) {
    this.worker = worker ?? new Worker(new URL('./tcrs.worker.ts', import.meta.url), { type: 'module' });
    this.worker.addEventListener('message', ({ data }: MessageEvent<ParseResponse>) => {
      const request = this.pending.get(data.requestId);
      if (!request) return;
      this.pending.delete(data.requestId);
      if (data.type === 'success') request.resolve(data.data);
      else request.reject(new Error(data.message));
    });
  }

  load(className: string, moonSign: string, signal?: AbortSignal): Promise<TCRSDataResponse> {
    const requestId = this.nextRequestId++;
    return new Promise((resolve, reject) => {
      const abort = () => {
        this.pending.delete(requestId);
        reject(new DOMException('The request was cancelled.', 'AbortError'));
      };
      if (signal?.aborted) return abort();
      signal?.addEventListener('abort', abort, { once: true });
      this.pending.set(requestId, {
        resolve: (data) => {
          signal?.removeEventListener('abort', abort);
          resolve(data);
        },
        reject: (error) => {
          signal?.removeEventListener('abort', abort);
          reject(error);
        },
      });
      const request: ParseRequest = {
        type: 'parse',
        requestId,
        className,
        moonSign,
        baseUrl: import.meta.env.BASE_URL,
      };
      this.worker.postMessage(request);
    });
  }

  dispose(): void {
    this.worker.terminate();
    for (const { reject } of this.pending.values()) reject(new Error('Worker was disposed.'));
    this.pending.clear();
  }
}
