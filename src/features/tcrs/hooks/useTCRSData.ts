import { useState, useEffect, useCallback } from 'react';
import type { TCRSDataResponse } from '../../../types';
import { TCRSWorkerClient } from '../worker/workerClient';

const workerClient = new TCRSWorkerClient();

export function useTCRSData(selectedClass: string, selectedSign: string) {
  const [data, setData] = useState<TCRSDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingSlow, setIsProcessingSlow] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const retry = useCallback(() => {
    setFetchTrigger((c) => c + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();
    const slowTimer = window.setTimeout(() => {
      if (!isCancelled) setIsProcessingSlow(true);
    }, 2_000);
    setLoading(true);
    setError(null);
    setIsProcessingSlow(false);

    workerClient
      .load(selectedClass, selectedSign, controller.signal)
      .then((json) => {
        if (!isCancelled) {
          setData(json);
          setLoading(false);
          setIsProcessingSlow(false);
        }
      })
      .catch((err) => {
        if (!isCancelled && err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to load TCRS dataset. Please check your connection and try again.');
          setLoading(false);
          setIsProcessingSlow(false);
        }
      });
    return () => {
      isCancelled = true;
      controller.abort();
      window.clearTimeout(slowTimer);
    };
  }, [selectedClass, selectedSign, fetchTrigger]);

  return { data, loading, error, isProcessingSlow, retry };
}
