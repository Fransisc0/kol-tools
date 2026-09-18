import type { TCRSDataResponse } from '../../../types';

export interface ParseRequest {
  type: 'parse';
  requestId: number;
  className: string;
  moonSign: string;
  baseUrl: string;
}

export type ParseResponse =
  | { type: 'success'; requestId: number; data: TCRSDataResponse }
  | { type: 'error'; requestId: number; message: string };
