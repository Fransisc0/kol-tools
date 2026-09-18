import { useState, useEffect, useCallback } from 'react';
import { TCRSDataResponse } from '../types';

export function useTCRSData(selectedClass: string, selectedSign: string) {
  const [data, setData] = useState<TCRSDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isColdStart, setIsColdStart] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const retry = useCallback(() => {
    setFetchTrigger((c) => c + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();
    const coldStartTimer = window.setTimeout(() => {
      if (!isCancelled) setIsColdStart(true);
    }, 8_000);
    setLoading(true);
    setError(null);
    setIsColdStart(false);

    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    const url = `${apiBaseUrl}/api/tcrs?class=${encodeURIComponent(selectedClass)}&sign=${encodeURIComponent(selectedSign)}`;
    fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json: TCRSDataResponse) => {
        if (!isCancelled) {
          setData(json);
          setLoading(false);
          setIsColdStart(false);
        }
      })
      .catch((err) => {
        if (!isCancelled && err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to load TCRS data:', err);
          setError('Failed to load TCRS dataset. Please check your connection and try again.');
          setLoading(false);
          setIsColdStart(false);
        }
      });
    return () => {
      isCancelled = true;
      controller.abort();
      window.clearTimeout(coldStartTimer);
    };
  }, [selectedClass, selectedSign, fetchTrigger]);

  return { data, loading, error, isColdStart, retry };
}
